import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { Panel } from "@/components/Panel";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import type { RootStackParamList } from "@/navigation/AppNavigator";
import { api } from "@/services/api";
import { useGameStore } from "@/store/useGameStore";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import type { SessionSnapshot } from "@/types/game";

function isSessionSnapshot(value: unknown): value is SessionSnapshot {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value &&
      typeof value.id === "string",
  );
}

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  const {
    authToken,
    userEmail,
    sessionId,
    currentDay,
    timeOfDay,
    scenarioType,
    difficulty,
    hydrateSession,
    logout,
    clearSession,
  } = useGameStore();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      if (!authToken) {
        setLoading(false);
        return;
      }

      try {
        const result = await api.getActiveSession(authToken);
        if (isSessionSnapshot(result.session)) {
          hydrateSession(result.session);
        } else {
          clearSession();
        }
      } catch (error) {
        Alert.alert(
          "Session check failed",
          error instanceof Error ? error.message : "Unknown error",
        );
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, [authToken, hydrateSession, clearSession]);

  const handleCreateSession = async () => {
    if (!authToken) {
      return;
    }

    try {
      setCreating(true);
      const session = await api.createSession(authToken, difficulty, scenarioType);
      if (isSessionSnapshot(session)) {
        hydrateSession(session);
        navigation.navigate("Map");
      }
    } catch (error) {
      Alert.alert(
        "Could not start a session",
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.kicker}>Mobile development plan</Text>
        <Text style={styles.title}>Step 1 is live: the Expo app shell is ready.</Text>
        <Text style={styles.subtitle}>
          Next we will wire the real interrogation flow, map interactions, and notes sync.
        </Text>
      </View>

      <Panel>
        <Text style={styles.sectionTitle}>Current architecture</Text>
        <Text style={styles.item}>Expo + React Native for cross-platform delivery</Text>
        <Text style={styles.item}>Zustand persisted with AsyncStorage</Text>
        <Text style={styles.item}>Shared backend contract through fetch-based services</Text>
        <Text style={styles.item}>NPC fear and lie metrics removed from mobile state</Text>
      </Panel>

      <Panel>
        <Text style={styles.sectionTitle}>Player state</Text>
        <Text style={styles.item}>Agent: {userEmail ?? "Unknown"}</Text>
        <Text style={styles.item}>Active session: {loading ? "Checking..." : sessionId ?? "None"}</Text>
        <Text style={styles.item}>Day / Time: {currentDay} / {timeOfDay}</Text>
      </Panel>

      <PrimaryButton
        disabled={loading || creating}
        onPress={() => {
          if (sessionId) {
            navigation.navigate("Map");
            return;
          }

          void handleCreateSession();
        }}
      >
        {sessionId ? "Resume investigation" : creating ? "Preparing case..." : "Start new investigation"}
      </PrimaryButton>

      <PrimaryButton disabled={false} onPress={logout}>
        Sign out
      </PrimaryButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.md,
  },
  kicker: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 36,
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.textMuted,
    lineHeight: 22,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  item: {
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
});
