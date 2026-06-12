import crypto from "node:crypto";
import fs from "node:fs";

/**
 * Deterministic extension id for an unpacked MV3 build (Chrome hashes the absolute path).
 * Used when the extension has no service worker (Plasmo popup + content scripts only).
 */
export function extensionIdFromPath(extensionDir: string): string {
  const absolutePath = fs.realpathSync(extensionDir);
  const hash = crypto
    .createHash("sha256")
    .update(absolutePath)
    .digest("hex")
    .slice(0, 32);

  return [...hash]
    .map((char) => String.fromCharCode(97 + Number.parseInt(char, 16)))
    .join("");
}
