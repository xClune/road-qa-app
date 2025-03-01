import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";

const METADATA_KEY = "project_files_metadata";
const PROJECT_DIR = `${FileSystem.documentDirectory}projects/`;

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
    this.accessToken = accessToken;

    // Ensure project directory exists
    const dirInfo = await FileSystem.getInfoAsync(PROJECT_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(PROJECT_DIR, { intermediates: true });
    }

    return true;
  }

  static async listCSVFiles() {
    try {
      if (!this.accessToken) {
        throw new Error("Not authenticated");
      }

      // Search for CSV files by either mime type OR file extension
      const query = 'mimeType="text/csv" or name contains ".csv"';
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
          query
        )}&fields=files(id,name,modifiedTime,mimeType)`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

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
      if (!this.accessToken) {
        throw new Error("Not authenticated");
      }

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

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

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

  // Add to services/googleDriveService.ts

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
}
