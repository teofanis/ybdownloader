#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const require = createRequire(
  path.join(root, "apps/e2e/package.json")
);
const { chromium } = require("@playwright/test");
const frontendDir = path.join(root, "apps/desktop/frontend");
const outputDir = path.join(root, "apps/web/src/assets/showcase");
const port = 5199;
const scenes = ["downloads", "browse", "converter", "settings", "about"];

function waitForUrl(url, timeoutMs = 60_000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const response = await fetch(url, { redirect: "follow" });
        if (response.ok) {
          resolve(undefined);
          return;
        }
      } catch {
        // server still starting
      }

      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Timed out waiting for ${url}`));
        return;
      }

      setTimeout(tick, 400);
    };

    tick();
  });
}

async function killPort(port) {
  try {
    const child = spawn("fuser", [`${port}/tcp`, "-k"], {
      stdio: "ignore",
    });
    await new Promise((resolve) => child.on("close", resolve));
  } catch {
    // fuser may be unavailable; capture can still reuse an existing server.
  }
}

function startVite() {
  const child = spawn(
    "pnpm",
    ["exec", "vite", "--mode", "showcase", "--port", String(port)],
    {
      cwd: frontendDir,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env },
    }
  );

  child.stdout.on("data", (chunk) => process.stdout.write(chunk));
  child.stderr.on("data", (chunk) => process.stderr.write(chunk));

  return child;
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  await killPort(port);

  const vite = startVite();
  const baseUrl = `http://127.0.0.1:${port}/showcase.html`;

  const shutdown = () => {
    if (!vite.killed) vite.kill("SIGTERM");
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  try {
    await waitForUrl(baseUrl);

    const browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 2,
    });

    for (const scene of scenes) {
      const url = `${baseUrl}?scene=${scene}`;
      console.log(`Capturing ${scene}…`);
      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForSelector("header", { timeout: 15_000 });
      await page.waitForTimeout(800);
      await page.screenshot({
        path: path.join(outputDir, `${scene}.png`),
        type: "png",
      });
    }

    await browser.close();
    console.log(`Saved ${scenes.length} screenshots to ${outputDir}`);
  } finally {
    shutdown();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
