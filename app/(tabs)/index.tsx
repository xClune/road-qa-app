import { useEffect, useState } from "react";
import { StyleSheet, Platform, View, Pressable } from "react-native";
import { homeStyles } from "@/styles";
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
      <ThemedView style={homeStyles.container}>
        <ThemedText type="title" style={homeStyles.title}>
          Road Quality Assessment
        </ThemedText>

        <ThemedView style={homeStyles.contentContainer}>
          {!isAuthenticated ? (
            <View style={homeStyles.authContainer}>
              <ThemedText style={homeStyles.description}>
                Please sign in with Google to access your project files.
              </ThemedText>
              <Pressable
                onPress={handleSignIn}
                disabled={isAuthenticating}
                style={({ pressed }) => [
                  homeStyles.signInButton,
                  isAuthenticating && homeStyles.signInButtonDisabled,
                  pressed && homeStyles.signInButtonPressed,
                ]}
              >
                <ThemedText style={homeStyles.signInButtonText}>
                  {isAuthenticating ? "Signing in..." : "Sign in with Google"}
                </ThemedText>
              </Pressable>
              {error && (
                <ThemedText style={homeStyles.errorText}>{error}</ThemedText>
              )}
            </View>
          ) : (
            <>
              <ThemedText type="subtitle">Select Project</ThemedText>
              <ThemedText style={homeStyles.description}>
                Choose a project from Google Drive to begin the road quality
                assessment.
              </ThemedText>

              <CSVFileDropdown
                onSelect={handleProjectSelect}
                label="Select Project File"
              />

              <ThemedText style={homeStyles.hint}>
                Selected project data will be available offline for field
                assessments.
              </ThemedText>

              <Pressable
                onPress={handleSignOut}
                style={homeStyles.signOutButton}
              >
                <ThemedText style={homeStyles.signOutButtonText}>
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
