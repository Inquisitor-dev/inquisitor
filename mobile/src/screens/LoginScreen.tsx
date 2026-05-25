import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View, Pressable } from "react-native";

import { PrimaryButton } from "@/components/PrimaryButton";
import { api } from "@/services/api";
import { useGameStore } from "@/store/useGameStore";
import { inquisitorColors } from "@/theme/inquisitor";

export function LoginScreen() {
  const setUser = useGameStore((state) => state.setUser);
  const [authMode, setAuthMode] = useState<"login" | "signup" | "verify">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Eksik bilgi", "Lütfen email ve şifre girin.");
      return;
    }

    try {
      setLoading(true);
      const result = await api.login(email.trim(), password);
      setUser({
        ...result,
        email: result.email ?? email.trim(),
      });
    } catch (error) {
      Alert.alert("Giriş Başarısız", error instanceof Error ? error.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Eksik bilgi", "Lütfen email ve şifre girin.");
      return;
    }

    try {
      setLoading(true);
      const response = await api.sendCode(email.trim(), password);
      setAuthMode("verify");
      Alert.alert("Kod Bilgisi", response.message || "Lütfen e-postanıza gelen doğrulama kodunu girin.");
    } catch (error) {
      Alert.alert("Kayıt Başarısız", error instanceof Error ? error.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!email.trim() || !verifyCode.trim()) {
      Alert.alert("Eksik bilgi", "Lütfen doğrulama kodunu girin.");
      return;
    }

    try {
      setLoading(true);
      const result = await api.verify(email.trim(), verifyCode.trim());
      setUser({
        ...result,
        email: result.email ?? email.trim(),
      });
      Alert.alert("Kayıt Tamamlandı", "Başarıyla giriş yaptınız.");
    } catch (error) {
      Alert.alert("Doğrulama Başarısız", error instanceof Error ? error.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.main}>
      <View pointerEvents="none" style={styles.vignette} />
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Archive access</Text>
        <Text style={styles.title}>The Inquisitor</Text>
        <Text style={styles.body}>
          Ashenmoor'a dönmeden önce kayıt doğrulaması gerekiyor.
        </Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>
          {authMode === "login"
            ? "Engizisyon kaydına giriş"
            : authMode === "signup"
              ? "Yeni Kayıt Oluştur"
              : "E-posta Doğrulama"}
        </Text>

        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="E-mail"
          placeholderTextColor={inquisitorColors.dim}
          style={styles.input}
          value={email}
          editable={authMode !== "verify"}
        />

        {authMode !== "verify" && (
          <TextInput
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={inquisitorColors.dim}
            secureTextEntry
            style={styles.input}
            value={password}
          />
        )}

        {authMode === "verify" && (
          <TextInput
            onChangeText={setVerifyCode}
            placeholder="Doğrulama Kodu"
            placeholderTextColor={inquisitorColors.dim}
            keyboardType="number-pad"
            style={styles.input}
            value={verifyCode}
          />
        )}

        {authMode === "login" && (
          <>
            <PrimaryButton disabled={loading} onPress={handleLogin}>
              {loading ? "Giriş yapılıyor..." : "Open the case"}
            </PrimaryButton>
            <Pressable onPress={() => setAuthMode("signup")} style={styles.switchButton}>
              <Text style={styles.switchText}>Hesabın yok mu? Kayıt Ol</Text>
            </Pressable>
          </>
        )}

        {authMode === "signup" && (
          <>
            <PrimaryButton disabled={loading} onPress={handleSignup}>
              {loading ? "Kod gönderiliyor..." : "Kayıt Ol"}
            </PrimaryButton>
            <Pressable onPress={() => setAuthMode("login")} style={styles.switchButton}>
              <Text style={styles.switchText}>Zaten hesabın var mı? Giriş Yap</Text>
            </Pressable>
          </>
        )}

        {authMode === "verify" && (
          <>
            <PrimaryButton disabled={loading} onPress={handleVerify}>
              {loading ? "Doğrulanıyor..." : "Kodu Doğrula"}
            </PrimaryButton>
            <Pressable onPress={() => setAuthMode("signup")} style={styles.switchButton}>
              <Text style={styles.switchText}>Geri dön</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: inquisitorColors.bg,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  hero: {
    alignItems: "center",
    marginBottom: 28,
  },
  eyebrow: {
    color: inquisitorColors.muted,
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  title: {
    color: inquisitorColors.parchment,
    fontFamily: "serif",
    fontSize: 46,
    fontWeight: "800",
    marginBottom: 12,
  },
  body: {
    color: inquisitorColors.muted,
    fontSize: 15,
    textAlign: "center",
  },
  panel: {
    backgroundColor: "#0f0b09",
    borderWidth: 1,
    borderColor: "#3d342d",
    borderRadius: 4,
    padding: 20,
  },
  panelTitle: {
    color: inquisitorColors.parchment,
    fontFamily: "serif",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
  },
  input: {
    minHeight: 54,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(232, 220, 196, 0.1)",
    backgroundColor: "rgba(255,255,255,0.03)",
    color: inquisitorColors.parchment,
    paddingHorizontal: 14,
    marginBottom: 12,
    fontSize: 15,
  },
  switchButton: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 8,
  },
  switchText: {
    color: inquisitorColors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
});
