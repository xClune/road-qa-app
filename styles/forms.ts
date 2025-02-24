import { StyleSheet, Platform } from "react-native";
import { spacing } from "./spacing";

export const formStyles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },

  // Form fields
  field: {
    marginBottom: spacing.md,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  readOnlyField: {
    marginBottom: spacing.sm,
  },

  // Inputs
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: Platform.OS === "ios" ? 12 : 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  inputError: {
    borderColor: "#DC2626",
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: "top",
  },

  // Dropdown elements
  dropdownButton: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
  },
  dropdownButtonText: {
    fontSize: 16,
    color: "#333",
  },

  // Validation
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    marginTop: 4,
  },

  // Radio/checkbox
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
    color: "#333",
  },
});
