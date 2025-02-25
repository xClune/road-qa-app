// components/CSVFileDropdown.tsx - Updated version
import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { GoogleDriveService } from "../services/googleDriveService";

interface CSVFile {
  id: string;
  name: string;
  modifiedTime: string;
}

interface Props {
  onSelect: (file: CSVFile, localPath: string) => void;
  label?: string;
  files?: CSVFile[]; // New prop to accept files directly
  loading?: boolean; // New prop to handle loading state
}

export const CSVFileDropdown: React.FC<Props> = ({
  onSelect,
  label = "Select Project",
  files = [], // Default to empty array
  loading = false, // Default to not loading
}) => {
  const [downloadingFile, setDownloadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<CSVFile | null>(null);

  const handleSelect = async (file: CSVFile) => {
    setDownloadingFile(true);
    setError(null);

    try {
      const localPath = await GoogleDriveService.downloadFile(
        file.id,
        file.name
      );
      setSelectedFile(file);
      setModalVisible(false);
      onSelect(file, localPath);
    } catch (err) {
      setError("Failed to download file. Please try again.");
      console.error("Error downloading file:", err);
    } finally {
      setDownloadingFile(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={styles.dropdownButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.dropdownButtonText}>
          {selectedFile ? selectedFile.name : "Select a project"}
        </Text>
      </Pressable>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Project</Text>
            <Pressable
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>

          {loading || downloadingFile ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>
                {downloadingFile
                  ? "Downloading project file..."
                  : "Loading projects..."}
              </Text>
            </View>
          ) : (
            <>
              {files.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No project files found</Text>
                </View>
              ) : (
                <FlatList
                  data={files}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <Pressable
                      style={styles.fileItem}
                      onPress={() => handleSelect(item)}
                    >
                      <Text style={styles.fileName}>{item.name}</Text>
                      <Text style={styles.fileDate}>
                        Modified:{" "}
                        {new Date(item.modifiedTime).toLocaleDateString()}
                      </Text>
                    </Pressable>
                  )}
                />
              )}
            </>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  // Keep the existing styles...
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
  },
  dropdownButtonText: {
    fontSize: 16,
    color: "#333",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  fileItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  fileName: {
    fontSize: 16,
    color: "#333",
  },
  fileDate: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});
