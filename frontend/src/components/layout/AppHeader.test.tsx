import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { AppHeader } from "./AppHeader";
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
};

let mockQueue: QueueItemWithProgress[] = [];

vi.mock("@/store", () => ({
  useAppStore: vi.fn(
    (selector: (state: { queue: QueueItemWithProgress[] }) => unknown) =>
      selector({ queue: mockQueue })
  ),
}));

describe("AppHeader", () => {
  beforeEach(() => {
    mockQueue = [];
  });

  it("renders app title and subtitle", () => {
    renderWithProviders(<AppHeader />);

    expect(screen.getByText("app.title")).toBeInTheDocument();
    expect(screen.getByText("app.subtitle")).toBeInTheDocument();
  });

  it("hides active download badge when queue has no active items", () => {
    renderWithProviders(<AppHeader />);

    expect(screen.queryByText("app.activeDownloads")).not.toBeInTheDocument();
  });

  it("shows active download count for downloading items", () => {
    mockQueue = [{ ...baseItem, state: "downloading" }];

    renderWithProviders(<AppHeader />);

    expect(screen.getByText("app.activeDownloads")).toBeInTheDocument();
  });
});
