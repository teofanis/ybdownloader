import { create } from "zustand";
import type {
  QueueItemWithProgress,
  Settings,
  TabId,
  DownloadProgress,
  Format,
} from "@/types";
import type { YouTubeSearchResult } from "@/lib/api";

/**
 * Global application state interface.
 * Manages queue, settings, UI state, and user inputs.
 */
interface AppStore {
  activeTab: TabId;
  isInitialized: boolean;
  queue: QueueItemWithProgress[];
  isQueueLoading: boolean;
  settings: Settings | null;
  isSettingsLoading: boolean;
  urlInput: string;
  selectedFormat: Format;
  isAddingToQueue: boolean;
  error: string | null;

  // Browse tab state (persisted across tab switches)
  browseSearchQuery: string;
  browseResults: YouTubeSearchResult[];
  browseActiveTab: "search" | "trending";

  setActiveTab: (tab: TabId) => void;
  setInitialized: (v: boolean) => void;
  setError: (e: string | null) => void;
  setQueue: (q: QueueItemWithProgress[]) => void;
  updateQueueItem: (
    id: string,
    updates: Partial<QueueItemWithProgress>
  ) => void;
  removeQueueItem: (id: string) => void;
  updateProgress: (p: DownloadProgress) => void;
  setQueueLoading: (v: boolean) => void;
  setSettings: (s: Settings | null) => void;
  setSettingsLoading: (v: boolean) => void;
  setUrlInput: (v: string) => void;
  setSelectedFormat: (f: Format) => void;
  setAddingToQueue: (v: boolean) => void;
  resetUrlInput: () => void;

  // Browse actions
  setBrowseSearchQuery: (q: string) => void;
  setBrowseResults: (r: YouTubeSearchResult[]) => void;
  setBrowseActiveTab: (t: "search" | "trending") => void;
}

/**
 * Zustand store for global application state.
 * Provides reactive state management across all components.
 */
export const useAppStore = create<AppStore>()((set) => ({
  activeTab: "downloads",
  isInitialized: false,
  queue: [],
  isQueueLoading: false,
  settings: null,
  isSettingsLoading: false,
  urlInput: "",
  selectedFormat: "mp3",
  isAddingToQueue: false,
  error: null,

  // Browse tab state
  browseSearchQuery: "",
  browseResults: [],
  browseActiveTab: "search",

  setActiveTab: (activeTab) => set({ activeTab }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  setError: (error) => set({ error }),
  setQueue: (newQueue) =>
    set((s) => ({
      // Preserve progress data from existing items when updating queue
      queue: newQueue.map((item) => {
        const existing = s.queue.find((i) => i.id === item.id);
        return existing?.progress
          ? { ...item, progress: existing.progress }
          : item;
      }),
    })),
  updateQueueItem: (id, updates) =>
    set((s) => ({
      queue: s.queue.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    })),
  removeQueueItem: (id) =>
    set((s) => ({ queue: s.queue.filter((i) => i.id !== id) })),
  updateProgress: (p) =>
    set((s) => ({
      queue: s.queue.map((i) =>
        i.id === p.itemId ? { ...i, state: p.state, progress: p } : i
      ),
    })),
  setQueueLoading: (isQueueLoading) => set({ isQueueLoading }),
  setSettings: (settings) => set({ settings }),
  setSettingsLoading: (isSettingsLoading) => set({ isSettingsLoading }),
  setUrlInput: (urlInput) => set({ urlInput }),
  setSelectedFormat: (selectedFormat) => set({ selectedFormat }),
  setAddingToQueue: (isAddingToQueue) => set({ isAddingToQueue }),
  resetUrlInput: () => set({ urlInput: "", isAddingToQueue: false }),

  // Browse actions
  setBrowseSearchQuery: (browseSearchQuery) => set({ browseSearchQuery }),
  setBrowseResults: (browseResults) => set({ browseResults }),
  setBrowseActiveTab: (browseActiveTab) => set({ browseActiveTab }),
}));
