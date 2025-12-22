import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import { RotateCcw, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store";
import * as api from "@/lib/api";
import type { Settings } from "@/types";
import {
  LanguageSettings,
  ThemeSettings,
  SavePathSettings,
  FormatSettings,
  ConcurrentDownloadsSettings,
  FFmpegSettings,
} from "./components";

export function SettingsTab() {
  const { t } = useTranslation();
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

  // Load settings on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const s = settings ? settings : await api.getSettings();
        if (!settings) setSettings(s);
        setLocal(s);
      } catch (e) {
        console.error("Failed to load settings:", e);
        toast({ title: t("errors.generic"), variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [settings, setSettings, setLoading, toast, t]);

  const update = <K extends keyof Settings>(key: K, val: Settings[K]) => {
    if (!local) return;
    setLocal({ ...local, [key]: val });
    setDirty(true);
  };

  const save = async () => {
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
  };

  const reset = async () => {
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
  };

  if (loading || !local) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t("settings.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("settings.sections.general")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={reset} disabled={saving}>
            <RotateCcw className="mr-1.5 h-4 w-4" />
            {t("settings.reset")}
          </Button>
          <Button onClick={save} disabled={!dirty || saving}>
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
            {t("settings.save")}
          </Button>
        </div>
      </div>

      {/* Settings Sections */}
      <LanguageSettings />
      <ThemeSettings />
      <SavePathSettings settings={local} onUpdate={update} />
      <FormatSettings settings={local} onUpdate={update} />
      <ConcurrentDownloadsSettings settings={local} onUpdate={update} />
      <FFmpegSettings settings={local} onUpdate={update} />
    </div>
  );
}

