import type { ImageMetadata } from "astro";
import {
  PRODUCT_LABELS,
  PRODUCT_STATS,
  getProductHighlights,
} from "@ybdownload/shared/product";
import downloadsShot from "../assets/showcase/downloads.png";
import browseShot from "../assets/showcase/browse.png";
import converterShot from "../assets/showcase/converter.png";
import settingsShot from "../assets/showcase/settings.png";
import aboutShot from "../assets/showcase/about.png";

export interface ShowcaseSection {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  image: ImageMetadata;
  imageAlt: string;
  reverse?: boolean;
}

export const showcaseHero = {
  eyebrow: "Native app",
  title: "Built for long sessions.",
  description:
    "A native queue, in-app YouTube browse, FFmpeg converter, and deep settings — without leaving one window.",
  image: downloadsShot,
  imageAlt:
    "YBDownloader app in dark mode showing the download queue with active progress",
} as const;

export const showcaseSections: ShowcaseSection[] = [
  {
    id: "downloads",
    eyebrow: "Downloads",
    title: "Queue it. Run several at once.",
    description: `Paste links, import lists, pick ${PRODUCT_LABELS.formats}, and watch progress with speed and ETA — all in one place.`,
    bullets: [
      "Parallel downloads with a clear queue",
      "Per-item controls: start, retry, cancel, reveal in folder",
      "yt-dlp + FFmpeg under the hood",
    ],
    image: downloadsShot,
    imageAlt: "Download queue with active, completed, and ready items",
  },
  {
    id: "browse",
    eyebrow: "Browse",
    title: "Search and trending, inside the app.",
    description:
      "Discover videos without tab-hopping. Add anything to the queue in one click with your preferred format.",
    bullets: [
      "YouTube search with rich result cards",
      "Trending feed on launch",
      "Format picker stays in sync with downloads",
    ],
    image: browseShot,
    imageAlt: "Browse tab with trending YouTube results",
    reverse: true,
  },
  {
    id: "converter",
    eyebrow: "Converter",
    title: "FFmpeg when you need more than a download.",
    description:
      "Convert local files with presets for audio, video, GIF, resize, and trim — plus a live conversion queue.",
    bullets: [
      "Preset browser for common outputs",
      "Trim with waveform for precise cuts",
      "Batch-friendly conversion queue",
    ],
    image: converterShot,
    imageAlt: "FFmpeg converter with presets and conversion queue",
  },
  {
    id: "settings",
    eyebrow: "Settings",
    title: "Tune the engine. Make it yours.",
    description: `Paths, concurrency, yt-dlp flags, FFmpeg status, themes, accents, and ${PRODUCT_STATS.locales} languages — all in settings.`,
    bullets: [
      "Light, dark, and system themes",
      "Accent colors across the UI",
      "Download engine and tooling controls",
    ],
    image: settingsShot,
    imageAlt: "Settings tab with theme and download engine options",
    reverse: true,
  },
  {
    id: "about",
    eyebrow: "About",
    title: "Open source. Ready to ship.",
    description:
      "Version info, update checks, GitHub links, and sponsor support — the app stays transparent about what it runs.",
    bullets: [
      "In-app update checks",
      "Quick links to releases and issues",
      "MIT licensed desktop app",
    ],
    image: aboutShot,
    imageAlt: "About tab with version and project links",
  },
];

export const showcaseHighlights = getProductHighlights();
