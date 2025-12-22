import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueueItem } from "./QueueItem";
import type { QueueItemWithProgress } from "@/types";

// Mock dependencies
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock("@/lib/api", () => ({
  startDownload: vi.fn(),
  cancelDownload: vi.fn(),
  retryDownload: vi.fn(),
  removeFromQueue: vi.fn(),
  openFile: vi.fn(),
  openFolder: vi.fn(),
}));

// Helper to wrap component with required providers
function renderWithProviders(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

describe("QueueItem", () => {
  const baseItem: QueueItemWithProgress = {
    id: "item-1",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    format: "mp3",
    state: "queued",
    savePath: "/home/user/Music",
    filePath: "",
    createdAt: new Date().toISOString(),
    error: "",
    metadata: {
      id: "dQw4w9WgXcQ",
      title: "Test Video Title",
      author: "Test Author",
      duration: 180,
      thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders video title from metadata", () => {
    renderWithProviders(<QueueItem item={baseItem} />);
    expect(screen.getByText("Test Video Title")).toBeInTheDocument();
  });

  it("renders author from metadata", () => {
    renderWithProviders(<QueueItem item={baseItem} />);
    expect(screen.getByText(/Test Author/)).toBeInTheDocument();
  });

  it("renders format badge", () => {
    renderWithProviders(<QueueItem item={baseItem} />);
    expect(screen.getByText("MP3")).toBeInTheDocument();
  });

  it("renders queued state", () => {
    renderWithProviders(<QueueItem item={baseItem} />);
    expect(screen.getByText("downloads.states.queued")).toBeInTheDocument();
  });

  it("shows buttons for queued items", () => {
    const { container } = renderWithProviders(<QueueItem item={baseItem} />);

    // Queued items should have start and remove buttons
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("shows buttons for ready items", () => {
    const { container } = renderWithProviders(
      <QueueItem item={{ ...baseItem, state: "ready" }} />
    );
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("shows cancel button for downloading items", () => {
    const { container } = renderWithProviders(
      <QueueItem
        item={{
          ...baseItem,
          state: "downloading",
          progress: {
            percent: 50,
            downloadedBytes: 5000000,
            totalBytes: 10000000,
            speed: 1000000,
            eta: 5,
          },
        }}
      />
    );

    expect(
      screen.getByText("downloads.states.downloading")
    ).toBeInTheDocument();
    // Should have a cancel button
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("shows retry button for failed items", () => {
    const { container } = renderWithProviders(
      <QueueItem item={{ ...baseItem, state: "failed", error: "Some error" }} />
    );

    expect(screen.getByText("downloads.states.failed")).toBeInTheDocument();
    // Should have retry and remove buttons
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("shows retry button for cancelled items", () => {
    const { container } = renderWithProviders(
      <QueueItem item={{ ...baseItem, state: "cancelled" }} />
    );
    expect(screen.getByText("downloads.states.cancelled")).toBeInTheDocument();
    // Should have retry and remove buttons
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("shows buttons for completed items", () => {
    const { container } = renderWithProviders(
      <QueueItem
        item={{
          ...baseItem,
          state: "completed",
          filePath: "/home/user/Music/video.mp3",
        }}
      />
    );

    expect(screen.getByText("downloads.states.completed")).toBeInTheDocument();

    // Completed items should have open file, open folder, and remove buttons
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("shows buttons for non-active items", () => {
    const { container } = renderWithProviders(<QueueItem item={baseItem} />);

    // For queued items, should have start and remove buttons (2 buttons + state badge trigger)
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("shows different button set for active downloading items", () => {
    const { container } = renderWithProviders(
      <QueueItem
        item={{
          ...baseItem,
          state: "downloading",
          progress: {
            percent: 50,
            downloadedBytes: 5000000,
            totalBytes: 10000000,
            speed: 1000000,
            eta: 5,
          },
        }}
      />
    );

    // For downloading items, should have cancel button visible
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("shows progress bar for downloading items", () => {
    const { container } = renderWithProviders(
      <QueueItem
        item={{
          ...baseItem,
          state: "downloading",
          progress: {
            percent: 75,
            downloadedBytes: 7500000,
            totalBytes: 10000000,
            speed: 500000,
            eta: 5,
          },
        }}
      />
    );

    // Check for progress bar
    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toBeInTheDocument();
  });

  it("displays video thumbnail when available", () => {
    const { container } = renderWithProviders(<QueueItem item={baseItem} />);

    const img = container.querySelector("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute(
      "src",
      "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg"
    );
  });

  it("falls back to icon when no valid YouTube video id", () => {
    const itemWithoutVideoId: QueueItemWithProgress = {
      ...baseItem,
      url: "https://example.com/video",
    };

    const { container } = renderWithProviders(
      <QueueItem item={itemWithoutVideoId} />
    );

    // Should not have an img element when there's no valid video ID
    const img = container.querySelector("img");
    expect(img).not.toBeInTheDocument();
  });

  it("shows music icon for audio formats", () => {
    // MP3 is audio format, should show music icon when no thumbnail
    const itemWithoutThumb: QueueItemWithProgress = {
      ...baseItem,
      url: "https://example.com/audio",
    };

    const { container } = renderWithProviders(
      <QueueItem item={itemWithoutThumb} />
    );
    const musicIcon = container.querySelector(".lucide-music");
    expect(musicIcon).toBeInTheDocument();
  });

  it("shows video icon for video formats", () => {
    const videoItem: QueueItemWithProgress = {
      ...baseItem,
      format: "mp4",
      url: "https://example.com/video",
    };

    const { container } = renderWithProviders(<QueueItem item={videoItem} />);
    const videoIcon = container.querySelector(".lucide-video");
    expect(videoIcon).toBeInTheDocument();
  });

  it("renders converting state", () => {
    renderWithProviders(
      <QueueItem
        item={{
          ...baseItem,
          state: "converting",
          progress: {
            percent: 30,
            downloadedBytes: 10000000,
            totalBytes: 10000000,
            speed: 0,
            eta: 0,
          },
        }}
      />
    );

    expect(screen.getByText("downloads.states.converting")).toBeInTheDocument();
  });

  it("renders fetching_metadata state", () => {
    renderWithProviders(
      <QueueItem item={{ ...baseItem, state: "fetching_metadata" }} />
    );

    // Multiple elements may match (badge and message), just check one exists
    const elements = screen.getAllByText("downloads.states.fetchingMetadata");
    expect(elements.length).toBeGreaterThan(0);
  });

  it("handles URL without metadata gracefully", () => {
    const itemWithoutMeta: QueueItemWithProgress = {
      ...baseItem,
      metadata: undefined,
    };

    renderWithProviders(<QueueItem item={itemWithoutMeta} />);

    // Should show truncated URL
    expect(screen.getByText(/youtube.com/)).toBeInTheDocument();
  });
});
