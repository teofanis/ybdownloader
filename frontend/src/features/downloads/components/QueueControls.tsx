import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import { PlayCircle, StopCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/store";
import { isActiveState } from "@/types";

/**
 * Queue control buttons for bulk actions.
 * Provides start all, cancel all, and clear completed actions.
 */
export function QueueControls() {
  const { t } = useTranslation();
  const { queue, setQueue } = useAppStore(
    useShallow((s) => ({ queue: s.queue, setQueue: s.setQueue }))
  );

  const queued = useMemo(() => queue.filter((i) => i.state === "queued" || i.state === "ready"), [queue]);
  const completed = useMemo(() => queue.filter((i) => i.state === "completed"), [queue]);
  const hasActive = useMemo(() => queue.some((i) => isActiveState(i.state)), [queue]);

  function handleClearCompleted() {
    setQueue(queue.filter((i) => i.state !== "completed"));
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">
        {queue.length} item{queue.length !== 1 ? "s" : ""} in queue
      </span>
      <div className="flex-1" />
      <div className="flex items-center gap-1">
        {queued.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => console.log("start all")} className="gap-1.5">
            <PlayCircle className="h-4 w-4" />
            {t("downloads.startAll")}
          </Button>
        )}
        {hasActive && (
          <Button variant="outline" size="sm" onClick={() => console.log("cancel all")} className="gap-1.5 text-destructive hover:text-destructive">
            <StopCircle className="h-4 w-4" />
            {t("downloads.pauseAll")}
          </Button>
        )}
        {completed.length > 0 && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="ghost" size="sm" onClick={handleClearCompleted} className="gap-1.5 text-muted-foreground">
              <Trash2 className="h-4 w-4" />
              {t("downloads.clearCompleted")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
