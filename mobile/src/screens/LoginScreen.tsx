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
        <Text style={styles.eyebrow}>Expo mobile foundation</Text>
        <Text style={styles.title}>Bring the investigation into players' hands.</Text>
        <Text style={styles.body}>
          We are starting with the shared auth, session, and state architecture used by
          the web version, then adapting the experience for vertical touch play.
        </Text>
      </View>

      <Panel>
        <Text style={styles.panelTitle}>Sign in</Text>
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
        <PrimaryButton disabled={checkingApi} onPress={handleCheckApi}>
          {checkingApi ? "Checking backend..." : "Check backend connection"}
        </PrimaryButton>
        <PrimaryButton disabled={loading} onPress={handleLogin}>
          {loading ? "Signing in..." : "Open the case"}
        </PrimaryButton>
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: spacing.md,
    marginBottom: spacing.md,
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
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 38,
    marginBottom: spacing.sm,
  },
  body: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  panelTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: spacing.xs,
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
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panelMuted,
    color: colors.text,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
});
