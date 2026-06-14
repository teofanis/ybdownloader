import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import { liveJsonIntegration } from "./src/integrations/live-json.mjs";

export default defineConfig({
  site: process.env.SITE_URL ?? "https://ybdownloader.pages.dev",
  integrations: [tailwind({ applyBaseStyles: false }), liveJsonIntegration()],
  output: "static",
  compressHTML: true,
  build: {
    inlineStylesheets: "auto",
  },
});
