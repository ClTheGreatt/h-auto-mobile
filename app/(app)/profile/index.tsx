import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../constants/colors";
import { getUser, logout } from "../../../lib/auth";
import {
  authenticateWithBiometric,
  getBiometricLabel,
  isBiometricAvailable,
  isBiometricEnabled,
  saveBiometricPreference,
} from "../../../lib/biometric";
import { useStats } from "../../../lib/hooks/use-stats";
import { useUploadAvatar } from "../../../lib/hooks/use-upload-avatar";
import type { User } from "../../../types";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  FACULTY: "Faculty",
  STUDENT_FARMER: "Student Farmer",
};

export default function Profile() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioEnabled, setBioEnabled] = useState(false);
  const [bioLabel, setBioLabel] = useState("Biometric");

  const { data: statsData, refetch: refetchStats } = useStats();
  const uploadAvatar = useUploadAvatar();

  useEffect(() => {
    refreshUser();
    (async () => {
      const available = await isBiometricAvailable();
      setBioAvailable(available);
      if (available) {
        setBioLabel(await getBiometricLabel());
        setBioEnabled(await isBiometricEnabled());
      }
    })();
  }, []);

  async function refreshUser() {
    const u = await getUser();
    setUser(u);
  }

  async function toggleBiometric(value: boolean) {
    if (value) {
      const ok = await authenticateWithBiometric(`Enable ${bioLabel}`);
      if (ok) {
        await saveBiometricPreference(true);
        setBioEnabled(true);
      }
    } else {
      await saveBiometricPreference(false);
      setBioEnabled(false);
    }
  }

  function showAvatarPicker() {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Take Photo", "Choose from Gallery"],
          cancelButtonIndex: 0,
        },
        (idx) => {
          if (idx === 1) pickFromCamera();
          if (idx === 2) pickFromGallery();
        },
      );
    } else {
      Alert.alert("Change Avatar", "Choose source", [
        { text: "Cancel", style: "cancel" },
        { text: "Take Photo", onPress: pickFromCamera },
        { text: "Choose from Gallery", onPress: pickFromGallery },
      ]);
    }
  }

  async function pickFromCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Camera permission needed");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      uploadNewAvatar(result.assets[0].uri);
    }
  }

  async function pickFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Gallery permission needed");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      uploadNewAvatar(result.assets[0].uri);
    }
  }

  function uploadNewAvatar(uri: string) {
    uploadAvatar.mutate(uri, {
      onSuccess: async () => {
        await refreshUser();
      },
      onError: (err: any) => {
        Alert.alert("Upload failed", err?.message ?? "Try again");
      },
    });
  }

  async function handleLogout() {
    Alert.alert("Log out?", "You'll need to log in again.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await logout();
          queryClient.clear();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-stone-50 items-center justify-center">
        <ActivityIndicator color={colors.brand[600]} />
      </SafeAreaView>
    );
  }

  const stats = statsData?.stats;

  return (
    <SafeAreaView className="flex-1 bg-stone-50" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-4 pb-2">
          <Text className="text-2xl font-bold text-slate-900">Profile</Text>
        </View>

        {/* Avatar + name card */}
        <View className="px-6 mt-2">
          <View className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm items-center">
            <Pressable
              onPress={showAvatarPicker}
              disabled={uploadAvatar.isPending}
              className="relative active:opacity-80"
            >
              {user.profileImage ? (
                <Image
                  source={{ uri: user.profileImage }}
                  className="w-24 h-24 rounded-full bg-stone-100"
                />
              ) : (
                <View className="w-24 h-24 rounded-full bg-brand-100 items-center justify-center">
                  <Text className="text-3xl font-semibold text-brand-700">
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </Text>
                </View>
              )}
              <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-brand-600 items-center justify-center border-2 border-white">
                {uploadAvatar.isPending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="camera" size={16} color="white" />
                )}
              </View>
            </Pressable>
            <Text className="text-lg font-semibold text-slate-900 mt-4">
              {user.firstName} {user.lastName}
            </Text>
            <Text className="text-sm text-slate-500 mt-0.5">{user.email}</Text>
            <View className="mt-3 px-3 py-1 rounded-full bg-brand-100">
              <Text className="text-xs font-medium text-brand-700">
                {ROLE_LABELS[user.role] ?? user.role}
              </Text>
            </View>
          </View>
        </View>

        {/* My Stats */}
        <View className="px-6 mt-6">
          <Text className="text-xs font-semibold text-slate-500 uppercase mb-3">
            My Stats
          </Text>
          <View className="flex-row" style={{ gap: 8 }}>
            <StatTile
              label="Observations"
              value={stats?.observations ?? 0}
              icon="document-text"
            />
            <StatTile
              label={
                user.role === "STUDENT_FARMER" || user.role === "FACULTY"
                  ? "My Plots"
                  : "Total Plots"
              }
              value={stats?.plotsAssigned ?? 0}
              icon="leaf"
            />
            <StatTile
              label="Days Active"
              value={stats?.daysActive ?? 0}
              icon="calendar"
            />
          </View>
        </View>

        {/* Account section */}
        <View className="px-6 mt-6">
          <Text className="text-xs font-semibold text-slate-500 uppercase mb-3">
            Account
          </Text>
          <View className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <MenuRow
              icon="person-outline"
              label="Edit Profile"
              onPress={() => router.push("/(app)/profile/edit")}
            />
            <MenuRow
              icon="lock-closed-outline"
              label="Change Password"
              onPress={() => router.push("/(app)/profile/change-password")}
              divider
            />
          </View>
        </View>
        {/* Admin tools — only for ADMIN and SUPER_ADMIN */}
        {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
          <View className="px-6 mt-6">
            <Text className="text-xs font-semibold text-slate-500 uppercase mb-3">
              Administration
            </Text>
            <View className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <MenuRow
                icon="people-outline"
                label="Manage Users"
                onPress={() => router.push("/(app)/profile/users")}
              />
            </View>
          </View>
        )}
        {/* Account details (read-only) */}
        <View className="px-6 mt-6">
          <Text className="text-xs font-semibold text-slate-500 uppercase mb-3">
            Details
          </Text>
          <View className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {user.idNumber && (
              <InfoRow
                icon="card-outline"
                label="ID Number"
                value={user.idNumber}
              />
            )}
            {user.phoneNumber && (
              <InfoRow
                icon="call-outline"
                label="Phone"
                value={user.phoneNumber}
                divider={!!user.idNumber}
              />
            )}
            {user.department && (
              <InfoRow
                icon="business-outline"
                label="Department"
                value={user.department}
                divider
              />
            )}
          </View>
        </View>

        {/* Settings */}
        <View className="px-6 mt-6">
          <Text className="text-xs font-semibold text-slate-500 uppercase mb-3">
            Settings
          </Text>
          <View className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {bioAvailable && (
              <View className="flex-row items-center px-5 py-4">
                <Ionicons
                  name="finger-print"
                  size={20}
                  color={colors.brand[600]}
                />
                <View className="flex-1 ml-3">
                  <Text className="text-sm font-medium text-slate-900">
                    {bioLabel} login
                  </Text>
                  <Text className="text-xs text-slate-500 mt-0.5">
                    Unlock H-Auto with {bioLabel}
                  </Text>
                </View>
                <Switch
                  value={bioEnabled}
                  onValueChange={toggleBiometric}
                  trackColor={{ true: colors.brand[600], false: "#cbd5e1" }}
                />
              </View>
            )}
          </View>
        </View>

        {/* About */}
        <View className="px-6 mt-6">
          <Text className="text-xs font-semibold text-slate-500 uppercase mb-3">
            About
          </Text>
          <View className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <View className="px-5 py-4">
              <Text className="text-sm font-medium text-slate-900">H-Auto</Text>
              <Text className="text-xs text-slate-500 mt-0.5">
                Smart Gardening Monitoring System
              </Text>
              <Text className="text-xs text-slate-400 mt-2">
                Bataan Peninsula State University{"\n"}
                College of Computer Studies{"\n"}
                Capstone Project • AY 2025-2026
              </Text>
            </View>
            <View className="px-5 py-3 border-t border-slate-100 flex-row items-center justify-between">
              <Text className="text-xs text-slate-500">Version</Text>
              <Text className="text-xs text-slate-700 font-medium">1.0.0</Text>
            </View>
          </View>
        </View>

        {/* Logout */}
        <View className="px-6 mt-6">
          <Pressable
            onPress={handleLogout}
            className="bg-white border border-red-200 rounded-2xl py-3.5 items-center active:bg-red-50"
          >
            <Text className="text-sm font-semibold text-red-600">Log out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View className="flex-1 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
      <Ionicons name={icon} size={18} color={colors.brand[600]} />
      <Text className="text-2xl font-bold text-slate-900 mt-2">{value}</Text>
      <Text className="text-xs text-slate-500 mt-0.5">{label}</Text>
    </View>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
  divider,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  divider?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center px-5 py-4 active:bg-stone-50 ${
        divider ? "border-t border-slate-100" : ""
      }`}
    >
      <Ionicons name={icon} size={20} color={colors.text.muted} />
      <Text className="flex-1 ml-3 text-sm font-medium text-slate-900">
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
    </Pressable>
  );
}

function InfoRow({
  icon,
  label,
  value,
  divider,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  divider?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center px-5 py-4 ${divider ? "border-t border-slate-100" : ""}`}
    >
      <Ionicons name={icon} size={20} color={colors.text.muted} />
      <View className="flex-1 ml-3">
        <Text className="text-xs text-slate-500">{label}</Text>
        <Text className="text-sm text-slate-900 font-medium mt-0.5">
          {value}
        </Text>
      </View>
    </View>
  );
}
