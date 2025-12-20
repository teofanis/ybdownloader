import { create } from "zustand";

import type {
  QueueItemWithProgress,
  Settings,
  TabId,
  DownloadProgress,
  Format,
} from "@/types";

// ============================================================================
// Store State Types
// ============================================================================

interface AppState {
  // UI State
  activeTab: TabId;
  isInitialized: boolean;

  // Queue State
  queue: QueueItemWithProgress[];
  isQueueLoading: boolean;

  // Settings State
  settings: Settings | null;
  isSettingsLoading: boolean;

  // URL Input State
  urlInput: string;
  selectedFormat: Format;
  isAddingToQueue: boolean;

  // Error State
  error: string | null;
}

interface AppActions {
  // UI Actions
  setActiveTab: (tab: TabId) => void;
  setInitialized: (initialized: boolean) => void;
  setError: (error: string | null) => void;

  // Queue Actions
  setQueue: (queue: QueueItemWithProgress[]) => void;
  updateQueueItem: (
    id: string,
    updates: Partial<QueueItemWithProgress>
  ) => void;
  removeQueueItem: (id: string) => void;
  updateProgress: (progress: DownloadProgress) => void;
  setQueueLoading: (loading: boolean) => void;

  // Settings Actions
  setSettings: (settings: Settings | null) => void;
  setSettingsLoading: (loading: boolean) => void;

  // URL Input Actions
  setUrlInput: (url: string) => void;
  setSelectedFormat: (format: Format) => void;
  setAddingToQueue: (adding: boolean) => void;
  resetUrlInput: () => void;
}

// ============================================================================
// Store Implementation
// ============================================================================

const initialState: AppState = {
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
};

export const useAppStore = create<AppState & AppActions>()((set) => ({
  ...initialState,

  // UI Actions
  setActiveTab: (tab) => set({ activeTab: tab }),
  setInitialized: (initialized) => set({ isInitialized: initialized }),
  setError: (error) => set({ error }),

  // Queue Actions
  setQueue: (queue) => set({ queue }),

  updateQueueItem: (id, updates) =>
    set((state) => ({
      queue: state.queue.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),

  removeQueueItem: (id) =>
    set((state) => ({
      queue: state.queue.filter((item) => item.id !== id),
    })),

  updateProgress: (progress) =>
    set((state) => ({
      queue: state.queue.map((item) =>
        item.id === progress.itemId
          ? { ...item, state: progress.state, progress }
          : item
      ),
    })),

  setQueueLoading: (loading) => set({ isQueueLoading: loading }),

  // Settings Actions
  setSettings: (settings) => set({ settings }),
  setSettingsLoading: (loading) => set({ isSettingsLoading: loading }),

  // URL Input Actions
  setUrlInput: (url) => set({ urlInput: url }),
  setSelectedFormat: (format) => set({ selectedFormat: format }),
  setAddingToQueue: (adding) => set({ isAddingToQueue: adding }),
  resetUrlInput: () => set({ urlInput: "", isAddingToQueue: false }),
}));

// ============================================================================
// Selectors (for performance optimization)
// ============================================================================

export const selectActiveDownloads = (state: AppState) =>
  state.queue.filter(
    (item) =>
      item.state === "downloading" ||
      item.state === "converting" ||
      item.state === "fetching_metadata"
  );

export const selectQueuedItems = (state: AppState) =>
  state.queue.filter(
    (item) => item.state === "queued" || item.state === "ready"
  );

export const selectCompletedItems = (state: AppState) =>
  state.queue.filter((item) => item.state === "completed");

export const selectFailedItems = (state: AppState) =>
  state.queue.filter((item) => item.state === "failed");

export const selectHasActiveDownloads = (state: AppState) =>
  selectActiveDownloads(state).length > 0;
