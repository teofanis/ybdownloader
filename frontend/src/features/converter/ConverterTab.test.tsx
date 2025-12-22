import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (params) {
        return key.replace(/\{\{(\w+)\}\}/g, (_, k) => String(params[k] ?? ""));
      }
      return key;
    },
  }),
}));

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock Wails runtime
vi.mock("../../wailsjs/runtime/runtime", () => ({
  EventsOn: vi.fn(),
  EventsOff: vi.fn(),
}));

// Mock API
const mockPresets = [
  {
    id: "audio-mp3-320",
    name: "MP3 High Quality",
    description: "Convert to MP3 at 320kbps",
    category: "audio",
    outputExt: "mp3",
  },
  {
    id: "video-mp4-h264",
    name: "MP4 Compatible",
    description: "H.264 video, widely compatible",
    category: "video",
    outputExt: "mp4",
  },
];

const mockMediaInfo = {
  duration: 180,
  format: "mp4",
  size: 50000000,
  bitrate: 2000000,
  videoStream: {
    codec: "h264",
    width: 1920,
    height: 1080,
    fps: 30,
    bitrate: 1800000,
  },
  audioStream: {
    codec: "aac",
    channels: 2,
    sampleRate: 44100,
    bitrate: 192000,
  },
};

vi.mock("@/lib/api", () => ({
  getConversionPresets: vi.fn(() => Promise.resolve(mockPresets)),
  getConversionJobs: vi.fn(() => Promise.resolve([])),
  selectMediaFile: vi.fn(() => Promise.resolve("/test/video.mp4")),
  analyzeMediaFile: vi.fn(() => Promise.resolve(mockMediaInfo)),
  startConversion: vi.fn(() =>
    Promise.resolve({ id: "job-1", state: "queued" })
  ),
  cancelConversion: vi.fn(() => Promise.resolve()),
  removeConversionJob: vi.fn(() => Promise.resolve()),
  clearCompletedConversions: vi.fn(() => Promise.resolve()),
}));

// Import after mocks
import { ConverterTab } from "./ConverterTab";
import * as api from "@/lib/api";

describe("ConverterTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders converter tab with presets", async () => {
    render(<ConverterTab />);

    await waitFor(() => {
      expect(screen.getByText("converter.presets")).toBeInTheDocument();
    });
  });

  it("loads presets on mount", async () => {
    render(<ConverterTab />);

    await waitFor(() => {
      expect(api.getConversionPresets).toHaveBeenCalled();
    });
  });

  it("shows file selection button", () => {
    render(<ConverterTab />);
    expect(screen.getByText("converter.browseFiles")).toBeInTheDocument();
  });

  it("shows convert button disabled when no file/preset selected", () => {
    render(<ConverterTab />);
    const convertButton = screen.getByRole("button", {
      name: /converter.convert/i,
    });
    expect(convertButton).toBeDisabled();
  });

  it("shows empty queue message when no jobs", async () => {
    render(<ConverterTab />);

    await waitFor(() => {
      expect(screen.getByText("converter.emptyQueue")).toBeInTheDocument();
    });
  });

  it("displays preset categories", async () => {
    render(<ConverterTab />);

    await waitFor(() => {
      // Should have category headers
      expect(screen.getByText("Audio Formats")).toBeInTheDocument();
    });
  });

  it("selects a preset when clicked", async () => {
    render(<ConverterTab />);

    await waitFor(() => {
      expect(screen.getByText("MP3 High Quality")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("MP3 High Quality"));

    // Preset should be selected (has primary background)
    const presetButton = screen.getByText("MP3 High Quality").closest("button");
    expect(presetButton).toHaveClass("bg-primary");
  });

  it("calls selectMediaFile when browse button clicked", async () => {
    render(<ConverterTab />);

    const browseButton = screen.getByText("converter.browseFiles");
    fireEvent.click(browseButton);

    await waitFor(() => {
      expect(api.selectMediaFile).toHaveBeenCalled();
    });
  });

  it("displays media info after file selection", async () => {
    render(<ConverterTab />);

    const browseButton = screen.getByText("converter.browseFiles");
    fireEvent.click(browseButton);

    await waitFor(() => {
      expect(api.analyzeMediaFile).toHaveBeenCalledWith("/test/video.mp4");
    });

    await waitFor(() => {
      // Should show file info
      expect(screen.getByText("1920×1080")).toBeInTheDocument();
    });
  });
});
