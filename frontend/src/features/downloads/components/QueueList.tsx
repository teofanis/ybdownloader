import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/store";
import { QueueItem } from "./QueueItem";

export function QueueList() {
  const queue = useAppStore((state) => state.queue);

  return (
    <ScrollArea className="h-full rounded-lg border bg-card/50">
      <div className="divide-y divide-border">
        {queue.map((item, index) => (
          <div
            key={item.id}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <QueueItem item={item} />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

