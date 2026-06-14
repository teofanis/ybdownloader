import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ToastAction } from "@ybdownload/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store";
import * as api from "@/lib/api";
import { formatVersion } from "@/features/about/utils";

const isShowcase = import.meta.env.VITE_SHOWCASE === "1";

/**
 * Checks for app updates once after startup and notifies the user when one is available.
 */
export function useStartupUpdateCheck(enabled: boolean) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const setUpdateInfo = useAppStore((s) => s.setUpdateInfo);
  const hasChecked = useRef(false);

  useEffect(() => {
    if (!enabled || isShowcase || hasChecked.current) return;
    hasChecked.current = true;

    let cancelled = false;

    (async () => {
      try {
        const info = await api.checkForUpdate();
        if (cancelled) return;

        setUpdateInfo(info);

        if (info.status !== "available") return;

        const actionLabel = t("about.update.downloadNow");

        toast({
          title: t("about.update.available"),
          description: t("about.update.availableDesc", {
            version: formatVersion(info.latestVersion),
          }),
          action: (
            <ToastAction
              altText={actionLabel}
              onClick={() => setActiveTab("about")}
            >
              {actionLabel}
            </ToastAction>
          ),
        });
      } catch (e) {
        console.error("Startup update check failed:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, toast, t, setActiveTab, setUpdateInfo]);
}
