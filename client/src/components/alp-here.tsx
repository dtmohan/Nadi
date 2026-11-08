import { useLocale } from "@/lib/i18n";
import { alpEvidenceClauseMalayalam } from "@shared/malayalam-alp-evidence";

/** Never omit an unrecognized condition when switching the evidence line's language. */
export function AlpHere({ clauses }: { clauses: string[] }) {
  const { locale } = useLocale();
  const translated = clauses.map(alpEvidenceClauseMalayalam);
  const useMalayalam = locale === "ml" && translated.every(Boolean);
  return <span lang={useMalayalam ? "ml" : "en"}>{useMalayalam ? `ഇവിടെ: ${translated.join("; ")}.` : `Here: ${clauses.join("; ")}.`}</span>;
}
