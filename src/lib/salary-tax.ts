// PAYE salary-tax engine — TS port of inc/salary-tax.php.
// Nigeria Tax Act 2025 (in force 1 Jan 2026) vs Finance Act 2023 (old).
// Numerically tested against the PHP originals (docs/PHASE2-TEST-VECTORS.md).

export interface PayeBand {
  low: number;
  high: number | null;
  rate: number;
}

export function payeBandsOld(): PayeBand[] {
  return [
    { low: 0, high: 300000, rate: 0.07 },
    { low: 300000, high: 600000, rate: 0.11 },
    { low: 600000, high: 1100000, rate: 0.15 },
    { low: 1100000, high: 1600000, rate: 0.19 },
    { low: 1600000, high: 3200000, rate: 0.21 },
    { low: 3200000, high: null, rate: 0.24 },
  ];
}

export function payeBands2026(): PayeBand[] {
  return [
    { low: 0, high: 800000, rate: 0.0 },
    { low: 800000, high: 3000000, rate: 0.15 },
    { low: 3000000, high: 12000000, rate: 0.18 },
    { low: 12000000, high: 25000000, rate: 0.21 },
    { low: 25000000, high: 50000000, rate: 0.23 },
    { low: 50000000, high: null, rate: 0.25 },
  ];
}

export const MINIMUM_WAGE_MONTHLY = 70000;
export const RENT_RELIEF_CAP = 500000;
export const RENT_RELIEF_RATE = 0.2;
export const OLD_CRA_BASE = 200000;
export const OLD_CRA_RATE = 0.2;

export interface PayeResult {
  gross_annual: number;
  pension_annual: number;
  nhf_annual: number;
  nhis_annual: number;
  life_annual: number;
  other_annual: number;
  relief_annual: number;
  taxable: number;
  tax_annual: number;
  deductions: number;
  net_annual: number;
  net_monthly: number;
  tax_monthly: number;
  exempt: boolean;
}

export function payeCalculate(
  monthlyGross: number,
  pensionRate = 0.08,
  nhfMonthly = 0,
  annualRent = 0,
  use2026 = true,
  nhisMonthly = 0,
  lifeMonthly = 0,
  otherMonthly = 0,
): PayeResult {
  monthlyGross = Math.max(0, monthlyGross);
  pensionRate = Math.min(1, Math.max(0, pensionRate));
  nhfMonthly = Math.max(0, nhfMonthly);
  annualRent = Math.max(0, annualRent);
  nhisMonthly = Math.max(0, nhisMonthly);
  lifeMonthly = Math.max(0, lifeMonthly);
  otherMonthly = Math.max(0, otherMonthly);

  const grossAnnual = monthlyGross * 12;
  const pensionAnnual = grossAnnual * pensionRate;
  const nhfAnnual = nhfMonthly * 12;
  const nhisAnnual = nhisMonthly * 12;
  const lifeAnnual = lifeMonthly * 12;
  const otherAnnual = otherMonthly * 12;

  let reliefAnnual: number;
  let exempt: boolean;
  if (use2026) {
    reliefAnnual = Math.min(annualRent * RENT_RELIEF_RATE, RENT_RELIEF_CAP);
    exempt = monthlyGross <= MINIMUM_WAGE_MONTHLY;
  } else {
    reliefAnnual = OLD_CRA_BASE + grossAnnual * OLD_CRA_RATE;
    exempt = false;
  }

  const totalRelief = reliefAnnual + nhisAnnual + lifeAnnual + otherAnnual;
  const taxable = Math.max(0, grossAnnual - pensionAnnual - nhfAnnual - totalRelief);

  let tax = 0;
  if (!exempt) {
    const bands = use2026 ? payeBands2026() : payeBandsOld();
    for (const b of bands) {
      if (taxable <= b.low) break;
      if (b.high === null) {
        tax += (taxable - b.low) * b.rate;
        break;
      }
      tax += (Math.min(taxable, b.high) - b.low) * b.rate;
    }
  }

  const deductions = pensionAnnual + nhfAnnual + nhisAnnual + lifeAnnual + otherAnnual + tax;
  const netAnnual = grossAnnual - deductions;

  return {
    gross_annual: grossAnnual,
    pension_annual: pensionAnnual,
    nhf_annual: nhfAnnual,
    nhis_annual: nhisAnnual,
    life_annual: lifeAnnual,
    other_annual: otherAnnual,
    relief_annual: reliefAnnual,
    taxable,
    tax_annual: tax,
    deductions,
    net_annual: netAnnual,
    net_monthly: netAnnual / 12,
    tax_monthly: tax / 12,
    exempt,
  };
}

export interface PayeCompare {
  old: PayeResult;
  new: PayeResult;
  save_monthly: number;
  save_annual: number;
}

export function payeCompare(
  monthlyGross: number,
  pensionRate = 0.08,
  nhfMonthly = 0,
  annualRent = 0,
  nhisMonthly = 0,
  lifeMonthly = 0,
  otherMonthly = 0,
): PayeCompare {
  const old = payeCalculate(monthlyGross, pensionRate, nhfMonthly, annualRent, false, nhisMonthly, lifeMonthly, otherMonthly);
  const neu = payeCalculate(monthlyGross, pensionRate, nhfMonthly, annualRent, true, nhisMonthly, lifeMonthly, otherMonthly);
  return { old, new: neu, save_monthly: neu.net_monthly - old.net_monthly, save_annual: neu.net_annual - old.net_annual };
}

export interface BreakdownRow {
  label: string;
  amount: number;
  kind: "income" | "deduction" | "tax" | "net";
}

export function payeBreakdown(
  monthlyGross: number,
  pensionRate = 0.08,
  nhfMonthly = 0,
  annualRent = 0,
  use2026 = true,
  nhisMonthly = 0,
  lifeMonthly = 0,
  otherMonthly = 0,
): BreakdownRow[] {
  const r = payeCalculate(monthlyGross, pensionRate, nhfMonthly, annualRent, use2026, nhisMonthly, lifeMonthly, otherMonthly);
  const rows: BreakdownRow[] = [
    { label: "Gross annual income", amount: r.gross_annual, kind: "income" },
    { label: "Pension (employee)", amount: -r.pension_annual, kind: "deduction" },
    { label: "National Housing Fund (NHF)", amount: -r.nhf_annual, kind: "deduction" },
    { label: "NHIS (health insurance)", amount: -r.nhis_annual, kind: "deduction" },
    { label: "Life assurance", amount: -r.life_annual, kind: "deduction" },
    { label: "Other reliefs", amount: -r.other_annual, kind: "deduction" },
  ];
  rows.push(
    use2026
      ? { label: "Rent relief (20% of rent, cap ₦500k)", amount: -r.relief_annual, kind: "deduction" }
      : { label: "Consolidated Relief Allowance (CRA)", amount: -r.relief_annual, kind: "deduction" },
  );
  rows.push(
    { label: "Taxable income", amount: r.taxable, kind: "tax" },
    { label: "PAYE tax (annual)", amount: -r.tax_annual, kind: "tax" },
    { label: "Take-home pay (annual)", amount: r.net_annual, kind: "net" },
    { label: "Take-home pay (monthly)", amount: r.net_monthly, kind: "net" },
  );
  return rows;
}

export interface BandSlice {
  low: number;
  high: number | null;
  rate: number;
  slice: number;
  tax: number;
  cumulative: number;
}

export function payeBandBreakdown(taxable: number, bands: PayeBand[]): BandSlice[] {
  taxable = Math.max(0, taxable);
  let cumulative = 0;
  const out: BandSlice[] = [];
  for (const b of bands) {
    const floor = b.high === null ? taxable : Math.min(taxable, b.high);
    const slice = Math.max(0, floor - b.low);
    const tax = slice * b.rate;
    cumulative += tax;
    out.push({ low: b.low, high: b.high, rate: b.rate, slice, tax, cumulative });
    if (b.high !== null && taxable <= b.high) break;
  }
  return out;
}

export interface BandCompare {
  old: BandSlice[];
  new: BandSlice[];
  old_tax: number;
  new_tax: number;
  save_annual: number;
}

export function payeBandCompare(taxable: number): BandCompare {
  const old = payeBandBreakdown(taxable, payeBandsOld());
  const neu = payeBandBreakdown(taxable, payeBands2026());
  const oldTax = old.reduce((s, r) => s + r.tax, 0);
  const newTax = neu.reduce((s, r) => s + r.tax, 0);
  return { old, new: neu, old_tax: oldTax, new_tax: newTax, save_annual: oldTax - newTax };
}

export interface BonusTax {
  bonus: number;
  tax: number;
  net: number;
  rate: number;
}

export function payeBonusTax(
  monthlyGross: number,
  bonus: number,
  pensionRate = 0.08,
  nhfMonthly = 0,
  annualRent = 0,
  nhisMonthly = 0,
  lifeMonthly = 0,
  otherMonthly = 0,
): BonusTax {
  bonus = Math.max(0, bonus);
  if (bonus <= 0) return { bonus: 0, tax: 0, net: 0, rate: 0 };
  // Bonus is pure additional income: NOT pensioned. Tax at the marginal rate
  // by adding the full bonus to base taxable and taking the tax difference.
  const base = payeCalculate(monthlyGross, pensionRate, nhfMonthly, annualRent, true, nhisMonthly, lifeMonthly, otherMonthly);
  let bonusTax = 0;
  if (!base.exempt) {
    const withBonus = payeBandBreakdown(base.taxable + bonus, payeBands2026());
    const taxWithBonus = withBonus.reduce((s, b) => s + b.tax, 0);
    bonusTax = Math.max(0, taxWithBonus - base.tax_annual);
  }
  return { bonus, tax: bonusTax, net: bonus - bonusTax, rate: bonus > 0 ? bonusTax / bonus : 0 };
}
