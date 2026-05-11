import { Platform } from "react-native";

const fallbackBaseUrl =
  Platform.OS === "android" ? "http://10.0.2.2:3001" : "http://localhost:3001";

export const env = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? fallbackBaseUrl,
};
