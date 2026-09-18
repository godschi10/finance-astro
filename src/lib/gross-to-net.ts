// Gross→net reverse solver — TS port of inc/gross-to-net.php (binary search
// over payeCalculate, 100 iterations, hi ₦100M/mo). Tested vs PHP vectors.
import { payeCalculate } from "./salary-tax";

export function reverseGrossFind(
  targetNet: number,
  pensionRate = 0.08,
  nhfMonthly = 0,
  annualRent = 0,
  nhisMonthly = 0,
  lifeMonthly = 0,
  otherMonthly = 0,
): number {
  targetNet = Math.max(0, targetNet);
  let lo = 0;
  let hi = 100000000;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    const calc = payeCalculate(mid, pensionRate, nhfMonthly, annualRent, true, nhisMonthly, lifeMonthly, otherMonthly);
    if (calc.net_monthly < targetNet) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export interface ReverseGross {
  gross_monthly: number;
  net_monthly: number;
  tax_monthly: number;
  pension_monthly: number;
  nhf_monthly: number;
  nhis_monthly: number;
  life_monthly: number;
  other_monthly: number;
  relief_monthly: number;
  taxable_monthly: number;
  exempt: number;
  deductions_monthly: number;
}

export function reverseGross(
  targetNet: number,
  pensionRate = 0.08,
  nhfMonthly = 0,
  annualRent = 0,
  nhisMonthly = 0,
  lifeMonthly = 0,
  otherMonthly = 0,
): ReverseGross {
  const gross = reverseGrossFind(targetNet, pensionRate, nhfMonthly, annualRent, nhisMonthly, lifeMonthly, otherMonthly);
  const calc = payeCalculate(gross, pensionRate, nhfMonthly, annualRent, true, nhisMonthly, lifeMonthly, otherMonthly);
  return {
    gross_monthly: gross,
    net_monthly: calc.net_monthly,
    tax_monthly: calc.tax_monthly,
    pension_monthly: calc.pension_annual / 12,
    nhf_monthly: calc.nhf_annual / 12,
    nhis_monthly: calc.nhis_annual / 12,
    life_monthly: calc.life_annual / 12,
    other_monthly: calc.other_annual / 12,
    relief_monthly: calc.relief_annual / 12,
    taxable_monthly: calc.taxable / 12,
    exempt: calc.exempt ? 1 : 0,
    deductions_monthly: calc.deductions / 12,
  };
}
