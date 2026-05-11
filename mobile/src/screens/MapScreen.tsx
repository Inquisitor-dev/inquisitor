import { useEffect, useMemo, useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AppModal } from "@/components/AppModal";
import { Panel } from "@/components/Panel";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import {
  getScenarioNpcs,
  getScenarioTitle,
  getVisibleLocations,
  timeLabels,
} from "@/data/gameContent";
import type { RootStackParamList } from "@/navigation/AppNavigator";
import { api } from "@/services/api";
import { useGameStore } from "@/store/useGameStore";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import type { NpcProfile } from "@/types/game";

type Props = NativeStackScreenProps<RootStackParamList, "Map">;

export function MapScreen({ navigation }: Props) {
  const {
    authToken,
    sessionId,
    currentDay,
    timeOfDay,
    difficulty,
    scenarioType,
    dialoguesUsedToday,
    maxDailyDialogues,
    inventory,
    notes,
    truthReveal,
    setNotes,
    setWarrants,
    setScenarioType,
    setDifficulty,
    setCurrentDay,
    setTimeOfDay,
    setSelectedNpc,
    setDialoguesUsed,
    hydrateSession,
    setTruthReveal,
    setLocationClues,
  } = useGameStore();

  const [notesDraft, setNotesDraft] = useState(notes);
  const [notesVisible, setNotesVisible] = useState(false);
  const [inventoryVisible, setInventoryVisible] = useState(false);
  const [condemnVisible, setCondemnVisible] = useState(false);
  const [loadingLocationId, setLoadingLocationId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<"none" | "end-day" | "notes">("none");

  useEffect(() => {
    setNotesDraft(notes);
  }, [notes]);

  useEffect(() => {
    const syncSession = async () => {
      if (!authToken || !sessionId) {
        return;
      }

      try {
        const data = await api.getSession(authToken, sessionId);
        if (data.scenarioType) {
          setScenarioType(data.scenarioType);
        }
        if (data.difficulty) {
          setDifficulty(data.difficulty);
        }
        setWarrants(data.activeWarrants ?? [], data.usedWarrants ?? []);
        hydrateSession(data);
      } catch (error) {
        Alert.alert(
          "Session sync failed",
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    };

    void syncSession();
  }, [authToken, sessionId, hydrateSession, setDifficulty, setScenarioType, setWarrants]);

  const locations = useMemo(
    () => getVisibleLocations(scenarioType, difficulty),
    [scenarioType, difficulty],
  );

  const villagers = useMemo(
    () => getScenarioNpcs(scenarioType, difficulty),
    [scenarioType, difficulty],
  );

  const handleSaveNotes = async () => {
    if (!authToken || !sessionId) {
      return;
    }

    try {
      setBusyAction("notes");
      await api.updateNotes(authToken, sessionId, notesDraft);
      setNotes(notesDraft);
      setNotesVisible(false);
    } catch (error) {
      Alert.alert(
        "Notes could not be saved",
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      setBusyAction("none");
    }
  };

  const handleOpenLocation = async (locationId: string, locationName: string) => {
    if (!authToken || !sessionId) {
      return;
    }

    if (timeOfDay >= 4) {
      Alert.alert("Gun kapandi", "Yeni bir yere gitmeden once gunu bitirmen gerekiyor.");
      return;
    }

    try {
      setLoadingLocationId(locationId);
      await api.advanceTime(authToken, sessionId);
      setTimeOfDay(Math.min(4, timeOfDay + 1));
      setSelectedNpc(locationId);
      navigation.navigate("Interact", {
        locationId,
        locationName,
      });
    } catch (error) {
      Alert.alert(
        "Location could not open",
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      setLoadingLocationId(null);
    }
  };

  const handleEndDay = async () => {
    if (!authToken || !sessionId) {
      return;
    }

    try {
      setBusyAction("end-day");
      await api.endDay(authToken, sessionId);
      setCurrentDay(currentDay + 1);
      setTimeOfDay(0);
      setDialoguesUsed(0);
    } catch (error) {
      Alert.alert(
        "Day could not end",
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      setBusyAction("none");
    }
  };

  const handleCondemn = (npc: NpcProfile) => {
    if (!authToken || !sessionId) {
      return;
    }

    Alert.alert(
      "Engizisyon hukmu",
      `${npc.name} icin nihai karari vermek istedigine emin misin? Bu secim geri alinamaz.`,
      [
        { text: "Vazgec", style: "cancel" },
        {
          text: "Mahkum et",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await api.condemn(authToken, sessionId, npc.id);
              if (result.session?.truthReveal) {
                setTruthReveal(result.session.truthReveal);
              }
              if (result.session?.locationClues) {
                setLocationClues(result.session.locationClues);
              }

              Alert.alert(
                result.won ? "Dogru hedef" : "Yanlis hedef",
                result.message ?? "Karar uygulandi.",
              );
              setCondemnVisible(false);
            } catch (error) {
              Alert.alert(
                "Condemn failed",
                error instanceof Error ? error.message : "Unknown error",
              );
            }
          },
        },
      ],
    );
  };

  return (
    <>
      <Screen>
        <View style={styles.hero}>
          <View style={styles.heroText}>
            <Text style={styles.eyebrow}>{getScenarioTitle(scenarioType)}</Text>
            <Text style={styles.title}>
              {timeLabels[timeOfDay]} / Gun {currentDay}
            </Text>
            <Text style={styles.subtitle}>
              Dikey mobil deneyim icin dokunmatik lokasyon kartlariyla sorusturma akisini
              kuruyoruz.
            </Text>
          </View>
          <View style={styles.badges}>
            <View style={styles.badge}>
              <Text style={styles.badgeLabel}>Soru Hakki</Text>
              <Text style={styles.badgeValue}>
                {Math.max(0, maxDailyDialogues - dialoguesUsedToday)} / {maxDailyDialogues}
              </Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeLabel}>Hazir Emir</Text>
              <Text style={styles.badgeValue}>{inventory.activeWarrants.length}</Text>
            </View>
          </View>
        </View>

        <Panel>
          <Text style={styles.sectionTitle}>Harita Akislari</Text>
          <View style={styles.actionsRow}>
            <PrimaryButton onPress={() => setNotesVisible(true)}>Notlari Ac</PrimaryButton>
            <PrimaryButton onPress={() => setInventoryVisible(true)}>Envanter</PrimaryButton>
          </View>
          <View style={styles.actionsRow}>
            <PrimaryButton onPress={() => setCondemnVisible(true)}>Mahkumu Sec</PrimaryButton>
            <PrimaryButton
              disabled={busyAction === "end-day"}
              onPress={handleEndDay}
            >
              {busyAction === "end-day" ? "Gun Kapanıyor..." : "Gunu Bitir"}
            </PrimaryButton>
          </View>
          {currentDay === 1 && timeOfDay < 4 ? (
            <PrimaryButton onPress={() => handleOpenLocation("crime_scene", "Cinayet Mahalli")}>
              Cinayet Mahalline Git
            </PrimaryButton>
          ) : null}
        </Panel>

        <Text style={styles.sectionTitle}>Lokasyonlar</Text>
        <View style={styles.cardList}>
          {locations.map((location) => (
            <Pressable
              key={location.id}
              onPress={() => handleOpenLocation(location.id, location.name)}
              style={({ pressed }) => [
                styles.locationCard,
                pressed && styles.locationCardPressed,
              ]}
            >
              <View style={styles.locationHead}>
                <Text style={styles.locationIcon}>{location.icon}</Text>
                <View style={styles.locationTitleWrap}>
                  <Text style={styles.locationName}>{location.name}</Text>
                  <Text style={styles.locationAction}>
                    {loadingLocationId === location.id ? "Hazirlaniyor..." : location.actionLabel}
                  </Text>
                </View>
              </View>
              <Text style={styles.locationDescription}>{location.description}</Text>
            </Pressable>
          ))}
        </View>

        <Panel>
          <Text style={styles.sectionTitle}>Durum Ozeti</Text>
          <Text style={styles.body}>Toplanan not uzunlugu: {notes.length}</Text>
          <Text style={styles.body}>Kullanilan arama emri: {inventory.usedWarrants.length}</Text>
          <Text style={styles.body}>
            Hakikat ifsasi: {truthReveal ? "Hazir" : "Henüz acilmadi"}
          </Text>
        </Panel>
      </Screen>

      <AppModal
        onClose={() => setNotesVisible(false)}
        subtitle="Buradaki notlar session ile senkron tutuluyor."
        title="Sorusturma Notlari"
        visible={notesVisible}
      >
        <TextInput
          multiline
          onChangeText={setNotesDraft}
          placeholder="Celiskileri, isimleri ve suphelerini yaz..."
          placeholderTextColor={colors.textMuted}
          style={styles.notesInput}
          textAlignVertical="top"
          value={notesDraft}
        />
        <PrimaryButton
          disabled={busyAction === "notes"}
          onPress={handleSaveNotes}
        >
          {busyAction === "notes" ? "Kaydediliyor..." : "Notlari Kaydet"}
        </PrimaryButton>
      </AppModal>

      <AppModal
        onClose={() => setInventoryVisible(false)}
        subtitle="Hazir ve kullanilmis izinleri burada gorebilirsin."
        title="Envanter"
        visible={inventoryVisible}
      >
        <ScrollView style={styles.modalScroll}>
          {inventory.activeWarrants.length === 0 && inventory.usedWarrants.length === 0 ? (
            <Text style={styles.body}>Henuz bir arama emri birikmedi.</Text>
          ) : null}
          {inventory.activeWarrants.map((warrant) => (
            <View key={`active-${warrant}`} style={styles.inventoryItem}>
              <Text style={styles.inventoryTitle}>Arama Izni</Text>
              <Text style={styles.inventoryMeta}>{warrant}</Text>
              <Text style={styles.inventoryStatus}>Hazir</Text>
            </View>
          ))}
          {inventory.usedWarrants.map((warrant) => (
            <View key={`used-${warrant}`} style={styles.inventoryItemMuted}>
              <Text style={styles.inventoryTitle}>Arama Izni</Text>
              <Text style={styles.inventoryMeta}>{warrant}</Text>
              <Text style={styles.inventoryStatusMuted}>Kullanildi</Text>
            </View>
          ))}
        </ScrollView>
      </AppModal>

      <AppModal
        onClose={() => setCondemnVisible(false)}
        subtitle="Bu secim hikayenin gidisatini kalici olarak etkiler."
        title="Mahkumu Sec"
        visible={condemnVisible}
      >
        <ScrollView style={styles.modalScroll}>
          <View style={styles.cardList}>
            {villagers.map((villager) => (
              <Pressable
                key={villager.id}
                onPress={() => handleCondemn(villager)}
                style={({ pressed }) => [
                  styles.villagerCard,
                  pressed && styles.locationCardPressed,
                ]}
              >
                <Text style={styles.locationIcon}>{villager.icon}</Text>
                <View style={styles.locationTitleWrap}>
                  <Text style={styles.locationName}>{villager.name}</Text>
                  <Text style={styles.locationAction}>{villager.role}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </AppModal>
    </>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.md,
  },
  heroText: {
    gap: spacing.xs,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.textMuted,
    lineHeight: 22,
  },
  badges: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  badge: {
    flex: 1,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.xs,
  },
  badgeLabel: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: "uppercase",
  },
  badgeValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  cardList: {
    gap: spacing.sm,
  },
  locationCard: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: spacing.md,
    gap: spacing.sm,
  },
  villagerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.panelMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: spacing.md,
    gap: spacing.md,
  },
  locationCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  locationHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  locationIcon: {
    fontSize: 28,
  },
  locationTitleWrap: {
    flex: 1,
    gap: 2,
  },
  locationName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  locationAction: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "600",
  },
  locationDescription: {
    color: colors.textMuted,
    lineHeight: 21,
  },
  body: {
    color: colors.textMuted,
    lineHeight: 22,
  },
  notesInput: {
    minHeight: 220,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panelMuted,
    color: colors.text,
    padding: spacing.md,
    lineHeight: 22,
  },
  modalScroll: {
    maxHeight: 420,
  },
  inventoryItem: {
    backgroundColor: colors.panelMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  inventoryItemMuted: {
    backgroundColor: "#161419",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.sm,
    opacity: 0.65,
  },
  inventoryTitle: {
    color: colors.text,
    fontWeight: "700",
  },
  inventoryMeta: {
    color: colors.textMuted,
  },
  inventoryStatus: {
    color: colors.success,
    fontWeight: "700",
  },
  inventoryStatusMuted: {
    color: colors.textMuted,
    fontWeight: "700",
  },
});
