// screens/TestPointSelection.tsx
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
  Alert, // NEW: Added for error handling
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Papa from "papaparse";
import * as FileSystem from "expo-file-system";
import { LocalProjectService } from "@/services/localProjectService"; // NEW

interface TestPoint {
  "TEST POINT": string;
  "LINE ITEM": string;
  "TREATMENT TYPE": string;
  Chainage: string;
  Latitude: string;
  Longitude: string;
}

export default function TestPointSelection() {
  const { projectId, projectName, localPath } = useLocalSearchParams<{
    projectId: string;
    projectName: string;
    localPath: string;
  }>();

  const [testPoints, setTestPoints] = useState<TestPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<TestPoint | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTestPoints();
  }, [localPath]);

  // MODIFIED: Enhanced error handling and file verification
  const loadTestPoints = async () => {
    try {
      // First verify the file still exists
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (!fileInfo.exists) {
        // NEW: Check if project is still in metadata
        const projects = await LocalProjectService.getLocalProjects();
        const projectExists = projects.some(p => p.id === projectId);
        
        if (!projectExists) {
          Alert.alert(
            "Project Not Found",
            "This project is no longer available offline. Please download it again.",
            [
              {
                text: "Go Back",
                onPress: () => router.back(),
                style: "default"
              }
            ]
          );
          return;
        }
        setError("Project file not found");
        setLoading(false);
        return;
      }

      const fileContent = await FileSystem.readAsStringAsync(localPath);

      Papa.parse<TestPoint>(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          // Sort test points by TEST POINT number
          const sortedPoints = results.data.sort((a, b) => {
            const aNum = parseFloat(a["TEST POINT"]);
            const bNum = parseFloat(b["TEST POINT"]);
            return aNum - bNum;
          });

          setTestPoints(sortedPoints);
          setLoading(false);
        },
        error: (error: Error) => {
          setError("Error parsing project data");
          setLoading(false);
          console.error("CSV Parse Error:", error);
        },
      });
    } catch (error) {
      setError("Error loading project data");
      setLoading(false);
      console.error("File Read Error:", error);
    }
  };

  const handlePointSelection = (point: TestPoint) => {
    setSelectedPoint(point);
    setModalVisible(false);
    router.push({
      pathname: "/qaform",
      params: {
        projectId,
        projectName,
        localPath,
        testPoint: point["TEST POINT"],
        lineItem: point["LINE ITEM"],
        treatmentType: point["TREATMENT TYPE"],
        chainage: point["Chainage"],
        latitude: point["Latitude"],
        longitude: point["Longitude"],
      },
    });
  };

  // NEW: Added retry functionality
  const handleRetry = async () => {
    setError(null);
    setLoading(true);
    await loadTestPoints();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Test Point</Text>
        <Text style={styles.subtitle}>{projectName}</Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.content}>
          <Pressable
            style={styles.selectionButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.selectionButtonText}>
              {selectedPoint
                ? `Test Point ${selectedPoint["TEST POINT"]}`
                : "Select Test Point"}
            </Text>
          </Pressable>

          <Modal
            visible={modalVisible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setModalVisible(false)}
          >
            {/* Modal content remains the same */}
          </Modal>
        </View>
      )}
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  content: {
    padding: 16,
  },
  errorContainer: {
    padding: 16,
    alignItems: "center",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  selectionButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  selectionButtonText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
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
    fontSize: 20,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  pointItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#fff",
  },
  pointTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  pointDetails: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
});
