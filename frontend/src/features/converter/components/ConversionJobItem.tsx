import { useTranslation } from "react-i18next";
import {
  FileAudio,
  FileVideo,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { ConversionJob, ConversionPreset } from "../types";
import { getPresetName } from "../utils";

interface ConversionJobItemProps {
  job: ConversionJob;
  preset?: ConversionPreset;
  onCancel: () => void;
  onRemove: () => void;
}

const stateConfig: Record<string, { icon: React.ReactNode; cls: string }> = {
  queued: {
    icon: <Loader2 className="h-3.5 w-3.5" />,
    cls: "bg-muted text-muted-foreground",
  },
  analyzing: {
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    cls: "bg-blue-500/10 text-blue-500",
  },
  converting: {
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    cls: "bg-primary/10 text-primary",
  },
  completed: {
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    cls: "bg-green-500/10 text-green-500",
  },
  failed: {
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    cls: "bg-destructive/10 text-destructive",
  },
  cancelled: {
    icon: <X className="h-3.5 w-3.5" />,
    cls: "bg-muted text-muted-foreground",
  },
};

export function ConversionJobItem({
  job,
  preset,
  onCancel,
  onRemove,
}: ConversionJobItemProps) {
  const { t } = useTranslation();
  const fileName = job.inputPath.split(/[/\\]/).pop() ?? "";
  const isActive = job.state === "converting" || job.state === "analyzing";
  const isTerminal =
    job.state === "completed" ||
    job.state === "failed" ||
    job.state === "cancelled";

  const { icon, cls } = stateConfig[job.state] || stateConfig.queued;

  return (
    <div className="flex gap-4 p-4 transition-colors hover:bg-muted/30">
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
        {job.inputInfo?.videoStream ? (
          <FileVideo className="h-6 w-6 text-muted-foreground" />
        ) : (
          <FileAudio className="h-6 w-6 text-muted-foreground" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="truncate text-sm font-medium">{fileName}</h4>
            {preset && (
              <p className="text-xs text-muted-foreground">
                {getPresetName(preset, t)} → .{preset.outputExt}
              </p>
            )}
          </div>
          <Badge variant="secondary" className={`shrink-0 ${cls}`}>
            {icon}
            <span className="ml-1">{t(`converter.states.${job.state}`)}</span>
          </Badge>
        </div>

        {isActive && (
          <div className="mt-2">
            <Progress value={job.progress} className="h-1.5" />
            <p className="mt-1 text-[10px] text-muted-foreground">
              {job.progress.toFixed(0)}%
            </p>
          </div>
        )}

        {job.error && (
          <p className="mt-1 truncate text-xs text-destructive">{job.error}</p>
        )}
      </div>

      <div className="flex items-center">
        {isActive ? (
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        ) : isTerminal ? (
          <Button variant="ghost" size="icon" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
