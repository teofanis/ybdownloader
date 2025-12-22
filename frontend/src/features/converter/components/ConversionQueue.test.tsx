import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConversionQueue } from "./ConversionQueue";
import type { ConversionJob, ConversionPreset } from "../types";

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (params?.count !== undefined) {
        return `${key} (${params.count})`;
      }
      return key;
    },
  }),
}));

describe("ConversionQueue", () => {
  const mockOnCancelJob = vi.fn();
  const mockOnRemoveJob = vi.fn();
  const mockOnClearCompleted = vi.fn();

  const mockPresets: ConversionPreset[] = [
    {
      id: "audio-mp3-high",
      name: "MP3 High Quality",
      description: "High quality MP3",
      category: "audio",
      outputExt: "mp3",
    },
  ];

  const baseJob: ConversionJob = {
    id: "job-1",
    inputPath: "/path/to/video.mp4",
    outputPath: "/path/to/output.mp3",
    presetId: "audio-mp3-high",
    state: "queued",
    progress: 0,
    error: "",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state when no jobs", () => {
    render(
      <ConversionQueue
        jobs={[]}
        presets={mockPresets}
        onCancelJob={mockOnCancelJob}
        onRemoveJob={mockOnRemoveJob}
        onClearCompleted={mockOnClearCompleted}
      />
    );

    expect(screen.getByText("converter.noJobs")).toBeInTheDocument();
    expect(screen.getByText("converter.emptyQueue")).toBeInTheDocument();
    expect(screen.getByText("converter.emptyQueueHint")).toBeInTheDocument();
  });

  it("renders job count when jobs exist", () => {
    render(
      <ConversionQueue
        jobs={[baseJob]}
        presets={mockPresets}
        onCancelJob={mockOnCancelJob}
        onRemoveJob={mockOnRemoveJob}
        onClearCompleted={mockOnClearCompleted}
      />
    );

    expect(screen.getByText("converter.jobCount (1)")).toBeInTheDocument();
  });

  it("renders multiple jobs", () => {
    const jobs = [
      { ...baseJob, id: "job-1", inputPath: "/path/video1.mp4" },
      { ...baseJob, id: "job-2", inputPath: "/path/video2.mp4" },
    ];

    render(
      <ConversionQueue
        jobs={jobs}
        presets={mockPresets}
        onCancelJob={mockOnCancelJob}
        onRemoveJob={mockOnRemoveJob}
        onClearCompleted={mockOnClearCompleted}
      />
    );

    expect(screen.getByText("video1.mp4")).toBeInTheDocument();
    expect(screen.getByText("video2.mp4")).toBeInTheDocument();
  });

  it("shows clear completed button when completed jobs exist", () => {
    const jobs = [{ ...baseJob, state: "completed" as const }];

    render(
      <ConversionQueue
        jobs={jobs}
        presets={mockPresets}
        onCancelJob={mockOnCancelJob}
        onRemoveJob={mockOnRemoveJob}
        onClearCompleted={mockOnClearCompleted}
      />
    );

    const clearButton = screen.getByText("converter.clearCompleted");
    expect(clearButton).toBeInTheDocument();

    fireEvent.click(clearButton);
    expect(mockOnClearCompleted).toHaveBeenCalledTimes(1);
  });

  it("hides clear completed button when no completed jobs", () => {
    const jobs = [{ ...baseJob, state: "converting" as const }];

    render(
      <ConversionQueue
        jobs={jobs}
        presets={mockPresets}
        onCancelJob={mockOnCancelJob}
        onRemoveJob={mockOnRemoveJob}
        onClearCompleted={mockOnClearCompleted}
      />
    );

    expect(
      screen.queryByText("converter.clearCompleted")
    ).not.toBeInTheDocument();
  });

  it("renders queue title", () => {
    render(
      <ConversionQueue
        jobs={[]}
        presets={mockPresets}
        onCancelJob={mockOnCancelJob}
        onRemoveJob={mockOnRemoveJob}
        onClearCompleted={mockOnClearCompleted}
      />
    );

    expect(screen.getByText("converter.queue")).toBeInTheDocument();
  });
});
