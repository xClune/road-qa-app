import React, { useEffect, useState } from "react";
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
import { useNetInfo } from "@react-native-community/netinfo";

// MODIFIED Interface to include source files
interface Props {
  onSelect: (file: CSVFile) => void;
  label?: string;
  // NEW: files prop for offline mode
  files?: CSVFile[];
}

interface CSVFile {
  id: string;
  name: string;
  modifiedTime: string;
  // NEW: optional local path
  localPath?: string;
}

export const CSVFileDropdown: React.FC<Props> = ({
  onSelect,
  label = "Select Project",
  // NEW: Add files prop
  files = [],
}) => {
  const [driveFiles, setDriveFiles] = useState<CSVFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<CSVFile | null>(null);
  const netInfo = useNetInfo();

  // MODIFIED: Only fetch from Drive if no files provided
  useEffect(() => {
    if (files.length === 0) {
      fetchDriveFiles();
    }
  }, []);

  // RENAMED: from fetchFiles to fetchDriveFiles for clarity
  const fetchDriveFiles = async () => {
    if (netInfo.isConnected === false) {
      setError("No internet connection");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const csvFiles = await GoogleDriveService.listCSVFiles();
      setDriveFiles(csvFiles);
    } catch (err) {
      setError("Failed to load project files. Please try again.");
      console.error("Error fetching CSV files:", err);
    } finally {
      setLoading(false);
    }
  };

  // MODIFIED: Handle selection based on file source
  const handleSelect = async (file: CSVFile) => {
    setSelectedFile(file);
    setModalVisible(false);
    onSelect(file);
  };

  // NEW: Get display files based on source
  const displayFiles = files.length > 0 ? files : driveFiles;

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
            <FlatList
              data={displayFiles}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.fileItem}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.fileName}>{item.name}</Text>
                  {/* MODIFIED: Show if file is available offline */}
                  <Text style={styles.fileDate}>
                    {item.localPath 
                      ? "Available Offline"
                      : `Modified: ${new Date(item.modifiedTime).toLocaleDateString()}`
                    }
                  </Text>
                </Pressable>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
};

// Styles remain unchanged

const styles = StyleSheet.create({
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
  modalHeader: { flexDirection: "row", justifyContent: "space-between" },
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
    marginBottom: 16,
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
    marginTop: 16,
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
