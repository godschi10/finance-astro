// FX-history pure math — TS port of inc/fx-history.php
// gwill_fx_history_range() + gwill_fx_history_summary() (no WP, no SVG
// templating; the chart is drawn client-side from the same numbers).
// Tested vs PHP vectors.
export interface FxPoint {
  date: string; // Y-m-d, ascending
  ngn: number; // NGN per 1 USD
}

function pointTs(p: FxPoint): number {
  const ms = Date.parse(p.date + "T00:00:00Z");
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : 0;
}

/** Last-N-days window; always keeps the newest ("now" anchor) point. */
export function fxHistoryRange(points: FxPoint[], days: number, nowMs = Date.now()): FxPoint[] {
  if (!points.length) return [];
  const cutoff = nowMs / 1000 - days * 86400;
  const out = points.filter((p) => {
    const ts = pointTs(p);
    return ts !== 0 && ts >= cutoff;
  });
  if (out.length) {
    const lastAll = points[points.length - 1];
    const lastOut = out[out.length - 1];
    if (lastOut.date !== lastAll.date || lastOut.ngn !== lastAll.ngn) {
      out.push(lastAll);
    }
  }
  return out;
}

export interface FxSummary {
  current: number;
  first: number;
  change: number;
  change_pct: number;
  min: number;
  max: number;
  direction: "up" | "down";
}

/** Current rate, window change, min/max for the stat strip. */
export function fxHistorySummary(points: FxPoint[], fallbackNgn: number): FxSummary {
  if (points.length < 2) {
    const cur = fallbackNgn;
    return { current: cur, first: cur, change: 0, change_pct: 0, min: cur, max: cur, direction: "up" };
  }
  const vals = points.map((p) => p.ngn);
  const first = Number(vals[0]);
  const current = Number(vals[vals.length - 1]);
  const change = current - first;
  return {
    current,
    first,
    change,
    change_pct: first > 0 ? (change / first) * 100 : 0,
    min: Math.min(...vals),
    max: Math.max(...vals),
    direction: change >= 0 ? "up" : "down",
  };
}
