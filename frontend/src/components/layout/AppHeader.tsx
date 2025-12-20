import { useMemo } from "react";
import { Download } from "lucide-react";
import { useAppStore } from "@/store";
import { isActiveState } from "@/types";

export function AppHeader() {
  const queue = useAppStore((state) => state.queue);

  // Derive values in component to avoid selector reference issues
  const activeDownloads = useMemo(
    () => queue.filter((item) => isActiveState(item.state)),
    [queue]
  );
  const hasActiveDownloads = activeDownloads.length > 0;

  return (
    <header className="wails-drag flex h-14 items-center justify-between border-b border-border bg-card/50 px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Download className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-semibold leading-none">YBDownload</h1>
          <p className="text-xs text-muted-foreground">YouTube Downloader</p>
        </div>
      </div>

      {hasActiveDownloads && (
        <div className="wails-no-drag flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1">
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          <span className="text-xs font-medium text-primary">
            {activeDownloads.length} active download
            {activeDownloads.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}
    </header>
  );
}
