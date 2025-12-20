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
import * as api from "@/lib/api";
import type { Format } from "@/types";

/**
 * URL input component with format selector and file import.
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
  } = useAppStore(
    useShallow((s) => ({
      urlInput: s.urlInput,
      setUrlInput: s.setUrlInput,
      selectedFormat: s.selectedFormat,
      setSelectedFormat: s.setSelectedFormat,
      isAddingToQueue: s.isAddingToQueue,
      setAddingToQueue: s.setAddingToQueue,
      resetUrlInput: s.resetUrlInput,
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
      await api.addToQueue(url, selectedFormat);
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

      if (lines.length === 0) {
        toast({ title: t("downloads.importEmpty"), variant: "destructive" });
        return;
      }

      // Use backend to validate, deduplicate and import
      const result = await api.importURLs(lines, selectedFormat);

      if (result.added > 0) {
        toast({
          title: t("downloads.importSuccess", { count: result.added }),
          description: result.skipped > 0 || result.invalid > 0
            ? t("downloads.importSkipped", { skipped: result.skipped, invalid: result.invalid })
            : undefined,
        });
      } else if (result.skipped > 0) {
        toast({
          title: t("downloads.importEmpty"),
          description: t("downloads.importAllDuplicates"),
        });
      } else {
        toast({
          title: t("downloads.importEmpty"),
          description: t("downloads.importNoValid"),
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({ title: t("errors.generic"), variant: "destructive" });
    } finally {
      setAddingToQueue(false);
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
