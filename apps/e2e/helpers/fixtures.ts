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

export const SAMPLE_DOWNLOADING_ITEM = {
  ...SAMPLE_QUEUE_ITEM,
  id: "e2e-downloading-1",
  state: "downloading" as const,
};

export const SAMPLE_SEARCH_RESULTS = [
  {
    id: "search-1",
    title: "E2E Search Video One",
    author: "Channel A",
    duration: "3:30",
    durationSec: 210,
    thumbnail: "",
    viewCount: "1.2M views",
    publishedAt: "2 days ago",
    url: VIDEO_SAMPLES.youtube.valid,
  },
  {
    id: "search-2",
    title: "E2E Search Video Two",
    author: "Channel B",
    duration: "5:00",
    durationSec: 300,
    thumbnail: "",
    viewCount: "500K views",
    publishedAt: "1 week ago",
    url: VIDEO_SAMPLES.youtube.validShort,
  },
] as const;

export const SAMPLE_TRENDING_RESULTS = [
  {
    id: "trend-1",
    title: "E2E Trending Hit",
    author: "Trending Channel",
    duration: "4:20",
    durationSec: 260,
    thumbnail: "",
    viewCount: "10M views",
    publishedAt: "Today",
    url: VIDEO_SAMPLES.youtube.valid,
  },
  {
    id: "trend-2",
    title: "E2E Trending Runner Up",
    author: "Another Channel",
    duration: "8:15",
    durationSec: 495,
    thumbnail: "",
    viewCount: "2M views",
    publishedAt: "Yesterday",
    url: VIDEO_SAMPLES.youtube.validShort,
  },
] as const;

export const SAMPLE_MEDIA_FILE = "/tmp/e2e-sample.mp4";

export const SAMPLE_MEDIA_INFO = {
  duration: 120,
  format: "mp4",
  size: 10_000_000,
  bitrate: 1_000_000,
  videoStream: {
    codec: "h264",
    width: 1920,
    height: 1080,
    fps: 30,
    bitrate: 800_000,
  },
  audioStream: {
    codec: "aac",
    channels: 2,
    sampleRate: 48_000,
    bitrate: 128_000,
  },
};

export const SAMPLE_CONVERSION_PRESETS = [
  {
    id: "audio-mp3-320",
    name: "MP3 High Quality",
    description: "320 kbps MP3",
    category: "audio",
    outputExt: "mp3",
  },
  {
    id: "video-mp4-h264",
    name: "MP4 Compatible",
    description: "H.264 MP4",
    category: "video",
    outputExt: "mp4",
  },
] as const;

export const SAMPLE_CONVERSION_JOB = {
  id: "e2e-conv-1",
  inputPath: SAMPLE_MEDIA_FILE,
  outputPath: "/tmp/e2e-sample.mp3",
  presetId: "audio-mp3-320",
  state: "converting",
  progress: 45,
  inputInfo: SAMPLE_MEDIA_INFO,
};
