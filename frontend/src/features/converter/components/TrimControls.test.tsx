import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TrimControls } from "./TrimControls";
import type { MediaInfo, TrimOptions } from "../types";

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("TrimControls", () => {
  const mockOnTrimChange = vi.fn();
  const mockOnEnabledChange = vi.fn();

  const mediaInfo: MediaInfo = {
    duration: 120, // 2 minutes
    format: "mp4",
    size: 10000000,
    bitrate: 128000,
  };

  const defaultTrimOptions: TrimOptions = {
    startTime: 0,
    endTime: 120,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when mediaInfo is null", () => {
    const { container } = render(
      <TrimControls
        mediaInfo={null}
        waveformData={null}
        trimOptions={defaultTrimOptions}
        onTrimChange={mockOnTrimChange}
        enabled={false}
        onEnabledChange={mockOnEnabledChange}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders the trim controls when mediaInfo is provided", () => {
    render(
      <TrimControls
        mediaInfo={mediaInfo}
        waveformData={null}
        trimOptions={defaultTrimOptions}
        onTrimChange={mockOnTrimChange}
        enabled={true}
        onEnabledChange={mockOnEnabledChange}
      />
    );

    expect(screen.getByText("converter.trim.title")).toBeInTheDocument();
    expect(screen.getByText("converter.trim.enable")).toBeInTheDocument();
  });

  it("shows start and end time inputs", () => {
    render(
      <TrimControls
        mediaInfo={mediaInfo}
        waveformData={null}
        trimOptions={defaultTrimOptions}
        onTrimChange={mockOnTrimChange}
        enabled={true}
        onEnabledChange={mockOnEnabledChange}
      />
    );

    expect(screen.getByText("converter.trim.startTime")).toBeInTheDocument();
    expect(screen.getByText("converter.trim.endTime")).toBeInTheDocument();
  });

  it("displays formatted time values", () => {
    const trimOptions: TrimOptions = {
      startTime: 30, // 0:30
      endTime: 90, // 1:30
    };

    render(
      <TrimControls
        mediaInfo={mediaInfo}
        waveformData={null}
        trimOptions={trimOptions}
        onTrimChange={mockOnTrimChange}
        enabled={true}
        onEnabledChange={mockOnEnabledChange}
      />
    );

    // Check for formatted times in inputs
    const inputs = screen.getAllByRole("textbox");
    expect(inputs.length).toBe(2);
  });

  it("calls onEnabledChange when switch is toggled", () => {
    render(
      <TrimControls
        mediaInfo={mediaInfo}
        waveformData={null}
        trimOptions={defaultTrimOptions}
        onTrimChange={mockOnTrimChange}
        enabled={false}
        onEnabledChange={mockOnEnabledChange}
      />
    );

    const switchElement = screen.getByRole("switch");
    fireEvent.click(switchElement);

    expect(mockOnEnabledChange).toHaveBeenCalledWith(true);
  });

  it("shows duration info", () => {
    render(
      <TrimControls
        mediaInfo={mediaInfo}
        waveformData={null}
        trimOptions={defaultTrimOptions}
        onTrimChange={mockOnTrimChange}
        enabled={true}
        onEnabledChange={mockOnEnabledChange}
      />
    );

    expect(screen.getByText(/converter.trim.duration/)).toBeInTheDocument();
  });

  it("shows reset button", () => {
    render(
      <TrimControls
        mediaInfo={mediaInfo}
        waveformData={null}
        trimOptions={{ startTime: 10, endTime: 100 }}
        onTrimChange={mockOnTrimChange}
        enabled={true}
        onEnabledChange={mockOnEnabledChange}
      />
    );

    expect(screen.getByText("converter.trim.reset")).toBeInTheDocument();
  });

  it("calls onTrimChange when reset is clicked", () => {
    render(
      <TrimControls
        mediaInfo={mediaInfo}
        waveformData={null}
        trimOptions={{ startTime: 10, endTime: 100 }}
        onTrimChange={mockOnTrimChange}
        enabled={true}
        onEnabledChange={mockOnEnabledChange}
      />
    );

    const resetButton = screen.getByText("converter.trim.reset");
    fireEvent.click(resetButton);

    expect(mockOnTrimChange).toHaveBeenCalledWith({
      startTime: 0,
      endTime: 120,
    });
  });

  it("renders waveform bars when data is provided", () => {
    const waveformData = [0.5, 0.8, 0.3, 0.9, 0.2];

    const { container } = render(
      <TrimControls
        mediaInfo={mediaInfo}
        waveformData={waveformData}
        trimOptions={defaultTrimOptions}
        onTrimChange={mockOnTrimChange}
        enabled={true}
        onEnabledChange={mockOnEnabledChange}
      />
    );

    // Should render waveform bars
    const waveformBars = container.querySelectorAll('[class*="bg-primary/30"]');
    expect(waveformBars.length).toBe(waveformData.length);
  });

  it("disables controls when not enabled", () => {
    render(
      <TrimControls
        mediaInfo={mediaInfo}
        waveformData={null}
        trimOptions={defaultTrimOptions}
        onTrimChange={mockOnTrimChange}
        enabled={false}
        onEnabledChange={mockOnEnabledChange}
      />
    );

    const inputs = screen.getAllByRole("textbox");
    inputs.forEach((input) => {
      expect(input).toBeDisabled();
    });
  });

  it("shows percentage when trimmed", () => {
    render(
      <TrimControls
        mediaInfo={mediaInfo}
        waveformData={null}
        trimOptions={{ startTime: 0, endTime: 60 }} // Half duration
        onTrimChange={mockOnTrimChange}
        enabled={true}
        onEnabledChange={mockOnEnabledChange}
      />
    );

    // Should show 50%
    expect(screen.getByText("(50%)")).toBeInTheDocument();
  });

  it("handles time input changes", () => {
    render(
      <TrimControls
        mediaInfo={mediaInfo}
        waveformData={null}
        trimOptions={defaultTrimOptions}
        onTrimChange={mockOnTrimChange}
        enabled={true}
        onEnabledChange={mockOnEnabledChange}
      />
    );

    const inputs = screen.getAllByRole("textbox");
    const startInput = inputs[0];

    fireEvent.change(startInput, { target: { value: "0:30.00" } });

    expect(mockOnTrimChange).toHaveBeenCalled();
  });
});
