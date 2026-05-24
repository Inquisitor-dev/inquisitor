import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";

import { PrimaryButton } from "@/components/PrimaryButton";
import {
  clearApiBaseUrlOverride,
  getApiBaseUrlConfig,
  setApiBaseUrlOverride,
} from "@/config/apiBaseUrl";
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
  const [savingApiTarget, setSavingApiTarget] = useState(false);
  const [apiStatus, setApiStatus] = useState<null | "ok" | "error">(null);
  const [apiBaseUrl, setApiBaseUrl] = useState(env.apiBaseUrl);
  const [apiBaseUrlInput, setApiBaseUrlInput] = useState(env.apiBaseUrl);
  const [apiBaseUrlSource, setApiBaseUrlSource] = useState<
    "env" | "fallback" | "override"
  >(env.apiBaseUrlSource as "env" | "fallback");

  useEffect(() => {
    let active = true;

    async function loadApiBaseUrl() {
      const config = await getApiBaseUrlConfig();

      if (!active) {
        return;
      }

      setApiBaseUrl(config.apiBaseUrl);
      setApiBaseUrlInput(config.apiBaseUrl);
      setApiBaseUrlSource(config.apiBaseUrlSource);
    }

    void loadApiBaseUrl();

    return () => {
      active = false;
    };
  }, []);

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
      Alert.alert("Backend reachable", `Connected to ${apiBaseUrl}`);
    } catch (error) {
      setApiStatus("error");
      Alert.alert(
        "Backend unreachable",
        `${apiBaseUrl}\n\n${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setCheckingApi(false);
    }
  };

  const handleSaveApiTarget = async () => {
    try {
      setSavingApiTarget(true);
      await setApiBaseUrlOverride(apiBaseUrlInput);
      const config = await getApiBaseUrlConfig();
      setApiBaseUrl(config.apiBaseUrl);
      setApiBaseUrlInput(config.apiBaseUrl);
      setApiBaseUrlSource(config.apiBaseUrlSource);
      setApiStatus(null);
      Alert.alert("API target saved", config.apiBaseUrl);
    } catch (error) {
      Alert.alert("Save failed", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setSavingApiTarget(false);
    }
  };

  const handleResetApiTarget = async () => {
    try {
      setSavingApiTarget(true);
      await clearApiBaseUrlOverride();
      const config = await getApiBaseUrlConfig();
      setApiBaseUrl(config.apiBaseUrl);
      setApiBaseUrlInput(config.apiBaseUrl);
      setApiBaseUrlSource(config.apiBaseUrlSource);
      setApiStatus(null);
      Alert.alert("API target reset", config.apiBaseUrl);
    } catch (error) {
      Alert.alert("Reset failed", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setSavingApiTarget(false);
    }
  };

  return (
    <View style={styles.main}>
      <View pointerEvents="none" style={styles.vignette} />
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Archive access</Text>
        <Text style={styles.title}>The Inquisitor</Text>
        <Text style={styles.body}>
          Ashenmoor'a donmeden once kayit dogrulamasi gerekiyor.
        </Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Engizisyon kaydina giris</Text>

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
