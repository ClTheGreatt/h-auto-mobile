import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors } from "../constants/colors";
import { useStudents } from "../lib/hooks/use-users";
import type { StudentListItem } from "../types";

export function StudentPickerSheet({
  visible,
  onClose,
  excludeStudentIds,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  excludeStudentIds: string[];
  onSelect: (student: StudentListItem) => void;
}) {
  const [query, setQuery] = useState("");
  const { data, isLoading } = useStudents();

  const students = data?.users ?? [];
  const q = query.trim().toLowerCase();
  const filtered = students.filter((s) => {
    if (excludeStudentIds.includes(s.id)) return false;
    if (!q) return true;
    const haystack = `${s.firstName} ${s.lastName} ${s.email} ${
      s.course ?? ""
    } ${s.section ?? ""}`.toLowerCase();
    return haystack.includes(q);
  });

  function handleClose() {
    setQuery("");
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable
        className="flex-1 bg-black/40 justify-end"
        onPress={handleClose}
      >
        <Pressable
          className="bg-white rounded-t-3xl px-5 pt-3 pb-8"
          onPress={() => {}}
          style={{ maxHeight: "80%" }}
        >
          <View className="w-10 h-1.5 rounded-full bg-slate-200 self-center mb-4" />

          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-base font-semibold text-slate-900">
              Assign Student
            </Text>
            <Pressable
              onPress={handleClose}
              className="w-8 h-8 items-center justify-center rounded-full active:bg-slate-100"
            >
              <Ionicons name="close" size={22} color={colors.text.primary} />
            </Pressable>
          </View>

          <View className="flex-row items-center bg-stone-50 border border-slate-200 rounded-xl px-3 mb-3">
            <Ionicons name="search" size={16} color={colors.text.muted} />
            <TextInput
              className="flex-1 py-2.5 px-2 text-sm text-slate-900"
              placeholder="Search name, email, course, section..."
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
                  size={16}
                  color={colors.text.muted}
                />
              </Pressable>
            )}
          </View>

          {isLoading ? (
            <View className="items-center py-8">
              <ActivityIndicator color={colors.brand[600]} />
            </View>
          ) : filtered.length === 0 ? (
            <View className="items-center py-8">
              <Text className="text-sm text-slate-400">No students found</Text>
            </View>
          ) : (
            <ScrollView
              style={{ maxHeight: 400 }}
              contentContainerStyle={{ paddingBottom: 8 }}
            >
              {filtered.map((s) => (
                <StudentRow
                  key={s.id}
                  student={s}
                  onPress={() => onSelect(s)}
                />
              ))}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function StudentRow({
  student,
  onPress,
}: {
  student: StudentListItem;
  onPress: () => void;
}) {
  const initials =
    `${student.firstName[0] ?? ""}${student.lastName[0] ?? ""}`.toUpperCase();
  const metaParts = [
    student.course,
    student.yearLevel,
    student.section ? `Section ${student.section}` : null,
  ].filter(Boolean);

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center py-3 border-b border-slate-100 active:bg-slate-50"
    >
      {student.profileImage ? (
        <Image
          source={{ uri: student.profileImage }}
          style={{ width: 36, height: 36, borderRadius: 18 }}
        />
      ) : (
        <View
          className="bg-brand-100 items-center justify-center"
          style={{ width: 36, height: 36, borderRadius: 18 }}
        >
          <Text className="text-brand-700 font-semibold text-sm">
            {initials}
          </Text>
        </View>
      )}
      <View className="flex-1 ml-3">
        <Text className="text-sm font-medium text-slate-900">
          {student.firstName} {student.lastName}
        </Text>
        <Text className="text-xs text-slate-500" numberOfLines={1}>
          {student.email}
        </Text>
        {metaParts.length > 0 && (
          <Text className="text-xs text-slate-400 mt-0.5">
            {metaParts.join(" · ")}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
