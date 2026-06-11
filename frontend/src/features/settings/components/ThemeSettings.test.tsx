import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, fireEvent } from "@/test/test-utils";
import { ThemeSettings } from "./ThemeSettings";

const setMode = vi.fn();
const setAccentTheme = vi.fn();
const onChange = vi.fn();

vi.mock("@/components/theme-provider", () => ({
  useTheme: () => ({
    setMode,
    setAccentTheme,
  }),
}));

describe("ThemeSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders theme mode and accent options", () => {
    renderWithProviders(
      <ThemeSettings
        themeMode="system"
        accentColor="purple"
        onChange={onChange}
      />
    );

    expect(screen.getByText("settings.theme.title")).toBeInTheDocument();
    expect(screen.getByText("settings.theme.modes.light")).toBeInTheDocument();
    expect(screen.getByText("settings.theme.modes.dark")).toBeInTheDocument();
  });

  it("updates theme mode and accent color", () => {
    renderWithProviders(
      <ThemeSettings
        themeMode="system"
        accentColor="purple"
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByText("settings.theme.modes.dark"));
    fireEvent.click(screen.getByTitle("Blue"));

    expect(setMode).toHaveBeenCalledWith("dark");
    expect(onChange).toHaveBeenCalledWith("themeMode", "dark");
    expect(setAccentTheme).toHaveBeenCalledWith("blue");
    expect(onChange).toHaveBeenCalledWith("accentColor", "blue");
  });
});
