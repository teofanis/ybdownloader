import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EXTENSION_BUILD_DIR } from "./helpers/extension-path";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

function runCommand(
  command: string,
  args: string[],
  cwd: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else
        reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
    });
  });
}

function assertExtensionBuild(): void {
  const manifestPath = path.join(EXTENSION_BUILD_DIR, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      `Extension build missing at ${EXTENSION_BUILD_DIR} (no manifest.json).`,
    );
  }

  const hasOverlayScript = fs
    .readdirSync(EXTENSION_BUILD_DIR)
    .some((file) => file.startsWith("youtube-overlay.") && file.endsWith(".js"));
  if (!hasOverlayScript) {
    throw new Error(
      `Extension build at ${EXTENSION_BUILD_DIR} is incomplete (no youtube-overlay script).`,
    );
  }
}

export default async function globalSetup(): Promise<void> {
  const manifestPath = path.join(EXTENSION_BUILD_DIR, "manifest.json");
  const shouldBuild = process.env.CI || !fs.existsSync(manifestPath);

  if (shouldBuild) {
    await runCommand(
      "pnpm",
      ["--filter", "@ybdownload/extension", "build"],
      REPO_ROOT,
    );
  }

  assertExtensionBuild();
}
