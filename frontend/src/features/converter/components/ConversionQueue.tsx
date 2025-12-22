import { useTranslation } from "react-i18next";
import { Wand2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ConversionJobItem } from "./ConversionJobItem";
import type { ConversionJob, ConversionPreset } from "../types";

interface ConversionQueueProps {
  jobs: ConversionJob[];
  presets: ConversionPreset[];
  onCancelJob: (jobId: string) => void;
  onRemoveJob: (jobId: string) => void;
  onClearCompleted: () => void;
}

export function ConversionQueue({
  jobs,
  presets,
  onCancelJob,
  onRemoveJob,
  onClearCompleted,
}: ConversionQueueProps) {
  const { t } = useTranslation();
  const hasCompletedJobs = jobs.some((j) => j.state === "completed");

  return (
    <Card className="flex-1 overflow-hidden">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base">{t("converter.queue")}</CardTitle>
          <CardDescription className="text-xs">
            {jobs.length === 0
              ? t("converter.noJobs")
              : t("converter.jobCount", { count: jobs.length })}
          </CardDescription>
        </div>
        {hasCompletedJobs && (
          <Button variant="ghost" size="sm" onClick={onClearCompleted}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t("converter.clearCompleted")}
          </Button>
        )}
      </CardHeader>
      <Separator />
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          {jobs.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
              <Wand2 className="mb-4 h-12 w-12 opacity-20" />
              <p className="text-sm">{t("converter.emptyQueue")}</p>
              <p className="text-xs">{t("converter.emptyQueueHint")}</p>
            </div>
          ) : (
            <div className="divide-y">
              {jobs.map((job) => (
                <ConversionJobItem
                  key={job.id}
                  job={job}
                  preset={presets.find((p) => p.id === job.presetId)}
                  onCancel={() => onCancelJob(job.id)}
                  onRemove={() => onRemoveJob(job.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

