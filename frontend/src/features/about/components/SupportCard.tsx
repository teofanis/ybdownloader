import { useTranslation } from "react-i18next";
import { Heart, Coffee, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrowserOpenURL } from "../../../../wailsjs/runtime/runtime";

export function SupportCard() {
  const { t } = useTranslation();

  const supportLinks = [
    {
      icon: <Coffee className="mr-2 h-4 w-4 text-amber-500" />,
      label: t("about.support.coffee"),
      url: "https://buymeacoffee.com/teofanis",
      borderColor: "border-amber-500/30",
      hoverColor: "hover:bg-amber-500/10",
    },
    {
      icon: <Heart className="mr-2 h-4 w-4 text-blue-500" />,
      label: t("about.support.paypal"),
      url: "https://www.paypal.com/paypalme/teofanis",
      borderColor: "border-blue-500/30",
      hoverColor: "hover:bg-blue-500/10",
    },
    {
      icon: <Sparkles className="mr-2 h-4 w-4 text-pink-500" />,
      label: t("about.support.thanksDev"),
      url: "https://thanks.dev/u/gh/teofanis",
      borderColor: "border-pink-500/30",
      hoverColor: "hover:bg-pink-500/10",
    },
  ];

  return (
    <Card className="border-pink-500/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-pink-500" />
          <CardTitle className="text-lg">{t("about.support.title")}</CardTitle>
        </div>
        <CardDescription>{t("about.support.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {supportLinks.map((link) => (
            <Button
              key={link.url}
              variant="outline"
              className={`${link.borderColor} ${link.hoverColor}`}
              onClick={() => BrowserOpenURL(link.url)}
            >
              {link.icon}
              {link.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

