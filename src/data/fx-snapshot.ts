// Build-time FX snapshot (indicative, NOT live). Client scripts attempt a
// live refresh from open.er-api.com (8s abort); on failure the snapshot
// stands with an honest "snapshot" label — never presented as live.
export interface FxSnapshot {
  ok: boolean;
  rates: Record<string, number>;
  as_of: string;
  cached: boolean;
}

export const FX_SNAPSHOT: FxSnapshot = {
  ok: true,
  rates: {
    USD: 1.0, NGN: 1482.0, GBP: 0.79, EUR: 0.92,
    CAD: 1.36, AED: 3.6725, SAR: 3.75, GHS: 16.2,
    XOF: 565.0, XAF: 565.0, CNY: 6.74, JPY: 159.9,
    INR: 95.5, KES: 129.5, EGP: 54.0, ZAR: 18.2,
  },
  as_of: "Sep 2026 snapshot",
  cached: false,
};

export const FX_SNAPSHOT_LABEL = "indicative snapshot — refresh for live";
