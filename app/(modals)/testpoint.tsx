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
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Papa from "papaparse";
import * as FileSystem from "expo-file-system";

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

  interface TestPointRow {
    "TEST POINT": string;
    "LINE ITEM": string;
    "TREATMENT TYPE": string;
    Chainage: string;
    Latitude: string;
    Longitude: string;
  }

  const loadTestPoints = async () => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (!fileInfo.exists) {
        setError("Project file not found");
        setLoading(false);
        return;
      }

      const fileContent = await FileSystem.readAsStringAsync(localPath);

      Papa.parse<TestPointRow>(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          // Sort test points by TEST POINT number
          const sortedPoints = (results.data as TestPoint[]).sort((a, b) => {
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Test Point</Text>
        <Text style={styles.subtitle}>{projectName}</Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={loadTestPoints}>
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
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Test Point</Text>
                <Pressable
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </Pressable>
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#007AFF" />
                  <Text style={styles.loadingText}>Loading test points...</Text>
                </View>
              ) : (
                <FlatList
                  data={testPoints}
                  keyExtractor={(item) => item["TEST POINT"]}
                  renderItem={({ item }) => (
                    <Pressable
                      style={styles.pointItem}
                      onPress={() => handlePointSelection(item)}
                    >
                      <Text style={styles.pointTitle}>
                        Test Point {item["TEST POINT"]}
                      </Text>
                      <Text style={styles.pointDetails}>
                        Line Item: {item["LINE ITEM"]}
                      </Text>
                      <Text style={styles.pointDetails}>
                        Chainage: {item["Chainage"]}
                      </Text>
                      <Text style={styles.pointDetails}>
                        Treatment: {item["TREATMENT TYPE"]}
                      </Text>
                    </Pressable>
                  )}
                />
              )}
            </SafeAreaView>
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
