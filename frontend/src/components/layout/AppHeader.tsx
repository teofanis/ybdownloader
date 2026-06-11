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
    <header className="wails-drag border-border bg-card/50 flex h-14 items-center justify-between border-b px-6">
      <div className="flex items-center gap-3">
        <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
          <Download className="text-primary-foreground h-4 w-4" />
        </div>
        <div>
          <h1 className="text-lg leading-none font-semibold">
            {t("app.title")}
          </h1>
          <p className="text-muted-foreground text-xs">{t("app.subtitle")}</p>
        </div>
      </div>

      {activeCount > 0 && (
        <div className="wails-no-drag bg-primary/10 flex items-center gap-2 rounded-full px-3 py-1">
          <div className="bg-primary h-2 w-2 animate-pulse rounded-full" />
          <span className="text-primary text-xs font-medium">
            {t("app.activeDownloads", { count: activeCount })}
          </span>
        </div>
      )}
    </header>
  );
}
