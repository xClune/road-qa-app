import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  SectionList,
  ActivityIndicator,
  Text,
  SafeAreaView,
} from "react-native";
import { router } from "expo-router";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { GoogleDriveService } from "@/services/googleDriveService";
import { CSVFileDropdown } from "@/components/CSVFileDropdown";

// Define types for our file objects
interface LocalFile {
  id: string;
  name: string;
  localPath: string;
  lastDownloaded: string;
  modifiedTime: string;
}

interface CloudFile {
  id: string;
  name: string;
  modifiedTime: string;
}

// Define section data type
interface Section {
  title: string;
  data: (LocalFile | CloudFile)[];
  type: "local" | "cloud";
}

export default function HomeScreen() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);
  const [cloudFiles, setCloudFiles] = useState<CloudFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize GoogleDriveService without authentication to enable local file access
    GoogleDriveService.initialize(null)
      .then(() => {
        setIsInitialized(true);
        loadLocalFiles();
      })
      .catch((err) =>
        console.error("Failed to initialize GoogleDriveService:", err)
      );

    GoogleSignin.configure({
      webClientId:
        "913173809303-b3cutrjb7lpvaqmdc8c027jj657f41cn.apps.googleusercontent.com",
      iosClientId:
        "913173809303-ajv61u37gm232vnssubbpdf3a2om9a4r.apps.googleusercontent.com",
      scopes: [
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/drive.metadata.readonly",
        "https://www.googleapis.com/auth/drive",
      ],
    });

    // Check if already signed in using getCurrentUser
    const checkSignIn = async () => {
      try {
        const user = await GoogleSignin.getCurrentUser();
        if (user) {
          await handleSilentSignIn();
        } else {
          setIsLoading(false);
        }
      } catch (err: unknown) {
        console.error("Error checking sign-in status:", err);
        setIsLoading(false);
      }
    };

    // Call the function
    checkSignIn();
  }, []);

  const loadLocalFiles = async () => {
    try {
      const files = await GoogleDriveService.listLocalFiles();
      setLocalFiles(files);
      setIsLoading(false);
    } catch (err) {
      console.error("Error loading local files:", err);
      setIsLoading(false);
    }
  };

  const loadCloudFiles = async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true); // Add loading state

      const files = await GoogleDriveService.listCSVFiles();

      setCloudFiles(files);
    } catch (err) {
      console.error("Error loading cloud files:", err);
      setError("Failed to load cloud files. Please try again.");
    } finally {
      setIsLoading(false); // Clear loading state
    }
  };

  const handleSilentSignIn = async () => {
    try {
      const tokens = await GoogleSignin.getTokens();
      await GoogleDriveService.initialize(tokens.accessToken);
      setIsAuthenticated(true);
      loadCloudFiles();
    } catch (error) {
      console.log("Silent sign-in failed, user needs to sign in manually");
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (isAuthenticating) return;

    try {
      setIsAuthenticating(true);
      setError(null);

      // 1. Sign in with Google
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      // 2. Get the access token
      const tokens = await GoogleSignin.getTokens();

      // 3. Initialize the service with the token
      await GoogleDriveService.initialize(tokens.accessToken);

      // 4. Set authenticated state
      setIsAuthenticated(true);

      // 5. Immediately load files
      try {
        setIsLoading(true);

        const files = await GoogleDriveService.listCSVFiles();

        setCloudFiles(files);
      } catch (fileError) {
        console.error("Failed to load cloud files:", fileError);
        setError("Failed to load files. Please try again.");
      } finally {
        setIsLoading(false);
      }
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : "An unknown error occurred";
      setError(errorMessage);
      console.error("Sign-in error:", e);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
      setIsAuthenticated(false);
      setCloudFiles([]);

      // Re-initialize with null token to maintain local access
      await GoogleDriveService.initialize(null);
    } catch (e) {
      console.error("Sign-out error:", e);
    }
  };

  const handleProjectSelect = async (
    file: LocalFile | CloudFile,
    localPath?: string
  ) => {
    try {
      // If it's a cloud file without a local path, download it first
      if (!localPath && isAuthenticated) {
        setIsLoading(true);
        localPath = await GoogleDriveService.downloadFile(file.id, file.name);
        // Refresh local files list after download
        loadLocalFiles();
      }

      if (localPath) {
        router.push({
          pathname: "/(modals)/testpoint",
          params: {
            projectId: file.id,
            projectName: file.name,
            localPath,
          },
        });
      } else {
        setError(
          "Cannot access this file offline. Please connect to download it first."
        );
      }
    } catch (error) {
      console.error("Error handling project selection:", error);
      setError("Failed to open project file.");
    } finally {
      setIsLoading(false);
    }
  };

  // Create section data for SectionList
  const getSections = (): Section[] => {
    const sections: Section[] = [];

    if (localFiles.length > 0) {
      sections.push({
        title: "Locally Available Projects",
        data: localFiles,
        type: "local",
      });
    }

    if (isAuthenticated && cloudFiles.length > 0) {
      sections.push({
        title: "Cloud Projects",
        data: cloudFiles,
        type: "cloud",
      });
    }

    return sections;
  };

  // For rendering empty state when no files are found
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      {!isLoading && (
        <>
          <ThemedText style={styles.emptyText}>
            No project files found
          </ThemedText>
          {!isAuthenticated && (
            <ThemedText style={styles.hintText}>
              Sign in to download project files for offline use
            </ThemedText>
          )}
        </>
      )}
    </View>
  );

  if (!isInitialized || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>
          {!isInitialized ? "Initializing app..." : "Loading projects..."}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <ThemedView style={styles.container}>
        <SectionList
          sections={getSections()}
          keyExtractor={(item) => item.id}
          renderItem={({ item, section }) => (
            <Pressable
              style={styles.fileItem}
              onPress={() => {
                if (section.type === "local") {
                  handleProjectSelect(item, (item as LocalFile).localPath);
                } else {
                  handleProjectSelect(item);
                }
              }}
            >
              <ThemedText style={styles.fileName}>{item.name}</ThemedText>
              <ThemedText style={styles.fileDetails}>
                {section.type === "local"
                  ? `Last downloaded: ${new Date(
                      (item as LocalFile).lastDownloaded
                    ).toLocaleDateString()}`
                  : `Modified: ${new Date(
                      item.modifiedTime
                    ).toLocaleDateString()}`}
              </ThemedText>
            </Pressable>
          )}
          renderSectionHeader={({ section: { title } }) => (
            <ThemedText style={styles.sectionHeader}>{title}</ThemedText>
          )}
          ListHeaderComponent={() => (
            <View style={styles.headerContainer}>
              <ThemedText type="title" style={styles.title}>
                Road Quality Assessment
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Access your project files and collect road quality data in the
                field
              </ThemedText>
            </View>
          )}
          ListFooterComponent={() => (
            <View style={styles.authContainer}>
              {error && (
                <ThemedText style={styles.errorText}>{error}</ThemedText>
              )}

              {!isAuthenticated ? (
                <>
                  <ThemedText type="subtitle" style={styles.authTitle}>
                    Access Cloud Files
                  </ThemedText>
                  <ThemedText style={styles.description}>
                    Sign in with Google to download project files for offline
                    use.
                  </ThemedText>
                  <Pressable
                    onPress={handleSignIn}
                    disabled={isAuthenticating}
                    style={({ pressed }) => [
                      styles.signInButton,
                      isAuthenticating && styles.signInButtonDisabled,
                      pressed && styles.signInButtonPressed,
                    ]}
                  >
                    <ThemedText style={styles.signInButtonText}>
                      {isAuthenticating
                        ? "Signing in..."
                        : "Sign in with Google"}
                    </ThemedText>
                  </Pressable>
                </>
              ) : (
                <>
                  <ThemedText type="subtitle" style={styles.authTitle}>
                    Download New Project
                  </ThemedText>
                  <ThemedText style={styles.description}>
                    Select a project from Google Drive to download for offline
                    use.
                  </ThemedText>

                  {/* Add the CSVFileDropdown component back */}
                  <CSVFileDropdown
                    onSelect={handleProjectSelect}
                    label="Select Project File"
                    files={cloudFiles} // Pass the files we loaded in loadCloudFiles()
                    loading={isLoading} // Pass the loading state
                  />

                  <Pressable
                    style={[styles.testButton, { marginTop: 10 }]}
                    onPress={async () => {
                      try {
                        const token = (await GoogleSignin.getTokens())
                          .accessToken;

                        // Simple query for all files
                        const response = await fetch(
                          "https://www.googleapis.com/drive/v3/files?fields=files(id,name,mimeType)",
                          {
                            headers: {
                              Authorization: `Bearer ${token}`,
                            },
                          }
                        );

                        const data = await response.json();
                      } catch (err: unknown) {
                        console.error("API test error:", err);
                        alert(
                          `Test failed: ${
                            err instanceof Error ? err.message : String(err)
                          }`
                        );
                      }
                    }}
                  >
                    <ThemedText style={{ color: "#fff" }}>
                      Check All Files
                    </ThemedText>
                  </Pressable>

                  <ThemedText style={styles.hint}>
                    Selected project data will be available offline for field
                    assessments.
                  </ThemedText>
                  <Pressable
                    onPress={handleSignOut}
                    style={styles.signOutButton}
                  >
                    <ThemedText style={styles.signOutButtonText}>
                      Sign Out
                    </ThemedText>
                  </Pressable>
                </>
              )}
            </View>
          )}
          ListEmptyComponent={renderEmptyComponent}
          contentContainerStyle={styles.listContent}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  testButton: {
    backgroundColor: "#4e8d7c",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  safeAreaContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    paddingVertical: 6,
  },
  fileItem: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  fileName: {
    fontSize: 16,
    fontWeight: "500",
  },
  fileDetails: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  hintText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
  },
  authContainer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  authTitle: {
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
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
    marginBottom: 16,
    textAlign: "center",
  },
  hint: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 16,
    textAlign: "center",
  },
  signOutButton: {
    padding: 10,
    backgroundColor: "#ef4444",
    borderRadius: 8,
  },
  signOutButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
});
