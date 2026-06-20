import {
  centerStripScrollLeft,
  isMobileShowcaseNav,
  parseShowcaseSectionIds,
  pickActiveSectionId,
  shouldShowFloatNav,
  SHOWCASE_HEADER_FALLBACK_HEIGHT,
} from "./showcase-nav";

let teardown: (() => void) | undefined;

function setFloatingNavVisible(floater: HTMLElement, show: boolean): void {
  floater.dataset.visible = show ? "true" : "false";
  if (show) {
    floater.removeAttribute("inert");
  } else {
    floater.setAttribute("inert", "");
  }
}

function scrollActiveNavStrip(
  id: string,
  floatVisible: boolean,
  { smooth = false }: { smooth?: boolean } = {}
): void {
  if (!isMobileShowcaseNav(window.innerWidth)) return;

  const floater = document.getElementById("showcase-nav-float");
  const anchor = document.getElementById("showcase-nav-anchor");
  const root = floatVisible ? floater : anchor;
  if (!root) return;

  const strip = root.querySelector(".showcase-nav--strip");
  const link = root.querySelector(`.showcase-nav__link[data-section="${id}"]`);
  if (!(strip instanceof HTMLElement) || !(link instanceof HTMLElement)) return;

  const left = centerStripScrollLeft(
    link.offsetLeft,
    link.offsetWidth,
    strip.clientWidth,
    strip.scrollWidth
  );

  strip.scrollTo({ left, behavior: smooth ? "smooth" : "auto" });
}

export function teardownShowcaseNav(): void {
  teardown?.();
  teardown = undefined;
}

export function initShowcaseNav(): void {
  teardownShowcaseNav();

  const anchor = document.getElementById("showcase-nav-anchor");
  const floater = document.getElementById("showcase-nav-float");
  if (!anchor || !floater) return;

  const sectionIds = parseShowcaseSectionIds(anchor.dataset.sectionIds);
  if (sectionIds.length === 0) return;

  let floatVisible = floater.dataset.visible === "true";
  let floatFrame = 0;
  let scrollFrame = 0;
  let scrollTicking = false;
  let headerHeight = SHOWCASE_HEADER_FALLBACK_HEIGHT;
  const abort = new AbortController();

  let activeId = "";

  const measureHeaderHeight = (): void => {
    const header = document.querySelector("header");
    headerHeight = header
      ? Math.ceil(header.getBoundingClientRect().height)
      : SHOWCASE_HEADER_FALLBACK_HEIGHT;
  };

  const applyFloatVisibility = (show: boolean): void => {
    if (show === floatVisible) return;
    floatVisible = show;
    cancelAnimationFrame(floatFrame);
    floatFrame = requestAnimationFrame(() => {
      setFloatingNavVisible(floater, show);
      if (activeId) scrollActiveNavStrip(activeId, floatVisible);
    });
  };

  const updateFloatVisibility = (): void => {
    const { bottom } = anchor.getBoundingClientRect();
    applyFloatVisibility(shouldShowFloatNav(bottom, headerHeight));
  };

  const links = document.querySelectorAll(".showcase-nav__link");

  const setActive = (id: string, { syncStrip = true } = {}): void => {
    if (!id || id === activeId) return;
    activeId = id;

    links.forEach((link) => {
      const active = link instanceof HTMLElement && link.dataset.section === id;
      link.classList.toggle("is-active", active);
      if (active) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    if (syncStrip) scrollActiveNavStrip(id, floatVisible);
  };

  const updateActiveSection = (): void => {
    scrollTicking = false;

    const nextId = pickActiveSectionId(
      sectionIds,
      (id) => document.getElementById(id)?.getBoundingClientRect(),
      window.innerHeight
    );

    setActive(nextId);
  };

  const onScroll = (): void => {
    if (scrollTicking) return;
    scrollTicking = true;
    cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(() => {
      updateFloatVisibility();
      updateActiveSection();
    });
  };

  const onResize = (): void => {
    measureHeaderHeight();
    onScroll();
  };

  links.forEach((link) => {
    link.addEventListener(
      "click",
      () => {
        const id =
          link instanceof HTMLElement ? link.dataset.section : undefined;
        if (!id) return;
        requestAnimationFrame(() =>
          scrollActiveNavStrip(id, floatVisible, { smooth: true })
        );
      },
      { signal: abort.signal }
    );
  });

  window.addEventListener("scroll", onScroll, {
    passive: true,
    signal: abort.signal,
  });
  window.addEventListener("resize", onResize, {
    passive: true,
    signal: abort.signal,
  });

  measureHeaderHeight();
  updateFloatVisibility();
  updateActiveSection();

  teardown = () => {
    abort.abort();
    cancelAnimationFrame(floatFrame);
    cancelAnimationFrame(scrollFrame);
  };
}
