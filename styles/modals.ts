import { StyleSheet } from "react-native";
import { spacing } from "./spacing";

export const modalStyles = StyleSheet.create({
  // Modal container
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  // Modal header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "500",
  },

  // Modal content
  content: {
    padding: spacing.md,
  },

  // Action row at the bottom
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },

  // For modal dialogs
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  dialog: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
});
