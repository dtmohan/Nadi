import { sutraHref } from "@/lib/sutras";

/** External citation plus, for Jaimini Sutras references, a link to the in-app sutra text. */
export function SourceLink({ source, className = "" }: { source: { label: string; url: string; sutra?: string }; className?: string }) {
  const cls = `underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground ${className}`;
  return (
    <>
      <a href={source.url} target="_blank" rel="noreferrer" className={cls}>
        {source.label}
      </a>
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
