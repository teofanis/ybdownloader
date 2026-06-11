import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { BrowserOpenURL } from "../../../wailsjs/runtime/runtime";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store";
import * as api from "@/lib/api";
import type { YouTubeSearchResult } from "@/lib/api";
import { SearchHeader, ResultsPanel } from "./components";

export function BrowseTab() {
  const { t } = useTranslation();
  const { toast } = useToast();

  // Use store for persistent state across tab switches
  const selectedFormat = useAppStore((s) => s.selectedFormat);
  const setSelectedFormat = useAppStore((s) => s.setSelectedFormat);
  const searchQuery = useAppStore((s) => s.browseSearchQuery);
  const setSearchQuery = useAppStore((s) => s.setBrowseSearchQuery);
  const results = useAppStore((s) => s.browseResults);
  const setResults = useAppStore((s) => s.setBrowseResults);
  const activeTab = useAppStore((s) => s.browseActiveTab);
  const setActiveTab = useAppStore((s) => s.setBrowseActiveTab);

  // Local-only state
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
  const hasLoadedTrendingRef = useRef(false);

  const loadTrending = useCallback(async () => {
    setIsLoadingTrending(true);
    try {
      const response = await api.getTrendingVideos("US", 20);
      if (response?.results && response.results.length > 0) {
        setResults(response.results);
        setActiveTab("trending");
      } else {
        console.warn("Trending returned no results");
      }
    } catch (e) {
      console.error("Failed to load trending:", e);
      toast({
        title: t("errors.generic"),
        description: "Failed to load trending videos. Try searching instead.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTrending(false);
    }
  }, [setResults, setActiveTab, t, toast]);

  // Load trending on first mount (only if no results yet)
  useEffect(() => {
    if (results.length === 0 && !hasLoadedTrendingRef.current) {
      hasLoadedTrendingRef.current = true;
      loadTrending();
    }
  }, [results.length, loadTrending]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setActiveTab("search");
    try {
      const response = await api.searchYouTube(searchQuery, 20);
      if (response?.results) {
        setResults(response.results);
      }
    } catch (e) {
      toast({
        title: t("errors.generic"),
        description: String(e),
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, setResults, setActiveTab, t, toast]);

  const handleAddToQueue = useCallback(
    async (video: YouTubeSearchResult) => {
      setAddingIds((prev) => new Set(prev).add(video.id));
      try {
        await api.addToQueue(video.url, selectedFormat);
        toast({
          title: t("toasts.addedToQueue"),
          description: video.title,
        });
      } catch (e) {
        toast({
          title: t("errors.generic"),
          description: String(e),
          variant: "destructive",
        });
      } finally {
        setAddingIds((prev) => {
          const next = new Set(prev);
          next.delete(video.id);
          return next;
        });
      }
    },
    [selectedFormat, t, toast]
  );

  const handleOpenInBrowser = useCallback((url: string) => {
    BrowserOpenURL(url);
  }, []);

  const handleTabChange = useCallback(
    (tab: "search" | "trending") => {
      if (tab === "trending") {
        loadTrending();
      } else if (tab === "search" && searchQuery) {
        handleSearch();
      } else {
        setActiveTab(tab);
      }
    },
    [loadTrending, handleSearch, searchQuery, setActiveTab]
  );

  const handleRefresh = useCallback(() => {
    if (activeTab === "trending") {
      loadTrending();
    } else {
      handleSearch();
    }
  }, [activeTab, loadTrending, handleSearch]);

  return (
    <div className="flex h-full flex-col gap-4">
      <SearchHeader
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        selectedFormat={selectedFormat}
        onFormatChange={setSelectedFormat}
        onSearch={handleSearch}
        isSearching={isSearching}
      />

      <div className="flex flex-1 gap-4 overflow-hidden">
        <ResultsPanel
          activeTab={activeTab}
          onTabChange={handleTabChange}
          results={results}
          isLoading={isSearching || isLoadingTrending}
          addingIds={addingIds}
          onRefresh={handleRefresh}
          onAddToQueue={handleAddToQueue}
          onOpenInBrowser={handleOpenInBrowser}
        />
      </div>
    </div>
  );
}
