import { useTranslation } from "react-i18next";
import { Label } from "@ybdownload/ui/label";
import { RadioGroup, RadioGroupItem } from "@ybdownload/ui/radio-group";
import { BACKEND_YTDLP, BACKEND_BUILTIN } from "@/types";
import type { Settings, DownloadBackend } from "@/types";
import { SettingsCard } from "./SettingsCard";

interface DownloadEngineSettingsProps {
  settings: Settings;
  onUpdate: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

export function DownloadEngineSettings({
  settings,
  onUpdate,
}: DownloadEngineSettingsProps) {
  const { t } = useTranslation();

  return (
    <SettingsCard
      title={t("settings.engine.title")}
      description={t("settings.engine.description")}
    >
      <RadioGroup
        value={settings.downloadBackend || BACKEND_YTDLP}
        onValueChange={(v) => onUpdate("downloadBackend", v as DownloadBackend)}
        className="space-y-3"
      >
        <div className="flex items-start space-x-3 rounded-md border p-3">
          <RadioGroupItem
            value={BACKEND_YTDLP}
            id="backend-ytdlp"
            className="mt-1"
          />
          <div className="space-y-1">
            <Label
              htmlFor="backend-ytdlp"
              className="cursor-pointer font-medium"
            >
              {t("settings.engine.ytdlp")}
            </Label>
            <p className="text-muted-foreground text-xs">
              {t("settings.engine.ytdlpDesc")}
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3 rounded-md border p-3">
          <RadioGroupItem
            value={BACKEND_BUILTIN}
            id="backend-builtin"
            className="mt-1"
          />
          <div className="space-y-1">
            <Label
              htmlFor="backend-builtin"
              className="cursor-pointer font-medium"
            >
              {t("settings.engine.builtin")}
            </Label>
            <p className="text-muted-foreground text-xs">
              {t("settings.engine.builtinDesc")}
            </p>
          </div>
        </div>
      </RadioGroup>
    </SettingsCard>
  );
}
