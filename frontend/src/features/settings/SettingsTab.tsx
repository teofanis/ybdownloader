import { useEffect, useState } from "react";
import { FolderOpen, RotateCcw, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store";
import type {
  Settings,
  Format,
  AudioQuality,
  VideoQuality,
} from "@/types";

export function SettingsTab() {
  const { toast } = useToast();
  const settings = useAppStore((state) => state.settings);
  const setSettings = useAppStore((state) => state.setSettings);
  const isLoading = useAppStore((state) => state.isSettingsLoading);
  const setLoading = useAppStore((state) => state.setSettingsLoading);

  const [localSettings, setLocalSettings] = useState<Settings | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize local settings from store
  useEffect(() => {
    if (!settings) {
      // Load default settings for now
      const defaults: Settings = {
        version: 1,
        defaultSavePath: "~/Music",
        defaultFormat: "mp3",
        defaultAudioQuality: "192",
        defaultVideoQuality: "720p",
        maxConcurrentDownloads: 2,
      };
      setSettings(defaults);
      setLocalSettings(defaults);
    } else {
      setLocalSettings(settings);
    }
  }, [settings, setSettings]);

  const updateLocalSetting = <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    if (!localSettings) return;
    setLocalSettings({ ...localSettings, [key]: value });
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!localSettings) return;
    setIsSaving(true);
    try {
      // Will be connected to API
      setSettings(localSettings);
      setIsDirty(false);
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      const defaults: Settings = {
        version: 1,
        defaultSavePath: "~/Music",
        defaultFormat: "mp3",
        defaultAudioQuality: "192",
        defaultVideoQuality: "720p",
        maxConcurrentDownloads: 2,
      };
      setLocalSettings(defaults);
      setSettings(defaults);
      setIsDirty(false);
      toast({
        title: "Settings reset",
        description: "All settings have been restored to defaults",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBrowseSavePath = async () => {
    // Will be connected to API (SelectDirectory)
    console.log("Browse for save path");
  };

  if (isLoading || !localSettings) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure your download preferences
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isSaving}
            className="gap-1.5"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="gap-1.5"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Download Location</CardTitle>
          <CardDescription>
            Choose where downloaded files will be saved
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={localSettings.defaultSavePath}
              onChange={(e) =>
                updateLocalSetting("defaultSavePath", e.target.value)
              }
              placeholder="/path/to/downloads"
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={handleBrowseSavePath}
              aria-label="Browse for folder"
            >
              <FolderOpen className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Default Format</CardTitle>
          <CardDescription>
            Output format used for new downloads
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="default-format">Format</Label>
              <Select
                value={localSettings.defaultFormat}
                onValueChange={(value) =>
                  updateLocalSetting("defaultFormat", value as Format)
                }
              >
                <SelectTrigger id="default-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mp3">MP3 (Audio)</SelectItem>
                  <SelectItem value="m4a">M4A (Audio)</SelectItem>
                  <SelectItem value="mp4">MP4 (Video)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="audio-quality">Audio Quality</Label>
              <Select
                value={localSettings.defaultAudioQuality}
                onValueChange={(value) =>
                  updateLocalSetting("defaultAudioQuality", value as AudioQuality)
                }
              >
                <SelectTrigger id="audio-quality">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="128">128 kbps</SelectItem>
                  <SelectItem value="192">192 kbps</SelectItem>
                  <SelectItem value="256">256 kbps</SelectItem>
                  <SelectItem value="320">320 kbps</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="video-quality">Video Quality</Label>
              <Select
                value={localSettings.defaultVideoQuality}
                onValueChange={(value) =>
                  updateLocalSetting("defaultVideoQuality", value as VideoQuality)
                }
              >
                <SelectTrigger id="video-quality">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="360p">360p</SelectItem>
                  <SelectItem value="480p">480p</SelectItem>
                  <SelectItem value="720p">720p (HD)</SelectItem>
                  <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                  <SelectItem value="best">Best Available</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance</CardTitle>
          <CardDescription>
            Control download behavior and limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="concurrent-downloads">
              Max Concurrent Downloads
            </Label>
            <Select
              value={String(localSettings.maxConcurrentDownloads)}
              onValueChange={(value) =>
                updateLocalSetting("maxConcurrentDownloads", parseInt(value, 10))
              }
            >
              <SelectTrigger id="concurrent-downloads" className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5">5</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Higher values may improve speed but use more resources
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">FFmpeg</CardTitle>
          <CardDescription>
            FFmpeg is required for audio/video conversion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={localSettings.ffmpegPath || ""}
              onChange={(e) =>
                updateLocalSetting("ffmpegPath", e.target.value || undefined)
              }
              placeholder="Auto-detect (leave empty)"
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => console.log("Browse for FFmpeg")}
              aria-label="Browse for FFmpeg"
            >
              <FolderOpen className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Leave empty to use bundled FFmpeg or auto-detect from system PATH
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

