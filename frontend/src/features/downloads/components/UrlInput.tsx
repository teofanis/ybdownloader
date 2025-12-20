import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import { Plus, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/store";
import { isValidYouTubeURL } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Format } from "@/types";

/**
 * URL input component with format selector.
 * Handles YouTube URL validation and auto-paste on focus.
 */
export function UrlInput() {
  const { t } = useTranslation();
  const { toast } = useToast();
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
      const item = {
        id: crypto.randomUUID(),
        url,
        state: "queued" as const,
        format: selectedFormat,
        savePath: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
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
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="mp3">{t("downloads.formatSelector.mp3")}</SelectItem>
            <SelectItem value="m4a">{t("downloads.formatSelector.m4a")}</SelectItem>
            <SelectItem value="mp4">{t("downloads.formatSelector.mp4")}</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleAdd} disabled={isAddingToQueue || !urlInput.trim()}>
          {isAddingToQueue ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          <span className="ml-1.5 hidden sm:inline">{t("downloads.addToQueue")}</span>
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
