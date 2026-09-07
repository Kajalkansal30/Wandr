import { Tabs } from "expo-router";
import { Text } from "react-native";
import { colors } from "../../src/theme";

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 11, fontWeight: focused ? "700" : "500", color: focused ? colors.warm700 : colors.warm400 }}>
      {label}
    </Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.cream },
        headerTintColor: colors.warm700,
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.warm200 },
        tabBarActiveTintColor: colors.warm700,
        tabBarInactiveTintColor: colors.warm400,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Discover",
          tabBarLabel: ({ focused }) => <TabLabel label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarLabel: ({ focused }) => <TabLabel label="Map" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="spotted"
        options={{
          title: "Spotted",
          headerShown: false,
          tabBarLabel: ({ focused }) => <TabLabel label="Spotted" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved",
          tabBarLabel: ({ focused }) => <TabLabel label="Saved" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarLabel: ({ focused }) => <TabLabel label="Profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
