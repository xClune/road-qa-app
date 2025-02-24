import { StyleSheet } from "react-native";
import { spacing } from "./spacing";

export const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },

  header: {
    marginBottom: spacing.md,
  },

  content: {
    marginVertical: spacing.sm,
  },

  footer: {
    marginTop: spacing.md,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },

  // List item cards
  listItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#fff",
  },

  // Info cards for displaying read-only data
  infoCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  // Detail cards with multiple lines of info
  detailCard: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#fff",
  },

  // Point item from testpoint.tsx
  pointItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#fff",
  },
});
