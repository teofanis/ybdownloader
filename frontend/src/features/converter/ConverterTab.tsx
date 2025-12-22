import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";
import { EventsOn } from "../../../wailsjs/runtime/runtime";
import { FileSelector, PresetBrowser, ConversionQueue } from "./components";
import type { ConversionPreset, MediaInfo, ConversionJob, ConversionProgress } from "./types";

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

  // Load presets and jobs on mount
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
    return () => unsubscribe?.();
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

  const handleCancelJob = useCallback(
    async (jobId: string) => {
      try {
        await api.cancelConversion(jobId);
        setJobs((prev) => prev.map((job) => (job.id === jobId ? { ...job, state: "cancelled" } : job)));
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

  return (
    <div className="flex h-full gap-6">
      {/* Left panel: File selection and presets */}
      <div className="flex w-80 flex-col gap-4">
        <FileSelector
          selectedFile={selectedFile}
          mediaInfo={mediaInfo}
          isAnalyzing={isAnalyzing}
          onSelectFile={handleSelectFile}
        />

        <PresetBrowser
          presets={presets}
          selectedPreset={selectedPreset}
          onSelectPreset={setSelectedPreset}
        />

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

      {/* Right panel: Conversion queue */}
      <ConversionQueue
        jobs={jobs}
        presets={presets}
        onCancelJob={handleCancelJob}
        onRemoveJob={handleRemoveJob}
        onClearCompleted={handleClearCompleted}
      />
    </div>
  );
}
