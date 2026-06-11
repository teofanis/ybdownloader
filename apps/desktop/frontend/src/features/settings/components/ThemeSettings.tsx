import { useTranslation } from "react-i18next";
import { Sun, Moon, Monitor, Palette, CheckCircle2 } from "lucide-react";
import { Button } from "@ybdownload/ui/button";
import { Label } from "@ybdownload/ui/label";
import { Separator } from "@ybdownload/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { accentThemes, type ThemeMode } from "@/lib/themes";
import { SettingsCard } from "./SettingsCard";

const modeIcons: Record<ThemeMode, React.ReactNode> = {
  light: <Sun className="mr-1.5 h-4 w-4" />,
  dark: <Moon className="mr-1.5 h-4 w-4" />,
  system: <Monitor className="mr-1.5 h-4 w-4" />,
};

interface ThemeSettingsProps {
  themeMode: string;
  accentColor: string;
  onChange: (key: "themeMode" | "accentColor", value: string) => void;
}

export function ThemeSettings({
  themeMode,
  accentColor,
  onChange,
}: ThemeSettingsProps) {
  const { t } = useTranslation();
  const { setMode, setAccentTheme } = useTheme();

  const handleModeChange = (m: ThemeMode) => {
    setMode(m); // Apply visually
    onChange("themeMode", m); // Update settings state
  };

  const handleAccentChange = (id: string) => {
    setAccentTheme(id); // Apply visually
    onChange("accentColor", id); // Update settings state
  };

  const currentMode = (themeMode || "system") as ThemeMode;
  const currentAccent = accentColor || "purple";

  return (
    <SettingsCard
      title={t("settings.theme.title")}
      description={t("settings.theme.description")}
      icon={<Palette className="h-4 w-4" />}
    >
      <div className="space-y-6">
        {/* Mode Selection */}
        <div className="space-y-3">
          <Label>{t("settings.theme.mode")}</Label>
          <div className="flex gap-2">
            {(["light", "dark", "system"] as ThemeMode[]).map((m) => (
              <Button
                key={m}
                variant={currentMode === m ? "default" : "outline"}
                size="sm"
                onClick={() => handleModeChange(m)}
                className="flex-1"
              >
                {modeIcons[m]}
                {t(`settings.theme.modes.${m}`)}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Accent Color */}
        <div className="space-y-3">
          <Label>{t("settings.theme.accentColor")}</Label>
          <div className="grid grid-cols-4 gap-2">
            {accentThemes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleAccentChange(theme.id)}
                className={`group relative flex h-12 cursor-pointer items-center justify-center rounded-lg border-2 transition-all ${
                  currentAccent === theme.id
                    ? "border-primary ring-primary/20 ring-2"
                    : "hover:border-muted-foreground/30 border-transparent"
                }`}
                style={{ backgroundColor: `hsl(${theme.primary} / 0.15)` }}
                title={theme.name}
              >
                <div
                  className="h-6 w-6 rounded-full shadow-sm"
                  style={{ backgroundColor: `hsl(${theme.primary})` }}
                />
                {currentAccent === theme.id && (
                  <CheckCircle2 className="bg-primary absolute -top-1 -right-1 h-4 w-4 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </SettingsCard>
  );
}
