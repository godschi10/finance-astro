// Amount-pages engine — TS port of inc/amount-pages.php (config-driven SEO
// cluster: one template + engine serving every amount slug). Copy lives in
// src/data/amount-pages.json (dumped read-only from the truth theme via
// scripts/php-harness/dump_amount.php); all math here. Tested vs PHP vectors.
import { fxConvert, fxCurrencies, fxParallelSpread, fxParallelNgnUsd } from "./fx";
import { formatGrouped } from "./format";
import amountCfg from "../data/amount-pages.json";

export interface AmountSection {
  h2: string;
  body: string[];
}

export interface AmountFaq {
  q: string;
  a: string;
}

export interface AmountCfg {
  amount: number;
  from: string;
  to: string;
  title?: string;
  meta_desc?: string;
  h1?: string;
  content: { lede: string; sections: AmountSection[]; faqs: AmountFaq[] };
}

const CFG = amountCfg as Record<string, AmountCfg>;

/** All amount slugs, config order. */
export function amountSlugs(): string[] {
  return Object.keys(CFG);
}

export function amountConfig(slug: string): AmountCfg | null {
  return CFG[slug] ?? null;
}

const CUR_NAMES: Record<string, string> = {
  USD: "Dollars", GBP: "Pounds", EUR: "Euros", CAD: "Canadian Dollars", NGN: "Naira",
};
const CUR_LOWER: Record<string, string> = {
  USD: "dollars", GBP: "pounds", EUR: "euros", CAD: "Canadian dollars", NGN: "naira",
};

function millionLabel(a: number): string {
  if (a < 1000000) return formatGrouped(a, 0);
  return (a / 1000000).toFixed(1).replace(/\.?0+$/, "") + " Million";
}

export interface AmountSeo {
  title: string;
  meta_desc: string;
  h1: string;
}

/** Keyword-targeted title/meta/H1 (generated unless the entry overrides). */
export function amountSeo(slug: string, c: AmountCfg): AmountSeo {
  const a = Number(c.amount);
  const amlf = millionLabel(a);
  const amtl = amlf.toLowerCase();
  let h1: string;
  let title: string;
  let desc: string;
  if ("NGN" === c.to) {
    const fromName = CUR_NAMES[c.from] ?? c.from;
    const fromLower = CUR_LOWER[c.from] ?? String(c.from).toLowerCase();
    h1 = `${amlf} ${fromName} to Naira`;
    title = `${h1}, Live Rate`;
    desc = `How much is ${amtl} ${fromLower} in naira today? The live mid-market figure, what it buys in Nigeria, and how to get the best real-world rate.`;
  } else {
    const toName = CUR_NAMES[c.to] ?? c.to;
    const toLower = CUR_LOWER[c.to] ?? String(c.to).toLowerCase();
    h1 = `${amlf} Naira to ${toName}`;
    title = `${h1}, Live Rate`;
    desc = `What is ${amtl} naira in ${toLower} today? The live mid-market answer plus real Nigerian context on fees, spreads and currency goals.`;
  }
  return {
    title: c.title ?? title,
    meta_desc: c.meta_desc ?? desc,
    h1: c.h1 ?? h1,
  };
}

export interface AmountFx {
  rates: Record<string, number>;
  as_of: string;
  cached: boolean;
  ok: boolean;
}

export interface AmountPageData {
  slug: string;
  amount: number;
  from: string;
  to: string;
  rates: Record<string, number>;
  unit_rate: number;
  rev_rate: number;
  converted: number;
  reverse: number;
  as_of: string;
  cached: boolean;
  ok: boolean;
  seo: AmountSeo;
  cfg: AmountCfg;
}

/** Every figure for one page, all through the shared converter. */
export function amountPageData(slug: string, fx: AmountFx): AmountPageData | null {
  const cfg = CFG[slug];
  if (!cfg) return null;
  const rates = fx.rates && typeof fx.rates === "object" ? fx.rates : {};
  const from = cfg.from;
  const to = cfg.to;
  const amount = Number(cfg.amount);
  const unitRate = fxConvert(1, from, to, rates);
  const revRate = fxConvert(1, to, from, rates);
  if (unitRate <= 0) return null;
  return {
    slug,
    amount,
    from,
    to,
    rates,
    unit_rate: unitRate,
    rev_rate: revRate,
    converted: fxConvert(amount, from, to, rates),
    reverse: fxConvert(amount, to, from, rates),
    as_of: String(fx.as_of ?? ""),
    cached: !!fx.cached,
    ok: !!fx.ok,
    seo: amountSeo(slug, cfg),
    cfg,
  };
}

/** Currency-format a value (NGN grouped 0dp; sub-100 foreign 2dp). */
export function amountFmt(value: number, cur: string): string {
  value = Number(value);
  if ("NGN" === cur) return "₦" + formatGrouped(value, 0);
  const dec = value < 100 ? 2 : 0;
  const currencies = fxCurrencies();
  const symbol = currencies[cur]?.symbol ?? "$";
  return symbol + formatGrouped(value, dec);
}

/** Same-direction neighbours, amount-ascending (slugs). */
export function amountSiblings(slug: string): string[] {
  const c = CFG[slug];
  if (!c) return [];
  const dir = `${c.from}>${c.to}`;
  return Object.keys(CFG)
    .filter((s) => s !== slug && `${CFG[s].from}>${CFG[s].to}` === dir)
    .sort((x, y) => CFG[x].amount - CFG[y].amount);
}

/** Opposite-direction pages, amount-ascending (slugs). */
export function amountOpposite(slug: string): string[] {
  const c = CFG[slug];
  if (!c) return [];
  const dir = `${c.to}>${c.from}`;
  return Object.keys(CFG)
    .filter((s) => `${CFG[s].from}>${CFG[s].to}` === dir)
    .sort((x, y) => CFG[x].amount - CFG[y].amount);
}

/** Token map ({LIVE}, {SIBLINGS}, {PARALLEL}, …) for one page. */
export function amountTokens(
  slug: string,
  d: AmountPageData,
  pageUrl: (s: string) => string = () => "https://example.test/",
): Record<string, string> {
  const live =
    `${amountFmt(d.amount, d.from)} converts to ${amountFmt(d.converted, d.to)}` +
    ` at the current mid-market rate (1 ${d.from} = ${amountFmt(d.unit_rate, d.to)}).`;
  const note = "the figure is computed live from the same engine as the main converter";

  const sibLinks = amountSiblings(slug).map(
    (s) => `<a href="${pageUrl(s)}">${amountSeo(s, CFG[s]).h1}</a>`,
  );
  const siblings = sibLinks.length
    ? sibLinks.slice(0, -1).join(", ") + (sibLinks.length > 1 ? " and " : "") + sibLinks[sibLinks.length - 1]
    : "the related pages below";
  const sibSentence = sibLinks.length ? `See the neighbouring brackets: ${siblings}.` : "";

  const oppLinks = amountOpposite(slug).map(
    (s) => `<a href="${pageUrl(s)}">${amountSeo(s, CFG[s]).h1}</a>`,
  );
  const opposite = oppLinks.length ? oppLinks.join(", ") : "the main converter";

  const spread = fxParallelSpread();
  const ngnPer = d.rates["NGN"] && d.rates["NGN"] > 0 ? Number(d.rates["NGN"]) : 0;
  const parNgn = ngnPer > 0 ? fxParallelNgnUsd(ngnPer, spread) : 0;
  const spreadPct = formatGrouped((spread - 1) * 100, 1);
  let parallel = "";
  if (d.from === "USD" && parNgn > 0) {
    parallel =
      `${amountFmt(d.amount * parNgn, "NGN")} at the parallel (street) rate, about ${spreadPct}% above the official figure, ` +
      "because peer-to-peer and street trades price the difficulty of getting dollars.";
  } else if (d.to === "USD" && parNgn > 0) {
    const pv = d.amount / parNgn;
    parallel =
      `$${formatGrouped(pv, pv < 100 ? 2 : 0)} at the parallel (street) rate, naira buys a little fewer dollars on the informal market ` +
      "than the official figure implies, because P2P and street rates sit above the official price of a dollar.";
  }

  return {
    "{LIVE}": live,
    "{LIVE_NOTE}": note,
    "{SIBLINGS}": siblings,
    "{SIBLINGS_SENTENCE}": sibSentence,
    "{OPPOSITE}": opposite,
    "{PARALLEL}": parallel,
  };
}

/** Substitute tokens into authored text. */
export function amountRenderText(text: string, tokens: Record<string, string>): string {
  let out = text;
  for (const [k, v] of Object.entries(tokens)) out = out.split(k).join(v);
  return out;
}
