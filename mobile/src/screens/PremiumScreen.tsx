import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "@/navigation/AppNavigator";
import { api } from "@/services/api";
import { useGameStore } from "@/store/useGameStore";
import { inquisitorColors } from "@/theme/inquisitor";

type Props = NativeStackScreenProps<RootStackParamList, "Premium">;

export function PremiumScreen({ navigation }: Props) {
  const { authToken, isPremium, setIsPremium } = useGameStore();
  const [activationCode, setActivationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleActivate = async () => {
    if (!activationCode.trim()) {
      setError("Aktivasyon kodunu girin.");
      return;
    }
    
    if (!authToken) {
      setError("Oturum acin.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Calling auth/activate-premium
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
        setIsPremium(true);
        setSuccess(true);
      } else {
        setError(data.message || "Aktivasyon basarisiz.");
      }
    } catch {
      setError("Sunucuya baglanilamadi.");
    } finally {
      setLoading(false);
    }
  };

  if (isPremium || success) {
    return (
      <View style={styles.main}>
        <View style={styles.card}>
          <Text style={styles.star}>⭐</Text>
          <Text style={styles.title}>PREMIUM AKTIF</Text>
          <Text style={styles.description}>
            Tebrikler! Artik tum premium ozelliklere erisebilirsiniz.
          </Text>
          <View style={styles.benefitsBox}>
            <Text style={styles.benefitText}>✓ Gunluk 100 diyalog hakki</Text>
            <Text style={styles.benefitText}>✓ Gunluk 5 sorusturma hakki</Text>
            <Text style={styles.benefitText}>✓ Sunuculara oncelikli erisim</Text>
            <Text style={styles.benefitText}>✓ Zorluk secimi (Orta & Zor)</Text>
            <Text style={styles.benefitText}>✓ Ek senaryolar (Modern & Cyberpunk)</Text>
          </View>
          <Pressable onPress={() => navigation.goBack()} style={styles.buttonPrimary}>
            <Text style={styles.buttonTextPrimary}>ANA SAYFAYA DON</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.main} contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.star}>⭐</Text>
          <Text style={styles.title}>PREMIUM UYELIK</Text>
          <Text style={styles.subtitle}>— Tam Engizisyon Yetkisi —</Text>
        </View>

        <View style={styles.benefitsBox}>
          <Text style={styles.benefitsTitle}>Premium Avantajlari</Text>
          <Text style={styles.benefitText}>⚡ Sunuculara oncelikli erisim</Text>
          <Text style={styles.benefitText}>🎯 Zorluk secimi (Orta & Zor modlar)</Text>
          <Text style={styles.benefitText}>🌍 Ek senaryolar (Modern Kasaba & Cyberpunk)</Text>
          <Text style={styles.benefitText}>💬 Gunluk 100 diyalog hakki (3x artis)</Text>
          <Text style={styles.benefitText}>🔍 Gunluk 5 sorusturma hakki (2.5x artis)</Text>
          <Text style={styles.benefitText}>👥 Ek NPC'ler (Ciftci & Doktor)</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>KART NUMARASI (AKTIVASYON KODU)</Text>
          <TextInput
            style={styles.input}
            placeholder="Aktivasyon kodunuzu girin"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={activationCode}
            onChangeText={setActivationCode}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.rowInputs}>
          <View style={styles.flex1}>
            <Text style={styles.inputLabel}>SON KULLANMA</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              placeholder="AA/YY"
              placeholderTextColor="rgba(255,255,255,0.3)"
              editable={false}
            />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.inputLabel}>CVV</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              placeholder="•••"
              placeholderTextColor="rgba(255,255,255,0.3)"
              editable={false}
            />
          </View>
        </View>

        <Pressable
          disabled={loading}
          onPress={handleActivate}
          style={({ pressed }) => [
            styles.buttonPrimary,
            loading && styles.buttonDisabled,
            pressed && !loading && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonTextPrimary}>
            {loading ? "ISLENIYOR..." : "PREMIUM'U AKTIFLESTIR"}
          </Text>
        </Pressable>

        <Pressable onPress={() => navigation.goBack()} style={styles.buttonSecondary}>
          <Text style={styles.buttonTextSecondary}>← Geri Don</Text>
        </Pressable>

        {error ? <Text style={styles.errorText}>⚠️ {error}</Text> : null}

        <Text style={styles.footerText}>
          🔒 Odeme bilgileriniz 256-bit SSL ile sifrelenmektedir.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: inquisitorColors.bg,
  },
  scrollContent: {
    padding: 24,
    flexGrow: 1,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "rgba(10,5,5,0.8)",
    borderWidth: 1,
    borderColor: "rgba(218,165,32,0.3)",
    padding: 32,
    borderRadius: 8,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  star: {
    fontSize: 40,
    marginBottom: 12,
    textAlign: "center",
  },
  title: {
    color: "#DAA520",
    fontSize: 22,
    letterSpacing: 4,
    textTransform: "uppercase",
    marginBottom: 8,
    fontFamily: "serif",
    textAlign: "center",
  },
  subtitle: {
    color: "#888",
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
    textAlign: "center",
  },
  description: {
    color: "#e5d9c5",
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: "center",
  },
  benefitsBox: {
    marginBottom: 32,
    padding: 20,
    backgroundColor: "rgba(218,165,32,0.03)",
    borderWidth: 1,
    borderColor: "rgba(218,165,32,0.15)",
    borderRadius: 4,
  },
  benefitsTitle: {
    color: "#DAA520",
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  benefitText: {
    color: "#aaa",
    fontSize: 14,
    lineHeight: 28,
  },
  inputGroup: {
    marginBottom: 16,
  },
  rowInputs: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  flex1: {
    flex: 1,
  },
  inputLabel: {
    color: "#666",
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    color: "#e5d9c5",
    padding: 14,
    fontSize: 16,
    borderRadius: 4,
  },
  disabledInput: {
    opacity: 0.4,
  },
  buttonPrimary: {
    backgroundColor: "#DAA520",
    padding: 16,
    borderRadius: 4,
    alignItems: "center",
  },
  buttonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 14,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 12,
  },
  buttonDisabled: {
    backgroundColor: "rgba(218,165,32,0.3)",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonTextPrimary: {
    color: "#000",
    fontWeight: "bold",
    letterSpacing: 2,
    fontSize: 14,
  },
  buttonTextSecondary: {
    color: "#666",
    letterSpacing: 1,
    fontSize: 13,
  },
  errorText: {
    marginTop: 16,
    padding: 10,
    backgroundColor: "rgba(138,3,3,0.15)",
    borderWidth: 1,
    borderColor: "rgba(138,3,3,0.4)",
    color: "#e07070",
    fontSize: 13,
    textAlign: "center",
  },
  footerText: {
    color: "#555",
    fontSize: 11,
    textAlign: "center",
    marginTop: 20,
  },
});
