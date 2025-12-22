import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Wand2,
  Music,
  Film,
  ImageIcon,
  FileAudio,
  Scissors,
  ChevronDown,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ConversionPreset } from "../types";
import {
  getCategoryLabel,
  getPresetName,
  getPresetDescription,
} from "../utils";

const categoryIcons: Record<string, React.ReactNode> = {
  audio: <Music className="h-4 w-4" />,
  video: <Film className="h-4 w-4" />,
  resize: <ImageIcon className="h-4 w-4" />,
  gif: <ImageIcon className="h-4 w-4" />,
  extract: <FileAudio className="h-4 w-4" />,
  trim: <Scissors className="h-4 w-4" />,
};

interface PresetBrowserProps {
  presets: ConversionPreset[];
  selectedPreset: ConversionPreset | null;
  onSelectPreset: (preset: ConversionPreset) => void;
}

export function PresetBrowser({
  presets,
  selectedPreset,
  onSelectPreset,
}: PresetBrowserProps) {
  const { t } = useTranslation();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    "audio"
  );

  // Group presets by category
  const presetsByCategory = presets.reduce(
    (acc, preset) => {
      if (!acc[preset.category]) acc[preset.category] = [];
      acc[preset.category].push(preset);
      return acc;
    },
    {} as Record<string, ConversionPreset[]>
  );

  return (
    <Card className="flex-1 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wand2 className="h-4 w-4" />
          {t("converter.presets")}
        </CardTitle>
        <CardDescription className="text-xs">
          {t("converter.presetsDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="space-y-1 p-3">
            {Object.entries(presetsByCategory).map(
              ([category, categoryPresets]) => (
                <div key={category}>
                  <button
                    onClick={() =>
                      setExpandedCategory((prev) =>
                        prev === category ? null : category
                      )
                    }
                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium hover:bg-muted/50"
                  >
                    <span className="flex items-center gap-2">
                      {categoryIcons[category]}
                      {getCategoryLabel(category, t)}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        expandedCategory === category ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {expandedCategory === category && (
                    <div className="ml-6 mt-1 space-y-1">
                      {categoryPresets.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => onSelectPreset(preset)}
                          className={`w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                            selectedPreset?.id === preset.id
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted/50"
                          }`}
                        >
                          <div className="font-medium">
                            {getPresetName(preset, t)}
                          </div>
                          <div
                            className={`text-xs ${
                              selectedPreset?.id === preset.id
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            }`}
                          >
                            {getPresetDescription(preset, t)}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
