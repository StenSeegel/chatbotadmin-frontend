import type { ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Badge, Card, Stack, cn } from "@ki4jlu/design-system";

// KPI-Kachel nach dem Dashboard-Story-Muster des Design-Systems (Card + Stack).
// Ersetzt die je Seite handgebauten Statistik-Karten. Upstream-Kandidat.
export interface StatCardProps {
  label: string;
  value: ReactNode;
  /** Icon im Kreis (z. B. <MessagesSquare />), oben links. */
  icon?: ReactNode;
  /** Veränderung ggü. Vorperiode; rendert ein Badge mit Trend-Icon. */
  delta?: { label: string; positive: boolean };
  /** Zusatzzeile unter dem Label (z. B. "vs. 3 370 letzten Monat"). */
  sub?: string;
  /** Hebt den Wert in Primärfarbe hervor (z. B. offene Gespräche). */
  accent?: boolean;
  className?: string;
}

export function StatCard({ label, value, icon, delta, sub, accent = false, className }: StatCardProps) {
  const TrendIcon = delta?.positive ? TrendingUp : TrendingDown;

  return (
    <Card className={cn("p-gutter", className)}>
      <Stack gap="sm">
        {(icon || delta) && (
          <div className="flex items-start justify-between gap-stack-sm">
            {icon ? (
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container [&_svg]:h-5 [&_svg]:w-5"
              >
                {icon}
              </span>
            ) : (
              <span />
            )}
            {delta && (
              <Badge tone={delta.positive ? "success" : "error"}>
                <TrendIcon width="1em" height="1em" aria-hidden />
                {delta.label}
              </Badge>
            )}
          </div>
        )}
        <div>
          <p className={cn("font-stat-lg text-stat-lg", accent ? "text-primary" : "text-on-surface")}>{value}</p>
          <p className="font-label-sm text-label-sm text-on-surface-variant">{label}</p>
        </div>
        {sub && <p className="text-xs text-on-surface-variant">{sub}</p>}
      </Stack>
    </Card>
  );
}
