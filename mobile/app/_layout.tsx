import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../src/context/AuthContext";
import { colors } from "../src/theme";

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.cream },
          headerTintColor: colors.warm700,
          contentStyle: { backgroundColor: colors.cream },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: "Sign in" }} />
        <Stack.Screen name="signup" options={{ title: "Create account" }} />
        <Stack.Screen name="forgot" options={{ title: "Forgot password" }} />
        <Stack.Screen name="verify" options={{ title: "Verify email" }} />
        <Stack.Screen name="place/[id]" options={{ title: "Place" }} />
        <Stack.Screen name="create-spot" options={{ title: "New spot" }} />
        <Stack.Screen
          name="record-spot"
          options={{ title: "Record", headerShown: false, presentation: "fullScreenModal" }}
        />
        <Stack.Screen name="owner/index" options={{ title: "Business" }} />
        <Stack.Screen name="owner/analytics" options={{ title: "Analytics" }} />
        <Stack.Screen name="owner/boosts" options={{ title: "Boosts" }} />
        <Stack.Screen name="owner/claims" options={{ title: "Claims" }} />
        <Stack.Screen name="owner/edit/[id]" options={{ title: "Edit listing" }} />
        <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
        <Stack.Screen name="submit" options={{ title: "Submit a place" }} />
      </Stack>
    </AuthProvider>
  );
}
