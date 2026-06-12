import { applyAccentTheme, applyThemeMode } from "@/lib/themes";
import { useAppStore } from "@/store";
import {
  getSceneTab,
  showcaseBrowseResults,
  showcaseQueue,
  showcaseSettings,
} from "./fixtures";
import type { TabId } from "@/types";

export function seedShowcase(scene: string | null): TabId {
  const tab = getSceneTab(scene);

  useAppStore.setState({
    activeTab: tab,
    isInitialized: true,
    settings: structuredClone(showcaseSettings),
    queue: structuredClone(showcaseQueue),
    browseResults: structuredClone(showcaseBrowseResults),
    browseActiveTab: "trending",
    browseSearchQuery: "",
    selectedFormat: "mp3",
    urlInput: "",
    isQueueLoading: false,
    isSettingsLoading: false,
  });

  applyThemeMode("dark");
  applyAccentTheme("red");

  return tab;
}
