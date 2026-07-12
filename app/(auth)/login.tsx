import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { colors } from "../../constants/colors";
import { api } from "../../lib/api";
import { saveToken, saveUser } from "../../lib/auth";
import {
  getBiometricLabel,
  isBiometricAvailable,
  isBiometricEnabled,
  saveBiometricPreference
} from "../../lib/biometric";
import type { LoginResponse } from "../../types";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError("Please enter both email and password");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await api<LoginResponse>("/api/auth/mobile-login", {
        method: "POST",
        body: { email: email.trim(), password },
        skipAuth: true,
      });

      async function promptBiometricSetup() {
        // Already enabled? skip
        const alreadyEnabled = await isBiometricEnabled();
        if (alreadyEnabled) {
          return;
        }

        // Device supports it?
        const available = await isBiometricAvailable();
        if (!available) {
          return;
        }

        const label = await getBiometricLabel();

        return new Promise<void>((resolve) => {
          Alert.alert(
            `Enable ${label}?`,
            `Use ${label} to unlock H-Auto next time without typing your password.`,
            [
              {
                text: "Not now",
                style: "cancel",
                onPress: () => resolve(),
              },
              {
                text: "Enable",
                onPress: async () => {
                  await saveBiometricPreference(true);
                  resolve();
                },
              },
            ],
          );
        });
      }

      await saveToken(response.token);
      await saveUser(response.user);
      await promptBiometricSetup();
      router.replace("/(app)"); // ← add this back here
    } catch (err: any) {
      let message = "Login failed. Please try again.";
      if (err.message?.toLowerCase().includes("network")) {
        message = "Can't reach server. Check your Wi-Fi connection.";
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 bg-stone-50 justify-center px-6">
          {/* Logo + brand */}
          <View className="items-center mb-10">
            <View className="w-20 h-20 rounded-2xl bg-brand-600 items-center justify-center mb-6 shadow-lg">
              <Text className="text-white text-4xl">🌱</Text>
            </View>
            <Text className="text-3xl font-bold text-slate-900 mb-1">
              H-Auto
            </Text>
            <Text className="text-sm text-slate-500">
              Smart Gardening Companion
            </Text>
          </View>

          {/* Form card */}
          <View className="bg-white rounded-2xl p-6 shadow-md border border-slate-100">
            <Text className="text-xl font-semibold text-slate-900 mb-1">
              Welcome back
            </Text>
            <Text className="text-sm text-slate-500 mb-5">
              Log in to your account
            </Text>

            {/* Email */}
            <View className="mb-4">
              <Text className="text-xs font-medium text-slate-700 mb-1.5">
                Email
              </Text>
              <TextInput
                className="bg-stone-50 border border-slate-200 rounded-lg px-4 py-3 text-base text-slate-900"
                placeholder="you@bpsu.edu.ph"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            {/* Password */}
            <View className="mb-4">
              <Text className="text-xs font-medium text-slate-700 mb-1.5">
                Password
              </Text>
              <View className="relative">
                <TextInput
                  className="bg-stone-50 border border-slate-200 rounded-lg px-4 py-3 pr-12 text-base text-slate-900"
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={secureTextEntry}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                <Pressable
                  onPress={() => setSecureTextEntry(!secureTextEntry)}
                  className="absolute right-3 top-0 bottom-0 justify-center"
                >
                  <Ionicons
                    name={secureTextEntry ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={colors.text.muted}
                  />
                </Pressable>
              </View>
            </View>

            {/* Error */}
            {error && (
              <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                <Text className="text-sm text-red-800">{error}</Text>
              </View>
            )}

            {/* Submit */}
            <Pressable
              onPress={handleLogin}
              disabled={loading}
              className={`rounded-lg py-4 items-center ${
                loading ? "bg-brand-600/60" : "bg-brand-600 active:bg-brand-700"
              }`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  Log in
                </Text>
              )}
            </Pressable>
          </View>

          <Text className="text-xs text-slate-400 text-center mt-8">
            Use your H-Auto credentials
          </Text>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
