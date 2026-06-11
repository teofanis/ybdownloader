import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { QueueList } from "./QueueList";
import type { QueueItemWithProgress } from "@/types";

const item: QueueItemWithProgress = {
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
    title: "Listed video",
    author: "Author",
    duration: 120,
    thumbnail: "https://example.com/thumb.jpg",
  },
};

vi.mock("@/store", () => ({
  useAppStore: vi.fn(
    (selector: (state: { queue: QueueItemWithProgress[] }) => unknown) =>
      selector({ queue: [item] })
  ),
}));

describe("QueueList", () => {
  it("renders queue items", () => {
    renderWithProviders(<QueueList />);
    expect(screen.getByText("Listed video")).toBeInTheDocument();
  });
});
