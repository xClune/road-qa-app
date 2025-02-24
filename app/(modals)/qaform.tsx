import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

import { useQASubmission } from "../../hooks/useQASubmission";
import { QAFormData, PhotoMetadata, LocationData } from "@/types/roadQuality";
import { checkCSVContent } from "@/services/sheetService";

import { CSVTester } from "@/components/CsvTester";

export default function QAScreen() {
  // Initialize our state with the new data structure
  const { submitAssessment, isOnline, testing } = useQASubmission();
  const [formData, setFormData] = useState<QAFormData>({
    roadName: "",
    photo: null,
    photoMetadata: null,
    chainage: "",
    lhsCrossfall: "",
    rhsCrossfall: "",
    roadWidth: "",
  });

  // Handle photo capture with metadata
  const handleCapturePicture = async () => {
    try {
      // First, ensure we have camera permissions
      const cameraPermission =
        await ImagePicker.requestCameraPermissionsAsync();
      const locationPermission =
        await Location.requestForegroundPermissionsAsync();

      if (
        cameraPermission.status !== "granted" ||
        locationPermission.status !== "granted"
      ) {
        alert(
          "We need camera and location permissions to capture inspection data."
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        quality: 1,
        exif: true,
      });

      if (!result.canceled) {
        // Get location at time of photo
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        setFormData((prev) => ({
          ...prev,
          photo: result.assets[0].uri,
          photoMetadata: {
            location: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              accuracy: location.coords.accuracy,
            },
            timestamp: new Date().toISOString(),
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

  // Test the app
  const handleSubmit = async () => {
    // Validate form data
    if (!formData.roadName) {
      alert("Please provide a road name");
      return;
    }

    if (
      !formData.chainage ||
      !formData.lhsCrossfall ||
      !formData.rhsCrossfall ||
      !formData.roadWidth
    ) {
      alert("Please fill in all measurements");
      return;
    }

    // Submit the assessment
    const result = await submitAssessment(formData);

    // Show result to user
    alert(result.message);

    // Reset form if submission was successful
    if (result.success) {
      // Add CSV check here
      const csvContent = await checkCSVContent();
      console.log("Current CSV contents:", csvContent);

      setFormData({
        roadName: "",
        photo: null,
        photoMetadata: null,
        chainage: "",
        lhsCrossfall: "",
        rhsCrossfall: "",
        roadWidth: "",
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          {/* Testing UI only shown in development */}
          {testing && (
            <View style={styles.testingContainer}>
              <Text style={styles.testingText}>
                Testing Mode: {testing.isTestingOffline ? "Offline" : "Online"}
              </Text>
              <Pressable
                style={styles.testingButton}
                onPress={testing.toggleTestingOffline}
              >
                <Text style={styles.testingButtonText}>
                  Toggle Online/Offline
                </Text>
              </Pressable>
              <CSVTester />
            </View>
          )}
          <Text style={styles.title}>Road Quality Assessment</Text>

          {/* Photo Capture Section */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Road Name</Text>
            <TextInput
              style={styles.input}
              value={formData.roadName}
              onChangeText={(value) =>
                setFormData((prev) => ({ ...prev, roadName: value }))
              }
              placeholder="Enter road name"
              autoCapitalize="words"
            />

            <Text style={styles.label}>Photo Documentation</Text>
            <Pressable
              style={styles.photoButton}
              onPress={handleCapturePicture}
            >
              <Text style={styles.photoButtonText}>
                {formData.photo ? "Retake Photo" : "Take Photo"}
              </Text>
            </Pressable>

            {formData.photo && (
              <View style={styles.photoPreviewContainer}>
                <Image
                  source={{ uri: formData.photo }}
                  style={styles.photoPreview}
                />
                {formData.photoMetadata?.location && (
                  <Text style={styles.metadataText}>
                    Location:{" "}
                    {formData.photoMetadata.location.latitude.toFixed(6)},
                    {formData.photoMetadata.location.longitude.toFixed(6)}
                    {"\n"}Accuracy: ±
                    {formData.photoMetadata.location.accuracy !== null
                      ? formData.photoMetadata.location.accuracy.toFixed(1)
                      : "N/A"}
                    m
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Measurement Fields */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Chainage (m)</Text>
            <TextInput
              style={styles.input}
              value={formData.chainage}
              onChangeText={(value) =>
                setFormData((prev) => ({ ...prev, chainage: value }))
              }
              placeholder="Enter chainage"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>LHS Crossfall (%)</Text>
            <TextInput
              style={styles.input}
              value={formData.lhsCrossfall}
              onChangeText={(value) =>
                setFormData((prev) => ({ ...prev, lhsCrossfall: value }))
              }
              placeholder="Enter LHS crossfall"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>RHS Crossfall (%)</Text>
            <TextInput
              style={styles.input}
              value={formData.rhsCrossfall}
              onChangeText={(value) =>
                setFormData((prev) => ({ ...prev, rhsCrossfall: value }))
              }
              placeholder="Enter RHS crossfall"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Road Width (m)</Text>
            <TextInput
              style={styles.input}
              value={formData.roadWidth}
              onChangeText={(value) =>
                setFormData((prev) => ({ ...prev, roadWidth: value }))
              }
              placeholder="Enter road width"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.buttonContainer}>
            <Pressable
              style={[
                styles.submitButton,
                // !formData.photo && styles.submitButtonDisabled, // uncomment this line when photos are implemented
              ]}
              onPress={handleSubmit}
              //   disabled={!formData.photo} // uncomment this line when photos are implemented
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </Pressable>
          </View>
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
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
    marginVertical: 16,
  },
  formGroup: {
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
  photoButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 16,
  },
  photoButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  photoPreviewContainer: {
    marginTop: 12,
  },
  photoPreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  metadataText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  buttonContainer: {
    marginTop: 24,
  },
  submitButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 16,
  },
  submitButtonDisabled: {
    backgroundColor: "#999",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  testingContainer: {
    padding: 12,
    backgroundColor: "#f0f0f0",
    marginBottom: 16,
    borderRadius: 8,
  },
  testingText: {
    fontSize: 14,
    marginBottom: 8,
  },
  testingButton: {
    backgroundColor: "#007AFF",
    padding: 8,
    borderRadius: 6,
  },
  testingButtonText: {
    color: "#fff",
    textAlign: "center",
  },
});
