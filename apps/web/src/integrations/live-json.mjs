import { fileURLToPath } from "node:url";
import {
  generateLiveJson,
  writeLiveJsonFile,
} from "../lib/generate-live-json.ts";

/** @typedef {import('astro').AstroIntegration} AstroIntegration */

/** @returns {AstroIntegration} */
export function liveJsonIntegration() {
  /** @type {import('node:url').URL | undefined} */
  let projectRoot;

  return {
    name: "ybdownload-live-json",
    hooks: {
      "astro:config:done": (config) => {
        projectRoot = config.root;
      },
      "astro:build:done": async ({ dir }) => {
        await writeLiveJsonFile(fileURLToPath(new URL("live.json", dir)));
      },
      "astro:server:start": async () => {
        if (!projectRoot) return;
        await generateLiveJson(projectRoot);
      },
    },
  };
}
