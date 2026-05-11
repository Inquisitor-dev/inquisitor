import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";

import { PrimaryButton } from "@/components/PrimaryButton";
import { env } from "@/config/env";
import { api } from "@/services/api";
import { useGameStore } from "@/store/useGameStore";
import { inquisitorColors } from "@/theme/inquisitor";

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
      setUser({
        ...result,
        email: result.email ?? email.trim(),
      });
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
        <Text style={styles.panelTitle}>Engizisyon kaydına giriş</Text>
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
          placeholderTextColor={inquisitorColors.dim}
          style={styles.input}
          value={email}
        />
        <TextInput
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={inquisitorColors.dim}
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
  apiHint: {
    color: inquisitorColors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 6,
  },
  warningText: {
    color: inquisitorColors.primary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 6,
  },
  statusText: {
    color: inquisitorColors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  statusOk: {
    color: "#7aba7a",
  },
  statusError: {
    color: "#cc4444",
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
});
