import React, { useEffect, useState } from "react";
import { csvFileDropdownStyles } from "@/styles";
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

interface CSVFile {
  id: string;
  name: string;
  modifiedTime: string;
}

interface Props {
  onSelect: (file: CSVFile, localPath: string) => void;
  label?: string;
}

export const CSVFileDropdown: React.FC<Props> = ({
  onSelect,
  label = "Select Project",
}) => {
  const [files, setFiles] = useState<CSVFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<CSVFile | null>(null);
  const netInfo = useNetInfo();

  useEffect(() => {
    console.log("Network status:", netInfo);
    fetchFiles();
  }, []);

  useEffect(() => {
    fetchFiles();
    // Clean up old files on component mount
    GoogleDriveService.cleanupOldFiles();
  }, []);

  // Modify the network check
  const fetchFiles = async () => {
    // Don't return early if network status is unknown
    if (netInfo.isConnected === false) {
      // Only block if definitely offline
      setError("No internet connection. Showing cached files.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const csvFiles = await GoogleDriveService.listCSVFiles();
      setFiles(csvFiles);
    } catch (err) {
      setError("Failed to load project files. Please try again.");
      console.error("Error fetching CSV files:", err);
    } finally {
      setLoading(false);
    }
  };

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
    <View style={csvFileDropdownStyles.container}>
      <Text style={csvFileDropdownStyles.label}>{label}</Text>
      <Pressable
        style={csvFileDropdownStyles.dropdownButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={csvFileDropdownStyles.dropdownButtonText}>
          {selectedFile ? selectedFile.name : "Select a project"}
        </Text>
      </Pressable>

      {error && <Text style={csvFileDropdownStyles.errorText}>{error}</Text>}

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={csvFileDropdownStyles.modalContainer}>
          <View style={csvFileDropdownStyles.modalHeader}>
            <Text style={csvFileDropdownStyles.modalTitle}>Select Project</Text>
            <Pressable
              style={csvFileDropdownStyles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={csvFileDropdownStyles.closeButtonText}>Close</Text>
            </Pressable>
          </View>

          {loading || downloadingFile ? (
            <View style={csvFileDropdownStyles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={csvFileDropdownStyles.loadingText}>
                {downloadingFile
                  ? "Downloading project file..."
                  : "Loading projects..."}
              </Text>
            </View>
          ) : (
            <FlatList
              data={files}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={csvFileDropdownStyles.fileItem}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={csvFileDropdownStyles.fileName}>
                    {item.name}
                  </Text>
                  <Text style={csvFileDropdownStyles.fileDate}>
                    Modified: {new Date(item.modifiedTime).toLocaleDateString()}
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

const styles = StyleSheet.create({
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
