import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  normalizeUpdateChannel,
  type UpdateChannel,
} from "@ybdownload/shared/releases";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store";
import * as api from "@/lib/api";
import type { Settings } from "@/types";
import { BrowserOpenURL } from "../../../wailsjs/runtime/runtime";
import { AppInfoCard, UpdateCard, LinksCard, SupportCard } from "./components";
import { formatVersion, GITHUB_RELEASES_URL } from "./utils";

export function AboutTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const updateInfo = useAppStore((s) => s.updateInfo);
  const setUpdateInfo = useAppStore((s) => s.setUpdateInfo);
  const settings = useAppStore((s) => s.settings);
  const setSettings = useAppStore((s) => s.setSettings);

  const [version, setVersion] = useState<string>("");
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSavingChannel, setIsSavingChannel] = useState(false);

  const updateChannel = normalizeUpdateChannel(settings?.updateChannel);

  useEffect(() => {
    api.getAppVersion().then(setVersion).catch(console.error);

    const cached = useAppStore.getState().updateInfo;
    if (cached && cached.status !== "idle") return;

    api
      .getUpdateInfo()
      .then((info) => {
        if (info.status !== "idle") {
          setUpdateInfo(info);
        }
      })
      .catch(console.error);
  }, [setUpdateInfo]);

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
          description: t("about.update.availableDesc", {
            version: formatVersion(info.latestVersion),
          }),
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

  const handleUpdateChannelChange = async (channel: UpdateChannel) => {
    if (!settings || channel === updateChannel) return;

    setIsSavingChannel(true);
    setIsChecking(true);
    try {
      const nextSettings: Settings = { ...settings, updateChannel: channel };
      await api.saveSettings(nextSettings);
      setSettings(nextSettings);

      const info = await api.checkForUpdate();
      setUpdateInfo(info);
    } catch (e) {
      toast({
        title: t("errors.generic"),
        description: String(e),
        variant: "destructive",
      });
    } finally {
      setIsSavingChannel(false);
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
        updateChannel={updateChannel}
        isChecking={isChecking}
        isDownloading={isDownloading}
        isSavingChannel={isSavingChannel}
        onCheck={handleCheckUpdate}
        onDownload={handleDownloadUpdate}
        onInstall={handleInstallUpdate}
        onOpenReleasePage={handleOpenReleasePage}
        onUpdateChannelChange={handleUpdateChannelChange}
      />

      <LinksCard />

      <SupportCard />

      <div className="text-muted-foreground text-center text-sm">
        <p>{t("about.footer.madeWith")}</p>
        <p className="mt-1">{t("about.footer.license")}</p>
      </div>
    </div>
  );
}
