import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { registerPushToken } from "./api/notifications";

/**
 * Registers an Expo push token with the API when running on a physical device
 * with a real EAS projectId. No-ops in Expo Go / simulators / missing projectId.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const projectId =
    Constants.easConfig?.projectId ||
    (Constants.expoConfig?.extra as any)?.eas?.projectId;
  if (!projectId || String(projectId).includes("replace-with")) {
    return null;
  }

  try {
    // Lazy require so Expo Go without the native module still loads the app.
    const Notifications = await import("expo-notifications");
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return null;

    const tokenRes = await Notifications.getExpoPushTokenAsync({ projectId: String(projectId) });
    const token = tokenRes.data;
    await registerPushToken(token, Platform.OS);
    return token;
  } catch {
    return null;
  }
}
