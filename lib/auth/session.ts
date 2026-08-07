import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export interface AuthSessionUser {
  id: string;
  email: string;
  fullName: string;
  tenantId: string;
  tenantName?: string;
  createdAt: string;
}

const AUTH_SESSION_STORAGE_KEY = "maxsas.auth.session.user";

let cachedAuthUser: AuthSessionUser | null = null;
let isHydrated = false;
let hydratePromise: Promise<void> | null = null;
const listeners = new Set<(user: AuthSessionUser | null) => void>();

async function readStoredAuthUser(): Promise<AuthSessionUser | null> {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthSessionUser) : null;
    } catch {
      return null;
    }
  }

  try {
    const raw = await AsyncStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthSessionUser) : null;
  } catch {
    return null;
  }
}

async function writeStoredAuthUser(user: AuthSessionUser | null): Promise<void> {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      if (user) {
        window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(user));
      } else {
        window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
      }
    } catch {
      // Ignore storage failures on web.
    }
    return;
  }

  try {
    if (user) {
      await AsyncStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    }
  } catch {
    // Ignore storage failures on native.
  }
}

async function hydrateAuthSession(): Promise<void> {
  if (isHydrated) {
    return;
  }

  if (!hydratePromise) {
    hydratePromise = (async () => {
      cachedAuthUser = await readStoredAuthUser();
      isHydrated = true;
    })();
  }

  await hydratePromise;
}

function notifyListeners(): void {
  listeners.forEach((listener) => listener(cachedAuthUser));
}

export async function getCurrentTenantId(): Promise<string | null> {
  await hydrateAuthSession();
  return cachedAuthUser?.tenantId ?? null;
}

export function getCurrentTenantIdSync(): string | null {
  return cachedAuthUser?.tenantId ?? null;
}

export async function getCurrentAuthUser(): Promise<AuthSessionUser | null> {
  await hydrateAuthSession();
  return cachedAuthUser;
}

export function getCurrentAuthUserSync(): AuthSessionUser | null {
  return cachedAuthUser;
}

export async function setCurrentAuthUser(user: AuthSessionUser | null): Promise<void> {
  cachedAuthUser = user;
  isHydrated = true;
  await writeStoredAuthUser(user);
  notifyListeners();
}

export async function setCurrentTenantId(tenantId: string | null): Promise<void> {
  if (!tenantId) {
    await setCurrentAuthUser(null);
    return;
  }

  const currentUser = cachedAuthUser || (await getCurrentAuthUser());
  if (currentUser && currentUser.tenantId === tenantId) {
    await setCurrentAuthUser(currentUser);
    return;
  }

  await setCurrentAuthUser(
    currentUser
      ? { ...currentUser, tenantId }
      : {
          id: "",
          email: "",
          fullName: "",
          tenantId,
          createdAt: new Date().toISOString(),
        }
  );
}

export async function clearCurrentTenantId(): Promise<void> {
  await setCurrentAuthUser(null);
}

export async function clearCurrentAuthUser(): Promise<void> {
  await setCurrentAuthUser(null);
}

export function subscribeAuthSession(listener: (user: AuthSessionUser | null) => void): () => void {
  listeners.add(listener);

  void hydrateAuthSession().then(() => {
    listener(cachedAuthUser);
  });

  return () => {
    listeners.delete(listener);
  };
}

export async function bootstrapAuthSession(): Promise<string | null> {
  await hydrateAuthSession();
  return cachedAuthUser?.tenantId ?? null;
}