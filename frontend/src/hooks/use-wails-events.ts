import { useEffect } from "react";
import { useAppStore } from "@/store";
import { Events } from "@/lib/api";
import type { QueueItem, DownloadProgress } from "@/types";

/**
 * Subscribe to Wails runtime events and update the store.
 * This hook should be called once in the App component.
 */
export function useWailsEvents() {
  const setQueue = useAppStore((state) => state.setQueue);
  const updateProgress = useAppStore((state) => state.updateProgress);

  useEffect(() => {
    // Dynamic import of Wails runtime
    let cleanup: (() => void) | undefined;

    async function setupEventListeners() {
      try {
        const runtime = await import("../../wailsjs/runtime/runtime");

        // Queue updated event
        const queueUnsubscribe = runtime.EventsOn(
          Events.QUEUE_UPDATED,
          (queue: QueueItem[]) => {
            setQueue(queue);
          }
        );

        // Download progress event
        const progressUnsubscribe = runtime.EventsOn(
          Events.DOWNLOAD_PROGRESS,
          (progress: DownloadProgress) => {
            updateProgress(progress);
          }
        );

        cleanup = () => {
          queueUnsubscribe();
          progressUnsubscribe();
        };
      } catch (error) {
        console.warn("Wails runtime not available:", error);
      }
    }

    setupEventListeners();

    return () => {
      cleanup?.();
    };
  }, [setQueue, updateProgress]);
}

