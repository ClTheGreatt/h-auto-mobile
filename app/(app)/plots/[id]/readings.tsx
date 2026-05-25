import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    SectionList,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    MonthPickerModal,
    formatMonth,
} from "../../../../components/month-picker";
import { colors } from "../../../../constants/colors";
import {
    usePlotReadings,
    type PlotReading,
} from "../../../../lib/hooks/use-plot-readings";

type RangeKey = "all" | "7d" | "30d";

const RANGE_CHIPS: [RangeKey, string][] = [
  ["all", "Latest"],
  ["7d", "7 days"],
  ["30d", "30 days"],
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ReadingsHistory() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [range, setRange] = useState<RangeKey>("all");
  const [month, setMonth] = useState<string | null>(null);
  const [order, setOrder] = useState<"desc" | "asc">("desc");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePlotReadings(id, {
    month,
    range: month || range === "all" ? null : range,
    order,
  });

  const readings = useMemo(
    () => data?.pages.flatMap((p) => p.readings) ?? [],
    [data],
  );

  const sections = useMemo(() => {
    const map = new Map<string, { title: string; data: PlotReading[] }>();
    const keys: string[] = [];
    for (const r of readings) {
      const d = new Date(r.recordedAt);
      const key = d.toDateString();
      if (!map.has(key)) {
        map.set(key, {
          title: d.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          data: [],
        });
        keys.push(key);
      }
      map.get(key)!.data.push(r);
    }
    return keys.map((k) => map.get(k)!);
  }, [readings]);

  async function onRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-stone-50" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-stone-50 border-b border-slate-100">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full active:bg-slate-200"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text className="flex-1 text-lg font-semibold text-slate-900 ml-2">
          Readings history
        </Text>
        <Pressable
          onPress={() => setOrder((o) => (o === "desc" ? "asc" : "desc"))}
          className="flex-row items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-slate-200 active:opacity-80"
        >
          <Ionicons name="swap-vertical" size={14} color={colors.text.muted} />
          <Text className="text-xs font-medium text-slate-700">
            {order === "desc" ? "Newest" : "Oldest"}
          </Text>
        </Pressable>
      </View>

      {/* Filters */}
      <View style={{ height: 48 }} className="border-b border-slate-100">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            alignItems: "center",
            gap: 8,
          }}
        >
          {RANGE_CHIPS.map(([k, label]) => (
            <FilterChip
              key={k}
              label={label}
              active={month === null && range === k}
              onPress={() => {
                setMonth(null);
                setRange(k);
              }}
            />
          ))}
          <Pressable
            onPress={() => setPickerOpen(true)}
            style={{ height: 32 }}
            className={`flex-row items-center px-4 rounded-full border ${
              month
                ? "bg-brand-600 border-transparent"
                : "bg-white border-slate-200"
            } active:opacity-80`}
          >
            <Ionicons
              name="calendar-outline"
              size={13}
              color={month ? "#ffffff" : colors.text.muted}
            />
            <Text
              className={`text-xs font-medium ml-1.5 ${
                month ? "text-white" : "text-slate-700"
              }`}
            >
              {month ? formatMonth(month) : "By month"}
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand[600]} />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle" size={48} color={colors.status.error} />
          <Text className="text-base font-medium text-slate-700 mt-4">
            Failed to load readings
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="mt-4 px-4 py-2 bg-brand-600 rounded-lg"
          >
            <Text className="text-white text-sm font-medium">Retry</Text>
          </Pressable>
        </View>
      ) : sections.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons
            name="hardware-chip-outline"
            size={48}
            color={colors.text.muted}
          />
          <Text className="text-base font-medium text-slate-700 mt-4">
            No readings found
          </Text>
          <Text className="text-sm text-slate-500 mt-1 text-center">
            Try a different filter or month.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: 20 }}
          stickySectionHeadersEnabled
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.brand[600]}
            />
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          renderSectionHeader={({ section }) => (
            <Text className="text-xs font-semibold text-slate-500 uppercase bg-stone-50 py-2">
              {section.title}
            </Text>
          )}
          renderItem={({ item }) => <ReadingRow reading={item} />}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-4">
                <ActivityIndicator color={colors.brand[600]} />
              </View>
            ) : !hasNextPage ? (
              <Text className="text-center text-xs text-slate-400 py-4">
                End of history
              </Text>
            ) : null
          }
        />
      )}

      <MonthPickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        value={month}
        onSelect={(m) => setMonth(m)}
        availableMonths={[]}
      />
    </SafeAreaView>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{ height: 32 }}
      className={`px-4 rounded-full border items-center justify-center ${
        active ? "bg-brand-600 border-transparent" : "bg-white border-slate-200"
      } active:opacity-80`}
    >
      <Text
        className={`text-xs font-medium ${active ? "text-white" : "text-slate-700"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ReadingRow({ reading }: { reading: PlotReading }) {
  const metrics: { label: string; value: string }[] = [];
  if (reading.soilMoisture !== null)
    metrics.push({
      label: "Soil",
      value: `${reading.soilMoisture.toFixed(0)}%`,
    });
  if (reading.temperature !== null)
    metrics.push({
      label: "Temp",
      value: `${reading.temperature.toFixed(1)}°C`,
    });
  if (reading.humidity !== null)
    metrics.push({
      label: "Humidity",
      value: `${reading.humidity.toFixed(0)}%`,
    });
  if (reading.lightIntensity !== null)
    metrics.push({
      label: "Light",
      value: `${reading.lightIntensity.toFixed(0)} lux`,
    });
  if (reading.nitrogen !== null)
    metrics.push({ label: "N", value: `${reading.nitrogen.toFixed(0)} mg/kg` });
  if (reading.phosphorus !== null)
    metrics.push({
      label: "P",
      value: `${reading.phosphorus.toFixed(0)} mg/kg`,
    });
  if (reading.potassium !== null)
    metrics.push({
      label: "K",
      value: `${reading.potassium.toFixed(0)} mg/kg`,
    });

  return (
    <View className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mb-3">
      <Text className="text-xs font-medium text-slate-500 mb-2">
        {formatTime(reading.recordedAt)}
      </Text>
      <View className="flex-row flex-wrap" style={{ columnGap: 16, rowGap: 4 }}>
        {metrics.map((m) => (
          <Text key={m.label} className="text-sm text-slate-800">
            <Text className="text-slate-500">{m.label}: </Text>
            {m.value}
          </Text>
        ))}
      </View>
    </View>
  );
}
