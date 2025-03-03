// app/(tabs)/sync.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useNetInfo } from "@react-native-community/netinfo";
import { SyncService } from "@/services/syncService";
import { getSyncStatus } from "@/services/sheetService";
import { GoogleDriveService } from "@/services/googleDriveService";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

export default function SyncScreen() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [syncHistory, setSyncHistory] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const netInfo = useNetInfo();
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setRefreshing(true);

      const status = await getSyncStatus();
      setPendingCount(status.pendingCount);
      setIsProcessing(status.isProcessing);

      const history = await SyncService.getSyncHistory();
      setSyncHistory(history.slice(0, 3)); // Get just the 3 most recent entries
    } catch (error) {
      console.error("Error loading sync data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSyncPress = async () => {
    if (isSyncing) return;

    try {
      setIsSyncing(true);
      await SyncService.forceSync();
    } catch (error) {
      console.error("Error forcing sync:", error);
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
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Synchronization",
          headerShown: true,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadData} />
        }
      >
        <ThemedView style={styles.statusCard}>
          <ThemedText style={styles.sectionTitle}>Sync Status</ThemedText>

          <View style={styles.infoRow}>
            <ThemedText>Network:</ThemedText>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusIndicator,
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

          <View style={styles.infoRow}>
            <ThemedText>Pending uploads:</ThemedText>
            <ThemedText style={styles.infoValue}>
              {pendingCount} {pendingCount === 1 ? "item" : "items"}
            </ThemedText>
          </View>

          <View style={styles.infoRow}>
            <ThemedText>Status:</ThemedText>
            <ThemedText style={styles.infoValue}>
              {isProcessing ? "Synchronizing..." : "Idle"}
            </ThemedText>
          </View>

          <View style={styles.buttonContainer}>
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
                <View style={styles.buttonContent}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <ThemedText style={[styles.buttonText, { marginLeft: 8 }]}>
                    Syncing...
                  </ThemedText>
                </View>
              ) : (
                <ThemedText style={styles.buttonText}>Sync Now</ThemedText>
              )}
            </Pressable>

            <Pressable
              style={styles.managerButton}
              onPress={() => router.push("/(modals)/sync-manager")}
            >
              <ThemedText style={styles.managerButtonText}>
                Sync Manager
              </ThemedText>
            </Pressable>
          </View>
        </ThemedView>

        {syncHistory.length > 0 && (
          <ThemedView style={styles.historyCard}>
            <ThemedText style={styles.sectionTitle}>
              Recent Sync Activity
            </ThemedText>

            {syncHistory.map((item, index) => (
              <ThemedView
                key={index}
                style={[
                  styles.historyItem,
                  { borderLeftColor: item.success ? "#34D399" : "#F87171" },
                ]}
              >
                <ThemedText style={styles.timestamp}>
                  {formatDate(item.timestamp)}
                </ThemedText>
                <ThemedText style={styles.status}>
                  {item.success ? "Success" : "Failed"}
                </ThemedText>
                <ThemedText style={styles.details}>
                  {item.itemsSucceeded}/{item.itemsProcessed} items processed
                </ThemedText>

                {item.errors.length > 0 && (
                  <View style={styles.errorContainer}>
                    <ThemedText style={styles.errorTitle}>Errors:</ThemedText>
                    {item.errors
                      .slice(0, 2)
                      .map(
                        (
                          error:
                            | string
                            | number
                            | boolean
                            | React.ReactElement<
                                any,
                                string | React.JSXElementConstructor<any>
                              >
                            | Iterable<React.ReactNode>
                            | React.ReactPortal
                            | null
                            | undefined,
                          i: React.Key | null | undefined
                        ) => (
                          <ThemedText key={i} style={styles.errorText}>
                            • {error}
                          </ThemedText>
                        )
                      )}
                    {item.errors.length > 2 && (
                      <ThemedText style={styles.errorText}>
                        • And {item.errors.length - 2} more...
                      </ThemedText>
                    )}
                  </View>
                )}
              </ThemedView>
            ))}

            <Pressable
              style={styles.viewAllButton}
              onPress={() => router.push("/(modals)/sync-manager")}
            >
              <ThemedText style={styles.viewAllText}>
                View Full History
              </ThemedText>
            </Pressable>
          </ThemedView>
        )}

        <ThemedView style={styles.helpCard}>
          <ThemedText style={styles.sectionTitle}>How Sync Works</ThemedText>
          <ThemedText style={styles.helpText}>
            • Changes made while offline are saved locally
          </ThemedText>
          <ThemedText style={styles.helpText}>
            • When online, data is automatically synced to Google Drive
          </ThemedText>
          <ThemedText style={styles.helpText}>
            • Sync happens automatically when connectivity is restored
          </ThemedText>
          <ThemedText style={styles.helpText}>
            • Use "Sync Now" to force an immediate upload attempt
          </ThemedText>
        </ThemedView>
      </ScrollView>

      {/* Show a floating activity indicator when sync is in progress */}
      {isProcessing && (
        <View style={styles.syncingOverlay}>
          <View style={styles.syncingIndicator}>
            <ActivityIndicator size="large" color="#0A7EA4" />
            <ThemedText style={styles.syncingText}>
              Syncing changes...
            </ThemedText>
          </View>
        </View>
      )}

      {/* Styles */}
      <View style={styles.bottomSpacer} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statusCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  infoValue: {
    fontWeight: "500",
  },
  buttonContainer: {
    marginTop: 16,
  },
  syncButton: {
    backgroundColor: "#0A7EA4",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  syncButtonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  managerButton: {
    borderWidth: 1,
    borderColor: "#0A7EA4",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  managerButtonText: {
    color: "#0A7EA4",
    fontWeight: "500",
  },
  historyCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  historyItem: {
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 6,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  timestamp: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 4,
  },
  status: {
    fontWeight: "600",
    marginBottom: 4,
  },
  details: {
    fontSize: 14,
  },
  errorContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  errorTitle: {
    fontWeight: "500",
    marginBottom: 4,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    marginLeft: 8,
    marginBottom: 2,
  },
  viewAllButton: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  viewAllText: {
    color: "#0A7EA4",
    fontWeight: "500",
  },
  helpCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  helpText: {
    marginBottom: 8,
    lineHeight: 20,
  },
  syncingOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 20,
    alignItems: "center",
  },
  syncingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  syncingText: {
    marginLeft: 10,
    fontWeight: "500",
  },
  bottomSpacer: {
    height: 50,
  },
});
