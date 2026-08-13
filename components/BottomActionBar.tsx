import type { ReactNode } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Shared by every screen with a sticky bottom action bar. These screens only
// reserve the top safe-area edge (SafeAreaView edges={["top"]}) since the
// bottom inset is normally the tab bar's job — but a pushed screen with its
// own absolute-positioned bottom bar has no tab bar under it, so it needs to
// account for the home indicator / gesture nav inset itself.
export function BottomActionBar({
  children,
  row,
}: {
  children: ReactNode;
  row?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className={`absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 ${
        row ? "flex-row" : ""
      }`}
      style={{
        paddingTop: 16,
        paddingBottom: 16 + insets.bottom,
        gap: row ? 10 : undefined,
      }}
    >
      {children}
    </View>
  );
}
