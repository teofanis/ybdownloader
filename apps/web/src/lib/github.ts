import { GITHUB_REPO_URL } from "@ybdownload/shared/urls";

const REPO = GITHUB_REPO_URL.replace("https://github.com/", "");

export interface ReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

export interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  html_url: string;
  body: string;
  assets: ReleaseAsset[];
  prerelease: boolean;
}

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "ybdownload-web",
};

async function fetchReleases(perPage = 20): Promise<GitHubRelease[]> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPO}/releases?per_page=${perPage}`,
      { headers }
    );
    if (!response.ok) return [];
    return (await response.json()) as GitHubRelease[];
  } catch {
    return [];
  }
}

export function isDesktopRelease(release: GitHubRelease): boolean {
  return (
    release.tag_name.startsWith("v") && !release.tag_name.startsWith("ext-")
  );
}

export function isExtensionRelease(release: GitHubRelease): boolean {
  return release.tag_name.startsWith("ext-v");
}

export async function getDesktopReleases(): Promise<GitHubRelease[]> {
  const releases = await fetchReleases();
  return releases.filter(isDesktopRelease);
}

export async function getExtensionReleases(): Promise<GitHubRelease[]> {
  const releases = await fetchReleases();
  return releases.filter(isExtensionRelease);
}

export async function getLatestDesktopRelease(): Promise<GitHubRelease | null> {
  const releases = await getDesktopReleases();
  return releases.find((release) => !release.prerelease) ?? releases[0] ?? null;
}

export async function getLatestExtensionRelease(): Promise<GitHubRelease | null> {
  const releases = await getExtensionReleases();
  return releases.find((release) => !release.prerelease) ?? releases[0] ?? null;
}

export function findAsset(
  release: GitHubRelease | null,
  pattern: RegExp
): ReleaseAsset | undefined {
  return release?.assets.find((asset) => pattern.test(asset.name));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}
