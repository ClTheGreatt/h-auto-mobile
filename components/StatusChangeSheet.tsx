import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { colors } from "../constants/colors";
import { useUpdateUserStatus } from "../lib/hooks/use-users";

type StatusSubject = {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
};

export const STATUS_META: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Active", color: "#16a34a" },
  INACTIVE: { label: "Inactive", color: "#64748b" },
  SUSPENDED: { label: "Suspended", color: "#dc2626" },
};

const STATUS_KEYS = ["ACTIVE", "INACTIVE", "SUSPENDED"] as const;

export function StatusChangeSheet({
  user,
  visible,
  onClose,
  onSuccess,
}: {
  user: StatusSubject | null;
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const updateStatus = useUpdateUserStatus();

  function handleSetStatus(status: string) {
    if (!user) return;
    if (status === user.status) {
      onClose();
      return;
    }
    updateStatus.mutate(
      { id: user.id, status },
      {
        onSuccess: () => {
          onClose();
          onSuccess?.();
        },
        onError: (err: any) =>
          Alert.alert("Could not update", err?.message ?? "Try again"),
      },
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/40 justify-end"
        onPress={onClose}
      >
        <Pressable
          className="bg-white rounded-t-3xl px-5 pt-3 pb-8"
          onPress={() => {}}
        >
          <View className="w-10 h-1.5 rounded-full bg-slate-200 self-center mb-4" />

          <Text className="text-base font-semibold text-slate-900">
            {user?.firstName} {user?.lastName}
          </Text>
          <Text className="text-xs text-slate-500 mb-4">
            Change account status
          </Text>

          {STATUS_KEYS.map((s) => {
            const sm = STATUS_META[s];
            const isCurrent = user?.status === s;
            return (
              <Pressable
                key={s}
                disabled={updateStatus.isPending}
                onPress={() => handleSetStatus(s)}
                className="flex-row items-center py-3.5 active:opacity-60"
              >
                <View
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: sm.color }}
                />
                <Text className="flex-1 ml-3 text-base text-slate-900">
                  {sm.label}
                </Text>
                {isCurrent && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={colors.brand[600]}
                  />
                )}
              </Pressable>
            );
          })}

          {updateStatus.isPending && (
            <View className="items-center pt-2">
              <ActivityIndicator color={colors.brand[600]} />
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
