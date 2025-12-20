import { useState } from "react";
import { Plus, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/store";
import { isValidYouTubeURL } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Format } from "@/types";

export function UrlInput() {
  const { toast } = useToast();
  const urlInput = useAppStore((state) => state.urlInput);
  const setUrlInput = useAppStore((state) => state.setUrlInput);
  const selectedFormat = useAppStore((state) => state.selectedFormat);
  const setSelectedFormat = useAppStore((state) => state.setSelectedFormat);
  const isAddingToQueue = useAppStore((state) => state.isAddingToQueue);
  const setAddingToQueue = useAppStore((state) => state.setAddingToQueue);
  const resetUrlInput = useAppStore((state) => state.resetUrlInput);
  const queue = useAppStore((state) => state.queue);
  const setQueue = useAppStore((state) => state.setQueue);

  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    const trimmedUrl = urlInput.trim();

    if (!trimmedUrl) {
      setError("Please enter a URL");
      return;
    }

    if (!isValidYouTubeURL(trimmedUrl)) {
      setError("Please enter a valid YouTube URL");
      return;
    }

    setError(null);
    setAddingToQueue(true);

    try {
      // For now, we'll simulate adding to queue locally
      // This will be replaced with actual API call once backend is wired
      const newItem = {
        id: crypto.randomUUID(),
        url: trimmedUrl,
        state: "queued" as const,
        format: selectedFormat,
        savePath: "", // Will be set from settings
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setQueue([...queue, newItem]);
      resetUrlInput();

      toast({
        title: "Added to queue",
        description: "Video has been added to the download queue",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add to queue";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setAddingToQueue(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isAddingToQueue) {
      handleAdd();
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && isValidYouTubeURL(text)) {
        setUrlInput(text);
        setError(null);
      }
    } catch {
      // Clipboard access denied
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="url"
            placeholder="Paste YouTube URL here..."
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            onFocus={handlePaste}
            className={`pl-9 ${error ? "border-destructive" : ""}`}
            disabled={isAddingToQueue}
            aria-label="YouTube URL"
            aria-invalid={!!error}
            aria-describedby={error ? "url-error" : undefined}
          />
        </div>

        <Select
          value={selectedFormat}
          onValueChange={(value) => setSelectedFormat(value as Format)}
          disabled={isAddingToQueue}
        >
          <SelectTrigger className="w-[120px]" aria-label="Output format">
            <SelectValue placeholder="Format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mp3">MP3</SelectItem>
            <SelectItem value="m4a">M4A</SelectItem>
            <SelectItem value="mp4">MP4</SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={handleAdd}
          disabled={isAddingToQueue || !urlInput.trim()}
          aria-label="Add to queue"
        >
          {isAddingToQueue ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          <span className="ml-1.5 hidden sm:inline">Add</span>
        </Button>
      </div>

      {error && (
        <p id="url-error" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

