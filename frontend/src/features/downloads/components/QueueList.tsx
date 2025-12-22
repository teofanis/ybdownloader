import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/store";
import { QueueItem } from "./QueueItem";

/**
 * Scrollable list of queue items.
 * Renders each item with staggered animation delay.
 */
export function QueueList() {
  const queue = useAppStore((s) => s.queue);

  return (
    <ScrollArea className="h-full rounded-lg border bg-card/50">
      <div className="divide-y divide-border">
        {queue.map((item, i) => (
          <div
            key={item.id}
            className="animate-fade-in"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <QueueItem item={item} />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
