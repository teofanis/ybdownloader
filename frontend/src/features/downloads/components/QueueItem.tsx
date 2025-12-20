import { useTranslation } from "react-i18next";
import { Music, Video, X, Play, RefreshCw, FolderOpen, FileAudio, Loader2, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAppStore } from "@/store";
import { formatBytes, formatDuration, formatETA, extractVideoId, truncate } from "@/lib/utils";
import type { QueueItemWithProgress, DownloadState } from "@/types";
import { isTerminalState, isAudioFormat } from "@/types";

interface Props {
  item: QueueItemWithProgress;
}

/**
 * Individual queue item component.
 * Displays video thumbnail, metadata, progress, and action buttons.
 */
export function QueueItem({ item }: Props) {
  const { t } = useTranslation();
  const removeQueueItem = useAppStore((s) => s.removeQueueItem);
  const videoId = extractVideoId(item.url);
  const thumb = videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : null;
  const Icon = isAudioFormat(item.format) ? Music : Video;

  return (
    <div className="flex gap-4 p-4 hover:bg-muted/30 transition-colors">
      <div className="relative h-16 w-28 flex-shrink-0 overflow-hidden rounded-md bg-muted">
        {thumb ? <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" /> : <div className="flex h-full w-full items-center justify-center"><Icon className="h-6 w-6 text-muted-foreground" /></div>}
        <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">{item.format.toUpperCase()}</span>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-1 overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="truncate font-medium leading-tight">{item.metadata?.title || truncate(item.url, 50)}</h4>
            {item.metadata && <p className="truncate text-xs text-muted-foreground">{item.metadata.author}{item.metadata.duration > 0 && <span className="ml-2">{formatDuration(item.metadata.duration)}</span>}</p>}
          </div>
          <StateBadge state={item.state} error={item.error} />
        </div>
        {item.progress && !isTerminalState(item.state) && (
          <div className="mt-1 space-y-1">
            <Progress value={item.progress.percent} className="h-1.5" />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{formatBytes(item.progress.downloadedBytes)} / {formatBytes(item.progress.totalBytes)}</span>
              <span>{formatBytes(item.progress.speed)}/s · {formatETA(item.progress.eta)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        {item.state === "queued" && <Btn tip={t("downloads.actions.start")} icon={<Play className="h-4 w-4" />} onClick={() => console.log("start", item.id)} />}
        {item.state === "failed" && <Btn tip={t("downloads.actions.retry")} icon={<RefreshCw className="h-4 w-4" />} onClick={() => console.log("retry", item.id)} />}
        {item.state === "completed" && (
          <>
            <Btn tip={t("downloads.actions.openFile")} icon={<FileAudio className="h-4 w-4" />} onClick={() => console.log("open", item.filePath)} />
            <Btn tip={t("downloads.actions.openFolder")} icon={<FolderOpen className="h-4 w-4" />} onClick={() => console.log("folder", item.savePath)} />
          </>
        )}
        <Btn tip={t("downloads.actions.remove")} icon={<X className="h-4 w-4" />} onClick={() => removeQueueItem(item.id)} className="text-muted-foreground hover:text-destructive" />
      </div>
    </div>
  );
}

function Btn({ tip, icon, onClick, className = "" }: { tip: string; icon: React.ReactNode; onClick: () => void; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={onClick} className={className}>{icon}</Button></TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  );
}

const stateConfig: Record<DownloadState, { icon: React.ReactNode; cls: string; key: string }> = {
  queued: { icon: <Clock className="h-3.5 w-3.5" />, cls: "bg-muted text-muted-foreground", key: "queued" },
  fetching_metadata: { icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />, cls: "bg-primary/10 text-primary", key: "fetchingMetadata" },
  ready: { icon: <Clock className="h-3.5 w-3.5" />, cls: "bg-muted text-muted-foreground", key: "ready" },
  downloading: { icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />, cls: "bg-primary/10 text-primary", key: "downloading" },
  converting: { icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />, cls: "bg-warning/10 text-warning", key: "converting" },
  completed: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, cls: "bg-success/10 text-success", key: "completed" },
  failed: { icon: <AlertCircle className="h-3.5 w-3.5" />, cls: "bg-destructive/10 text-destructive", key: "failed" },
  cancel_requested: { icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />, cls: "bg-muted text-muted-foreground", key: "cancelled" },
  cancelled: { icon: <X className="h-3.5 w-3.5" />, cls: "bg-muted text-muted-foreground", key: "cancelled" },
};

function StateBadge({ state, error }: { state: DownloadState; error?: string }) {
  const { t } = useTranslation();
  const { icon, cls, key } = stateConfig[state];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${cls}`}>
          {icon}<span>{t(`downloads.states.${key}`)}</span>
        </div>
      </TooltipTrigger>
      {error && <TooltipContent className="max-w-xs text-destructive">{error}</TooltipContent>}
    </Tooltip>
  );
}
