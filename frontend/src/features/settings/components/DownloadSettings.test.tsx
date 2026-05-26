import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import {
  SavePathSettings,
  FormatSettings,
  ConcurrentDownloadsSettings,
} from "./DownloadSettings";
import { BACKEND_YTDLP } from "@/types";
import type { Settings } from "@/types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
}));

vi.mock("@/lib/api", () => ({
  selectDirectory: vi.fn(),
}));

const mockSettings: Settings = {
  version: 2,
  defaultSavePath: "/downloads",
  defaultFormat: "mp3",
  defaultAudioQuality: "192",
  defaultVideoQuality: "720p",
  maxConcurrentDownloads: 2,
  downloadBackend: BACKEND_YTDLP,
};

describe("SavePathSettings", () => {
  const onUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders save path input with current value", () => {
    renderWithProviders(
      <SavePathSettings settings={mockSettings} onUpdate={onUpdate} />
    );

    const input = screen.getByDisplayValue("/downloads");
    expect(input).toBeInTheDocument();
  });

  it("calls onUpdate when path input changes", () => {
    renderWithProviders(
      <SavePathSettings settings={mockSettings} onUpdate={onUpdate} />
    );

    const input = screen.getByDisplayValue("/downloads");
    fireEvent.change(input, { target: { value: "/new/path" } });

    expect(onUpdate).toHaveBeenCalledWith("defaultSavePath", "/new/path");
  });

  it("renders browse button", () => {
    renderWithProviders(
      <SavePathSettings settings={mockSettings} onUpdate={onUpdate} />
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });
});

describe("FormatSettings", () => {
  const onUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders format settings card", () => {
    renderWithProviders(
      <FormatSettings settings={mockSettings} onUpdate={onUpdate} />
    );

    expect(
      screen.getAllByText("settings.fields.format").length
    ).toBeGreaterThan(0);
  });
});

describe("ConcurrentDownloadsSettings", () => {
  const onUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders concurrent downloads settings", () => {
    renderWithProviders(
      <ConcurrentDownloadsSettings
        settings={mockSettings}
        onUpdate={onUpdate}
      />
    );

    expect(
      screen.getAllByText("settings.fields.concurrentDownloads").length
    ).toBeGreaterThan(0);
  });
});
