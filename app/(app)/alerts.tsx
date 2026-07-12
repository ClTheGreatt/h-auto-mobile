import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
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
import { colors } from "../../constants/colors";
import { useAlerts } from "../../lib/hooks/use-alerts";
import type { AlertItem, AlertSeverity } from "../../types";

type FilterSeverity = "ALL" | AlertSeverity;
type Tab = "OPEN" | "RESOLVED";

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

const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  CRITICAL: 0,
  WARNING: 1,
  INFO: 2,
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

function formatResolvedDate(iso: string) {
  return new Date(iso).toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatType(type: string) {
  return type
    .toLowerCase()
    .split("_")
    .join(" ")
    .replace(/^./, (c) => c.toUpperCase());
}

export default function Alerts() {
  const router = useRouter();
  const { data, isLoading, refetch, error } = useAlerts();
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<Tab>("OPEN");
  const [query, setQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<FilterSeverity>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  function changeTab(t: Tab) {
    setTab(t);
    setTypeFilter("ALL"); // types differ between open and resolved
  }

  const allAlerts = useMemo(() => data?.alerts ?? [], [data]);
  const openCount = allAlerts.filter((a) => !a.resolved).length;
  const resolvedCount = allAlerts.filter((a) => a.resolved).length;

  const tabAlerts = useMemo(
    () => allAlerts.filter((a) => (tab === "OPEN" ? !a.resolved : a.resolved)),
    [allAlerts, tab],
  );

  const sevCounts = {
    ALL: tabAlerts.length,
    CRITICAL: tabAlerts.filter((a) => a.severity === "CRITICAL").length,
    WARNING: tabAlerts.filter((a) => a.severity === "WARNING").length,
    INFO: tabAlerts.filter((a) => a.severity === "INFO").length,
  };

  const presentTypes = useMemo(
    () => Array.from(new Set(tabAlerts.map((a) => a.type))),
    [tabAlerts],
  );

  const filteredAlerts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tabAlerts
      .filter((a) => severityFilter === "ALL" || a.severity === severityFilter)
      .filter((a) => typeFilter === "ALL" || a.type === typeFilter)
      .filter(
        (a) =>
          !q ||
          a.message.toLowerCase().includes(q) ||
          a.plot.name.toLowerCase().includes(q),
      )
      .sort((a, b) => {
        const sevDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
        if (sevDiff !== 0) return sevDiff;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
  }, [tabAlerts, severityFilter, typeFilter, query]);

  const hasActiveFilter =
    query.trim() !== "" || severityFilter !== "ALL" || typeFilter !== "ALL";

  return (
    <SafeAreaView className="flex-1 bg-stone-50" edges={["top"]}>
      <View className="px-6 pt-4 pb-2">
        <Text className="text-2xl font-bold text-slate-900">Alerts</Text>
        <Text className="text-sm text-slate-500 mt-0.5">
          {filteredAlerts.length} {tab === "OPEN" ? "open" : "resolved"}
          {hasActiveFilter ? ` of ${tabAlerts.length}` : ""}
        </Text>
      </View>

      {/* Open / Resolved tabs */}
      <View className="flex-row bg-slate-100 rounded-xl p-1 mx-6 mb-3">
        <Pressable
          onPress={() => changeTab("OPEN")}
          className={`flex-1 py-2 rounded-lg items-center ${
            tab === "OPEN" ? "bg-white" : ""
          }`}
        >
          <Text
            className={`text-sm font-medium ${
              tab === "OPEN" ? "text-slate-900" : "text-slate-500"
            }`}
          >
            Open ({openCount})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => changeTab("RESOLVED")}
          className={`flex-1 py-2 rounded-lg items-center ${
            tab === "RESOLVED" ? "bg-white" : ""
          }`}
        >
          <Text
            className={`text-sm font-medium ${
              tab === "RESOLVED" ? "text-slate-900" : "text-slate-500"
            }`}
          >
            Resolved ({resolvedCount})
          </Text>
        </Pressable>
      </View>

      {/* Search */}
      <View className="px-6 pb-2">
        <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-3">
          <Ionicons name="search" size={18} color={colors.text.muted} />
          <TextInput
            className="flex-1 py-2.5 px-2 text-base text-slate-900"
            placeholder="Search message or plot..."
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
      </View>

      {/* Severity chips */}
      <View style={{ height: 46 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 24,
            alignItems: "center",
            gap: 8,
          }}
        >
          <FilterChip
            label={`All (${sevCounts.ALL})`}
            active={severityFilter === "ALL"}
            onPress={() => setSeverityFilter("ALL")}
          />
          <FilterChip
            label={`Critical (${sevCounts.CRITICAL})`}
            active={severityFilter === "CRITICAL"}
            onPress={() => setSeverityFilter("CRITICAL")}
            severity="CRITICAL"
          />
          <FilterChip
            label={`Warning (${sevCounts.WARNING})`}
            active={severityFilter === "WARNING"}
            onPress={() => setSeverityFilter("WARNING")}
            severity="WARNING"
          />
          <FilterChip
            label={`Info (${sevCounts.INFO})`}
            active={severityFilter === "INFO"}
            onPress={() => setSeverityFilter("INFO")}
            severity="INFO"
          />
        </ScrollView>
      </View>

      {/* Type chips (only when more than one type is present) */}
      {presentTypes.length >= 2 && (
        <View style={{ height: 46 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 24,
              alignItems: "center",
              gap: 8,
            }}
          >
            <FilterChip
              label="All types"
              active={typeFilter === "ALL"}
              onPress={() => setTypeFilter("ALL")}
            />
            {presentTypes.map((t) => (
              <FilterChip
                key={t}
                label={formatType(t)}
                active={typeFilter === t}
                onPress={() => setTypeFilter(t)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 24,
          paddingTop: 8,
        }}
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
              Failed to load alerts
            </Text>
            <Text className="text-xs text-red-700 mt-1">
              Pull down to retry
            </Text>
          </View>
        )}

        {!isLoading && !error && filteredAlerts.length === 0 && (
          <View className="items-center py-16">
            <Ionicons
              name={
                hasActiveFilter
                  ? "search"
                  : tab === "OPEN"
                    ? "checkmark-circle"
                    : "checkmark-done"
              }
              size={48}
              color={hasActiveFilter ? colors.text.muted : colors.brand[600]}
            />
            <Text className="text-base font-medium text-slate-700 mt-4">
              {hasActiveFilter
                ? "No matching alerts"
                : tab === "OPEN"
                  ? "All clear!"
                  : "No resolved alerts"}
            </Text>
            <Text className="text-sm text-slate-500 mt-1 text-center">
              {hasActiveFilter
                ? "Try a different search or filter."
                : tab === "OPEN"
                  ? "No open alerts right now."
                  : "Resolved alerts will appear here."}
            </Text>
          </View>
        )}

        {filteredAlerts.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onPress={() => router.push(`/(app)/plots/${alert.plot.id}`)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function FilterChip({
  label,
  active,
  onPress,
  severity,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  severity?: AlertSeverity;
}) {
  const sevColors = severity ? SEVERITY_COLORS[severity] : null;
  const activeBg = sevColors ? sevColors.bg : "bg-brand-600";
  const activeText = sevColors ? sevColors.text : "text-white";

  return (
    <Pressable
      onPress={onPress}
      style={{ height: 34 }}
      className={`px-4 rounded-full border items-center justify-center ${
        active ? `${activeBg} border-transparent` : "bg-white border-slate-200"
      } active:opacity-80`}
    >
      <Text
        className={`text-xs font-medium ${active ? activeText : "text-slate-700"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function AlertCard({
  alert,
  onPress,
}: {
  alert: AlertItem;
  onPress: () => void;
}) {
  const sev = SEVERITY_COLORS[alert.severity];

  return (
    <Pressable
      onPress={onPress}
      className={`bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mb-3 active:bg-stone-50 ${
        alert.resolved ? "opacity-60" : ""
      }`}
    >
      <View className="flex-row items-start gap-3">
        <View
          className={`${sev.bg} w-10 h-10 rounded-full items-center justify-center`}
        >
          <Ionicons name={sev.icon} size={20} color={sev.iconColor} />
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
            {alert.resolved && (
              <View className="bg-green-100 px-2 py-0.5 rounded-full flex-row items-center gap-1">
                <Ionicons name="checkmark-circle" size={12} color="#16a34a" />
                <Text className="text-xs text-green-700 font-medium">
                  Resolved
                </Text>
              </View>
            )}
          </View>
          <Text className="text-sm text-slate-700 mt-1">{alert.message}</Text>
          <Text className="text-xs text-slate-400 mt-1.5">
            {formatRelativeTime(alert.createdAt)}
          </Text>
          {alert.resolved && alert.resolvedAt && (
            <Text className="text-xs text-green-600 mt-0.5">
              Resolved · {formatResolvedDate(alert.resolvedAt)}
            </Text>
          )}
          {alert.suggestionTitle && (
            <View className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="bulb" size={12} color="#047857" />
                <Text className="text-[10px] font-semibold text-emerald-800 uppercase">
                  Suggested action
                </Text>
              </View>
              <Text className="mt-1 text-sm font-semibold text-emerald-900">
                {alert.suggestionTitle}
              </Text>
              {alert.suggestionSteps.length > 0 && (
                <View className="mt-1.5" style={{ gap: 2 }}>
                  {alert.suggestionSteps.map((step, i) => (
                    <View key={i} className="flex-row">
                      <Text className="text-sm text-emerald-900/90 w-5">
                        {i + 1}.
                      </Text>
                      <Text className="text-sm text-emerald-900/90 flex-1">
                        {step}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
      </View>
    </Pressable>
  );
}
