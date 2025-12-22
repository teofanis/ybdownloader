import { useTranslation } from "react-i18next";
import { Github, Star, AlertCircle, Download, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrowserOpenURL } from "../../../../wailsjs/runtime/runtime";

const GITHUB_REPO_URL = "https://github.com/teofanis/ybdownloader";
const GITHUB_RELEASES_URL = "https://github.com/teofanis/ybdownloader/releases";
const GITHUB_ISSUES_URL = "https://github.com/teofanis/ybdownloader/issues";

export function LinksCard() {
  const { t } = useTranslation();

  const links = [
    {
      icon: <Github className="mr-3 h-5 w-5" />,
      title: t("about.links.github"),
      desc: t("about.links.githubDesc"),
      url: GITHUB_REPO_URL,
    },
    {
      icon: <Star className="mr-3 h-5 w-5 text-amber-500" />,
      title: t("about.links.star"),
      desc: t("about.links.starDesc"),
      url: GITHUB_REPO_URL,
    },
    {
      icon: <AlertCircle className="mr-3 h-5 w-5" />,
      title: t("about.links.issues"),
      desc: t("about.links.issuesDesc"),
      url: GITHUB_ISSUES_URL,
    },
    {
      icon: <Download className="mr-3 h-5 w-5" />,
      title: t("about.links.releases"),
      desc: t("about.links.releasesDesc"),
      url: GITHUB_RELEASES_URL,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">{t("about.links.title")}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {links.map((link) => (
            <Button
              key={link.title}
              variant="outline"
              className="h-auto justify-start py-3"
              onClick={() => BrowserOpenURL(link.url)}
            >
              {link.icon}
              <div className="text-left">
                <p className="font-medium">{link.title}</p>
                <p className="text-xs text-muted-foreground">{link.desc}</p>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
