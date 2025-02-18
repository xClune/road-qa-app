import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import { useQASubmission } from "@/hooks/useQASubmission";
import { checkCSVContent } from "@/services/sheetService";
import { QAFormData } from "@/types/roadQuality";

export const CSVTester = () => {
  const [csvContent, setCsvContent] = useState("");
  const [error, setError] = useState("");
  const { submitAssessment } = useQASubmission();

  // Sample form data for testing
  const testFormData: QAFormData = {
    roadName: "Test Road",
    photo: null,
    photoMetadata: null,
    chainage: "100",
    lhsCrossfall: "2.5",
    rhsCrossfall: "2.7",
    roadWidth: "6.0",
  };

  const handleTestSubmission = async () => {
    try {
      // First submit the form data
      const result = await submitAssessment(testFormData);

      if (result.success) {
        // Check the CSV content
        const content = await checkCSVContent();
        setCsvContent(content || "No CSV content found");
        setError("");
      } else {
        setError(`Submission failed: ${result.message}`);
      }
    } catch (error) {
      setError(
        `Error during test: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CSV Generation Test</Text>

      <Pressable style={styles.button} onPress={handleTestSubmission}>
        <Text style={styles.buttonText}>Test CSV Generation</Text>
      </Pressable>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {csvContent ? (
        <View style={styles.csvContainer}>
          <Text style={styles.subtitle}>Generated CSV Content:</Text>
          <ScrollView style={styles.csvContent} horizontal={true}>
            <Text style={styles.csvText}>{csvContent}</Text>
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  errorContainer: {
    backgroundColor: "#FFE5E5",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  errorText: {
    color: "#D00",
    fontSize: 14,
  },
  csvContainer: {
    marginTop: 16,
  },
  csvContent: {
    backgroundColor: "#F5F5F5",
    padding: 12,
    borderRadius: 8,
    maxHeight: 200,
  },
  csvText: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
    }),
    fontSize: 12,
  },
});
