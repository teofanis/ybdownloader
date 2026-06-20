#!/usr/bin/env node
/**
 * Post or update a PR comment with Lighthouse representative-run summaries.
 * Reads apps/web/.lighthouseci/manifest.json (run from apps/web).
 */
import fs from "node:fs";
import path from "node:path";

const MARKER = "<!-- ybdownload-lighthouse -->";
const manifestPath =
  process.env.LIGHTHOUSE_MANIFEST ??
  path.join(".lighthouseci", "manifest.json");

function score(value) {
  return value == null ? "—" : String(Math.round(value * 100));
}

function pathnameFromUrl(url) {
  try {
    const { pathname } = new URL(url);
    return pathname === "" ? "/" : pathname;
  } catch {
    return url;
  }
}

function loadMetrics(jsonPath) {
  const report = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const { audits } = report;
  return {
    lcp: audits["largest-contentful-paint"]?.displayValue ?? "—",
    cls: audits["cumulative-layout-shift"]?.displayValue ?? "—",
    tbt: audits["total-blocking-time"]?.displayValue ?? "—",
  };
}

function buildBody(rows, runUrl) {
  const lines = [
    MARKER,
    "### Lighthouse (mobile lab)",
    "",
    "Median representative runs from this workflow:",
    "",
    "| Page | Perf | A11y | LCP | CLS | TBT |",
    "| --- | ---: | ---: | --- | --- | --- |",
    ...rows.map(
      (row) =>
        `| \`${row.page}\` | ${row.perf} | ${row.a11y} | ${row.lcp} | ${row.cls} | ${row.tbt} |`
    ),
    "",
    runUrl
      ? `Download full HTML reports from the [workflow artifacts](${runUrl}) (\`lighthouse-report\`).`
      : "Download full HTML reports from the workflow artifacts (`lighthouse-report`).",
  ];
  return lines.join("\n");
}

async function githubRequest(route, { method = "GET", body } = {}) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is required");

  const response = await fetch(`https://api.github.com${route}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `GitHub API ${method} ${route} failed: ${response.status} ${text}`
    );
  }

  if (response.status === 204) return null;
  return response.json();
}

async function main() {
  const prNumber = process.env.PR_NUMBER;
  const repo = process.env.REPO;
  const runUrl = process.env.RUN_URL ?? "";

  if (!prNumber || !repo) {
    console.log("Skipping Lighthouse PR comment (not a pull_request).");
    return;
  }

  if (!fs.existsSync(manifestPath)) {
    console.log(
      `Skipping Lighthouse PR comment (no manifest at ${manifestPath}).`
    );
    return;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const representative = manifest.filter((entry) => entry.isRepresentativeRun);

  const rows = representative.map((entry) => {
    const metrics = loadMetrics(entry.jsonPath);
    return {
      page: pathnameFromUrl(entry.url),
      perf: score(entry.summary?.performance),
      a11y: score(entry.summary?.accessibility),
      lcp: metrics.lcp,
      cls: metrics.cls,
      tbt: metrics.tbt,
    };
  });

  if (rows.length === 0) {
    console.log("Skipping Lighthouse PR comment (no representative runs).");
    return;
  }

  const body = buildBody(rows, runUrl);
  const [owner, name] = repo.split("/");

  const comments = await githubRequest(
    `/repos/${owner}/${name}/issues/${prNumber}/comments`
  );
  const existing = comments.find((comment) => comment.body?.includes(MARKER));

  if (existing) {
    await githubRequest(
      `/repos/${owner}/${name}/issues/comments/${existing.id}`,
      { method: "PATCH", body: { body } }
    );
    console.log("Updated Lighthouse PR comment.");
    return;
  }

  await githubRequest(`/repos/${owner}/${name}/issues/${prNumber}/comments`, {
    method: "POST",
    body: { body },
  });
  console.log("Created Lighthouse PR comment.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
