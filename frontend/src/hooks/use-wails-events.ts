import { useEffect } from "react";
import { useAppStore } from "@/store";
import { Events } from "@/lib/api";
import type { QueueItem, DownloadProgress } from "@/types";

/**
 * Hook for subscribing to Wails backend events.
 * Sets up listeners for queue updates and download progress events.
 * Automatically cleans up subscriptions on unmount.
 */
export function useWailsEvents() {
  const setQueue = useAppStore((s) => s.setQueue);
  const updateProgress = useAppStore((s) => s.updateProgress);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        const rt = await import("../../wailsjs/runtime/runtime");
        const unsub1 = rt.EventsOn(Events.QUEUE_UPDATED, (q: QueueItem[]) => setQueue(q));
        const unsub2 = rt.EventsOn(Events.DOWNLOAD_PROGRESS, (p: DownloadProgress) => updateProgress(p));
        cleanup = () => { unsub1(); unsub2(); };
      } catch {}
    })();

    return () => cleanup?.();
  }, [setQueue, updateProgress]);
}
