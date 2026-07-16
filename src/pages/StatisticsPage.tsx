import { useState } from "react";
import {
  Clock,
  MessagesSquare,
  Search,
  Star,
  TrendingDown,
  TrendingUp,
  User,
  type LucideIcon,
} from "lucide-react";
import { Button, Card, Input } from "@ki4jlu/design-system";

// ── Types ─────────────────────────────────────────────────────

type ChartView = "Tag" | "Woche" | "Monat";

// ── Mock data ─────────────────────────────────────────────────

const KPI_CARDS: {
  icon: LucideIcon;
  value: string;
  label: string;
  delta: string;
  sub: string;
  positive: boolean;
}[] = [
  {
    icon: MessagesSquare,
    value: "3 842",
    label: "Gespräche gesamt",
    delta: "+14 %",
    sub: "vs. 3 370 letzten Monat",
    positive: true,
  },
  {
    icon: User,
    value: "1 924",
    label: "Eindeutige Nutzer",
    delta: "+9 %",
    sub: "vs. 1 765 letzten Monat",
    positive: true,
  },
  {
    icon: Clock,
    value: "1,4 s",
    label: "Ø Antwortzeit",
    delta: "-0,3 s",
    sub: "vs. 1,7 s letzten Monat",
    positive: true,
  },
  {
    icon: Star,
    value: "4,6",
    label: "Ø Bewertung",
    delta: "+0,2",
    sub: "vs. 4,4 letzten Monat",
    positive: true,
  },
];

const CHART_DATA: Record<ChartView, { label: string; value: number }[]> = {
  Tag: [
    { label: "Mo", value: 42 },
    { label: "Di", value: 58 },
    { label: "Mi", value: 51 },
    { label: "Do", value: 67 },
    { label: "Fr", value: 73 },
    { label: "Sa", value: 29 },
    { label: "So", value: 18 },
  ],
  Woche: [
    { label: "KW 18", value: 120 },
    { label: "KW 19", value: 135 },
    { label: "KW 20", value: 105 },
    { label: "KW 21", value: 145 },
    { label: "KW 22", value: 160 },
    { label: "KW 23", value: 142 },
    { label: "KW 24", value: 154 },
  ],
  Monat: [
    { label: "Jan", value: 280 },
    { label: "Feb", value: 310 },
    { label: "Mär", value: 295 },
    { label: "Apr", value: 340 },
    { label: "Mai", value: 380 },
    { label: "Jun", value: 370 },
  ],
};

const TOP_QUESTIONS = [
  { text: "Was ist die JLU Gießen?", count: 312 },
  { text: "Wie bewerbe ich mich?", count: 287 },
  { text: "Wann beginnt das Semester?", count: 241 },
  { text: "Wo ist das Studierendensekretariat?", count: 198 },
  { text: "Kontakt zum Prüfungsamt?", count: 156 },
];

// Serienfarben über Chart-Tokens (theme-fähig): stroke-* für SVG, bg-* für Legende.
const DONUT_SEGMENTS = [
  { label: "Öffentlicher Chatbot", percent: 55, stroke: "stroke-chart-1", dot: "bg-chart-1" },
  { label: "Interner Bot", percent: 26, stroke: "stroke-chart-2", dot: "bg-chart-2" },
  { label: "TBOS-Widget", percent: 13, stroke: "stroke-chart-3", dot: "bg-chart-3" },
  { label: "Sonstige", percent: 6, stroke: "stroke-chart-4", dot: "bg-chart-4" },
];

const PERIOD_CARDS = [
  {
    label: "HEUTE",
    trend: "+15 % vs. gestern",
    gespräche: "142",
    nutzer: "89",
    antwortzeit: "1,2 s",
  },
  {
    label: "DIESE WOCHE",
    trend: "+11 % vs. letzte Woche",
    gespräche: "891",
    nutzer: "412",
    antwortzeit: "1,3 s",
  },
  {
    label: "DIESEN MONAT",
    trend: "+14 % vs. letzten Monat",
    gespräche: "3 842",
    nutzer: "1 924",
    antwortzeit: "1,4 s",
  },
];

// ── Sub-components ────────────────────────────────────────────

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const n = data.length;
  const maxVal = Math.max(...data.map((d) => d.value));
  const vw = 660,
    vh = 180;
  const lp = 16,
    rp = 16,
    tp = 14,
    bp = 36;
  const cw = vw - lp - rp;
  const ch = vh - tp - bp;
  const slotW = cw / n;
  const barW = slotW * 0.52;

  return (
    <svg
      viewBox={`0 0 ${vw} ${vh}`}
      className="w-full h-auto select-none"
      role="img"
      aria-label="Gespräche über Zeit"
    >
      {data.map((d, i) => {
        const bh = Math.max(4, (d.value / maxVal) * ch);
        const bx = lp + i * slotW + (slotW - barW) / 2;
        const by = tp + ch - bh;
        const isLast = i === n - 1;
        const isHov = hovered === i;
        const fill = isLast ? "fill-chart-1" : "fill-chart-1/15";
        const fillHov = isLast ? "fill-chart-1 brightness-90" : "fill-chart-1/25";

        return (
          <g
            key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: "pointer" }}
          >
            <rect x={bx} y={by} width={barW} height={bh} rx={4} className={isHov ? fillHov : fill} />
            <text x={bx + barW / 2} y={tp + ch + 20} textAnchor="middle" fontSize={11} className="fill-on-surface-variant">
              {d.label}
            </text>
            {isHov && (
              <>
                <rect x={bx + barW / 2 - 24} y={by - 30} width={48} height={22} rx={5} className="fill-inverse-surface" />
                <text
                  x={bx + barW / 2}
                  y={by - 14}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight="600"
                  className="fill-inverse-on-surface"
                >
                  {d.value}
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function DonutChart() {
  const cx = 75,
    cy = 75,
    r = 56,
    sw = 18;
  const circ = 2 * Math.PI * r;
  // Kumulierte Startwinkel je Segment (Präfixsumme), ohne Mutation während des Renderns.
  const cumStart = DONUT_SEGMENTS.map((_, i) =>
    DONUT_SEGMENTS.slice(0, i).reduce((sum, s) => sum + s.percent, 0),
  );

  return (
    <div className="flex items-center gap-6">
      <div className="shrink-0">
        <svg width={150} height={150} viewBox="0 0 150 150" role="img" aria-label="Widget-Verteilung">
          <circle cx={cx} cy={cy} r={r} fill="none" className="stroke-chart-track" strokeWidth={sw} />
          {DONUT_SEGMENTS.map((seg, i) => {
            const dash = (seg.percent / 100) * circ - 2.5;
            const offset = -(cumStart[i] / 100) * circ;
            const el = (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                className={seg.stroke}
                strokeWidth={sw}
                strokeDasharray={`${Math.max(0, dash)} ${circ}`}
                strokeDashoffset={offset}
                transform={`rotate(-90, ${cx}, ${cy})`}
              />
            );
            return el;
          })}
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize={20} fontWeight="700" className="fill-on-surface">
            3.8k
          </text>
          <text x={cx} y={cy + 13} textAnchor="middle" fontSize={10} className="fill-on-surface-variant" letterSpacing="0.5">
            GESAMT
          </text>
        </svg>
      </div>

      <div className="flex-1 space-y-2.5">
        {DONUT_SEGMENTS.slice(0, 3).map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${seg.dot}`} />
            <span className="text-xs text-on-surface flex-1">{seg.label}</span>
            <span className="text-xs font-semibold">{seg.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────

export function StatisticsPage() {
  const [chartView, setChartView] = useState<ChartView>("Woche");
  const [search, setSearch] = useState("");

  const filteredQuestions = TOP_QUESTIONS.filter((q) =>
    q.text.toLowerCase().includes(search.toLowerCase()),
  );
  const maxCount = Math.max(...TOP_QUESTIONS.map((q) => q.count));

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface border-b border-outline-variant">
        <div className="flex items-center justify-between gap-4 px-6 py-4 max-w-container-max mx-auto w-full">
          <h2 className="text-headline-md font-semibold shrink-0">Statistiken</h2>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Search */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none z-10"
                style={{ fontSize: 18 }}
                width="1em"
                height="1em"
                aria-hidden
              />
              <Input
                type="text"
                placeholder="Suchen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-full bg-surface-container-lowest text-sm w-40"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-6 space-y-6 max-w-container-max mx-auto w-full">
        {/* KPI row */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {KPI_CARDS.map((kpi, i) => {
            const KpiIcon = kpi.icon;
            const TrendIcon = kpi.positive ? TrendingUp : TrendingDown;
            return (
              <Card
                key={i}
                className="rounded-2xl shadow-none p-5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                    <KpiIcon className="text-on-primary-container" style={{ fontSize: 20 }} width="1em" height="1em" aria-hidden />
                  </div>
                  <span
                    className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                      kpi.positive
                        ? "bg-success-container text-on-success-container"
                        : "bg-error-container text-on-error-container"
                    }`}
                  >
                    <TrendIcon style={{ fontSize: 14 }} width="1em" height="1em" aria-hidden />
                    {kpi.delta}
                  </span>
                </div>
                <div>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  <p className="text-sm text-on-surface-variant mt-0.5">{kpi.label}</p>
                </div>
                <p className="text-xs text-on-surface-variant">{kpi.sub}</p>
              </Card>
            );
          })}
        </div>

        {/* Bar chart */}
        <Card className="rounded-2xl shadow-none p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-title-md font-semibold">Gespräche über Zeit</h3>
              <p className="text-sm text-on-surface-variant mt-0.5">Täglich, wöchentlich oder monatlich</p>
            </div>
            <div className="flex rounded-full border border-outline-variant overflow-hidden shrink-0">
              {(["Tag", "Woche", "Monat"] as const).map((view) => (
                <Button
                  key={view}
                  variant="ghost"
                  onClick={() => setChartView(view)}
                  className={`rounded-none px-4 py-1.5 text-sm font-body-base transition-colors ${
                    chartView === view
                      ? "bg-primary text-on-primary font-medium hover:bg-primary"
                      : "text-on-surface-variant hover:bg-secondary-container"
                  }`}
                >
                  {view}
                </Button>
              ))}
            </div>
          </div>
          <BarChart data={CHART_DATA[chartView]} />
        </Card>

        {/* Bottom row: top questions + donut */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Häufigste Fragen */}
          <Card className="lg:col-span-3 rounded-2xl shadow-none p-6">
            <h3 className="text-title-md font-semibold">Häufigste Fragen</h3>
            <p className="text-sm text-on-surface-variant mt-0.5 mb-5">Top 5 Nutzeranfragen diesen Monat</p>
            <div className="space-y-4">
              {filteredQuestions.slice(0, 5).map((q, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{q.text}</p>
                    <div className="mt-1.5 h-1.5 rounded-full bg-secondary-container overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${(q.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold shrink-0 tabular-nums">{q.count}</span>
                </div>
              ))}
              {filteredQuestions.length === 0 && (
                <p className="text-sm text-on-surface-variant text-center py-4">Keine Ergebnisse</p>
              )}
            </div>
          </Card>

          {/* Widget-Verteilung */}
          <Card className="lg:col-span-2 rounded-2xl shadow-none p-6">
            <h3 className="text-title-md font-semibold">Widget-Verteilung</h3>
            <p className="text-sm text-on-surface-variant mt-0.5 mb-5">Gespräche nach Widget</p>
            <DonutChart />
          </Card>
        </div>

        {/* Period summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PERIOD_CARDS.map((period, i) => (
            <Card
              key={i}
              className="rounded-2xl shadow-none p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold tracking-widest text-on-surface-variant">{period.label}</span>
                <span className="flex items-center gap-1 text-xs font-semibold text-on-success-container bg-success-container px-2 py-0.5 rounded-full">
                  <TrendingUp style={{ fontSize: 13 }} width="1em" height="1em" aria-hidden />
                  {period.trend}
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-on-surface-variant">Gespräche</span>
                  <span className="text-lg font-bold text-primary">{period.gespräche}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-on-surface-variant">Nutzer</span>
                  <span className="text-sm font-semibold">{period.nutzer}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-on-surface-variant">Ø Antwortzeit</span>
                  <span className="text-sm font-semibold">{period.antwortzeit}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
