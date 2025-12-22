import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";
import type { FFmpegStatus } from "@/lib/api";
import type { Settings } from "@/types";
import { EventsOn } from "../../../../wailsjs/runtime/runtime";
import { SettingsCard, Field } from "./SettingsCard";

interface FFmpegSettingsProps {
  settings: Settings;
  onUpdate: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

export function FFmpegSettings({ settings, onUpdate }: FFmpegSettingsProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [status, setStatus] = useState<FFmpegStatus | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState({ percent: 0, status: "" });

  useEffect(() => {
    api.getFFmpegStatus().then(setStatus).catch(console.error);
  }, []);

  useEffect(() => {
    const handleProgress = (data: { percent: number; status: string }) => {
      setProgress(data);
      if (data.percent >= 100) {
        setDownloading(false);
        api.getFFmpegStatus().then(setStatus);
        toast({ title: t("settings.ffmpeg.downloadComplete") });
      }
    };

    const unsubscribe = EventsOn("ffmpeg:progress", handleProgress);
    return () => unsubscribe();
  }, [t, toast]);

  const handleDownload = async () => {
    setDownloading(true);
    setProgress({ percent: 0, status: t("settings.ffmpeg.starting") });
    try {
      await api.downloadFFmpeg();
    } catch (e) {
      setDownloading(false);
      const msg = e instanceof Error ? e.message : t("errors.generic");
      toast({ title: t("settings.ffmpeg.downloadFailed"), description: msg, variant: "destructive" });
    }
  };

  const isFullyInstalled = status?.available && status?.ffprobeAvailable;

  return (
    <SettingsCard
      title={t("settings.ffmpeg.title")}
      description={t("settings.ffmpeg.description")}
      headerRight={
        status && (
          <Badge variant={isFullyInstalled ? "default" : "secondary"} className="flex items-center gap-1">
            {isFullyInstalled ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            {isFullyInstalled ? t("settings.ffmpeg.installed") : t("settings.ffmpeg.notInstalled")}
          </Badge>
        )
      }
    >
      <div className="space-y-4">
        {/* Status Display */}
        {status?.available && (
          <div className="space-y-3">
            <BinaryStatus
              name="FFmpeg"
              available={true}
              path={status.path}
              version={status.version}
              bundled={status.bundled}
              t={t}
            />
            <BinaryStatus
              name="FFprobe"
              available={status.ffprobeAvailable}
              path={status.ffprobePath}
              t={t}
            />
          </div>
        )}

        {/* Download Button */}
        {!status?.available && !downloading && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">{t("settings.ffmpeg.notInstalledDesc")}</p>
            <Button onClick={handleDownload} className="w-fit">
              <Download className="mr-2 h-4 w-4" />
              {t("settings.ffmpeg.download")}
            </Button>
          </div>
        )}

        {/* Download Progress */}
        {downloading && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">{progress.status}</span>
            </div>
            <Progress value={progress.percent} className="h-2" />
          </div>
        )}

        <Separator />

        {/* Custom Paths */}
        <div className="space-y-4">
          <Field label={t("settings.ffmpeg.customFFmpegPath")} hint={t("settings.ffmpeg.customFFmpegPathHint")}>
            <Input
              value={settings.ffmpegPath || ""}
              onChange={(e) => onUpdate("ffmpegPath", e.target.value || undefined)}
              placeholder={t("settings.ffmpeg.customPathPlaceholder")}
            />
          </Field>

          <Field label={t("settings.ffmpeg.customFFprobePath")} hint={t("settings.ffmpeg.customFFprobePathHint")}>
            <Input
              value={settings.ffprobePath || ""}
              onChange={(e) => onUpdate("ffprobePath", e.target.value || undefined)}
              placeholder={t("settings.ffmpeg.customPathPlaceholder")}
            />
          </Field>
        </div>
      </div>
    </SettingsCard>
  );
}

interface BinaryStatusProps {
  name: string;
  available: boolean;
  path?: string;
  version?: string;
  bundled?: boolean;
  t: (key: string) => string;
}

function BinaryStatus({ name, available, path, version, bundled, t }: BinaryStatusProps) {
  return (
    <div className="rounded-md bg-muted/50 p-3 text-sm">
      <div className="mb-2 flex items-center gap-2">
        {available ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-destructive" />
        )}
        <span className="font-medium">{name}</span>
        {!available && <Badge variant="destructive" className="text-xs">{t("settings.ffmpeg.notInstalled")}</Badge>}
      </div>
      {available && path && (
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{t("settings.ffmpeg.path")}:</span>
          <code className="text-xs">{path}</code>
        </div>
      )}
      {available && version && (
        <div className="mt-1 flex items-center justify-between">
          <span className="text-muted-foreground">{t("settings.ffmpeg.version")}:</span>
          <span className="text-xs">{version}</span>
        </div>
      )}
      {available && bundled && (
        <div className="mt-1">
          <Badge variant="outline" className="text-xs">{t("settings.ffmpeg.bundled")}</Badge>
        </div>
      )}
      {!available && (
        <p className="text-xs text-muted-foreground">{t("settings.ffmpeg.ffprobeRequired")}</p>
      )}
    </div>
  );
}

