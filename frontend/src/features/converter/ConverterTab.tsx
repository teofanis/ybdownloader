import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Wand2,
  Upload,
  FileAudio,
  FileVideo,
  Music,
  Film,
  ImageIcon,
  Scissors,
  Play,
  X,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderOpen,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { formatBytes, formatDuration } from "@/lib/utils";
import * as api from "@/lib/api";
import { EventsOn } from "../../../wailsjs/runtime/runtime";

interface ConversionPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  outputExt: string;
}

interface MediaInfo {
  duration: number;
  format: string;
  size: number;
  bitrate: number;
  videoStream?: {
    codec: string;
    width: number;
    height: number;
    fps: number;
  };
  audioStream?: {
    codec: string;
    channels: number;
    sampleRate: number;
  };
}

interface ConversionJob {
  id: string;
  inputPath: string;
  outputPath: string;
  presetId?: string;
  state: string;
  progress: number;
  error?: string;
  inputInfo?: MediaInfo;
}

interface ConversionProgress {
  jobId: string;
  state: string;
  progress: number;
  speed: number;
  error?: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  audio: <Music className="h-4 w-4" />,
  video: <Film className="h-4 w-4" />,
  resize: <ImageIcon className="h-4 w-4" />,
  gif: <ImageIcon className="h-4 w-4" />,
  extract: <FileAudio className="h-4 w-4" />,
  trim: <Scissors className="h-4 w-4" />,
};

const categoryLabels: Record<string, string> = {
  audio: "Audio Formats",
  video: "Video Formats",
  resize: "Resolution",
  gif: "GIF",
  extract: "Extract",
  trim: "Trim",
};

export function ConverterTab() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [presets, setPresets] = useState<ConversionPreset[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [mediaInfo, setMediaInfo] = useState<MediaInfo | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<ConversionPreset | null>(null);
  const [jobs, setJobs] = useState<ConversionJob[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>("audio");

  // Load presets on mount
  useEffect(() => {
    api.getConversionPresets().then(setPresets).catch(console.error);
    api.getConversionJobs().then(setJobs).catch(console.error);
  }, []);

  // Subscribe to conversion progress events
  useEffect(() => {
    const handleProgress = (progress: ConversionProgress) => {
      setJobs((prev) =>
        prev.map((job) =>
          job.id === progress.jobId
            ? { ...job, state: progress.state, progress: progress.progress, error: progress.error }
            : job
        )
      );

      if (progress.state === "completed") {
        toast({
          title: t("converter.conversionComplete"),
          description: t("converter.conversionCompleteDesc"),
        });
        setIsConverting(false);
      } else if (progress.state === "failed") {
        toast({
          title: t("converter.conversionFailed"),
          description: progress.error,
          variant: "destructive",
        });
        setIsConverting(false);
      }
    };

    const unsubscribe = EventsOn("conversion:progress", handleProgress);
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [t, toast]);

  const handleSelectFile = useCallback(async () => {
    try {
      const path = await api.selectMediaFile();
      if (!path) return;

      setSelectedFile(path);
      setMediaInfo(null);
      setIsAnalyzing(true);

      const info = await api.analyzeMediaFile(path);
      setMediaInfo(info);
    } catch (e) {
      toast({
        title: t("errors.generic"),
        description: String(e),
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [t, toast]);

  const handleStartConversion = useCallback(async () => {
    if (!selectedFile || !selectedPreset) return;

    try {
      setIsConverting(true);
      const job = await api.startConversion(selectedFile, "", selectedPreset.id);
      setJobs((prev) => [job, ...prev]);
      toast({
        title: t("converter.conversionStarted"),
        description: selectedPreset.name,
      });
    } catch (e) {
      setIsConverting(false);
      toast({
        title: t("errors.generic"),
        description: String(e),
        variant: "destructive",
      });
    }
  }, [selectedFile, selectedPreset, t, toast]);

  const handleCancelConversion = useCallback(
    async (jobId: string) => {
      try {
        await api.cancelConversion(jobId);
        setJobs((prev) =>
          prev.map((job) => (job.id === jobId ? { ...job, state: "cancelled" } : job))
        );
      } catch (e) {
        toast({
          title: t("errors.generic"),
          description: String(e),
          variant: "destructive",
        });
      }
    },
    [t, toast]
  );

  const handleRemoveJob = useCallback(
    async (jobId: string) => {
      try {
        await api.removeConversionJob(jobId);
        setJobs((prev) => prev.filter((job) => job.id !== jobId));
      } catch (e) {
        toast({
          title: t("errors.generic"),
          description: String(e),
          variant: "destructive",
        });
      }
    },
    [t, toast]
  );

  const handleClearCompleted = useCallback(async () => {
    await api.clearCompletedConversions();
    setJobs((prev) => prev.filter((job) => job.state !== "completed"));
  }, []);

  // Group presets by category
  const presetsByCategory = presets.reduce((acc, preset) => {
    if (!acc[preset.category]) acc[preset.category] = [];
    acc[preset.category].push(preset);
    return acc;
  }, {} as Record<string, ConversionPreset[]>);

  const fileName = selectedFile?.split(/[/\\]/).pop() ?? "";
  // const _hasActiveJobs = jobs.some((j) => j.state === "converting" || j.state === "analyzing");
  const hasCompletedJobs = jobs.some((j) => j.state === "completed");

  return (
    <div className="flex h-full gap-6">
      {/* Left panel: File selection and presets */}
      <div className="flex w-80 flex-col gap-4">
        {/* File Selection */}
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="h-4 w-4" />
              {t("converter.selectFile")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleSelectFile}
              variant="outline"
              className="w-full justify-start"
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FolderOpen className="mr-2 h-4 w-4" />
              )}
              {selectedFile ? fileName : t("converter.browseFiles")}
            </Button>

            {mediaInfo && (
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>{t("converter.duration")}:</span>
                  <span>{formatDuration(mediaInfo.duration)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("converter.size")}:</span>
                  <span>{formatBytes(mediaInfo.size)}</span>
                </div>
                {mediaInfo.videoStream && (
                  <div className="flex justify-between">
                    <span>{t("converter.resolution")}:</span>
                    <span>
                      {mediaInfo.videoStream.width}×{mediaInfo.videoStream.height}
                    </span>
                  </div>
                )}
                {mediaInfo.audioStream && (
                  <div className="flex justify-between">
                    <span>{t("converter.audio")}:</span>
                    <span>
                      {mediaInfo.audioStream.codec.toUpperCase()}{" "}
                      {mediaInfo.audioStream.channels}ch
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Presets */}
        <Card className="flex-1 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wand2 className="h-4 w-4" />
              {t("converter.presets")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t("converter.presetsDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="space-y-1 p-3">
                {Object.entries(presetsByCategory).map(([category, categoryPresets]) => (
                  <div key={category}>
                    <button
                      onClick={() =>
                        setExpandedCategory((prev) => (prev === category ? null : category))
                      }
                      className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium hover:bg-muted/50"
                    >
                      <span className="flex items-center gap-2">
                        {categoryIcons[category]}
                        {categoryLabels[category] || category}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          expandedCategory === category ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {expandedCategory === category && (
                      <div className="ml-6 mt-1 space-y-1">
                        {categoryPresets.map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => setSelectedPreset(preset)}
                            className={`w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                              selectedPreset?.id === preset.id
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted/50"
                            }`}
                          >
                            <div className="font-medium">{preset.name}</div>
                            <div
                              className={`text-xs ${
                                selectedPreset?.id === preset.id
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {preset.description}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Convert Button */}
        <Button
          onClick={handleStartConversion}
          disabled={!selectedFile || !selectedPreset || isConverting}
          className="w-full"
          size="lg"
        >
          {isConverting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          {t("converter.convert")}
        </Button>
      </div>

      {/* Right panel: Conversion jobs */}
      <Card className="flex-1 overflow-hidden">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base">{t("converter.queue")}</CardTitle>
            <CardDescription className="text-xs">
              {jobs.length === 0
                ? t("converter.noJobs")
                : t("converter.jobCount", { count: jobs.length })}
            </CardDescription>
          </div>
          {hasCompletedJobs && (
            <Button variant="ghost" size="sm" onClick={handleClearCompleted}>
              <Trash2 className="mr-2 h-4 w-4" />
              {t("converter.clearCompleted")}
            </Button>
          )}
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {jobs.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
                <Wand2 className="mb-4 h-12 w-12 opacity-20" />
                <p className="text-sm">{t("converter.emptyQueue")}</p>
                <p className="text-xs">{t("converter.emptyQueueHint")}</p>
              </div>
            ) : (
              <div className="divide-y">
                {jobs.map((job) => (
                  <ConversionJobItem
                    key={job.id}
                    job={job}
                    preset={presets.find((p) => p.id === job.presetId)}
                    onCancel={() => handleCancelConversion(job.id)}
                    onRemove={() => handleRemoveJob(job.id)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

interface JobItemProps {
  job: ConversionJob;
  preset?: ConversionPreset;
  onCancel: () => void;
  onRemove: () => void;
}

function ConversionJobItem({ job, preset, onCancel, onRemove }: JobItemProps) {
  const { t } = useTranslation();
  const fileName = job.inputPath.split(/[/\\]/).pop() ?? "";
  const isActive = job.state === "converting" || job.state === "analyzing";
  const isTerminal = job.state === "completed" || job.state === "failed" || job.state === "cancelled";

  const stateConfig: Record<string, { icon: React.ReactNode; cls: string }> = {
    queued: { icon: <Loader2 className="h-3.5 w-3.5" />, cls: "bg-muted text-muted-foreground" },
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
    cancelled: { icon: <X className="h-3.5 w-3.5" />, cls: "bg-muted text-muted-foreground" },
  };

  const { icon, cls } = stateConfig[job.state] || stateConfig.queued;

  return (
    <div className="flex gap-4 p-4 hover:bg-muted/30 transition-colors">
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
        {job.inputInfo?.videoStream ? (
          <FileVideo className="h-6 w-6 text-muted-foreground" />
        ) : (
          <FileAudio className="h-6 w-6 text-muted-foreground" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="truncate font-medium text-sm">{fileName}</h4>
            {preset && (
              <p className="text-xs text-muted-foreground">
                {preset.name} → .{preset.outputExt}
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
          <p className="mt-1 text-xs text-destructive truncate">{job.error}</p>
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

