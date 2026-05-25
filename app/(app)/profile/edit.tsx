import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import { getUser } from "../../../lib/auth";
import { useUpdateProfile } from "../../../lib/hooks/use-update-profile";

export default function EditProfile() {
  const router = useRouter();
  const updateProfile = useUpdateProfile();

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const u = await getUser();
      if (u) {
        setFirstName(u.firstName ?? "");
        setMiddleName(u.middleName ?? "");
        setLastName(u.lastName ?? "");
        setPhoneNumber(u.phoneNumber ?? "");
      }
      setLoaded(true);
    })();
  }, []);

  function handleSave() {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Missing info", "First name and last name are required.");
      return;
    }

    updateProfile.mutate(
      {
        firstName: firstName.trim(),
        middleName: middleName.trim() || undefined,
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
      },
      {
        onSuccess: () => {
          Alert.alert("Saved", "Your profile has been updated.", [
            { text: "OK", onPress: () => router.back() },
          ]);
        },
        onError: (err: any) => {
          Alert.alert("Failed", err?.message ?? "Try again");
        },
      },
    );
  }

  if (!loaded) {
    return (
      <SafeAreaView className="flex-1 bg-stone-50 items-center justify-center">
        <ActivityIndicator color={colors.brand[600]} />
      </SafeAreaView>
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
          Edit Profile
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
          <Field
            label="First name *"
            value={firstName}
            onChangeText={setFirstName}
            editable={!updateProfile.isPending}
          />
          <Field
            label="Middle name"
            value={middleName}
            onChangeText={setMiddleName}
            editable={!updateProfile.isPending}
          />
          <Field
            label="Last name *"
            value={lastName}
            onChangeText={setLastName}
            editable={!updateProfile.isPending}
          />
          <Field
            label="Phone number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            editable={!updateProfile.isPending}
            placeholder="+639XXXXXXXXX"
          />
          <Text className="text-xs text-slate-400 mt-2">
            Email and role cannot be changed from the mobile app.
          </Text>
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-4">
          <Pressable
            onPress={handleSave}
            disabled={updateProfile.isPending}
            className={`rounded-xl py-3.5 items-center ${
              updateProfile.isPending
                ? "bg-brand-600/60"
                : "bg-brand-600 active:bg-brand-700"
            }`}
          >
            {updateProfile.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Save changes
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  editable,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: "default" | "phone-pad" | "email-address";
  editable?: boolean;
  placeholder?: string;
}) {
  return (
    <View className="mb-4">
      <Text className="text-xs font-medium text-slate-600 mb-1.5">{label}</Text>
      <TextInput
        className="bg-white border border-slate-200 rounded-lg px-4 py-3 text-base text-slate-900"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        editable={editable}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
      />
    </View>
  );
}
