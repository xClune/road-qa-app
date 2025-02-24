// services/sheetService.ts
import { QAFormData } from "../types/roadQuality";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";

// This interface defines exactly how our data will look in spreadsheet form
interface QASpreadsheetRow {
  timestamp: string;
  roadName: string;
  chainage: number;
  lhsCrossfall: number;
  rhsCrossfall: number;
  roadWidth: number;
  photoReference: string;
  latitude: number | "";
  longitude: number | "";
  locationAccuracy: number | "";
  photoTimestamp: string | "";
}

// This function converts our form data into a format suitable for spreadsheets
function transformFormDataToRow(data: QAFormData): QASpreadsheetRow {
  const submissionTimestamp = new Date().toISOString();

  // This helper function safely converts string measurements to numbers
  const parseNumber = (value: string): number => {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      throw new Error(`Invalid measurement value: ${value}`);
    }
    return parsed;
  };

  try {
    return {
      timestamp: submissionTimestamp,
      roadName: data.roadName.trim(),
      chainage: parseNumber(data.chainage),
      lhsCrossfall: parseNumber(data.lhsCrossfall),
      rhsCrossfall: parseNumber(data.rhsCrossfall),
      roadWidth: parseNumber(data.roadWidth),
      photoReference: data.photo || "",
      latitude: data.photoMetadata?.location?.latitude ?? "",
      longitude: data.photoMetadata?.location?.longitude ?? "",
      locationAccuracy: data.photoMetadata?.location?.accuracy ?? "",
      photoTimestamp: data.photoMetadata?.timestamp ?? "",
    };
  } catch (error) {
    throw new Error(
      `Failed to transform form data: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// This function manages storing submissions when offline
async function addToSubmissionQueue(data: QASpreadsheetRow) {
  console.log("4. addToSubmissionQueue called");
  try {
    const queueKey = "qa_submission_queue";
    const queueString = await AsyncStorage.getItem(queueKey);
    const queue = queueString ? JSON.parse(queueString) : [];
    queue.push(data);
    await AsyncStorage.setItem(queueKey, JSON.stringify(queue));
    console.log("5. Data added to AsyncStorage queue");

    // Also save to local CSV file for backup and export
    const csvResult = await appendToCSV(data);
    console.log("6. appendToCSV result:", csvResult);
    return csvResult;
  } catch (error) {
    console.error("Error adding to queue:", error);
    return false;
  }
}

// This function handles saving data to our local CSV file
async function appendToCSV(data: QASpreadsheetRow) {
  const csvPath = `${FileSystem.documentDirectory}qa_assessments.csv`;
  console.log("7. Writing to CSV at:", csvPath);

  try {
    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(csvPath);
    console.log("8. File info:", fileInfo);

    // Create CSV row from our data
    const csvRow =
      [
        data.timestamp,
        `"${data.roadName.replace(/"/g, '""')}"`,
        data.chainage,
        data.lhsCrossfall,
        data.rhsCrossfall,
        data.roadWidth,
        `"${data.photoReference}"`,
        data.latitude,
        data.longitude,
        data.locationAccuracy,
        data.photoTimestamp,
      ].join(",") + "\n";
    console.log("9. Created CSV row:", csvRow);

    if (!fileInfo.exists) {
      console.log("10a. Creating new CSV file with headers...");
      // If file doesn't exist, create it with headers and first row
      const headers =
        "Timestamp,Road Name,Chainage (m),LHS Crossfall (%),RHS Crossfall (%),Road Width (m),Photo Reference,Latitude,Longitude,Location Accuracy (m),Photo Timestamp\n";
      await FileSystem.writeAsStringAsync(csvPath, headers + csvRow);
      console.log("11a. New CSV file created with headers and first row");
    } else {
      console.log("10b. Appending to existing CSV file...");
      // If file exists, read current content and append new row
      const currentContent = await FileSystem.readAsStringAsync(csvPath);
      await FileSystem.writeAsStringAsync(csvPath, currentContent + csvRow);
      console.log("11b. New row appended to CSV");
    }

    // Verify write
    const verifyContent = await FileSystem.readAsStringAsync(csvPath);
    console.log(
      "12. CSV content after write:",
      verifyContent.substring(0, 200) + "..."
    );

    return true;
  } catch (error) {
    console.error("Error writing to CSV:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    return false;
  }
}

// Add this to sheetService.ts
export async function checkCSVContent() {
  const csvPath = `${FileSystem.documentDirectory}qa_assessments.csv`;
  console.log("Checking CSV at path:", csvPath);
  try {
    const fileInfo = await FileSystem.getInfoAsync(csvPath);
    console.log("CSV file info:", fileInfo);

    if (!fileInfo.exists) {
      console.log("CSV file does not exist");
      return;
    }

    const content = await FileSystem.readAsStringAsync(csvPath);
    console.log("CSV Content length:", content.length);
    return content;
  } catch (error) {
    console.error("Error reading CSV:", error);
  }
}

// Our main submission function remains similar but now uses our new data structure
export async function submitQAData(data: QAFormData, isOnline: boolean) {
  try {
    console.log("1. submitQAData called with:", { data, isOnline });

    // First transform the data into our spreadsheet format
    const rowData = transformFormDataToRow(data);
    console.log("2. Data transformed:", rowData);

    if (isOnline) {
      console.log("3a. Online mode - would submit to cloud:", rowData);
      await appendToCSV(rowData); // Also save to local CSV
      return true;
    } else {
      console.log("3b. Offline mode - adding to queue");
      return await addToSubmissionQueue(rowData);
    }
  } catch (error) {
    console.error("Error in submitQAData:", error);
    throw error; // Let the UI handle the error
  }
}
