import {
  Music,
  Video,
  X,
  Play,
  RefreshCw,
  FolderOpen,
  FileAudio,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppStore } from "@/store";
import {
  formatBytes,
  formatDuration,
  formatETA,
  extractVideoId,
  truncate,
} from "@/lib/utils";
import type { QueueItemWithProgress, DownloadState } from "@/types";
import { isTerminalState, getStateLabel, isAudioFormat } from "@/types";

interface QueueItemProps {
  item: QueueItemWithProgress;
}

export function QueueItem({ item }: QueueItemProps) {
  const removeQueueItem = useAppStore((state) => state.removeQueueItem);

  const handleRemove = () => {
    removeQueueItem(item.id);
  };

  const handleStart = () => {
    // Will be connected to API
    console.log("Start download:", item.id);
  };

  const handleRetry = () => {
    // Will be connected to API
    console.log("Retry download:", item.id);
  };

  const handleOpenFile = () => {
    // Will be connected to API
    console.log("Open file:", item.filePath);
  };

  const handleOpenFolder = () => {
    // Will be connected to API
    console.log("Open folder:", item.savePath);
  };

  const videoId = extractVideoId(item.url);
  const thumbnail = videoId
    ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
    : null;

  const isAudio = isAudioFormat(item.format);
  const FormatIcon = isAudio ? Music : Video;

  return (
    <div className="flex gap-4 p-4 hover:bg-muted/30 transition-colors">
      {/* Thumbnail */}
      <div className="relative h-16 w-28 flex-shrink-0 overflow-hidden rounded-md bg-muted">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FormatIcon className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
          {item.format.toUpperCase()}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-center gap-1 overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="truncate font-medium leading-tight">
              {item.metadata?.title || truncate(item.url, 50)}
            </h4>
            {item.metadata && (
              <p className="truncate text-xs text-muted-foreground">
                {item.metadata.author}
                {item.metadata.duration > 0 && (
                  <span className="ml-2">
                    {formatDuration(item.metadata.duration)}
                  </span>
                )}
              </p>
            )}
          </div>
          <StateIndicator state={item.state} error={item.error} />
        </div>

        {/* Progress bar for active downloads */}
        {item.progress && !isTerminalState(item.state) && (
          <div className="mt-1 space-y-1">
            <Progress value={item.progress.percent} className="h-1.5" />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>
                {formatBytes(item.progress.downloadedBytes)} /{" "}
                {formatBytes(item.progress.totalBytes)}
              </span>
              <span>
                {formatBytes(item.progress.speed)}/s • ETA{" "}
                {formatETA(item.progress.eta)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {item.state === "queued" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleStart}
                aria-label="Start download"
              >
                <Play className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Start download</TooltipContent>
          </Tooltip>
        )}

        {item.state === "failed" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRetry}
                aria-label="Retry download"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Retry</TooltipContent>
          </Tooltip>
        )}

        {item.state === "completed" && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleOpenFile}
                  aria-label="Open file"
                >
                  <FileAudio className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open file</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleOpenFolder}
                  aria-label="Open folder"
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open folder</TooltipContent>
            </Tooltip>
          </>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              aria-label="Remove from queue"
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Remove</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

function StateIndicator({
  state,
  error,
}: {
  state: DownloadState;
  error?: string;
}) {
  const config: Record<
    DownloadState,
    { icon: React.ReactNode; className: string }
  > = {
    queued: {
      icon: <Clock className="h-3.5 w-3.5" />,
      className: "bg-muted text-muted-foreground",
    },
    fetching_metadata: {
      icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
      className: "bg-primary/10 text-primary",
    },
    ready: {
      icon: <Clock className="h-3.5 w-3.5" />,
      className: "bg-muted text-muted-foreground",
    },
    downloading: {
      icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
      className: "bg-primary/10 text-primary",
    },
    converting: {
      icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
      className: "bg-warning/10 text-warning",
    },
    completed: {
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      className: "bg-success/10 text-success",
    },
    failed: {
      icon: <AlertCircle className="h-3.5 w-3.5" />,
      className: "bg-destructive/10 text-destructive",
    },
    cancel_requested: {
      icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
      className: "bg-muted text-muted-foreground",
    },
    cancelled: {
      icon: <X className="h-3.5 w-3.5" />,
      className: "bg-muted text-muted-foreground",
    },
  };

  const { icon, className } = config[state];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${className}`}
        >
          {icon}
          <span className="capitalize">{getStateLabel(state)}</span>
        </div>
      </TooltipTrigger>
      {error && (
        <TooltipContent className="max-w-xs">
          <p className="text-destructive">{error}</p>
        </TooltipContent>
      )}
    </Tooltip>
  );
}

