import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAppStore } from "@/store";
import { initializeBindings } from "@/lib/api";
import { useWailsEvents } from "@/hooks/use-wails-events";
import { DownloadsTab } from "@/features/downloads/DownloadsTab";
import { ConverterTab } from "@/features/converter/ConverterTab";
import { BrowseTab } from "@/features/browse/BrowseTab";
import { SettingsTab } from "@/features/settings/SettingsTab";
import { AboutTab } from "@/features/about/AboutTab";
import { AppHeader } from "@/components/layout/AppHeader";
import type { TabId } from "@/types";

export default function App() {
  const { t } = useTranslation();
  const { activeTab, setActiveTab, isInitialized, setInitialized } = useAppStore(
    useShallow((s) => ({
      activeTab: s.activeTab,
      setActiveTab: s.setActiveTab,
      isInitialized: s.isInitialized,
      setInitialized: s.setInitialized,
    }))
  );

  useWailsEvents();

  useEffect(() => {
    initializeBindings()
      .catch((e) => console.error("Init failed:", e))
      .finally(() => setInitialized(true));
  }, [setInitialized]);

  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen flex-col bg-background">
        <AppHeader />
        <main className="flex-1 overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TabId)}
            className="flex h-full flex-col"
          >
            <div className="border-b border-border px-6 py-2">
              <TabsList className="h-9">
                <TabsTrigger value="downloads" className="px-4">{t("tabs.downloads")}</TabsTrigger>
                <TabsTrigger value="browse" className="px-4">{t("tabs.browse")}</TabsTrigger>
                <TabsTrigger value="converter" className="px-4">{t("tabs.converter")}</TabsTrigger>
                <TabsTrigger value="settings" className="px-4">{t("tabs.settings")}</TabsTrigger>
                <TabsTrigger value="about" className="px-4">{t("tabs.about")}</TabsTrigger>
              </TabsList>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <TabsContent value="downloads" className="mt-0 h-full"><DownloadsTab /></TabsContent>
              <TabsContent value="browse" className="mt-0 h-full"><BrowseTab /></TabsContent>
              <TabsContent value="converter" className="mt-0 h-full"><ConverterTab /></TabsContent>
              <TabsContent value="settings" className="mt-0 h-full"><SettingsTab /></TabsContent>
              <TabsContent value="about" className="mt-0 h-full"><AboutTab /></TabsContent>
            </div>
          </Tabs>
        </main>
        <Toaster />
      </div>
    </TooltipProvider>
  );
}
