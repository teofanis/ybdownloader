import { useTranslation } from "react-i18next";
import { FileText } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingsCard } from "./SettingsCard";

const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;

interface LogSettingsProps {
  logLevel: string;
  onChange: (key: "logLevel", value: string) => void;
}

export function LogSettings({ logLevel, onChange }: LogSettingsProps) {
  const { t } = useTranslation();

  return (
    <SettingsCard
      title={t("settings.logging.title")}
      description={t("settings.logging.description")}
      icon={<FileText className="h-4 w-4" />}
    >
      <div className="space-y-3">
        <Label>{t("settings.logging.level")}</Label>
        <Select
          value={logLevel || "info"}
          onValueChange={(v) => onChange("logLevel", v)}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LOG_LEVELS.map((level) => (
              <SelectItem key={level} value={level}>
                {t(`settings.logging.levels.${level}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {t("settings.logging.hint")}
        </p>
      </div>
    </SettingsCard>
  );
}
