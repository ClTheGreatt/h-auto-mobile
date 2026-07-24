import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StudentFarmerSection } from "../../../../components/StudentFarmerSection";
import { UserListRow } from "../../../../components/UserListRow";
import { colors } from "../../../../constants/colors";
import { groupStudents } from "../../../../lib/group-students";
import { useUsers, type UsersView } from "../../../../lib/hooks/use-users";
import type { UserListItem } from "../../../../types";

// Student Farmer rows are rendered via StudentFarmerSection's Course >
// Year > Section grouping instead of a flat list — everyone else stays a
// flat role section, same as before.
const ROLE_META: Record<string, { label: string; color: string; bg: string }> =
  {
    SUPER_ADMIN: {
      label: "Super Admin",
      color: "#7c3aed",
      bg: "bg-purple-100",
    },
    ADMIN: { label: "Admin", color: "#2563eb", bg: "bg-blue-100" },
    FACULTY: { label: "Faculty", color: "#d97706", bg: "bg-amber-100" },
  };

const FLAT_ROLE_ORDER = ["SUPER_ADMIN", "ADMIN", "FACULTY"];

export default function Users() {
  const router = useRouter();
  const [view, setView] = useState<UsersView>("active");
  const { data, isLoading, refetch, error } = useUsers(view);
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  function goToUser(user: UserListItem) {
    router.push(`/(app)/profile/users/${user.id}`);
  }

  const users = data?.users ?? [];
  const groupedByRole: Record<string, UserListItem[]> = {};
  for (const u of users) {
    if (!groupedByRole[u.role]) groupedByRole[u.role] = [];
    groupedByRole[u.role].push(u);
  }
  const courseGroups = groupStudents(groupedByRole.STUDENT_FARMER ?? []);

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

      {/* Active/Graduated tabs — mirrors the web Users page */}
      <View className="flex-row px-5 pt-3" style={{ gap: 8 }}>
        {(
          [
            { value: "active" as const, label: "Active" },
            { value: "graduated" as const, label: "Graduated" },
          ]
        ).map((tab) => {
          const active = view === tab.value;
          return (
            <Pressable
              key={tab.value}
              onPress={() => setView(tab.value)}
              className={`px-3 py-1.5 rounded-lg ${
                active ? "bg-brand-100" : ""
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  active ? "text-brand-700" : "text-slate-500"
                }`}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
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

        {!isLoading && !error && (
          <>
            {FLAT_ROLE_ORDER.map((role) => {
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
                      <UserListRow
                        key={u.id}
                        user={u}
                        divider={idx < list.length - 1}
                        onPress={() => goToUser(u)}
                      />
                    ))}
                  </View>
                </View>
              );
            })}

            <StudentFarmerSection
              courseGroups={courseGroups}
              onPressUser={goToUser}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
