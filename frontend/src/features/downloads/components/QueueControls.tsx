import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { PlayCircle, StopCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/store";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";
import { isActiveState } from "@/types";

/**
 * Queue control buttons for starting all, canceling all, and clearing completed.
 */
export function QueueControls() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queue = useAppStore((s) => s.queue);

  const queued = useMemo(() => queue.filter((i) => i.state === "queued" || i.state === "ready"), [queue]);
  const completed = useMemo(() => queue.filter((i) => i.state === "completed"), [queue]);
  const hasActive = useMemo(() => queue.some((i) => isActiveState(i.state)), [queue]);

  async function handleStartAll() {
    try {
      await api.startAllDownloads();
    } catch (e) {
      toast({ title: t("errors.generic"), description: String(e), variant: "destructive" });
    }
  }

  async function handleCancelAll() {
    try {
      await api.cancelAllDownloads();
    } catch (e) {
      toast({ title: t("errors.generic"), description: String(e), variant: "destructive" });
    }
  }

  async function handleClearCompleted() {
    try {
      await api.clearCompleted();
    } catch (e) {
      toast({ title: t("errors.generic"), description: String(e), variant: "destructive" });
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">
        {queue.length} {queue.length === 1 ? "item" : "items"}
      </span>
      <div className="flex-1" />
      <div className="flex items-center gap-1">
        {queued.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleStartAll} className="gap-1.5">
            <PlayCircle className="h-4 w-4" />
            {t("downloads.startAll")}
          </Button>
        )}
        {hasActive && (
          <Button variant="outline" size="sm" onClick={handleCancelAll} className="gap-1.5 text-destructive hover:text-destructive">
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
