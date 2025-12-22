import { useTranslation } from "react-i18next";
import {
  RefreshCw,
  Download,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { UpdateInfo } from "@/lib/api";
import { formatVersion } from "../utils";

interface UpdateCardProps {
  version: string;
  updateInfo: UpdateInfo | null;
  isChecking: boolean;
  isDownloading: boolean;
  onCheck: () => void;
  onDownload: () => void;
  onInstall: () => void;
  onOpenReleasePage: () => void;
}

export function UpdateCard({
  version,
  updateInfo,
  isChecking,
  isDownloading,
  onCheck,
  onDownload,
  onInstall,
  onOpenReleasePage,
}: UpdateCardProps) {
  const { t } = useTranslation();

  const getStatusIcon = () => {
    if (!updateInfo) return null;

    switch (updateInfo.status) {
      case "checking":
        return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
      case "available":
        return <Sparkles className="h-5 w-5 text-amber-500" />;
      case "downloading":
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      case "ready":
      case "up_to_date":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return null;
    }
  };

  const showCheckButton =
    !updateInfo ||
    updateInfo.status === "idle" ||
    updateInfo.status === "up_to_date" ||
    updateInfo.status === "error";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">{t("about.update.title")}</CardTitle>
          </div>
          {getStatusIcon()}
        </div>
        <CardDescription>{t("about.update.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Version info */}
        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
          <div>
            <p className="text-sm text-muted-foreground">{t("about.update.currentVersion")}</p>
            <p className="font-mono font-medium">v{formatVersion(version) || "..."}</p>
          </div>
          {updateInfo?.latestVersion && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{t("about.update.latestVersion")}</p>
              <p className="font-mono font-medium">v{formatVersion(updateInfo.latestVersion)}</p>
            </div>
          )}
        </div>

        {/* Download progress */}
        {updateInfo?.status === "downloading" && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t("about.update.downloading")}</span>
              <span>{Math.round(updateInfo.progress)}%</span>
            </div>
            <Progress value={updateInfo.progress} />
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {showCheckButton && (
            <Button onClick={onCheck} disabled={isChecking} variant="outline">
              {isChecking ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {t("about.update.checkNow")}
            </Button>
          )}

          {updateInfo?.status === "available" && (
            <>
              <Button onClick={onDownload} disabled={isDownloading}>
                {isDownloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {t("about.update.downloadNow")}
              </Button>
              <Button variant="outline" onClick={onOpenReleasePage}>
                <ExternalLink className="mr-2 h-4 w-4" />
                {t("about.update.viewRelease")}
              </Button>
            </>
          )}

          {updateInfo?.status === "ready" && (
            <Button onClick={onInstall} className="bg-green-600 hover:bg-green-700">
              <Download className="mr-2 h-4 w-4" />
              {t("about.update.installNow")}
            </Button>
          )}
        </div>

        {/* Release notes */}
        {updateInfo?.releaseNotes && updateInfo.status === "available" && (
          <div className="rounded-lg border p-4">
            <p className="mb-2 text-sm font-medium">{t("about.update.releaseNotes")}</p>
            <div className="prose prose-sm prose-invert max-h-40 overflow-auto text-sm text-muted-foreground">
              <pre className="whitespace-pre-wrap font-sans">{updateInfo.releaseNotes}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

