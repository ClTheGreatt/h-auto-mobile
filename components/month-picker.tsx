import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { colors } from "../constants/colors";

export const MONTH_LABELS = [
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

export function formatMonth(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function MonthPickerModal({
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
            Pick a month and year. Tap a range chip for everything.
          </Text>

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
                    className={`text-sm font-medium ${isSel ? "text-white" : "text-slate-700"}`}
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
