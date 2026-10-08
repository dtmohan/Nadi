import type { ReactNode } from "react";
import { sutraHref } from "@/lib/sutras";

/** Keeps a verse range such as 2.67-69 whole when a chip wraps: a word joiner follows the dash. */
const keepRanges = (c: ReactNode): ReactNode =>
  typeof c === "string" ? c.replace(/(\d)([-\u2013])(?=\d)/g, "$1$2\u2060") : c;

/**
 * Citation chip. Renders a link when `href` is given, otherwise a plain reference. The chip is set in
 * the monospace face at a smaller size with a hairline border so a source never reads as prose.
 */
export function Cite({
  href,
  children,
  className = "",
  title,
  testid,
  external = true,
}: {
  href?: string;
  children: ReactNode;
  className?: string;
  title?: string;
  testid?: string;
  external?: boolean;
}) {
  const cls = `cite ${className}`;
  if (!href) {
    return (
      <span className={cls} title={title} data-testid={testid}>
        <span className="cite-mark" aria-hidden>
          §
        </span>
        {keepRanges(children)}
      </span>
    );
  }
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className={cls}
      title={title}
      data-testid={testid}
    >
      <span className="cite-mark" aria-hidden>
        §
      </span>
      {keepRanges(children)}
    </a>
  );
}

/** External citation plus, for Jaimini Sutras references, a link to the in-app sutra text. */
/** `mark` (default true) appends a provisional marker when the source is flagged; callers that show their own badge pass false. */
export function SourceLink({
  source,
  className = "",
  mark = true,
}: {
  source: { label: string; url: string; sutra?: string; provisional?: boolean };
  className?: string;
  mark?: boolean;
}) {
  return (
    <>
      <Cite href={source.url} className={className}>
        {source.label}
      </Cite>
      {mark && source.provisional && (
        <span
          className="ml-1 rounded border px-1 text-2xs uppercase tracking-wide text-muted-foreground"
          data-testid="provisional-mark"
        >
          provisional
        </span>
      )}
      {source.sutra && (
        <>
          {" "}
          <Cite
            href={sutraHref(source.sutra)}
            external={false}
            className={className}
            testid={`sutra-link-${source.sutra}`}
            title="Open the sutra text (tr. B. Suryanarain Rao)"
          >
            text
          </Cite>
        </>
      )}
    </>
  );
}
