import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import { Plus, Link2, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAppStore } from "@/store";
import { isValidYouTubeURL } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Format, QueueItemWithProgress } from "@/types";

/**
 * URL input component with format selector and file import.
 * Handles YouTube URL validation, auto-paste on focus, and batch import from .txt files.
 */
export function UrlInput() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    urlInput,
    setUrlInput,
    selectedFormat,
    setSelectedFormat,
    isAddingToQueue,
    setAddingToQueue,
    resetUrlInput,
    queue,
    setQueue,
  } = useAppStore(
    useShallow((s) => ({
      urlInput: s.urlInput,
      setUrlInput: s.setUrlInput,
      selectedFormat: s.selectedFormat,
      setSelectedFormat: s.setSelectedFormat,
      isAddingToQueue: s.isAddingToQueue,
      setAddingToQueue: s.setAddingToQueue,
      resetUrlInput: s.resetUrlInput,
      queue: s.queue,
      setQueue: s.setQueue,
    }))
  );
  const [error, setError] = useState<string | null>(null);

  function createQueueItem(url: string, format: Format): QueueItemWithProgress {
    return {
      id: crypto.randomUUID(),
      url,
      state: "queued",
      format,
      savePath: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async function handleAdd() {
    const url = urlInput.trim();
    if (!url) {
      setError(t("toasts.invalidUrlDesc"));
      return;
    }
    if (!isValidYouTubeURL(url)) {
      setError(t("toasts.invalidUrlDesc"));
      return;
    }

    setError(null);
    setAddingToQueue(true);

    try {
      const item = createQueueItem(url, selectedFormat);
      setQueue([...queue, item]);
      resetUrlInput();
      toast({ title: t("toasts.addedToQueue") });
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("errors.generic");
      setError(msg);
      toast({ title: t("errors.generic"), description: msg, variant: "destructive" });
    } finally {
      setAddingToQueue(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !isAddingToQueue) handleAdd();
  }

  async function handleFocus() {
    try {
      const text = await navigator.clipboard.readText();
      if (text && isValidYouTubeURL(text) && !urlInput) {
        setUrlInput(text);
        setError(null);
      }
    } catch {}
  }

  function handleFileClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAddingToQueue(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const validUrls = lines.filter(isValidYouTubeURL);

      if (validUrls.length === 0) {
        toast({ title: t("downloads.importEmpty"), variant: "destructive" });
        return;
      }

      // Filter out duplicates (URLs already in queue)
      const existingUrls = new Set(queue.map((item) => item.url));
      const newUrls = validUrls.filter((url) => !existingUrls.has(url));

      if (newUrls.length === 0) {
        toast({ title: t("downloads.importEmpty"), description: "All URLs are already in queue" });
        return;
      }

      const newItems = newUrls.map((url) => createQueueItem(url, selectedFormat));
      setQueue([...queue, ...newItems]);
      toast({ title: t("downloads.importSuccess", { count: newItems.length }) });
    } catch (err) {
      toast({ title: t("errors.generic"), variant: "destructive" });
    } finally {
      setAddingToQueue(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="url"
            placeholder={t("downloads.urlPlaceholder")}
            value={urlInput}
            onChange={(e) => { setUrlInput(e.target.value); setError(null); }}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            className={`pl-9 ${error ? "border-destructive" : ""}`}
            disabled={isAddingToQueue}
            aria-label="YouTube URL"
          />
        </div>
        <Select value={selectedFormat} onValueChange={(v) => setSelectedFormat(v as Format)} disabled={isAddingToQueue}>
          <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="mp3">{t("downloads.formatSelector.mp3")}</SelectItem>
            <SelectItem value="m4a">{t("downloads.formatSelector.m4a")}</SelectItem>
            <SelectItem value="mp4">{t("downloads.formatSelector.mp4")}</SelectItem>
          </SelectContent>
        </Select>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" onClick={handleFileClick} disabled={isAddingToQueue} size="icon">
              <FileText className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("downloads.importFileHint")}</TooltipContent>
        </Tooltip>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,text/plain"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button onClick={handleAdd} disabled={isAddingToQueue || !urlInput.trim()}>
          {isAddingToQueue ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          <span className="ml-1.5 hidden sm:inline">{t("downloads.addToQueue")}</span>
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
