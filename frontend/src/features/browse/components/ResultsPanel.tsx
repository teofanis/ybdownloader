import { useTranslation } from "react-i18next";
import { Search, TrendingUp, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VideoCard } from "./VideoCard";
import type { YouTubeSearchResult } from "@/lib/api";

type TabType = "search" | "trending";

interface ResultsPanelProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  results: YouTubeSearchResult[];
  isLoading: boolean;
  addingIds: Set<string>;
  onRefresh: () => void;
  onAddToQueue: (video: YouTubeSearchResult) => void;
  onOpenInBrowser: (url: string) => void;
}

export function ResultsPanel({
  activeTab,
  onTabChange,
  results,
  isLoading,
  addingIds,
  onRefresh,
  onAddToQueue,
  onOpenInBrowser,
}: ResultsPanelProps) {
  const { t } = useTranslation();

  return (
    <Card className="flex-1 overflow-hidden">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onTabChange("search")}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === "search"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            <Search className="h-4 w-4" />
            {t("browse.searchResults")}
          </button>
          <button
            onClick={() => onTabChange("trending")}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
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
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-320px)]">
          {isLoading && results.length === 0 ? (
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
                  onAdd={() => onAddToQueue(video)}
                  onOpenInBrowser={() => onOpenInBrowser(video.url)}
                  isAdding={addingIds.has(video.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
