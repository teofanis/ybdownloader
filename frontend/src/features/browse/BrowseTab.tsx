import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Search,
  TrendingUp,
  Play,
  Plus,
  Clock,
  Eye,
  User,
  Loader2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { BrowserOpenURL } from "../../../wailsjs/runtime/runtime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store";
import * as api from "@/lib/api";
import type { Format } from "@/types";
import type { YouTubeSearchResult } from "@/lib/api";

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

  // Local-only state (doesn't need persistence)
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
  const [hasLoadedTrending, setHasLoadedTrending] = useState(false);

  // Load trending on first mount (only if no results yet)
  useEffect(() => {
    if (results.length === 0 && !hasLoadedTrending) {
      loadTrending();
      setHasLoadedTrending(true);
    }
  }, [results.length, hasLoadedTrending]);

  const loadTrending = useCallback(async () => {
    setIsLoadingTrending(true);
    try {
      const response = await api.getTrendingVideos("US", 20);
      if (response?.results && response.results.length > 0) {
        setResults(response.results);
        setActiveTab("trending");
      } else {
        // Trending returned empty, this is expected sometimes
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Search Header */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            {t("browse.title")}
          </CardTitle>
          <CardDescription>{t("browse.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("browse.searchPlaceholder")}
                className="pl-10"
                disabled={isSearching}
              />
            </div>
            <Select
              value={selectedFormat}
              onValueChange={(v) => setSelectedFormat(v as Format)}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mp3">MP3</SelectItem>
                <SelectItem value="m4a">M4A</SelectItem>
                <SelectItem value="mp4">MP4</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2">{t("browse.openYoutube")}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Main Results */}
        <Card className="flex-1 overflow-hidden">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (activeTab !== "search" && searchQuery) handleSearch();
                  else setActiveTab("search");
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "search"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <Search className="h-4 w-4" />
                {t("browse.searchResults")}
              </button>
              <button
                onClick={loadTrending}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "trending"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                {t("browse.trending")}
              </button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={activeTab === "trending" ? loadTrending : handleSearch}
              disabled={isSearching || isLoadingTrending}
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  isSearching || isLoadingTrending ? "animate-spin" : ""
                }`}
              />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-320px)]">
              {(isSearching || isLoadingTrending) && results.length === 0 ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : results.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
                  <Search className="mb-4 h-12 w-12 opacity-20" />
                  <p className="text-sm">{t("browse.emptyState")}</p>
                  <p className="text-xs">{t("browse.emptyStateHint")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
                  {results.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      onAdd={() => handleAddToQueue(video)}
                      onOpenInBrowser={() => handleOpenInBrowser(video.url)}
                      isAdding={addingIds.has(video.id)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface VideoCardProps {
  video: YouTubeSearchResult;
  onAdd: () => void;
  onOpenInBrowser: () => void;
  isAdding: boolean;
}

function VideoCard({ video, onAdd, onOpenInBrowser, isAdding }: VideoCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="group overflow-hidden transition-all hover:border-primary/50 hover:shadow-md">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Play className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        {/* Duration badge */}
        {video.duration && (
          <Badge
            variant="secondary"
            className="absolute bottom-2 right-2 bg-black/80 text-white hover:bg-black/80"
          >
            <Clock className="mr-1 h-3 w-3" />
            {video.duration}
          </Badge>
        )}
        {/* Overlay actions */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                onClick={onAdd}
                disabled={isAdding}
                className="h-10 w-10 rounded-full"
              >
                {isAdding ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Plus className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("browse.addToQueue")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                className="h-10 w-10 rounded-full"
                onClick={onOpenInBrowser}
              >
                <ExternalLink className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("browse.openInBrowser")}</TooltipContent>
          </Tooltip>
        </div>
      </div>
      {/* Info */}
      <CardContent className="p-3">
        <h4 className="line-clamp-2 text-sm font-medium leading-tight" title={video.title}>
          {video.title}
        </h4>
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          <span className="truncate">{video.author}</span>
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          {video.viewCount && (
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {video.viewCount}
            </span>
          )}
          {video.publishedAt && <span>{video.publishedAt}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
