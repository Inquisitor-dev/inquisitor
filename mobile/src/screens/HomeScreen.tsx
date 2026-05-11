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
        <Text style={styles.kicker}>Case preparation</Text>
        <Text style={styles.title}>Bir sonraki hukum icin dosya hazir.</Text>
        <Text style={styles.subtitle}>
          Buradan aktif sorusturmani surdurabilir ya da yeni bir dava acip koyun
          dengelerini yeniden bozabilirsin.
        </Text>
      </View>

      <Panel>
        <Text style={styles.panelEyebrow}>Field brief</Text>
        <Text style={styles.sectionTitle}>Sorusturma profili</Text>
        <Text style={styles.item}>Ajan: {userEmail ?? "Unknown"}</Text>
        <Text style={styles.item}>Senaryo: {scenarioType}</Text>
        <Text style={styles.item}>Zorluk: {difficulty}</Text>
        <Text style={styles.item}>Kayitli oturum: {loading ? "Checking..." : sessionId ?? "None"}</Text>
      </Panel>

      <Panel>
        <Text style={styles.panelEyebrow}>Clock and pressure</Text>
        <Text style={styles.sectionTitle}>Sahadaki durum</Text>
        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Gun</Text>
            <Text style={styles.statValue}>{currentDay}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Vakit</Text>
            <Text style={styles.statValue}>{timeOfDay}</Text>
          </View>
        </View>
        <Text style={styles.item}>
          Aktif session varsa ayni case board uzerinden devam edeceksin.
        </Text>
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

      <PrimaryButton disabled={false} onPress={logout} tone="ghost">
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
    fontSize: 36,
    fontWeight: "800",
    lineHeight: 42,
    marginBottom: spacing.sm,
    fontFamily: "serif",
  },
  subtitle: {
    color: colors.textMuted,
    lineHeight: 22,
  },
  panelEyebrow: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  item: {
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  statRow: {
    flexDirection: "row",
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.panelStrong,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginRight: spacing.sm,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  statValue: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800",
  },
});
