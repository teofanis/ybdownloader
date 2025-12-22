import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supportedLanguages, type SupportedLanguage } from "@/lib/i18n";
import { SettingsCard } from "./SettingsCard";

export function LanguageSettings() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lang: SupportedLanguage) => {
    i18n.changeLanguage(lang);
  };

  return (
    <SettingsCard title={t("settings.fields.language")} description={t("settings.sections.general")}>
      <Select value={i18n.language} onValueChange={(v) => changeLanguage(v as SupportedLanguage)}>
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

