import { Stack } from "expo-router";

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Back",
        headerTitleAlign: "center",
      }}
    >
      <Stack.Screen
        name="testpoint"
        options={{
          title: "Test Point Selection",
          headerBackTitle: "Projects",
        }}
      />
      <Stack.Screen
        name="qaform"
        options={{
          title: "QA Form",
          headerBackTitle: "Test Points",
        }}
      />
    </Stack>
  );
}
