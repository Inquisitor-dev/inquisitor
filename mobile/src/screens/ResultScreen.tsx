import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Panel } from "@/components/Panel";
import { PrimaryButton } from "@/components/PrimaryButton";
import { getLocationLabel } from "@/data/gameContent";
import type { RootStackParamList } from "@/navigation/AppNavigator";
import { useGameStore } from "@/store/useGameStore";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

type Props = NativeStackScreenProps<RootStackParamList, "Result">;

export function ResultScreen({ navigation, route }: Props) {
  const { won, message, reason } = route.params;
  const { truthReveal, locationClues, scenarioType, clearSession } = useGameStore();

  const title = won
    ? "Sorusturma Basariyla Sonuclandi"
    : reason === "timeout"
      ? "Zaman Tukenince Hukum Gecikti"
      : "Korkunc Bir Hata Yaptin";

  const body = won
    ? `${message} Karanlik dagildi, ama Engizisyon'un isi burada bitmiyor.`
    : reason === "timeout"
      ? "Verilen sure icinde hakikati ortaya cikaramadin. Kilise zayifliga tahammul etmez."
      : "Masum bir ruhu alevlere teslim ettin. Gercek suclu ise karanlikta saklanmaya devam ediyor.";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>{won ? "Verdict recorded" : "Final report"}</Text>
        <Text style={[styles.title, won ? styles.titleWin : styles.titleLoss]}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>

      {truthReveal ? (
        <Panel>
          <Text style={styles.panelTitle}>Gerceklerin Ardindan</Text>
          <Text style={styles.panelText}>{truthReveal}</Text>
        </Panel>
      ) : null}

      {locationClues && Object.keys(locationClues).length > 0 ? (
        <Panel>
          <Text style={styles.panelTitle}>Gizli Ipuclari</Text>
          <View style={styles.clueList}>
            {Object.entries(locationClues).map(([locationId, clue]) => (
              <View key={locationId} style={styles.clueRow}>
                <Text style={styles.clueLocation}>
                  {getLocationLabel(scenarioType, locationId)}
                </Text>
                <Text style={styles.clueText}>{String(clue)}</Text>
              </View>
            ))}
          </View>
        </Panel>
      ) : null}

      <PrimaryButton
        onPress={() => {
          clearSession();
          navigation.reset({
            index: 0,
            routes: [{ name: "Home" }],
          });
        }}
      >
        Ana Ekrana Don ve Yeni Sorusturma Baslat
      </PrimaryButton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
    justifyContent: "center",
    gap: spacing.lg,
  },
  hero: {
    gap: spacing.md,
    alignItems: "center",
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 38,
    fontWeight: "800",
    textAlign: "center",
    textTransform: "uppercase",
    fontFamily: "serif",
  },
  titleWin: {
    color: "#b8860b",
  },
  titleLoss: {
    color: colors.accentStrong,
  },
  body: {
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 720,
  },
  panelTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  panelText: {
    color: colors.textMuted,
    lineHeight: 24,
    fontStyle: "italic",
  },
  clueList: {
    gap: spacing.md,
  },
  clueRow: {
    gap: spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#2a1f1a",
  },
  clueLocation: {
    color: colors.accent,
    fontWeight: "700",
    textTransform: "uppercase",
    fontSize: 12,
  },
  clueText: {
    color: colors.textMuted,
    lineHeight: 22,
    fontStyle: "italic",
  },
});
