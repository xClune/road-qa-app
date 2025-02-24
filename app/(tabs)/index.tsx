// app/(tabs)/index.tsx
import { useEffect, useState } from "react";
import { StyleSheet, Platform, View } from "react-native";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { CSVFileDropdown } from "@/components/CSVFileDropdown";
import { GoogleDriveService } from "@/services/googleDriveService";
// NEW IMPORT
import { LocalProjectService } from "@/services/localProjectService";

WebBrowser.maybeCompleteAuthSession();

export default function HomeScreen() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // NEW STATE
  const [offlineProjects, setOfflineProjects] = useState([]);

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: "913173809303-ajv61u37gm232vnssubbpdf3a2om9a4r.apps.googleusercontent.com",
    webClientId: "913173809303-b3cutrjb7lpvaqmdc8c027jj657f41cn.apps.googleusercontent.com",
    redirectUri: "https://auth.expo.io/@your-username/roadqa",
  });

  // NEW EFFECT
  useEffect(() => {
    loadOfflineProjects();
  }, []);

  useEffect(() => {
    if (response?.type === "success") {
      setIsAuthenticated(true);
      if (response.authentication?.accessToken) {
        GoogleDriveService.initialize(response.authentication.accessToken);
      }
    }
  }, [response]);

  // NEW FUNCTION
  const loadOfflineProjects = async () => {
    const projects = await LocalProjectService.getLocalProjects();
    setOfflineProjects(projects);
  };

  // MODIFIED FUNCTION
  const handleProjectSelect = async (
    file: { id: string; name: string; modifiedTime: string },
    isFromDrive: boolean
  ) => {
    try {
      let localPath;
      
      if (isFromDrive) {
        // Download new project from Drive
        localPath = await GoogleDriveService.downloadFile(file.id, file.name);
        await LocalProjectService.saveProjectMetadata({
          id: file.id,
          name: file.name,
          localPath,
        });
        await loadOfflineProjects(); // Refresh offline list
      } else {
        // Use existing local path
        const projects = await LocalProjectService.getLocalProjects();
        const project = projects.find(p => p.id === file.id);
        if (!project) {
          throw new Error("Local project not found");
        }
        localPath = project.localPath;
      }

      router.push({
        pathname: "/(modals)/testpoint",
        params: {
          projectId: file.id,
          projectName: file.name,
          localPath,
        },
      });
    } catch (error) {
      console.error("Error handling project selection:", error);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={<View style={{ height: 200, backgroundColor: "#ccc" }} />}
    >
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          Road Quality Assessment
        </ThemedText>

        <ThemedView style={styles.contentContainer}>
          {/* NEW SECTION - Always show offline projects */}
          {offlineProjects.length > 0 && (
            <View style={styles.section}>
              <ThemedText type="subtitle">Available Projects</ThemedText>
              <CSVFileDropdown
                files={offlineProjects}
                onSelect={(file) => handleProjectSelect(file, false)}
                label="Select Project"
              />
              <ThemedText style={styles.hint}>
                These projects are available offline
              </ThemedText>
            </View>
          )}

          {/* MODIFIED SECTION - Only show when authenticated */}
          {isAuthenticated ? (
            <View style={styles.section}>
              <ThemedText type="subtitle">Download New Project</ThemedText>
              <CSVFileDropdown
                onSelect={(file) => handleProjectSelect(file, true)}
                label="Select from Drive"
              />
            </View>
          ) : (
            <View style={styles.authContainer}>
              <ThemedText style={styles.description}>
                Sign in to download new projects
              </ThemedText>
              <ThemedText
                style={styles.signInButton}
                onPress={() => promptAsync()}
              >
                Sign in with Google
              </ThemedText>
            </View>
          )}
        </ThemedView>
      </ThemedView>
    </ParallaxScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 32,
  },
  contentContainer: {
    gap: 16,
  },
  description: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    marginTop: 8,
  },
  authContainer: {
    alignItems: "center",
    gap: 16,
  },
  signInButton: {
    backgroundColor: "#4285F4",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    opacity: 1,
  },
  signInButtonDisabled: {
    opacity: 0.6,
  },
  signInButtonPressed: {
    opacity: 0.8,
  },
  signInButtonText: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
  },
  errorText: {
    color: "#dc2626",
    marginTop: 8,
    textAlign: "center",
  },
  signOutButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#ef4444",
    borderRadius: 8,
  },
  signOutButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
});
