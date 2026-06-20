/** Marketing routes mirrored from apps/web/src/data/site.ts for e2e assertions. */
export const headerNavRoutes = [
  {
    path: "/app",
    navLabel: "App",
    heading: /Built for long sessions/i,
    pageTitle: /The app · YBDownloader/,
  },
  {
    path: "/download",
    navLabel: "Download",
    heading: /Desktop app/i,
    pageTitle: /Download · YBDownloader/,
  },
  {
    path: "/extension",
    navLabel: "Extension",
    heading: /YouTube download button/i,
    pageTitle: /Browser Extension · YBDownloader/,
  },
  {
    path: "/changelog",
    navLabel: "Changelog",
    heading: /Changelog/i,
    pageTitle: /Changelog · YBDownloader/,
  },
  {
    path: "/releases",
    navLabel: "Releases",
    heading: /Releases/i,
    pageTitle: /Releases · YBDownloader/,
  },
  {
    path: "/docs",
    navLabel: "Docs",
    heading: /Docs/i,
    pageTitle: /Docs · YBDownloader/,
  },
] as const;

export const homeHeroLinks = [
  { label: /Tour the app/i, path: "/app", heading: /Built for long sessions/i },
  {
    label: /Get the extension/i,
    path: "/extension",
    heading: /YouTube download button/i,
  },
] as const;
