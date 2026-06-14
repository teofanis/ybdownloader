import { site } from "../data/site";
import { patchLiveData, type LiveData } from "./live-data";

export async function refreshLiveData(): Promise<void> {
  if (typeof document === "undefined") return;

  try {
    const response = await fetch("/live.json", {
      credentials: "same-origin",
      priority: "low",
    });
    if (!response.ok) return;

    const data = (await response.json()) as LiveData;
    if (
      typeof data.stars !== "number" ||
      typeof data.version !== "string" ||
      typeof data.builtAt !== "string"
    ) {
      return;
    }

    patchLiveData(document, data, site.name);
  } catch {
    // Keep build-time fallbacks when live.json is unavailable.
  }
}

/** Defer live refresh until after paint — live data is non-critical. */
export function scheduleLiveDataRefresh(): void {
  if (typeof window === "undefined") return;

  const run = () => {
    void refreshLiveData();
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(run, { timeout: 2_000 });
    return;
  }
  // @ts-expect-error: window.setTimeout is not typed
  window.setTimeout(run, 0);
}
