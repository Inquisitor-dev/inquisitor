import { getDefaultApiBaseUrl } from "@/config/apiBaseUrl";

export const env = {
  apiBaseUrl: getDefaultApiBaseUrl(),
  apiBaseUrlSource: process.env.EXPO_PUBLIC_API_BASE_URL ? "env" : "fallback",
};
