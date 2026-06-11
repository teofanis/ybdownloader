export const GITHUB_REPO_URL = "https://github.com/teofanis/ybdownloader";
export const GITHUB_RELEASES_URL =
  "https://github.com/teofanis/ybdownloader/releases";
export const GITHUB_ISSUES_URL =
  "https://github.com/teofanis/ybdownloader/issues";
export const SPONSOR_URL = "https://buymeacoffee.com/teofanis";

/** Strip leading 'v' to avoid displaying "vv1.0.0". */
export function formatVersion(version: string): string {
  return version.replace(/^v/, "");
}
