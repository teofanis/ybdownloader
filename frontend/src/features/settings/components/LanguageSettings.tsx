import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supportedLanguages, type SupportedLanguage } from "@/lib/i18n";
import { SettingsCard } from "./SettingsCard";

interface LanguageSettingsProps {
  language: string;
  onChange: (key: "language", value: string) => void;
}

export function LanguageSettings({ language, onChange }: LanguageSettingsProps) {
  const { t, i18n } = useTranslation();

  const handleChange = (lang: SupportedLanguage) => {
    i18n.changeLanguage(lang); // Apply immediately
    onChange("language", lang); // Update settings state
  };

  const currentLang = language || i18n.language || "en";

  return (
    <SettingsCard title={t("settings.fields.language")} description={t("settings.sections.general")}>
      <Select value={currentLang} onValueChange={(v) => handleChange(v as SupportedLanguage)}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(supportedLanguages).map(([code, { nativeName }]) => (
            <SelectItem key={code} value={code}>
              {nativeName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </SettingsCard>
  );
}
