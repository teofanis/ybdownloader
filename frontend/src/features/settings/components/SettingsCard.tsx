import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface SettingsCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}

export function SettingsCard({
  title,
  description,
  icon,
  headerRight,
  children,
}: SettingsCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              {icon}
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {headerRight}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

export function Field({ label, hint, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
