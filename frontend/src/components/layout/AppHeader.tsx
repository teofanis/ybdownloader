import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Download } from "lucide-react";
import { useAppStore } from "@/store";
import { isActiveState } from "@/types";

/**
 * Application header component.
 * Displays the app branding and active download count indicator.
 */
export function AppHeader() {
  const { t } = useTranslation();
  const queue = useAppStore((s) => s.queue);
  const activeCount = useMemo(
    () => queue.filter((i) => isActiveState(i.state)).length,
    [queue]
  );

  return (
    <header className="wails-drag flex h-14 items-center justify-between border-b border-border bg-card/50 px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Download className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-semibold leading-none">
            {t("app.title")}
          </h1>
          <p className="text-xs text-muted-foreground">{t("app.subtitle")}</p>
        </div>
      </div>

      {activeCount > 0 && (
        <div className="wails-no-drag flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1">
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          <span className="text-xs font-medium text-primary">
            {t("app.activeDownloads", { count: activeCount })}
          </span>
        </div>
      )}
    </header>
  );
}
