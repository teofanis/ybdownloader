import { useMemo } from "react";
import { PlayCircle, StopCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/store";
import { isActiveState } from "@/types";

export function QueueControls() {
  const queue = useAppStore((state) => state.queue);
  const setQueue = useAppStore((state) => state.setQueue);

  // Derive values in component to avoid selector reference issues
  const queuedItems = useMemo(
    () => queue.filter((item) => item.state === "queued" || item.state === "ready"),
    [queue]
  );
  const completedItems = useMemo(
    () => queue.filter((item) => item.state === "completed"),
    [queue]
  );
  const hasActiveDownloads = useMemo(
    () => queue.some((item) => isActiveState(item.state)),
    [queue]
  );

  const handleStartAll = () => {
    // Will be connected to API
    console.log("Start all downloads");
  };

  const handleCancelAll = () => {
    // Will be connected to API
    console.log("Cancel all downloads");
  };

  const handleClearCompleted = () => {
    const remaining = queue.filter((item) => item.state !== "completed");
    setQueue(remaining);
  };

  const canStartAll = queuedItems.length > 0;
  const canClearCompleted = completedItems.length > 0;

  return (
    <div className="flex items-center gap-2">
      <div className="text-sm text-muted-foreground">
        {queue.length} item{queue.length !== 1 ? "s" : ""} in queue
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        {canStartAll && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleStartAll}
            className="gap-1.5"
          >
            <PlayCircle className="h-4 w-4" />
            <span>Start All</span>
          </Button>
        )}

        {hasActiveDownloads && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancelAll}
            className="gap-1.5 text-destructive hover:text-destructive"
          >
            <StopCircle className="h-4 w-4" />
            <span>Cancel All</span>
          </Button>
        )}

        {canClearCompleted && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearCompleted}
              className="gap-1.5 text-muted-foreground"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear Completed</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
