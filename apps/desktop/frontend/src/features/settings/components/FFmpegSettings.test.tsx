import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  renderWithProviders,
  screen,
  fireEvent,
  waitFor,
} from "@/test/test-utils";
import { FFmpegSettings } from "./FFmpegSettings";
import * as api from "@/lib/api";
import { BACKEND_YTDLP } from "@/types";
import type { Settings } from "@/types";

const mockSettings: Settings = {
  version: 2,
  defaultSavePath: "/downloads",
  defaultFormat: "mp3",
  defaultAudioQuality: "192",
  defaultVideoQuality: "720p",
  maxConcurrentDownloads: 2,
  downloadBackend: BACKEND_YTDLP,
};

vi.mock("@/lib/api", () => ({
  getFFmpegStatus: vi.fn(),
  downloadFFmpeg: vi.fn(),
}));

describe("FFmpegSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getFFmpegStatus).mockResolvedValue({
      available: false,
      path: "",
      version: "",
      bundled: false,
      ffprobeAvailable: false,
      ffprobePath: "",
    });
    vi.mocked(api.downloadFFmpeg).mockResolvedValue(undefined);
  });

  it("shows download action when ffmpeg is not installed", async () => {
    renderWithProviders(
      <FFmpegSettings settings={mockSettings} onUpdate={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText("settings.ffmpeg.download")).toBeInTheDocument();
    });
  });

  it("starts ffmpeg download", async () => {
    renderWithProviders(
      <FFmpegSettings settings={mockSettings} onUpdate={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText("settings.ffmpeg.download")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: /settings.ffmpeg.download/ })
    );

    await waitFor(() => {
      expect(api.downloadFFmpeg).toHaveBeenCalled();
    });
  });

  it("shows installed status when ffmpeg and ffprobe are available", async () => {
    vi.mocked(api.getFFmpegStatus).mockResolvedValue({
      available: true,
      path: "/usr/bin/ffmpeg",
      version: "6.0",
      bundled: true,
      ffprobeAvailable: true,
      ffprobePath: "/usr/bin/ffprobe",
    });

    renderWithProviders(
      <FFmpegSettings settings={mockSettings} onUpdate={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText("settings.ffmpeg.installed")).toBeInTheDocument();
      expect(screen.getByText("FFmpeg")).toBeInTheDocument();
      expect(screen.getByText("FFprobe")).toBeInTheDocument();
    });
  });
});
