import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import { colors } from "../../constants/colors";
import { getUser } from "../../lib/auth";
import { useDashboard } from "../../lib/hooks/use-dashboard";
import type { AlertSeverity, User } from "../../types";

const SEVERITY_COLORS: Record<
  AlertSeverity,
  {
    bg: string;
    text: string;
    iconColor: string;
    icon: keyof typeof Ionicons.glyphMap;
  }
> = {
  CRITICAL: {
    bg: "bg-red-100",
    text: "text-red-700",
    iconColor: "#b91c1c",
    icon: "alert-circle",
  },
  WARNING: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    iconColor: "#b45309",
    icon: "warning",
  },
  INFO: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    iconColor: "#1d4ed8",
    icon: "information-circle",
  },
};

function formatRelativeTime(iso: string) {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
  return `${Math.floor(diffMin / 1440)}d ago`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const { data, isLoading, refetch } = useDashboard();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getUser().then(setUser);
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  const stats = data?.stats;
  const urgentAlerts = data?.urgentAlerts ?? [];
  const recentActivity = data?.recentActivity ?? [];

  return (
    <SafeAreaView className="flex-1 bg-stone-50" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.brand[600]}
          />
        }
      >
        {/* Header */}
        <View className="px-6 pt-2 pb-4 flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-sm text-slate-500">{getGreeting()},</Text>
            <Text className="text-2xl font-bold text-slate-900">
              {user ? user.firstName : "..."}
            </Text>
          </View>
          <View className="w-12 h-12 rounded-full bg-brand-100 items-center justify-center">
            <Text className="text-xl font-semibold text-brand-700">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </Text>
          </View>
        </View>

        {/* Stats grid */}
        <View className="px-6 mb-6">
          <Text className="text-xs font-semibold text-slate-500 uppercase mb-3">
            Today&apos;s Overview
          </Text>
          <View className="flex-row flex-wrap" style={{ gap: 8 }}>
            <StatCard
              label={
                user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"
                  ? "Total Plots"
                  : "My Plots"
              }
              value={stats?.plots ?? 0}
              icon="leaf"
              color={colors.brand[600]}
              onPress={() => router.push("/(app)/plots")}
            />
            <StatCard
              label="Open Alerts"
              value={stats?.openAlerts ?? 0}
              icon="warning"
              color={stats?.openAlerts ? "#dc2626" : colors.text.muted}
              onPress={() => router.push("/(app)/alerts")}
            />
            <StatCard
              label="Observations"
              value={stats?.myObservations ?? 0}
              icon="document-text"
              color={colors.brand[600]}
            />
            <StatCard
              label="Today"
              value={stats?.todaysObservations ?? 0}
              icon="today"
              color={colors.brand[600]}
            />
          </View>
        </View>

        {/* Urgent Alerts */}
        {urgentAlerts.length > 0 && (
          <View className="px-6 mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs font-semibold text-slate-500 uppercase">
                Needs Attention
              </Text>
              <Pressable onPress={() => router.push("/(app)/alerts")}>
                <Text className="text-xs text-brand-600 font-medium">
                  See all →
                </Text>
              </Pressable>
            </View>
            {urgentAlerts.map((alert) => {
              const sev = SEVERITY_COLORS[alert.severity];
              return (
                <Pressable
                  key={alert.id}
                  onPress={() => router.push(`/(app)/plots/${alert.plot.id}`)}
                  className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mb-2 active:bg-stone-50"
                >
                  <View className="flex-row items-start gap-3">
                    <View
                      className={`${sev.bg} w-10 h-10 rounded-full items-center justify-center`}
                    >
                      <Ionicons
                        name={sev.icon}
                        size={20}
                        color={sev.iconColor}
                      />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 flex-wrap">
                        <Text className="text-sm font-semibold text-slate-900">
                          {alert.plot.name}
                        </Text>
                        <View className={`${sev.bg} px-2 py-0.5 rounded-full`}>
                          <Text className={`text-xs ${sev.text} font-medium`}>
                            {alert.severity}
                          </Text>
                        </View>
                      </View>
                      <Text
                        className="text-sm text-slate-700 mt-1"
                        numberOfLines={2}
                      >
                        {alert.message}
                      </Text>
                      <Text className="text-xs text-slate-400 mt-1">
                        {formatRelativeTime(alert.createdAt)}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <View className="px-6 mb-6">
            <Text className="text-xs font-semibold text-slate-500 uppercase mb-3">
              Recent Activity
            </Text>
            <View className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {recentActivity.map((activity, idx) => (
                <Pressable
                  key={activity.id}
                  onPress={() =>
                    router.push(`/(app)/plots/${activity.plot.id}`)
                  }
                  className={`flex-row items-center p-3 active:bg-stone-50 ${idx < recentActivity.length - 1 ? "border-b border-slate-100" : ""}`}
                >
                  {activity.images.length > 0 ? (
                    <Image
                      source={{ uri: activity.images[0].imageUrl }}
                      className="w-12 h-12 rounded-lg bg-stone-100"
                    />
                  ) : (
                    <View className="w-12 h-12 rounded-lg bg-brand-100 items-center justify-center">
                      <Ionicons
                        name="document-text"
                        size={20}
                        color={colors.brand[600]}
                      />
                    </View>
                  )}
                  <View className="flex-1 ml-3">
                    <Text className="text-sm font-medium text-slate-900">
                      {activity.user.firstName} {activity.user.lastName}
                    </Text>
                    <Text
                      className="text-xs text-slate-500 mt-0.5"
                      numberOfLines={1}
                    >
                      {activity.plot.name} •{" "}
                      {formatRelativeTime(activity.createdAt)}
                    </Text>
                    {activity.observations && (
                      <Text
                        className="text-xs text-slate-600 mt-0.5"
                        numberOfLines={1}
                      >
                        {activity.observations.split("\n")[0]}
                      </Text>
                    )}
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.text.muted}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View className="px-6 mb-2">
          <Text className="text-xs font-semibold text-slate-500 uppercase mb-3">
            Quick Actions
          </Text>
          <View className="flex-row" style={{ gap: 12 }}>
            <Pressable
              onPress={() => router.push("/(app)/plots")}
              className="flex-1 bg-brand-600 rounded-2xl py-4 items-center active:bg-brand-700"
            >
              <Ionicons name="leaf" size={24} color="white" />
              <Text className="text-white font-semibold text-sm mt-1">
                My Plots
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/(app)/alerts")}
              className="flex-1 bg-white border border-slate-200 rounded-2xl py-4 items-center active:bg-stone-50"
            >
              <Ionicons
                name="notifications"
                size={24}
                color={colors.brand[600]}
              />
              <Text className="text-slate-700 font-semibold text-sm mt-1">
                Alerts
              </Text>
            </Pressable>
          </View>
        </View>

        {isLoading && !data && (
          <View className="items-center py-8">
            <ActivityIndicator color={colors.brand[600]} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  onPress,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress?: () => void;
}) {
  const card = (
    <View className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
      <Ionicons name={icon} size={20} color={color} />
      <Text className="text-2xl font-bold text-slate-900 mt-2">{value}</Text>
      <Text className="text-xs text-slate-500 mt-0.5">{label}</Text>
    </View>
  );

  return (
    <View style={{ width: "48.5%" }}>
      {onPress ? (
        <Pressable onPress={onPress} className="active:opacity-70">
          {card}
        </Pressable>
      ) : (
        card
      )}
    </View>
  );
}
