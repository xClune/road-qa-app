// hooks/useQASubmission.ts
import { useState } from "react";
import { useNetInfo } from "@react-native-community/netinfo";
import { QAFormData } from "../types/roadQuality";
import { submitQAData } from "@/services/sheetService";

export function useQASubmission() {
  // Real network status from device
  const netInfo = useNetInfo();
  // Testing toggle for development
  const [isTestingOffline, setIsTestingOffline] = useState(false);

  // This gives us the effective network status, considering both real and test states
  const isEffectivelyOnline = __DEV__
    ? !isTestingOffline // In development, use our testing toggle
    : netInfo.isConnected; // In production, use real network status

  // This handles the actual submission logic
  const submitAssessment = async (formData: QAFormData) => {
    try {
      // Log submission attempt with current network status
      console.log("Submitting assessment:", {
        networkStatus: isEffectivelyOnline ? "online" : "offline",
        data: {
          roadName: formData.roadName,
          measurements: {
            chainage: formData.chainage,
            lhsCrossfall: formData.lhsCrossfall,
            rhsCrossfall: formData.rhsCrossfall,
            roadWidth: formData.roadWidth,
          },
        },
      });

      // Here we'll add our actual submission logic later
      const submitted = await submitQAData(
        formData,
        isEffectivelyOnline ?? false
      );

      if (!submitted) {
        throw new Error("Submission failed");
      }

      return {
        success: true,
        message: isEffectivelyOnline
          ? "Assessment submitted successfully"
          : "Assessment saved and will be uploaded when online",
      };
    } catch (error) {
      return {
        success: false,
        message: `Error submitting assessment: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  };

  // For development testing only
  const toggleTestingOffline = () => setIsTestingOffline((prev) => !prev);

  return {
    submitAssessment,
    isOnline: isEffectivelyOnline,
    // Only expose testing functions in development
    testing: __DEV__
      ? {
          isTestingOffline,
          toggleTestingOffline,
        }
      : undefined,
  };
}
