import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../constants/colors";
import { getUser } from "../../../lib/auth";
import { useMyPlots } from "../../../lib/hooks/use-my-plots";
import type { Plot, User } from "../../../types";

const STATUS_COLORS: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  PREPARING: { bg: "bg-slate-100", text: "text-slate-700", label: "Preparing" },
  PLANTED: { bg: "bg-blue-100", text: "text-blue-700", label: "Planted" },
  GROWING: { bg: "bg-brand-100", text: "text-brand-700", label: "Growing" },
  READY_FOR_HARVEST: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    label: "Ready",
  },
  HARVESTED: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    label: "Harvested",
  },
  FALLOW: { bg: "bg-stone-100", text: "text-stone-700", label: "Fallow" },
};

export default function Plots() {
  const [user, setUser] = useState<User | null>(null);
  const { data, isLoading, refetch, error } = useMyPlots();
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    getUser().then(setUser);
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  const plots = data?.plots ?? [];

  // Status chips: "All" + only the statuses that actually exist in the data
  const statusChips = useMemo(() => {
    const present = Array.from(new Set(plots.map((p) => p.status)));
    return [
      { key: "ALL", label: "All" },
      ...present.map((s) => ({
        key: s,
        label: STATUS_COLORS[s]?.label ?? s,
      })),
    ];
  }, [plots]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return plots.filter((p) => {
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.location?.toLowerCase().includes(q) ?? false) ||
        (p.cropName?.toLowerCase().includes(q) ?? false);
      const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [plots, query, statusFilter]);

  return (
    <SafeAreaView className="flex-1 bg-stone-50" edges={["top"]}>
      <View className="px-6 pt-4 pb-2">
        <Text className="text-2xl font-bold text-slate-900">
          {user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"
            ? "All Plots"
            : user?.role === "FACULTY"
              ? "Plots I Oversee"
              : "My Plots"}
        </Text>
        <Text className="text-sm text-slate-500 mt-0.5">
          {filtered.length} {filtered.length === 1 ? "plot" : "plots"}
          {(query.trim() || statusFilter !== "ALL") && plots.length > 0
            ? ` of ${plots.length}`
            : ""}
        </Text>
      </View>

      {/* Search + filters */}
      {!isLoading && !error && plots.length > 0 && (
        <View className="px-6 pb-2">
          <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-3 mb-3">
            <Ionicons name="search" size={18} color={colors.text.muted} />
            <TextInput
              className="flex-1 py-2.5 px-2 text-base text-slate-900"
              placeholder="Search name, location, crop..."
              placeholderTextColor="#94a3b8"
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")} hitSlop={8}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={colors.text.muted}
                />
              </Pressable>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {statusChips.map((chip) => {
              const active = statusFilter === chip.key;
              return (
                <Pressable
                  key={chip.key}
                  onPress={() => setStatusFilter(chip.key)}
                  className={`px-3.5 py-1.5 rounded-full border ${
                    active
                      ? "bg-brand-600 border-brand-600"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      active ? "text-white" : "text-slate-600"
                    }`}
                  >
                    {chip.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
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
          <View className="bg-red-50 border border-red-200 rounded-2xl p-4 mt-4">
            <Text className="text-sm font-medium text-red-900">
              Failed to load plots
            </Text>
            <Text className="text-xs text-red-700 mt-1">
              Pull down to retry
            </Text>
          </View>
        )}

        {!isLoading && !error && plots.length === 0 && (
          <View className="items-center py-16">
            <Ionicons name="leaf-outline" size={48} color={colors.text.muted} />
            <Text className="text-base font-medium text-slate-700 mt-4">
              No plots yet
            </Text>
            <Text className="text-sm text-slate-500 mt-1 text-center">
              Plots assigned to you will appear here.
            </Text>
          </View>
        )}

        {!isLoading && !error && plots.length > 0 && filtered.length === 0 && (
          <View className="items-center py-16">
            <Ionicons name="search" size={48} color={colors.text.muted} />
            <Text className="text-base font-medium text-slate-700 mt-4">
              No matching plots
            </Text>
            <Text className="text-sm text-slate-500 mt-1 text-center">
              Try a different search or filter.
            </Text>
          </View>
        )}

        {filtered.map((plot) => (
          <PlotCard key={plot.id} plot={plot} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function PlotCard({ plot }: { plot: Plot }) {
  const router = useRouter();
  const statusStyle = STATUS_COLORS[plot.status] ?? STATUS_COLORS.PREPARING;

  return (
    <Pressable
      onPress={() => router.push(`/(app)/plots/${plot.id}`)}
      className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-3 active:bg-stone-50"
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-slate-900">
            {plot.name}
          </Text>
          {plot.location && (
            <View className="flex-row items-center gap-1 mt-0.5">
              <Ionicons
                name="location-outline"
                size={12}
                color={colors.text.muted}
              />
              <Text className="text-xs text-slate-500">{plot.location}</Text>
            </View>
          )}
        </View>
        <View className={`px-2.5 py-1 rounded-full ${statusStyle.bg}`}>
          <Text className={`text-xs font-medium ${statusStyle.text}`}>
            {statusStyle.label}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-4 mt-3">
        {plot.cropName && (
          <View className="flex-row items-center gap-1">
            <Ionicons name="leaf" size={14} color={colors.brand[600]} />
            <Text className="text-sm text-slate-700">{plot.cropName}</Text>
          </View>
        )}
        {plot.openAlertsCount > 0 && (
          <View className="flex-row items-center gap-1">
            <Ionicons name="warning" size={14} color="#dc2626" />
            <Text className="text-sm text-red-600 font-medium">
              {plot.openAlertsCount} alert{plot.openAlertsCount > 1 ? "s" : ""}
            </Text>
          </View>
        )}
        <View className="flex-1 items-end">
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.text.muted}
          />
        </View>
      </View>
    </Pressable>
  );
}
