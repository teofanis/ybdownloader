import { useTranslation } from "react-i18next";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Format } from "@/types";

interface SearchHeaderProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  selectedFormat: Format;
  onFormatChange: (format: Format) => void;
  onSearch: () => void;
  isSearching: boolean;
}

export function SearchHeader({
  searchQuery,
  onSearchQueryChange,
  selectedFormat,
  onFormatChange,
  onSearch,
  isSearching,
}: SearchHeaderProps) {
  const { t } = useTranslation();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          {t("browse.title")}
        </CardTitle>
        <CardDescription>{t("browse.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("browse.searchPlaceholder")}
              className="pl-10"
              disabled={isSearching}
            />
          </div>
          <Select
            value={selectedFormat}
            onValueChange={(v) => onFormatChange(v as Format)}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mp3">MP3</SelectItem>
              <SelectItem value="m4a">M4A</SelectItem>
              <SelectItem value="mp4">MP4</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={onSearch}
            disabled={isSearching || !searchQuery.trim()}
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span className="ml-2">{t("browse.openYoutube")}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
