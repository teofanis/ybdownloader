import { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAppStore } from "@/store";
import { initializeBindings } from "@/lib/api";
import { useWailsEvents } from "@/hooks/use-wails-events";

import { DownloadsTab } from "@/features/downloads/DownloadsTab";
import { SettingsTab } from "@/features/settings/SettingsTab";
import { BrowseTab } from "@/features/browse/BrowseTab";
import { AppHeader } from "@/components/layout/AppHeader";

import type { TabId } from "@/types";

export default function App() {
  const activeTab = useAppStore((state) => state.activeTab);
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const isInitialized = useAppStore((state) => state.isInitialized);
  const setInitialized = useAppStore((state) => state.setInitialized);

  // Subscribe to Wails runtime events
  useWailsEvents();

  useEffect(() => {
    async function init() {
      try {
        await initializeBindings();
        setInitialized(true);
      } catch (error) {
        console.error("Failed to initialize:", error);
        // Still mark as initialized for dev mode
        setInitialized(true);
      }
    }
    init();
  }, [setInitialized]);

  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
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
            onValueChange={(value) => setActiveTab(value as TabId)}
            className="flex h-full flex-col"
          >
            <div className="border-b border-border px-6 py-2">
              <TabsList className="h-9">
                <TabsTrigger value="downloads" className="px-4">
                  Downloads
                </TabsTrigger>
                <TabsTrigger value="settings" className="px-4">
                  Settings
                </TabsTrigger>
                <TabsTrigger value="browse" className="px-4" disabled>
                  Browse
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <TabsContent value="downloads" className="mt-0 h-full">
                <DownloadsTab />
              </TabsContent>

              <TabsContent value="settings" className="mt-0 h-full">
                <SettingsTab />
              </TabsContent>

              <TabsContent value="browse" className="mt-0 h-full">
                <BrowseTab />
              </TabsContent>
            </div>
          </Tabs>
        </main>

        <Toaster />
      </div>
    </TooltipProvider>
  );
}
