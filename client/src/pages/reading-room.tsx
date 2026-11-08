import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  Copy,
  X,
} from "lucide-react";
import { chartsStore } from "@/lib/charts-store";
import { apiRequest } from "@/lib/queryClient";
import { SouthIndianChart } from "@/components/south-indian-chart";
import type { ChartResult } from "@shared/schema";
import {
  buildReadingInput,
  composeReading,
  type ComparisonRow,
  type EvidenceMark,
  type EvidenceRef,
  type ProseParagraph,
  type ProseSection,
  type ReadingDoc,
  type ReadingLayer,
  type SchoolCard,
  type SummaryLine,
  type TimingFact,
  type AreaIndexEntry,
} from "@shared/reading-prose";
import "@/reading-room.css";

const LAYERS: { id: ReadingLayer; label: string; help: string }[] = [
  { id: "reading", label: "Reading", help: "The argument, with the sources kept at the edge." },
  { id: "working", label: "Working", help: "The argument plus the rules that carry each paragraph." },
  { id: "critical", label: "Critical", help: "The argument, the working, the grades and the apparatus." },
];

const MARK_LABEL: Record<EvidenceMark, string> = {
  source: "Source",
  provisional: "Provisional",
  calculation: "Calculated",
  statistical: "Statistical",
  convention: "App convention",
  silent: "Silent",
};

const MARK_NOTE: Record<EvidenceMark, string> = {
  source: "A rule with a named source. The text is in the evidence drawer.",
  provisional: "The rule, or the app’s extension of it, is marked provisional.",
  calculation: "The app’s grading changed the weight; the grade reasons are in the drawer.",
  statistical: "A statistical comparison; sampling and protocol matter.",
  convention: "An app convention, not a rule from the tradition.",
  silent: "No rule fires, or the school does not read the topic.",
};

const VERDICT_CLASS: Record<string, string> = {
  agree: "is-agree",
  promised: "is-agree",
  supported: "is-agree",
  indicated: "is-agree",
  "read long": "is-agree",
  lean: "is-lean",
  "partly supported": "is-lean",
  mixed: "is-lean",
  contested: "is-dispute",
  strained: "is-dispute",
  disagree: "is-dispute",
  denied: "is-dispute",
  "no verdict": "is-quiet",
  "not read": "is-quiet",
};

function formatDate(iso: string): string {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${months[m - 1]} ${y}`;
}

function wordsIn(doc: ReadingDoc): number {
  return doc.sections.flatMap((s) => s.paragraphs.map((p) => p.text)).join(" ").split(/\s+/).filter(Boolean).length;
}

function shortSource(source: string | undefined): string {
  if (!source) return "App";
  if (/Naik/i.test(source)) return "Naik";
  if (/Rao/i.test(source)) return "Rao";
  if (/BPHS|Brihat Parashara/i.test(source)) return "BPHS";
  if (/Phaladeepika/i.test(source)) return "Phaladeepika";
  if (/Jaimini/i.test(source)) return "Jaimini";
  return source;
}

function uniqueMarks(evidence: EvidenceRef[]): EvidenceMark[] {
  return Array.from(new Set(evidence.map((e) => e.mark)));
}

function Mark({ mark }: { mark: EvidenceMark }) {
  return (
    <span className={`room-mark mark-${mark}`} title={MARK_NOTE[mark]}>
      <span className="room-mark-dot" aria-hidden="true" />
      {MARK_LABEL[mark]}
    </span>
  );
}

function WhyThis({ evidence, onOpen }: { evidence: EvidenceRef[]; onOpen: () => void }) {
  if (!evidence.length) return null;
  const sources = Array.from(new Set(evidence.map((e) => shortSource(e.finding.source))));
  return (
    <div className="room-evidence">
      <button type="button" className="room-why" onClick={onOpen} aria-haspopup="dialog">
        <span>Why this</span>
        <span className="room-why-count">{evidence.length} {evidence.length === 1 ? "rule" : "rules"}</span>
        <ChevronDown className="room-why-chevron" aria-hidden="true" />
      </button>
      <span className="room-evidence-sources">{sources.join(" · ")}</span>
      <span className="room-evidence-marks">{uniqueMarks(evidence).map((m) => <Mark key={m} mark={m} />)}</span>
    </div>
  );
}

function Working({ evidence, critical, frame }: { evidence: EvidenceRef[]; critical: boolean; frame?: string }) {
  if (!evidence.length && !frame) return null;
  return (
    <div className="room-working">
      <div className="room-working-head">
        <span>Working</span>
        <span className="room-working-note">the rule text behind the paragraph</span>
      </div>
      {frame ? <div className="room-frame"><span>Parashari frame</span><p>{frame.charAt(0).toUpperCase() + frame.slice(1)}</p></div> : null}
      {evidence.map((e) => (
        <div className="room-rule" key={e.id}>
          <div className="room-rule-top">
            <code>{e.finding.ruleId}</code>
            <span>{e.finding.grade?.level ?? "ungraded"}</span>
            <span>{e.finding.score.toFixed(2)}</span>
            <Mark mark={e.mark} />
          </div>
          <p>{e.finding.text}</p>
          <div className="room-rule-source">{e.finding.source ?? "No source in the rule set"}</div>
          {critical && e.finding.grade?.reasons?.length ? (
            <ul className="room-grade">
              {e.finding.grade.reasons.map((r, i) => (
                <li key={i}>
                  {r.text}
                  {r.effect !== "note" && r.factor != null ? ` ×${r.factor}` : ""}
                  {r.source ? ` · ${r.source}` : ""}
                </li>
              ))}
            </ul>
          ) : null}
          {critical && e.finding.band ? (
            <p className="room-band">
              The birth-time band of ±{e.finding.band.minutes} minutes changes this line.
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function Paragraph({
  p,
  layer,
  lead,
  onOpen,
}: {
  p: ProseParagraph;
  layer: ReadingLayer;
  lead?: boolean;
  onOpen: (evidence: EvidenceRef[]) => void;
}) {
  return (
    <div className={`room-p${lead ? " room-p-lead" : ""}`} id={p.id}>
      {p.subhead ? <h3 className="room-subhead">{p.subhead}</h3> : null}
      <p>{p.text}</p>
      <WhyThis evidence={p.evidence} onOpen={() => onOpen(p.evidence)} />
      {layer !== "reading" ? <Working evidence={p.evidence} critical={layer === "critical"} frame={p.frame} /> : null}
    </div>
  );
}

function ChapterWorking({ items }: { items?: Array<{ label: string; text: string }> }) {
  if (!items?.length) return null;
  return (
    <div className="room-chapter-working">
      <div className="room-working-head">
        <span>The chapter’s other schools</span>
        <span className="room-working-note">one line each; the full reading stays in its own tab</span>
      </div>
      {items.map((item) => (
        <div className="room-chapter-line" key={item.label}>
          <b>{item.label}</b>
          <p>{item.text}</p>
        </div>
      ))}
    </div>
  );
}

function SummaryPanel({ summary }: { summary: SummaryLine[] }) {
  return (
    <details className="room-summary">
      <summary>
        <span>In two minutes</span>
        <span>{summary.length} lines · the whole chart</span>
      </summary>
      <ol>
        {summary.map((line) => (
          <li key={line.label}>
            <b>{line.label}</b>
            <span>{line.text}</span>
          </li>
        ))}
      </ol>
    </details>
  );
}

const CHAPTER_LABEL: Record<string, string> = {
  native: "The native",
  work: "Work & means",
  bonds: "Bonds",
  mind: "Mind & meaning",
};

function LifeIndex({ entries, onJump }: { entries: AreaIndexEntry[]; onJump: (id: string) => void }) {
  return (
    <section className="room-index" aria-labelledby="room-index-title">
      <div className="room-index-head">
        <h2 id="room-index-title">The life areas</h2>
        <p>Eleven areas, four chapters. Choose one to go straight to its paragraph.</p>
      </div>
      <div className="room-index-grid">
        {entries.map((entry) => (
          <button
            key={entry.topic}
            type="button"
            className="room-index-item"
            onClick={() => onJump(entry.id)}
            title={`${entry.label} — ${entry.tone}`}
          >
            <span className={`room-tone tone-${entry.tone}`} aria-hidden="true" />
            <b>{entry.label}</b>
            <span>{CHAPTER_LABEL[entry.chapter] ?? entry.chapter}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function SectionHead({ section }: { section: ProseSection }) {
  return (
    <header className="room-section-head">
      <span className="room-section-kicker">{section.kicker}</span>
      <h2>{section.title}</h2>
    </header>
  );
}

function Comparison({ rows }: { rows: ComparisonRow[] }) {
  return (
    <div className="room-compare-wrap">
      <div className="room-compare">
        <div className="room-compare-head" aria-hidden="true">
          <span>Topic</span>
          <span>Nadi</span>
          <span>Parashari</span>
          <span>Jaimini</span>
          <span>KP</span>
        </div>
        {rows.map((row) => (
          <div className="room-compare-row" key={row.topic}>
            <div className="room-compare-topic">
              <b>{row.label}</b>
              <span className={`room-verdict ${VERDICT_CLASS[row.verdict] ?? ""}`}>{row.verdict}</span>
            </div>
            {row.cells.map((cell) => (
              <div className="room-compare-cell" key={cell.system} title={cell.note}>
                <span className="room-cell-system">{cell.systemLabel}</span>
                <span className={`room-cell-word ${VERDICT_CLASS[cell.word] ?? "is-quiet"}`}>{cell.word}</span>
                <span className="room-cell-judged">{cell.judged}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <p className="room-compare-note">
        Each cell is that school’s own verdict, and the small line is what it judged. The app does not count votes;
        a missing verdict is not a “no”. Life span is a separate, gated topic and is not in this table.
      </p>
    </div>
  );
}

function Timing({ facts }: { facts: TimingFact[] }) {
  const periods = facts.filter((f) => f.system === "Parashari").slice(0, 3);
  const sky = facts.filter((f) => f.system === "Ashtakavarga transit").slice(0, 2);
  const rest = facts.filter((f) => !periods.includes(f) && !sky.includes(f));
  return (
    <div className="room-timing">
      <div className="room-timing-group">
        <span className="room-timing-label">The period</span>
        {periods.map((f) => (
          <div className="room-timing-row" key={f.label}>
            <span>{f.label.replace(/^Parashari · /, "")}</span>
            <span>{f.when}</span>
          </div>
        ))}
      </div>
      <div className="room-timing-group">
        <span className="room-timing-label">The sky</span>
        {sky.map((f) => (
          <div className="room-timing-row" key={f.label}>
            <span>{f.label.replace(/^Ashtakavarga transit · /, "")}</span>
            <span>{f.when}</span>
          </div>
        ))}
      </div>
      {rest.length ? (
        <details className="room-timing-all">
          <summary>The other clocks ({rest.length})</summary>
          {rest.map((f) => (
            <div className="room-timing-row" key={f.label}>
              <span>{f.label}</span>
              <span>{f.when}</span>
            </div>
          ))}
        </details>
      ) : null}
    </div>
  );
}

function Provenance({ doc }: { doc: ReadingDoc }) {
  const p = doc.provenance;
  const rows = [
    ["Birth", p.birthLine],
    ["Place", p.placeLine],
    ["Ayanamsa", p.ayanamsaLine],
    ["Node", p.nodeLine],
    ["Houses", p.houseLine],
    ["Sunrise", p.sunriseLine],
    ["Ephemeris", p.ephemerisLine],
    ["Reading", p.readingLine],
  ];
  return (
    <dl className="room-provenance">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function SchoolNotes({ schools, critical }: { schools: SchoolCard[]; critical: boolean }) {
  return (
    <div className="room-schools">
      {schools.map((s) => (
        <details className="room-school" key={s.id} open={critical ? true : undefined}>
          <summary>
            <b>{s.name}</b>
            <span>{s.status}</span>
          </summary>
          <p>{s.reads}</p>
          <p className="room-school-meta">{s.era} · {s.texts}</p>
          <p className="room-school-note">{s.note}</p>
        </details>
      ))}
    </div>
  );
}

function Apparatus({
  doc,
  layer,
  copied,
  onCopy,
}: {
  doc: ReadingDoc;
  layer: ReadingLayer;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="room-apparatus">
      <div className="room-apparatus-block">
        <h3>The sources this reading leans on</h3>
        <ul className="room-source-list">
          {doc.sources.map((s) => (
            <li key={s.source}>
              <span>{s.source}</span>
              <b>{s.count}</b>
            </li>
          ))}
        </ul>
        <p className="room-small">
          Counts include the rule’s primary source and, where the app graded it, the grade notes. The rule text and
          each grade reason are in the working and the drawer.
        </p>
      </div>

      <div className="room-apparatus-block">
        <h3>What the reading does not say</h3>
        <ul className="room-caveats">
          {doc.caveats.map((c) => <li key={c}>{c}</li>)}
        </ul>
      </div>

      <div className="room-apparatus-block">
        <h3>The chart’s basis</h3>
        <Provenance doc={doc} />
        <p className="room-small">
          The fingerprint is a local checksum of the birth data and the ayanamsa, not a cryptographic manifest.
          It is here so the same reading can be recognised again.
        </p>
      </div>

      <div className="room-apparatus-block">
        <h3>The schools, and what they are judging</h3>
        <SchoolNotes schools={doc.schools} critical={layer === "critical"} />
      </div>

      <div className="room-apparatus-block room-cite">
        <div>
          <h3>Cite this reading</h3>
          <p className="room-small">
            {doc.meta.name} · {formatDate(doc.meta.asOf)} · {doc.provenance.fingerprint}
          </p>
        </div>
        <button type="button" className="room-copy" onClick={onCopy}>
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? "Copied" : "Copy citation"}
        </button>
      </div>

      <div className="room-legend">
        <h3>Marks</h3>
        {(Object.keys(MARK_LABEL) as EvidenceMark[]).map((m) => (
          <div className="room-legend-row" key={m}>
            <Mark mark={m} />
            <span>{MARK_NOTE[m]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartCard({ result, onOpen }: { result: ChartResult; onOpen: () => void }) {
  return (
    <div className="room-chart-card">
      <div className="room-aside-head">
        <span>Birth chart</span>
        <span>D1 · South Indian</span>
      </div>
      <div className="room-chart-figure">
        <SouthIndianChart
          positions={result.positions}
          lagnaSign={result.jaimini.lagna.signIndex}
          title="D1"
          footer="Birth positions"
          showHouseNumbers={false}
          compactPlanets
          accent={[]}
          ariaLabel="Birth chart, South Indian layout"
        />
      </div>
      <button type="button" className="room-open-chart" onClick={onOpen}>
        Open full chart <ArrowUpRight size={14} />
      </button>
    </div>
  );
}

function ChartDialog({ result, onClose }: { result: ChartResult; onClose: () => void }) {
  const ref = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div className="room-modal" role="dialog" aria-modal="true" aria-label="Birth chart" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="room-modal-card">
        <div className="room-modal-head">
          <div>
            <b>Birth chart</b>
            <span>South Indian D1 · Lahiri</span>
          </div>
          <button type="button" ref={ref} className="room-icon-btn" onClick={onClose} aria-label="Close chart">
            <X size={18} />
          </button>
        </div>
        <div className="room-modal-chart">
          <SouthIndianChart
            positions={result.positions}
            lagnaSign={result.jaimini.lagna.signIndex}
            title="D1"
            footer="Birth positions"
            showHouseNumbers={false}
            accent={[]}
            ariaLabel="Birth chart, South Indian layout"
          />
        </div>
        <p className="room-small">The birth chart at the entered time. It is not a divisional, event or question chart.</p>
      </div>
    </div>
  );
}

function Drawer({ evidence, onClose }: { evidence: EvidenceRef[]; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div className="room-drawer-wrap" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <aside className="room-drawer" role="dialog" aria-modal="true" aria-label="Evidence for this paragraph">
        <header className="room-drawer-head">
          <div>
            <span className="room-drawer-kicker">The apparatus</span>
            <h2>Evidence for this paragraph</h2>
          </div>
          <button type="button" ref={closeRef} className="room-icon-btn" onClick={onClose} aria-label="Close evidence">
            <X size={18} />
          </button>
        </header>
        <p className="room-drawer-intro">
          The reading paraphrases these rules; the text below is unchanged. The mark says what kind of claim it is.
        </p>
        {evidence.map((e) => (
          <article className="room-evidence-card" key={e.id}>
            <div className="room-evidence-card-head">
              <code>{e.finding.ruleId}</code>
              <Mark mark={e.mark} />
            </div>
            <p className="room-evidence-text">{e.finding.text}</p>
            <p className="room-evidence-source">{e.finding.source ?? "No source in the rule set"}</p>
            <div className="room-evidence-meta">
              <span>Grade {e.finding.grade?.level ?? "ungraded"}</span>
              <span>Score {e.finding.score.toFixed(2)}</span>
              <span>{e.finding.planets.join(" · ")}</span>
            </div>
            {e.finding.grade?.reasons?.length ? (
              <ul className="room-grade">
                {e.finding.grade.reasons.map((r, i) => (
                  <li key={i}>
                    {r.text}
                    {r.effect !== "note" && r.factor != null ? ` ×${r.factor}` : ""}
                    {r.source ? ` · ${r.source}` : ""}
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </aside>
    </div>
  );
}

function Loading() {
  return (
    <div className="room room-loading" aria-busy="true" aria-live="polite">
      <div className="room-loading-bar" />
      <div className="room-loading-title" />
      <div className="room-loading-deck" />
      <div className="room-loading-lines">
        {Array.from({ length: 8 }).map((_, i) => <span key={i} />)}
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="room room-error">
      <p className="room-kicker">Reading room</p>
      <h1>The chart could not be opened.</h1>
      <p>{message}</p>
      <Link href="/" className="room-cta"><ArrowLeft size={16} /> Back to the charts</Link>
    </div>
  );
}

export default function ReadingRoom() {
  const { id, view } = useParams<{ id: string; view?: string }>();
  const [, navigate] = useLocation();
  const layer: ReadingLayer = view === "working" || view === "critical" ? view : "reading";
  const [doc, setDoc] = useState<ReadingDoc | null>(null);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<EvidenceRef[] | null>(null);
  const [chartOpen, setChartOpen] = useState(false);
  const [active, setActive] = useState("chart");
  const [copied, setCopied] = useState(false);

  const { data, isLoading, error } = useQuery<ChartResult>({
    queryKey: ["reading-room", id],
    enabled: !!id,
    staleTime: Infinity,
    queryFn: async () => {
      const chart = await chartsStore.get(Number(id));
      if (!chart) throw new Error("Chart not found in this browser. It may have been cast in another browser.");
      const res = await apiRequest("POST", "/api/compute", chart);
      return (await res.json()) as ChartResult;
    },
  });

  useEffect(() => {
    if (!data) return;
    try {
      setDoc(composeReading(buildReadingInput(data)));
      setBuildError(null);
    } catch (e) {
      setBuildError(e instanceof Error ? e.message : "The prose layer could not compose this chart.");
    }
  }, [data]);

  useEffect(() => {
    if (doc) document.title = `${doc.meta.name} · Reading room · Nadi`;
    return () => { document.title = "Nadi"; };
  }, [doc]);

  useEffect(() => {
    if (!doc) return;
    const ids = doc.sections.map((s) => s.id);
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: "-12% 0px -70% 0px", threshold: 0 },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, [doc]);

  const go = (next: ReadingLayer) => {
    navigate(`/chart/${id}/room${next === "reading" ? "" : `/${next}`}`);
  };

  const jump = (section: string) => {
    document.getElementById(section)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const copyCitation = async () => {
    if (!doc) return;
    const citation = `${doc.meta.name}. Reading room, ${formatDate(doc.meta.asOf)}. Nadi, ${doc.provenance.fingerprint}.`;
    try {
      await navigator.clipboard.writeText(citation);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  if (isLoading) return <Loading />;
  if (error) return <ErrorState message={error instanceof Error ? error.message : "The chart could not be loaded."} />;
  if (buildError) return <ErrorState message={buildError} />;
  if (!doc || !data) return <Loading />;

  const wordCount = wordsIn(doc);
  const minutes = Math.max(1, Math.ceil(wordCount / 210));

  return (
    <div className="room">
      <a href="#room-main" className="room-skip">Skip to the reading</a>
      <header className="room-head">
        <div className="room-topbar">
          <Link href="/" className="room-brand">
            <BookOpen size={18} aria-hidden="true" />
            <span>Nadi</span>
            <em>Reading room</em>
          </Link>
          <div className="room-top-actions">
            <Link href={`/chart/${id}/reading`} className="room-top-link">
              Guided reading
            </Link>
            <Link href={`/chart/${id}`} className="room-top-link">
              Workbench <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
            <button type="button" className="room-chart-button" onClick={() => setChartOpen(true)}>
              Chart
            </button>
          </div>
        </div>

        <div className="room-title">
          <p className="room-kicker">A reading room · {doc.provenance.ayanamsaLine.split(" · ")[0]}</p>
          <h1>{doc.meta.name}</h1>
          <p className="room-standfirst">{doc.standfirst}</p>
          <div className="room-meta">
            <span>Born {formatDate(doc.meta.birthDate)} · {doc.meta.birthTime} · {doc.meta.place}</span>
            <span>Read {doc.meta.past ? "at passing" : "on"} {formatDate(doc.meta.asOf)} · age {doc.meta.age}</span>
            <span>{doc.meta.lagna} rising {doc.meta.lagnaDegree}</span>
          </div>
          <div className="room-controls">
            <div className="room-layers" role="radiogroup" aria-label="Reading layer">
              {LAYERS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  role="radio"
                  aria-checked={layer === l.id}
                  className={`room-layer${layer === l.id ? " is-active" : ""}`}
                  onClick={() => go(l.id)}
                  title={l.help}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <span className="room-time">{wordCount.toLocaleString()} words · {minutes} min</span>
            <label className="room-jump-wrap">
              <span className="sr-only">Jump to a section</span>
              <select className="room-jump" value={active} onChange={(e) => jump(e.target.value)}>
                {doc.sections.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </label>
          </div>
        </div>
      </header>

      <div className="room-grid">
        <nav className="room-toc" aria-label="Contents">
          <p className="room-toc-title">Contents</p>
          {doc.sections.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`room-toc-item${active === s.id ? " is-active" : ""}`}
              onClick={() => jump(s.id)}
            >
              <span>{s.kicker.split(" · ")[0] || "—"}</span>
              {s.title}
            </button>
          ))}
          <div className="room-toc-foot">
            <p>{layer === "reading" ? "The argument" : layer === "working" ? "Argument + working" : "Argument + working + apparatus"}</p>
            <p>An English reading generated from the app’s computed rules. It paraphrases; it does not add a rule.</p>
          </div>
        </nav>

        <main className="room-main" id="room-main">
          {doc.sections.map((section) => (
            <section className="room-section" id={section.id} key={section.id}>
              <SectionHead section={section} />
              {section.paragraphs.map((p, i) => (
                <Paragraph
                  key={p.id}
                  p={p}
                  layer={layer}
                  lead={section.id === "chart" && i === 0}
                  onOpen={setDrawer}
                />
              ))}
              {section.id === "chart" ? (
                <>
                  <SummaryPanel summary={doc.summary} />
                  <LifeIndex entries={doc.index} onJump={jump} />
                </>
              ) : null}
              {section.id !== "chart" && layer !== "reading" ? (
                <ChapterWorking items={section.working} />
              ) : null}
              {section.note ? <p className="room-note">{section.note}</p> : null}
              {section.id === "schools" ? <Comparison rows={doc.comparison} /> : null}
              {section.id === "time" ? <Timing facts={doc.timing} /> : null}
              {section.id === "sources" ? (
                <Apparatus doc={doc} layer={layer} copied={copied} onCopy={copyCitation} />
              ) : null}
            </section>
          ))}
          <footer className="room-footer">
            <p><b>Nadi</b> · Reading room · {doc.provenance.fingerprint}</p>
            <p>The rules are the reading. The prose is a paraphrase, and the source text is one click away.</p>
            <Link href={`/chart/${id}`}>Open the classic workbench <ArrowUpRight size={13} /></Link>
          </footer>
        </main>

        <aside className="room-aside" aria-label="Chart and facts">
          <ChartCard result={data} onOpen={() => setChartOpen(true)} />
          <div className="room-facts">
            <div><span>Rising</span><b>{doc.meta.lagna} {doc.meta.lagnaDegree}</b></div>
            <div><span>Moon</span><b>{doc.meta.moon}</b></div>
            <div><span>Sun</span><b>{doc.meta.sun}</b></div>
            <div><span>Read</span><b>{formatDate(doc.meta.asOf)} · age {doc.meta.age}</b></div>
          </div>
          <div className="room-aside-note">
            <p>The chart is the D1 at the entered birth time. The reading’s basis is in <button type="button" onClick={() => jump("sources")}>the apparatus</button>.</p>
          </div>
        </aside>
      </div>

      {chartOpen ? <ChartDialog result={data} onClose={() => setChartOpen(false)} /> : null}
      {drawer ? <Drawer evidence={drawer} onClose={() => setDrawer(null)} /> : null}
    </div>
  );
}
