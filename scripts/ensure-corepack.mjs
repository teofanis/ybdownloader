#!/usr/bin/env node
/**
 * Ensure install runs with the pnpm version from package.json → packageManager (Corepack).
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const packageManager = pkg.packageManager;

if (!packageManager?.startsWith("pnpm@")) {
  console.error(
    `packageManager must be pnpm@x.y.z (got: ${packageManager ?? "unset"})`,
  );
  process.exit(1);
}

const expectedVersion = packageManager.slice("pnpm@".length);

function run(cmd, args, { capture = false } = {}) {
  return execFileSync(cmd, args, {
    encoding: "utf8",
    stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit",
  });
}

function version(cmd, args) {
  try {
    return run(cmd, args, { capture: true }).trim();
  } catch {
    return "";
  }
}

function runningPnpmVersion() {
  const userAgent = process.env.npm_config_user_agent ?? "";
  const fromAgent = userAgent.match(/pnpm\/([\d.]+)/)?.[1];
  if (fromAgent) {
    return fromAgent;
  }
  return version("pnpm", ["-v"]);
}

function activatePinnedPnpm() {
  try {
    run("corepack", ["enable"], { capture: true });
  } catch {
    console.error(
      "corepack enable failed. Use Node.js 24+ (Corepack is bundled).",
    );
    process.exit(1);
  }

  try {
    run("corepack", ["prepare", `pnpm@${expectedVersion}`, "--activate"], {
      capture: true,
    });
  } catch {
    console.error(
      `corepack prepare pnpm@${expectedVersion} --activate failed.`,
    );
    process.exit(1);
  }
}

function failShadowed(pathVersion, corepackVersion) {
  console.error(
    `pnpm on PATH is ${pathVersion}, but this repo requires ${expectedVersion} via Corepack.`,
  );
  console.error(
    "A standalone pnpm install is shadowing Corepack. Either remove it from PATH",
  );
  console.error("or run: corepack pnpm install");
  if (corepackVersion && corepackVersion !== expectedVersion) {
    console.error(
      `(Corepack reports pnpm ${corepackVersion}; run: corepack prepare pnpm@${expectedVersion} --activate)`,
    );
  }
  process.exit(1);
}

const runningVersion = runningPnpmVersion();
if (runningVersion === expectedVersion) {
  process.exit(0);
}

const pathVersion = version("pnpm", ["-v"]);
const corepackVersion = version("corepack", ["pnpm", "-v"]);

if (corepackVersion === expectedVersion && pathVersion !== expectedVersion) {
  failShadowed(pathVersion, corepackVersion);
}

activatePinnedPnpm();

const runningAfter = runningPnpmVersion();
if (runningAfter === expectedVersion) {
  process.exit(0);
}

const pathAfter = version("pnpm", ["-v"]);
const corepackAfter = version("corepack", ["pnpm", "-v"]);

if (corepackAfter === expectedVersion && pathAfter !== expectedVersion) {
  failShadowed(pathAfter, corepackAfter);
}

console.error(
  `pnpm version mismatch: expected ${expectedVersion} (packageManager), running ${runningAfter || "unknown"}.`,
);
console.error(
  `Run: corepack enable && corepack prepare pnpm@${expectedVersion} --activate`,
);
console.error("Then: corepack pnpm install");
process.exit(1);
