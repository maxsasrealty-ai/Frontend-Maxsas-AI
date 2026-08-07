import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

const DEMO_CALL_USED_STORAGE_KEY = "maxsas.lexus.early_access.demo_call_used";
const EARLY_ACCESS_RELEASE_AT = new Date("2026-07-01T00:00:00+05:30").getTime();

interface EarlyAccessContextValue {
  isEarlyAccessPhase: boolean;
  isStandardCallLocked: boolean;
  isDemoCallAvailable: boolean;
  demoCallUsed: boolean;
  markDemoCallUsed: () => Promise<void>;
}

const EarlyAccessContext = createContext<EarlyAccessContextValue | null>(null);

async function readStoredDemoCallUsed(): Promise<boolean> {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      return window.localStorage.getItem(DEMO_CALL_USED_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  }

  try {
    return (await AsyncStorage.getItem(DEMO_CALL_USED_STORAGE_KEY)) === "true";
  } catch {
    return false;
  }
}

async function writeStoredDemoCallUsed(value: boolean): Promise<void> {
  const storageValue = value ? "true" : "false";

  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      if (value) {
        window.localStorage.setItem(DEMO_CALL_USED_STORAGE_KEY, storageValue);
      } else {
        window.localStorage.removeItem(DEMO_CALL_USED_STORAGE_KEY);
      }
    } catch {
      // Ignore persistence failures.
    }
    return;
  }

  try {
    if (value) {
      await AsyncStorage.setItem(DEMO_CALL_USED_STORAGE_KEY, storageValue);
    } else {
      await AsyncStorage.removeItem(DEMO_CALL_USED_STORAGE_KEY);
    }
  } catch {
    // Ignore persistence failures.
  }
}

export function EarlyAccessProvider({ children }: { children: React.ReactNode }) {
  const [demoCallUsed, setDemoCallUsed] = useState(false);

  useEffect(() => {
    let mounted = true;

    void readStoredDemoCallUsed().then((stored) => {
      if (!mounted) {
        return;
      }

      setDemoCallUsed(stored);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const markDemoCallUsed = useCallback(async () => {
    setDemoCallUsed(true);
    await writeStoredDemoCallUsed(true);
  }, []);

  const value = useMemo<EarlyAccessContextValue>(() => {
    const isEarlyAccessPhase = Date.now() < EARLY_ACCESS_RELEASE_AT;

    return {
      isEarlyAccessPhase,
      isStandardCallLocked: isEarlyAccessPhase,
      isDemoCallAvailable: isEarlyAccessPhase && !demoCallUsed,
      demoCallUsed,
      markDemoCallUsed,
    };
  }, [demoCallUsed, markDemoCallUsed]);

  return <EarlyAccessContext.Provider value={value}>{children}</EarlyAccessContext.Provider>;
}

export function useEarlyAccess() {
  const context = useContext(EarlyAccessContext);

  if (!context) {
    return {
      isEarlyAccessPhase: true,
      isStandardCallLocked: true,
      isDemoCallAvailable: false,
      demoCallUsed: false,
      markDemoCallUsed: async () => {},
    } satisfies EarlyAccessContextValue;
  }

  return context;
}