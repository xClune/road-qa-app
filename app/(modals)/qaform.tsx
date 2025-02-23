import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Image,
  Switch,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useLocalSearchParams } from "expo-router";
import { useQASubmission } from "@/hooks/useQASubmission";
import { readRowFromCSV, submitQAData } from "@/services/sheetService";

interface FormData {
  // Pre-filled fields (read-only)
  testPoint: string;
  lineItem: string;
  treatmentType: string;
  chainage: string;
  latitude: string;
  longitude: string;

  // User input fields
  testDate: string;
  lineItemCompleted: boolean;
  pavementThickness: string;
  crossfallOutbound: string;
  crossfallOutboundPhotos: {
    photo1: string | null;
    photo2: string | null;
  };
  crossfallInbound: string;
  crossfallInboundPhotos: {
    photo1: string | null;
    photo2: string | null;
  };
  roadWidthTotal: string;
  comments: string;
}

export default function QAScreen() {
  const params = useLocalSearchParams();
  const { isOnline } = useQASubmission();
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    // Initialize with empty values
    testPoint: "",
    lineItem: "",
    treatmentType: "",
    chainage: "",
    latitude: "",
    longitude: "",
    testDate: new Date().toISOString().split("T")[0],
    lineItemCompleted: false,
    pavementThickness: "",
    crossfallOutbound: "",
    crossfallOutboundPhotos: { photo1: null, photo2: null },
    crossfallInbound: "",
    crossfallInboundPhotos: { photo1: null, photo2: null },
    roadWidthTotal: "",
    comments: "",
  });

  // Load existing row data when component mounts
  useEffect(() => {
    const loadRowData = async () => {
      try {
        if (params.localPath && params.testPoint) {
          const rowData = await readRowFromCSV(
            params.localPath as string,
            params.testPoint as string
          );

          // Update form with existing data
          setFormData((prev) => ({
            ...prev,
            testPoint: rowData["TEST POINT"] || "",
            lineItem: rowData["LINE ITEM"] || "",
            treatmentType: rowData["TREATMENT TYPE"] || "",
            chainage: rowData["Chainage"] || "",
            latitude: rowData["Latitude"] || "",
            longitude: rowData["Longitude"] || "",
            pavementThickness: rowData["PAVEMENT THICKNESS (mm)"] || "",
            crossfallOutbound: rowData["CROSSFALL O/B (%)"] || "",
            crossfallInbound: rowData["CROSSFALL I/B (%)"] || "",
            roadWidthTotal: rowData["ROAD WIDTH TOTAL (m)"] || "",
            comments: rowData["COMMENT"] || "",
            lineItemCompleted:
              rowData["LINE ITEM COMPLETED (YES/NO)"] === "YES",
          }));
        }
      } catch (error) {
        console.error("Error loading row data:", error);
        alert("Error loading test point data");
      } finally {
        setLoading(false);
      }
    };

    loadRowData();
  }, [params.localPath, params.testPoint]);

  const handlePhotoCapture = async (
    measurementType: "outbound" | "inbound",
    photoNumber: 1 | 2
  ) => {
    try {
      const cameraPermission =
        await ImagePicker.requestCameraPermissionsAsync();
      const locationPermission =
        await Location.requestForegroundPermissionsAsync();

      if (
        cameraPermission.status !== "granted" ||
        locationPermission.status !== "granted"
      ) {
        alert("Camera and location permissions are required");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 1,
        exif: true,
      });

      if (!result.canceled) {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        setFormData((prev) => ({
          ...prev,
          [`crossfall${
            measurementType === "outbound" ? "Outbound" : "Inbound"
          }Photos`]: {
            ...prev[
              `crossfall${
                measurementType === "outbound" ? "Outbound" : "Inbound"
              }Photos`
            ],
            [`photo${photoNumber}`]: result.assets[0].uri,
          },
        }));
      }
    } catch (error) {
      alert(
        "Error capturing photo: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  };

  const handleSubmit = async () => {
    try {
      if (!params.localPath || !params.testPoint) {
        alert("Missing file path or test point information");
        return;
      }

      // Basic validation
      if (
        !formData.pavementThickness ||
        !formData.crossfallOutbound ||
        !formData.crossfallInbound ||
        !formData.roadWidthTotal
      ) {
        alert("Please fill in all measurements");
        return;
      }

      const result = await submitQAData(
        params.localPath as string,
        params.testPoint as string,
        formData,
        isOnline ?? false
      );

      if (result) {
        alert(isOnline ? "Changes saved and synced" : "Changes saved locally");
      }
    } catch (error) {
      alert(
        "Error saving changes: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading test point data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <Text style={styles.title}>Quality Assurance Form</Text>

          {/* Pre-filled Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location Details</Text>
            <View style={styles.readOnlyField}>
              <Text style={styles.label}>Test Point</Text>
              <Text style={styles.readOnlyText}>{formData.testPoint}</Text>
            </View>
            <View style={styles.readOnlyField}>
              <Text style={styles.label}>Line Item</Text>
              <Text style={styles.readOnlyText}>{formData.lineItem}</Text>
            </View>
            <View style={styles.readOnlyField}>
              <Text style={styles.label}>Treatment Type</Text>
              <Text style={styles.readOnlyText}>{formData.treatmentType}</Text>
            </View>
            <View style={styles.readOnlyField}>
              <Text style={styles.label}>Chainage</Text>
              <Text style={styles.readOnlyText}>{formData.chainage}</Text>
            </View>
          </View>

          {/* Measurement Input Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Measurements</Text>

            <View style={styles.fieldRow}>
              <Text style={styles.label}>Line Item Completed</Text>
              <Switch
                value={formData.lineItemCompleted}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, lineItemCompleted: value }))
                }
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Pavement Thickness (mm)</Text>
              <TextInput
                style={styles.input}
                value={formData.pavementThickness}
                onChangeText={(value) =>
                  setFormData((prev) => ({ ...prev, pavementThickness: value }))
                }
                keyboardType="decimal-pad"
                placeholder="Enter thickness in mm"
              />
            </View>

            {/* Outbound Crossfall Section */}
            <View style={styles.field}>
              <Text style={styles.label}>Crossfall Outbound (%)</Text>
              <TextInput
                style={styles.input}
                value={formData.crossfallOutbound}
                onChangeText={(value) =>
                  setFormData((prev) => ({ ...prev, crossfallOutbound: value }))
                }
                keyboardType="decimal-pad"
                placeholder="Enter outbound crossfall"
              />
              <View style={styles.photoRow}>
                <Pressable
                  style={styles.photoButton}
                  onPress={() => handlePhotoCapture("outbound", 1)}
                >
                  <Text style={styles.photoButtonText}>Photo 1</Text>
                </Pressable>
                <Pressable
                  style={styles.photoButton}
                  onPress={() => handlePhotoCapture("outbound", 2)}
                >
                  <Text style={styles.photoButtonText}>Photo 2</Text>
                </Pressable>
              </View>
              <View style={styles.photoPreviewRow}>
                {formData.crossfallOutboundPhotos.photo1 && (
                  <Image
                    source={{ uri: formData.crossfallOutboundPhotos.photo1 }}
                    style={styles.photoPreview}
                  />
                )}
                {formData.crossfallOutboundPhotos.photo2 && (
                  <Image
                    source={{ uri: formData.crossfallOutboundPhotos.photo2 }}
                    style={styles.photoPreview}
                  />
                )}
              </View>
            </View>

            {/* Inbound Crossfall Section */}
            <View style={styles.field}>
              <Text style={styles.label}>Crossfall Inbound (%)</Text>
              <TextInput
                style={styles.input}
                value={formData.crossfallInbound}
                onChangeText={(value) =>
                  setFormData((prev) => ({ ...prev, crossfallInbound: value }))
                }
                keyboardType="decimal-pad"
                placeholder="Enter inbound crossfall"
              />
              <View style={styles.photoRow}>
                <Pressable
                  style={styles.photoButton}
                  onPress={() => handlePhotoCapture("inbound", 1)}
                >
                  <Text style={styles.photoButtonText}>Photo 1</Text>
                </Pressable>
                <Pressable
                  style={styles.photoButton}
                  onPress={() => handlePhotoCapture("inbound", 2)}
                >
                  <Text style={styles.photoButtonText}>Photo 2</Text>
                </Pressable>
              </View>
              <View style={styles.photoPreviewRow}>
                {formData.crossfallInboundPhotos.photo1 && (
                  <Image
                    source={{ uri: formData.crossfallInboundPhotos.photo1 }}
                    style={styles.photoPreview}
                  />
                )}
                {formData.crossfallInboundPhotos.photo2 && (
                  <Image
                    source={{ uri: formData.crossfallInboundPhotos.photo2 }}
                    style={styles.photoPreview}
                  />
                )}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Road Width Total (m)</Text>
              <TextInput
                style={styles.input}
                value={formData.roadWidthTotal}
                onChangeText={(value) =>
                  setFormData((prev) => ({ ...prev, roadWidthTotal: value }))
                }
                keyboardType="decimal-pad"
                placeholder="Enter total width in meters"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Comments</Text>
              <TextInput
                style={[styles.input, styles.commentInput]}
                value={formData.comments}
                onChangeText={(value) =>
                  setFormData((prev) => ({ ...prev, comments: value }))
                }
                multiline
                numberOfLines={3}
                placeholder="Add any additional comments"
              />
            </View>
          </View>

          <Pressable style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit Assessment</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 16,
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
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
    marginVertical: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  readOnlyField: {
    marginBottom: 12,
  },
  readOnlyText: {
    fontSize: 16,
    color: "#666",
    padding: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
  },
  field: {
    marginBottom: 16,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: Platform.OS === "ios" ? 12 : 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  commentInput: {
    height: 100,
    textAlignVertical: "top",
  },
  photoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    gap: 8,
  },
  photoButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  photoButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  photoPreviewRow: {
    flexDirection: "row",
    marginTop: 8,
    gap: 8,
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  submitButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 24,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
