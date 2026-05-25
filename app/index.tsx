import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { isAuthenticated, logout } from "../lib/auth";
import {
  authenticateWithBiometric,
  getBiometricLabel,
  isBiometricEnabled,
} from "../lib/biometric";

type SplashStatus = "loading" | "biometric" | "failed";

export default function Splash() {
  const router = useRouter();
  const [status, setStatus] = useState<SplashStatus>("loading");
  const [biometricLabel, setBiometricLabel] = useState("Biometric");

  useEffect(() => {
    runAuthCheck();
  }, []);

  async function runAuthCheck() {
    const authed = await isAuthenticated();
    if (!authed) {
      router.replace("/(auth)/login");
      return;
    }

    const biometricOn = await isBiometricEnabled();
    if (!biometricOn) {
      router.replace("/(app)");
      return;
    }

    const label = await getBiometricLabel();
    setBiometricLabel(label);
    setStatus("biometric");

    const success = await authenticateWithBiometric("Unlock H-Auto");
    if (success) {
      router.replace("/(app)");
    } else {
      setStatus("failed");
    }
  }

  async function handleRetry() {
    setStatus("biometric");
    const success = await authenticateWithBiometric("Unlock H-Auto");
    if (success) {
      router.replace("/(app)");
    } else {
      setStatus("failed");
    }
  }

  async function handleUsePassword() {
    await logout();
    router.replace("/(auth)/login");
  }

  return (
    <View className="flex-1 bg-brand-600 items-center justify-center px-6">
      <View className="w-20 h-20 bg-white/20 rounded-2xl items-center justify-center mb-6">
        <Text className="text-4xl">🌱</Text>
      </View>
      <Text className="text-2xl font-bold text-white">H-Auto</Text>
      <Text className="text-sm text-white/80 mb-12 mt-1">
        Smart Gardening Companion
      </Text>

      {status === "loading" && <ActivityIndicator color="white" />}

      {status === "biometric" && (
        <View className="items-center">
          <Ionicons name="finger-print" size={40} color="white" />
          <Text className="text-white text-sm mt-3">
            Waiting for {biometricLabel}...
          </Text>
        </View>
      )}

      {status === "failed" && (
        <View className="items-center w-full max-w-sm">
          <Ionicons name="lock-closed" size={40} color="white" />
          <Text className="text-white text-base font-semibold mt-3 mb-1">
            Authentication needed
          </Text>
          <Text className="text-white/80 text-sm text-center mb-8">
            Please verify your identity to continue
          </Text>

          {/* Primary action: retry biometric */}
          <Pressable
            onPress={handleRetry}
            className="bg-white rounded-xl py-4 px-8 mb-3 w-full items-center active:opacity-80"
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="finger-print" size={20} color="#15803d" />
              <Text className="text-brand-700 font-semibold text-base">
                Try {biometricLabel} again
              </Text>
            </View>
          </Pressable>

          {/* Secondary action: use password (now more prominent) */}
          <Pressable
            onPress={handleUsePassword}
            className="border-2 border-white/40 rounded-xl py-4 px-8 w-full items-center active:bg-white/10"
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="key" size={18} color="white" />
              <Text className="text-white font-semibold text-base">
                Log in with password
              </Text>
            </View>
          </Pressable>
        </View>
      )}
    </View>
  );
}
