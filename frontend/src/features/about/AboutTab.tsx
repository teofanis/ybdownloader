import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Github,
  Star,
  RefreshCw,
  Download,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2,
  Heart,
  Coffee,
  Info,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";
import { BrowserOpenURL } from "../../../wailsjs/runtime/runtime";

const GITHUB_REPO_URL = "https://github.com/teofanis/ybdownloader";
const GITHUB_RELEASES_URL = "https://github.com/teofanis/ybdownloader/releases";
const GITHUB_ISSUES_URL = "https://github.com/teofanis/ybdownloader/issues";

export function AboutTab() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [version, setVersion] = useState<string>("");
  const [updateInfo, setUpdateInfo] = useState<api.UpdateInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Load version on mount
  useEffect(() => {
    api.getAppVersion().then(setVersion).catch(console.error);
  }, []);

  const handleCheckUpdate = async () => {
    setIsChecking(true);
    try {
      const info = await api.checkForUpdate();
      setUpdateInfo(info);

      if (info.status === "up_to_date") {
        toast({
          title: t("about.update.upToDate"),
          description: t("about.update.upToDateDesc"),
        });
      } else if (info.status === "available") {
        toast({
          title: t("about.update.available"),
          description: t("about.update.availableDesc", { version: info.latestVersion }),
        });
      }
    } catch (e) {
      toast({
        title: t("errors.generic"),
        description: String(e),
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleDownloadUpdate = async () => {
    setIsDownloading(true);
    try {
      await api.downloadUpdate();
      const info = await api.getUpdateInfo();
      setUpdateInfo(info);

      if (info.status === "ready") {
        toast({
          title: t("about.update.downloadComplete"),
          description: t("about.update.downloadCompleteDesc"),
        });
      }
    } catch (e) {
      toast({
        title: t("errors.generic"),
        description: String(e),
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleInstallUpdate = async () => {
    try {
      await api.installUpdate();
      // App will restart
    } catch (e) {
      toast({
        title: t("errors.generic"),
        description: String(e),
        variant: "destructive",
      });
    }
  };

  const handleOpenReleasePage = () => {
    api.openReleasePage().catch(() => {
      BrowserOpenURL(GITHUB_RELEASES_URL);
    });
  };

  const getUpdateStatusIcon = () => {
    if (!updateInfo) return null;

    switch (updateInfo.status) {
      case "checking":
        return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
      case "available":
        return <Sparkles className="h-5 w-5 text-amber-500" />;
      case "downloading":
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      case "ready":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "up_to_date":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* App Info */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
            <Download className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">{t("app.title")}</CardTitle>
          <CardDescription className="text-lg">{t("app.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="text-base px-3 py-1">
              v{version || "..."}
            </Badge>
            {updateInfo?.status === "available" && (
              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                {t("about.update.newVersion", { version: updateInfo.latestVersion })}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Update Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">{t("about.update.title")}</CardTitle>
            </div>
            {getUpdateStatusIcon()}
          </div>
          <CardDescription>{t("about.update.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Version info */}
          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
            <div>
              <p className="text-sm text-muted-foreground">{t("about.update.currentVersion")}</p>
              <p className="font-mono font-medium">v{version || "..."}</p>
            </div>
            {updateInfo?.latestVersion && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{t("about.update.latestVersion")}</p>
                <p className="font-mono font-medium">v{updateInfo.latestVersion}</p>
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
            {(!updateInfo || updateInfo.status === "idle" || updateInfo.status === "up_to_date" || updateInfo.status === "error") && (
              <Button onClick={handleCheckUpdate} disabled={isChecking} variant="outline">
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
                <Button onClick={handleDownloadUpdate} disabled={isDownloading}>
                  {isDownloading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  {t("about.update.downloadNow")}
                </Button>
                <Button variant="outline" onClick={handleOpenReleasePage}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {t("about.update.viewRelease")}
                </Button>
              </>
            )}

            {updateInfo?.status === "ready" && (
              <Button onClick={handleInstallUpdate} className="bg-green-600 hover:bg-green-700">
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

      {/* Links */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">{t("about.links.title")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              onClick={() => BrowserOpenURL(GITHUB_REPO_URL)}
            >
              <Github className="mr-3 h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">{t("about.links.github")}</p>
                <p className="text-xs text-muted-foreground">{t("about.links.githubDesc")}</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              onClick={() => BrowserOpenURL(GITHUB_REPO_URL)}
            >
              <Star className="mr-3 h-5 w-5 text-amber-500" />
              <div className="text-left">
                <p className="font-medium">{t("about.links.star")}</p>
                <p className="text-xs text-muted-foreground">{t("about.links.starDesc")}</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              onClick={() => BrowserOpenURL(GITHUB_ISSUES_URL)}
            >
              <AlertCircle className="mr-3 h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">{t("about.links.issues")}</p>
                <p className="text-xs text-muted-foreground">{t("about.links.issuesDesc")}</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              onClick={() => BrowserOpenURL(GITHUB_RELEASES_URL)}
            >
              <Download className="mr-3 h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">{t("about.links.releases")}</p>
                <p className="text-xs text-muted-foreground">{t("about.links.releasesDesc")}</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Support */}
      <Card className="border-pink-500/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            <CardTitle className="text-lg">{t("about.support.title")}</CardTitle>
          </div>
          <CardDescription>{t("about.support.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="border-amber-500/30 hover:bg-amber-500/10"
              onClick={() => BrowserOpenURL("https://buymeacoffee.com/teofanis")}
            >
              <Coffee className="mr-2 h-4 w-4 text-amber-500" />
              {t("about.support.coffee")}
            </Button>
            <Button
              variant="outline"
              className="border-blue-500/30 hover:bg-blue-500/10"
              onClick={() => BrowserOpenURL("https://www.paypal.com/paypalme/teofanis")}
            >
              <Heart className="mr-2 h-4 w-4 text-blue-500" />
              {t("about.support.paypal")}
            </Button>
            <Button
              variant="outline"
              className="border-pink-500/30 hover:bg-pink-500/10"
              onClick={() => BrowserOpenURL("https://thanks.dev/u/gh/teofanis")}
            >
              <Sparkles className="mr-2 h-4 w-4 text-pink-500" />
              {t("about.support.thanksDev")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        <p>{t("about.footer.madeWith")}</p>
        <p className="mt-1">{t("about.footer.license")}</p>
      </div>
    </div>
  );
}

