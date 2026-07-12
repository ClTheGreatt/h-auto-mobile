import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { STATUS_META } from "../../../../components/StatusChangeSheet";
import { colors } from "../../../../constants/colors";
import { useUsers } from "../../../../lib/hooks/use-users";
import type { UserListItem } from "../../../../types";

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

export default function Users() {
  const router = useRouter();
  const { data, isLoading, refetch, error } = useUsers();
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  const users = data?.users ?? [];
  const groupedByRole: Record<string, UserListItem[]> = {};
  for (const u of users) {
    if (!groupedByRole[u.role]) groupedByRole[u.role] = [];
    groupedByRole[u.role].push(u);
  }

  const roleOrder = ["SUPER_ADMIN", "ADMIN", "FACULTY", "STUDENT_FARMER"];

  return (
    <SafeAreaView className="flex-1 bg-stone-50" edges={["top"]}>
      <View className="flex-row items-center px-4 py-3 bg-stone-50 border-b border-slate-100">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full active:bg-slate-200"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <View className="flex-1 ml-2">
          <Text className="text-lg font-semibold text-slate-900">Users</Text>
          <Text className="text-xs text-slate-500">
            {users.length} {users.length === 1 ? "account" : "accounts"}
          </Text>
        </View>
        <View className="flex-row" style={{ gap: 8 }}>
          <Pressable
            onPress={() => router.push("/(app)/profile/import-users")}
            className="w-10 h-10 items-center justify-center rounded-full bg-white border border-slate-200 active:bg-slate-100"
          >
            <Ionicons
              name="cloud-upload-outline"
              size={20}
              color={colors.text.primary}
            />
          </Pressable>
          <Pressable
            onPress={() => router.push("/(app)/profile/add-user")}
            className="w-10 h-10 items-center justify-center rounded-full bg-brand-600 active:bg-brand-700"
          >
            <Ionicons name="add" size={22} color="white" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.brand[600]}
          />
        }
      >
        {isLoading && (
          <View className="items-center py-12">
            <ActivityIndicator color={colors.brand[600]} />
          </View>
        )}

        {error && (
          <View className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <Text className="text-sm font-medium text-red-900">
              Failed to load users
            </Text>
          </View>
        )}

        {!isLoading &&
          roleOrder.map((role) => {
            const list = groupedByRole[role];
            if (!list || list.length === 0) return null;
            const meta = ROLE_META[role];
            return (
              <View key={role} className="mb-5">
                <View className="flex-row items-center mb-3">
                  <Text className="text-xs font-semibold text-slate-500 uppercase">
                    {meta.label}
                  </Text>
                  <Text className="text-xs text-slate-400 ml-2">
                    · {list.length}
                  </Text>
                </View>
                <View className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  {list.map((u, idx) => (
                    <UserRow
                      key={u.id}
                      user={u}
                      divider={idx < list.length - 1}
                      onPress={() => router.push(`/(app)/profile/users/${u.id}`)}
                    />
                  ))}
                </View>
              </View>
            );
          })}
      </ScrollView>
    </SafeAreaView>
  );
}

function UserRow({
  user,
  divider,
  onPress,
}: {
  user: UserListItem;
  divider: boolean;
  onPress?: () => void;
}) {
  const status = STATUS_META[user.status] ?? STATUS_META.ACTIVE;
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center p-4 active:bg-slate-50 ${
        divider ? "border-b border-slate-100" : ""
      }`}
    >
      {user.profileImage ? (
        <Image
          source={{ uri: user.profileImage }}
          className="w-11 h-11 rounded-full bg-stone-100"
        />
      ) : (
        <View className="w-11 h-11 rounded-full bg-brand-100 items-center justify-center">
          <Text className="text-sm font-semibold text-brand-700">
            {user.firstName[0]}
            {user.lastName[0]}
          </Text>
        </View>
      )}
      <View className="flex-1 ml-3">
        <Text className="text-sm font-medium text-slate-900">
          {user.firstName} {user.lastName}
        </Text>
        <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>
          {user.email}
        </Text>
      </View>
      <View
        className="px-2 py-1 rounded-full"
        style={{ backgroundColor: `${status.color}15` }}
      >
        <Text className="text-xs font-medium" style={{ color: status.color }}>
          {status.label}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={colors.text.muted}
        style={{ marginLeft: 6 }}
      />
    </Pressable>
  );
}
