import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";

import { AppModal } from "@/components/AppModal";
import type { RootStackParamList } from "@/navigation/AppNavigator";
import { api } from "@/services/api";
import { useGameStore } from "@/store/useGameStore";
import { inquisitorColors } from "@/theme/inquisitor";
import type { Difficulty, ScenarioType, SessionSnapshot } from "@/types/game";

function isSessionSnapshot(value: unknown): value is SessionSnapshot {
  return Boolean(value && typeof value === "object" && "id" in value);
}

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

const difficultyOptions: Array<{
  id: Difficulty;
  title: string;
  count: string;
  description: string;
}> = [
  {
    id: "easy",
    title: "Kolay",
    count: "4 Supheli",
    description: "Hanci, Peder, Mezarcı ve Degirmenci. Standart sorusturma deneyimi.",
  },
  {
    id: "medium",
    title: "Orta",
    count: "5 Supheli",
    description: "+ Ciftci Edmund. Artan supheli sayisiyla daha karmasik iliskiler.",
  },
  {
    id: "hard",
    title: "Zor",
    count: "6 Supheli",
    description: "+ Ciftci ve Doktor. Kalabaliklasan supheli listesiyle en karmasik hikaye.",
  },
];

const scenarioOptions: Array<{
  id: ScenarioType;
  title: string;
  description: string;
}> = [
  {
    id: "medieval",
    title: "Klasik Ortacag",
    description:
      "Ashenmoor Koyu. Engizisyon, batil inanclar ve karanlik sirlar. Standart dark fantasy deneyimi.",
  },
  {
    id: "modern",
    title: "Modern Amerikan Kasabasi",
    description:
      "Oakhaven. Yerel polis, cinayet dedektifleri ve supheli kasabalilar. Gerilim dolu true crime polisiyesi.",
  },
  {
    id: "cyberpunk",
    title: "Distopik Cyberpunk",
    description:
      "Neon Prime. Yozlasmis mega sirketler, siber gelistirmeler ve tech-noir bir bilimkurgu sorusturmasi.",
  },
];

function LandingButton({
  label,
  onPress,
  disabled = false,
  primary = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.primaryButton : styles.secondaryButton,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
    >
      <Text style={[styles.buttonLabel, !primary && styles.secondaryButtonLabel]}>{label}</Text>
      {primary ? <Text style={styles.buttonArrow}>{"->"}</Text> : null}
    </Pressable>
  );
}

export function HomeScreen({ navigation }: Props) {
  const {
    authToken,
    sessionId,
    currentDay,
    difficulty,
    scenarioType,
    isPremium,
    hydrateSession,
    logout,
    clearSession,
    setDifficulty,
    setScenarioType,
  } = useGameStore();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [error, setError] = useState<string | null>(null);
  const [difficultyVisible, setDifficultyVisible] = useState(false);
  const [scenarioVisible, setScenarioVisible] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const soundtrackRef = useRef<Audio.Sound | null>(null);
  const insets = useSafeAreaInsets();

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
      } catch (err) {
        Alert.alert(
          "Session check failed",
          err instanceof Error ? err.message : "Unknown error",
        );
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, [authToken, clearSession, hydrateSession]);

  useEffect(() => {
    let mounted = true;

    const setupSoundtrack = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
          interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        });

        const { sound } = await Audio.Sound.createAsync(
          require("../../assets/sounds/Main_Soundtrack.mp3"),
          {
            shouldPlay: true,
            isLooping: true,
            volume,
            isMuted,
          },
        );

        if (!mounted) {
          await sound.unloadAsync();
          return;
        }

        soundtrackRef.current = sound;
      } catch (err) {
        console.warn("Soundtrack could not start", err);
      }
    };

    void setupSoundtrack();

    return () => {
      mounted = false;
      const sound = soundtrackRef.current;
      soundtrackRef.current = null;
      if (sound) {
        void sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    const syncSoundState = async () => {
      const sound = soundtrackRef.current;
      if (!sound) return;

      try {
        await sound.setStatusAsync({
          volume,
          isMuted,
          shouldPlay: !isMuted,
        });
      } catch (err) {
        console.warn("Soundtrack state could not update", err);
      }
    };

    void syncSoundState();
  }, [isMuted, volume]);

  const handleCreateSession = async (
    difficultyChoice: Difficulty = difficulty,
    scenarioChoice: ScenarioType = scenarioType,
  ) => {
    if (!authToken) return;

    try {
      setCreating(true);
      setError(null);
      setDifficulty(difficultyChoice);
      setScenarioType(scenarioChoice);
      const session = await api.createSession(authToken, difficultyChoice, scenarioChoice);
      if (isSessionSnapshot(session)) {
        hydrateSession(session);
        navigation.navigate("Map");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      Alert.alert("Could not start a session", message);
    } finally {
      setCreating(false);
      setDifficultyVisible(false);
      setScenarioVisible(false);
    }
  };

  const handleResume = async () => {
    if (!sessionId) return;
    try {
      setResuming(true);
      navigation.navigate("Map");
    } finally {
      setResuming(false);
    }
  };

  const handleStart = () => {
    if (isPremium) {
      setError(null);
      setDifficultyVisible(true);
      return;
    }

    void handleCreateSession("easy", "medieval");
  };

  const handleDifficultySelect = (value: Difficulty) => {
    setSelectedDifficulty(value);
    setDifficultyVisible(false);
    setScenarioVisible(true);
  };

  const changeVolume = (delta: number) => {
    setVolume((prev) => {
      const next = Math.max(0, Math.min(1, Number((prev + delta).toFixed(2))));
      if (next > 0) {
        setIsMuted(false);
      }
      return next;
    });
  };

  const pickVolume = (next: number) => {
    setVolume(next);
    setIsMuted(next === 0 ? true : false);
  };

  return (
    <View style={styles.main}>
      <View pointerEvents="none" style={styles.vignette} />
      <View pointerEvents="none" style={styles.cornerTopLeft} />
      <View pointerEvents="none" style={styles.cornerTopRight} />
      <View pointerEvents="none" style={styles.cornerBottomLeft} />
      <View pointerEvents="none" style={styles.cornerBottomRight} />

      <View style={[styles.soundPanel, { top: insets.top + 18 }]}>
        <Pressable
          onPress={() => setIsMuted((prev) => !prev)}
          style={({ pressed }) => [
            styles.soundToggle,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.soundIcon}>{isMuted ? "MUTE" : "SOUND"}</Text>
        </Pressable>

        <View style={styles.volumeRow}>
          <Pressable onPress={() => changeVolume(-0.2)} style={styles.volumeStepButton}>
            <Text style={styles.volumeStepText}>-</Text>
          </Pressable>

          <View style={styles.volumeBars}>
            {[0.2, 0.4, 0.6, 0.8, 1].map((step, index) => {
              const active = !isMuted && volume >= step;
              return (
                <Pressable
                  key={step}
                  onPress={() => pickVolume(step)}
                  style={[
                    styles.volumeBar,
                    active && styles.volumeBarActive,
                    index === 4 && styles.volumeBarLast,
                  ]}
                />
              );
            })}
          </View>

          <Pressable onPress={() => changeVolume(0.2)} style={styles.volumeStepButton}>
            <Text style={styles.volumeStepText}>+</Text>
          </Pressable>
        </View>

        <Text style={styles.volumeLabel}>{Math.round((isMuted ? 0 : volume) * 100)}%</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 62, paddingBottom: insets.bottom + 48 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.seal}>
            <View style={styles.sealOuter} />
            <View style={styles.sealInner} />
            <View style={styles.crossVertical} />
            <View style={styles.crossHorizontal} />
            <View style={styles.sealDiamondCenter} />
            <View style={[styles.sealDiamond, styles.sealDiamondTop]} />
            <View style={[styles.sealDiamond, styles.sealDiamondBottom]} />
            <View style={[styles.sealDiamond, styles.sealDiamondLeft]} />
            <View style={[styles.sealDiamond, styles.sealDiamondRight]} />
          </View>

          <Text style={styles.eyebrow}>- ANNO DOMINI MCCXII -</Text>
          <Text style={styles.title}>The Inquisitor</Text>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerIcon}>*</Text>
            <View style={styles.dividerLine} />
          </View>

          <Text style={styles.lead}>Bu koyde kimse gorundugu gibi degil.</Text>
          <Text style={styles.description}>
            Bu hikayenin kahramani sen degilsin. Yetki, sabir ve soguk kanlilikla
            koyluleri sorgula, celiskileri ortaya cikar ve nihai hukmunu ver.
          </Text>
          <Text style={styles.slogan}>DINLE · ANALIZ ET · HUKUM VER</Text>

          <View style={styles.cta}>
            {sessionId ? (
              <LandingButton
                disabled={loading || resuming}
                label={
                  resuming
                    ? "Sorusturma yukleniyor..."
                    : `Sorusturmaya Devam Et (Gun ${currentDay})`
                }
                onPress={handleResume}
              />
            ) : null}

            <LandingButton
              disabled={loading || creating}
              label={
                creating
                  ? "Ashenmoor'a giden araba hazirlaniyor..."
                  : sessionId
                    ? "Yeni Sorusturma Baslat"
                    : "Sorusturmaya Basla"
              }
              onPress={handleStart}
              primary
            />

            <LandingButton label="Hesaptan Cikis Yap" onPress={logout} />
            {error ? <Text style={styles.errorBox}>{error}</Text> : null}
            <Text style={styles.sessionNote}>
              {isPremium
                ? "Premium Surum · Gunluk 100 diyalog · Tum zorluklar ve evrenler"
                : "Ucretsiz Surum · Gunluk 30 diyalog · Kolay / Ortacag"}
            </Text>
          </View>

          <View style={styles.bottomRule}>
            <View style={styles.bottomRuleLine} />
            <Text style={styles.bottomRuleText}>Inquisitor AI · Est. MCCXII</Text>
            <View style={styles.bottomRuleLine} />
          </View>
        </View>
      </ScrollView>

      <AppModal
        title="Zorluk Seviyesi Sec"
        subtitle="Masaustu surumundeki gibi sorusturmanin karmasikligini belirle."
        visible={difficultyVisible}
        onClose={() => setDifficultyVisible(false)}
      >
        <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
          {difficultyOptions.map((option) => (
            <Pressable
              key={option.id}
              onPress={() => handleDifficultySelect(option.id)}
              style={styles.selectionButton}
            >
              <View style={styles.selectionHeader}>
                <Text style={styles.selectionTitle}>{option.title}</Text>
                <Text style={styles.selectionMeta}>{option.count}</Text>
              </View>
              <Text style={styles.selectionDescription}>{option.description}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </AppModal>

      <AppModal
        title="Senaryo Evreni Sec"
        subtitle="Klasik Ortacag, Modern Amerikan Kasabasi veya Distopik Cyberpunk."
        visible={scenarioVisible}
        onClose={() => setScenarioVisible(false)}
      >
        <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
          {scenarioOptions.map((option) => (
            <Pressable
              key={option.id}
              disabled={creating || !selectedDifficulty}
              onPress={() => {
                if (!selectedDifficulty) return;
                void handleCreateSession(selectedDifficulty, option.id);
              }}
              style={({ pressed }) => [
                styles.selectionButton,
                creating && styles.selectionButtonDisabled,
                pressed && !creating && styles.buttonPressed,
              ]}
            >
              <Text style={styles.selectionTitle}>{option.title}</Text>
              <Text style={styles.selectionDescription}>{option.description}</Text>
            </Pressable>
          ))}
          {creating ? (
            <Text style={styles.modalInfo}>Senaryo olusturuluyor, lutfen bekle...</Text>
          ) : null}
        </ScrollView>
      </AppModal>
    </View>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: inquisitorColors.bg,
    overflow: "hidden",
  },
  scrollContent: {
    paddingHorizontal: 24,
    alignItems: "center",
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  soundPanel: {
    position: "absolute",
    right: 22,
    zIndex: 5,
    width: 148,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(138, 3, 3, 0.3)",
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  soundToggle: {
    minHeight: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(138, 3, 3, 0.25)",
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  soundIcon: {
    color: inquisitorColors.parchment,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  volumeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  volumeStepButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(232,220,196,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  volumeStepText: {
    color: inquisitorColors.parchment,
    fontSize: 14,
    fontWeight: "700",
  },
  volumeBars: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    marginHorizontal: 8,
  },
  volumeBar: {
    flex: 1,
    height: 10,
    marginRight: 4,
    borderRadius: 999,
    backgroundColor: "rgba(232,220,196,0.18)",
  },
  volumeBarActive: {
    backgroundColor: inquisitorColors.primary,
  },
  volumeBarLast: {
    marginRight: 0,
  },
  volumeLabel: {
    marginTop: 6,
    color: inquisitorColors.muted,
    fontSize: 11,
    textAlign: "center",
    letterSpacing: 1,
  },
  cornerTopLeft: {
    position: "absolute",
    top: 20,
    left: 20,
    width: 48,
    height: 48,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: "rgba(138, 3, 3, 0.5)",
  },
  cornerTopRight: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 48,
    height: 48,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(138, 3, 3, 0.5)",
  },
  cornerBottomLeft: {
    position: "absolute",
    bottom: 20,
    left: 20,
    width: 48,
    height: 48,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderColor: "rgba(138, 3, 3, 0.5)",
  },
  cornerBottomRight: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 48,
    height: 48,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(138, 3, 3, 0.5)",
  },
  hero: {
    width: "100%",
    maxWidth: 430,
    alignItems: "center",
    paddingVertical: 16,
  },
  seal: {
    width: 120,
    height: 120,
    marginBottom: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  sealOuter: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1.5,
    borderColor: inquisitorColors.primary,
    borderStyle: "dashed",
  },
  sealInner: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: "rgba(138, 3, 3, 0.5)",
  },
  crossVertical: {
    position: "absolute",
    width: 1.5,
    height: 78,
    backgroundColor: inquisitorColors.primary,
  },
  crossHorizontal: {
    position: "absolute",
    width: 78,
    height: 1.5,
    backgroundColor: inquisitorColors.primary,
  },
  sealDiamondCenter: {
    width: 10,
    height: 10,
    backgroundColor: inquisitorColors.primary,
    transform: [{ rotate: "45deg" }],
  },
  sealDiamond: {
    position: "absolute",
    width: 9,
    height: 9,
    borderWidth: 1,
    borderColor: inquisitorColors.primary,
    transform: [{ rotate: "45deg" }],
  },
  sealDiamondTop: {
    top: 14,
  },
  sealDiamondBottom: {
    bottom: 14,
  },
  sealDiamondLeft: {
    left: 14,
  },
  sealDiamondRight: {
    right: 14,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 4,
    color: inquisitorColors.muted,
    textTransform: "uppercase",
    marginBottom: 18,
  },
  title: {
    fontFamily: "serif",
    fontSize: 54,
    fontWeight: "900",
    lineHeight: 58,
    color: inquisitorColors.parchment,
    marginBottom: 24,
    textAlign: "center",
  },
  divider: {
    width: "100%",
    maxWidth: 320,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(138, 3, 3, 0.4)",
  },
  dividerIcon: {
    color: inquisitorColors.primary,
    fontSize: 10,
    marginHorizontal: 14,
  },
  lead: {
    fontFamily: "serif",
    fontSize: 28,
    fontStyle: "italic",
    color: inquisitorColors.parchment,
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    color: inquisitorColors.muted,
    fontSize: 16,
    lineHeight: 31,
    textAlign: "center",
    marginBottom: 22,
  },
  slogan: {
    color: inquisitorColors.primary,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 5,
    textTransform: "uppercase",
    marginBottom: 36,
  },
  cta: {
    width: "100%",
    marginBottom: 40,
  },
  button: {
    minHeight: 66,
    borderRadius: 4,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: inquisitorColors.primary,
    borderWidth: 1,
    borderColor: inquisitorColors.primary,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(138, 3, 3, 0.3)",
  },
  buttonPressed: {
    opacity: 0.92,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonLabel: {
    color: inquisitorColors.parchment,
    fontFamily: "serif",
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  secondaryButtonLabel: {
    color: inquisitorColors.muted,
    fontSize: 15,
  },
  buttonArrow: {
    color: inquisitorColors.parchment,
    fontSize: 20,
    marginLeft: 10,
  },
  errorBox: {
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(138,3,3,0.4)",
    backgroundColor: "rgba(138,3,3,0.15)",
    color: "#e07070",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  sessionNote: {
    color: inquisitorColors.dim,
    fontSize: 11,
    textAlign: "center",
    letterSpacing: 1,
    marginTop: 2,
  },
  modalScroll: {
    maxHeight: 420,
  },
  selectionButton: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#3d342d",
    backgroundColor: "#191310",
  },
  selectionButtonDisabled: {
    opacity: 0.6,
  },
  selectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  selectionTitle: {
    color: inquisitorColors.parchment,
    fontFamily: "serif",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  selectionMeta: {
    color: inquisitorColors.primary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  selectionDescription: {
    color: inquisitorColors.muted,
    fontSize: 13,
    lineHeight: 21,
  },
  modalInfo: {
    color: inquisitorColors.dim,
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
  bottomRule: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  bottomRuleLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(232, 220, 196, 0.1)",
  },
  bottomRuleText: {
    color: inquisitorColors.dim,
    fontSize: 10,
    letterSpacing: 2.4,
    textTransform: "uppercase",
    marginHorizontal: 12,
  },
});
