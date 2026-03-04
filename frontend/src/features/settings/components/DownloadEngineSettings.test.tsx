import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { DownloadEngineSettings } from "./DownloadEngineSettings";
import type { Settings } from "@/types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
}));

const mockSettings: Settings = {
  version: 2,
  defaultSavePath: "/downloads",
  defaultFormat: "mp3",
  defaultAudioQuality: "192",
  defaultVideoQuality: "720p",
  maxConcurrentDownloads: 2,
  downloadBackend: "yt-dlp",
};

describe("DownloadEngineSettings", () => {
  const onUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders engine title and both options", () => {
    renderWithProviders(
      <DownloadEngineSettings settings={mockSettings} onUpdate={onUpdate} />
    );

    expect(screen.getByText("settings.engine.title")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "settings.engine.ytdlp" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "settings.engine.builtin" })).toBeInTheDocument();
  });

  it("yt-dlp option is selected by default when settings.downloadBackend is yt-dlp", () => {
    renderWithProviders(
      <DownloadEngineSettings settings={mockSettings} onUpdate={onUpdate} />
    );

    const ytdlpRadio = screen.getByRole("radio", { name: "settings.engine.ytdlp" });
    const builtinRadio = screen.getByRole("radio", { name: "settings.engine.builtin" });

    expect(ytdlpRadio).toBeChecked();
    expect(builtinRadio).not.toBeChecked();
  });

  it("calls onUpdate when builtin is selected", () => {
    renderWithProviders(
      <DownloadEngineSettings settings={mockSettings} onUpdate={onUpdate} />
    );

    fireEvent.click(screen.getByRole("radio", { name: "settings.engine.builtin" }));

    expect(onUpdate).toHaveBeenCalledWith("downloadBackend", "builtin");
  });
});
