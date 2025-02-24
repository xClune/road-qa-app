import { useEffect, useState } from "react";
import { StyleSheet, Platform, View, Pressable } from "react-native";
import { router } from "expo-router";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { CSVFileDropdown } from "@/components/CSVFileDropdown";
import { GoogleDriveService } from "@/services/googleDriveService";

export default function HomeScreen() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        "913173809303-b3cutrjb7lpvaqmdc8c027jj657f41cn.apps.googleusercontent.com",
      iosClientId:
        "913173809303-ajv61u37gm232vnssubbpdf3a2om9a4r.apps.googleusercontent.com",
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    });
  }, []);

  const handleSignIn = async () => {
    if (isAuthenticating) return;

    try {
      setIsAuthenticating(true);
      setError(null);

      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();

      await GoogleDriveService.initialize(tokens.accessToken);
      setIsAuthenticated(true);
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
    } catch (e) {
      console.error("Sign-out error:", e);
    }
  };

  const handleProjectSelect = async (
    file: { id: string; name: string; modifiedTime: string },
    localPath: string
  ) => {
    try {
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
          {!isAuthenticated ? (
            <View style={styles.authContainer}>
              <ThemedText style={styles.description}>
                Please sign in with Google to access your project files.
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
                  {isAuthenticating ? "Signing in..." : "Sign in with Google"}
                </ThemedText>
              </Pressable>
              {error && (
                <ThemedText style={styles.errorText}>{error}</ThemedText>
              )}
            </View>
          ) : (
            <>
              <ThemedText type="subtitle">Select Project</ThemedText>
              <ThemedText style={styles.description}>
                Choose a project from Google Drive to begin the road quality
                assessment.
              </ThemedText>

              <CSVFileDropdown
                onSelect={handleProjectSelect}
                label="Select Project File"
              />

              <ThemedText style={styles.hint}>
                Selected project data will be available offline for field
                assessments.
              </ThemedText>

              <Pressable onPress={handleSignOut} style={styles.signOutButton}>
                <ThemedText style={styles.signOutButtonText}>
                  Sign Out
                </ThemedText>
              </Pressable>
            </>
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
