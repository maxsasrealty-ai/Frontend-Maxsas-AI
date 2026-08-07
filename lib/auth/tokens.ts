import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { resolveApiBaseUrl } from "../api/base-url";

const STORAGE_KEY = "maxsas.auth.tokens";

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt?: string | null;
}

let refreshInProgress: Promise<boolean> | null = null;

async function readStoredTokens(): Promise<StoredTokens | null> {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as StoredTokens) : null;
    } catch {
      return null;
    }
  }

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredTokens) : null;
  } catch {
    return null;
  }
}

async function writeStoredTokens(tokens: StoredTokens | null): Promise<void> {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      if (tokens) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
    return;
  }

  try {
    if (tokens) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export async function getAccessToken(): Promise<string | null> {
  const tokens = await readStoredTokens();
  return tokens?.accessToken ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  const tokens = await readStoredTokens();
  return tokens?.refreshToken ?? null;
}

export async function setTokens(tokens: StoredTokens | null): Promise<void> {
  await writeStoredTokens(tokens);
}

export async function clearTokens(): Promise<void> {
  await writeStoredTokens(null);
}

function timeout(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export async function refreshAccessToken(): Promise<boolean> {
  if (refreshInProgress) {
    return refreshInProgress;
  }

  let resolveFn: ((ok: boolean) => void) | null = null;

  refreshInProgress = new Promise<boolean>((resolve) => {
    resolveFn = resolve;
  });

  const finish = (ok: boolean) => {
    resolveFn?.(ok);
    refreshInProgress = null;
    return ok;
  };

  try {
    const tokens = await readStoredTokens();

    if (!tokens?.refreshToken) {
      return finish(false);
    }

    const base = resolveApiBaseUrl();
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 10000);

    try {
      const resp = await fetch(`${base}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        signal: controller.signal,
      });

      clearTimeout(id);

      if (!resp.ok) {
        await writeStoredTokens(null);
        return finish(false);
      }

      const parsed = await resp.json();

      if (parsed && parsed.success && parsed.data && parsed.data.accessToken) {
        const newTokens: StoredTokens = {
          accessToken: parsed.data.accessToken,
          refreshToken: parsed.data.refreshToken || tokens.refreshToken,
          expiresAt: parsed.data.expiresAt || null,
        };

        await writeStoredTokens(newTokens);
        return finish(true);
      }

      await writeStoredTokens(null);
      return finish(false);
    } finally {
      clearTimeout(id);
    }
  } catch {
    await timeout(300);
    return finish(false);
  }
}