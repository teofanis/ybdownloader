import { useTranslation } from "react-i18next";
import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import * as api from "@/lib/api";
import type { Settings, Format, AudioQuality, VideoQuality } from "@/types";
import { SettingsCard, Field } from "./SettingsCard";

interface DownloadSettingsProps {
  settings: Settings;
  onUpdate: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

export function SavePathSettings({ settings, onUpdate }: DownloadSettingsProps) {
  const { t } = useTranslation();

  const handleBrowse = async () => {
    try {
      const path = await api.selectDirectory();
      if (path) {
        onUpdate("defaultSavePath", path);
      }
    } catch (e) {
      console.error("Failed to select directory:", e);
    }
  };

  return (
    <SettingsCard title={t("settings.fields.savePath")} description={t("settings.sections.download")}>
      <div className="flex gap-2">
        <Input
          value={settings.defaultSavePath}
          onChange={(e) => onUpdate("defaultSavePath", e.target.value)}
          className="flex-1"
        />
        <Button variant="outline" onClick={handleBrowse}>
          <FolderOpen className="h-4 w-4" />
        </Button>
      </div>
    </SettingsCard>
  );
}

export function FormatSettings({ settings, onUpdate }: DownloadSettingsProps) {
  const { t } = useTranslation();

  return (
    <SettingsCard title={t("settings.fields.format")} description={t("settings.sections.download")}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("settings.fields.format")}>
            <Select value={settings.defaultFormat} onValueChange={(v) => onUpdate("defaultFormat", v as Format)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
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
            <Select
              value={settings.defaultAudioQuality}
              onValueChange={(v) => onUpdate("defaultAudioQuality", v as AudioQuality)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="128">128 kbps</SelectItem>
                <SelectItem value="192">192 kbps</SelectItem>
                <SelectItem value="256">256 kbps</SelectItem>
                <SelectItem value="320">320 kbps</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label={t("settings.fields.videoQuality")}>
            <Select
              value={settings.defaultVideoQuality}
              onValueChange={(v) => onUpdate("defaultVideoQuality", v as VideoQuality)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
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
      </div>
    </SettingsCard>
  );
}

export function ConcurrentDownloadsSettings({ settings, onUpdate }: DownloadSettingsProps) {
  const { t } = useTranslation();

  return (
    <SettingsCard title={t("settings.fields.concurrentDownloads")} description={t("settings.sections.advanced")}>
      <Field label={t("settings.fields.concurrentDownloads")}>
        <Select
          value={String(settings.maxConcurrentDownloads)}
          onValueChange={(v) => onUpdate("maxConcurrentDownloads", parseInt(v))}
        >
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </SettingsCard>
  );
}

