import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../../constants/colors";
import { useCreateObservation } from "../../../../lib/hooks/use-create-observation";

type GpsStatus = "loading" | "granted" | "denied" | "error";

export default function LogObservation() {
  const { id: plotId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const createObservation = useCreateObservation();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [plantHeight, setPlantHeight] = useState("");
  const [leafCount, setLeafCount] = useState("");
  const [observations, setObservations] = useState("");
  const [notes, setNotes] = useState("");

  // GPS
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("loading");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [address, setAddress] = useState<string | null>(null);

  // Request GPS on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setGpsStatus("denied");
          return;
        }
        setGpsStatus("granted");
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setCoords({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        });

        // Reverse geocode coords → readable address
        try {
          const addresses = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          if (addresses[0]) {
            const a = addresses[0];
            const parts = [a.street, a.city, a.region, a.country].filter(
              Boolean,
            );
            setAddress(parts.join(", "));
          }
        } catch (err) {
          console.error("[reverseGeocode] error:", err);
        }
      } catch (err) {
        console.error("[gps] error:", err);
        setGpsStatus("error");
      }
    })();
  }, []);

  async function pickFromCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Camera permission needed",
        "Please enable camera in your phone settings to take photos.",
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function pickFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Gallery permission needed",
        "Please enable media library access in your phone settings.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }

  function handleSubmit() {
    if (!observations.trim()) {
      Alert.alert("Missing info", "Please write what you observed.");
      return;
    }

    const heightNum = plantHeight.trim() ? parseFloat(plantHeight) : null;
    const leafNum = leafCount.trim() ? parseInt(leafCount, 10) : null;

    if (plantHeight.trim() && (isNaN(heightNum!) || heightNum! < 0)) {
      Alert.alert("Invalid value", "Plant height must be a positive number.");
      return;
    }
    if (leafCount.trim() && (isNaN(leafNum!) || leafNum! < 0)) {
      Alert.alert("Invalid value", "Leaf count must be a positive number.");
      return;
    }

    createObservation.mutate(
      {
        plotId: plotId!,
        imageUri,
        plantHeightCm: heightNum,
        leafCount: leafNum,
        observations: observations.trim(),
        notes: notes.trim() || undefined,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        locationName: address ?? undefined, // ← ADD
      },
      {
        onSuccess: () => {
          Alert.alert(
            "Observation logged! 🌱",
            "Your observation was saved successfully.",
            [{ text: "OK", onPress: () => router.back() }],
          );
        },
        onError: (err: any) => {
          Alert.alert("Failed to save", err?.message ?? "Please try again.");
        },
      },
    );
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
          Log Observation
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* GPS indicator */}
          <View className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mb-4 flex-row items-center gap-3">
            <Ionicons
              name="location"
              size={20}
              color={
                gpsStatus === "granted" ? colors.brand[600] : colors.text.muted
              }
            />
            <View className="flex-1">
              {gpsStatus === "loading" && (
                <Text className="text-sm text-slate-500">
                  Getting location…
                </Text>
              )}
              {gpsStatus === "granted" && coords && (
                <>
                  <Text className="text-xs text-slate-500">
                    GPS auto-tagged
                  </Text>
                  {address ? (
                    <>
                      <Text
                        className="text-sm font-medium text-slate-900"
                        numberOfLines={2}
                      >
                        {address}
                      </Text>
                      <Text className="text-xs text-slate-400 mt-0.5">
                        {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                      </Text>
                    </>
                  ) : (
                    <Text className="text-sm font-medium text-slate-900">
                      {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                    </Text>
                  )}
                </>
              )}
              {gpsStatus === "denied" && (
                <Text className="text-sm text-amber-700">
                  Location denied — will save without GPS
                </Text>
              )}
              {gpsStatus === "error" && (
                <Text className="text-sm text-red-700">
                  Couldn't get location
                </Text>
              )}
            </View>
          </View>

          {/* Photo section */}
          <Text className="text-xs font-semibold text-slate-500 uppercase mb-2">
            Photo (optional)
          </Text>
          <View className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mb-4">
            {imageUri ? (
              <View>
                <Image
                  source={{ uri: imageUri }}
                  className="w-full h-48 rounded-xl"
                  resizeMode="cover"
                />
                <View className="flex-row gap-2 mt-3">
                  <Pressable
                    onPress={() => setImageUri(null)}
                    className="flex-1 py-2 rounded-lg border border-red-200 items-center active:bg-red-50"
                  >
                    <Text className="text-sm font-medium text-red-600">
                      Remove
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={pickFromCamera}
                    className="flex-1 py-2 rounded-lg border border-slate-200 items-center active:bg-slate-50"
                  >
                    <Text className="text-sm font-medium text-slate-700">
                      Retake
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View className="flex-row gap-2">
                <Pressable
                  onPress={pickFromCamera}
                  className="flex-1 py-4 rounded-xl bg-brand-600 items-center active:bg-brand-700"
                >
                  <Ionicons name="camera" size={20} color="white" />
                  <Text className="text-white text-xs font-medium mt-1">
                    Take photo
                  </Text>
                </Pressable>
                <Pressable
                  onPress={pickFromGallery}
                  className="flex-1 py-4 rounded-xl border border-slate-200 items-center active:bg-slate-50"
                >
                  <Ionicons name="images" size={20} color={colors.brand[600]} />
                  <Text className="text-slate-700 text-xs font-medium mt-1">
                    Gallery
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Measurements */}
          <Text className="text-xs font-semibold text-slate-500 uppercase mb-2">
            Measurements (optional)
          </Text>
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-xs text-slate-600 mb-1.5">
                Plant height (cm)
              </Text>
              <TextInput
                className="bg-white border border-slate-200 rounded-lg px-4 py-3 text-base text-slate-900"
                placeholder="e.g. 45"
                placeholderTextColor="#94a3b8"
                value={plantHeight}
                onChangeText={setPlantHeight}
                keyboardType="numeric"
                editable={!createObservation.isPending}
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-slate-600 mb-1.5">Leaf count</Text>
              <TextInput
                className="bg-white border border-slate-200 rounded-lg px-4 py-3 text-base text-slate-900"
                placeholder="e.g. 24"
                placeholderTextColor="#94a3b8"
                value={leafCount}
                onChangeText={setLeafCount}
                keyboardType="numeric"
                editable={!createObservation.isPending}
              />
            </View>
          </View>

          {/* Observations (required) */}
          <Text className="text-xs font-semibold text-slate-500 uppercase mb-2">
            What did you observe? <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-base text-slate-900 mb-4"
            placeholder="Healthy growth, no pests, watered today..."
            placeholderTextColor="#94a3b8"
            value={observations}
            onChangeText={setObservations}
            multiline
            numberOfLines={4}
            style={{ minHeight: 100, textAlignVertical: "top" }}
            editable={!createObservation.isPending}
          />

          {/* Notes (optional) */}
          <Text className="text-xs font-semibold text-slate-500 uppercase mb-2">
            Notes (optional)
          </Text>
          <TextInput
            className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-base text-slate-900"
            placeholder="Additional context..."
            placeholderTextColor="#94a3b8"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            style={{ minHeight: 80, textAlignVertical: "top" }}
            editable={!createObservation.isPending}
          />
        </ScrollView>

        {/* Submit CTA */}
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-4">
          <Pressable
            onPress={handleSubmit}
            disabled={createObservation.isPending}
            className={`rounded-xl py-3.5 items-center ${
              createObservation.isPending
                ? "bg-brand-600/60"
                : "bg-brand-600 active:bg-brand-700"
            }`}
          >
            {createObservation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <View className="flex-row items-center gap-2">
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text className="text-white font-semibold text-base">
                  Submit observation
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
