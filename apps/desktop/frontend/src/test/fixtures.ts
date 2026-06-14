import type { QueueItem, UpdateInfo } from "@/types";

export function mockUpdateInfo(
  overrides: Partial<UpdateInfo> = {}
): UpdateInfo {
  return {
    currentVersion: "1.2.3",
    latestVersion: "1.2.3",
    releaseNotes: "",
    releaseUrl: "https://github.com/example/releases/tag/v1.2.3",
    downloadUrl: "https://github.com/example/releases/download/v1.2.3/app",
    downloadSize: 0,
    status: "up_to_date",
    progress: 0,
    prerelease: false,
    ...overrides,
  };
}

export function mockQueueItem(overrides: Partial<QueueItem> = {}): QueueItem {
  return {
    id: "item-1",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    state: "queued",
    format: "mp3",
    savePath: "/downloads",
    filePath: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}
