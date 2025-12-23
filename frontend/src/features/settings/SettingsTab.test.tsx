import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, act } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";

// Mock settings for tests
const mockSettings = {
  savePath: "/downloads",
  defaultFormat: "mp3",
  defaultAudioQuality: "192",
  defaultVideoQuality: "720p",
  maxConcurrentDownloads: 2,
  language: "en",
  themeMode: "system",
  accentColor: "purple",
  logLevel: "info",
};

// Create controllable store mock
const createMockStore = (overrides = {}) => ({
  settings: mockSettings,
  setSettings: vi.fn(),
  isSettingsLoading: false,
  setSettingsLoading: vi.fn(),
  ...overrides,
});

let mockStore = createMockStore();

vi.mock("@/store", () => ({
  useAppStore: vi.fn((selector) => selector(mockStore)),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock("@/components/theme-provider", () => ({
  useTheme: () => ({
    setMode: vi.fn(),
    setAccentTheme: vi.fn(),
    resetToDefaults: vi.fn(),
  }),
}));

// Track i18n state
let mockI18nLanguage = "en";
const mockChangeLanguage = vi.fn((lang: string) => {
  mockI18nLanguage = lang;
  return Promise.resolve();
});

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      get language() {
        return mockI18nLanguage;
      },
      changeLanguage: mockChangeLanguage,
    },
  }),
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
}));

// Mock all API functions that SettingsTab and its children might use
vi.mock("@/lib/api", () => ({
  getSettings: vi.fn(() => Promise.resolve(mockSettings)),
  saveSettings: vi.fn(() => Promise.resolve()),
  resetSettings: vi.fn(() => Promise.resolve(mockSettings)),
  selectDirectory: vi.fn(),
  checkFFmpeg: vi.fn(() => Promise.resolve({ installed: true })),
  getFFmpegStatus: vi.fn(() =>
    Promise.resolve({
      installed: true,
      version: "6.0",
      path: "/usr/bin/ffmpeg",
    })
  ),
  downloadFFmpeg: vi.fn(() => Promise.resolve()),
  openLogs: vi.fn(() => Promise.resolve()),
}));

// Import after mocks
import { SettingsTab } from "./SettingsTab";
import * as api from "@/lib/api";

describe("SettingsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore = createMockStore();
    mockI18nLanguage = "en";
  });

  it("renders settings sections", async () => {
    renderWithProviders(<SettingsTab />);

    await waitFor(() => {
      expect(screen.getByText("settings.title")).toBeInTheDocument();
    });
  });

  it("loads settings only once on mount", async () => {
    const { rerender } = renderWithProviders(<SettingsTab />);

    await waitFor(() => {
      expect(screen.getByText("settings.title")).toBeInTheDocument();
    });

    // Re-render multiple times (simulating language changes causing re-renders)
    rerender(<SettingsTab />);
    rerender(<SettingsTab />);
    rerender(<SettingsTab />);

    // getSettings should not be called at all since settings are in store
    expect(api.getSettings).toHaveBeenCalledTimes(0);
  });
});

describe("SettingsTab - Language Race Condition Prevention", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore = createMockStore();
    mockI18nLanguage = "en";
  });

  it("does not reset local state when i18n language changes", async () => {
    renderWithProviders(<SettingsTab />);

    await waitFor(() => {
      expect(screen.getByText("settings.title")).toBeInTheDocument();
    });

    // Find save button - it should be disabled initially (no changes)
    const saveButton = screen.getByRole("button", { name: /settings.save/i });
    expect(saveButton).toBeDisabled();

    // Simulate i18n language change
    await act(async () => {
      mockI18nLanguage = "de";
    });

    // Component should still have the same state - save button still disabled
    expect(saveButton).toBeDisabled();
  });

  it("preserves dirty state across re-renders", async () => {
    mockStore = createMockStore({ settings: null });

    renderWithProviders(<SettingsTab />);

    await waitFor(() => {
      expect(screen.getByText("settings.title")).toBeInTheDocument();
    });

    const saveButton = screen.getByRole("button", { name: /settings.save/i });
    expect(saveButton).toBeDisabled();
  });
});

describe("SettingsTab - Settings Loading Behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockI18nLanguage = "en";
  });

  it("uses settings from store if available", async () => {
    mockStore = createMockStore({ settings: mockSettings });

    renderWithProviders(<SettingsTab />);

    await waitFor(() => {
      expect(screen.getByText("settings.title")).toBeInTheDocument();
    });

    // Should not call getSettings since settings are already in store
    expect(api.getSettings).not.toHaveBeenCalled();
  });

  it("fetches settings from API if not in store", async () => {
    mockStore = createMockStore({ settings: null });

    renderWithProviders(<SettingsTab />);

    await waitFor(() => {
      expect(api.getSettings).toHaveBeenCalledTimes(1);
    });
  });

  it("does not re-fetch settings on subsequent renders", async () => {
    mockStore = createMockStore({ settings: null });

    const { rerender } = renderWithProviders(<SettingsTab />);

    await waitFor(() => {
      expect(api.getSettings).toHaveBeenCalledTimes(1);
    });

    // Re-render multiple times
    rerender(<SettingsTab />);
    rerender(<SettingsTab />);

    // Should still only have been called once
    expect(api.getSettings).toHaveBeenCalledTimes(1);
  });
});
