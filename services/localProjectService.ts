// NEW: localProjectService.ts
export class LocalProjectService {
    // Metadata about downloaded projects
    static async getLocalProjects() {
      try {
        const metadata = await AsyncStorage.getItem('project_files_metadata');
        if (!metadata) return [];
  
        const files = JSON.parse(metadata);
        // Verify files still exist on device
        const localFiles = [];
        
        for (const file of Object.values(files)) {
          const fileExists = await FileSystem.getInfoAsync(file.localPath);
          if (fileExists.exists) {
            localFiles.push(file);
          }
        }
        
        return localFiles;
      } catch (error) {
        console.error('Error getting local projects:', error);
        return [];
      }
    }
  
    // Save metadata when a new project is downloaded via GoogleDriveService
    static async saveProjectMetadata(projectInfo: {
      id: string;
      name: string;
      localPath: string;
    }) {
      try {
        const existingMetadata = await AsyncStorage.getItem('project_files_metadata');
        const projects = existingMetadata ? JSON.parse(existingMetadata) : {};
        
        projects[projectInfo.id] = {
          ...projectInfo,
          downloadedAt: new Date().toISOString()
        };
  
        await AsyncStorage.setItem('project_files_metadata', JSON.stringify(projects));
      } catch (error) {
        console.error('Error saving project metadata:', error);
        throw error;
      }
    }
  }