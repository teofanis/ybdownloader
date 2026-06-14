import { renderMarkdown } from "@ybdownload/shared/markdown";

interface ReleaseNotesProps {
  body: string;
  className?: string;
}

/** Renders trusted GitHub release notes (same source as the website). */
export function ReleaseNotes({ body, className }: ReleaseNotesProps) {
  return (
    <div
      className={
        className ??
        "prose prose-sm prose-invert text-muted-foreground max-h-40 max-w-none overflow-auto text-sm"
      }
      dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }}
    />
  );
}
