import { useTranslation } from "react-i18next";
import { Upload, Loader2, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarqueeText } from "@/components/ui/marquee-text";
import { formatBytes, formatDuration } from "@/lib/utils";
import type { MediaInfo } from "../types";

interface FileSelectorProps {
  selectedFile: string | null;
  mediaInfo: MediaInfo | null;
  isAnalyzing: boolean;
  onSelectFile: () => void;
}

export function FileSelector({
  selectedFile,
  mediaInfo,
  isAnalyzing,
  onSelectFile,
}: FileSelectorProps) {
  const { t } = useTranslation();
  const fileName = selectedFile?.split(/[/\\]/).pop() ?? "";

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Upload className="h-4 w-4" />
          {t("converter.selectFile")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          onClick={onSelectFile}
          variant="outline"
          className="w-full justify-start overflow-hidden"
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <FolderOpen className="mr-2 h-4 w-4 shrink-0" />
          )}
          {selectedFile ? (
            <MarqueeText className="flex-1 text-left" speed={40}>
              {fileName}
            </MarqueeText>
          ) : (
            t("converter.browseFiles")
          )}
        </Button>

        {mediaInfo && (
          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>{t("converter.duration")}:</span>
              <span>{formatDuration(mediaInfo.duration)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t("converter.size")}:</span>
              <span>{formatBytes(mediaInfo.size)}</span>
            </div>
            {mediaInfo.videoStream && (
              <div className="flex justify-between">
                <span>{t("converter.resolution")}:</span>
                <span>
                  {mediaInfo.videoStream.width}×{mediaInfo.videoStream.height}
                </span>
              </div>
            )}
            {mediaInfo.audioStream && (
              <div className="flex justify-between">
                <span>{t("converter.audio")}:</span>
                <span>
                  {mediaInfo.audioStream.codec.toUpperCase()} {mediaInfo.audioStream.channels}ch
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

