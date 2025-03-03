// app/(modals)/sync-manager.tsx
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from "react-native";
import { Stack, useRouter, router } from "expo-router";
import { useNetInfo } from "@react-native-community/netinfo";
import { SyncService } from "@/services/syncService";
import { GoogleDriveService } from "@/services/googleDriveService";
import { getSyncStatus } from "@/services/sheetService";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

interface SyncResult {
  timestamp: string;
  success: boolean;
  itemsProcessed: number;
  itemsSucceeded: number;
  itemsFailed: number;
  errors: string[];
}

export default function SyncManagerScreen() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncHistory, setSyncHistory] = useState<SyncResult[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [localFiles, setLocalFiles] = useState<any[]>([]);
  const netInfo = useNetInfo();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setRefreshing(true);

      // Load sync status
      const status = await getSyncStatus();
      setPendingCount(status.pendingCount);
      setIsProcessing(status.isProcessing);

      // Load sync history
      const history = await SyncService.getSyncHistory();
      setSyncHistory(history);

      // Load local files
      const files = await GoogleDriveService.listLocalFiles();
      setLocalFiles(files);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSyncPress = async () => {
    if (isSyncing) return;

    try {
      setIsSyncing(true);
      const result = await SyncService.forceSync();
      if (result) {
        alert(
          result.success
            ? "Sync completed successfully"
            : `Sync completed with ${result.itemsFailed} failures`
        );
      } else {
        alert("No items to sync");
      }
    } catch (error) {
      console.error("Error syncing:", error);
      alert("Error starting sync operation");
    } finally {
      setIsSyncing(false);
      await loadData();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Sync Manager",
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={{ paddingHorizontal: 15, paddingVertical: 10 }}
            >
              <Text style={{ color: "#007AFF", fontSize: 16 }}>Back</Text>
            </Pressable>
          ),
        }}
      />
      <SafeAreaView style={styles.container}>
        <RefreshControl refreshing={refreshing} onRefresh={loadData} />

        <ThemedView style={styles.statusCard}>
          <ThemedText style={styles.statusTitle}>Sync Status</ThemedText>

          <View style={styles.statusRow}>
            <ThemedText>Network Status:</ThemedText>
            <View style={styles.statusValueContainer}>
              <View
                style={[
                  styles.networkIndicator,
                  {
                    backgroundColor: netInfo.isConnected
                      ? "#34D399"
                      : "#F87171",
                  },
                ]}
              />
              <ThemedText>
                {netInfo.isConnected ? "Connected" : "Disconnected"}
              </ThemedText>
            </View>
          </View>

          <View style={styles.statusRow}>
            <ThemedText>Pending Changes:</ThemedText>
            <ThemedText style={styles.statusValue}>
              {pendingCount} {pendingCount === 1 ? "item" : "items"}
            </ThemedText>
          </View>

          <View style={styles.statusRow}>
            <ThemedText>Sync Status:</ThemedText>
            <ThemedText style={styles.statusValue}>
              {isProcessing ? "In Progress" : "Idle"}
            </ThemedText>
          </View>

          <Pressable
            style={[
              styles.syncButton,
              (!netInfo.isConnected || isSyncing || pendingCount === 0) &&
                styles.syncButtonDisabled,
            ]}
            disabled={!netInfo.isConnected || isSyncing || pendingCount === 0}
            onPress={handleSyncPress}
          >
            {isSyncing ? (
              <View style={styles.syncingContainer}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <ThemedText style={[styles.syncButtonText, { marginLeft: 8 }]}>
                  Syncing...
                </ThemedText>
              </View>
            ) : (
              <ThemedText style={styles.syncButtonText}>Sync Now</ThemedText>
            )}
          </Pressable>

          {localFiles.length > 0 && (
            <ThemedText style={styles.localFileTitle}>
              Local Files ({localFiles.length})
            </ThemedText>
          )}
        </ThemedView>

        {localFiles.length > 0 && (
          <FlatList
            data={localFiles}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ThemedView style={styles.fileItem}>
                <ThemedText style={styles.fileName}>{item.name}</ThemedText>
                <ThemedText style={styles.fileDetails}>
                  Last Downloaded:{" "}
                  {new Date(item.lastDownloaded).toLocaleDateString()}
                </ThemedText>
              </ThemedView>
            )}
            contentContainerStyle={styles.fileList}
          />
        )}

        {syncHistory.length > 0 && (
          <>
            <ThemedText style={styles.historyTitle}>Sync History</ThemedText>
            <FlatList
              data={syncHistory}
              keyExtractor={(item, index) => `sync-${index}-${item.timestamp}`}
              renderItem={({ item }) => (
                <ThemedView
                  style={[
                    styles.historyItem,
                    { borderLeftColor: item.success ? "#34D399" : "#F87171" },
                  ]}
                >
                  <ThemedText style={styles.historyTimestamp}>
                    {formatDate(item.timestamp)}
                  </ThemedText>
                  <ThemedText style={styles.historyStatus}>
                    {item.success ? "Success" : "Failed"}
                  </ThemedText>
                  <ThemedText>
                    {item.itemsSucceeded}/{item.itemsProcessed} items processed
                  </ThemedText>

                  {item.errors.length > 0 && (
                    <View style={styles.errorsContainer}>
                      <ThemedText style={styles.errorsTitle}>
                        Errors:
                      </ThemedText>
                      {item.errors.map((error, i) => (
                        <ThemedText key={i} style={styles.errorText}>
                          • {error}
                        </ThemedText>
                      ))}
                    </View>
                  )}
                </ThemedView>
              )}
              contentContainerStyle={styles.historyList}
            />
          </>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusValue: {
    fontWeight: "500",
  },
  networkIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  syncButton: {
    backgroundColor: "#0A7EA4",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  syncButtonDisabled: {
    opacity: 0.5,
  },
  syncButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    textAlign: "center",
  },
  syncingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  localFileTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 24,
    marginBottom: 8,
  },
  fileList: {
    paddingBottom: 16,
  },
  fileItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  fileName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  fileDetails: {
    fontSize: 14,
    color: "#64748B",
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 12,
  },
  historyList: {
    paddingBottom: 24,
  },
  historyItem: {
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  historyTimestamp: {
    color: "#64748B",
    fontSize: 14,
    marginBottom: 4,
  },
  historyStatus: {
    fontWeight: "600",
    marginBottom: 4,
  },
  errorsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  errorsTitle: {
    fontWeight: "500",
    marginBottom: 4,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    marginLeft: 8,
    marginBottom: 2,
  },
});
