import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { QueueControls } from "./QueueControls";
import * as api from "@/lib/api";
import type { QueueItemWithProgress } from "@/types";

let mockQueue: QueueItemWithProgress[] = [];

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
};

vi.mock("@/store", () => ({
  useAppStore: vi.fn(
    (selector: (state: { queue: QueueItemWithProgress[] }) => unknown) =>
      selector({ queue: mockQueue })
  ),
}));

vi.mock("@/lib/api", () => ({
  startAllDownloads: vi.fn(),
  cancelAllDownloads: vi.fn(),
  clearCompleted: vi.fn(),
}));

describe("QueueControls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueue = [];
    vi.mocked(api.startAllDownloads).mockResolvedValue(undefined);
    vi.mocked(api.cancelAllDownloads).mockResolvedValue(undefined);
    vi.mocked(api.clearCompleted).mockResolvedValue(undefined);
  });

  it("starts all queued downloads", async () => {
    mockQueue = [baseItem];

    renderWithProviders(<QueueControls />);
    fireEvent.click(screen.getByRole("button", { name: "downloads.startAll" }));

    await waitFor(() => {
      expect(api.startAllDownloads).toHaveBeenCalled();
    });
  });

  it("cancels active downloads", async () => {
    mockQueue = [{ ...baseItem, state: "downloading" }];

    renderWithProviders(<QueueControls />);
    fireEvent.click(screen.getByRole("button", { name: "downloads.pauseAll" }));

    await waitFor(() => {
      expect(api.cancelAllDownloads).toHaveBeenCalled();
    });
  });

  it("clears completed downloads", async () => {
    mockQueue = [{ ...baseItem, state: "completed" }];

    renderWithProviders(<QueueControls />);
    fireEvent.click(
      screen.getByRole("button", { name: "downloads.clearCompleted" })
    );

    await waitFor(() => {
      expect(api.clearCompleted).toHaveBeenCalled();
    });
  });
});
