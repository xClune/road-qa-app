// services/authService.ts

import { GoogleSignin } from "@react-native-google-signin/google-signin";

// Keep track of initialization state
let isInitialized = false;

export const AuthService = {
  /**
   * Initialize GoogleSignin with proper configuration
   */
  initializeGoogleSignin: () => {
    if (isInitialized) return;

    // Configure GoogleSignin with your app's credentials
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

    isInitialized = true;
    console.log("GoogleSignin has been initialized");
  },

  /**
   * Check if user is currently signed in
   */
  isSignedIn: async () => {
    AuthService.initializeGoogleSignin();
    try {
      const user = await GoogleSignin.getCurrentUser();
      return user !== null;
    } catch (error) {
      console.error("Error checking sign in status:", error);
      return false;
    }
  },

  /**
   * Get current tokens
   */
  getTokens: async () => {
    AuthService.initializeGoogleSignin();
    try {
      return await GoogleSignin.getTokens();
    } catch (error) {
      console.error("Error getting tokens:", error);
      throw error;
    }
  },
};
