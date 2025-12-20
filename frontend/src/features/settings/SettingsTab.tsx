import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import { FolderOpen, RotateCcw, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store";
import { supportedLanguages, type SupportedLanguage } from "@/lib/i18n";
import type { Settings, Format, AudioQuality, VideoQuality } from "@/types";

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

  useEffect(() => {
    if (!settings) {
      const defaults: Settings = {
        version: 1,
        defaultSavePath: "~/Music",
        defaultFormat: "mp3",
        defaultAudioQuality: "192",
        defaultVideoQuality: "720p",
        maxConcurrentDownloads: 2,
      };
      setSettings(defaults);
      setLocal(defaults);
    } else {
      setLocal(settings);
    }
  }, [settings, setSettings]);

  function update<K extends keyof Settings>(key: K, val: Settings[K]) {
    if (!local) return;
    setLocal({ ...local, [key]: val });
    setDirty(true);
  }

  function changeLanguage(lang: SupportedLanguage) {
    i18n.changeLanguage(lang);
  }

  async function save() {
    if (!local) return;
    setSaving(true);
    try {
      setSettings(local);
      setDirty(false);
      toast({ title: t("settings.saved") });
    } catch {
      toast({ title: t("errors.generic"), description: t("errors.generic"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    setLoading(true);
    const defaults: Settings = {
      version: 1,
      defaultSavePath: "~/Music",
      defaultFormat: "mp3",
      defaultAudioQuality: "192",
      defaultVideoQuality: "720p",
      maxConcurrentDownloads: 2,
    };
    setLocal(defaults);
    setSettings(defaults);
    setDirty(false);
    setLoading(false);
    toast({ title: t("settings.resetComplete") });
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
          <Button variant="outline" onClick={() => console.log("browse")}><FolderOpen className="h-4 w-4" /></Button>
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
        <CardHeader><CardTitle className="text-base">{t("settings.fields.ffmpegPath")}</CardTitle><CardDescription>{t("settings.sections.advanced")}</CardDescription></CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input value={local.ffmpegPath || ""} onChange={(e) => update("ffmpegPath", e.target.value || undefined)} placeholder={t("settings.fields.ffmpegPathHint")} className="flex-1" />
            <Button variant="outline" onClick={() => console.log("browse ffmpeg")}><FolderOpen className="h-4 w-4" /></Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t("settings.fields.ffmpegPathHint")}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
