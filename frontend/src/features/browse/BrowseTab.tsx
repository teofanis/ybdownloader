import { useTranslation } from "react-i18next";
import { Globe, Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Browse tab placeholder.
 * Will contain YouTube browsing and search functionality in a future release.
 */
export function BrowseTab() {
  const { t } = useTranslation();

  return (
    <div className="flex h-full items-center justify-center">
      <Card className="max-w-md">
        <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Construction className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{t("browse.comingSoon")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t("browse.description")}</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-2 text-sm">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{t("browse.title")}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
