import { Globe, Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function BrowseTab() {
  return (
    <div className="flex h-full items-center justify-center">
      <Card className="max-w-md">
        <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Construction className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Coming Soon</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Browse YouTube directly within the app and add videos to your
              download queue with a single click.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-2 text-sm">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              YouTube Browser Integration
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

