// services/sheetService.ts
import { QAFormData } from "../types/roadQuality";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import Papa from "papaparse";
import { GoogleDriveService } from "./googleDriveService";

// Interface for CSV row structure
interface CSVRow {
  "TEST POINT": string;
  "LINE ITEM": string;
  Latitude: string;
  Longitude: string;
  "TREATMENT TYPE": string;
  Chainage: string;
  "TEST DATE": string;
  "LINE ITEM COMPLETED (YES/NO)": string;
  "PAVEMENT THICKNESS (mm)": string;
  "CROSSFALL O/B (%)": string;
  "Photo 1": string;
  "Photo 2": string;
  "CROSSFALL I/B (%)": string;
  "Photo 1.1": string;
  "Photo 2.1": string;
  "ROAD WIDTH TOTAL (m)": string;
  "Photo 1 ": string;
  "Photo 2.2": string;
  COMMENT: string;
}

// Read a specific row from CSV
export async function readRowFromCSV(
  filePath: string,
  testPoint: string
): Promise<CSVRow> {
  try {
    const fileContent = await FileSystem.readAsStringAsync(filePath);

    return new Promise((resolve, reject) => {
      Papa.parse<CSVRow>(fileContent, {
        header: true,
        complete: (results) => {
          const row = results.data.find(
            (row) => row["TEST POINT"] === testPoint
          );
          if (!row) {
            reject(new Error("Test point not found"));
            return;
          }
          resolve(row);
        },
        error: (error: any) => {
          reject(error);
        },
      });
    });
  } catch (error) {
    console.error("Error reading CSV:", error);
    throw error;
  }
}

// Update a specific row in the CSV
export async function updateRowInCSV(
  filePath: string,
  testPoint: string,
  formData: QAFormData
): Promise<CSVRow> {
  try {
    const fileContent = await FileSystem.readAsStringAsync(filePath);

    return new Promise((resolve, reject) => {
      Papa.parse<CSVRow>(fileContent, {
        header: true,
        complete: async (results) => {
          // Find the row index for this test point
          const rowIndex = results.data.findIndex(
            (row) => row["TEST POINT"] === testPoint
          );

          if (rowIndex === -1) {
            reject(new Error("Test point not found"));
            return;
          }

          const existingRow = results.data[rowIndex];

          // Create updated row with type safety
          const updatedRow: CSVRow = {
            "TEST POINT": existingRow["TEST POINT"],
            "LINE ITEM": existingRow["LINE ITEM"],
            Latitude: existingRow["Latitude"],
            Longitude: existingRow["Longitude"],
            "TREATMENT TYPE": existingRow["TREATMENT TYPE"],
            Chainage: existingRow["Chainage"],
            "TEST DATE": formData.testDate,
            "LINE ITEM COMPLETED (YES/NO)": formData.lineItemCompleted
              ? "YES"
              : "NO",
            "PAVEMENT THICKNESS (mm)":
              formData.pavementThickness ||
              existingRow["PAVEMENT THICKNESS (mm)"],
            "CROSSFALL O/B (%)":
              formData.crossfallOutbound || existingRow["CROSSFALL O/B (%)"],
            "CROSSFALL I/B (%)":
              formData.crossfallInbound || existingRow["CROSSFALL I/B (%)"],
            "ROAD WIDTH TOTAL (m)":
              formData.roadWidthTotal || existingRow["ROAD WIDTH TOTAL (m)"],
            "Photo 1":
              formData.crossfallOutboundPhotos.photo1 || existingRow["Photo 1"],
            "Photo 2":
              formData.crossfallOutboundPhotos.photo2 || existingRow["Photo 2"],
            "Photo 1.1":
              formData.crossfallInboundPhotos.photo1 ||
              existingRow["Photo 1.1"],
            "Photo 2.1":
              formData.crossfallInboundPhotos.photo2 ||
              existingRow["Photo 2.1"],
            "Photo 1 ": existingRow["Photo 1 "],
            "Photo 2.2": existingRow["Photo 2.2"],
            COMMENT: formData.comments || existingRow["COMMENT"],
          };

          // Update the row in the data array
          results.data[rowIndex] = updatedRow;

          // Convert back to CSV
          const csv = Papa.unparse(results.data);

          // Write back to file
          await FileSystem.writeAsStringAsync(filePath, csv);

          resolve(updatedRow);
        },
        error: (error: any) => {
          reject(error);
        },
      });
    });
  } catch (error) {
    console.error("Error updating CSV:", error);
    throw error;
  }
}

// Submit QA data with cloud sync integration
export async function submitQAData(
  filePath: string,
  testPoint: string,
  data: QAFormData,
  isOnline: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    console.log("1. submitQAData called with:", { testPoint, isOnline });

    // Always update local CSV file
    const updatedRow = await updateRowInCSV(filePath, testPoint, data);
    console.log("2. Local CSV updated");

    if (isOnline) {
      try {
        // Upload using the new public method instead of accessing private metadata
        await GoogleDriveService.uploadFileByPath(filePath);
        console.log("3a. Online mode - file synced to Google Drive");

        return {
          success: true,
          message: "Assessment saved and synced to cloud",
        };
      } catch (uploadError) {
        console.error("Error syncing to Google Drive:", uploadError);

        // If online upload fails, add to queue as fallback
        await addToSubmissionQueue({
          filePath,
          testPoint,
          data,
        });

        return {
          success: true,
          message:
            "Assessment saved locally. Cloud sync failed - will retry later.",
        };
      }
    } else {
      console.log("3b. Offline mode - changes saved locally");
      // Add to sync queue for later
      await addToSubmissionQueue({
        filePath,
        testPoint,
        data,
      });

      return {
        success: true,
        message: "Assessment saved locally and will be uploaded when online",
      };
    }
  } catch (error) {
    console.error("Error in submitQAData:", error);
    return {
      success: false,
      message: `Error saving assessment: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

// Queue system for offline changes
async function addToSubmissionQueue(submission: {
  filePath: string;
  testPoint: string;
  data: QAFormData;
}): Promise<boolean> {
  try {
    const queueKey = "qa_submission_queue";
    const queueString = await AsyncStorage.getItem(queueKey);
    const queue = queueString ? JSON.parse(queueString) : [];

    // Check if this test point already has a pending update
    const existingIndex = queue.findIndex(
      (item: any) =>
        item.filePath === submission.filePath &&
        item.testPoint === submission.testPoint
    );

    if (existingIndex >= 0) {
      // Replace existing entry with newest data
      queue[existingIndex] = submission;
    } else {
      // Add new entry
      queue.push(submission);
    }

    await AsyncStorage.setItem(queueKey, JSON.stringify(queue));
    console.log("4. Added/updated in submission queue");
    return true;
  } catch (error) {
    console.error("Error adding to queue:", error);
    return false;
  }
}

// Get current sync status
export async function getSyncStatus(): Promise<{
  pendingCount: number;
  isProcessing: boolean;
}> {
  try {
    const processingKey = "qa_sync_processing";
    const isProcessing = (await AsyncStorage.getItem(processingKey)) === "true";
    const pendingCount = await GoogleDriveService.getSyncQueueSize();

    return {
      pendingCount,
      isProcessing,
    };
  } catch (error) {
    console.error("Error getting sync status:", error);
    return { pendingCount: 0, isProcessing: false };
  }
}
