import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";

import { Panel } from "@/components/Panel";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { env } from "@/config/env";
import { api } from "@/services/api";
import { useGameStore } from "@/store/useGameStore";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export function LoginScreen() {
  const setUser = useGameStore((state) => state.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingApi, setCheckingApi] = useState(false);
  const [apiStatus, setApiStatus] = useState<null | "ok" | "error">(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      const result = await api.login(email.trim(), password);
      setUser(result);
    } catch (error) {
      Alert.alert("Login failed", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckApi = async () => {
    try {
      setCheckingApi(true);
      await api.ping();
      setApiStatus("ok");
      Alert.alert("Backend reachable", `Connected to ${env.apiBaseUrl}`);
    } catch (error) {
      setApiStatus("error");
      Alert.alert(
        "Backend unreachable",
        `${env.apiBaseUrl}\n\n${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setCheckingApi(false);
    }
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Mobile dossier</Text>
        <Text style={styles.title}>The Inquisitor</Text>
        <Text style={styles.body}>
          Koyun ustune inen sessizligi yaracak kisi sensin. Giris yap, dosyayi ac ve
          hakikatin hangi evde saklandigini ortaya cikar.
        </Text>
        <View style={styles.heroCard}>
          <Text style={styles.heroCardLabel}>Field protocol</Text>
          <Text style={styles.heroCardText}>
            Mobil surum dikey oynanis icin yeniden kuruluyor. Bu build Expo Go uzerinde
            dogrudan case flow testine hazir.
          </Text>
        </View>
      </View>

      <Panel>
        <Text style={styles.panelEyebrow}>Archive access</Text>
        <Text style={styles.panelTitle}>Engizisyon kaydina giris</Text>
        <Text style={styles.apiHint}>
          API target: {env.apiBaseUrl} ({env.apiBaseUrlSource})
        </Text>
        {env.apiBaseUrlSource === "fallback" ? (
          <Text style={styles.warningText}>
            Physical device test icin bu adresi genelde `mobile/.env` icinde LAN IP ile
            override etmelisin.
          </Text>
        ) : null}
        <Text
          style={[
            styles.statusText,
            apiStatus === "ok" && styles.statusOk,
            apiStatus === "error" && styles.statusError,
          ]}
        >
          {apiStatus === "ok"
            ? "Backend status: reachable"
            : apiStatus === "error"
              ? "Backend status: unreachable"
              : "Backend status: not checked"}
        </Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="E-mail"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={email}
        />
        <TextInput
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          style={styles.input}
          value={password}
        />
        <PrimaryButton disabled={checkingApi} onPress={handleCheckApi} tone="secondary">
          {checkingApi ? "Checking backend..." : "Check backend connection"}
        </PrimaryButton>
        <PrimaryButton disabled={loading} onPress={handleLogin}>
          {loading ? "Signing in..." : "Open the case"}
        </PrimaryButton>
        <Text style={styles.footerNote}>
          Ilk hedefimiz hizli test degil, atmosferi kuvvetli bir mobil sorusturma hissi.
        </Text>
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: spacing.sm,
    marginBottom: spacing.md,
  },
  heroCard: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.accentSoft,
  },
  heroCardLabel: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  heroCardText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: 42,
    fontWeight: "800",
    lineHeight: 46,
    marginBottom: spacing.sm,
    fontFamily: "serif",
  },
  body: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  panelEyebrow: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  panelTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  apiHint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  warningText: {
    color: colors.accent,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  statusText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  statusOk: {
    color: colors.success,
  },
  statusError: {
    color: colors.accentStrong,
  },
  input: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panelMuted,
    color: colors.text,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    fontSize: 15,
  },
  footerNote: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
});
