import { useTranslation } from "react-i18next";
import { Download } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatVersion } from "../utils";

interface AppInfoCardProps {
  version: string;
  hasUpdate: boolean;
  latestVersion?: string;
}

export function AppInfoCard({
  version,
  hasUpdate,
  latestVersion,
}: AppInfoCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <Download className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-3xl font-bold">{t("app.title")}</CardTitle>
        <CardDescription className="text-lg">
          {t("app.subtitle")}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline" className="px-3 py-1 text-base">
            v{formatVersion(version) || "..."}
          </Badge>
          {hasUpdate && latestVersion && (
            <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-600">
              {t("about.update.newVersion", {
                version: formatVersion(latestVersion),
              })}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
