import { DarkTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";

import { colors } from "@/theme/colors";
import { HomeScreen } from "@/screens/HomeScreen";
import { InteractScreen } from "@/screens/InteractScreen";
import { LoginScreen } from "@/screens/LoginScreen";
import { MapScreen } from "@/screens/MapScreen";
import { PremiumScreen } from "@/screens/PremiumScreen";
import { ResultScreen } from "@/screens/ResultScreen";
import { useGameStore } from "@/store/useGameStore";

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Map: undefined;
  Interact: {
    locationId: string;
    locationName: string;
  };
  Result: {
    won: boolean;
    message: string;
    reason?: "timeout";
  };
  Premium: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.panel,
    border: colors.border,
    text: colors.text,
    primary: colors.accent,
  },
};

function BootSplash() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );
}

export function AppNavigator() {
  const { authToken, hasHydrated } = useGameStore();

  if (!hasHydrated) {
    return <BootSplash />;
  }

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.panel },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {authToken ? (
          <>
            <Stack.Screen
              component={HomeScreen}
              name="Home"
              options={{ title: "The Inquisitor" }}
            />
            <Stack.Screen
              component={MapScreen}
              name="Map"
              options={{ title: "Investigation Map" }}
            />
            <Stack.Screen
              component={InteractScreen}
              name="Interact"
              options={{ title: "Interrogation" }}
            />
            <Stack.Screen
              component={ResultScreen}
              name="Result"
              options={{ title: "Verdict" }}
            />
            <Stack.Screen
              component={PremiumScreen}
              name="Premium"
              options={{ title: "Premium" }}
            />
          </>
        ) : (
          <Stack.Screen
            component={LoginScreen}
            name="Login"
            options={{ title: "Enter the Village" }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
