import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "@/navigation/AppNavigator";
import { api } from "@/services/api";
import { useGameStore } from "@/store/useGameStore";
import { inquisitorColors } from "@/theme/inquisitor";
import type { SessionSnapshot } from "@/types/game";

function isSessionSnapshot(value: unknown): value is SessionSnapshot {
  return Boolean(value && typeof value === "object" && "id" in value);
}

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

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
      {primary ? <Text style={styles.buttonArrow}>→</Text> : null}
    </Pressable>
  );
}

export function HomeScreen({ navigation }: Props) {
  const {
    authToken,
    userEmail,
    sessionId,
    currentDay,
    difficulty,
    scenarioType,
    hydrateSession,
    logout,
    clearSession,
  } = useGameStore();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [resuming, setResuming] = useState(false);

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
  }, [authToken, clearSession, hydrateSession]);

  const handleCreateSession = async () => {
    if (!authToken) return;

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

  const handleResume = async () => {
    if (!sessionId) return;

    try {
      setResuming(true);
      navigation.navigate("Map");
    } finally {
      setResuming(false);
    }
  };

  return (
    <View style={styles.main}>
      <View pointerEvents="none" style={styles.vignette} />
      <View pointerEvents="none" style={styles.cornerTopLeft} />
      <View pointerEvents="none" style={styles.cornerTopRight} />
      <View pointerEvents="none" style={styles.cornerBottomLeft} />
      <View pointerEvents="none" style={styles.cornerBottomRight} />

      <View style={styles.soundStub}>
        <Text style={styles.soundIcon}>🔊</Text>
      </View>

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

        <Text style={styles.eyebrow}>— ANNO DOMINI MCCXII —</Text>
        <Text style={styles.title}>The Inquisitor</Text>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerIcon}>✦</Text>
          <View style={styles.dividerLine} />
        </View>

        <Text style={styles.lead}>Bu köyde kimse göründüğü gibi değil.</Text>
        <Text style={styles.description}>
          Bu hikayenin kahramanı sen değilsin. Yetki, sabır ve soğuk kanlılıkla
          donanmış şekilde köylüleri sorgula, çelişkileri ortaya çıkar ve nihai hükmünü
          ver.
        </Text>
        <Text style={styles.slogan}>DINLE · ANALIZ ET · HUKUM VER</Text>

        <View style={styles.cta}>
          {sessionId ? (
            <LandingButton
              disabled={loading || resuming}
              label={resuming ? `Soruşturma yükleniyor...` : `Soruşturmaya Devam Et (Gün ${currentDay})`}
              onPress={handleResume}
            />
          ) : null}

          <LandingButton
            disabled={loading || creating}
            label={
              creating
                ? "Ashenmoor'a giden araba hazırlanıyor..."
                : sessionId
                  ? "Yeni Soruşturma Başlat"
                  : "Soruşturmaya Başla"
            }
            onPress={() => {
              if (sessionId) {
                void handleCreateSession();
              } else {
                void handleCreateSession();
              }
            }}
            primary
          />

          <LandingButton
            label={`Ajan: ${userEmail ?? "bilinmiyor"}`}
            onPress={() => {}}
            disabled
          />

          <LandingButton label="Hesaptan Çıkış Yap" onPress={logout} />
          <Text style={styles.sessionNote}>Mobil soruşturma arayüzü · Expo Go build</Text>
        </View>

        <View style={styles.bottomRule}>
          <View style={styles.bottomRuleLine} />
          <Text style={styles.bottomRuleText}>Inquisitor AI · Est. MCCXII</Text>
          <View style={styles.bottomRuleLine} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: inquisitorColors.bg,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    overflow: "hidden",
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOpacity: 0.9,
    shadowRadius: 100,
    elevation: 1,
  },
  soundStub: {
    position: "absolute",
    top: 18,
    right: 22,
    zIndex: 5,
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(138, 3, 3, 0.3)",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  soundIcon: {
    color: inquisitorColors.parchment,
    fontSize: 18,
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
    paddingVertical: 48,
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
  sessionNote: {
    color: inquisitorColors.dim,
    fontSize: 11,
    textAlign: "center",
    letterSpacing: 1,
    marginTop: 2,
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
