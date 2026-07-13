import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PlotAssignmentsCard } from "../../../../components/plots/PlotAssignmentsCard";
import { colors } from "../../../../constants/colors";
import { getUser } from "../../../../lib/auth";
import { useDeleteObservation } from "../../../../lib/hooks/use-delete-observation";
import { usePlot } from "../../../../lib/hooks/use-plot";
import { canDeleteLog } from "../../../../lib/permissions";
import type { User } from "../../../../types";

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

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelativeTime(iso: string) {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
  return `${Math.floor(diffMin / 1440)}d ago`;
}

export default function PlotDetail() {
  const { id, scrollTo } = useLocalSearchParams<{
    id: string;
    scrollTo?: string;
  }>();
  const router = useRouter();
  const { data, isLoading, error, refetch } = usePlot(id);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [observationsY, setObservationsY] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const deleteObservation = useDeleteObservation();

  useEffect(() => {
    getUser().then(setCurrentUser);
  }, []);

  useEffect(() => {
    if (scrollTo === "observations" && observationsY != null && scrollRef.current) {
      const t = setTimeout(() => {
        scrollRef.current?.scrollTo({
          y: Math.max(0, observationsY - 12),
          animated: true,
        });
      }, 300);
      return () => clearTimeout(t);
    }
  }, [scrollTo, observationsY]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-stone-50 items-center justify-center">
        <ActivityIndicator color={colors.brand[600]} />
      </SafeAreaView>
    );
  }

  if (error || !data?.plot) {
    return (
      <SafeAreaView className="flex-1 bg-stone-50">
        <CustomHeader title="Error" onBack={() => router.back()} />
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle" size={48} color={colors.status.error} />
          <Text className="text-base font-medium text-slate-700 mt-4">
            Failed to load plot
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

  const plot = data.plot;
  const statusStyle = STATUS_COLORS[plot.status] ?? STATUS_COLORS.PREPARING;

  function handleDeleteObservation(logId: string) {
    Alert.alert(
      "Delete observation?",
      "This will permanently delete the log entry and all its photos. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            deleteObservation.mutate(
              { plotId: plot.id, logId },
              {
                onError: (err: any) =>
                  Alert.alert("Could not delete", err?.message ?? "Try again"),
              },
            ),
        },
      ],
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-stone-50" edges={["top"]}>
      <CustomHeader title={plot.name} onBack={() => router.back()} />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
      >
        {/* Status + location */}
        <View className="flex-row items-center gap-2 mb-4">
          <View className={`px-3 py-1 rounded-full ${statusStyle.bg}`}>
            <Text className={`text-xs font-semibold ${statusStyle.text}`}>
              {statusStyle.label}
            </Text>
          </View>
          {plot.location && (
            <Text className="text-sm text-slate-600">📍 {plot.location}</Text>
          )}
        </View>

        {/* Crop card */}
        {plot.crop && (
          <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-3">
            <Text className="text-xs font-semibold text-slate-500 uppercase mb-2">
              Crop
            </Text>
            <View className="flex-row items-center gap-2">
              <Ionicons name="leaf" size={20} color={colors.brand[600]} />
              <Text className="text-lg font-semibold text-slate-900">
                {plot.crop.name}
              </Text>
            </View>
            {plot.crop.variety && (
              <Text className="text-sm text-slate-600 mt-1">
                Variety: {plot.crop.variety}
              </Text>
            )}
            <View className="flex-row gap-4 mt-3 pt-3 border-t border-slate-100">
              <DetailItem
                label="Days to harvest"
                value={`${plot.crop.daysToHarvest} days`}
              />
              {plot.currentStage && (
                <DetailItem label="Stage" value={plot.currentStage.name} />
              )}
            </View>
          </View>
        )}

        {/* Monitoring assignments */}
        <PlotAssignmentsCard plotId={plot.id} currentUser={currentUser} />

        {/* Dates card */}
        <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-3">
          <Text className="text-xs font-semibold text-slate-500 uppercase mb-3">
            Timeline
          </Text>
          <View className="flex-row gap-4">
            <DetailItem label="Planted" value={formatDate(plot.plantingDate)} />
            <DetailItem
              label="Expected harvest"
              value={formatDate(plot.expectedHarvest)}
            />
          </View>
        </View>

        {/* Latest reading card */}
        <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-3">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs font-semibold text-slate-500 uppercase">
              Latest reading
            </Text>
            <View className="flex-row items-center gap-2">
              {plot.latestReading && <LiveDot />}
              {plot.latestReading && (
                <Text className="text-xs text-slate-400">
                  {formatRelativeTime(plot.latestReading.recordedAt)}
                </Text>
              )}
            </View>
          </View>
          {plot.latestReading ? (
            <View className="flex-row flex-wrap gap-3">
              {plot.latestReading.soilMoisture !== null && (
                <MetricTile
                  label="Soil"
                  value={`${plot.latestReading.soilMoisture.toFixed(0)}%`}
                  icon="water"
                />
              )}
              {plot.latestReading.temperature !== null && (
                <MetricTile
                  label="Temp"
                  value={`${plot.latestReading.temperature.toFixed(1)}°C`}
                  icon="thermometer"
                />
              )}
              {plot.latestReading.humidity !== null && (
                <MetricTile
                  label="Humidity"
                  value={`${plot.latestReading.humidity.toFixed(0)}%`}
                  icon="cloud"
                />
              )}
              {plot.latestReading.lightIntensity !== null && (
                <MetricTile
                  label="Light"
                  value={`${plot.latestReading.lightIntensity.toFixed(0)} lux`}
                  icon="sunny"
                />
              )}
              {plot.latestReading.nitrogen !== null && (
                <MetricTile
                  label="Nitrogen"
                  value={`${plot.latestReading.nitrogen.toFixed(0)} mg/kg`}
                  icon="leaf"
                />
              )}
              {plot.latestReading.phosphorus !== null && (
                <MetricTile
                  label="Phosphorus"
                  value={`${plot.latestReading.phosphorus.toFixed(0)} mg/kg`}
                  icon="flask"
                />
              )}
              {plot.latestReading.potassium !== null && (
                <MetricTile
                  label="Potassium"
                  value={`${plot.latestReading.potassium.toFixed(0)} mg/kg`}
                  icon="flask"
                />
              )}
            </View>
          ) : (
            <View className="items-center py-4">
              <Ionicons
                name="hardware-chip-outline"
                size={28}
                color={colors.text.muted}
              />
              <Text className="text-sm text-slate-500 mt-2">
                No sensor readings yet
              </Text>
            </View>
          )}

          {plot.latestReading && (
            <Pressable
              onPress={() => router.push(`/(app)/plots/${plot.id}/readings`)}
              className="flex-row items-center justify-center gap-1 mt-3 pt-3 border-t border-slate-100 active:opacity-70"
            >
              <Text className="text-sm font-medium text-brand-700">
                View all readings
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.brand[600]}
              />
            </Pressable>
          )}
        </View>

        {/* Observations */}
        <View
          onLayout={(e) => setObservationsY(e.nativeEvent.layout.y)}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-3"
        >
          <Text className="text-xs font-semibold text-slate-500 uppercase mb-3">
            Recent observations
          </Text>
          {plot.observations.length === 0 ? (
            <View className="items-center py-4">
              <Ionicons
                name="document-text-outline"
                size={28}
                color={colors.text.muted}
              />
              <Text className="text-sm text-slate-500 mt-2">
                No observations yet
              </Text>
              <Text className="text-xs text-slate-400 mt-1 text-center">
                Be the first to log one
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {plot.observations.map((o) => (
                <View
                  key={o.id}
                  className="border-l-2 border-brand-400 pl-3 py-1"
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500 flex-1">
                      {o.user.firstName} {o.user.lastName} •{" "}
                      {formatRelativeTime(o.createdAt)}
                    </Text>
                    {canDeleteLog(o, currentUser) && (
                      <Pressable
                        onPress={() => handleDeleteObservation(o.id)}
                        hitSlop={8}
                        className="ml-2 active:opacity-60"
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color="#ef4444"
                        />
                      </Pressable>
                    )}
                  </View>
                  {o.observations && (
                    <Text className="text-sm text-slate-700 mt-1">
                      {o.observations}
                    </Text>
                  )}
                  {o.images && o.images.length > 0 && (
                    <View className="flex-row gap-2 mt-2">
                      {o.images.map((img, idx) => (
                        <Pressable
                          key={idx}
                          onPress={() => setPreviewImage(img.imageUrl)}
                          className="active:opacity-70"
                        >
                          <Image
                            source={{ uri: img.imageUrl }}
                            className="w-24 h-24 rounded-lg bg-stone-100"
                            resizeMode="cover"
                          />
                        </Pressable>
                      ))}
                    </View>
                  )}
                  {(o.plantHeightCm || o.leafCount) && (
                    <View className="flex-row gap-3 mt-1">
                      {o.plantHeightCm && (
                        <Text className="text-xs text-slate-500">
                          🌱 {o.plantHeightCm} cm
                        </Text>
                      )}
                      {o.leafCount && (
                        <Text className="text-xs text-slate-500">
                          🍃 {o.leafCount} leaves
                        </Text>
                      )}
                    </View>
                  )}
                  {(o.soilMoisture != null ||
                    o.temperature != null ||
                    o.humidity != null ||
                    o.lightIntensity != null ||
                    o.nitrogen != null ||
                    o.phosphorus != null ||
                    o.potassium != null) && (
                    <View className="mt-2 pt-2 border-t border-slate-100">
                      <Text className="text-[10px] font-semibold text-slate-400 uppercase mb-1">
                        Conditions at time of log
                      </Text>
                      <View className="flex-row flex-wrap gap-x-3 gap-y-1">
                        {o.soilMoisture != null && (
                          <View className="flex-row items-center gap-1">
                            <Ionicons name="water" size={12} color="#60a5fa" />
                            <Text className="text-xs text-slate-600">
                              {o.soilMoisture.toFixed(0)}% soil
                            </Text>
                          </View>
                        )}
                        {o.temperature != null && (
                          <View className="flex-row items-center gap-1">
                            <Ionicons
                              name="thermometer"
                              size={12}
                              color="#f87171"
                            />
                            <Text className="text-xs text-slate-600">
                              {o.temperature.toFixed(1)}°C
                            </Text>
                          </View>
                        )}
                        {o.humidity != null && (
                          <View className="flex-row items-center gap-1">
                            <Ionicons name="cloud" size={12} color="#22d3ee" />
                            <Text className="text-xs text-slate-600">
                              {o.humidity.toFixed(0)}% humidity
                            </Text>
                          </View>
                        )}
                        {o.lightIntensity != null && (
                          <View className="flex-row items-center gap-1">
                            <Ionicons name="sunny" size={12} color="#fbbf24" />
                            <Text className="text-xs text-slate-600">
                              {o.lightIntensity.toFixed(0)} lux
                            </Text>
                          </View>
                        )}
                        {(o.nitrogen != null ||
                          o.phosphorus != null ||
                          o.potassium != null) && (
                          <View className="flex-row items-center gap-1">
                            <Ionicons name="flask" size={12} color="#4ade80" />
                            <Text className="text-xs text-slate-600">
                              NPK: {o.nitrogen?.toFixed(0) ?? "—"}/
                              {o.phosphorus?.toFixed(0) ?? "—"}/
                              {o.potassium?.toFixed(0) ?? "—"} mg/kg
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-4">
        <Pressable
          onPress={() => router.push(`/(app)/plots/${plot.id}/log`)}
          className="bg-brand-600 rounded-xl py-3.5 items-center active:bg-brand-700"
        >
          <View className="flex-row items-center gap-2">
            <Ionicons name="add-circle" size={20} color="white" />
            <Text className="text-white font-semibold text-base">
              Log observation
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Photo preview modal ← ADD THIS WHOLE BLOCK */}
      <Modal
        visible={!!previewImage}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <Pressable
          onPress={() => setPreviewImage(null)}
          className="flex-1 bg-black/90 items-center justify-center px-4"
        >
          {previewImage && (
            <Image
              source={{ uri: previewImage }}
              style={{ width: "100%", height: "75%" }}
              resizeMode="contain"
            />
          )}
          <View className="flex-row items-center gap-2 mt-6">
            <Ionicons name="close-circle" size={20} color="white" />
            <Text className="text-white text-sm">Tap anywhere to close</Text>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
function CustomHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <View className="flex-row items-center px-4 py-3 bg-stone-50 border-b border-slate-100">
      <Pressable
        onPress={onBack}
        className="w-10 h-10 items-center justify-center rounded-full active:bg-slate-200"
      >
        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
      </Pressable>
      <Text
        className="flex-1 text-lg font-semibold text-slate-900 ml-2"
        numberOfLines={1}
      >
        {title}
      </Text>
    </View>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1">
      <Text className="text-xs text-slate-500">{label}</Text>
      <Text className="text-sm font-medium text-slate-900 mt-0.5">{value}</Text>
    </View>
  );
}

function MetricTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View className="bg-stone-50 rounded-xl px-4 py-3 flex-row items-center gap-2 min-w-[100px]">
      <Ionicons name={icon} size={18} color={colors.brand[600]} />
      <View>
        <Text className="text-xs text-slate-500">{label}</Text>
        <Text className="text-sm font-bold text-slate-900">{value}</Text>
      </View>
    </View>
  );
}
function LiveDot() {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View className="flex-row items-center gap-1.5">
      <Animated.View
        style={{
          opacity: pulse,
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.brand[600],
        }}
      />
      <Text className="text-xs font-medium text-brand-700">Live</Text>
    </View>
  );
}
