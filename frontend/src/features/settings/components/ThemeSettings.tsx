import { useTranslation } from "react-i18next";
import { Sun, Moon, Monitor, Palette, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { accentThemes, type ThemeMode } from "@/lib/themes";
import { SettingsCard } from "./SettingsCard";

const modeIcons: Record<ThemeMode, React.ReactNode> = {
  light: <Sun className="mr-1.5 h-4 w-4" />,
  dark: <Moon className="mr-1.5 h-4 w-4" />,
  system: <Monitor className="mr-1.5 h-4 w-4" />,
};

export function ThemeSettings() {
  const { t } = useTranslation();
  const { mode, accentTheme, setMode, setAccentTheme } = useTheme();

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
                variant={mode === m ? "default" : "outline"}
                size="sm"
                onClick={() => setMode(m)}
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
                onClick={() => setAccentTheme(theme.id)}
                className={`group relative flex h-12 items-center justify-center rounded-lg border-2 transition-all ${
                  accentTheme === theme.id
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-transparent hover:border-muted-foreground/30"
                }`}
                style={{ backgroundColor: `hsl(${theme.primary} / 0.15)` }}
                title={theme.name}
              >
                <div
                  className="h-6 w-6 rounded-full shadow-sm"
                  style={{ backgroundColor: `hsl(${theme.primary})` }}
                />
                {accentTheme === theme.id && (
                  <CheckCircle2 className="absolute -right-1 -top-1 h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </SettingsCard>
  );
}

