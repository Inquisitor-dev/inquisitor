import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const API_BASE_URL_OVERRIDE_KEY = "api_base_url_override";
const RENDER_API_BASE_URL = "https://the-inquisitor-backend.onrender.com";

function getFallbackBaseUrl() {
  if (Platform.OS === "android") {
    return RENDER_API_BASE_URL;
  }

  if (Platform.OS === "ios") {
    return RENDER_API_BASE_URL;
  }

  return RENDER_API_BASE_URL;
}

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

export function getDefaultApiBaseUrl() {
  return process.env.EXPO_PUBLIC_API_BASE_URL ?? getFallbackBaseUrl();
}

export async function getApiBaseUrlConfig() {
  const override = await AsyncStorage.getItem(API_BASE_URL_OVERRIDE_KEY);

  if (override?.trim()) {
    return {
      apiBaseUrl: normalizeBaseUrl(override),
      apiBaseUrlSource: "override" as const,
    };
  }

  const envValue = process.env.EXPO_PUBLIC_API_BASE_URL;

  return {
    apiBaseUrl: normalizeBaseUrl(envValue ?? getFallbackBaseUrl()),
    apiBaseUrlSource: envValue ? ("env" as const) : ("fallback" as const),
  };
}

export async function getApiBaseUrl() {
  const config = await getApiBaseUrlConfig();
  return config.apiBaseUrl;
}

export async function setApiBaseUrlOverride(value: string) {
  const normalized = normalizeBaseUrl(value);

  if (!normalized) {
    await AsyncStorage.removeItem(API_BASE_URL_OVERRIDE_KEY);
    return;
  }

  await AsyncStorage.setItem(API_BASE_URL_OVERRIDE_KEY, normalized);
}

export async function clearApiBaseUrlOverride() {
  await AsyncStorage.removeItem(API_BASE_URL_OVERRIDE_KEY);
}
