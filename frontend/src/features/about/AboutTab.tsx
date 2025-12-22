import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";
import { BrowserOpenURL } from "../../../wailsjs/runtime/runtime";
import { AppInfoCard, UpdateCard, LinksCard, SupportCard } from "./components";
import { formatVersion, GITHUB_RELEASES_URL } from "./utils";

export function AboutTab() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [version, setVersion] = useState<string>("");
  const [updateInfo, setUpdateInfo] = useState<api.UpdateInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

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
          description: t("about.update.availableDesc", { version: formatVersion(info.latestVersion) }),
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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <AppInfoCard
        version={version}
        hasUpdate={updateInfo?.status === "available"}
        latestVersion={updateInfo?.latestVersion}
      />

      <UpdateCard
        version={version}
        updateInfo={updateInfo}
        isChecking={isChecking}
        isDownloading={isDownloading}
        onCheck={handleCheckUpdate}
        onDownload={handleDownloadUpdate}
        onInstall={handleInstallUpdate}
        onOpenReleasePage={handleOpenReleasePage}
      />

      <LinksCard />

      <SupportCard />

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        <p>{t("about.footer.madeWith")}</p>
        <p className="mt-1">{t("about.footer.license")}</p>
      </div>
    </div>
  );
}
