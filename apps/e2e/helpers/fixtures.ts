import { VIDEO_SAMPLES } from "./data";

/** Sample queue row for mocked Wails state (see fixtures/wails-mock.ts). */
export const SAMPLE_QUEUE_ITEM = {
  id: "e2e-queued-1",
  url: VIDEO_SAMPLES.youtube.valid,
  state: "queued" as const,
  format: "mp3" as const,
  savePath: "/tmp",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  metadata: {
    id: "dQw4w9WgXcQ",
    title: "E2E Sample Video",
    author: "Test Channel",
    duration: 212,
    thumbnail: "",
  },
};

export const SAMPLE_COMPLETED_ITEM = {
  ...SAMPLE_QUEUE_ITEM,
  id: "e2e-completed-1",
  state: "completed" as const,
  filePath: "/tmp/e2e-sample.mp3",
};
