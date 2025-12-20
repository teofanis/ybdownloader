import { useTranslation } from "react-i18next";
import { UrlInput } from "./components/UrlInput";
import { QueueList } from "./components/QueueList";
import { QueueControls } from "./components/QueueControls";
import { useAppStore } from "@/store";

/**
 * Main downloads tab component.
 * Contains the URL input, queue controls, and download queue list.
 */
export function DownloadsTab() {
  const queue = useAppStore((s) => s.queue);

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="space-y-4">
        <UrlInput />
        {queue.length > 0 && <QueueControls />}
      </div>
      <div className="flex-1 overflow-hidden">
        {queue.length > 0 ? <QueueList /> : <EmptyState />}
      </div>
    </div>
  );
}

function EmptyState() {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <svg className="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
        </svg>
      </div>
      <div>
        <h3 className="font-semibold">{t("downloads.emptyQueue")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t("downloads.emptyQueueHint")}</p>
      </div>
    </div>
  );
}
