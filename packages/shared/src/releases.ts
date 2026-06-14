export type UpdateChannel = "stable" | "beta";

export const UPDATE_CHANNEL_STABLE: UpdateChannel = "stable";
export const UPDATE_CHANNEL_BETA: UpdateChannel = "beta";

export interface ReleaseLike {
  tag_name: string;
  prerelease: boolean;
  draft?: boolean;
}

/** Desktop app tags: `v*` but not `ext-v*`. */
export function isDesktopReleaseTag(tagName: string): boolean {
  return tagName.startsWith("v") && !tagName.startsWith("ext-");
}

/** Browser extension tags: `ext-v*`. */
export function isExtensionReleaseTag(tagName: string): boolean {
  return tagName.startsWith("ext-v");
}

/** True when a version string contains beta/alpha/rc prerelease segments. */
export function isPrereleaseVersion(version: string): boolean {
  const normalized = version.replace(/^v/, "");
  return /-(beta|alpha|rc)(\.|$|-)/i.test(normalized);
}

export function normalizeUpdateChannel(
  channel: string | undefined,
): UpdateChannel {
  return channel === UPDATE_CHANNEL_BETA
    ? UPDATE_CHANNEL_BETA
    : UPDATE_CHANNEL_STABLE;
}

/** Whether a GitHub release matches the selected update channel. */
export function matchesUpdateChannel(
  release: ReleaseLike,
  channel: UpdateChannel,
): boolean {
  if (release.draft) return false;
  if (!isDesktopReleaseTag(release.tag_name)) return false;
  return channel === UPDATE_CHANNEL_BETA
    ? release.prerelease
    : !release.prerelease;
}

/**
 * Pick the newest matching desktop release (GitHub list is newest-first).
 * Returns null when no stable/prerelease desktop release exists for the channel.
 */
export function selectLatestDesktopRelease<T extends ReleaseLike>(
  releases: T[],
  channel: UpdateChannel = UPDATE_CHANNEL_STABLE,
): T | null {
  return (
    releases.find((release) => matchesUpdateChannel(release, channel)) ?? null
  );
}

export function partitionDesktopReleases<T extends ReleaseLike>(
  releases: T[],
): { stable: T[]; prerelease: T[] } {
  const desktop = releases.filter((release) =>
    isDesktopReleaseTag(release.tag_name),
  );
  return {
    stable: desktop.filter((release) => !release.prerelease),
    prerelease: desktop.filter((release) => release.prerelease),
  };
}
