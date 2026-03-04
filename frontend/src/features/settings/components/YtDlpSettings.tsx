import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Download,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";
import type { YtDlpStatus } from "@/lib/api";
import type { Settings } from "@/types";
import { EventsOn } from "../../../../wailsjs/runtime/runtime";
import { SettingsCard, Field } from "./SettingsCard";

interface YtDlpSettingsProps {
  settings: Settings;
  onUpdate: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

export function YtDlpSettings({ settings, onUpdate }: YtDlpSettingsProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [status, setStatus] = useState<YtDlpStatus | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState({ percent: 0, status: "" });
  const [defaultFlags, setDefaultFlags] = useState<Record<string, string[]>>(
    {}
  );
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    api.getYtDlpStatus().then(setStatus).catch(console.error);
    api.getYtDlpDefaultFlags().then(setDefaultFlags).catch(console.error);
  }, []);

  useEffect(() => {
    const handleProgress = (data: { percent: number; status: string }) => {
      setProgress(data);
      if (data.percent >= 100) {
        setDownloading(false);
        api.getYtDlpStatus().then(setStatus);
        toast({ title: t("settings.ytdlp.downloadComplete") });
      }
    };

    const unsubscribe = EventsOn("ytdlp:progress", handleProgress);
    return () => unsubscribe();
  }, [t, toast]);

  const handleDownload = async () => {
    setDownloading(true);
    setProgress({ percent: 0, status: t("settings.ytdlp.starting") });
    try {
      await api.downloadYtDlp();
    } catch (e) {
      setDownloading(false);
      const msg = e instanceof Error ? e.message : t("errors.generic");
      toast({
        title: t("settings.ytdlp.downloadFailed"),
        description: msg,
        variant: "destructive",
      });
    }
  };

  const extraFlagsStr = (settings.ytDlpExtraFlags || []).join(" ");

  const handleExtraFlagsChange = (value: string) => {
    const flags = value
      .split(/\s+/)
      .filter((f) => f.length > 0);
    onUpdate("ytDlpExtraFlags", flags.length > 0 ? flags : undefined);
  };

  const isActive = settings.downloadBackend === "yt-dlp";

  return (
    <SettingsCard
      title={t("settings.ytdlp.title")}
      description={t("settings.ytdlp.description")}
      headerRight={
        status && (
          <div className="flex items-center gap-2">
            {isActive && (
              <Badge variant="default" className="text-xs">
                {t("settings.ytdlp.active")}
              </Badge>
            )}
            <Badge
              variant={status.available ? "default" : "secondary"}
              className="flex items-center gap-1"
            >
              {status.available ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              {status.available
                ? t("settings.ytdlp.installed")
                : t("settings.ytdlp.notInstalled")}
            </Badge>
          </div>
        )
      }
    >
      <div className="space-y-4">
        {status?.available && (
          <div className="rounded-md bg-muted/50 p-3 text-sm">
            <div className="mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="font-medium">yt-dlp</span>
              {status.bundled && (
                <Badge variant="outline" className="text-xs">
                  {t("settings.ytdlp.bundled")}
                </Badge>
              )}
            </div>
            {status.path && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t("settings.ytdlp.path")}:
                </span>
                <code className="text-xs">{status.path}</code>
              </div>
            )}
            {status.version && (
              <div className="mt-1 flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t("settings.ytdlp.version")}:
                </span>
                <span className="text-xs">{status.version}</span>
              </div>
            )}
            <div className="mt-1 flex items-center justify-between">
              <span className="text-muted-foreground">
                {t("settings.ytdlp.jsRuntime")}:
              </span>
              <span className="flex items-center gap-1 text-xs">
                {status.hasJSRuntime ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    {status.jsRuntime}
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 text-yellow-500" />
                    {t("settings.ytdlp.noJsRuntime")}
                  </>
                )}
              </span>
            </div>
          </div>
        )}

        {!status?.available && !downloading && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              {t("settings.ytdlp.notInstalledDesc")}
            </p>
            <Button onClick={handleDownload} className="w-fit">
              <Download className="mr-2 h-4 w-4" />
              {t("settings.ytdlp.download")}
            </Button>
          </div>
        )}

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

        <Field
          label={t("settings.ytdlp.customPath")}
          hint={t("settings.ytdlp.customPathHint")}
        >
          <Input
            value={settings.ytDlpPath || ""}
            onChange={(e) =>
              onUpdate("ytDlpPath", e.target.value || undefined)
            }
            placeholder={t("settings.ytdlp.customPathPlaceholder")}
          />
        </Field>

        <Separator />

        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="flex w-full items-center justify-between p-0 text-sm font-medium"
            >
              {t("settings.ytdlp.advancedFlags")}
              <span className="text-xs text-muted-foreground">
                {advancedOpen ? "▲" : "▼"}
              </span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-4">
            {Object.keys(defaultFlags).length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("settings.ytdlp.defaultFlagsLabel")}
                </p>
                <div className="space-y-1">
                  {Object.entries(defaultFlags).map(([key, flags]) => (
                    <div key={key} className="flex items-start gap-2 text-xs">
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {key}
                      </Badge>
                      <code className="text-muted-foreground">
                        {flags.join(" ")}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Field
              label={t("settings.ytdlp.extraFlags")}
              hint={t("settings.ytdlp.extraFlagsHint")}
            >
              <Textarea
                value={extraFlagsStr}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleExtraFlagsChange(e.target.value)}
                placeholder={t("settings.ytdlp.extraFlagsPlaceholder")}
                className="min-h-[60px] font-mono text-xs"
              />
            </Field>

            <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <div>
                <p>{t("settings.ytdlp.flagsWarning")}</p>
                <a
                  href="https://github.com/yt-dlp/yt-dlp#usage-and-options"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-primary hover:underline"
                >
                  {t("settings.ytdlp.viewDocs")}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </SettingsCard>
  );
}
