import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";

const METADATA_KEY = "project_files_metadata";
const PROJECT_DIR = `${FileSystem.documentDirectory}projects/`;
const TOKEN_STORAGE_KEY = "google_drive_access_token";

interface FileMetadata {
  id: string;
  name: string;
  modifiedTime: string;
  localPath: string;
  lastDownloaded: string;
  version: number;
}

export class GoogleDriveService {
  private static accessToken: string | null = null;

  static async initialize(accessToken: string | null) {
    // Update the in-memory token
    this.accessToken = accessToken;

    // If token provided, save to persistent storage
    if (accessToken) {
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
    } else {
      // Try to load from persistent storage if not provided
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        if (storedToken) {
          this.accessToken = storedToken;
        }
      } catch (error) {
        console.error("Error loading stored token:", error);
      }
    }

    // Ensure project directory exists
    const dirInfo = await FileSystem.getInfoAsync(PROJECT_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(PROJECT_DIR, { intermediates: true });
    }

    return true;
  }

  static async ensureAuthenticated(): Promise<boolean> {
    // If we already have a token, assume it's valid for now
    if (this.accessToken) {
      return true;
    }

    // Try to get token from persistent storage first
    try {
      const storedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      if (storedToken) {
        this.accessToken = storedToken;
        return true;
      }
    } catch (error) {
      console.error("Error loading stored token:", error);
    }

    // If no stored token, try to get fresh token from GoogleSignin
    try {
      // Import GoogleSignin directly from the package
      const GoogleSignin =
        require("@react-native-google-signin/google-signin").GoogleSignin;

      // Check if GoogleSignin is properly initialized
      if (!GoogleSignin || typeof GoogleSignin.isSignedIn !== "function") {
        console.error("GoogleSignin is not properly initialized");
        return false;
      }

      const isSignedIn = await GoogleSignin.isSignedIn();

      if (isSignedIn) {
        const tokens = await GoogleSignin.getTokens();
        if (tokens.accessToken) {
          this.accessToken = tokens.accessToken;
          await AsyncStorage.setItem(TOKEN_STORAGE_KEY, tokens.accessToken);
          return true;
        }
      }
    } catch (error) {
      console.error("Error refreshing Google token:", error);
    }

    return false;
  }

  static async makeAuthenticatedRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    // First ensure we have a token
    await this.ensureAuthenticated();

    // If we still don't have a token after trying to refresh, fail early
    if (!this.accessToken) {
      throw new Error("Not authenticated");
    }

    // Clone the options to avoid mutating the input
    const requestOptions = {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${this.accessToken}`,
      },
    };

    // Make the request
    let response = await fetch(url, requestOptions);

    // If unauthorized, our token might be expired
    if (response.status === 401) {
      console.log("API request received 401 - attempting token refresh");

      // Clear current token
      this.accessToken = null;
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);

      // Try to get a fresh token from GoogleSignin
      try {
        // Import GoogleSignin directly
        const GoogleSignin =
          require("@react-native-google-signin/google-signin").GoogleSignin;

        // Check if GoogleSignin is properly initialized
        if (!GoogleSignin || typeof GoogleSignin.isSignedIn !== "function") {
          console.error("GoogleSignin is not properly initialized");
          return response;
        }

        // Check if still signed in
        const isSignedIn = await GoogleSignin.isSignedIn();
        if (isSignedIn) {
          // Try to get fresh tokens
          await GoogleSignin.clearCachedAccessToken();
          const tokens = await GoogleSignin.getTokens();

          if (tokens.accessToken) {
            // Update our token
            this.accessToken = tokens.accessToken;
            await AsyncStorage.setItem(TOKEN_STORAGE_KEY, tokens.accessToken);

            // Retry the request with new token
            requestOptions.headers.Authorization = `Bearer ${this.accessToken}`;
            response = await fetch(url, requestOptions);

            console.log("API request retried with refreshed token");
          }
        }
      } catch (refreshError) {
        console.error("Failed to refresh token:", refreshError);
        // Let the original 401 response propagate
      }
    }

    return response;
  }

  static async listCSVFiles() {
    try {
      // Search for CSV files by either mime type OR file extension
      const query = 'mimeType="text/csv" or name contains ".csv"';
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        query
      )}&fields=files(id,name,modifiedTime,mimeType)`;

      // Use the new utility method instead of direct fetch
      const response = await this.makeAuthenticatedRequest(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `GoogleDriveService: API error ${response.status}:`,
          errorText
        );
        throw new Error(`Failed to fetch CSV files: ${response.status}`);
      }

      const data = await response.json();
      console.log(
        `GoogleDriveService: Found ${
          data.files?.length || 0
        } files matching query`
      );

      return data.files;
    } catch (error) {
      console.error("GoogleDriveService: Error listing CSV files:", error);
      throw error;
    }
  }

  static async downloadFile(fileId: string, fileName: string): Promise<string> {
    try {
      // Check if we already have this file
      const metadata = await this.getFileMetadata(fileId);
      if (metadata) {
        // Check if file exists and is recent (within 24 hours)
        const fileInfo = await FileSystem.getInfoAsync(metadata.localPath);
        if (fileInfo.exists) {
          const timeSinceDownload =
            Date.now() - new Date(metadata.lastDownloaded).getTime();
          if (timeSinceDownload < 24 * 60 * 60 * 1000) {
            // 24 hours
            return metadata.localPath;
          }
        }
      }

      // Use the new utility method
      const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      const response = await this.makeAuthenticatedRequest(url);

      if (!response.ok) {
        throw new Error("Failed to download file");
      }

      // Create unique filename with timestamp
      const timestamp = new Date().toISOString().split("T")[0];
      const localFileName = `${fileName.replace(/\s+/g, "_")}_${timestamp}.csv`;
      const localPath = `${PROJECT_DIR}${localFileName}`;

      // Save file
      const fileContent = await response.text();
      await FileSystem.writeAsStringAsync(localPath, fileContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Update metadata
      await this.updateFileMetadata({
        id: fileId,
        name: fileName,
        modifiedTime: new Date().toISOString(),
        localPath,
        lastDownloaded: new Date().toISOString(),
        version: (metadata?.version ?? 0) + 1,
      });

      return localPath;
    } catch (error) {
      console.error("Error downloading file:", error);
      throw error;
    }
  }

  private static async getFileMetadata(
    fileId: string
  ): Promise<FileMetadata | null> {
    try {
      const metadata = await AsyncStorage.getItem(METADATA_KEY);
      if (!metadata) return null;

      const files: Record<string, FileMetadata> = JSON.parse(metadata);
      return files[fileId] || null;
    } catch (error) {
      console.error("Error getting file metadata:", error);
      return null;
    }
  }

  private static async updateFileMetadata(metadata: FileMetadata) {
    try {
      const existingMetadata = await AsyncStorage.getItem(METADATA_KEY);
      const files: Record<string, FileMetadata> = existingMetadata
        ? JSON.parse(existingMetadata)
        : {};

      files[metadata.id] = metadata;
      await AsyncStorage.setItem(METADATA_KEY, JSON.stringify(files));
    } catch (error) {
      console.error("Error updating file metadata:", error);
      throw error;
    }
  }

  static async cleanupOldFiles() {
    try {
      const metadata = await AsyncStorage.getItem(METADATA_KEY);
      if (!metadata) return;

      const files: Record<string, FileMetadata> = JSON.parse(metadata);
      const now = Date.now();
      const keepFiles: Record<string, FileMetadata> = {};

      // Keep only the most recent version of each file within last 7 days
      for (const [fileId, file] of Object.entries(files)) {
        const fileAge = now - new Date(file.lastDownloaded).getTime();
        if (fileAge < 7 * 24 * 60 * 60 * 1000) {
          // 7 days
          if (!keepFiles[fileId] || keepFiles[fileId].version < file.version) {
            keepFiles[fileId] = file;
          }
        } else {
          // Delete old file
          try {
            await FileSystem.deleteAsync(file.localPath);
          } catch (error) {
            console.warn("Error deleting old file:", error);
          }
        }
      }

      await AsyncStorage.setItem(METADATA_KEY, JSON.stringify(keepFiles));
    } catch (error) {
      console.error("Error cleaning up files:", error);
    }
  }

  static async listLocalFiles() {
    try {
      const metadata = await AsyncStorage.getItem(METADATA_KEY);
      if (!metadata) return [];

      const files = JSON.parse(metadata);
      const localFiles = [];

      // Convert object to array and filter to ensure files exist
      for (const fileId in files) {
        const file = files[fileId];
        // Check if the file actually exists locally
        const fileInfo = await FileSystem.getInfoAsync(file.localPath);
        if (fileInfo.exists) {
          localFiles.push({
            id: file.id,
            name: file.name,
            modifiedTime: file.modifiedTime,
            localPath: file.localPath,
            lastDownloaded: file.lastDownloaded,
          });
        }
      }

      // Sort by last downloaded time, newest first
      return localFiles.sort(
        (a, b) =>
          new Date(b.lastDownloaded).getTime() -
          new Date(a.lastDownloaded).getTime()
      );
    } catch (error) {
      console.error("Error listing local files:", error);
      return [];
    }
  }

  static async uploadFile(
    filePath: string,
    driveFileId: string | null = null,
    fileName: string | null = null
  ): Promise<{ fileId: string; status: string }> {
    try {
      // Read the file content
      const fileContent = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Determine the file name if not provided
      const actualFileName =
        fileName || filePath.split("/").pop() || "updated_file.csv";

      // Set up request metadata
      const metadata = {
        name: actualFileName,
        mimeType: "text/csv",
      };

      if (driveFileId) {
        // Update existing file
        const url = `https://www.googleapis.com/upload/drive/v3/files/${driveFileId}?uploadType=multipart`;
        const options = {
          method: "PATCH",
          headers: {
            "Content-Type": "multipart/form-data;boundary=boundary",
          },
          body: this.createMultipartBody(metadata, fileContent),
        };

        // Use the utility method
        const response = await this.makeAuthenticatedRequest(url, options);

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error updating file on Drive:", errorData);
          throw new Error(`Failed to update file: ${response.status}`);
        }

        const data = await response.json();
        console.log("File updated successfully:", data);
        return { fileId: driveFileId, status: "updated" };
      } else {
        // Create new file
        const url =
          "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
        const options = {
          method: "POST",
          headers: {
            "Content-Type": "multipart/form-data;boundary=boundary",
          },
          body: this.createMultipartBody(metadata, fileContent),
        };

        // Use the utility method
        const response = await this.makeAuthenticatedRequest(url, options);

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error creating file on Drive:", errorData);
          throw new Error(`Failed to create file: ${response.status}`);
        }

        const data = await response.json();
        console.log("File created successfully:", data);
        return { fileId: data.id, status: "created" };
      }
    } catch (error) {
      console.error("Error uploading file to Google Drive:", error);
      throw error;
    }
  }

  /**
   * Creates a multipart body for file upload
   * @param metadata File metadata
   * @param content File content
   * @returns Multipart body string
   */
  private static createMultipartBody(metadata: any, content: string): string {
    const metadataPart = JSON.stringify(metadata);

    // Boundary used to separate parts in multipart request
    const boundary = "boundary";

    // Construct multipart body with metadata and file content
    return [
      `--${boundary}`,
      "Content-Type: application/json; charset=UTF-8",
      "",
      metadataPart,
      `--${boundary}`,
      "Content-Type: text/csv",
      "",
      content,
      `--${boundary}--`,
    ].join("\r\n");
  }

  /**
   * Processes the sync queue and uploads pending changes
   * @returns Array of results for each processed item
   */
  static async processSyncQueue(): Promise<
    Array<{ success: boolean; fileId?: string; error?: string }>
  > {
    try {
      // First ensure we have a valid token
      const authenticated = await this.ensureAuthenticated();
      if (!authenticated) {
        console.log("Not authenticated, skipping sync queue processing");
        return [];
      }

      const queueKey = "qa_submission_queue";
      const queueString = await AsyncStorage.getItem(queueKey);

      if (!queueString) {
        console.log("No items in sync queue");
        return [];
      }

      const queue = JSON.parse(queueString);
      const results = [];
      const newQueue = [];

      // Process each item in the queue
      for (const item of queue) {
        try {
          // Check if the file exists
          const fileInfo = await FileSystem.getInfoAsync(item.filePath);
          if (!fileInfo.exists) {
            results.push({
              success: false,
              error: `File not found: ${item.filePath}`,
            });
            continue;
          }

          // Extract the Drive file ID from metadata
          const fileName = item.filePath.split("/").pop();
          const metadata = await this.getFileMetadataByPath(item.filePath);

          if (!metadata || !metadata.id) {
            results.push({
              success: false,
              error: `Cannot find Drive file ID for: ${item.filePath}`,
            });
            // Keep in queue for later retry
            newQueue.push(item);
            continue;
          }

          // Upload the file
          const uploadResult = await this.uploadFile(
            item.filePath,
            metadata.id,
            metadata.name
          );

          results.push({
            success: true,
            fileId: uploadResult.fileId,
          });

          console.log(`Synced changes for test point ${item.testPoint}`);
        } catch (error) {
          console.error("Error processing queue item:", error);
          results.push({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
          // Keep failed items in the queue for retry
          newQueue.push(item);
        }
      }

      // Update the queue with remaining items
      if (newQueue.length > 0) {
        await AsyncStorage.setItem(queueKey, JSON.stringify(newQueue));
      } else {
        await AsyncStorage.removeItem(queueKey);
      }

      return results;
    } catch (error) {
      console.error("Error processing sync queue:", error);
      throw error;
    }
  }

  /**
   * Get file metadata by local file path
   * @param localPath Path to local file
   * @returns FileMetadata or null if not found
   */
  private static async getFileMetadataByPath(
    localPath: string
  ): Promise<FileMetadata | null> {
    try {
      const metadata = await AsyncStorage.getItem(METADATA_KEY);
      if (!metadata) return null;

      const files: Record<string, FileMetadata> = JSON.parse(metadata);

      // Find the file by path
      for (const fileId in files) {
        if (files[fileId].localPath === localPath) {
          return files[fileId];
        }
      }

      return null;
    } catch (error) {
      console.error("Error getting file metadata by path:", error);
      return null;
    }
  }

  /**
   * Returns the number of items in the sync queue
   * @returns Number of pending sync items
   */
  static async getSyncQueueSize(): Promise<number> {
    try {
      const queueKey = "qa_submission_queue";
      const queueString = await AsyncStorage.getItem(queueKey);
      if (!queueString) return 0;

      const queue = JSON.parse(queueString);
      return queue.length;
    } catch (error) {
      console.error("Error getting sync queue size:", error);
      return 0;
    }
  }

  /**
   * Upload a local file to Google Drive using its local path
   * @param localPath The local path of the file to upload
   * @returns Result of the upload operation
   */
  static async uploadFileByPath(
    localPath: string
  ): Promise<{ fileId: string; status: string }> {
    try {
      // First ensure we have a valid token
      const authenticated = await this.ensureAuthenticated();
      if (!authenticated) {
        throw new Error("Not authenticated");
      }

      // Use the private method to get metadata
      const metadata = await this.getFileMetadataByPath(localPath);

      if (!metadata || !metadata.id) {
        throw new Error("File metadata not found for path: " + localPath);
      }

      // Upload the file using the existing method
      return await this.uploadFile(localPath, metadata.id, metadata.name);
    } catch (error) {
      console.error("Error uploading file by path:", error);
      throw error;
    }
  }
}
