import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import { DownloadsTab } from "./DownloadsTab";
import type { QueueItemWithProgress } from "@/types";

const baseItem: QueueItemWithProgress = {
  id: "item-1",
  url: "https://www.youtube.com/watch?v=test",
  format: "mp3",
  state: "queued",
  savePath: "/downloads",
  filePath: "",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  error: "",
  metadata: {
    id: "test",
    title: "Queued video",
    author: "Author",
    duration: 120,
    thumbnail: "https://example.com/thumb.jpg",
  },
};

let mockQueue: QueueItemWithProgress[] = [];
let mockUrlInput = "";

vi.mock("@/store", () => ({
  useAppStore: vi.fn(
    (
      selector: (state: {
        queue: QueueItemWithProgress[];
        urlInput: string;
        setUrlInput: ReturnType<typeof vi.fn>;
        selectedFormat: string;
        setSelectedFormat: ReturnType<typeof vi.fn>;
        isAddingToQueue: boolean;
        setAddingToQueue: ReturnType<typeof vi.fn>;
        resetUrlInput: ReturnType<typeof vi.fn>;
      }) => unknown
    ) =>
      selector({
        queue: mockQueue,
        urlInput: mockUrlInput,
        setUrlInput: vi.fn(),
        selectedFormat: "mp3",
        setSelectedFormat: vi.fn(),
        isAddingToQueue: false,
        setAddingToQueue: vi.fn(),
        resetUrlInput: vi.fn(),
      })
  ),
}));

vi.mock("@/lib/api", () => ({
  addToQueue: vi.fn(),
  startAllDownloads: vi.fn(),
  cancelAllDownloads: vi.fn(),
  clearCompleted: vi.fn(),
}));

describe("DownloadsTab", () => {
  beforeEach(() => {
    mockQueue = [];
    mockUrlInput = "";
  });

  it("renders empty queue state", () => {
    renderWithProviders(<DownloadsTab />);

    expect(screen.getByText("downloads.emptyQueue")).toBeInTheDocument();
    expect(screen.getByText("downloads.emptyQueueHint")).toBeInTheDocument();
  });

  it("renders queue items and controls when queue is populated", () => {
    mockQueue = [baseItem];

    renderWithProviders(<DownloadsTab />);

    expect(screen.getByText("Queued video")).toBeInTheDocument();
    expect(screen.getByText("downloads.startAll")).toBeInTheDocument();
  });
});
