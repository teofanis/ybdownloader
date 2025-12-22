import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  type ThemeMode,
  getStoredThemeMode,
  setStoredThemeMode,
  getStoredAccentTheme,
  setStoredAccentTheme,
  applyThemeMode,
  applyAccentTheme,
  getSystemTheme,
  clearThemeStorage,
  DEFAULT_THEME_MODE,
  DEFAULT_ACCENT_THEME,
} from "@/lib/themes";

interface ThemeContextValue {
  mode: ThemeMode;
  effectiveMode: "light" | "dark";
  accentTheme: string;
  setMode: (mode: ThemeMode) => void;
  setAccentTheme: (themeId: string) => void;
  resetToDefaults: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(getStoredThemeMode);
  const [accentTheme, setAccentThemeState] = useState(getStoredAccentTheme);
  const [effectiveMode, setEffectiveMode] = useState<"light" | "dark">(
    mode === "system" ? getSystemTheme() : mode
  );

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    setStoredThemeMode(newMode);
    applyThemeMode(newMode);
    setEffectiveMode(newMode === "system" ? getSystemTheme() : newMode);
  }, []);

  const setAccentTheme = useCallback((themeId: string) => {
    setAccentThemeState(themeId);
    setStoredAccentTheme(themeId);
    applyAccentTheme(themeId);
  }, []);

  const resetToDefaults = useCallback(() => {
    clearThemeStorage();
    setModeState(DEFAULT_THEME_MODE);
    setAccentThemeState(DEFAULT_ACCENT_THEME);
    applyThemeMode(DEFAULT_THEME_MODE);
    applyAccentTheme(DEFAULT_ACCENT_THEME);
    setEffectiveMode(DEFAULT_THEME_MODE === "system" ? getSystemTheme() : DEFAULT_THEME_MODE);
  }, []);

  // Apply theme on mount
  useEffect(() => {
    applyThemeMode(mode);
    applyAccentTheme(accentTheme);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    // Safety check for matchMedia availability
    if (typeof window.matchMedia !== "function") return;

    let darkQuery: MediaQueryList | null = null;
    let lightQuery: MediaQueryList | null = null;

    try {
      darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
      lightQuery = window.matchMedia("(prefers-color-scheme: light)");
    } catch {
      return; // matchMedia not supported
    }

    const handleChange = () => {
      if (mode === "system") {
        applyThemeMode("system");
        setEffectiveMode(getSystemTheme());
      }
    };

    // Listen to both dark and light queries for better cross-platform support
    darkQuery.addEventListener("change", handleChange);
    lightQuery.addEventListener("change", handleChange);

    return () => {
      darkQuery?.removeEventListener("change", handleChange);
      lightQuery?.removeEventListener("change", handleChange);
    };
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, effectiveMode, accentTheme, setMode, setAccentTheme, resetToDefaults }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

