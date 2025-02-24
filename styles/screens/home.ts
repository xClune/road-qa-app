import { StyleSheet } from "react-native";
import { spacing } from "../spacing";

export const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
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
