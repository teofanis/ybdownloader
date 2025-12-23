import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";

// Create a mock i18n instance that tracks state
const createMockI18n = (initialLang = "en") => {
  let currentLanguage = initialLang;
  return {
    language: currentLanguage,
    changeLanguage: vi.fn((lang: string) => {
      currentLanguage = lang;
      return Promise.resolve();
    }),
    get currentLang() {
      return currentLanguage;
    },
  };
};

let mockI18n = createMockI18n();

// Mock react-i18next with controllable i18n instance
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: mockI18n,
  }),
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
}));

// Import component after mocks
import { LanguageSettings } from "./LanguageSettings";

describe("LanguageSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockI18n = createMockI18n("en");
  });

  it("renders with the correct language selected from prop", () => {
    const onChange = vi.fn();
    renderWithProviders(<LanguageSettings language="de" onChange={onChange} />);

    // The select should show German
    const trigger = screen.getByRole("combobox");
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent("Deutsch");
  });

  it("syncs i18n.changeLanguage when language prop changes", async () => {
    const onChange = vi.fn();
    const { rerender } = renderWithProviders(
      <LanguageSettings language="en" onChange={onChange} />
    );

    // Initially, changeLanguage should not be called (language matches i18n.language)
    expect(mockI18n.changeLanguage).not.toHaveBeenCalled();

    // Simulate parent component updating the language prop
    rerender(<LanguageSettings language="de" onChange={onChange} />);

    // The useEffect should trigger i18n.changeLanguage
    await waitFor(() => {
      expect(mockI18n.changeLanguage).toHaveBeenCalledWith("de");
    });
  });

  it("does not call i18n.changeLanguage if language matches current", () => {
    const onChange = vi.fn();
    mockI18n = createMockI18n("de");

    renderWithProviders(<LanguageSettings language="de" onChange={onChange} />);

    // Should not call changeLanguage since language already matches
    expect(mockI18n.changeLanguage).not.toHaveBeenCalled();
  });

  it("uses language prop as source of truth over i18n.language", () => {
    const onChange = vi.fn();
    // i18n thinks it's English, but prop says German
    mockI18n = createMockI18n("en");

    renderWithProviders(<LanguageSettings language="de" onChange={onChange} />);

    // Select should show German (from prop), not English (from i18n)
    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveTextContent("Deutsch");
  });

  it("falls back to i18n.language when language prop is empty", () => {
    const onChange = vi.fn();
    mockI18n = createMockI18n("fr");

    renderWithProviders(<LanguageSettings language="" onChange={onChange} />);

    // Should fall back to i18n.language (French)
    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveTextContent("Français");
  });
});

describe("LanguageSettings - Race Condition Prevention", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockI18n = createMockI18n("en");
  });

  it("multiple rapid language changes settle on final value", async () => {
    const onChange = vi.fn();

    const { rerender } = renderWithProviders(
      <LanguageSettings language="en" onChange={onChange} />
    );

    // Simulate rapid prop changes (as if user selected multiple times quickly)
    rerender(<LanguageSettings language="de" onChange={onChange} />);
    rerender(<LanguageSettings language="fr" onChange={onChange} />);
    rerender(<LanguageSettings language="es" onChange={onChange} />);

    // Wait for effects to settle
    await waitFor(() => {
      // The last call should be for Spanish
      const calls = mockI18n.changeLanguage.mock.calls;
      expect(calls[calls.length - 1][0]).toBe("es");
    });
  });

  it("component displays correct value even during async language change", async () => {
    const onChange = vi.fn();

    // Slow changeLanguage to simulate async delay
    mockI18n.changeLanguage = vi.fn(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    const { rerender } = renderWithProviders(
      <LanguageSettings language="en" onChange={onChange} />
    );

    // Change language prop
    rerender(<LanguageSettings language="de" onChange={onChange} />);

    // Even before changeLanguage resolves, the UI should show German
    // because we use the prop as the source of truth
    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveTextContent("Deutsch");
  });

  it("useEffect syncs i18n after prop change, not during handleChange", async () => {
    const onChange = vi.fn();
    const changeLanguageSpy = vi.fn(() => Promise.resolve());
    mockI18n.changeLanguage = changeLanguageSpy;

    const { rerender } = renderWithProviders(
      <LanguageSettings language="en" onChange={onChange} />
    );

    // Verify initial state - no changeLanguage call since prop matches i18n
    expect(changeLanguageSpy).not.toHaveBeenCalled();

    // Simulate what happens when handleChange is called:
    // 1. Parent updates language prop to "de"
    rerender(<LanguageSettings language="de" onChange={onChange} />);

    // 2. useEffect should trigger changeLanguage
    await waitFor(() => {
      expect(changeLanguageSpy).toHaveBeenCalledWith("de");
    });

    // 3. Verify it was only called once
    expect(changeLanguageSpy).toHaveBeenCalledTimes(1);
  });
});
