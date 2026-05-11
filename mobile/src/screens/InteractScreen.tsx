import { useEffect, useMemo, useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AppModal } from "@/components/AppModal";
import { Panel } from "@/components/Panel";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { getNpcProfile } from "@/data/gameContent";
import type { RootStackParamList } from "@/navigation/AppNavigator";
import { api } from "@/services/api";
import { useGameStore } from "@/store/useGameStore";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import type { NpcMessage } from "@/types/game";

type Props = NativeStackScreenProps<RootStackParamList, "Interact">;

export function InteractScreen({ route }: Props) {
  const { locationId, locationName } = route.params;
  const {
    authToken,
    sessionId,
    dialoguesUsedToday,
    maxDailyDialogues,
    scenarioType,
    inventory,
    notes,
    setNotes,
    addWarrant,
    consumeWarrant,
    setDialoguesUsed,
    setCurrentDay,
  } = useGameStore();
  const [messages, setMessages] = useState<NpcMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState(notes);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesVisible, setNotesVisible] = useState(false);
  const [inventoryVisible, setInventoryVisible] = useState(false);
  const [isInvestigating, setIsInvestigating] = useState(locationId === "crime_scene");

  const profile = useMemo(
    () => getNpcProfile(scenarioType, locationId),
    [locationId, scenarioType],
  );
  const canInvestigate =
    locationId === "crime_scene" || inventory.activeWarrants.includes(locationId);
  const scenarioAccent =
    scenarioType === "modern"
      ? "#3d556b"
      : scenarioType === "cyberpunk"
        ? "#0d6f6a"
        : "#6a4a35";

  useEffect(() => {
    setNotesDraft(notes);
  }, [notes]);

  useEffect(() => {
    const bootstrap = async () => {
      if (!authToken || !sessionId) {
        setLoading(false);
        return;
      }

      try {
        const history = await api.getHistory(authToken, sessionId, locationId);
        setMessages(history.history ?? []);
        if (typeof history.dialoguesUsed === "number") {
          setDialoguesUsed(history.dialoguesUsed);
        }
        if (typeof history.currentDay === "number") {
          setCurrentDay(history.currentDay);
        }

        if (!history.history || history.history.length === 0) {
          if (isInvestigating) {
            setMessages([
              {
                role: "npc",
                text: `*[Mekan: ${locationName}] Cevreyi taramaya basladin. Gizli ayrintilari ortaya cikarmak icin spesifik sorular sor.*`,
              },
            ]);
          } else {
            const greeting = await api.interact(
              authToken,
              sessionId,
              locationId,
              "__NEW_DAY_GREETING__",
            );
            if (greeting.reply) {
              setMessages([{ role: "npc", text: greeting.reply }]);
            }
          }
        }
      } catch (error) {
        Alert.alert(
          "Conversation could not load",
          error instanceof Error ? error.message : "Unknown error",
        );
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, [authToken, isInvestigating, locationId, locationName, sessionId, setCurrentDay, setDialoguesUsed]);

  const handleSaveNotes = async () => {
    if (!authToken || !sessionId) {
      return;
    }

    try {
      setSavingNotes(true);
      await api.updateNotes(authToken, sessionId, notesDraft);
      setNotes(notesDraft);
      setNotesVisible(false);
    } catch (error) {
      Alert.alert(
        "Notlar kaydedilemedi",
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      setSavingNotes(false);
    }
  };

  const handleToggleInvestigation = async () => {
    if (!isInvestigating) {
      if (!canInvestigate) {
        Alert.alert(
          "Arama izni gerekli",
          "Bu mekani arastirmak icin once ilgili NPC'den arama izni almalisin.",
        );
        return;
      }

      setIsInvestigating(true);
      setMessages((prev) => [
        ...prev,
        {
          role: "npc",
          text: `*[Arastirma Modu] ${locationName} icin fiziksel izleri incelemeye basladin.*`,
        },
      ]);
      return;
    }

    if (locationId === "crime_scene") {
      setIsInvestigating(false);
      return;
    }

    Alert.alert(
      "Arastirmayi bitir",
      "Arastirmayi bitirmek mevcut arama iznini tuketecek. Devam etmek istiyor musun?",
      [
        { text: "Vazgec", style: "cancel" },
        {
          text: "Bitir",
          style: "destructive",
          onPress: async () => {
            if (!authToken || !sessionId) {
              return;
            }

            try {
              consumeWarrant(locationId);
              await api.consumeWarrant(authToken, sessionId, locationId);
              setIsInvestigating(false);
            } catch (error) {
              Alert.alert(
                "Arastirma kapanamadi",
                error instanceof Error ? error.message : "Unknown error",
              );
            }
          },
        },
      ],
    );
  };

  const handleSend = async () => {
    if (!draft.trim() || !authToken || !sessionId || sending) {
      return;
    }

    try {
      setSending(true);
      const playerMessage = draft.trim();
      setMessages((prev) => [...prev, { role: "player", text: playerMessage }]);
      setDraft("");

      const result = await api.interact(authToken, sessionId, locationId, playerMessage);
      if (typeof result.dialoguesUsed === "number") {
        setDialoguesUsed(result.dialoguesUsed);
      }
      if (result.grantedWarrants && result.grantedWarrants.length > 0) {
        result.grantedWarrants.forEach((warrant) => addWarrant(warrant));
        Alert.alert(
          "Arama izni alindi",
          `${result.grantedWarrants.join(", ")} icin yeni arama izni kazandin.`,
        );
      }
      if (result.reply) {
        setMessages((prev) => [...prev, { role: "npc", text: result.reply ?? "" }]);
      } else if (result.message) {
        setMessages((prev) => [...prev, { role: "npc", text: result.message ?? "" }]);
      }
    } catch (error) {
      Alert.alert(
        "Message failed",
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Sorgu odasi</Text>
        <Text style={styles.title}>{locationName}</Text>
        <Text style={styles.subtitle}>
          Kalan sorgu hakki: {Math.max(0, maxDailyDialogues - dialoguesUsedToday)} /{" "}
          {maxDailyDialogues}
        </Text>
      </View>

      <View style={[styles.sceneBanner, { borderColor: scenarioAccent }]}>
        <Text style={styles.sceneIcon}>{isInvestigating ? "👁" : profile.icon}</Text>
        <View style={styles.sceneCopy}>
          <Text style={styles.sceneTitle}>
            {isInvestigating ? "Fiziksel Cevre" : profile.name}
          </Text>
          <Text style={styles.sceneText}>
            {isInvestigating
              ? "Arastirma modunda nesnelere, izlere ve cevre detaylarina odaklan."
              : `${profile.role} ile yuruyen sorgu. Celiskileri ortaya cikarmak icin ayrintili sorular sor.`}
          </Text>
        </View>
      </View>

      <Panel>
        <Text style={styles.sectionTitle}>Saha Araclari</Text>
        <View style={styles.toolbarRow}>
          <PrimaryButton onPress={() => setNotesVisible(true)}>Notlar</PrimaryButton>
          <PrimaryButton onPress={() => setInventoryVisible(true)}>Envanter</PrimaryButton>
        </View>
        <View style={styles.toolbarRow}>
          <PrimaryButton onPress={handleToggleInvestigation}>
            {isInvestigating ? "Arastirmayi Bitir" : "Mekani Arastir"}
          </PrimaryButton>
        </View>
        {!canInvestigate && locationId !== "crime_scene" ? (
          <Text style={styles.hintText}>
            Bu alani arastirmak icin once yetkili NPC'den arama izni almalisin.
          </Text>
        ) : null}
      </Panel>

      <Panel>
        <Text style={styles.sectionTitle}>Konusma Akisi</Text>
        {loading ? <Text style={styles.body}>Gecmis konusmalar yukleniyor...</Text> : null}
        {!loading && messages.length === 0 ? (
          <Text style={styles.body}>Bu lokasyonda henuz kayitli bir diyalog yok.</Text>
        ) : null}
        <View style={styles.messageList}>
          {messages.map((item, index) => (
            <View
              key={`${index}-${item.role}`}
              style={[
                styles.messageBubble,
                item.role === "player" ? styles.playerBubble : styles.npcBubble,
              ]}
            >
              <Text style={styles.messageRole}>
                {item.role === "player"
                  ? "Inquisitor"
                  : isInvestigating
                    ? "Anlatici"
                    : locationName}
              </Text>
              <Text style={styles.messageText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </Panel>

      <Panel>
        <Text style={styles.sectionTitle}>Soru Gonder</Text>
        <TextInput
          multiline
          onChangeText={setDraft}
          placeholder="Celiskiyi zorlayacak sorunu yaz..."
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          textAlignVertical="top"
          value={draft}
        />
        <Text style={styles.characterCount}>{draft.length} / 200</Text>
        <PrimaryButton
          disabled={sending || dialoguesUsedToday >= maxDailyDialogues}
          onPress={handleSend}
        >
          {sending ? "Gonderiliyor..." : "Soruyu Gonder"}
        </PrimaryButton>
      </Panel>

      <AppModal
        title="Notlar"
        subtitle="Supheleri ve celiskileri burada saklayip session ile senkronlayabilirsin."
        visible={notesVisible}
        onClose={() => setNotesVisible(false)}
      >
        <TextInput
          multiline
          onChangeText={setNotesDraft}
          placeholder="Suphelileri, cizelgeleri ve dikkat ceken detaylari yaz..."
          placeholderTextColor={colors.textMuted}
          style={styles.notesInput}
          textAlignVertical="top"
          value={notesDraft}
        />
        <PrimaryButton disabled={savingNotes} onPress={handleSaveNotes}>
          {savingNotes ? "Kaydediliyor..." : "Notlari Kaydet"}
        </PrimaryButton>
      </AppModal>

      <AppModal
        title="Envanter"
        subtitle="Hazir izinleri takip edip arastirma modunu buradan planlayabilirsin."
        visible={inventoryVisible}
        onClose={() => setInventoryVisible(false)}
      >
        <View style={styles.messageList}>
          {inventory.activeWarrants.length === 0 && inventory.usedWarrants.length === 0 ? (
            <Text style={styles.body}>Henuz bir izin veya esya toplanmadi.</Text>
          ) : null}
          {inventory.activeWarrants.map((warrant) => (
            <View key={`active-${warrant}`} style={styles.inventoryCard}>
              <Text style={styles.inventoryLabel}>Arama Izni</Text>
              <Text style={styles.inventoryValue}>{warrant}</Text>
              <Text style={styles.inventoryStatus}>Hazir</Text>
            </View>
          ))}
          {inventory.usedWarrants.map((warrant) => (
            <View key={`used-${warrant}`} style={styles.inventoryCardMuted}>
              <Text style={styles.inventoryLabel}>Arama Izni</Text>
              <Text style={styles.inventoryValue}>{warrant}</Text>
              <Text style={styles.inventoryStatusMuted}>Kullanildi</Text>
            </View>
          ))}
        </View>
      </AppModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
  },
  eyebrow: {
    color: colors.accent,
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 1,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.textMuted,
  },
  sceneBanner: {
    flexDirection: "row",
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: 20,
    backgroundColor: colors.panel,
    padding: spacing.lg,
  },
  sceneIcon: {
    fontSize: 34,
  },
  sceneCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  sceneTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  sceneText: {
    color: colors.textMuted,
    lineHeight: 21,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  toolbarRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  hintText: {
    color: colors.accent,
    lineHeight: 21,
  },
  body: {
    color: colors.textMuted,
    lineHeight: 22,
  },
  messageList: {
    gap: spacing.sm,
  },
  messageBubble: {
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.xs,
  },
  playerBubble: {
    backgroundColor: colors.accentStrong,
  },
  npcBubble: {
    backgroundColor: colors.panelMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageRole: {
    color: colors.text,
    fontWeight: "700",
  },
  messageText: {
    color: colors.text,
    lineHeight: 22,
  },
  input: {
    minHeight: 140,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panelMuted,
    color: colors.text,
    padding: spacing.md,
    lineHeight: 22,
  },
  characterCount: {
    color: colors.textMuted,
    textAlign: "right",
    fontSize: 12,
  },
  notesInput: {
    minHeight: 240,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panelMuted,
    color: colors.text,
    padding: spacing.md,
    lineHeight: 22,
  },
  inventoryCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panelMuted,
    padding: spacing.md,
    gap: spacing.xs,
  },
  inventoryCardMuted: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#141218",
    padding: spacing.md,
    gap: spacing.xs,
    opacity: 0.6,
  },
  inventoryLabel: {
    color: colors.text,
    fontWeight: "700",
  },
  inventoryValue: {
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
