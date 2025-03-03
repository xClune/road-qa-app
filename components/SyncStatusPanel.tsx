// components/SyncStatusPanel.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Modal,
  FlatList,
  SafeAreaView,
} from "react-native";
import { useNetInfo } from "@react-native-community/netinfo";
import { SyncService } from "@/services/syncService";
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

export function SyncStatusPanel() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncHistory, setSyncHistory] = useState<SyncResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const netInfo = useNetInfo();

  useEffect(() => {
    // Initialize sync service
    SyncService.initialize();

    // Load initial status
    loadSyncStatus();

    // Set up interval to refresh status
    const intervalId = setInterval(loadSyncStatus, 10000); // 10 seconds

    return () => clearInterval(intervalId);
  }, []);

  const loadSyncStatus = async () => {
    try {
      const status = await getSyncStatus();
      setPendingCount(status.pendingCount);
      setIsProcessing(status.isProcessing);

      // Also get sync history
      const history = await SyncService.getSyncHistory();
      setSyncHistory(history);
    } catch (error) {
      console.error("Error loading sync status:", error);
    }
  };

  const handleForceSyncPress = async () => {
    if (isSyncing) return;

    try {
      setIsSyncing(true);
      await SyncService.forceSync();
    } catch (error) {
      console.error("Error forcing sync:", error);
    } finally {
      setIsSyncing(false);
      await loadSyncStatus();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // No need to show panel if no pending items and not processing
  if (pendingCount === 0 && !isProcessing && syncHistory.length === 0) {
    return null;
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Sync Status</ThemedText>

      <View style={styles.statusRow}>
        <ThemedText>
          {pendingCount === 0
            ? "All changes synced"
            : `${pendingCount} ${
                pendingCount === 1 ? "change" : "changes"
              } pending upload`}
        </ThemedText>

        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: netInfo.isConnected ? "#34D399" : "#F87171" },
          ]}
        />
      </View>

      {isProcessing && (
        <View style={styles.processingRow}>
          <ActivityIndicator size="small" color="#0A7EA4" />
          <ThemedText style={styles.processingText}>
            Syncing changes...
          </ThemedText>
        </View>
      )}

      <View style={styles.buttonRow}>
        <Pressable
          style={[
            styles.button,
            (!netInfo.isConnected || isSyncing) && styles.buttonDisabled,
          ]}
          disabled={!netInfo.isConnected || isSyncing}
          onPress={handleForceSyncPress}
        >
          <ThemedText style={styles.buttonText}>
            {isSyncing ? "Syncing..." : "Sync Now"}
          </ThemedText>
        </Pressable>

        {syncHistory.length > 0 && (
          <Pressable
            style={styles.historyButton}
            onPress={() => setShowHistory(true)}
          >
            <ThemedText style={styles.historyButtonText}>History</ThemedText>
          </Pressable>
        )}
      </View>

      {/* Sync History Modal */}
      <Modal
        visible={showHistory}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHistory(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Sync History</ThemedText>
            <Pressable
              style={styles.closeButton}
              onPress={() => setShowHistory(false)}
            >
              <ThemedText style={styles.closeButtonText}>Close</ThemedText>
            </Pressable>
          </View>

          <FlatList
            data={syncHistory}
            keyExtractor={(item, index) => `sync-${index}-${item.timestamp}`}
            renderItem={({ item }) => (
              <View
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
                    <ThemedText style={styles.errorsTitle}>Errors:</ThemedText>
                    {item.errors.map((error, i) => (
                      <ThemedText key={i} style={styles.errorText}>
                        • {error}
                      </ThemedText>
                    ))}
                  </View>
                )}
              </View>
            )}
            contentContainerStyle={styles.historyList}
            ListEmptyComponent={
              <View style={styles.emptyHistory}>
                <ThemedText style={styles.emptyHistoryText}>
                  No sync history available
                </ThemedText>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    margin: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  title: {
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  processingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  processingText: {
    marginLeft: 8,
    fontStyle: "italic",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  button: {
    backgroundColor: "#0A7EA4",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    flex: 1,
    marginRight: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "500",
  },
  historyButton: {
    borderWidth: 1,
    borderColor: "#0A7EA4",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  historyButtonText: {
    color: "#0A7EA4",
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: "#0A7EA4",
    fontWeight: "500",
  },
  historyList: {
    padding: 16,
  },
  historyItem: {
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    marginBottom: 16,
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
  emptyHistory: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyHistoryText: {
    color: "#64748B",
    fontStyle: "italic",
  },
});
