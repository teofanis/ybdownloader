import { useEffect } from "react";
import { useAppStore } from "@/store";
import * as api from "@/lib/api";
import type { QueueItemWithProgress, DownloadProgress } from "@/types";

/**
 * Hook that subscribes to Wails backend events and syncs state.
 * Also loads initial queue from the backend.
 */
export function useWailsEvents() {
  const setQueue = useAppStore((s) => s.setQueue);
  const updateProgress = useAppStore((s) => s.updateProgress);
  const setQueueLoading = useAppStore((s) => s.setQueueLoading);

  // Load initial queue from backend
  useEffect(() => {
    async function loadInitialQueue() {
      setQueueLoading(true);
      try {
        const items = await api.getQueue();
        setQueue((items ?? []) as QueueItemWithProgress[]);
      } catch (e) {
        console.error("Failed to load queue:", e);
      } finally {
        setQueueLoading(false);
      }
    }
    loadInitialQueue();
  }, [setQueue, setQueueLoading]);

  // Subscribe to Wails events
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        const rt = await import("../../wailsjs/runtime/runtime");

        const unsub1 = rt.EventsOn(
          api.Events.QUEUE_UPDATED,
          (items: QueueItemWithProgress[]) => {
            setQueue(items ?? []);
          }
        );

        const unsub2 = rt.EventsOn(
          api.Events.DOWNLOAD_PROGRESS,
          (progress: DownloadProgress) => {
            updateProgress(progress);
          }
        );

        const unsub3 = rt.EventsOn(
          api.Events.DOWNLOAD_COMPLETE,
          (data: { itemId: string; filePath: string }) => {
            // Queue will be updated via QUEUE_UPDATED event
            console.log("Download complete:", data);
          }
        );

        const unsub4 = rt.EventsOn(
          api.Events.DOWNLOAD_ERROR,
          (data: { itemId: string; error: string }) => {
            console.error("Download error:", data);
          }
        );

        cleanup = () => {
          unsub1();
          unsub2();
          unsub3();
          unsub4();
        };
      } catch (e) {
        console.warn("Wails runtime unavailable:", e);
      }
    })();

    return () => cleanup?.();
  }, [setQueue, updateProgress]);
}
