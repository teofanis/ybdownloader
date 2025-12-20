import { UrlInput } from "./components/UrlInput";
import { QueueList } from "./components/QueueList";
import { QueueControls } from "./components/QueueControls";
import { useAppStore } from "@/store";

export function DownloadsTab() {
  const queue = useAppStore((state) => state.queue);
  const hasItems = queue.length > 0;

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="space-y-4">
        <UrlInput />
        {hasItems && <QueueControls />}
      </div>

      <div className="flex-1 overflow-hidden">
        {hasItems ? (
          <QueueList />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <svg
          className="h-8 w-8 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
          />
        </svg>
      </div>
      <div>
        <h3 className="font-semibold">No downloads yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste a YouTube URL above to get started
        </p>
      </div>
    </div>
  );
}

