import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConversionJobItem } from "./ConversionJobItem";
import type { ConversionJob, ConversionPreset } from "../types";

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("ConversionJobItem", () => {
  const mockOnCancel = vi.fn();
  const mockOnRemove = vi.fn();

  const baseJob: ConversionJob = {
    id: "job-1",
    inputPath: "/path/to/video.mp4",
    outputPath: "/path/to/output.mp3",
    presetId: "audio-mp3-high",
    state: "queued",
    progress: 0,
    duration: 120,
    currentTime: 0,
    error: "",
  };

  const mockPreset: ConversionPreset = {
    id: "audio-mp3-high",
    name: "MP3 High Quality",
    description: "High quality MP3",
    category: "audio",
    outputExt: "mp3",
    ffmpegArgs: ["-b:a", "320k"],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the job filename", () => {
    render(
      <ConversionJobItem
        job={baseJob}
        preset={mockPreset}
        onCancel={mockOnCancel}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByText("video.mp4")).toBeInTheDocument();
  });

  it("renders preset info when provided", () => {
    render(
      <ConversionJobItem
        job={baseJob}
        preset={mockPreset}
        onCancel={mockOnCancel}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByText(/\.mp3/)).toBeInTheDocument();
  });

  it("renders queued state", () => {
    render(
      <ConversionJobItem
        job={{ ...baseJob, state: "queued" }}
        preset={mockPreset}
        onCancel={mockOnCancel}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByText("converter.states.queued")).toBeInTheDocument();
  });

  it("renders converting state with progress", () => {
    render(
      <ConversionJobItem
        job={{ ...baseJob, state: "converting", progress: 50 }}
        preset={mockPreset}
        onCancel={mockOnCancel}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByText("converter.states.converting")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("renders analyzing state with progress bar", () => {
    render(
      <ConversionJobItem
        job={{ ...baseJob, state: "analyzing", progress: 0 }}
        preset={mockPreset}
        onCancel={mockOnCancel}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByText("converter.states.analyzing")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("renders completed state", () => {
    render(
      <ConversionJobItem
        job={{ ...baseJob, state: "completed", progress: 100 }}
        preset={mockPreset}
        onCancel={mockOnCancel}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByText("converter.states.completed")).toBeInTheDocument();
  });

  it("renders failed state with error message", () => {
    render(
      <ConversionJobItem
        job={{ ...baseJob, state: "failed", error: "Conversion error" }}
        preset={mockPreset}
        onCancel={mockOnCancel}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByText("converter.states.failed")).toBeInTheDocument();
    expect(screen.getByText("Conversion error")).toBeInTheDocument();
  });

  it("renders cancelled state", () => {
    render(
      <ConversionJobItem
        job={{ ...baseJob, state: "cancelled" }}
        preset={mockPreset}
        onCancel={mockOnCancel}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByText("converter.states.cancelled")).toBeInTheDocument();
  });

  it("shows cancel button for active jobs", () => {
    render(
      <ConversionJobItem
        job={{ ...baseJob, state: "converting" }}
        preset={mockPreset}
        onCancel={mockOnCancel}
        onRemove={mockOnRemove}
      />
    );

    const cancelButton = screen.getByRole("button");
    expect(cancelButton).toBeInTheDocument();

    fireEvent.click(cancelButton);
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("shows remove button for completed jobs", () => {
    render(
      <ConversionJobItem
        job={{ ...baseJob, state: "completed" }}
        preset={mockPreset}
        onCancel={mockOnCancel}
        onRemove={mockOnRemove}
      />
    );

    const removeButton = screen.getByRole("button");
    expect(removeButton).toBeInTheDocument();

    fireEvent.click(removeButton);
    expect(mockOnRemove).toHaveBeenCalledTimes(1);
  });

  it("shows remove button for failed jobs", () => {
    render(
      <ConversionJobItem
        job={{ ...baseJob, state: "failed" }}
        preset={mockPreset}
        onCancel={mockOnCancel}
        onRemove={mockOnRemove}
      />
    );

    const removeButton = screen.getByRole("button");
    fireEvent.click(removeButton);
    expect(mockOnRemove).toHaveBeenCalledTimes(1);
  });

  it("shows video icon when job has video stream", () => {
    const jobWithVideo: ConversionJob = {
      ...baseJob,
      inputInfo: {
        format: "mp4",
        duration: 120,
        size: 1000000,
        bitrate: 128000,
        videoStream: {
          codec: "h264",
          width: 1920,
          height: 1080,
          fps: 30,
          bitrate: 5000000,
        },
      },
    };

    const { container } = render(
      <ConversionJobItem
        job={jobWithVideo}
        preset={mockPreset}
        onCancel={mockOnCancel}
        onRemove={mockOnRemove}
      />
    );

    // Check for FileVideo icon (SVG with specific class)
    const videoIcon = container.querySelector(".lucide-file-video");
    expect(videoIcon).toBeInTheDocument();
  });

  it("shows audio icon when job has no video stream", () => {
    const { container } = render(
      <ConversionJobItem
        job={baseJob}
        preset={mockPreset}
        onCancel={mockOnCancel}
        onRemove={mockOnRemove}
      />
    );

    const audioIcon = container.querySelector(".lucide-file-audio");
    expect(audioIcon).toBeInTheDocument();
  });

  it("handles Windows-style paths", () => {
    const windowsJob: ConversionJob = {
      ...baseJob,
      inputPath: "C:\\Users\\Test\\video.mp4",
    };

    render(
      <ConversionJobItem
        job={windowsJob}
        preset={mockPreset}
        onCancel={mockOnCancel}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByText("video.mp4")).toBeInTheDocument();
  });

  it("renders without preset", () => {
    render(
      <ConversionJobItem
        job={baseJob}
        onCancel={mockOnCancel}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByText("video.mp4")).toBeInTheDocument();
  });
});
