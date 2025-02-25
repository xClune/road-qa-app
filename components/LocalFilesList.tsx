// components/LocalFilesList.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  SectionList,
} from "react-native";
import { router } from "expo-router";
import { GoogleDriveService } from "@/services/googleDriveService";

interface LocalFile {
  id: string;
  name: string;
  localPath: string;
  lastDownloaded: string;
}

interface Props {
  onSelect: (file: LocalFile, localPath: string) => void;
}

export function LocalFilesList({ onSelect }: Props) {
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLocalFiles();
  }, []);

  const loadLocalFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const localFiles = await GoogleDriveService.listLocalFiles();
      setFiles(localFiles);
    } catch (err) {
      setError("Failed to load local files");
      console.error("Error fetching local files:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (file: LocalFile) => {
    onSelect(file, file.localPath);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading local files...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={loadLocalFiles}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (files.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No local files found</Text>
        <Text style={styles.hintText}>
          Sign in to download project files for offline use
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Locally Available Projects</Text>
      <FlatList
        data={files}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable style={styles.fileItem} onPress={() => handleSelect(item)}>
            <Text style={styles.fileName}>{item.name}</Text>
            <Text style={styles.fileDetails}>
              Last downloaded:{" "}
              {new Date(item.lastDownloaded).toLocaleDateString()}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    flex: 1,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  hintText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  fileItem: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  fileName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  fileDetails: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
});
