import { Platform } from "react-native";

function getFallbackBaseUrl() {
  if (Platform.OS === "android") {
    return "http://10.0.2.2:3001";
  }

  if (Platform.OS === "ios") {
    return "http://localhost:3001";
  }

  return "http://localhost:3001";
}

export const env = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? getFallbackBaseUrl(),
  apiBaseUrlSource: process.env.EXPO_PUBLIC_API_BASE_URL ? "env" : "fallback",
};
