import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildLiveData, type LiveData } from "./live-data";
import { getLatestDesktopRelease, getRepoStarCount } from "./github";

export async function fetchLiveData(): Promise<LiveData> {
  const [stars, latest] = await Promise.all([
    getRepoStarCount(),
    getLatestDesktopRelease(),
  ]);

  return buildLiveData(stars, latest?.tag_name ?? null);
}

export async function writeLiveJsonFile(outPath: string): Promise<void> {
  const data = await fetchLiveData();
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export async function generateLiveJson(
  projectRoot: string | URL
): Promise<string> {
  const root =
    typeof projectRoot === "string" ? projectRoot : fileURLToPath(projectRoot);
  const outPath = path.join(root, "public", "live.json");
  await writeLiveJsonFile(outPath);
  return outPath;
}
