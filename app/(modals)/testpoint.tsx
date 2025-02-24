// screens/TestPointSelection.tsx
import React, { useEffect, useState } from "react";
import { testpointStyles } from "@/styles";
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
import { router, useLocalSearchParams, useNavigation } from "expo-router";
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

  const navigation = useNavigation();

  const [testPoints, setTestPoints] = useState<TestPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<TestPoint | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTestPoints();
  }, [localPath]);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable onPress={() => router.back()} style={{ marginLeft: 8 }}>
          <Text style={{ color: "#007AFF", fontSize: 16 }}>Projects</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

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
    <SafeAreaView style={testpointStyles.container}>
      <View style={testpointStyles.header}>
        <Text style={testpointStyles.title}>Select Test Point</Text>
        <Text style={testpointStyles.subtitle}>{projectName}</Text>
      </View>

      {error ? (
        <View style={testpointStyles.errorContainer}>
          <Text style={testpointStyles.errorText}>{error}</Text>
          <Pressable
            style={testpointStyles.retryButton}
            onPress={loadTestPoints}
          >
            <Text style={testpointStyles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <View style={testpointStyles.content}>
          <Pressable
            style={testpointStyles.selectionButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={testpointStyles.selectionButtonText}>
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
            <SafeAreaView style={testpointStyles.modalContainer}>
              <View style={testpointStyles.modalHeader}>
                <Text style={testpointStyles.modalTitle}>
                  Select Test Point
                </Text>
                <Pressable
                  style={testpointStyles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={testpointStyles.closeButtonText}>Close</Text>
                </Pressable>
              </View>

              {loading ? (
                <View style={testpointStyles.loadingContainer}>
                  <ActivityIndicator size="large" color="#007AFF" />
                  <Text style={testpointStyles.loadingText}>
                    Loading test points...
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={testPoints}
                  keyExtractor={(item) => item["TEST POINT"]}
                  renderItem={({ item }) => (
                    <Pressable
                      style={testpointStyles.pointItem}
                      onPress={() => handlePointSelection(item)}
                    >
                      <Text style={testpointStyles.pointTitle}>
                        Test Point {item["TEST POINT"]}
                      </Text>
                      <Text style={testpointStyles.pointDetails}>
                        Line Item: {item["LINE ITEM"]}
                      </Text>
                      <Text style={testpointStyles.pointDetails}>
                        Chainage: {item["Chainage"]}
                      </Text>
                      <Text style={testpointStyles.pointDetails}>
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
