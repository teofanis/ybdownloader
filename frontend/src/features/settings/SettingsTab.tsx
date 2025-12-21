import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import { FolderOpen, RotateCcw, Loader2, Save, Download, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store";
import { supportedLanguages, type SupportedLanguage } from "@/lib/i18n";
import * as api from "@/lib/api";
import type { FFmpegStatus } from "@/lib/api";
import type { Settings, Format, AudioQuality, VideoQuality } from "@/types";
import { EventsOn } from "../../../wailsjs/runtime/runtime";

/**
 * Settings tab component.
 * Manages download preferences, format defaults, and application configuration.
 */
export function SettingsTab() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { settings, setSettings, isSettingsLoading: loading, setSettingsLoading: setLoading } = useAppStore(
    useShallow((s) => ({
      settings: s.settings,
      setSettings: s.setSettings,
      isSettingsLoading: s.isSettingsLoading,
      setSettingsLoading: s.setSettingsLoading,
    }))
  );
  const [local, setLocal] = useState<Settings | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ffmpegStatus, setFFmpegStatus] = useState<FFmpegStatus | null>(null);
  const [ffmpegDownloading, setFFmpegDownloading] = useState(false);
  const [ffmpegProgress, setFFmpegProgress] = useState({ percent: 0, status: "" });

  // Load settings and FFmpeg status from backend on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [s, ffStatus] = await Promise.all([
          settings ? Promise.resolve(settings) : api.getSettings(),
          api.getFFmpegStatus(),
        ]);
        if (!settings) {
          setSettings(s);
        }
        setLocal(s);
        setFFmpegStatus(ffStatus);
      } catch (e) {
        console.error("Failed to load settings:", e);
        toast({ title: t("errors.generic"), variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [settings, setSettings, setLoading, toast, t]);

  // Listen for FFmpeg download progress
  useEffect(() => {
    const handleProgress = (data: { percent: number; status: string }) => {
      setFFmpegProgress(data);
      if (data.percent >= 100) {
        setFFmpegDownloading(false);
        api.getFFmpegStatus().then(setFFmpegStatus);
        toast({ title: t("settings.ffmpeg.downloadComplete") });
      }
    };

    const unsubscribe = EventsOn("ffmpeg:progress", handleProgress);

    return () => {
      unsubscribe();
    };
  }, [t, toast]);

  function update<K extends keyof Settings>(key: K, val: Settings[K]) {
    if (!local) return;
    setLocal({ ...local, [key]: val });
    setDirty(true);
  }

  function changeLanguage(lang: SupportedLanguage) {
    i18n.changeLanguage(lang);
  }

  async function handleBrowseSavePath() {
    try {
      const path = await api.selectDirectory();
      if (path) {
        update("defaultSavePath", path);
      }
    } catch (e) {
      console.error("Failed to select directory:", e);
    }
  }

  async function save() {
    if (!local) return;
    setSaving(true);
    try {
      await api.saveSettings(local);
      setSettings(local);
      setDirty(false);
      toast({ title: t("settings.saved") });
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("errors.generic");
      toast({ title: t("errors.generic"), description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    setLoading(true);
    try {
      const defaults = await api.resetSettings();
      setLocal(defaults);
      setSettings(defaults);
      setDirty(false);
      toast({ title: t("settings.resetComplete") });
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("errors.generic");
      toast({ title: t("errors.generic"), description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadFFmpeg() {
    setFFmpegDownloading(true);
    setFFmpegProgress({ percent: 0, status: t("settings.ffmpeg.starting") });
    try {
      await api.downloadFFmpeg();
    } catch (e) {
      setFFmpegDownloading(false);
      const msg = e instanceof Error ? e.message : t("errors.generic");
      toast({ title: t("settings.ffmpeg.downloadFailed"), description: msg, variant: "destructive" });
    }
  }

  if (loading || !local) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t("settings.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("settings.sections.general")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={reset} disabled={saving}><RotateCcw className="mr-1.5 h-4 w-4" />{t("settings.reset")}</Button>
          <Button onClick={save} disabled={!dirty || saving}>{saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}{t("settings.save")}</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{t("settings.fields.language")}</CardTitle><CardDescription>{t("settings.sections.general")}</CardDescription></CardHeader>
        <CardContent>
          <Select value={i18n.language} onValueChange={(v) => changeLanguage(v as SupportedLanguage)}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(supportedLanguages).map(([code, { nativeName }]) => (
                <SelectItem key={code} value={code}>{nativeName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">{t("settings.fields.savePath")}</CardTitle><CardDescription>{t("settings.sections.download")}</CardDescription></CardHeader>
        <CardContent className="flex gap-2">
          <Input value={local.defaultSavePath} onChange={(e) => update("defaultSavePath", e.target.value)} className="flex-1" />
          <Button variant="outline" onClick={handleBrowseSavePath}><FolderOpen className="h-4 w-4" /></Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">{t("settings.fields.format")}</CardTitle><CardDescription>{t("settings.sections.download")}</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("settings.fields.format")}>
              <Select value={local.defaultFormat} onValueChange={(v) => update("defaultFormat", v as Format)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mp3">MP3 (Audio)</SelectItem>
                  <SelectItem value="m4a">M4A (Audio)</SelectItem>
                  <SelectItem value="mp4">MP4 (Video)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Separator />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("settings.fields.audioQuality")}>
              <Select value={local.defaultAudioQuality} onValueChange={(v) => update("defaultAudioQuality", v as AudioQuality)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="128">128 kbps</SelectItem>
                  <SelectItem value="192">192 kbps</SelectItem>
                  <SelectItem value="256">256 kbps</SelectItem>
                  <SelectItem value="320">320 kbps</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("settings.fields.videoQuality")}>
              <Select value={local.defaultVideoQuality} onValueChange={(v) => update("defaultVideoQuality", v as VideoQuality)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="360p">360p</SelectItem>
                  <SelectItem value="480p">480p</SelectItem>
                  <SelectItem value="720p">720p (HD)</SelectItem>
                  <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                  <SelectItem value="best">Best Available</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">{t("settings.fields.concurrentDownloads")}</CardTitle><CardDescription>{t("settings.sections.advanced")}</CardDescription></CardHeader>
        <CardContent>
          <Field label={t("settings.fields.concurrentDownloads")}>
            <Select value={String(local.maxConcurrentDownloads)} onValueChange={(v) => update("maxConcurrentDownloads", parseInt(v))}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">{t("settings.ffmpeg.title")}</CardTitle>
              <CardDescription>{t("settings.ffmpeg.description")}</CardDescription>
            </div>
            {ffmpegStatus && (
              <Badge variant={ffmpegStatus.available ? "default" : "secondary"} className="flex items-center gap-1">
                {ffmpegStatus.available ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                {ffmpegStatus.available ? t("settings.ffmpeg.installed") : t("settings.ffmpeg.notInstalled")}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {ffmpegStatus?.available && (
            <div className="rounded-md bg-muted/50 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("settings.ffmpeg.path")}:</span>
                <code className="text-xs">{ffmpegStatus.path}</code>
              </div>
              {ffmpegStatus.version && (
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-muted-foreground">{t("settings.ffmpeg.version")}:</span>
                  <span className="text-xs">{ffmpegStatus.version}</span>
                </div>
              )}
              {ffmpegStatus.bundled && (
                <div className="mt-1">
                  <Badge variant="outline" className="text-xs">{t("settings.ffmpeg.bundled")}</Badge>
                </div>
              )}
            </div>
          )}

          {!ffmpegStatus?.available && !ffmpegDownloading && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">{t("settings.ffmpeg.notInstalledDesc")}</p>
              <Button onClick={handleDownloadFFmpeg} className="w-fit">
                <Download className="mr-2 h-4 w-4" />
                {t("settings.ffmpeg.download")}
              </Button>
            </div>
          )}

          {ffmpegDownloading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">{ffmpegProgress.status}</span>
              </div>
              <Progress value={ffmpegProgress.percent} className="h-2" />
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <Label>{t("settings.ffmpeg.customPath")}</Label>
            <div className="flex gap-2">
              <Input 
                value={local.ffmpegPath || ""} 
                onChange={(e) => update("ffmpegPath", e.target.value || undefined)} 
                placeholder={t("settings.ffmpeg.customPathPlaceholder")} 
                className="flex-1" 
              />
            </div>
            <p className="text-xs text-muted-foreground">{t("settings.ffmpeg.customPathHint")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
