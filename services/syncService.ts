// services/syncService.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoogleDriveService } from "./googleDriveService";
import NetInfo from "@react-native-community/netinfo";
import { Platform } from "react-native";

// Constants
const SYNC_PROCESSING_KEY = "qa_sync_processing";
const SYNC_LAST_ATTEMPT_KEY = "qa_sync_last_attempt";
const SYNC_RESULTS_KEY = "qa_sync_results";
const SYNC_MIN_INTERVAL = 5 * 60 * 1000; // 5 minutes

interface SyncResult {
  timestamp: string;
  success: boolean;
  itemsProcessed: number;
  itemsSucceeded: number;
  itemsFailed: number;
  errors: string[];
}

export class SyncService {
  private static isListeningForConnection = false;

  /**
   * Initialize the sync service
   * Sets up connection listeners to trigger sync when connectivity is restored
   */
  static initialize() {
    if (this.isListeningForConnection) return;

    // Set up a listener for connection changes
    NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        console.log("Connection restored, checking for pending uploads");
        this.attemptSync();
      }
    });

    this.isListeningForConnection = true;
    console.log("SyncService initialized");
  }

  /**
   * Attempt to sync pending changes
   * @param force Force sync even if minimum interval hasn't elapsed
   * @returns Result of sync operation
   */
  static async attemptSync(force = false): Promise<SyncResult | null> {
    try {
      // Check if we're already processing
      const isProcessing =
        (await AsyncStorage.getItem(SYNC_PROCESSING_KEY)) === "true";
      if (isProcessing) {
        console.log("Sync already in progress, skipping");
        return null;
      }

      // Check if we have connectivity
      const networkState = await NetInfo.fetch();
      if (!networkState.isConnected) {
        console.log("No connectivity, skipping sync");
        return null;
      }

      // Check when we last attempted sync to avoid too frequent attempts
      if (!force) {
        const lastAttemptStr = await AsyncStorage.getItem(
          SYNC_LAST_ATTEMPT_KEY
        );
        if (lastAttemptStr) {
          const lastAttempt = new Date(lastAttemptStr).getTime();
          const now = Date.now();
          if (now - lastAttempt < SYNC_MIN_INTERVAL) {
            console.log("Sync attempted too recently, skipping");
            return null;
          }
        }
      }

      // Check if we have items to sync
      const queueSize = await GoogleDriveService.getSyncQueueSize();
      if (queueSize === 0) {
        console.log("No items to sync");
        return null;
      }

      // Mark sync as in progress
      await AsyncStorage.setItem(SYNC_PROCESSING_KEY, "true");
      await AsyncStorage.setItem(
        SYNC_LAST_ATTEMPT_KEY,
        new Date().toISOString()
      );

      console.log(`Starting sync process for ${queueSize} items`);

      // Get authentication status
      const isAuthenticated = await this.checkAuthentication();
      if (!isAuthenticated) {
        console.log("Not authenticated, can't sync");
        await AsyncStorage.setItem(SYNC_PROCESSING_KEY, "false");

        const result: SyncResult = {
          timestamp: new Date().toISOString(),
          success: false,
          itemsProcessed: 0,
          itemsSucceeded: 0,
          itemsFailed: queueSize,
          errors: ["Not authenticated with Google Drive"],
        };

        await this.saveResult(result);
        return result;
      }

      // Process the queue
      const results = await GoogleDriveService.processSyncQueue();

      // Analyze results
      const successCount = results.filter((r) => r.success).length;
      const failedCount = results.length - successCount;
      const errors = results
        .filter((r) => !r.success && r.error)
        .map((r) => r.error as string);

      const result: SyncResult = {
        timestamp: new Date().toISOString(),
        success: failedCount === 0,
        itemsProcessed: results.length,
        itemsSucceeded: successCount,
        itemsFailed: failedCount,
        errors,
      };

      // Save sync result for history
      await this.saveResult(result);

      console.log(
        `Sync completed: ${successCount}/${results.length} items succeeded`
      );

      // Mark sync as complete
      await AsyncStorage.setItem(SYNC_PROCESSING_KEY, "false");

      return result;
    } catch (error) {
      console.error("Error during sync attempt:", error);

      // Ensure we clear the processing flag even if there's an error
      await AsyncStorage.setItem(SYNC_PROCESSING_KEY, "false");

      const result: SyncResult = {
        timestamp: new Date().toISOString(),
        success: false,
        itemsProcessed: 0,
        itemsSucceeded: 0,
        itemsFailed: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };

      await this.saveResult(result);
      return result;
    }
  }

  /**
   * Save sync result to history
   * @param result The sync result to save
   */
  private static async saveResult(result: SyncResult): Promise<void> {
    try {
      // Get existing results
      const resultsStr = await AsyncStorage.getItem(SYNC_RESULTS_KEY);
      const results: SyncResult[] = resultsStr ? JSON.parse(resultsStr) : [];

      // Add new result (limit to last 10)
      results.unshift(result);
      if (results.length > 10) {
        results.length = 10;
      }

      // Save updated results
      await AsyncStorage.setItem(SYNC_RESULTS_KEY, JSON.stringify(results));
    } catch (error) {
      console.error("Error saving sync result:", error);
    }
  }

  /**
   * Get sync history
   * @returns Array of sync results
   */
  static async getSyncHistory(): Promise<SyncResult[]> {
    try {
      const resultsStr = await AsyncStorage.getItem(SYNC_RESULTS_KEY);
      return resultsStr ? JSON.parse(resultsStr) : [];
    } catch (error) {
      console.error("Error getting sync history:", error);
      return [];
    }
  }

  /**
   * Check if user is authenticated with Google Drive
   * @returns true if authenticated
   */
  private static async checkAuthentication(): Promise<boolean> {
    try {
      // This will depend on how you're handling authentication
      // For GoogleSignin:
      const {
        GoogleSignin,
      } = require("@react-native-google-signin/google-signin");
      const isSignedIn = await GoogleSignin.isSignedIn();

      if (isSignedIn) {
        // Check if token is still valid or refresh it
        try {
          await GoogleSignin.hasPlayServices();
          const tokens = await GoogleSignin.getTokens();
          return !!tokens.accessToken;
        } catch (tokenError) {
          console.error("Error getting Google tokens:", tokenError);
          return false;
        }
      }

      return false;
    } catch (error) {
      console.error("Error checking authentication:", error);
      return false;
    }
  }

  /**
   * Force an immediate sync attempt
   * @returns Result of the sync operation
   */
  static async forceSync(): Promise<SyncResult | null> {
    return this.attemptSync(true);
  }
}
