// Strip leading 'v' if present to avoid "vv1.0.0"
export function formatVersion(v: string): string {
  return v.replace(/^v/, "");
}

export const GITHUB_RELEASES_URL = "https://github.com/teofanis/ybdownloader/releases";

