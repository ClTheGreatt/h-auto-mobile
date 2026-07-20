import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, Text, View } from "react-native";
import { colors } from "../../constants/colors";
import {
  useAssignStudent,
  usePlotAssignments,
  useUnassignStudent,
} from "../../lib/hooks/use-plot-assignments";
import type { PlotAssignment, StudentListItem } from "../../types";
import { StudentPickerSheet } from "../StudentPickerSheet";

function formatRelativeTime(iso: string) {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
  return `${Math.floor(diffMin / 1440)}d ago`;
}

export function PlotAssignmentsCard({
  plotId,
  canManageAssignments,
  adviser,
}: {
  plotId: string;
  canManageAssignments: boolean;
  adviser: { id: string; firstName: string; lastName: string } | null;
}) {
  const { data, isLoading } = usePlotAssignments(plotId);
  const assignStudent = useAssignStudent();
  const unassignStudent = useUnassignStudent();
  const [pickerOpen, setPickerOpen] = useState(false);

  const assignments = data?.assignments ?? [];

  // Students only ever see this card if they're actually assigned to the
  // plot (an empty list for a student means "not assigned" — hide it).
  if (!canManageAssignments && assignments.length === 0) return null;

  if (isLoading) {
    return (
      <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-3 items-center py-6">
        <ActivityIndicator color={colors.brand[600]} />
      </View>
    );
  }

  function handleSelectStudent(student: StudentListItem) {
    setPickerOpen(false);
    assignStudent.mutate(
      { plotId, studentId: student.id, notes: null },
      {
        onError: (err: any) =>
          Alert.alert(
            "Could not assign student",
            err?.message ?? "Try again",
          ),
      },
    );
  }

  function handleRemove(assignment: PlotAssignment) {
    Alert.alert(
      "Remove student?",
      `Remove ${assignment.student.firstName} ${assignment.student.lastName} from this plot?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () =>
            unassignStudent.mutate(
              { plotId, assignmentId: assignment.id },
              {
                onError: (err: any) =>
                  Alert.alert(
                    "Could not remove",
                    err?.message ?? "Try again",
                  ),
              },
            ),
        },
      ],
    );
  }

  return (
    <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-3">
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-xs font-semibold text-slate-500 uppercase">
          Monitoring Assignments
        </Text>
        {assignments.length > 0 && (
          <View className="px-2 py-0.5 rounded-full bg-brand-100">
            <Text className="text-xs font-medium text-brand-700">
              {assignments.length}
            </Text>
          </View>
        )}
      </View>

      <Text className="text-xs text-slate-400 mb-3">
        {adviser
          ? `Adviser: ${adviser.firstName} ${adviser.lastName}`
          : "No adviser assigned"}
      </Text>

      {assignments.length === 0 ? (
        <Text className="text-sm text-slate-500 text-center py-2">
          No students assigned yet.
        </Text>
      ) : (
        <View style={{ gap: 10 }}>
          {assignments.map((a) => (
            <AssignmentRow
              key={a.id}
              assignment={a}
              canRemove={canManageAssignments}
              onRemove={() => handleRemove(a)}
            />
          ))}
        </View>
      )}

      {canManageAssignments && (
        <Pressable
          onPress={() => setPickerOpen(true)}
          className="flex-row items-center justify-center gap-1.5 mt-3 pt-3 border-t border-slate-100 active:opacity-70"
        >
          <Ionicons
            name="person-add-outline"
            size={16}
            color={colors.brand[600]}
          />
          <Text className="text-sm font-medium text-brand-700">
            Assign student
          </Text>
        </Pressable>
      )}

      <StudentPickerSheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        excludeStudentIds={assignments.map((a) => a.studentId)}
        onSelect={handleSelectStudent}
      />
    </View>
  );
}

function AssignmentRow({
  assignment,
  canRemove,
  onRemove,
}: {
  assignment: PlotAssignment;
  canRemove: boolean;
  onRemove: () => void;
}) {
  const s = assignment.student;
  const initials = `${s.firstName[0] ?? ""}${s.lastName[0] ?? ""}`.toUpperCase();
  const metaParts = [
    s.course,
    s.yearLevel,
    s.section ? `Section ${s.section}` : null,
  ].filter(Boolean);

  return (
    <View className="flex-row items-start">
      {s.profileImage ? (
        <Image
          source={{ uri: s.profileImage }}
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
          {s.firstName} {s.lastName}
        </Text>
        {metaParts.length > 0 && (
          <Text className="text-xs text-slate-500 mt-0.5">
            {metaParts.join(" · ")}
          </Text>
        )}
        {assignment.notes && (
          <Text className="text-xs text-slate-400 mt-0.5" numberOfLines={2}>
            {assignment.notes}
          </Text>
        )}
        <Text className="text-xs text-slate-400 mt-0.5">
          Assigned by {assignment.faculty.firstName}{" "}
          {assignment.faculty.lastName} ·{" "}
          {formatRelativeTime(assignment.assignedAt)}
        </Text>
      </View>
      {canRemove && (
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          className="ml-2 active:opacity-60"
        >
          <Ionicons name="close-circle" size={20} color="#ef4444" />
        </Pressable>
      )}
    </View>
  );
}
