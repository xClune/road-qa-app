import * as FileSystem from "expo-file-system";

const PROJECT_DIR = `${FileSystem.documentDirectory}projects/`;

export class GoogleDriveService {
  private static accessToken: string | null = null;

  static async initialize(accessToken: string) {
    this.accessToken = accessToken;

    // Ensure project directory exists
    const dirInfo = await FileSystem.getInfoAsync(PROJECT_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(PROJECT_DIR, { intermediates: true });
    }
  }

  // SIMPLIFIED: Only lists files from Drive
  static async listCSVFiles() {
    try {
      if (!this.accessToken) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(
        'https://www.googleapis.com/drive/v3/files?q=mimeType="text/csv"&fields=files(id,name,modifiedTime)',
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch CSV files");
      }

      const data = await response.json();
      return data.files;
    } catch (error) {
      console.error("Error listing CSV files:", error);
      throw error;
    }
  }

  // SIMPLIFIED: Just downloads file and returns path
  static async downloadFile(fileId: string, fileName: string): Promise<string> {
    try {
      if (!this.accessToken) {
        throw new Error("Not authenticated");
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

      return localPath;
    } catch (error) {
      console.error("Error downloading file:", error);
      throw error;
    }
  }
}