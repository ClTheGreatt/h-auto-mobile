import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { SafeAreaView } from "react-native-safe-area-context";
import { G, Rect, Text as SvgText } from "react-native-svg";
import { colors } from "../../constants/colors";
import { useAnalytics } from "../../lib/hooks/use-analytics";
import { useMyPlots } from "../../lib/hooks/use-my-plots";

const screenWidth = Dimensions.get("window").width - 48;

type Range = "24h" | "7d" | "30d" | "all";
type Point = { label: string; value: number | null };
type AlertRow = {
  label: string;
  critical: number;
  warning: number;
  info: number;
};

const RANGES: { key: Range; label: string }[] = [
  { key: "24h", label: "24h" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "all", label: "All time" },
];

const RANGE_SUBTITLE: Record<Range, string> = {
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  all: "All time",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PREPARING: { label: "Preparing", color: "#94a3b8" },
  PLANTED: { label: "Planted", color: "#3b82f6" },
  GROWING: { label: "Growing", color: "#16a34a" },
  READY_FOR_HARVEST: { label: "Ready to harvest", color: "#f59e0b" },
  HARVESTED: { label: "Harvested", color: "#a855f7" },
  FALLOW: { label: "Fallow", color: "#78716c" },
};

const baseChartConfig = {
  backgroundColor: "#ffffff",
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  decimalPlaces: 0,
  labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
  strokeWidth: 2,
  propsForBackgroundLines: { strokeDasharray: "", stroke: "#e2e8f0" },
};

function cleanSeries(series: Point[]) {
  const labels: string[] = [];
  const values: number[] = [];
  for (const p of series) {
    if (p.value != null && Number.isFinite(p.value)) {
      labels.push(p.label);
      values.push(p.value);
    }
  }
  return { labels, values };
}

function formatMonth(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function thinLabels(labels: string[], max = 6): string[] {
  if (labels.length <= max) return labels;
  const step = Math.ceil(labels.length / max);
  return labels.map((l, i) => (i % step === 0 ? l : ""));
}

export default function Analytics() {
  const [range, setRange] = useState<Range>("7d");
  const [month, setMonth] = useState<string | null>(null);
  const [plotId, setPlotId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data, isLoading, refetch, error } = useAnalytics(
    plotId,
    range,
    month,
  );
  const { data: plotsData } = useMyPlots();
  const plots = plotsData?.plots ?? [];

  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-stone-50" edges={["top"]}>
      <View className="px-6 pt-4 pb-2">
        <Text className="text-2xl font-bold text-slate-900">Analytics</Text>
        <Text className="text-sm text-slate-500 mt-0.5">
          {month ? formatMonth(month) : RANGE_SUBTITLE[range]}
        </Text>
      </View>

      {/* Range tabs */}
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
          {RANGES.map((r) => (
            <Chip
              key={r.key}
              label={r.label}
              active={month === null && range === r.key}
              onPress={() => {
                setMonth(null);
                setRange(r.key);
              }}
            />
          ))}
          <Pressable
            onPress={() => setPickerOpen(true)}
            style={{ height: 34 }}
            className={`flex-row items-center px-4 rounded-full border ${
              month
                ? "bg-brand-600 border-transparent"
                : "bg-white border-slate-200"
            } active:opacity-80`}
          >
            <Ionicons
              name="calendar-outline"
              size={14}
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

      {/* Plot selector */}
      {plots.length >= 2 && (
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
            <Chip
              label="All plots"
              active={plotId === null}
              onPress={() => setPlotId(null)}
            />
            {plots.map((p) => (
              <Chip
                key={p.id}
                label={p.name}
                active={plotId === p.id}
                onPress={() => setPlotId(p.id)}
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
        {isLoading && !data && (
          <View className="items-center py-12">
            <ActivityIndicator color={colors.brand[600]} />
          </View>
        )}

        {error && (
          <View className="bg-red-50 border border-red-200 rounded-2xl p-4 mt-4">
            <Text className="text-sm font-medium text-red-900">
              Failed to load analytics
            </Text>
            <Text className="text-xs text-red-700 mt-1">
              Pull down to retry
            </Text>
          </View>
        )}

        {data && (
          <>
            {/* Summary */}
            <View className="mb-6 mt-2">
              <Text className="text-xs font-semibold text-slate-500 uppercase mb-3">
                Summary
              </Text>
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                <SummaryTile
                  label="Readings"
                  value={data.summary.totalReadings}
                  icon="hardware-chip"
                />
                <SummaryTile
                  label="Observations"
                  value={data.summary.totalObservations}
                  icon="document-text"
                />
                <SummaryTile
                  label="Avg Soil"
                  value={
                    data.summary.avgSoilMoisture != null
                      ? `${data.summary.avgSoilMoisture.toFixed(0)}%`
                      : "—"
                  }
                  icon="water"
                />
                <SummaryTile
                  label="Avg Temp"
                  value={
                    data.summary.avgTemperature != null
                      ? `${data.summary.avgTemperature.toFixed(1)}°C`
                      : "—"
                  }
                  icon="thermometer"
                />
              </View>
            </View>

            {/* Daily Activity */}
            <ChartCard
              title="Daily Activity"
              subtitle="Observations — tap a bar"
            >
              <ActivityBars rows={data.observationsByDay} />
            </ChartCard>

            {/* Alerts — custom tappable stacked bars */}
            <ChartCard
              title="Alerts"
              subtitle="By severity over time — tap a bar for details"
            >
              <AlertsBars rows={data.alertsByDay ?? []} />
            </ChartCard>

            {/* Trend charts (tap a point to see its value) */}
            <ChartCard
              title="Soil Moisture"
              subtitle="Average (%) — tap a point"
            >
              <TrendLine
                series={data.soilMoistureByDay}
                rgb="59, 130, 246"
                dot="#3b82f6"
                unit="%"
              />
            </ChartCard>

            <ChartCard
              title="Temperature"
              subtitle="Average (°C) — tap a point"
            >
              <TrendLine
                series={data.temperatureByDay}
                rgb="220, 38, 38"
                dot="#dc2626"
                unit="°C"
              />
            </ChartCard>

            <ChartCard title="Humidity" subtitle="Average (%) — tap a point">
              <TrendLine
                series={data.humidityByDay}
                rgb="8, 145, 178"
                dot="#0891b2"
                unit="%"
              />
            </ChartCard>

            <ChartCard
              title="Light Intensity"
              subtitle="Average (lux) — tap a point"
            >
              <TrendLine
                series={data.lightByDay}
                rgb="245, 158, 11"
                dot="#f59e0b"
                unit=" lux"
                decimalPlaces={0}
              />
            </ChartCard>

            {/* NPK */}
            <ChartCard
              title="Nutrients (NPK)"
              subtitle="Averages (mg/kg) — tap a point"
            >
              <NpkChart
                n={data.nitrogenByDay}
                p={data.phosphorusByDay}
                k={data.potassiumByDay}
              />
              <View className="flex-row mt-3" style={{ gap: 8 }}>
                <NpkPill
                  label="N"
                  color="#16a34a"
                  value={data.summary.avgNitrogen}
                />
                <NpkPill
                  label="P"
                  color="#a855f7"
                  value={data.summary.avgPhosphorus}
                />
                <NpkPill
                  label="K"
                  color="#ea580c"
                  value={data.summary.avgPotassium}
                />
              </View>
            </ChartCard>

            {/* Plot Status */}
            <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <Text className="text-sm font-semibold text-slate-900 mb-1">
                Plot Status
              </Text>
              <Text className="text-xs text-slate-500 mb-4">
                {plotId ? "Selected plot" : "Distribution of your plots"}
              </Text>
              {Object.keys(data.statusDistribution).length === 0 ? (
                <Text className="text-sm text-slate-500 text-center py-4">
                  No plots to show
                </Text>
              ) : (
                <View>
                  {Object.entries(data.statusDistribution).map(
                    ([status, count]) => {
                      const total = Object.values(
                        data.statusDistribution,
                      ).reduce((a, b) => a + b, 0);
                      const pct = (count / total) * 100;
                      const meta = STATUS_LABELS[status] ?? {
                        label: status,
                        color: "#94a3b8",
                      };
                      return (
                        <View key={status} className="mb-3">
                          <View className="flex-row items-center justify-between mb-1.5">
                            <View className="flex-row items-center gap-2">
                              <View
                                style={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: 5,
                                  backgroundColor: meta.color,
                                }}
                              />
                              <Text className="text-sm font-medium text-slate-700">
                                {meta.label}
                              </Text>
                            </View>
                            <Text className="text-xs text-slate-500">
                              {count} ({pct.toFixed(0)}%)
                            </Text>
                          </View>
                          <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <View
                              style={{
                                width: `${pct}%`,
                                backgroundColor: meta.color,
                                height: "100%",
                              }}
                            />
                          </View>
                        </View>
                      );
                    },
                  )}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <MonthPickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        value={month}
        onSelect={(m) => setMonth(m)}
        availableMonths={data?.availableMonths ?? []}
      />
    </SafeAreaView>
  );
}

/* ---------- Charts ---------- */

function TrendLine({
  series,
  rgb,
  dot,
  unit = "",
  decimalPlaces = 1,
}: {
  series: Point[];
  rgb: string;
  dot: string;
  unit?: string;
  decimalPlaces?: number;
}) {
  const { labels, values } = cleanSeries(series);
  const [tip, setTip] = useState<{
    x: number;
    y: number;
    value: number;
    index: number;
  } | null>(null);

  if (values.length === 0) {
    return (
      <NoChartData icon="analytics-outline" text="No data in this range" />
    );
  }

  return (
    <LineChart
      data={{ labels: thinLabels(labels), datasets: [{ data: values }] }}
      width={screenWidth}
      height={200}
      chartConfig={{
        ...baseChartConfig,
        decimalPlaces,
        color: (opacity = 1) => `rgba(${rgb}, ${opacity})`,
        propsForDots: { r: "4", strokeWidth: "2", stroke: dot },
      }}
      bezier
      style={{ marginLeft: -16, borderRadius: 8 }}
      onDataPointClick={({ x, y, value, index }) =>
        setTip((prev) =>
          prev && prev.index === index ? null : { x, y, value, index },
        )
      }
      decorator={() => {
        if (!tip) return null;
        const above = tip.y > 40;
        const cx = Math.min(Math.max(tip.x, 32), screenWidth - 32);
        const ry = above ? tip.y - 34 : tip.y + 12;
        const ty = above ? tip.y - 19 : tip.y + 27;
        return (
          <G>
            <Rect
              x={cx - 30}
              y={ry}
              width={60}
              height={22}
              rx={4}
              fill="#1e293b"
            />
            <SvgText
              x={cx}
              y={ty}
              fontSize={11}
              fontWeight="bold"
              fill="#ffffff"
              textAnchor="middle"
            >
              {`${tip.value.toFixed(decimalPlaces)}${unit}`}
            </SvgText>
          </G>
        );
      }}
    />
  );
}

function NpkChart({ n, p, k }: { n: Point[]; p: Point[]; k: Point[] }) {
  const [tip, setTip] = useState<{
    x: number;
    y: number;
    value: number;
    index: number;
  } | null>(null);

  const idx: number[] = [];
  n.forEach((d, i) => {
    if (d.value != null) idx.push(i);
  });
  if (idx.length === 0) {
    return (
      <NoChartData icon="leaf-outline" text="No nutrient data in this range" />
    );
  }
  const labels = idx.map((i) => n[i].label);
  const nVals = idx.map((i) => (n[i].value ?? 0) as number);
  const pVals = idx.map((i) => (p[i]?.value ?? 0) as number);
  const kVals = idx.map((i) => (k[i]?.value ?? 0) as number);

  return (
    <LineChart
      data={{
        labels: thinLabels(labels),
        datasets: [
          {
            data: nVals,
            color: (o = 1) => `rgba(22, 163, 74, ${o})`,
            strokeWidth: 2,
          },
          {
            data: pVals,
            color: (o = 1) => `rgba(168, 85, 247, ${o})`,
            strokeWidth: 2,
          },
          {
            data: kVals,
            color: (o = 1) => `rgba(234, 88, 12, ${o})`,
            strokeWidth: 2,
          },
        ],
        legend: ["N", "P", "K"],
      }}
      width={screenWidth}
      height={220}
      chartConfig={{
        ...baseChartConfig,
        decimalPlaces: 0,
        color: (o = 1) => `rgba(100, 116, 139, ${o})`,
      }}
      bezier
      style={{ marginLeft: -16, borderRadius: 8 }}
      onDataPointClick={({ x, y, value, index }) =>
        setTip((prev) =>
          prev && prev.index === index ? null : { x, y, value, index },
        )
      }
      decorator={() => {
        if (!tip) return null;
        const above = tip.y > 40;
        const cx = Math.min(Math.max(tip.x, 32), screenWidth - 32);
        const ry = above ? tip.y - 34 : tip.y + 12;
        const ty = above ? tip.y - 19 : tip.y + 27;
        return (
          <G>
            <Rect
              x={cx - 26}
              y={ry}
              width={52}
              height={22}
              rx={4}
              fill="#1e293b"
            />
            <SvgText
              x={cx}
              y={ty}
              fontSize={11}
              fontWeight="bold"
              fill="#ffffff"
              textAnchor="middle"
            >
              {`${Math.round(tip.value)}`}
            </SvgText>
          </G>
        );
      }}
    />
  );
}

function AlertsBars({ rows }: { rows: AlertRow[] }) {
  const [selected, setSelected] = useState<number | null>(null);

  const total = rows.reduce((s, r) => s + r.critical + r.warning + r.info, 0);
  if (total === 0) {
    return (
      <NoChartData
        icon="notifications-off-outline"
        text="No alerts in this range"
      />
    );
  }

  const max = Math.max(1, ...rows.map((r) => r.critical + r.warning + r.info));
  const CHART_H = 180;
  const PLOT_H = CHART_H - 24; // room for the count label on top
  const labelStep = Math.max(1, Math.ceil(rows.length / 8));
  const sel = selected != null ? rows[selected] : null;

  return (
    <View>
      {/* Breakdown / tooltip */}
      {sel ? (
        <View className="bg-slate-800 rounded-lg px-3 py-2 mb-3 self-start">
          <Text className="text-white text-xs font-semibold mb-1">
            {sel.label}
          </Text>
          <View className="flex-row" style={{ gap: 12 }}>
            <Text className="text-red-300 text-xs">
              Critical: {sel.critical}
            </Text>
            <Text className="text-amber-300 text-xs">
              Warning: {sel.warning}
            </Text>
            <Text className="text-blue-300 text-xs">Info: {sel.info}</Text>
          </View>
        </View>
      ) : (
        <Text className="text-xs text-slate-400 mb-3">
          Tap a bar to see the breakdown
        </Text>
      )}

      {/* Bars — full width, evenly distributed */}
      <View className="flex-row items-end" style={{ height: CHART_H }}>
        {rows.map((r, i) => {
          const t = r.critical + r.warning + r.info;
          const barH = t > 0 ? Math.max((t / max) * PLOT_H, 6) : 0;
          const active = selected == null || selected === i;
          return (
            <Pressable
              key={i}
              onPress={() => setSelected(selected === i ? null : i)}
              style={{
                flex: 1,
                height: CHART_H,
                justifyContent: "flex-end",
                alignItems: "center",
              }}
            >
              {t > 0 && (
                <Text
                  style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}
                >
                  {t}
                </Text>
              )}
              <View
                style={{
                  width: "62%",
                  maxWidth: 22,
                  height: barH,
                  borderRadius: 3,
                  overflow: "hidden",
                  opacity: active ? 1 : 0.4,
                }}
              >
                {r.info > 0 && (
                  <View
                    style={{
                      height: (r.info / t) * barH,
                      backgroundColor: "#3b82f6",
                    }}
                  />
                )}
                {r.warning > 0 && (
                  <View
                    style={{
                      height: (r.warning / t) * barH,
                      backgroundColor: "#f59e0b",
                    }}
                  />
                )}
                {r.critical > 0 && (
                  <View
                    style={{
                      height: (r.critical / t) * barH,
                      backgroundColor: "#ef4444",
                    }}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* X labels — centered under each bar (no clipping) */}
      <View style={{ height: 14, marginTop: 4 }}>
        {rows.map((r, i) =>
          i % labelStep === 0 ? (
            <Text
              key={i}
              numberOfLines={1}
              style={{
                position: "absolute",
                left: `${((i + 0.5) / rows.length) * 100}%`,
                transform: [{ translateX: -20 }],
                width: 40,
                textAlign: "center",
                fontSize: 9,
                color: "#94a3b8",
              }}
            >
              {r.label}
            </Text>
          ) : null,
        )}
      </View>

      {/* Legend */}
      <View className="flex-row mt-4" style={{ gap: 16 }}>
        <LegendDot color="#ef4444" label="Critical" />
        <LegendDot color="#f59e0b" label="Warning" />
        <LegendDot color="#3b82f6" label="Info" />
      </View>
    </View>
  );
}

function ActivityBars({
  rows,
}: {
  rows: { label: string; value: number | null }[];
}) {
  const [selected, setSelected] = useState<number | null>(null);

  const total = rows.reduce((s, r) => s + (r.value ?? 0), 0);
  if (rows.length === 0 || total === 0) {
    return (
      <NoChartData
        icon="document-outline"
        text="No observations in this range"
      />
    );
  }

  const max = Math.max(1, ...rows.map((r) => r.value ?? 0));
  const CHART_H = 180;
  const PLOT_H = CHART_H - 24;
  const labelStep = Math.max(1, Math.ceil(rows.length / 8));
  const sel = selected != null ? rows[selected] : null;

  return (
    <View>
      {sel ? (
        <View className="bg-slate-800 rounded-lg px-3 py-2 mb-3 self-start">
          <Text className="text-white text-xs font-semibold">{sel.label}</Text>
          <Text className="text-green-300 text-xs mt-0.5">
            {sel.value ?? 0} observation{(sel.value ?? 0) === 1 ? "" : "s"}
          </Text>
        </View>
      ) : (
        <Text className="text-xs text-slate-400 mb-3">
          Tap a bar to see the count
        </Text>
      )}

      {/* Bars — full width */}
      <View className="flex-row items-end" style={{ height: CHART_H }}>
        {rows.map((r, i) => {
          const v = r.value ?? 0;
          const barH = v > 0 ? Math.max((v / max) * PLOT_H, 6) : 0;
          const active = selected == null || selected === i;
          return (
            <Pressable
              key={i}
              onPress={() => setSelected(selected === i ? null : i)}
              style={{
                flex: 1,
                height: CHART_H,
                justifyContent: "flex-end",
                alignItems: "center",
              }}
            >
              {v > 0 && (
                <Text
                  style={{ fontSize: 10, color: "#16a34a", marginBottom: 2 }}
                >
                  {v}
                </Text>
              )}
              <View
                style={{
                  width: "62%",
                  maxWidth: 22,
                  height: barH,
                  borderRadius: 3,
                  backgroundColor: "#16a34a",
                  opacity: active ? 1 : 0.4,
                }}
              />
            </Pressable>
          );
        })}
      </View>

      {/* X labels */}
      <View style={{ height: 14, marginTop: 4 }}>
        {rows.map((r, i) =>
          i % labelStep === 0 ? (
            <Text
              key={i}
              numberOfLines={1}
              style={{
                position: "absolute",
                left: `${((i + 0.5) / rows.length) * 100}%`,
                transform: [{ translateX: -20 }],
                width: 40,
                textAlign: "center",
                fontSize: 9,
                color: "#94a3b8",
              }}
            >
              {r.label}
            </Text>
          ) : null,
        )}
      </View>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: color,
        }}
      />
      <Text className="text-xs text-slate-500">{label}</Text>
    </View>
  );
}

function NoChartData({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View className="items-center justify-center" style={{ height: 160 }}>
      <Ionicons name={icon} size={28} color={colors.text.muted} />
      <Text className="text-sm text-slate-400 mt-2">{text}</Text>
    </View>
  );
}

function Chip({
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
      style={{ height: 34 }}
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

function SummaryTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View
      style={{ width: "48.5%" }}
      className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm"
    >
      <Ionicons name={icon} size={18} color={colors.brand[600]} />
      <Text className="text-2xl font-bold text-slate-900 mt-2">{value}</Text>
      <Text className="text-xs text-slate-500 mt-0.5">{label}</Text>
    </View>
  );
}

function NpkPill({
  label,
  color,
  value,
}: {
  label: string;
  color: string;
  value: number | null | undefined;
}) {
  return (
    <View
      className="flex-1 rounded-xl p-3 items-center"
      style={{ backgroundColor: `${color}15` }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: color,
        }}
        className="items-center justify-center"
      >
        <Text className="text-white font-bold text-xs">{label}</Text>
      </View>
      <Text className="text-sm font-bold text-slate-900 mt-1.5">
        {value != null ? value.toFixed(0) : "—"}
      </Text>
      <Text className="text-xs text-slate-500">mg/kg</Text>
    </View>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-3">
      <Text className="text-sm font-semibold text-slate-900">{title}</Text>
      {subtitle && (
        <Text className="text-xs text-slate-500 mb-3">{subtitle}</Text>
      )}
      {children}
    </View>
  );
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function MonthPickerModal({
  visible,
  onClose,
  value,
  onSelect,
  availableMonths,
}: {
  visible: boolean;
  onClose: () => void;
  value: string | null;
  onSelect: (month: string | null) => void;
  availableMonths: string[];
}) {
  const currentYear = new Date().getFullYear();

  // Navigable years: current year back to the earliest with data
  // (at least 3 years so the arrows are always usable; grows automatically)
  const years = (() => {
    const dataYears = availableMonths.map((m) => Number(m.split("-")[0]));
    const minYear = Math.min(
      currentYear - 2,
      ...(dataYears.length ? dataYears : [currentYear]),
    );
    const arr: number[] = [];
    for (let y = currentYear; y >= minYear; y--) arr.push(y);
    return arr;
  })();

  const [year, setYear] = useState(
    value ? Number(value.split("-")[0]) : currentYear,
  );

  useEffect(() => {
    if (visible) {
      setYear(value ? Number(value.split("-")[0]) : currentYear);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const yearIdx = years.indexOf(year);
  const canOlder = yearIdx < years.length - 1;
  const canNewer = yearIdx > 0;

  const selMonthNum =
    value && Number(value.split("-")[0]) === year
      ? Number(value.split("-")[1])
      : null;

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

          <Text className="text-lg font-bold text-slate-900">Select month</Text>
          <Text className="text-xs text-slate-500 mb-5">
            Pick a month and year. Tap a range tab above for all-time.
          </Text>

          {/* Year stepper */}
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              disabled={!canOlder}
              onPress={() => canOlder && setYear(years[yearIdx + 1])}
              className="w-10 h-10 items-center justify-center rounded-full active:bg-slate-100"
              style={{ opacity: canOlder ? 1 : 0.3 }}
            >
              <Ionicons
                name="chevron-back"
                size={22}
                color={colors.text.primary}
              />
            </Pressable>
            <Text className="text-base font-semibold text-slate-900">
              {year}
            </Text>
            <Pressable
              disabled={!canNewer}
              onPress={() => canNewer && setYear(years[yearIdx - 1])}
              className="w-10 h-10 items-center justify-center rounded-full active:bg-slate-100"
              style={{ opacity: canNewer ? 1 : 0.3 }}
            >
              <Ionicons
                name="chevron-forward"
                size={22}
                color={colors.text.primary}
              />
            </Pressable>
          </View>

          {/* Month grid (Jan–Dec) */}
          <View className="flex-row flex-wrap" style={{ gap: 8 }}>
            {MONTH_LABELS.map((label, idx) => {
              const isSel = selMonthNum === idx + 1;
              return (
                <Pressable
                  key={label}
                  onPress={() => {
                    onSelect(`${year}-${String(idx + 1).padStart(2, "0")}`);
                    onClose();
                  }}
                  style={{ width: "31%" }}
                  className={`py-3 rounded-xl items-center border ${
                    isSel
                      ? "bg-brand-600 border-brand-600"
                      : "bg-white border-slate-200"
                  } active:opacity-80`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      isSel ? "text-white" : "text-slate-700"
                    }`}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
