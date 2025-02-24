import { Platform, StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";

export const fontWeights = {
  regular: "400",
  medium: "500",
  semiBold: "600",
  bold: "700",
} as const;

export const typography = StyleSheet.create({
  // Headings
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  titleCenter: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },

  // Body text
  body: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
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

  // Form elements
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  readOnlyText: {
    fontSize: 16,
    color: "#666",
    padding: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
  },

  // List items
  itemTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },

  // Monospace (for code/data display)
  monospace: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
    }),
    fontSize: 12,
  },
});
