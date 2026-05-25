import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../constants/colors";
import { useChangePassword } from "../../../lib/hooks/use-change-password";

export default function ChangePassword() {
  const router = useRouter();
  const changePwd = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function handleSave() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Missing info", "Please fill in all fields.");
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert("Too short", "New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Mismatch", "New password and confirmation don't match.");
      return;
    }
    if (currentPassword === newPassword) {
      Alert.alert(
        "Same password",
        "New password must be different from current.",
      );
      return;
    }

    changePwd.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          Alert.alert(
            "Password changed",
            "Your password has been updated successfully.",
            [{ text: "OK", onPress: () => router.back() }],
          );
        },
        onError: (err: any) => {
          Alert.alert("Failed", err?.message ?? "Try again");
        },
      },
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-stone-50" edges={["top"]}>
      <View className="flex-row items-center px-4 py-3 bg-stone-50 border-b border-slate-100">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full active:bg-slate-200"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text className="flex-1 text-lg font-semibold text-slate-900 ml-2">
          Change Password
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
          <View className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 flex-row items-start gap-2">
            <Ionicons name="information-circle" size={18} color="#b45309" />
            <Text className="flex-1 text-xs text-amber-800">
              You'll need to enter your current password to confirm the change.
            </Text>
          </View>

          <PasswordField
            label="Current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            editable={!changePwd.isPending}
          />
          <PasswordField
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            editable={!changePwd.isPending}
            hint="At least 8 characters"
          />
          <PasswordField
            label="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!changePwd.isPending}
          />
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-4">
          <Pressable
            onPress={handleSave}
            disabled={changePwd.isPending}
            className={`rounded-xl py-3.5 items-center ${
              changePwd.isPending
                ? "bg-brand-600/60"
                : "bg-brand-600 active:bg-brand-700"
            }`}
          >
            {changePwd.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Update password
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PasswordField({
  label,
  value,
  onChangeText,
  editable,
  hint,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  editable?: boolean;
  hint?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <View className="mb-4">
      <Text className="text-xs font-medium text-slate-600 mb-1.5">{label}</Text>
      <View className="relative">
        <TextInput
          className="bg-white border border-slate-200 rounded-lg px-4 py-3 pr-12 text-base text-slate-900"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          editable={editable}
        />
        <Pressable
          onPress={() => setShow(!show)}
          className="absolute right-3 top-0 bottom-0 justify-center"
        >
          <Ionicons
            name={show ? "eye-off" : "eye"}
            size={20}
            color={colors.text.muted}
          />
        </Pressable>
      </View>
      {hint && <Text className="text-xs text-slate-400 mt-1">{hint}</Text>}
    </View>
  );
}
