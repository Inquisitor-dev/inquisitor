import { useEffect, useMemo, useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Alert,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AppModal } from "@/components/AppModal";
import {
  getLocationLabel,
  getScenarioNpcs,
  getVisibleLocations,
  timeLabels,
} from "@/data/gameContent";
import type { RootStackParamList } from "@/navigation/AppNavigator";
import { api } from "@/services/api";
import { useGameStore } from "@/store/useGameStore";
import {
  getMapAsset,
  getMapHotspots,
  getScenarioPlaceTitle,
  inquisitorColors,
} from "@/theme/inquisitor";
import type { NpcProfile } from "@/types/game";

type Props = NativeStackScreenProps<RootStackParamList, "Map">;

const MAP_WIDTH = 1200;
const MAP_HEIGHT = 1180;

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
    logout,
  } = useGameStore();

  const [notesDraft, setNotesDraft] = useState(notes);
  const [notesVisible, setNotesVisible] = useState(false);
  const [inventoryVisible, setInventoryVisible] = useState(false);
  const [condemnVisible, setCondemnVisible] = useState(false);
  const [loadingLocationId, setLoadingLocationId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<"none" | "end-day" | "notes">("none");
  const [isTimingOut, setIsTimingOut] = useState(false);

  useEffect(() => {
    setNotesDraft(notes);
  }, [notes]);

  useEffect(() => {
    const syncSession = async () => {
      if (!authToken || !sessionId) return;

      try {
        const data = await api.getSession(authToken, sessionId);
        if (data.scenarioType) setScenarioType(data.scenarioType);
        if (data.difficulty) setDifficulty(data.difficulty);
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
  }, [authToken, hydrateSession, sessionId, setDifficulty, setScenarioType, setWarrants]);

  useEffect(() => {
    const runTimeout = async () => {
      if (!authToken || !sessionId || isTimingOut) return;
      if (currentDay >= 4 && timeOfDay >= 4) {
        try {
          setIsTimingOut(true);
          const result = await api.timeoutSession(authToken, sessionId);
          navigation.replace("Result", {
            won: false,
            message: result.message,
            reason: "timeout",
          });
        } catch (error) {
          Alert.alert(
            "Session timeout failed",
            error instanceof Error ? error.message : "Unknown error",
          );
          setIsTimingOut(false);
        }
      }
    };

    void runTimeout();
  }, [authToken, currentDay, isTimingOut, navigation, sessionId, timeOfDay]);

  const locations = useMemo(
    () => getVisibleLocations(scenarioType, difficulty),
    [difficulty, scenarioType],
  );
  const hotspots = useMemo(
    () => getMapHotspots(scenarioType, difficulty),
    [difficulty, scenarioType],
  );
  const villagers = useMemo(
    () => getScenarioNpcs(scenarioType, difficulty),
    [difficulty, scenarioType],
  );
  const isNight = timeOfDay >= 4;

  const handleSaveNotes = async () => {
    if (!authToken || !sessionId) return;
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
    if (!authToken || !sessionId || isNight) return;

    try {
      setLoadingLocationId(locationId);
      await api.advanceTime(authToken, sessionId);
      setTimeOfDay(Math.min(4, timeOfDay + 1));
      setSelectedNpc(locationId);
      navigation.navigate("Interact", { locationId, locationName });
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
    if (!authToken || !sessionId) return;

    if (currentDay >= 4) {
      try {
        setBusyAction("end-day");
        const result = await api.timeoutSession(authToken, sessionId);
        navigation.replace("Result", {
          won: false,
          message: result.message,
          reason: "timeout",
        });
      } catch (error) {
        Alert.alert(
          "Timeout could not be completed",
          error instanceof Error ? error.message : "Unknown error",
        );
      } finally {
        setBusyAction("none");
      }
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
    if (!authToken || !sessionId) return;

    Alert.alert(
      "Engizisyon Hükmü",
      `${npc.name} isimli köylüyü ölüme mahkum etmek istediğine emin misin?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Onayla",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await api.condemn(authToken, sessionId, npc.id);
              if (result.session?.truthReveal) setTruthReveal(result.session.truthReveal);
              if (result.session?.locationClues) setLocationClues(result.session.locationClues);
              setCondemnVisible(false);
              navigation.replace("Result", {
                won: Boolean(result.won),
                message: result.message ?? "Karar uygulandi.",
              });
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
    <View style={styles.main}>
      <View pointerEvents="none" style={[styles.vignette, isNight && styles.nightVignette]} />

      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={logout}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backLabel}>Kaydet ve Çık</Text>
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.pageTitle}>{getScenarioPlaceTitle(scenarioType)}</Text>
          <Text style={styles.pageSub}>
            {timeLabels[timeOfDay]} — Gün {currentDay}
          </Text>
        </View>

        <View style={styles.sessionInfo}>
          <View style={styles.stats}>
            <View style={styles.sessionDot} />
            <Text style={styles.limitText}>
              Soru Hakkı: {maxDailyDialogues - dialoguesUsedToday <= 0 ? "0" : maxDailyDialogues - dialoguesUsedToday}/{maxDailyDialogues}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        horizontal
        bounces={false}
        contentContainerStyle={styles.mapScrollContent}
        showsHorizontalScrollIndicator={false}
      >
        <ImageBackground source={getMapAsset(scenarioType, timeOfDay)} style={styles.mapContainer}>
          {hotspots.map((spot) => {
            const location = locations.find((item) => item.id === spot.id);
            if (!location) return null;

            return (
              <Pressable
                key={spot.id}
                onPress={() => handleOpenLocation(location.id, location.name)}
                style={[
                  styles.hotspot,
                  {
                    top: `${spot.top}%`,
                    left: `${spot.left}%`,
                    width: `${spot.width}%`,
                    height: `${spot.height}%`,
                  },
                ]}
              >
                <View style={[styles.mapLabel, isNight && styles.mapLabelLocked]}>
                  <Text style={styles.mapLabelIcon}>{location.icon}</Text>
                  <Text style={styles.mapLabelText}>
                    {loadingLocationId === location.id ? "Gidiliyor..." : location.actionLabel}
                  </Text>
                  {!location || isNight ? (
                    <Text style={styles.lockedText}>({isNight ? "Gece" : "Kapalı"})</Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </ImageBackground>
      </ScrollView>

      <View style={styles.actionBar}>
        <Pressable style={styles.iconButton} onPress={() => setNotesVisible(true)}>
          <Text style={styles.actionIcon}>🗒️</Text>
          <Text style={styles.actionText}>Notlar</Text>
        </Pressable>

        <Pressable style={styles.iconButton} onPress={() => setInventoryVisible(true)}>
          <Text style={styles.actionIcon}>🎒</Text>
          <Text style={styles.actionText}>Envanter</Text>
        </Pressable>

        <Pressable style={styles.iconButton} onPress={() => setCondemnVisible(true)}>
          <Text style={[styles.actionIcon, styles.condemnIcon]}>⚖️</Text>
          <Text style={[styles.actionText, styles.condemnText]}>Mahkumu Seç</Text>
        </Pressable>

        {currentDay === 1 && !isNight ? (
          <Pressable
            style={styles.iconButton}
            onPress={() => handleOpenLocation("crime_scene", getLocationLabel(scenarioType, "crime_scene"))}
          >
            <Text style={styles.actionIcon}>🩸</Text>
            <Text style={styles.actionText}>Mahal</Text>
          </Pressable>
        ) : null}

        <Pressable
          disabled={busyAction === "end-day"}
          onPress={handleEndDay}
          style={styles.iconButton}
        >
          <Text style={styles.actionIcon}>🛌</Text>
          <Text style={styles.actionText}>
            {busyAction === "end-day" ? "..." : "Dinlen"}
          </Text>
        </Pressable>
      </View>

      <AppModal
        onClose={() => setNotesVisible(false)}
        subtitle="Gözlemlerini buraya not et."
        title="Soruşturma Notları"
        visible={notesVisible}
      >
        <TextInput
          multiline
          onChangeText={setNotesDraft}
          placeholder="Gözlemlerini buraya not et..."
          placeholderTextColor={inquisitorColors.dim}
          style={styles.notesInput}
          textAlignVertical="top"
          value={notesDraft}
        />
        <Pressable onPress={handleSaveNotes} style={styles.modalActionButton}>
          <Text style={styles.modalActionButtonText}>
            {busyAction === "notes" ? "Kaydediliyor..." : "Anladım"}
          </Text>
        </Pressable>
      </AppModal>

      <AppModal
        onClose={() => setInventoryVisible(false)}
        subtitle="Hazır ve kullanılmış izinler."
        title="Envanter"
        visible={inventoryVisible}
      >
        <ScrollView style={styles.modalScroll}>
          {inventory.activeWarrants.length === 0 && inventory.usedWarrants.length === 0 ? (
            <Text style={styles.emptyText}>Henüz bir eşyan yok.</Text>
          ) : null}
          {inventory.activeWarrants.map((warrant) => (
            <View key={`active-${warrant}`} style={styles.inventoryItem}>
              <Text style={styles.inventoryIcon}>📜</Text>
              <View style={styles.inventoryCopy}>
                <Text style={styles.inventoryName}>Arama İzni</Text>
                <Text style={styles.inventoryLocation}>
                  {getLocationLabel(scenarioType, warrant)}
                </Text>
              </View>
              <Text style={styles.inventoryStatus}>(Hazır)</Text>
            </View>
          ))}
          {inventory.usedWarrants.map((warrant) => (
            <View key={`used-${warrant}`} style={[styles.inventoryItem, styles.inventoryItemUsed]}>
              <Text style={styles.inventoryIcon}>📜</Text>
              <View style={styles.inventoryCopy}>
                <Text style={styles.inventoryName}>Arama İzni</Text>
                <Text style={[styles.inventoryLocation, styles.inventoryLocationUsed]}>
                  {getLocationLabel(scenarioType, warrant)}
                </Text>
              </View>
              <Text style={styles.inventoryStatusUsed}>(Kullanıldı)</Text>
            </View>
          ))}
        </ScrollView>
      </AppModal>

      <AppModal
        onClose={() => setCondemnVisible(false)}
        subtitle="Nihai kararın hikayenin sonunu belirleyecek."
        title="Hüküm Verilecek Kişiyi Seç"
        visible={condemnVisible}
      >
        <ScrollView style={styles.modalScroll}>
          {villagers.map((villager) => (
            <Pressable
              key={villager.id}
              onPress={() => handleCondemn(villager)}
              style={styles.villagerItem}
            >
              <Text style={styles.villagerIcon}>{villager.icon}</Text>
              <View style={styles.villagerInfo}>
                <Text style={styles.villagerName}>{villager.name}</Text>
                <Text style={styles.villagerRole}>{villager.role}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </AppModal>

      {truthReveal ? <View style={styles.hiddenTruthFlag} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: inquisitorColors.bg,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  nightVignette: {
    backgroundColor: "rgba(0,0,10,0.4)",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingTop: 16,
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: "rgba(0,0,0,0.92)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(138, 3, 3, 0.3)",
    alignItems: "center",
  },
  backBtn: {
    position: "absolute",
    left: 8,
    top: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  backArrow: {
    color: inquisitorColors.muted,
    fontSize: 12,
    marginRight: 4,
  },
  backLabel: {
    color: inquisitorColors.muted,
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerCenter: {
    alignItems: "center",
  },
  pageTitle: {
    color: inquisitorColors.parchment,
    fontFamily: "serif",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 1,
  },
  pageSub: {
    color: inquisitorColors.primary,
    fontSize: 11,
    fontWeight: "600",
    fontStyle: "italic",
  },
  sessionInfo: {
    position: "absolute",
    right: 8,
    top: 20,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
  },
  sessionDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 6,
    backgroundColor: inquisitorColors.primary,
  },
  limitText: {
    color: inquisitorColors.muted,
    fontSize: 8,
    textTransform: "uppercase",
  },
  mapScrollContent: {
    minWidth: "100%",
  },
  mapContainer: {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    justifyContent: "flex-end",
  },
  hotspot: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  mapLabel: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: "rgba(138, 3, 3, 0.9)",
    borderWidth: 1,
    borderColor: inquisitorColors.parchment,
  },
  mapLabelLocked: {
    backgroundColor: "rgba(10,5,5,0.9)",
    borderColor: "#333333",
  },
  mapLabelIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  mapLabelText: {
    color: inquisitorColors.parchment,
    fontFamily: "serif",
    fontSize: 10,
    fontWeight: "600",
  },
  lockedText: {
    color: inquisitorColors.primary,
    fontSize: 8,
    marginLeft: 6,
  },
  actionBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 74,
    zIndex: 100,
    backgroundColor: "rgba(5,5,5,0.98)",
    borderTopWidth: 1,
    borderTopColor: "rgba(138, 3, 3, 0.6)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingHorizontal: 4,
  },
  iconButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actionIcon: {
    fontSize: 20,
    color: inquisitorColors.parchment,
    marginBottom: 2,
  },
  actionText: {
    fontSize: 8,
    fontWeight: "600",
    textTransform: "uppercase",
    color: inquisitorColors.parchment,
    opacity: 0.8,
  },
  condemnIcon: {
    color: "#ff4d4d",
  },
  condemnText: {
    color: "#ff4d4d",
    opacity: 1,
    fontWeight: "700",
  },
  notesInput: {
    minHeight: 260,
    borderWidth: 1,
    borderColor: inquisitorColors.border,
    borderRadius: 4,
    backgroundColor: "transparent",
    color: inquisitorColors.parchment,
    padding: 12,
    fontSize: 15,
    lineHeight: 24,
  },
  modalActionButton: {
    backgroundColor: inquisitorColors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
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
  modalScroll: {
    maxHeight: 420,
  },
  emptyText: {
    color: inquisitorColors.muted,
    textAlign: "center",
  },
  inventoryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: inquisitorColors.primary,
  },
  inventoryItemUsed: {
    opacity: 0.6,
  },
  inventoryIcon: {
    fontSize: 20,
  },
  inventoryCopy: {
    flex: 1,
  },
  inventoryName: {
    color: inquisitorColors.parchment,
    fontWeight: "600",
  },
  inventoryLocation: {
    color: inquisitorColors.primary,
    fontSize: 12,
  },
  inventoryLocationUsed: {
    color: inquisitorColors.muted,
  },
  inventoryStatus: {
    color: inquisitorColors.muted,
    fontSize: 11,
  },
  inventoryStatusUsed: {
    color: inquisitorColors.muted,
    fontSize: 11,
  },
  villagerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#251f1b",
    borderWidth: 1,
    borderColor: "#3d342d",
    borderRadius: 6,
    padding: 16,
    marginBottom: 12,
  },
  villagerIcon: {
    fontSize: 28,
  },
  villagerInfo: {
    flex: 1,
  },
  villagerName: {
    color: inquisitorColors.parchment,
    fontFamily: "serif",
    fontSize: 16,
    fontWeight: "600",
  },
  villagerRole: {
    color: inquisitorColors.muted,
    fontSize: 12,
    fontStyle: "italic",
  },
  hiddenTruthFlag: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
});
