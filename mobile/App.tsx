import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";

import { HomeScreen } from "@/screens/HomeScreen";
import { InteractScreen } from "@/screens/InteractScreen";
import { LoginScreen } from "@/screens/LoginScreen";
import { MapScreen } from "@/screens/MapScreen";
import { ResultScreen } from "@/screens/ResultScreen";
import { useGameStore } from "@/store/useGameStore";
import { colors } from "@/theme/colors";

type RouteName = "Login" | "Home" | "Map" | "Interact" | "Result";

type RouteState =
  | { name: "Login" }
  | { name: "Home" }
  | { name: "Map" }
  | { name: "Interact"; params: { locationId: string; locationName: string } }
  | { name: "Result"; params: { won: boolean; message: string; reason?: "timeout" } };

function buildNavigation(
  stack: RouteState[],
  setStack: React.Dispatch<React.SetStateAction<RouteState[]>>,
) {
  return {
    navigate(name: RouteName, params?: RouteState extends { name: typeof name } ? never : unknown) {
      setStack((prev) => {
        if (name === "Login") return [...prev, { name: "Login" }];
        if (name === "Home") return [...prev, { name: "Home" }];
        if (name === "Map") return [...prev, { name: "Map" }];
        if (name === "Interact" && params) {
          return [
            ...prev,
            {
              name: "Interact",
              params: params as { locationId: string; locationName: string },
            },
          ];
        }
        if (name === "Result" && params) {
          return [
            ...prev,
            {
              name: "Result",
              params: params as { won: boolean; message: string; reason?: "timeout" },
            },
          ];
        }
        return prev;
      });
    },
    replace(name: RouteName, params?: unknown) {
      setStack((prev) => {
        const next = prev.slice(0, -1);
        if (name === "Login") return [...next, { name: "Login" }];
        if (name === "Home") return [...next, { name: "Home" }];
        if (name === "Map") return [...next, { name: "Map" }];
        if (name === "Interact" && params) {
          return [...next, { name: "Interact", params: params as { locationId: string; locationName: string } }];
        }
        if (name === "Result" && params) {
          return [...next, { name: "Result", params: params as { won: boolean; message: string; reason?: "timeout" } }];
        }
        return prev;
      });
    },
    goBack() {
      setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
    },
    reset(config: { index: number; routes: Array<{ name: RouteName }> }) {
      const first = config.routes[0];
      if (!first) return;
      if (first.name === "Login") setStack([{ name: "Login" }]);
      if (first.name === "Home") setStack([{ name: "Home" }]);
      if (first.name === "Map") setStack([{ name: "Map" }]);
    },
  };
}

export default function App() {
  const { authToken } = useGameStore();
  const [stack, setStack] = useState<RouteState[]>([{ name: authToken ? "Home" : "Login" }]);

  useEffect(() => {
    setStack([{ name: authToken ? "Home" : "Login" }]);
  }, [authToken]);

  const navigation = useMemo(() => buildNavigation(stack, setStack), [stack]);
  const currentRoute = stack[stack.length - 1];

  let screen: React.ReactNode = null;

  if (currentRoute.name === "Login") {
    screen = <LoginScreen />;
  } else if (currentRoute.name === "Home") {
    screen = <HomeScreen navigation={navigation as never} route={{} as never} />;
  } else if (currentRoute.name === "Map") {
    screen = <MapScreen navigation={navigation as never} route={{} as never} />;
  } else if (currentRoute.name === "Interact") {
    screen = (
      <InteractScreen
        navigation={navigation as never}
        route={{ params: currentRoute.params } as never}
      />
    );
  } else if (currentRoute.name === "Result") {
    screen = (
      <ResultScreen
        navigation={navigation as never}
        route={{ params: currentRoute.params } as never}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.container}>{screen}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
});
