import { StyleSheet } from "react-native";
import { spacing } from "./spacing";

export const buttonStyles = StyleSheet.create({
  // Primary buttons
  primary: {
    backgroundColor: "#007AFF",
    padding: spacing.md,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Secondary buttons
  secondary: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#007AFF",
    padding: spacing.md,
    borderRadius: 8,
    alignItems: "center",
  },
  secondaryText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },

  // Outline buttons
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: spacing.md,
    borderRadius: 8,
    alignItems: "center",
  },
  outlineText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "500",
  },

  // Danger buttons
  danger: {
    backgroundColor: "#DC2626",
    padding: spacing.md,
    borderRadius: 8,
    alignItems: "center",
  },
  dangerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Button states
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.8,
  },

  // Photo buttons
  photoButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  photoButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  photoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    gap: 8,
  },

  // Icon buttons
  iconButton: {
    padding: 8,
  },
  iconButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "500",
  },

  // Submit button - commonly used in forms
  submitButton: {
    backgroundColor: "#007AFF",
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
