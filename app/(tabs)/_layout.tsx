// Updated app/(tabs)/_layout.tsx with Sync tab
import { Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
import { Platform, View, Text } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { getSyncStatus } from "@/services/sheetService"; // Import getSyncStatus

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [pendingCount, setPendingCount] = useState(0);

  // Periodically check for pending sync items
  useEffect(() => {
    const checkSyncStatus = async () => {
      try {
        const status = await getSyncStatus();
        setPendingCount(status.pendingCount);
      } catch (error) {
        console.error("Error checking sync status:", error);
      }
    };

    // Check on mount
    checkSyncStatus();

    // Set up interval to check periodically
    const intervalId = setInterval(checkSyncStatus, 60000); // Every minute

    return () => clearInterval(intervalId);
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: "absolute",
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Road Select",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="map.fill" color={color} />
          ),
        }}
      />

      {/* Add Sync tab */}
      <Tabs.Screen
        name="sync"
        options={{
          title: "Sync",
          tabBarIcon: ({ color }) => (
            <View>
              <IconSymbol size={28} name="arrow.down.app" color={color} />
              {pendingCount > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -5,
                    right: -5,
                    backgroundColor: "#EF4444",
                    borderRadius: 10,
                    minWidth: 20,
                    height: 20,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: 12,
                      fontWeight: "bold",
                    }}
                  >
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
