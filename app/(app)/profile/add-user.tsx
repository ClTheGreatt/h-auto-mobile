import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../constants/colors";
import {
  DEPARTMENTS,
  FACULTY_ID_REGEX,
  FACULTY_POSITIONS,
  isValidStudentIdPrefix,
  SECTION_REGEX,
  STUDENT_ID_REGEX,
  studentIdPrefixRange,
} from "../../../constants/user-import";
import { getUser } from "../../../lib/auth";
import { useCreateUser } from "../../../lib/hooks/use-users";
import type { User } from "../../../types";

type RoleOption = { value: string; label: string; description: string };
type StatusOption = { value: string; label: string };
type FormErrors = Record<string, string | undefined>;
type PickerKind = "yearLevel" | "department" | "position" | "course" | null;

const STATUS_OPTIONS: StatusOption[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

function isValidEmailFormat(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isValidPhone(v: string) {
  return /^(09\d{9}|\+639\d{9})$/.test(v.trim());
}

export default function AddUser() {
  const router = useRouter();
  const createUser = useCreateUser();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
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

  const [errors, setErrors] = useState<FormErrors>({});
  const [activePicker, setActivePicker] = useState<PickerKind>(null);
  const [createdAccount, setCreatedAccount] = useState<{
    name: string;
    tempPassword: string;
  } | null>(null);

  useEffect(() => {
    getUser().then(setCurrentUser);
  }, []);

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const isStudent = role === "STUDENT_FARMER";
  const isFaculty = role === "FACULTY";
  const requiresIdNumber = isStudent || isFaculty;

  function updateField<T extends string>(setter: (v: T) => void, key: string) {
    return (v: T) => {
      setter(v);
      setErrors((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    };
  }

  // Server-side re-validation is unconditional regardless of this form:
  // POST /api/mobile/me/users runs createStudentSchema/createFacultySchema
  // (src/lib/validations/user.ts on the web side) for every request,
  // enum/regex-checked, no matter what this client sends. Everything below
  // is purely a UX improvement — catching mistakes before submit instead
  // of after a 400 comes back.
  function validateForm(): FormErrors {
    const e: FormErrors = {};
    const normalizedEmail = email.trim().toLowerCase();

    if (!firstName.trim()) e.firstName = "This field is required";
    if (!lastName.trim()) e.lastName = "This field is required";

    if (!normalizedEmail) {
      e.email = "This field is required";
    } else if (!isValidEmailFormat(normalizedEmail)) {
      e.email = "Invalid email format";
    } else if (!normalizedEmail.endsWith("@bpsu.edu.ph")) {
      e.email = "Must be a BPSU email (@bpsu.edu.ph)";
    }

    if (isStudent) {
      const trimmedId = idNumber.trim();
      if (!trimmedId) {
        e.idNumber = "This field is required";
      } else if (!STUDENT_ID_REGEX.test(trimmedId)) {
        e.idNumber = "ID number must be in format 12-34567, e.g. 23-04567";
      } else if (!isValidStudentIdPrefix(trimmedId)) {
        const { min, max } = studentIdPrefixRange();
        e.idNumber = `ID number prefix must be between ${min} and ${max}`;
      }

      if (!phoneNumber.trim()) {
        e.phoneNumber = "This field is required";
      } else if (!isValidPhone(phoneNumber)) {
        e.phoneNumber = "Phone must be 09XXXXXXXXX or +639XXXXXXXXX";
      }
      if (!course.trim()) e.course = "This field is required";
      if (!yearLevel.trim()) e.yearLevel = "This field is required";

      const trimmedSection = section.trim();
      if (!trimmedSection) {
        e.section = "This field is required";
      } else if (!SECTION_REGEX.test(trimmedSection)) {
        e.section =
          "Section must be in format PREFIX-YN, e.g. BSA-1A, BTVTED-2B, BSABE-3C";
      }
    } else if (isFaculty) {
      const trimmedId = idNumber.trim();
      if (!trimmedId) {
        e.idNumber = "This field is required";
      } else if (!FACULTY_ID_REGEX.test(trimmedId)) {
        e.idNumber =
          "Employee ID must be in format 123456-1234, e.g. 202000-0001";
      }
      if (!department.trim()) e.department = "This field is required";
      if (!position.trim()) e.position = "This field is required";
    }

    return e;
  }

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
    setErrors({});
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
    const validationErrors = validateForm();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const normalizedEmail = email.trim().toLowerCase();

    createUser.mutate(
      {
        email: normalizedEmail,
        firstName: firstName.trim(),
        middleName: middleName.trim() || undefined,
        lastName: lastName.trim(),
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
        onSuccess: (result) => {
          if (result.tempPassword) {
            setCreatedAccount({
              name: `${firstName} ${lastName}`,
              tempPassword: result.tempPassword,
            });
          } else {
            Alert.alert(
              "Account created",
              `${firstName} ${lastName} can now log in, but the temporary password could not be displayed. Check the welcome email sent to ${normalizedEmail} for the password.`,
              [{ text: "OK", onPress: () => router.back() }],
            );
          }
        },
        onError: (err: any) => {
          const fieldErrors = err?.data?.fieldErrors;
          if (fieldErrors && typeof fieldErrors === "object") {
            setErrors((prev) => ({ ...prev, ...fieldErrors }));
          }
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
            onChangeText={updateField(setEmail, "email")}
            keyboardType="email-address"
            placeholder="user@bpsu.edu.ph"
            autoCapitalize="none"
            error={errors.email}
          />
          <Field
            label="First name *"
            value={firstName}
            onChangeText={updateField(setFirstName, "firstName")}
            autoCapitalize="words"
            error={errors.firstName}
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
            onChangeText={updateField(setLastName, "lastName")}
            autoCapitalize="words"
            error={errors.lastName}
          />

          {/* Details */}
          <Text className="text-xs font-semibold text-slate-500 uppercase mb-2">
            Details
          </Text>
          <Field
            label={`${isStudent ? "ID number" : "Employee ID"}${
              requiresIdNumber ? " *" : ""
            }`}
            value={idNumber}
            onChangeText={updateField(setIdNumber, "idNumber")}
            placeholder={isStudent ? "23-04567" : "202000-0001"}
            error={errors.idNumber}
          />

          {isStudent ? (
            <>
              <Field
                label="Phone *"
                value={phoneNumber}
                onChangeText={updateField(setPhoneNumber, "phoneNumber")}
                keyboardType="phone-pad"
                placeholder="09XXXXXXXXX or +639XXXXXXXXX"
                error={errors.phoneNumber}
              />
              <PickerField
                label="Course *"
                value={course}
                placeholder="Select course"
                onPress={() => setActivePicker("course")}
                error={errors.course}
              />
              <PickerField
                label="Year level *"
                value={yearLevel}
                placeholder="Select year level"
                onPress={() => setActivePicker("yearLevel")}
                error={errors.yearLevel}
              />
              <Field
                label="Section *"
                value={section}
                onChangeText={updateField(setSection, "section")}
                placeholder="BSA-1A"
                error={errors.section}
              />
            </>
          ) : (
            <>
              <PickerField
                label={`Department${isFaculty ? " *" : ""}`}
                value={department}
                placeholder="Select department"
                onPress={() => setActivePicker("department")}
                error={errors.department}
              />
              <PickerField
                label={`Position${isFaculty ? " *" : ""}`}
                value={position}
                placeholder="Select position"
                onPress={() => setActivePicker("position")}
                error={errors.position}
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

      <ListPickerModal
        visible={activePicker === "yearLevel"}
        onClose={() => setActivePicker(null)}
        title="Select year level"
        options={YEAR_LEVELS}
        value={yearLevel}
        onSelect={updateField(setYearLevel, "yearLevel")}
      />
      <ListPickerModal
        visible={activePicker === "department"}
        onClose={() => setActivePicker(null)}
        title="Select department"
        options={DEPARTMENTS}
        value={department}
        onSelect={updateField(setDepartment, "department")}
      />
      <ListPickerModal
        visible={activePicker === "position"}
        onClose={() => setActivePicker(null)}
        title="Select position"
        options={FACULTY_POSITIONS}
        value={position}
        onSelect={updateField(setPosition, "position")}
      />
      <ListPickerModal
        visible={activePicker === "course"}
        onClose={() => setActivePicker(null)}
        title="Select course"
        options={DEPARTMENTS}
        value={course}
        onSelect={updateField(setCourse, "course")}
      />

      <TempPasswordModal
        visible={!!createdAccount}
        name={createdAccount?.name ?? ""}
        tempPassword={createdAccount?.tempPassword ?? ""}
        onDone={() => {
          setCreatedAccount(null);
          router.back();
        }}
      />
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
  error,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: "default" | "phone-pad" | "email-address";
  placeholder?: string;
  autoCapitalize?: "none" | "sentences" | "words";
  error?: string;
}) {
  return (
    <View className="mb-3">
      <Text className="text-xs font-medium text-slate-600 mb-1.5">{label}</Text>
      <TextInput
        className={`bg-white border rounded-lg px-4 py-3 text-base text-slate-900 ${
          error ? "border-red-400" : "border-slate-200"
        }`}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        autoCapitalize={autoCapitalize ?? "sentences"}
        autoCorrect={false}
      />
      {error && <Text className="text-xs text-red-600 mt-1">{error}</Text>}
    </View>
  );
}

function PickerField({
  label,
  value,
  placeholder,
  onPress,
  error,
}: {
  label: string;
  value: string;
  placeholder: string;
  onPress: () => void;
  error?: string;
}) {
  return (
    <View className="mb-3">
      <Text className="text-xs font-medium text-slate-600 mb-1.5">{label}</Text>
      <Pressable
        onPress={onPress}
        className={`bg-white border rounded-lg px-4 py-3 flex-row items-center justify-between ${
          error ? "border-red-400" : "border-slate-200"
        }`}
      >
        <Text
          className={`text-base flex-1 ${
            value ? "text-slate-900" : "text-slate-400"
          }`}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.text.muted} />
      </Pressable>
      {error && <Text className="text-xs text-red-600 mt-1">{error}</Text>}
    </View>
  );
}

function ListPickerModal({
  visible,
  onClose,
  title,
  options,
  value,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: readonly string[];
  value: string;
  onSelect: (v: string) => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/40 justify-end" onPress={onClose}>
        <Pressable
          className="bg-white rounded-t-3xl px-6 pt-4 pb-9"
          onPress={() => {}}
        >
          <View className="items-center mb-3">
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: "#e2e8f0",
              }}
            />
          </View>

          <Text className="text-lg font-bold text-slate-900 mb-4">
            {title}
          </Text>

          <ScrollView style={{ maxHeight: 420 }}>
            <View style={{ gap: 8 }}>
              {options.map((opt) => {
                const isSel = value === opt;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => {
                      onSelect(opt);
                      onClose();
                    }}
                    className={`py-3.5 px-4 rounded-xl border ${
                      isSel
                        ? "bg-brand-600 border-brand-600"
                        : "bg-white border-slate-200"
                    } active:opacity-80`}
                  >
                    <Text
                      className={`text-sm font-medium text-center ${
                        isSel ? "text-white" : "text-slate-700"
                      }`}
                    >
                      {opt}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// No dismiss-on-backdrop-tap and no-op onRequestClose (blocks Android back
// button) so the temp password can't be lost by an accidental tap/back —
// the only way out is the explicit Done button.
function TempPasswordModal({
  visible,
  name,
  tempPassword,
  onDone,
}: {
  visible: boolean;
  name: string;
  tempPassword: string;
  onDone: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {}}
    >
      <View className="flex-1 bg-black/40 justify-end">
        <View className="bg-white rounded-t-3xl px-6 pt-4 pb-9">
          <View className="items-center mb-3">
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: "#e2e8f0",
              }}
            />
          </View>

          <View className="items-center mb-4">
            <View className="w-14 h-14 rounded-full bg-brand-100 items-center justify-center mb-3">
              <Ionicons name="key" size={26} color={colors.brand[600]} />
            </View>
            <Text className="text-lg font-bold text-slate-900 text-center">
              Account created
            </Text>
            <Text className="text-sm text-slate-500 text-center mt-1">
              {name} can now log in with the temporary password below.
            </Text>
          </View>

          <View className="bg-stone-50 border border-slate-200 rounded-xl py-4 px-4 mb-4">
            <Text
              selectable
              className="text-xl text-center text-slate-900 tracking-wider"
              style={{ fontFamily: "monospace" }}
            >
              {tempPassword}
            </Text>
          </View>

          <View className="flex-row items-start bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
            <Ionicons
              name="alert-circle"
              size={16}
              color="#b45309"
              style={{ marginTop: 1 }}
            />
            <Text className="text-xs text-amber-800 ml-2 flex-1">
              This password is shown only once and cannot be recovered
              afterward. It has also been sent to the new account by email.
              Long-press the password above to copy it.
            </Text>
          </View>

          <Pressable
            onPress={onDone}
            className="bg-brand-600 rounded-xl py-3.5 items-center active:opacity-90"
          >
            <Text className="text-white font-semibold text-base">Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
