// lib/push.ts  (TEMPORARY DEBUG — aalisin natin ang Alerts pag-ayos na)
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Alert, Platform } from "react-native";
import { api } from "./api";

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let NotificationsMod: typeof import("expo-notifications") | null = null;
let DeviceMod: typeof import("expo-device") | null = null;
let handlerSet = false;

function loadNotifications(): typeof import("expo-notifications") | null {
  if (isExpoGo) return null;
  if (!NotificationsMod) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    NotificationsMod = require("expo-notifications");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    DeviceMod = require("expo-device");
  }
  if (NotificationsMod && !handlerSet) {
    NotificationsMod.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    handlerSet = true;
  }
  return NotificationsMod;
}

export async function getExpoPushToken(): Promise<string | null> {
  const N = loadNotifications();
  if (!N || !DeviceMod) {
    Alert.alert("Push debug", "expo-notifications hindi na-load (Expo Go?).");
    return null;
  }

  if (Platform.OS === "android") {
    await N.setNotificationChannelAsync("default", {
      name: "Alerts",
      importance: N.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#16a34a",
    });
  }

  if (!DeviceMod.isDevice) {
    Alert.alert("Push debug", "Hindi physical device.");
    return null;
  }

  const { status: existing } = await N.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await N.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    Alert.alert("Push debug", `Permission hindi granted: ${finalStatus}`);
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId as
    | string
    | undefined;
  if (!projectId) {
    Alert.alert("Push debug", "Walang EAS projectId sa config.");
    return null;
  }

  // Hinahayaan nating umangat ang error dito para makita ang totoong dahilan.
  const result = await N.getExpoPushTokenAsync({ projectId });
  return result.data;
}

export async function registerPushToken(): Promise<void> {
  if (isExpoGo) return;
  try {
    const token = await getExpoPushToken();
    if (!token) return; // may sariling Alert na sa loob

    Alert.alert("Push debug", `Nakuha ang token:\n${token}`);

    await api("/api/mobile/me/push-token", {
      method: "POST",
      body: {
        token,
        platform: Platform.OS,
        deviceName: DeviceMod?.deviceName ?? undefined,
      },
    });

    Alert.alert("Push debug", "Na-register sa backend ✅");
  } catch (err: any) {
    Alert.alert("Push debug ERROR", err?.message ?? String(err));
  }
}

export async function unregisterPushToken(): Promise<void> {
  if (isExpoGo) return;
  try {
    await api("/api/mobile/me/push-token", { method: "DELETE", body: {} });
  } catch (err) {
    console.warn("[push] unregisterPushToken failed:", err);
  }
}

export function addNotificationTapListener(onTap: () => void): () => void {
  const N = loadNotifications();
  if (!N) return () => {};
  const sub = N.addNotificationResponseReceivedListener(() => onTap());
  return () => sub.remove();
}
