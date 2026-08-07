import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

import { LEXUS_THEME, LexusThemeColors, LexusThemeMode, PRESTIGE_THEME, ThemePlan } from "../components/lexus/theme";

interface LexusThemeContextValue {
  mode: LexusThemeMode;
  plan: ThemePlan;
  colors: LexusThemeColors;
  isDark: boolean;
  setMode: (mode: LexusThemeMode) => Promise<void>;
  toggleMode: () => Promise<void>;
  setPlan: (plan: ThemePlan) => Promise<void>;
  callDurationLimit: number | null;
  callDurationLimitEnabled: boolean | null;
  setCallDurationLimit: (limit: number | null) => Promise<void>;
  setCallDurationLimitEnabled: (enabled: boolean | null) => Promise<void>;
}

const STORAGE_KEY = "maxsas.lexus.theme.mode";
const PLAN_STORAGE_KEY = "maxsas.lexus.theme.plan";

const FALLBACK_THEME_VALUE: LexusThemeContextValue = {
  mode: "dark",
  plan: "lexus",
  colors: LEXUS_THEME.dark,
  isDark: true,
  setMode: async () => {},
  toggleMode: async () => {},
  setPlan: async () => {},
  callDurationLimit: null,
  callDurationLimitEnabled: null,
  setCallDurationLimit: async () => {},
  setCallDurationLimitEnabled: async () => {},
};

const LexusThemeContext = createContext<LexusThemeContextValue | null>(null);

const DURATION_LIMIT_STORAGE_KEY = "maxsas.lexus.theme.duration_limit";
const DURATION_LIMIT_ENABLED_STORAGE_KEY = "maxsas.lexus.theme.duration_limit_enabled";

async function readStoredMode(): Promise<LexusThemeMode | null> {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw === "light" || raw === "dark") {
        return raw;
      }
      return null;
    } catch {
      return null;
    }
  }

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === "light" || raw === "dark") {
      return raw;
    }
    return null;
  } catch {
    return null;
  }
}

async function writeStoredMode(mode: LexusThemeMode): Promise<void> {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Ignore persistence failures.
    }
    return;
  }

  try {
    await AsyncStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Ignore persistence failures.
  }
}

async function readStoredPlan(): Promise<ThemePlan | null> {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(PLAN_STORAGE_KEY);
      if (raw === "lexus" || raw === "prestige") {
        return raw;
      }
      return null;
    } catch {
      return null;
    }
  }

  try {
    const raw = await AsyncStorage.getItem(PLAN_STORAGE_KEY);
    if (raw === "lexus" || raw === "prestige") {
      return raw;
    }
    return null;
  } catch {
    return null;
  }
}

async function writeStoredPlan(plan: ThemePlan): Promise<void> {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      window.localStorage.setItem(PLAN_STORAGE_KEY, plan);
    } catch {
      // Ignore persistence failures.
    }
    return;
  }

  try {
    await AsyncStorage.setItem(PLAN_STORAGE_KEY, plan);
  } catch {
    // Ignore persistence failures.
  }
}

async function readStoredDurationLimit(): Promise<number | null> {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(DURATION_LIMIT_STORAGE_KEY);
      if (raw) return parseInt(raw, 10);
      return null;
    } catch {
      return null;
    }
  }

  try {
    const raw = await AsyncStorage.getItem(DURATION_LIMIT_STORAGE_KEY);
    if (raw) return parseInt(raw, 10);
    return null;
  } catch {
    return null;
  }
}

async function writeStoredDurationLimit(limit: number | null): Promise<void> {
  const value = limit !== null ? limit.toString() : "";
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      if (limit === null) window.localStorage.removeItem(DURATION_LIMIT_STORAGE_KEY);
      else window.localStorage.setItem(DURATION_LIMIT_STORAGE_KEY, value);
    } catch {
      // Ignore persistence failures.
    }
    return;
  }

  try {
    if (limit === null) await AsyncStorage.removeItem(DURATION_LIMIT_STORAGE_KEY);
    else await AsyncStorage.setItem(DURATION_LIMIT_STORAGE_KEY, value);
  } catch {
    // Ignore persistence failures.
  }
}

async function readStoredDurationLimitEnabled(): Promise<boolean | null> {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(DURATION_LIMIT_ENABLED_STORAGE_KEY);
      if (raw === null) return null;
      return raw === "true";
    } catch {
      return null;
    }
  }

  try {
    const raw = await AsyncStorage.getItem(DURATION_LIMIT_ENABLED_STORAGE_KEY);
    if (raw === null) return null;
    return raw === "true";
  } catch {
    return null;
  }
}

async function writeStoredDurationLimitEnabled(enabled: boolean | null): Promise<void> {
  const value = enabled === null ? "" : enabled ? "true" : "false";
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      if (enabled === null) window.localStorage.removeItem(DURATION_LIMIT_ENABLED_STORAGE_KEY);
      else window.localStorage.setItem(DURATION_LIMIT_ENABLED_STORAGE_KEY, value);
    } catch {
      // Ignore persistence failures.
    }
    return;
  }

  try {
    if (enabled === null) await AsyncStorage.removeItem(DURATION_LIMIT_ENABLED_STORAGE_KEY);
    else await AsyncStorage.setItem(DURATION_LIMIT_ENABLED_STORAGE_KEY, value);
  } catch {
    // Ignore persistence failures.
  }
}

export function LexusThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<LexusThemeMode>("dark");
  const [plan, setPlanState] = useState<ThemePlan>("lexus");
  const [callDurationLimit, setCallDurationLimitState] = useState<number | null>(null);
  const [callDurationLimitEnabled, setCallDurationLimitEnabledState] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    void readStoredMode().then((stored) => {
      if (!mounted || !stored) return;
      setModeState(stored);
    });

    void readStoredPlan().then((stored) => {
      if (!mounted || !stored) return;
      setPlanState(stored);
    });

    void readStoredDurationLimit().then((stored) => {
      if (!mounted || stored === null) return;
      setCallDurationLimitState(stored);
    });

    void readStoredDurationLimitEnabled().then((stored) => {
      if (!mounted || stored === null) return;
      setCallDurationLimitEnabledState(stored);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const setMode = useCallback(async (nextMode: LexusThemeMode) => {
    setModeState(nextMode);
    await writeStoredMode(nextMode);
  }, []);

  const toggleMode = useCallback(async () => {
    const nextMode: LexusThemeMode = mode === "dark" ? "light" : "dark";
    await setMode(nextMode);
  }, [mode, setMode]);

  const setPlan = useCallback(async (nextPlan: ThemePlan) => {
    setPlanState(nextPlan);
    await writeStoredPlan(nextPlan);
  }, []);

  const setCallDurationLimit = useCallback(async (limit: number | null) => {
    setCallDurationLimitState(limit);
    await writeStoredDurationLimit(limit);
  }, []);

  const setCallDurationLimitEnabled = useCallback(async (enabled: boolean | null) => {
    setCallDurationLimitEnabledState(enabled);
    await writeStoredDurationLimitEnabled(enabled);
  }, []);

  const value = useMemo<LexusThemeContextValue>(
    () => {
      const baseColors = plan === "prestige" ? PRESTIGE_THEME[mode] : LEXUS_THEME[mode];
      return {
        mode,
        plan,
        colors: baseColors,
        isDark: mode === "dark",
        setMode,
        toggleMode,
        setPlan,
        callDurationLimit,
        callDurationLimitEnabled,
        setCallDurationLimit,
        setCallDurationLimitEnabled,
      };
    },
    [mode, plan, setMode, toggleMode, setPlan, callDurationLimit, callDurationLimitEnabled, setCallDurationLimit, setCallDurationLimitEnabled]
  );

  return <LexusThemeContext.Provider value={value}>{children}</LexusThemeContext.Provider>;
}

export function useLexusTheme(): LexusThemeContextValue {
  const context = useContext(LexusThemeContext);
  return context ?? FALLBACK_THEME_VALUE;
}
