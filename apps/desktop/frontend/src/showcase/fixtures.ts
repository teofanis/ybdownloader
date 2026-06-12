import type {
  QueueItemWithProgress,
  Settings,
  TabId,
  YouTubeSearchResult,
} from "@/types";
import type {
  ConversionJob,
  ConversionPreset,
} from "@/features/converter/types";

export const showcaseSettings: Settings = {
  version: 1,
  defaultSavePath: "/home/user/Downloads/YBDownloader",
  defaultFormat: "mp3",
  defaultAudioQuality: "192",
  defaultVideoQuality: "720p",
  maxConcurrentDownloads: 3,
  downloadBackend: "yt-dlp",
  language: "en",
  themeMode: "dark",
  accentColor: "red",
};

const now = new Date().toISOString();

export const showcaseBrowseResults: YouTubeSearchResult[] = [
  {
    id: "aqz-KE-bpKQ",
    title: "Deep Focus — Ambient Electronic Mix",
    author: "Night Studio",
    duration: "2:14:08",
    durationSec: 8048,
    thumbnail: "https://i.ytimg.com/vi/aqz-KE-bpKQ/mqdefault.jpg",
    viewCount: "4.2M",
    publishedAt: "3 months ago",
    url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
  },
  {
    id: "5qap5aO4i9A",
    title: "Jazz Cafe — Morning Playlist",
    author: "Blue Note Sessions",
    duration: "1:08:42",
    durationSec: 4122,
    thumbnail: "https://i.ytimg.com/vi/5qap5aO4i9A/mqdefault.jpg",
    viewCount: "1.8M",
    publishedAt: "1 year ago",
    url: "https://www.youtube.com/watch?v=5qap5aO4i9A",
  },
  {
    id: "DWcJFNfaw9c",
    title: "Lo-Fi Beats to Code To",
    author: "Desk Radio",
    duration: "3:02:15",
    durationSec: 10935,
    thumbnail: "https://i.ytimg.com/vi/DWcJFNfaw9c/mqdefault.jpg",
    viewCount: "12M",
    publishedAt: "2 years ago",
    url: "https://www.youtube.com/watch?v=DWcJFNfaw9c",
  },
  {
    id: "jfKfPfyJRdk",
    title: "Study Session — Piano & Rain",
    author: "Quiet Hours",
    duration: "58:20",
    durationSec: 3500,
    thumbnail: "https://i.ytimg.com/vi/jfKfPfyJRdk/mqdefault.jpg",
    viewCount: "6.1M",
    publishedAt: "8 months ago",
    url: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
  },
];

export const showcaseQueue: QueueItemWithProgress[] = [
  {
    id: "showcase-1",
    url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    state: "downloading",
    format: "mp3",
    metadata: {
      id: "aqz-KE-bpKQ",
      title: "Deep Focus — Ambient Electronic Mix",
      author: "Night Studio",
      duration: 8048,
      thumbnail: "https://i.ytimg.com/vi/aqz-KE-bpKQ/mqdefault.jpg",
    },
    savePath: "/home/user/Downloads/YBDownloader",
    createdAt: now,
    updatedAt: now,
    progress: {
      itemId: "showcase-1",
      state: "downloading",
      percent: 62,
      downloadedBytes: 48_500_000,
      totalBytes: 78_200_000,
      speed: 2_400_000,
      eta: 12,
    },
  },
  {
    id: "showcase-2",
    url: "https://www.youtube.com/watch?v=5qap5aO4i9A",
    state: "completed",
    format: "m4a",
    metadata: {
      id: "5qap5aO4i9A",
      title: "Jazz Cafe — Morning Playlist",
      author: "Blue Note Sessions",
      duration: 4122,
      thumbnail: "https://i.ytimg.com/vi/5qap5aO4i9A/mqdefault.jpg",
    },
    savePath: "/home/user/Downloads/YBDownloader",
    filePath: "/home/user/Downloads/YBDownloader/Jazz Cafe.m4a",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "showcase-3",
    url: "https://www.youtube.com/watch?v=DWcJFNfaw9c",
    state: "ready",
    format: "mp4",
    metadata: {
      id: "DWcJFNfaw9c",
      title: "Lo-Fi Beats to Code To",
      author: "Desk Radio",
      duration: 10935,
      thumbnail: "https://i.ytimg.com/vi/DWcJFNfaw9c/mqdefault.jpg",
    },
    savePath: "/home/user/Downloads/YBDownloader",
    createdAt: now,
    updatedAt: now,
  },
];

export const showcasePresets: ConversionPreset[] = [
  {
    id: "audio-mp3-high",
    name: "MP3 High Quality",
    description: "320 kbps stereo MP3",
    category: "audio",
    outputExt: "mp3",
  },
  {
    id: "audio-m4a",
    name: "M4A AAC",
    description: "Apple-friendly AAC audio",
    category: "audio",
    outputExt: "m4a",
  },
  {
    id: "video-mp4-720",
    name: "MP4 720p",
    description: "H.264 video at 720p",
    category: "video",
    outputExt: "mp4",
  },
  {
    id: "video-webm",
    name: "WebM VP9",
    description: "Web-optimized WebM",
    category: "video",
    outputExt: "webm",
  },
  {
    id: "gif",
    name: "Animated GIF",
    description: "Short clip as GIF",
    category: "gif",
    outputExt: "gif",
  },
  {
    id: "trim",
    name: "Trim & Export",
    description: "Cut a segment with waveform",
    category: "trim",
    outputExt: "mp4",
  },
];

export const showcaseConversionJobs: ConversionJob[] = [
  {
    id: "conv-1",
    inputPath: "/home/user/Videos/interview-raw.mp4",
    outputPath: "/home/user/Videos/interview-trimmed.mp4",
    presetId: "trim",
    state: "converting",
    progress: 44,
    duration: 320,
    currentTime: 140,
  },
  {
    id: "conv-2",
    inputPath: "/home/user/Music/podcast.wav",
    outputPath: "/home/user/Music/podcast.mp3",
    presetId: "audio-mp3-high",
    state: "completed",
    progress: 100,
  },
];

export function getSceneTab(scene: string | null): TabId {
  switch (scene) {
    case "browse":
    case "converter":
    case "settings":
    case "about":
      return scene;
    default:
      return "downloads";
  }
}
