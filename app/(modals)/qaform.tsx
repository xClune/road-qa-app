import { useState, useEffect } from "react";
import { router, Stack } from "expo-router";
import { qaFormStyles } from "@/styles";
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
import { submitQAData, readRowFromCSV } from "@/services/sheetService";
import { SyncStatusPanel } from "@/components/SyncStatusPanel";

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
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      // Show loading spinner while submitting
      setIsSubmitting(true);

      const result = await submitQAData(
        params.localPath as string,
        params.testPoint as string,
        formData,
        isOnline ?? false
      );

      if (result.success) {
        alert(result.message);
        // Navigate back to test point selection screen
        router.back();
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert(
        "Error saving changes: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Test Point Selection",
          headerBackTitle: "Projects",
        }}
      />
      <SafeAreaView style={qaFormStyles.safeArea}>
        <ScrollView style={qaFormStyles.scrollView}>
          <View style={qaFormStyles.container}>
            <Text style={qaFormStyles.title}>Quality Assurance Form</Text>

            {/* Pre-filled Information Section */}
            <View style={qaFormStyles.section}>
              <Text style={qaFormStyles.sectionTitle}>Location Details</Text>
              <View style={qaFormStyles.readOnlyField}>
                <Text style={qaFormStyles.label}>Test Point</Text>
                <Text style={qaFormStyles.readOnlyText}>
                  {formData.testPoint}
                </Text>
              </View>
              <View style={qaFormStyles.readOnlyField}>
                <Text style={qaFormStyles.label}>Line Item</Text>
                <Text style={qaFormStyles.readOnlyText}>
                  {formData.lineItem}
                </Text>
              </View>
              <View style={qaFormStyles.readOnlyField}>
                <Text style={qaFormStyles.label}>Treatment Type</Text>
                <Text style={qaFormStyles.readOnlyText}>
                  {formData.treatmentType}
                </Text>
              </View>
              <View style={qaFormStyles.readOnlyField}>
                <Text style={qaFormStyles.label}>Chainage</Text>
                <Text style={qaFormStyles.readOnlyText}>
                  {formData.chainage}
                </Text>
              </View>
            </View>

            {/* Measurement Input Section */}
            <View style={qaFormStyles.section}>
              <Text style={qaFormStyles.sectionTitle}>Measurements</Text>

              <View style={qaFormStyles.fieldRow}>
                <Text style={qaFormStyles.label}>Line Item Completed</Text>
                <Switch
                  value={formData.lineItemCompleted}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      lineItemCompleted: value,
                    }))
                  }
                />
              </View>

              <View style={qaFormStyles.field}>
                <Text style={qaFormStyles.label}>Pavement Thickness (mm)</Text>
                <TextInput
                  style={qaFormStyles.input}
                  value={formData.pavementThickness}
                  onChangeText={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      pavementThickness: value,
                    }))
                  }
                  keyboardType="decimal-pad"
                  placeholder="Enter thickness in mm"
                />
              </View>

              {/* Outbound Crossfall Section */}
              <View style={qaFormStyles.field}>
                <Text style={qaFormStyles.label}>Crossfall Outbound (%)</Text>
                <TextInput
                  style={qaFormStyles.input}
                  value={formData.crossfallOutbound}
                  onChangeText={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      crossfallOutbound: value,
                    }))
                  }
                  keyboardType="decimal-pad"
                  placeholder="Enter outbound crossfall"
                />
                <View style={qaFormStyles.photoRow}>
                  <Pressable
                    style={qaFormStyles.photoButton}
                    onPress={() => handlePhotoCapture("outbound", 1)}
                  >
                    <Text style={qaFormStyles.photoButtonText}>Photo 1</Text>
                  </Pressable>
                  <Pressable
                    style={qaFormStyles.photoButton}
                    onPress={() => handlePhotoCapture("outbound", 2)}
                  >
                    <Text style={qaFormStyles.photoButtonText}>Photo 2</Text>
                  </Pressable>
                </View>
                <View style={qaFormStyles.photoPreviewRow}>
                  {formData.crossfallOutboundPhotos.photo1 && (
                    <Image
                      source={{ uri: formData.crossfallOutboundPhotos.photo1 }}
                      style={qaFormStyles.photoPreview}
                    />
                  )}
                  {formData.crossfallOutboundPhotos.photo2 && (
                    <Image
                      source={{ uri: formData.crossfallOutboundPhotos.photo2 }}
                      style={qaFormStyles.photoPreview}
                    />
                  )}
                </View>
              </View>

              {/* Inbound Crossfall Section */}
              <View style={qaFormStyles.field}>
                <Text style={qaFormStyles.label}>Crossfall Inbound (%)</Text>
                <TextInput
                  style={qaFormStyles.input}
                  value={formData.crossfallInbound}
                  onChangeText={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      crossfallInbound: value,
                    }))
                  }
                  keyboardType="decimal-pad"
                  placeholder="Enter inbound crossfall"
                />
                <View style={qaFormStyles.photoRow}>
                  <Pressable
                    style={qaFormStyles.photoButton}
                    onPress={() => handlePhotoCapture("inbound", 1)}
                  >
                    <Text style={qaFormStyles.photoButtonText}>Photo 1</Text>
                  </Pressable>
                  <Pressable
                    style={qaFormStyles.photoButton}
                    onPress={() => handlePhotoCapture("inbound", 2)}
                  >
                    <Text style={qaFormStyles.photoButtonText}>Photo 2</Text>
                  </Pressable>
                </View>
                <View style={qaFormStyles.photoPreviewRow}>
                  {formData.crossfallInboundPhotos.photo1 && (
                    <Image
                      source={{ uri: formData.crossfallInboundPhotos.photo1 }}
                      style={qaFormStyles.photoPreview}
                    />
                  )}
                  {formData.crossfallInboundPhotos.photo2 && (
                    <Image
                      source={{ uri: formData.crossfallInboundPhotos.photo2 }}
                      style={qaFormStyles.photoPreview}
                    />
                  )}
                </View>
              </View>

              <View style={qaFormStyles.field}>
                <Text style={qaFormStyles.label}>Road Width Total (m)</Text>
                <TextInput
                  style={qaFormStyles.input}
                  value={formData.roadWidthTotal}
                  onChangeText={(value) =>
                    setFormData((prev) => ({ ...prev, roadWidthTotal: value }))
                  }
                  keyboardType="decimal-pad"
                  placeholder="Enter total width in meters"
                />
              </View>

              <View style={qaFormStyles.field}>
                <Text style={qaFormStyles.label}>Comments</Text>
                <TextInput
                  style={[qaFormStyles.input, qaFormStyles.commentInput]}
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

            <Pressable
              style={[
                qaFormStyles.submitButton,
                isSubmitting && qaFormStyles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text
                    style={[qaFormStyles.submitButtonText, { marginLeft: 8 }]}
                  >
                    Submitting...
                  </Text>
                </View>
              ) : (
                <Text style={qaFormStyles.submitButtonText}>
                  Submit Assessment
                </Text>
              )}
            </Pressable>
          </View>
          <SyncStatusPanel />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
