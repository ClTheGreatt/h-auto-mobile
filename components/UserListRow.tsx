import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, Text, View } from "react-native";
import { STATUS_META } from "./StatusChangeSheet";
import { colors } from "../constants/colors";
import type { UserListItem } from "../types";

// Single user row shared by the flat role sections and the grouped
// Student Farmer section (course > year > section) on the Users list.
export function UserListRow({
  user,
  divider,
  onPress,
}: {
  user: UserListItem;
  divider: boolean;
  onPress?: () => void;
}) {
  const status = STATUS_META[user.status] ?? STATUS_META.ACTIVE;
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center p-4 active:bg-slate-50 ${
        divider ? "border-b border-slate-100" : ""
      }`}
    >
      {user.profileImage ? (
        <Image
          source={{ uri: user.profileImage }}
          className="w-11 h-11 rounded-full bg-stone-100"
        />
      ) : (
        <View className="w-11 h-11 rounded-full bg-brand-100 items-center justify-center">
          <Text className="text-sm font-semibold text-brand-700">
            {user.firstName[0]}
            {user.lastName[0]}
          </Text>
        </View>
      )}
      <View className="flex-1 ml-3">
        <Text className="text-sm font-medium text-slate-900">
          {user.firstName} {user.lastName}
        </Text>
        <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>
          {user.email}
        </Text>
      </View>
      <View
        className="px-2 py-1 rounded-full"
        style={{ backgroundColor: `${status.color}15` }}
      >
        <Text className="text-xs font-medium" style={{ color: status.color }}>
          {status.label}
        </Text>
      </View>
      {/* Graduation is orthogonal to status — a graduated student still
          shows ACTIVE, so this badge always renders alongside it (matches
          web's rule). */}
      {user.role === "STUDENT_FARMER" && user.graduatedAt && (
        <View className="px-2 py-1 rounded-full bg-slate-200 ml-1.5">
          <Text className="text-xs font-medium text-slate-700">
            GRADUATED
          </Text>
        </View>
      )}
      <Ionicons
        name="chevron-forward"
        size={18}
        color={colors.text.muted}
        style={{ marginLeft: 6 }}
      />
    </Pressable>
  );
}
