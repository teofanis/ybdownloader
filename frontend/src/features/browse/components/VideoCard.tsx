import { useTranslation } from "react-i18next";
import {
  Play,
  Plus,
  Clock,
  Eye,
  User,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { YouTubeSearchResult } from "@/lib/api";

interface VideoCardProps {
  video: YouTubeSearchResult;
  onAdd: () => void;
  onOpenInBrowser: () => void;
  isAdding: boolean;
}

export function VideoCard({
  video,
  onAdd,
  onOpenInBrowser,
  isAdding,
}: VideoCardProps) {
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
        <h4
          className="line-clamp-2 text-sm font-medium leading-tight"
          title={video.title}
        >
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
