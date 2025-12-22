import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type MouseEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { Scissors, Clock, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { TrimOptions, MediaInfo } from "../types";

interface TrimControlsProps {
  mediaInfo: MediaInfo | null;
  waveformData: number[] | null;
  trimOptions: TrimOptions;
  onTrimChange: (options: TrimOptions) => void;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}

export function TrimControls({
  mediaInfo,
  waveformData,
  trimOptions,
  onTrimChange,
  enabled,
  onEnabledChange,
}: TrimControlsProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<"start" | "end" | null>(null);

  const duration = mediaInfo?.duration ?? 0;

  // Convert seconds to percentage
  const startPercent =
    duration > 0 ? (trimOptions.startTime / duration) * 100 : 0;
  const endPercent =
    duration > 0 ? ((trimOptions.endTime || duration) / duration) * 100 : 100;

  // Format time as MM:SS.ms
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toFixed(2).padStart(5, "0")}`;
  }, []);

  // Parse time string to seconds
  const parseTime = useCallback((timeStr: string): number => {
    const parts = timeStr.split(":");
    if (parts.length === 2) {
      const mins = parseInt(parts[0], 10) || 0;
      const secs = parseFloat(parts[1]) || 0;
      return mins * 60 + secs;
    }
    return parseFloat(timeStr) || 0;
  }, []);

  // Handle mouse down on handles
  const handleMouseDown = useCallback(
    (handle: "start" | "end") => (e: MouseEvent) => {
      e.preventDefault();
      setIsDragging(handle);
    },
    []
  );

  // Handle mouse move while dragging
  useEffect(() => {
    if (!isDragging || !containerRef.current) return;

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const percent = (x / rect.width) * 100;
      const time = (percent / 100) * duration;

      if (isDragging === "start") {
        const newStart = Math.max(
          0,
          Math.min(time, (trimOptions.endTime || duration) - 0.1)
        );
        onTrimChange({ ...trimOptions, startTime: newStart });
      } else {
        const newEnd = Math.min(
          duration,
          Math.max(time, trimOptions.startTime + 0.1)
        );
        onTrimChange({ ...trimOptions, endTime: newEnd });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, duration, trimOptions, onTrimChange]);

  // Handle time input changes
  const handleStartTimeChange = useCallback(
    (value: string) => {
      const time = parseTime(value);
      if (time >= 0 && time < (trimOptions.endTime || duration)) {
        onTrimChange({ ...trimOptions, startTime: time });
      }
    },
    [parseTime, trimOptions, duration, onTrimChange]
  );

  const handleEndTimeChange = useCallback(
    (value: string) => {
      const time = parseTime(value);
      if (time > trimOptions.startTime && time <= duration) {
        onTrimChange({ ...trimOptions, endTime: time });
      }
    },
    [parseTime, trimOptions, duration, onTrimChange]
  );

  // Reset to full duration
  const handleReset = useCallback(() => {
    onTrimChange({ startTime: 0, endTime: duration });
  }, [duration, onTrimChange]);

  // Calculate trimmed duration
  const trimmedDuration =
    (trimOptions.endTime || duration) - trimOptions.startTime;

  if (!mediaInfo) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Scissors className="h-4 w-4" />
            {t("converter.trim.title")}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Label
              htmlFor="trim-enabled"
              className="text-sm text-muted-foreground"
            >
              {t("converter.trim.enable")}
            </Label>
            <Switch
              id="trim-enabled"
              checked={enabled}
              onCheckedChange={onEnabledChange}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent
        className={cn(
          "space-y-4",
          !enabled && "pointer-events-none opacity-50"
        )}
      >
        {/* Timeline with waveform */}
        <div
          ref={containerRef}
          className="relative h-10 cursor-crosshair overflow-hidden rounded-md bg-muted/50"
        >
          {/* Waveform visualization */}
          {waveformData && waveformData.length > 0 && (
            <div className="absolute inset-0 flex items-center gap-[1px] px-0.5">
              {waveformData.map((amplitude, i) => {
                // Scale amplitude: apply sqrt for better visual distribution
                // and ensure minimum visibility
                const scaledHeight = Math.max(10, Math.sqrt(amplitude) * 100);
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm bg-primary/60"
                    style={{
                      height: `${Math.min(100, scaledHeight)}%`,
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Inactive regions (before start, after end) */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 bg-background/70"
            style={{ width: `${startPercent}%` }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 bg-background/70"
            style={{ width: `${100 - endPercent}%` }}
          />
          {/* Selected region highlight */}
          <div
            className="pointer-events-none absolute inset-y-0 border-2 border-primary bg-primary/10"
            style={{
              left: `${startPercent}%`,
              width: `${endPercent - startPercent}%`,
            }}
          />

          {/* Start handle */}
          <div
            className={cn(
              "absolute bottom-0 top-0 w-3 cursor-ew-resize bg-primary",
              "flex items-center justify-center",
              "transition-colors hover:bg-primary/80",
              "rounded-l-sm",
              isDragging === "start" && "bg-primary/80"
            )}
            style={{ left: `calc(${startPercent}% - 6px)` }}
            onMouseDown={handleMouseDown("start")}
          >
            <div className="h-6 w-0.5 rounded bg-primary-foreground/50" />
          </div>

          {/* End handle */}
          <div
            className={cn(
              "absolute bottom-0 top-0 w-3 cursor-ew-resize bg-primary",
              "flex items-center justify-center",
              "transition-colors hover:bg-primary/80",
              "rounded-r-sm",
              isDragging === "end" && "bg-primary/80"
            )}
            style={{ left: `calc(${endPercent}% - 6px)` }}
            onMouseDown={handleMouseDown("end")}
          >
            <div className="h-6 w-0.5 rounded bg-primary-foreground/50" />
          </div>

          {/* Time markers */}
          <div className="absolute bottom-1 left-1 rounded bg-background/80 px-1 text-[10px] text-muted-foreground">
            {formatTime(trimOptions.startTime)}
          </div>
          <div className="absolute bottom-1 right-1 rounded bg-background/80 px-1 text-[10px] text-muted-foreground">
            {formatTime(trimOptions.endTime || duration)}
          </div>
        </div>

        {/* Time inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {t("converter.trim.startTime")}
            </Label>
            <Input
              type="text"
              value={formatTime(trimOptions.startTime)}
              onChange={(e) => handleStartTimeChange(e.target.value)}
              className="h-8 font-mono text-sm"
              disabled={!enabled}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {t("converter.trim.endTime")}
            </Label>
            <Input
              type="text"
              value={formatTime(trimOptions.endTime || duration)}
              onChange={(e) => handleEndTimeChange(e.target.value)}
              className="h-8 font-mono text-sm"
              disabled={!enabled}
            />
          </div>
        </div>

        {/* Duration info */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>
              {t("converter.trim.duration")}: {formatTime(trimmedDuration)}
            </span>
            {trimmedDuration < duration && (
              <span className="text-xs text-primary">
                ({((trimmedDuration / duration) * 100).toFixed(0)}%)
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={
              !enabled ||
              (trimOptions.startTime === 0 && trimOptions.endTime === duration)
            }
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            {t("converter.trim.reset")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
