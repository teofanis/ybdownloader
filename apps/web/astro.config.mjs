import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: process.env.SITE_URL ?? "https://ybdownloader.pages.dev",
  integrations: [tailwind({ applyBaseStyles: false })],
  output: "static",
  compressHTML: true,
  build: {
    inlineStylesheets: "auto",
  },
});
