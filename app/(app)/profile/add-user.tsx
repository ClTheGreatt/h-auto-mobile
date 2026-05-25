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
import { useCreateUser } from "../../../lib/hooks/use-users";
import type { User } from "../../../types";

type RoleOption = { value: string; label: string; description: string };
type StatusOption = { value: string; label: string };

const STATUS_OPTIONS: StatusOption[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "SUSPENDED", label: "Suspended" },
];

export default function AddUser() {
  const router = useRouter();
  const createUser = useCreateUser();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [role, setRole] = useState("STUDENT_FARMER");
  const [status, setStatus] = useState("ACTIVE");
  const [idNumber, setIdNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Faculty / Admin only
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");

  // Student only
  const [course, setCourse] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [section, setSection] = useState("");

  useEffect(() => {
    getUser().then(setCurrentUser);
  }, []);

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const isStudent = role === "STUDENT_FARMER";

  const roleOptions: RoleOption[] = [
    {
      value: "STUDENT_FARMER",
      label: "Student Farmer",
      description: "Field worker, logs observations",
    },
    {
      value: "FACULTY",
      label: "Faculty",
      description: "Oversees plots and students",
    },
    ...(isSuperAdmin
      ? [
          {
            value: "ADMIN",
            label: "Admin",
            description: "System administrator",
          },
        ]
      : []),
  ];

  // Clear fields that don't apply to the newly selected role
  function handleRoleChange(value: string) {
    setRole(value);
    if (value === "STUDENT_FARMER") {
      setDepartment("");
      setPosition("");
    } else {
      setCourse("");
      setYearLevel("");
      setSection("");
    }
  }

  function handleSubmit() {
    if (!email.trim() || !firstName.trim() || !lastName.trim() || !password) {
      Alert.alert("Missing info", "Please fill in all required fields.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.endsWith("@bpsu.edu.ph")) {
      Alert.alert(
        "Invalid email",
        "Email must use the BPSU domain (@bpsu.edu.ph).",
      );
      return;
    }

    createUser.mutate(
      {
        email: normalizedEmail,
        firstName: firstName.trim(),
        middleName: middleName.trim() || undefined,
        lastName: lastName.trim(),
        password,
        role,
        status,
        idNumber: idNumber.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        ...(isStudent
          ? {
              course: course.trim() || undefined,
              yearLevel: yearLevel.trim() || undefined,
              section: section.trim() || undefined,
            }
          : {
              department: department.trim() || undefined,
              position: position.trim() || undefined,
            }),
      },
      {
        onSuccess: () => {
          Alert.alert(
            "Account created",
            `${firstName} ${lastName} can now log in. A welcome email was sent.`,
            [{ text: "OK", onPress: () => router.back() }],
          );
        },
        onError: (err: any) => {
          Alert.alert("Could not create user", err?.message ?? "Try again");
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
          Add User
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
          {/* Role picker */}
          <Text className="text-xs font-semibold text-slate-500 uppercase mb-2">
            Role
          </Text>
          <View className="mb-5" style={{ gap: 8 }}>
            {roleOptions.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => handleRoleChange(opt.value)}
                className={`p-4 rounded-2xl border ${
                  role === opt.value
                    ? "bg-brand-50 border-brand-600"
                    : "bg-white border-slate-200"
                } active:opacity-80`}
              >
                <View className="flex-row items-center">
                  <View
                    className={`w-5 h-5 rounded-full border-2 ${
                      role === opt.value
                        ? "border-brand-600 bg-brand-600"
                        : "border-slate-300"
                    } items-center justify-center`}
                  >
                    {role === opt.value && (
                      <View className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-sm font-semibold text-slate-900">
                      {opt.label}
                    </Text>
                    <Text className="text-xs text-slate-500 mt-0.5">
                      {opt.description}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>

          {/* Status picker */}
          <Text className="text-xs font-semibold text-slate-500 uppercase mb-2">
            Status
          </Text>
          <View className="flex-row mb-5" style={{ gap: 8 }}>
            {STATUS_OPTIONS.map((opt) => {
              const active = status === opt.value;
              const selectedBg =
                opt.value === "ACTIVE"
                  ? "bg-brand-600 border-brand-600"
                  : opt.value === "SUSPENDED"
                    ? "bg-red-500 border-red-500"
                    : "bg-slate-500 border-slate-500";
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setStatus(opt.value)}
                  className={`flex-1 py-2.5 rounded-xl border items-center ${
                    active ? selectedBg : "bg-white border-slate-200"
                  } active:opacity-80`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      active ? "text-white" : "text-slate-600"
                    }`}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Account */}
          <Text className="text-xs font-semibold text-slate-500 uppercase mb-2">
            Account
          </Text>
          <Field
            label="Email *"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="user@bpsu.edu.ph"
            autoCapitalize="none"
          />
          <Field
            label="First name *"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />
          <Field
            label="Middle name"
            value={middleName}
            onChangeText={setMiddleName}
            autoCapitalize="words"
          />
          <Field
            label="Last name *"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />

          {/* Password */}
          <Text className="text-xs font-medium text-slate-600 mb-1.5">
            Password *
          </Text>
          <View className="relative mb-1">
            <TextInput
              className="bg-white border border-slate-200 rounded-lg px-4 py-3 pr-12 text-base text-slate-900"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPwd}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              placeholder="At least 6 characters"
              placeholderTextColor="#94a3b8"
            />
            <Pressable
              onPress={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-0 bottom-0 justify-center"
            >
              <Ionicons
                name={showPwd ? "eye-off" : "eye"}
                size={20}
                color={colors.text.muted}
              />
            </Pressable>
          </View>
          <Text className="text-xs text-slate-400 mb-5">
            User can change this after first login.
          </Text>

          {/* Details */}
          <Text className="text-xs font-semibold text-slate-500 uppercase mb-2">
            Details
          </Text>
          <Field
            label="ID number"
            value={idNumber}
            onChangeText={setIdNumber}
            placeholder="20-12345"
          />
          <Field
            label="Phone"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            placeholder="+639XXXXXXXXX"
          />

          {isStudent ? (
            <>
              <Field
                label="Course"
                value={course}
                onChangeText={setCourse}
                placeholder="BS Information Technology"
              />
              <Field
                label="Year level"
                value={yearLevel}
                onChangeText={setYearLevel}
                placeholder="3rd Year"
              />
              <Field
                label="Section"
                value={section}
                onChangeText={setSection}
                placeholder="BSIT-3A"
              />
            </>
          ) : (
            <>
              <Field
                label="Department"
                value={department}
                onChangeText={setDepartment}
                placeholder="College of Computer Studies"
              />
              <Field
                label="Position"
                value={position}
                onChangeText={setPosition}
                placeholder="Instructor"
              />
            </>
          )}
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-4">
          <Pressable
            onPress={handleSubmit}
            disabled={createUser.isPending}
            className={`rounded-xl py-3.5 items-center ${
              createUser.isPending
                ? "bg-brand-600/60"
                : "bg-brand-600 active:bg-brand-700"
            }`}
          >
            {createUser.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Create account
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
  placeholder,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: "default" | "phone-pad" | "email-address";
  placeholder?: string;
  autoCapitalize?: "none" | "sentences" | "words";
}) {
  return (
    <View className="mb-3">
      <Text className="text-xs font-medium text-slate-600 mb-1.5">{label}</Text>
      <TextInput
        className="bg-white border border-slate-200 rounded-lg px-4 py-3 text-base text-slate-900"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        autoCapitalize={autoCapitalize ?? "sentences"}
        autoCorrect={false}
      />
    </View>
  );
}
