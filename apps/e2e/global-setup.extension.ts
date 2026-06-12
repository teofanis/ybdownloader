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

export default async function globalSetup(): Promise<void> {
  const manifestPath = path.join(EXTENSION_BUILD_DIR, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    await runCommand(
      "pnpm",
      ["--filter", "@ybdownload/extension", "build:chrome"],
      REPO_ROOT,
    );
  }
}
