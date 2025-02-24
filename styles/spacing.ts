import { Platform } from "react-native";

// Standard spacing values
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Layout constants
export const layout = {
  borderRadius: 8,
  buttonHeight: 48,
  inputHeight: Platform.OS === "ios" ? 48 : 44,
  headerHeight: 60,
  tabBarHeight: 60,
};

// Common paddings
export const padding = {
  screen: {
    horizontal: spacing.md,
    vertical: spacing.md,
  },
  card: {
    horizontal: spacing.md,
    vertical: spacing.md,
  },
  input: {
    horizontal: spacing.md,
    vertical: Platform.OS === "ios" ? spacing.sm + 2 : spacing.sm,
  },
};

// Function to generate custom spacing
export const getSpacing = (multiplier: number) => spacing.md * multiplier;
