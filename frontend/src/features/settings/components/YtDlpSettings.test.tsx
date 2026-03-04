import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { YtDlpSettings } from "./YtDlpSettings";
import * as api from "@/lib/api";
import type { Settings } from "@/types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/lib/api", () => ({
  getYtDlpStatus: vi.fn(() =>
    Promise.resolve({
      available: true,
      path: "/usr/bin/yt-dlp",
      version: "2026.03.03",
      bundled: false,
    })
  ),
  downloadYtDlp: vi.fn(() => Promise.resolve()),
  getYtDlpDefaultFlags: vi.fn(() =>
    Promise.resolve({
      common: ["--newline", "--no-colors"],
      mp3: ["-x", "--audio-format", "mp3"],
    })
  ),
}));

vi.mock("../../../../wailsjs/runtime/runtime", () => ({
  EventsOn: vi.fn(() => vi.fn()),
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

describe("YtDlpSettings", () => {
  const onUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getYtDlpStatus).mockResolvedValue({
      available: true,
      path: "/usr/bin/yt-dlp",
      version: "2026.03.03",
      bundled: false,
      hasJSRuntime: true,
      jsRuntime: "node (/usr/bin/node)",
    });
  });

  it("renders yt-dlp title", async () => {
    renderWithProviders(
      <YtDlpSettings settings={mockSettings} onUpdate={onUpdate} />
    );

    await waitFor(() => {
      expect(screen.getByText("settings.ytdlp.title")).toBeInTheDocument();
    });
  });

  it("shows installed badge when yt-dlp is available", async () => {
    renderWithProviders(
      <YtDlpSettings settings={mockSettings} onUpdate={onUpdate} />
    );

    await waitFor(() => {
      expect(screen.getByText("settings.ytdlp.installed")).toBeInTheDocument();
    });
  });

  it("shows download button when yt-dlp is not available", async () => {
    vi.mocked(api.getYtDlpStatus).mockResolvedValue({
      available: false,
      path: "",
      version: "",
      bundled: false,
      hasJSRuntime: false,
    });

    renderWithProviders(
      <YtDlpSettings settings={mockSettings} onUpdate={onUpdate} />
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /settings\.ytdlp\.download/i })).toBeInTheDocument();
    });
  });

  it("shows custom path input", async () => {
    renderWithProviders(
      <YtDlpSettings settings={mockSettings} onUpdate={onUpdate} />
    );

    await waitFor(() => {
      expect(screen.getByText("settings.ytdlp.title")).toBeInTheDocument();
    });

    const customPathInput = screen.getByPlaceholderText("settings.ytdlp.customPathPlaceholder");
    expect(customPathInput).toBeInTheDocument();
  });

  it("calls onUpdate when custom path changes", async () => {
    renderWithProviders(
      <YtDlpSettings settings={mockSettings} onUpdate={onUpdate} />
    );

    await waitFor(() => {
      expect(screen.getByText("settings.ytdlp.title")).toBeInTheDocument();
    });

    const customPathInput = screen.getByPlaceholderText("settings.ytdlp.customPathPlaceholder");
    fireEvent.change(customPathInput, { target: { value: "/custom/yt-dlp" } });

    expect(onUpdate).toHaveBeenCalledWith("ytDlpPath", "/custom/yt-dlp");
  });

  it("shows JS runtime status when available", async () => {
    vi.mocked(api.getYtDlpStatus).mockResolvedValue({
      available: true,
      path: "/usr/bin/yt-dlp",
      version: "2026.03.03",
      bundled: false,
      hasJSRuntime: true,
      jsRuntime: "node (/usr/bin/node)",
    });

    renderWithProviders(
      <YtDlpSettings settings={mockSettings} onUpdate={onUpdate} />
    );

    await waitFor(() => {
      expect(screen.getByText(/settings\.ytdlp\.jsRuntime/)).toBeInTheDocument();
      expect(screen.getByText("node (/usr/bin/node)")).toBeInTheDocument();
    });
  });

  it("shows no JS runtime warning", async () => {
    vi.mocked(api.getYtDlpStatus).mockResolvedValue({
      available: true,
      path: "/usr/bin/yt-dlp",
      version: "2026.03.03",
      bundled: false,
      hasJSRuntime: false,
    });

    renderWithProviders(
      <YtDlpSettings settings={mockSettings} onUpdate={onUpdate} />
    );

    await waitFor(() => {
      expect(screen.getByText("settings.ytdlp.noJsRuntime")).toBeInTheDocument();
    });
  });

  it("shows version and path when installed", async () => {
    renderWithProviders(
      <YtDlpSettings settings={mockSettings} onUpdate={onUpdate} />
    );

    await waitFor(() => {
      expect(screen.getByText(/settings\.ytdlp\.path/)).toBeInTheDocument();
      expect(screen.getByText(/settings\.ytdlp\.version/)).toBeInTheDocument();
      expect(screen.getByText("/usr/bin/yt-dlp")).toBeInTheDocument();
      expect(screen.getByText("2026.03.03")).toBeInTheDocument();
    });
  });
});
