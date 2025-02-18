// services/dataTransformService.ts
import { QAFormData } from "../types/roadQuality";

// First, let's define what our row data should look like
export interface QASpreadsheetRow {
  timestamp: string; // When the assessment was recorded
  roadName: string; // Name of the road being assessed
  chainage: number; // Distance along the road in meters
  lhsCrossfall: number; // Left hand side crossfall as percentage
  rhsCrossfall: number; // Right hand side crossfall as percentage
  roadWidth: number; // Width of the road in meters
  photoReference: string; // Reference to the stored photo
  latitude: number | ""; // GPS latitude where photo was taken
  longitude: number | ""; // GPS longitude where photo was taken
  locationAccuracy: number | ""; // Accuracy of GPS reading in meters
  photoTimestamp: string | ""; // When the photo was taken
}

export function transformFormDataToRow(data: QAFormData): QASpreadsheetRow {
  // Create a timestamp for when this assessment is being recorded
  const submissionTimestamp = new Date().toISOString();

  // Helper function to safely convert string measurements to numbers
  const parseNumber = (value: string): number => {
    const parsed = parseFloat(value);
    // If parsing fails, throw an error - invalid data shouldn't be saved
    if (isNaN(parsed)) {
      throw new Error(`Invalid measurement value: ${value}`);
    }
    return parsed;
  };

  try {
    return {
      // Basic assessment information
      timestamp: submissionTimestamp,
      roadName: data.roadName.trim(), // Remove any accidental whitespace

      // Convert measurement strings to numbers, ensuring they're valid
      chainage: parseNumber(data.chainage),
      lhsCrossfall: parseNumber(data.lhsCrossfall),
      rhsCrossfall: parseNumber(data.rhsCrossfall),
      roadWidth: parseNumber(data.roadWidth),

      // Photo and location data - using empty string for missing values
      photoReference: data.photo || "",
      latitude: data.photoMetadata?.location?.latitude ?? "",
      longitude: data.photoMetadata?.location?.longitude ?? "",
      locationAccuracy: data.photoMetadata?.location?.accuracy ?? "",
      photoTimestamp: data.photoMetadata?.timestamp ?? "",
    };
  } catch (error) {
    // Throw a more descriptive error if transformation fails
    throw new Error(
      `Failed to transform form data: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Helper function to convert row data to CSV format
export function convertRowToCSV(row: QASpreadsheetRow): string {
  // Create CSV row with proper escaping for special characters
  return (
    [
      row.timestamp,
      `"${row.roadName.replace(/"/g, '""')}"`, // Escape quotes in road name
      row.chainage,
      row.lhsCrossfall,
      row.rhsCrossfall,
      row.roadWidth,
      `"${row.photoReference}"`,
      row.latitude,
      row.longitude,
      row.locationAccuracy,
      row.photoTimestamp,
    ].join(",") + "\n"
  );
}

// Get CSV headers for creating new files
export function getCSVHeaders(): string {
  return "Timestamp,Road Name,Chainage (m),LHS Crossfall (%),RHS Crossfall (%),Road Width (m),Photo Reference,Latitude,Longitude,Location Accuracy (m),Photo Timestamp\n";
}
