import {
  GITHUB_ISSUES_URL,
  GITHUB_RELEASES_URL,
  GITHUB_REPO_URL,
  SPONSOR_URL,
} from "@ybdownload/shared/urls";

export const site = {
  name: "YBDownloader",
  tagline: "Fast YouTube downloads, built native.",
  description:
    "Desktop app and browser extension for queuing YouTube downloads — MP3, M4A, MP4, WebM — with browse, convert, and themes.",
  github: GITHUB_REPO_URL,
  releases: GITHUB_RELEASES_URL,
  issues: GITHUB_ISSUES_URL,
  sponsor: SPONSOR_URL,
} as const;

export const features = [
  {
    title: "Queue & parallel downloads",
    body: "Paste URLs, import lists, and run multiple downloads with a clear queue.",
  },
  {
    title: "Browse & search YouTube",
    body: "Find videos and trending picks inside the app — add to queue in one click.",
  },
  {
    title: "FFmpeg converter",
    body: "Convert local media with presets for audio, video, resize, GIF, and trim.",
  },
  {
    title: "yt-dlp by default",
    body: "Robust downloads with bundled yt-dlp, FFmpeg, and optional legacy engine.",
  },
  {
    title: "Browser extension",
    body: "Floating download button on YouTube — sends videos straight to the desktop queue.",
  },
  {
    title: "Themes & i18n",
    body: "Light/dark modes, accent colors, and seven interface languages.",
  },
] as const;

export const nav = [
  { href: "/download", label: "Download" },
  { href: "/extension", label: "Extension" },
  { href: "/changelog", label: "Changelog" },
  { href: "/releases", label: "Releases" },
  { href: "/docs", label: "Docs" },
] as const;
