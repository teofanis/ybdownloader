import path from "node:path";
import { fileURLToPath } from "node:url";

const E2E_DIR = path.dirname(fileURLToPath(import.meta.url));

/** Unpacked Chrome MV3 production build (see global-setup.extension.ts). */
export const EXTENSION_BUILD_DIR = path.resolve(
  E2E_DIR,
  "../../extension/build/chrome-mv3-prod",
);
