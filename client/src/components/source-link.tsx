import { sutraHref } from "@/lib/sutras";

/** External citation plus, for Jaimini Sutras references, a link to the in-app sutra text. */
/** `mark` (default true) appends a provisional marker when the source is flagged; callers that show their own badge pass false. */
export function SourceLink({ source, className = "", mark = true }: { source: { label: string; url: string; sutra?: string; provisional?: boolean }; className?: string; mark?: boolean }) {
  const cls = `underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground ${className}`;
  return (
    <>
      <a href={source.url} target="_blank" rel="noreferrer" className={cls}>
        {source.label}
      </a>
      {mark && source.provisional && <span className="ml-1 rounded border px-1 text-2xs uppercase tracking-wide text-muted-foreground" data-testid="provisional-mark">provisional</span>}
      {source.sutra && (
        <>
          {" · "}
          <a href={sutraHref(source.sutra)} className={cls} data-testid={`sutra-link-${source.sutra}`} title="Open the sutra text (tr. B. Suryanarain Rao)">
            text
          </a>
        </>
      )}
    </>
  );
}
