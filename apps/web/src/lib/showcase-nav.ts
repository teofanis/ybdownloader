/** Matches Tailwind `sm` breakpoint (640px) — mobile strip scroll is below this width. */
export const SHOWCASE_NAV_MOBILE_MAX_WIDTH = 639;

/** Sections above this line are ignored for scroll-spy (sticky header clearance). */
export const SHOWCASE_SECTION_TOP_EXCLUSION = 96;

/** Viewport height ratio for the active-section marker line. */
export const SHOWCASE_ACTIVE_MARKER_RATIO = 0.33;

/** Section rect ratio used to approximate content center for scroll-spy. */
export const SHOWCASE_SECTION_CENTER_RATIO = 0.35;

export const SHOWCASE_HEADER_FALLBACK_HEIGHT = 72;

export interface SectionRect {
  top: number;
  bottom: number;
  height: number;
}

/** Float nav appears only after the inline nav has scrolled above the sticky header. */
export function shouldShowFloatNav(
  anchorBottom: number,
  headerHeight: number
): boolean {
  return anchorBottom <= headerHeight;
}

export function pickActiveSectionId(
  sectionIds: readonly string[],
  getSectionRect: (id: string) => SectionRect | null | undefined,
  viewportHeight: number
): string {
  const marker = viewportHeight * SHOWCASE_ACTIVE_MARKER_RATIO;
  let nextId = sectionIds[0] ?? "";
  let closest = Number.POSITIVE_INFINITY;

  for (const id of sectionIds) {
    const rect = getSectionRect(id);
    if (!rect) continue;

    if (
      rect.bottom < SHOWCASE_SECTION_TOP_EXCLUSION ||
      rect.top > viewportHeight
    ) {
      continue;
    }

    const center = rect.top + rect.height * SHOWCASE_SECTION_CENTER_RATIO;
    const distance = Math.abs(center - marker);

    if (distance < closest) {
      closest = distance;
      nextId = id;
    }
  }

  return nextId;
}

/** Horizontal scroll offset to center a nav link — never scrolls the page. */
export function centerStripScrollLeft(
  linkOffsetLeft: number,
  linkWidth: number,
  stripClientWidth: number,
  stripScrollWidth: number
): number {
  if (stripScrollWidth <= stripClientWidth) return 0;

  const targetLeft = linkOffsetLeft - (stripClientWidth - linkWidth) / 2;
  const maxLeft = stripScrollWidth - stripClientWidth;
  return Math.max(0, Math.min(targetLeft, maxLeft));
}

export function isMobileShowcaseNav(viewportWidth: number): boolean {
  return viewportWidth <= SHOWCASE_NAV_MOBILE_MAX_WIDTH;
}

export function parseShowcaseSectionIds(raw: string | undefined): string[] {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}
