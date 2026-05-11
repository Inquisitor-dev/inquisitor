import { useEffect, useMemo, useRef, useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Alert,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppModal } from "@/components/AppModal";
import { getLocationLabel, getNpcProfile } from "@/data/gameContent";
import type { RootStackParamList } from "@/navigation/AppNavigator";
import { api } from "@/services/api";
import { useGameStore } from "@/store/useGameStore";
import { getInteractAsset, inquisitorColors } from "@/theme/inquisitor";
import type { NpcMessage } from "@/types/game";

type Props = NativeStackScreenProps<RootStackParamList, "Interact">;

export function InteractScreen({ navigation, route }: Props) {
  const { locationId } = route.params;
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
    setTruthReveal,
    setLocationClues,
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
  const messageScrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const topInset =
    Platform.OS === "android"
      ? Math.max(insets.top, NativeStatusBar.currentHeight ?? 0)
      : insets.top;
  const bottomInset = Math.max(insets.bottom, 18);

  const profile = useMemo(
    () => getNpcProfile(scenarioType, locationId),
    [locationId, scenarioType],
  );
  const canInvestigate =
    locationId === "crime_scene" || inventory.activeWarrants.includes(locationId);

  useEffect(() => {
    setNotesDraft(notes);
  }, [notes]);

  useEffect(() => {
    const timer = setTimeout(() => {
      messageScrollRef.current?.scrollToEnd({ animated: true });
    }, 60);
    return () => clearTimeout(timer);
  }, [loading, messages]);

  useEffect(() => {
    const bootstrap = async () => {
      if (!authToken || !sessionId) {
        setLoading(false);
        return;
      }

      try {
        const history = await api.getHistory(authToken, sessionId, locationId);
        setMessages(history.history ?? []);
        if (typeof history.dialoguesUsed === "number") setDialoguesUsed(history.dialoguesUsed);
        if (typeof history.currentDay === "number") setCurrentDay(history.currentDay);

        if (!history.history || history.history.length === 0) {
          if (isInvestigating) {
            setMessages([
              {
                role: "npc",
                text: `*[Mekan: ${profile.name}] Etrafı araştırmaya başlıyorsunuz. Sadece detaylara odaklanın...*`,
              },
            ]);
          } else {
            setMessages([
              {
                role: "npc",
                text: `*${profile.name} size şüpheyle bakıyor.*\n\n"Buraya neden geldiniz?"`,
              },
            ]);
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
  }, [authToken, isInvestigating, locationId, profile.name, sessionId, setCurrentDay, setDialoguesUsed]);

  const handleSaveNotes = async () => {
    if (!authToken || !sessionId) return;

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
        Alert.alert("Arama izni gerekli", "Önce arama izni almalısın.");
        return;
      }

      setIsInvestigating(true);
      setMessages((prev) => [
        ...prev,
        {
          role: "npc",
          text: `*[Araştırma Modu] ${profile.name} için fiziksel izleri incelemeye başladın.*`,
        },
      ]);
      return;
    }

    if (locationId === "crime_scene") {
      setIsInvestigating(false);
      return;
    }

    Alert.alert("Araştırmayı bitir", "Bu izin tüketilecek. Emin misin?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Bitir",
        style: "destructive",
        onPress: async () => {
          if (!authToken || !sessionId) return;
          try {
            consumeWarrant(locationId);
            await api.consumeWarrant(authToken, sessionId, locationId);
            setIsInvestigating(false);
          } catch (error) {
            Alert.alert(
              "Araştırma kapanamadı",
              error instanceof Error ? error.message : "Unknown error",
            );
          }
        },
      },
    ]);
  };

  const handleSend = async () => {
    if (!draft.trim() || !authToken || !sessionId || sending) return;

    try {
      setSending(true);
      const playerMessage = draft.trim();
      setMessages((prev) => [...prev, { role: "player", text: playerMessage }]);
      setDraft("");

      const result = await api.interact(authToken, sessionId, locationId, playerMessage);
      if (typeof result.dialoguesUsed === "number") setDialoguesUsed(result.dialoguesUsed);

      if (result.grantedWarrants?.length) {
        result.grantedWarrants.forEach((warrant) => addWarrant(warrant));
        Alert.alert(
          "Arama izni alındı",
          result.grantedWarrants
            .map((warrant) => getLocationLabel(scenarioType, warrant))
            .join(", "),
        );
      }

      const replyText = result.reply ?? result.message;
      if (replyText) {
        setMessages((prev) => [...prev, { role: "npc", text: replyText }]);
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

  const handleCondemnCurrent = () => {
    if (!authToken || !sessionId || locationId === "crime_scene") return;

    Alert.alert("Nihai Hüküm", `${profile.name} için hüküm vermek istiyor musun?`, [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Mahkum et",
        style: "destructive",
        onPress: async () => {
          try {
            const result = await api.condemn(authToken, sessionId, locationId);
            if (result.session?.truthReveal) setTruthReveal(result.session.truthReveal);
            if (result.session?.locationClues) setLocationClues(result.session.locationClues);
            navigation.replace("Result", {
              won: Boolean(result.won),
              message: result.message ?? "Karar uygulandı.",
            });
          } catch (error) {
            Alert.alert(
              "Hüküm verilemedi",
              error instanceof Error ? error.message : "Unknown error",
            );
          }
        },
      },
    ]);
  };

  return (
    <ImageBackground source={getInteractAsset(locationId)} style={styles.main}>
      <View style={styles.overlay} />

      <View style={[styles.header, { paddingTop: topInset + 10 }]}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Haritaya Dön</Text>
        </Pressable>

        <View style={styles.npcInfo}>
          <Text style={styles.npcIcon}>{isInvestigating ? "👁️" : profile.icon}</Text>
          <View>
            <Text style={styles.npcName}>
              {isInvestigating ? "Fiziksel Çevre" : profile.name}
            </Text>
            <Text style={styles.npcTitle}>
              {isInvestigating ? "Etrafınızdaki Dünya" : profile.role}
            </Text>
          </View>
        </View>

        <Text style={styles.quota}>
          Bugün kalan sorgu hakkınız: {Math.max(0, maxDailyDialogues - dialoguesUsedToday)}
        </Text>
      </View>

      <View style={styles.chatColumn}>
        <ScrollView
          ref={messageScrollRef}
          style={styles.messages}
          contentContainerStyle={[
            styles.messageContent,
            { paddingBottom: bottomInset + 12 },
          ]}
        >
          {messages.map((msg, index) => (
            <View
              key={`${index}-${msg.role}`}
              style={[styles.bubble, msg.role === "player" ? styles.playerBubbleWrap : styles.npcBubbleWrap]}
            >
              <Text style={styles.bubbleLabel}>
                {msg.role === "player" ? "Inquisitor" : isInvestigating ? "Anlatıcı" : profile.name}
              </Text>
              <View style={[styles.bubbleBox, msg.role === "player" ? styles.playerBubble : styles.npcBubble]}>
                <Text style={styles.bubbleText}>{msg.text}</Text>
              </View>
            </View>
          ))}

          {loading ? (
            <View style={[styles.bubble, styles.npcBubbleWrap]}>
              <Text style={styles.bubbleLabel}>{isInvestigating ? "Anlatıcı" : profile.name}</Text>
              <View style={[styles.bubbleBox, styles.npcBubble]}>
                <Text style={styles.typingDots}>...</Text>
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.mobileToolbar}>
          <Pressable style={styles.toolBtn} onPress={() => setNotesVisible(true)}>
            <Text style={styles.toolIcon}>📝</Text>
            <Text style={styles.toolLabel}>Notlar</Text>
          </Pressable>
          <Pressable style={styles.toolBtn} onPress={() => setInventoryVisible(true)}>
            <Text style={styles.toolIcon}>📜</Text>
            <Text style={styles.toolLabel}>Envanter</Text>
          </Pressable>
          <Pressable
            disabled={!isInvestigating && !canInvestigate}
            onPress={handleToggleInvestigation}
            style={[styles.toolBtn, (isInvestigating || canInvestigate) && styles.activeToolBtn]}
          >
            <Text style={styles.toolIcon}>{isInvestigating ? "⏹️" : "🔍"}</Text>
            <Text style={styles.toolLabel}>{isInvestigating ? "Bitir" : "Mekanı Araştır"}</Text>
          </Pressable>
          {!isInvestigating && locationId !== "crime_scene" ? (
            <Pressable style={[styles.toolBtn, styles.condemnToolBtn]} onPress={handleCondemnCurrent}>
              <Text style={styles.toolIcon}>⚖️</Text>
              <Text style={[styles.toolLabel, styles.condemnToolLabel]}>Hüküm Ver</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={[styles.inputArea, { paddingBottom: bottomInset + 16 }]}>
          {dialoguesUsedToday >= maxDailyDialogues ? (
            <Text style={styles.limitReached}>Günlük sınırınıza ulaştınız.</Text>
          ) : (
            <>
              <TextInput
                multiline
                onChangeText={(value) => setDraft(value.slice(0, 200))}
                placeholder="Sorunuzu sorun..."
                placeholderTextColor={inquisitorColors.dim}
                style={styles.textarea}
                value={draft}
              />
              <Text
                style={[
                  styles.characterCount,
                  draft.length >= 200 && styles.characterCountDanger,
                ]}
              >
                {draft.length}/200
              </Text>
              <Pressable
                disabled={sending || !draft.trim()}
                onPress={handleSend}
                style={[styles.sendButton, (sending || !draft.trim()) && styles.sendButtonDisabled]}
              >
                <Text style={styles.sendButtonText}>Gönder</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>

      <AppModal
        title="Engizisyoncunun Notları"
        subtitle="Şüpheli davranışları buraya not et."
        visible={notesVisible}
        onClose={() => setNotesVisible(false)}
      >
        <TextInput
          multiline
          onChangeText={setNotesDraft}
          placeholder="Şüpheli davranışları, çelişkileri ve analizlerini yaz..."
          placeholderTextColor={inquisitorColors.dim}
          style={styles.notesInput}
          textAlignVertical="top"
          value={notesDraft}
        />
        <Pressable onPress={handleSaveNotes} style={styles.modalActionButton}>
          <Text style={styles.modalActionButtonText}>
            {savingNotes ? "Kaydediliyor..." : "Anladım"}
          </Text>
        </Pressable>
      </AppModal>

      <AppModal
        title="Envanter"
        subtitle="Hazır ve kullanılmış izinler."
        visible={inventoryVisible}
        onClose={() => setInventoryVisible(false)}
      >
        <ScrollView>
          {inventory.activeWarrants.length === 0 && inventory.usedWarrants.length === 0 ? (
            <Text style={styles.emptyText}>Henüz bir eşyan yok.</Text>
          ) : null}
          {inventory.activeWarrants.map((warrant) => (
            <View key={`active-${warrant}`} style={styles.inventoryItem}>
              <Text style={styles.inventoryIcon}>📜</Text>
              <View style={styles.inventoryTextWrap}>
                <Text style={styles.inventoryName}>Arama İzni</Text>
                <Text style={styles.inventoryLocation}>{getLocationLabel(scenarioType, warrant)}</Text>
              </View>
              <Text style={styles.inventoryStatus}>(Hazır)</Text>
            </View>
          ))}
          {inventory.usedWarrants.map((warrant) => (
            <View key={`used-${warrant}`} style={[styles.inventoryItem, styles.inventoryItemUsed]}>
              <Text style={styles.inventoryIcon}>📜</Text>
              <View style={styles.inventoryTextWrap}>
                <Text style={styles.inventoryName}>Arama İzni</Text>
                <Text style={[styles.inventoryLocation, styles.inventoryLocationUsed]}>
                  {getLocationLabel(scenarioType, warrant)}
                </Text>
              </View>
              <Text style={styles.inventoryStatus}>(Kullanıldı)</Text>
            </View>
          ))}
        </ScrollView>
      </AppModal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: inquisitorColors.bg,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  header: {
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(232, 220, 196, 0.1)",
    zIndex: 2,
  },
  back: {
    color: inquisitorColors.muted,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  npcInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  npcIcon: {
    fontSize: 30,
    marginRight: 10,
  },
  npcName: {
    color: inquisitorColors.parchment,
    fontFamily: "serif",
    fontSize: 18,
    fontWeight: "700",
  },
  npcTitle: {
    color: inquisitorColors.muted,
    fontSize: 11,
    fontStyle: "italic",
  },
  quota: {
    color: inquisitorColors.muted,
    fontSize: 10,
    textAlign: "center",
  },
  chatColumn: {
    flex: 1,
    zIndex: 2,
  },
  messages: {
    flex: 1,
  },
  messageContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  bubble: {
    marginBottom: 16,
    maxWidth: "92%",
  },
  playerBubbleWrap: {
    alignSelf: "flex-end",
  },
  npcBubbleWrap: {
    alignSelf: "flex-start",
  },
  bubbleLabel: {
    color: inquisitorColors.muted,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  bubbleBox: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  playerBubble: {
    backgroundColor: inquisitorColors.primary,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
  },
  npcBubble: {
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "rgba(232,220,196,0.1)",
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderBottomLeftRadius: 8,
  },
  bubbleText: {
    color: inquisitorColors.parchment,
    fontSize: 15,
    lineHeight: 26,
  },
  typingDots: {
    color: inquisitorColors.muted,
    fontSize: 20,
    letterSpacing: 2,
  },
  mobileToolbar: {
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(5,5,5,0.95)",
    borderTopWidth: 1,
    borderTopColor: "rgba(138, 3, 3, 0.3)",
  },
  toolBtn: {
    minWidth: 72,
    marginHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  activeToolBtn: {
    borderColor: inquisitorColors.primary,
    backgroundColor: "rgba(138,3,3,0.15)",
  },
  condemnToolBtn: {
    borderColor: "rgba(138,3,3,0.6)",
    backgroundColor: "rgba(138,3,3,0.25)",
  },
  toolIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  toolLabel: {
    color: inquisitorColors.muted,
    fontSize: 9,
    textAlign: "center",
  },
  condemnToolLabel: {
    color: inquisitorColors.parchment,
    fontWeight: "600",
  },
  inputArea: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    backgroundColor: "rgba(17,17,17,0.82)",
    borderTopWidth: 1,
    borderTopColor: "rgba(232,220,196,0.1)",
  },
  textarea: {
    minHeight: 86,
    borderWidth: 1,
    borderColor: "rgba(232,220,196,0.1)",
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.03)",
    color: inquisitorColors.parchment,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    lineHeight: 22,
  },
  characterCount: {
    color: "#555555",
    fontSize: 11,
    textAlign: "right",
    marginTop: 4,
    marginBottom: 6,
  },
  characterCountDanger: {
    color: inquisitorColors.primary,
  },
  sendButton: {
    alignSelf: "flex-end",
    width: 96,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: inquisitorColors.primary,
    borderRadius: 4,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    color: inquisitorColors.parchment,
    fontFamily: "serif",
    fontSize: 16,
    fontWeight: "600",
  },
  limitReached: {
    color: inquisitorColors.primary,
    textAlign: "center",
    fontStyle: "italic",
  },
  notesInput: {
    minHeight: 320,
    borderWidth: 1,
    borderColor: inquisitorColors.border,
    borderRadius: 4,
    color: inquisitorColors.parchment,
    padding: 12,
    fontSize: 16,
    lineHeight: 28,
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
  emptyText: {
    color: inquisitorColors.muted,
    textAlign: "center",
  },
  inventoryItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: inquisitorColors.primary,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 4,
    marginBottom: 12,
  },
  inventoryItemUsed: {
    opacity: 0.6,
  },
  inventoryIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  inventoryTextWrap: {
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
});
