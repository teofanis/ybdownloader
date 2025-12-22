// Theme definitions for the app
export type ThemeMode = "light" | "dark" | "system";

export interface AccentTheme {
  id: string;
  name: string;
  primary: string; // HSL values without hsl()
  ring: string;
}

export const accentThemes: AccentTheme[] = [
  { id: "purple", name: "Purple", primary: "262 83% 58%", ring: "262 83% 58%" },
  { id: "blue", name: "Blue", primary: "221 83% 53%", ring: "221 83% 53%" },
  { id: "green", name: "Green", primary: "142 71% 45%", ring: "142 71% 45%" },
  { id: "orange", name: "Orange", primary: "24 95% 53%", ring: "24 95% 53%" },
  { id: "red", name: "Red", primary: "0 72% 51%", ring: "0 72% 51%" },
  { id: "pink", name: "Pink", primary: "330 81% 60%", ring: "330 81% 60%" },
  { id: "cyan", name: "Cyan", primary: "189 94% 43%", ring: "189 94% 43%" },
  { id: "yellow", name: "Yellow", primary: "48 96% 53%", ring: "48 96% 53%" },
];

const THEME_MODE_KEY = "ybdownloader-theme-mode";
const ACCENT_THEME_KEY = "ybdownloader-accent-theme";

export function getStoredThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem(THEME_MODE_KEY) as ThemeMode) || "system";
}

export function setStoredThemeMode(mode: ThemeMode): void {
  localStorage.setItem(THEME_MODE_KEY, mode);
}

export function getStoredAccentTheme(): string {
  if (typeof window === "undefined") return "purple";
  return localStorage.getItem(ACCENT_THEME_KEY) || "purple";
}

export function setStoredAccentTheme(themeId: string): void {
  localStorage.setItem(ACCENT_THEME_KEY, themeId);
}

export function getSystemTheme(): "light" | "dark" {
  // SSR safety check
  if (typeof window === "undefined") return "dark";
  
  // Check if matchMedia is available (should be in all modern browsers/webviews)
  if (typeof window.matchMedia !== "function") {
    return "dark"; // Default to dark if API unavailable
  }

  try {
    const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const lightQuery = window.matchMedia("(prefers-color-scheme: light)");
    
    // Explicit checks for both to handle edge cases where neither matches
    if (darkQuery.matches) return "dark";
    if (lightQuery.matches) return "light";
    
    // Fallback: check if no-preference or unsupported
    // Default to dark for desktop apps (common preference)
    return "dark";
  } catch {
    // matchMedia threw an error (very rare)
    return "dark";
  }
}

export function applyThemeMode(mode: ThemeMode): void {
  const root = document.documentElement;
  const effectiveMode = mode === "system" ? getSystemTheme() : mode;
  
  root.classList.remove("light", "dark");
  root.classList.add(effectiveMode);
}

export function applyAccentTheme(themeId: string): void {
  const theme = accentThemes.find((t) => t.id === themeId) || accentThemes[0];
  const root = document.documentElement;
  
  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--accent", theme.primary);
  root.style.setProperty("--ring", theme.ring);
}

