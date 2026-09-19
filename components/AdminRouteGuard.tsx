import { useRouter } from "expo-router";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../constants/colors";
import { getUser } from "../lib/auth";
import { isAdminRole } from "../lib/permissions";

type AdminRouteGuardProps = {
  children: ReactNode;
};

export function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const router = useRouter();
  const redirectedRef = useRef(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;

    void getUser()
      .then((user) => {
        if (!active || redirectedRef.current) return;

        if (!user) {
          redirectedRef.current = true;
          router.replace("/(auth)/login");
          return;
        }

        if (isAdminRole(user.role)) {
          setAllowed(true);
          return;
        }

        redirectedRef.current = true;
        Alert.alert(
          "Access denied",
          "You don't have permission to access this page.",
        );
        router.replace("/(app)/profile");
      })
      .catch(() => {
        if (!active || redirectedRef.current) return;
        redirectedRef.current = true;
        router.replace("/(auth)/login");
      });

    return () => {
      active = false;
    };
  }, [router]);

  if (!allowed) {
    return (
      <SafeAreaView className="flex-1 bg-stone-50 items-center justify-center">
        <ActivityIndicator color={colors.brand[600]} />
      </SafeAreaView>
    );
  }

  return children;
}
