import { makeRedirectUri } from "expo-auth-session";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

WebBrowser.maybeCompleteAuthSession();

export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ?? "";
export const GOOGLE_EXPO_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID?.trim() ?? "";
export const GOOGLE_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() ?? "";
export const GOOGLE_IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() ?? "";

export const GOOGLE_APP_SCHEME = "maxsasailivekit";

export type GooglePlatformTarget = "web" | "expo-go" | "android" | "ios";

export function getGooglePlatformTarget(): GooglePlatformTarget {
  if (Platform.OS === "web") {
    return "web";
  }

  if (Constants.appOwnership === "expo") {
    return "expo-go";
  }

  if (Platform.OS === "android") {
    return "android";
  }

  return "ios";
}

export function shouldUseGoogleProxy(): boolean {
  const target = getGooglePlatformTarget();
  return target === "web" || target === "expo-go";
}

export function getGoogleRedirectUri(): string {
  return makeRedirectUri({
    scheme: GOOGLE_APP_SCHEME,
    useProxy: shouldUseGoogleProxy(),
  });
}

export function getGoogleRequestConfig() {
  const target = getGooglePlatformTarget();

  const config: {
    expoClientId?: string;
    androidClientId?: string;
    iosClientId?: string;
    webClientId?: string;
    redirectUri: string;
    scopes: string[];
    selectAccount: boolean;
  } = {
    redirectUri: getGoogleRedirectUri(),
    scopes: ["openid", "email", "profile"],
    selectAccount: true,
  };

  if (target === "web") {
    if (GOOGLE_WEB_CLIENT_ID) {
      config.webClientId = GOOGLE_WEB_CLIENT_ID;
    }
    return config;
  }

  if (target === "expo-go") {
    if (GOOGLE_EXPO_CLIENT_ID) {
      config.expoClientId = GOOGLE_EXPO_CLIENT_ID;
    }
    return config;
  }

  if (target === "android") {
    if (GOOGLE_ANDROID_CLIENT_ID) {
      config.androidClientId = GOOGLE_ANDROID_CLIENT_ID;
    }
    return config;
  }

  if (GOOGLE_IOS_CLIENT_ID) {
    config.iosClientId = GOOGLE_IOS_CLIENT_ID;
  }

  return config;
}

export function hasGoogleClientConfig(): boolean {
  const target = getGooglePlatformTarget();

  switch (target) {
    case "web":
      return Boolean(GOOGLE_WEB_CLIENT_ID);
    case "expo-go":
      return Boolean(GOOGLE_EXPO_CLIENT_ID);
    case "android":
      return Boolean(GOOGLE_ANDROID_CLIENT_ID);
    case "ios":
      return Boolean(GOOGLE_IOS_CLIENT_ID);
    default:
      return false;
  }
}

export function getGoogleConfigErrorMessage(): string {
  const target = getGooglePlatformTarget();

  switch (target) {
    case "web":
      return "Google sign-in is not configured for web. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env.";
    case "expo-go":
      return "Google sign-in is not configured for Expo Go. Set EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID in .env.";
    case "android":
      return "Google sign-in is not configured for Android. Set EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID in .env.";
    case "ios":
      return "Google sign-in is not configured for iOS. Set EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID in .env.";
    default:
      return "Google sign-in is not configured for this platform.";
  }
}

export function extractGoogleIdToken(
  result:
    | {
        authentication?: { idToken?: string | null } | null;
        params?: Record<string, unknown>;
      }
    | null
    | undefined
): string | null {
  const params = result?.params as
    | { id_token?: string; idToken?: string }
    | undefined;

  return (
    result?.authentication?.idToken ??
    params?.id_token ??
    params?.idToken ??
    null
  );
}