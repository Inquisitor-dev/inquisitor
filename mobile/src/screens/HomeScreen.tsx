import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
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
    title: "90'lar Amerikan Kasabasi",
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
    userEmail,
    isAdmin,
    sessionId,
    currentDay,
    dialoguesUsedToday,
    maxDailyDialogues,
    difficulty,
    scenarioType,
    isPremium,
    hydrateSession,
    logout,
    clearSession,
    setAccountIdentity,
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
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [howToPlayVisible, setHowToPlayVisible] = useState(false);
  const [premiumVisible, setPremiumVisible] = useState(false);
  const [activationCode, setActivationCode] = useState("");
  const [premiumLoading, setPremiumLoading] = useState(false);
  const [premiumError, setPremiumError] = useState<string | null>(null);
  const [premiumSuccess, setPremiumSuccess] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [accountSummary, setAccountSummary] = useState<null | {
    email: string;
    isAdmin: boolean;
    isPremium: boolean;
    dailySessionCount: number;
    dailyMessageCount: number;
    maxSessionsPerDay: number;
    maxMessagesPerDay: number;
  }>(null);
  const [accountLoading, setAccountLoading] = useState(false);
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

  const handleActivatePremium = async () => {
    if (!activationCode.trim()) {
      setPremiumError("Aktivasyon kodunu girin.");
      return;
    }
    setPremiumLoading(true);
    setPremiumError(null);
    try {
      const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || "https://the-inquisitor-backend.onrender.com";
      const response = await fetch(`${baseUrl}/auth/activate-premium`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ activationCode: activationCode.trim() }),
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        useGameStore.getState().setIsPremium(true);
        setPremiumSuccess(true);
      } else {
        setPremiumError(data.message || "Aktivasyon basarisiz.");
      }
    } catch {
      setPremiumError("Sunucuya baglanilamadi.");
    } finally {
      setPremiumLoading(false);
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
    setError(null);
    setDifficultyVisible(true);
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

  const effectiveIsAdmin = accountSummary?.isAdmin ?? isAdmin;
  const effectiveIsPremium = accountSummary?.isPremium ?? isPremium;
  const effectiveEmail = accountSummary?.email ?? userEmail ?? "-";
  const fallbackMaxSessions = effectiveIsAdmin ? 999 : effectiveIsPremium ? 5 : 2;
  const fallbackMaxMessages = effectiveIsAdmin ? 999 : effectiveIsPremium ? 100 : 30;

  useEffect(() => {
    const loadAccountSummary = async () => {
      if ((!settingsVisible && userEmail) || !authToken) return;

      try {
        setAccountLoading(true);
        const summary = await api.getAccountSummary(authToken);
        setAccountSummary(summary);
        setAccountIdentity({
          email: summary.email,
          isAdmin: summary.isAdmin,
          isPremium: summary.isPremium,
        });
      } catch (err) {
        console.warn("Account summary could not load", err);
      } finally {
        setAccountLoading(false);
      }
    };

    void loadAccountSummary();
  }, [authToken, setAccountIdentity, settingsVisible, userEmail]);

  return (
    <View style={styles.main}>
      <View pointerEvents="none" style={styles.vignette} />
      <View pointerEvents="none" style={styles.cornerTopLeft} />
      <View pointerEvents="none" style={styles.cornerTopRight} />
      <View pointerEvents="none" style={styles.cornerBottomLeft} />
      <View pointerEvents="none" style={styles.cornerBottomRight} />

      <Pressable
        onPress={() => setSettingsVisible(true)}
        style={[styles.settingsButton, { top: insets.top + 18 }]}
        accessibilityLabel="Ayarlar"
      >
        <Text style={styles.settingsIcon}>⚙</Text>
      </Pressable>

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

            <LandingButton
              label="Nasil Oynanir?"
              onPress={() => setHowToPlayVisible(true)}
            />

            {!effectiveIsPremium ? (
              <LandingButton
                label="Premium'a Yukselt"
                onPress={() => setPremiumVisible(true)}
              />
            ) : null}

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
        title="Sorusturma Kilavuzu"
        visible={howToPlayVisible}
        onClose={() => setHowToPlayVisible(false)}
      >
        <ScrollView style={styles.guideScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.guideSection}>
            <Text style={styles.guideTitle}>Temel Amac</Text>
            <Text style={styles.guideText}>
              Ashenmoor koyunde islenen gizemli bir cinayeti cozmekle gorevli bir
              Engizisyon mufettisisin. 4 gunun var. Bu sure zarfinda dogru kisiyi
              olume mahkum etmeli ve gercegi ortaya cikarmalisin.
            </Text>
          </View>

          <View style={styles.guideSection}>
            <Text style={styles.guideTitle}>Zaman Yonetimi</Text>
            <Text style={styles.guideText}>
              Bir mekana her girdiginde vakit ilerler. Gece oldugunda herkes evine
              cekilir ve gun biter.
            </Text>
          </View>

          <View style={styles.guideSection}>
            <Text style={styles.guideTitle}>Arama Izinleri</Text>
            <Text style={styles.guideText}>
              Koyluleri sadece sorgulayarak degil, mekanlarini arayarak da kanit
              bulabilirsin. Ama bir mekani aramak icin Peder Malachar'dan arama izni
              almalisin.
            </Text>
          </View>

          <View style={styles.guideSection}>
            <Text style={styles.guideTitle}>Not Tutma</Text>
            <Text style={styles.guideText}>
              Koylulerin soyledikleri celiskili olabilir. Onemli ipuclarini not
              defterine kaydet.
            </Text>
          </View>

          <View style={styles.guideSection}>
            <Text style={styles.guideTitle}>Nihai Hukum</Text>
            <Text style={styles.guideText}>
              Istedigin an haritadaki Mahkumu Sec butonuna basarak birini suclayabilirsin.
              Yanlis kisiyi asarsan gercek katil aramizda dolasmaya devam eder.
            </Text>
          </View>

          <View style={styles.guideTip}>
            <Text style={styles.guideTipStrong}>Ipuucu:</Text>
            <Text style={styles.guideTipText}>
              Her yalan soyleyen koylu katil olmayabilir.
            </Text>
          </View>
        </ScrollView>

        <Pressable onPress={() => setHowToPlayVisible(false)} style={styles.modalActionButton}>
          <Text style={styles.modalActionButtonText}>Anladim</Text>
        </Pressable>
      </AppModal>

      <AppModal
        title={premiumSuccess ? "Premium Aktif" : "Premium Uyelik"}
        subtitle={premiumSuccess ? "Tebrikler! Artik tum ozelliklere erisebilirsiniz." : "Tam Engizisyon Yetkisi"}
        visible={premiumVisible}
        onClose={() => setPremiumVisible(false)}
      >
        <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
          {!premiumSuccess ? (
            <>
              <View style={{ marginBottom: 24, padding: 16, backgroundColor: "rgba(218,165,32,0.05)", borderWidth: 1, borderColor: "rgba(218,165,32,0.2)", borderRadius: 4 }}>
                <Text style={{ color: "#DAA520", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Premium Avantajlari</Text>
                <Text style={{ color: "#aaa", fontSize: 13, lineHeight: 24 }}>⚡ Sunuculara oncelikli erisim</Text>
                <Text style={{ color: "#aaa", fontSize: 13, lineHeight: 24 }}>🎯 Zorluk secimi (Orta & Zor modlar)</Text>
                <Text style={{ color: "#aaa", fontSize: 13, lineHeight: 24 }}>🌍 Ek senaryolar (Modern & Cyberpunk)</Text>
                <Text style={{ color: "#aaa", fontSize: 13, lineHeight: 24 }}>💬 Gunluk 100 diyalog hakki</Text>
                <Text style={{ color: "#aaa", fontSize: 13, lineHeight: 24 }}>🔍 Gunluk 5 sorusturma hakki</Text>
              </View>

              <Text style={{ color: "#666", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Aktivasyon Kodu</Text>
              <TextInput
                style={{ backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: "#e5d9c5", padding: 12, borderRadius: 4, marginBottom: 16 }}
                placeholder="Kodunuzu girin"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={activationCode}
                onChangeText={setActivationCode}
                autoCapitalize="none"
              />

              <Pressable
                disabled={premiumLoading}
                onPress={handleActivatePremium}
                style={({ pressed }) => [
                  { backgroundColor: "#DAA520", padding: 14, borderRadius: 4, alignItems: "center" },
                  premiumLoading && { opacity: 0.5 },
                  pressed && !premiumLoading && { opacity: 0.8 },
                ]}
              >
                <Text style={{ color: "#000", fontWeight: "bold", letterSpacing: 1, fontSize: 13 }}>
                  {premiumLoading ? "ISLENIYOR..." : "PREMIUM'U AKTIFLESTIR"}
                </Text>
              </Pressable>

              {premiumError ? <Text style={{ marginTop: 16, padding: 8, backgroundColor: "rgba(138,3,3,0.15)", color: "#e07070", textAlign: "center", fontSize: 12 }}>{premiumError}</Text> : null}
            </>
          ) : (
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <Text style={{ fontSize: 40, marginBottom: 16 }}>⭐</Text>
              <Text style={{ color: "#e5d9c5", textAlign: "center", lineHeight: 24, marginBottom: 24 }}>
                Aktivasyon basarili! Lutfen degisikliklerin gecerli olmasi icin uygulamayi yeniden baslatin veya "Hesaptan Cikis Yap" secenegi ile tekrar giris yapin.
              </Text>
              <Pressable onPress={() => setPremiumVisible(false)} style={{ backgroundColor: "#DAA520", padding: 14, borderRadius: 4, width: "100%", alignItems: "center" }}>
                <Text style={{ color: "#000", fontWeight: "bold", letterSpacing: 1 }}>KAPAT</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </AppModal>

      <AppModal
        title="Ayarlar"
        subtitle="Ses kontrolu ve hesap islemleri."
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      >
        <View style={styles.settingsGroup}>
          <Text style={styles.settingsHeading}>Hesap Detaylari</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>E-posta</Text>
              <Text style={styles.infoValue}>{effectiveEmail}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Plan</Text>
              <Text style={styles.infoValue}>
                {effectiveIsAdmin
                  ? "Admin"
                  : effectiveIsPremium
                    ? "Premium"
                    : "Ucretsiz"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Kalan Oturum</Text>
              <Text style={styles.infoValue}>
                {accountLoading
                  ? "Yukleniyor..."
                  : accountSummary
                    ? `${Math.max(
                        0,
                        accountSummary.maxSessionsPerDay - accountSummary.dailySessionCount,
                      )} / ${accountSummary.maxSessionsPerDay === 999 ? "Sinirsiz" : accountSummary.maxSessionsPerDay}`
                    : effectiveIsAdmin
                      ? "Sinirsiz / Sinirsiz"
                      : `${fallbackMaxSessions} / ${fallbackMaxSessions}`}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Kalan Diyalog</Text>
              <Text style={styles.infoValue}>
                {accountLoading
                  ? "Yukleniyor..."
                  : accountSummary
                    ? `${Math.max(
                        0,
                        accountSummary.maxMessagesPerDay - accountSummary.dailyMessageCount,
                      )} / ${accountSummary.maxMessagesPerDay === 999 ? "Sinirsiz" : accountSummary.maxMessagesPerDay}`
                    : effectiveIsAdmin
                      ? "Sinirsiz / Sinirsiz"
                      : `${Math.max(0, maxDailyDialogues - dialoguesUsedToday)} / ${fallbackMaxMessages}`}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.settingsGroup}>
          <Text style={styles.settingsHeading}>Ana Menu Muzigi</Text>
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

        <Pressable
          onPress={() => {
            setSettingsVisible(false);
            logout();
          }}
          style={styles.settingsLogoutButton}
        >
          <Text style={styles.settingsLogoutText}>Hesaptan Cikis Yap</Text>
        </Pressable>
      </AppModal>

      <AppModal
        title="Zorluk Seviyesi Sec"
        subtitle="Masaustu surumundeki gibi sorusturmanin karmasikligini belirle."
        visible={difficultyVisible}
        onClose={() => setDifficultyVisible(false)}
      >
        <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
          {difficultyOptions.map((option) => {
            const isLocked = !effectiveIsPremium && option.id !== "easy";
            return (
              <Pressable
                key={option.id}
                disabled={isLocked}
                onPress={() => handleDifficultySelect(option.id)}
                style={({ pressed }) => [
                  styles.selectionButton,
                  isLocked && styles.selectionButtonDisabled,
                  pressed && !isLocked && styles.buttonPressed,
                ]}
              >
                <View style={styles.selectionHeader}>
                  <Text style={styles.selectionTitle}>
                    {option.title} {isLocked ? "🔒 (Premium)" : ""}
                  </Text>
                  <Text style={styles.selectionMeta}>{option.count}</Text>
                </View>
                <Text style={styles.selectionDescription}>{option.description}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </AppModal>

      <AppModal
        title="Senaryo Evreni Sec"
        subtitle="Klasik Ortacag, 90'lar Amerikan Kasabasi veya Distopik Cyberpunk."
        visible={scenarioVisible}
        onClose={() => setScenarioVisible(false)}
      >
        <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
          {scenarioOptions.map((option) => {
            const isLocked = !effectiveIsPremium && option.id !== "medieval";
            return (
              <Pressable
                key={option.id}
                disabled={creating || !selectedDifficulty || isLocked}
                onPress={() => {
                  if (!selectedDifficulty) return;
                  void handleCreateSession(selectedDifficulty, option.id);
                }}
                style={({ pressed }) => [
                  styles.selectionButton,
                  (creating || isLocked) && styles.selectionButtonDisabled,
                  pressed && !creating && !isLocked && styles.buttonPressed,
                ]}
              >
                <Text style={styles.selectionTitle}>
                  {option.title} {isLocked ? "🔒 (Premium)" : ""}
                </Text>
                <Text style={styles.selectionDescription}>{option.description}</Text>
              </Pressable>
            );
          })}
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
  settingsButton: {
    position: "absolute",
    left: 22,
    zIndex: 5,
    width: 44,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "rgba(138, 3, 3, 0.3)",
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsIcon: {
    color: inquisitorColors.parchment,
    fontSize: 21,
    fontWeight: "700",
    lineHeight: 22,
  },
  settingsGroup: {
    marginBottom: 12,
  },
  settingsHeading: {
    color: inquisitorColors.parchment,
    fontFamily: "serif",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  infoCard: {
    borderWidth: 1,
    borderColor: "rgba(232,220,196,0.08)",
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(232,220,196,0.06)",
  },
  infoLabel: {
    color: inquisitorColors.muted,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    flex: 1,
  },
  infoValue: {
    color: inquisitorColors.parchment,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
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
  settingsLogoutButton: {
    minHeight: 52,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(232,220,196,0.12)",
    backgroundColor: "rgba(138,3,3,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsLogoutText: {
    color: inquisitorColors.parchment,
    fontFamily: "serif",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
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
  guideScroll: {
    maxHeight: 420,
  },
  guideSection: {
    marginBottom: 20,
  },
  guideTitle: {
    color: inquisitorColors.primary,
    fontFamily: "serif",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  guideText: {
    color: inquisitorColors.muted,
    fontSize: 14,
    lineHeight: 24,
  },
  guideTip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(138, 3, 3, 0.1)",
    borderLeftWidth: 2,
    borderLeftColor: inquisitorColors.primary,
    padding: 14,
    marginTop: 8,
  },
  guideTipStrong: {
    color: inquisitorColors.parchment,
    fontWeight: "700",
  },
  guideTipText: {
    color: inquisitorColors.muted,
    flex: 1,
    fontStyle: "italic",
    lineHeight: 21,
  },
  modalActionButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: inquisitorColors.primary,
    borderRadius: 2,
  },
  modalActionButtonText: {
    color: inquisitorColors.parchment,
    fontFamily: "serif",
    fontSize: 16,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1.4,
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
