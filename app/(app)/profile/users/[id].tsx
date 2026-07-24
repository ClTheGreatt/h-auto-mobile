import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { STATUS_META, StatusChangeSheet } from "../../../../components/StatusChangeSheet";
import { colors } from "../../../../constants/colors";
import { getUser } from "../../../../lib/auth";
import { useUser } from "../../../../lib/hooks/use-users";
import { canManage } from "../../../../lib/permissions";
import type { User } from "../../../../types";

const ROLE_META: Record<string, { label: string; color: string; bg: string }> =
  {
    SUPER_ADMIN: {
      label: "Super Admin",
      color: "#7c3aed",
      bg: "bg-purple-100",
    },
    ADMIN: { label: "Admin", color: "#2563eb", bg: "bg-blue-100" },
    FACULTY: { label: "Faculty", color: "#d97706", bg: "bg-amber-100" },
    STUDENT_FARMER: {
      label: "Student Farmer",
      color: "#16a34a",
      bg: "bg-brand-100",
    },
  };

function formatDate(iso: string | null, fallback = "—") {
  if (!iso) return fallback;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useUser(id ?? null);
  const [viewer, setViewer] = useState<User | null>(null);
  const [statusSheetOpen, setStatusSheetOpen] = useState(false);

  useEffect(() => {
    getUser().then(setViewer);
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-stone-50 items-center justify-center">
        <ActivityIndicator color={colors.brand[600]} />
      </SafeAreaView>
    );
  }

  const user = data?.user;

  if (error || !user) {
    const status = (error as any)?.status;
    const message =
      status === 404
        ? "This user could not be found."
        : status === 403
          ? "You don't have permission to view this user."
          : status === 401
            ? "Your session has expired. Please log in again."
            : "Failed to load user details.";

    return (
      <SafeAreaView className="flex-1 bg-stone-50" edges={["top"]}>
        <Header title="Error" onBack={() => router.back()} />
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle" size={48} color={colors.status.error} />
          <Text className="text-base font-medium text-slate-700 mt-4 text-center">
            {message}
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="mt-4 px-4 py-2 bg-brand-600 rounded-lg"
          >
            <Text className="text-white text-sm font-medium">Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const roleMeta = ROLE_META[user.role] ?? ROLE_META.STUDENT_FARMER;
  const statusMeta = STATUS_META[user.status] ?? STATUS_META.ACTIVE;
  const showStatusAction = canManage(viewer, user);
  const fullName = [user.firstName, user.middleName, user.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <SafeAreaView className="flex-1 bg-stone-50" edges={["top"]}>
      <Header title="User Details" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: showStatusAction ? 100 : 40,
        }}
      >
        {/* Hero */}
        <View className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm items-center">
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
          <Text className="text-lg font-semibold text-slate-900 mt-4 text-center">
            {fullName}
          </Text>
          <View className="flex-row mt-3" style={{ gap: 8 }}>
            <View className={`px-3 py-1 rounded-full ${roleMeta.bg}`}>
              <Text
                className="text-xs font-medium"
                style={{ color: roleMeta.color }}
              >
                {roleMeta.label}
              </Text>
            </View>
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: `${statusMeta.color}15` }}
            >
              <Text
                className="text-xs font-medium"
                style={{ color: statusMeta.color }}
              >
                {statusMeta.label}
              </Text>
            </View>
          </View>
        </View>

        {/* Contact */}
        <Section title="Contact">
          <View className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <InfoRow icon="mail-outline" label="Email" value={user.email} />
            <InfoRow
              icon="call-outline"
              label="Phone"
              value={user.phoneNumber ?? "Not provided"}
              divider
            />
          </View>
        </Section>

        {/* Role-specific info */}
        {user.role === "STUDENT_FARMER" && (
          <Section title="Student Information">
            <View className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <InfoRow
                icon="card-outline"
                label="ID Number"
                value={user.idNumber ?? "Not provided"}
              />
              <InfoRow
                icon="book-outline"
                label="Course"
                value={user.course ?? "Not provided"}
                divider
              />
              <InfoRow
                icon="school-outline"
                label="Year Level"
                value={user.yearLevel ?? "Not provided"}
                divider
              />
              <InfoRow
                icon="people-outline"
                label="Section"
                value={user.section ?? "Not provided"}
                divider
              />
              {user.graduatedAt && (
                <InfoRow
                  icon="ribbon-outline"
                  label="Graduated"
                  value={formatDate(user.graduatedAt)}
                  divider
                />
              )}
              {user.graduatedAt && user.academicYear && (
                <InfoRow
                  icon="calendar-outline"
                  label="Academic Year"
                  value={user.academicYear}
                  divider
                />
              )}
            </View>
          </Section>
        )}

        {user.role === "FACULTY" && (
          <Section title="Faculty Information">
            <View className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <InfoRow
                icon="card-outline"
                label="Employee ID"
                value={user.idNumber ?? "Not provided"}
              />
              <InfoRow
                icon="business-outline"
                label="Department"
                value={user.department ?? "Not provided"}
                divider
              />
              <InfoRow
                icon="briefcase-outline"
                label="Position"
                value={user.position ?? "Not provided"}
                divider
              />
            </View>
          </Section>
        )}

        {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
          <Section title="Administrative Information">
            <View className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <InfoRow
                icon="card-outline"
                label="Employee ID"
                value={user.idNumber ?? "Not provided"}
              />
              {user.department && (
                <InfoRow
                  icon="business-outline"
                  label="Department"
                  value={user.department}
                  divider
                />
              )}
              {user.position && (
                <InfoRow
                  icon="briefcase-outline"
                  label="Position"
                  value={user.position}
                  divider
                />
              )}
            </View>
          </Section>
        )}

        {/* Activity */}
        <Section title="Activity">
          <View className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <InfoRow
              icon="time-outline"
              label="Last login"
              value={formatDate(user.lastLoginAt, "Never")}
            />
            <InfoRow
              icon="calendar-outline"
              label="Account created"
              value={formatDate(user.createdAt)}
              divider
            />
          </View>
        </Section>
      </ScrollView>

      {showStatusAction && (
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-4">
          <Pressable
            onPress={() => setStatusSheetOpen(true)}
            className="bg-brand-600 rounded-xl py-3.5 items-center active:bg-brand-700"
          >
            <Text className="text-white font-semibold text-base">
              Change Status
            </Text>
          </Pressable>
        </View>
      )}

      <StatusChangeSheet
        user={user}
        visible={statusSheetOpen}
        onClose={() => setStatusSheetOpen(false)}
        onSuccess={() => refetch()}
      />
    </SafeAreaView>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View className="flex-row items-center px-4 py-3 bg-stone-50 border-b border-slate-100">
      <Pressable
        onPress={onBack}
        className="w-10 h-10 items-center justify-center rounded-full active:bg-slate-200"
      >
        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
      </Pressable>
      <Text className="flex-1 text-lg font-semibold text-slate-900 ml-2">
        {title}
      </Text>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mt-6">
      <Text className="text-xs font-semibold text-slate-500 uppercase mb-3">
        {title}
      </Text>
      {children}
    </View>
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
      className={`flex-row items-center px-5 py-4 ${
        divider ? "border-t border-slate-100" : ""
      }`}
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
