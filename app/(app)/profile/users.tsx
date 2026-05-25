import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../constants/colors";
import { getUser } from "../../../lib/auth";
import { useUpdateUserStatus, useUsers } from "../../../lib/hooks/use-users";
import type { User, UserListItem } from "../../../types";

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

const STATUS_META: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Active", color: "#16a34a" },
  INACTIVE: { label: "Inactive", color: "#64748b" },
  SUSPENDED: { label: "Suspended", color: "#dc2626" },
};

const STATUS_KEYS = ["ACTIVE", "INACTIVE", "SUSPENDED"] as const;

export default function Users() {
  const router = useRouter();
  const { data, isLoading, refetch, error } = useUsers();
  const updateStatus = useUpdateUserStatus();
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selected, setSelected] = useState<UserListItem | null>(null);

  useEffect(() => {
    getUser().then(setCurrentUser);
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  // Who can the current admin manage?
  function canManage(target: UserListItem) {
    if (!currentUser) return false;
    if (target.id === currentUser.id) return false; // not yourself
    if (target.role === "SUPER_ADMIN") return false; // never from mobile
    if (target.role === "ADMIN" && currentUser.role !== "SUPER_ADMIN")
      return false; // only super admin manages admins
    return true;
  }

  function handleSetStatus(status: string) {
    if (!selected) return;
    if (status === selected.status) {
      setSelected(null);
      return;
    }
    updateStatus.mutate(
      { id: selected.id, status },
      {
        onSuccess: () => setSelected(null),
        onError: (err: any) =>
          Alert.alert("Could not update", err?.message ?? "Try again"),
      },
    );
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
                      disabled={!canManage(u)}
                      onPress={() => setSelected(u)}
                    />
                  ))}
                </View>
              </View>
            );
          })}
      </ScrollView>

      {/* Status change sheet */}
      <Modal
        visible={selected != null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setSelected(null)}
        >
          <Pressable
            className="bg-white rounded-t-3xl px-5 pt-3 pb-8"
            onPress={() => {}}
          >
            <View className="w-10 h-1.5 rounded-full bg-slate-200 self-center mb-4" />

            <Text className="text-base font-semibold text-slate-900">
              {selected?.firstName} {selected?.lastName}
            </Text>
            <Text className="text-xs text-slate-500 mb-4">
              Change account status
            </Text>

            {STATUS_KEYS.map((s) => {
              const sm = STATUS_META[s];
              const isCurrent = selected?.status === s;
              return (
                <Pressable
                  key={s}
                  disabled={updateStatus.isPending}
                  onPress={() => handleSetStatus(s)}
                  className="flex-row items-center py-3.5 active:opacity-60"
                >
                  <View
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: sm.color }}
                  />
                  <Text className="flex-1 ml-3 text-base text-slate-900">
                    {sm.label}
                  </Text>
                  {isCurrent && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.brand[600]}
                    />
                  )}
                </Pressable>
              );
            })}

            {updateStatus.isPending && (
              <View className="items-center pt-2">
                <ActivityIndicator color={colors.brand[600]} />
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function UserRow({
  user,
  divider,
  onPress,
  disabled,
}: {
  user: UserListItem;
  divider: boolean;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const status = STATUS_META[user.status] ?? STATUS_META.ACTIVE;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`flex-row items-center p-4 ${
        divider ? "border-b border-slate-100" : ""
      } ${!disabled ? "active:bg-slate-50" : ""}`}
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
      {!disabled && (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.text.muted}
          style={{ marginLeft: 6 }}
        />
      )}
    </Pressable>
  );
}
