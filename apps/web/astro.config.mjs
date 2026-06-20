import { defineConfig } from "astro/config";
import { liveJsonIntegration } from "./src/integrations/live-json.mjs";

export default defineConfig({
  site: process.env.SITE_URL ?? "https://ybdownload.pages.dev",
  integrations: [liveJsonIntegration()],
  output: "static",
  compressHTML: true,
  build: {
    inlineStylesheets: "auto",
  },
});
