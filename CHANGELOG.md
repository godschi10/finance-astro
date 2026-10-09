# Changelog

All notable changes to the finance-astro port. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/); dates are UTC.


## [0.7.50] — 2026-10-09 — repo hygiene: the public portfolio repo was publishing our internals (PROC-3)

`gh api repos/godschi10/finance-astro` → `"private": false, "visibility": "public"`. Everything tracked here is
world-readable, and this is the repository a reviewer opens. Audit item PROC-3.

**Measured first, so this is not inflated:** a credentials scan across every tracked file found **no secrets**.
Every `token`/`key`/`secret` hit is prose about design tokens or the moderation token's *behaviour* — no
credential, no private-key block. This is a hygiene and judgement matter, not a security incident.

**Untracked (still on disk, still working):** `PENDING-WORK.md` — the team's live working ledger, kept at the
repo root where daily work and the Manager's notes reference it — plus one round's scratch: six
`a7-503020-*.png`, `a7-results.json`, `a7-test.mjs`, `test-budget.mjs`. Each ignore rule carries a comment
saying why it exists.

**Sanitized:** `README.md` published the production theme path `/var/www/finance/wp-content/themes/…`. It now
states that the WordPress theme is maintained in its own repository, `gwill-finance-theme` — which is true, and
was verified to exist before the sentence was written. That repository is private; the wording claims nothing a
reader cannot check.

Tracked files **277 → 267**. Files leaking an infrastructure path **27 → 24**. `docs/` untouched at 63. `src/`
untouched at 123. **No served byte changes** — the version is not surfaced in `dist/`, `README.md` is not
published, and none of the ten files reach the build. `main` only; no `pages-dist` deploy for this one.

**A near-miss worth recording.** The obvious ignore glob for the scratch files is `*budget*`, which would have
silently unpublished `src/lib/budget.ts`, `50-30-20-budget-calculator.astro` and `budget-allocator.astro` — two
live money tools and their engine, gone from the repo with no error and no failing gate. The exact filename
`test-budget.mjs` was used instead, and all three were confirmed still tracked. **Any future `.gitignore` work
in this repo should be pattern-checked against `git ls-files` before committing.**

**Open, and not closed by this commit.** Untracking a file does not remove it from history:
`PENDING-WORK.md` (386 lines), the six screenshots (~12 MB) and the scratch scripts **remain retrievable from
every earlier commit** in a public repository. Closing that needs `filter-repo`/BFG, a force-push and a
re-clone by every collaborator — **not authorised, not done, and the King's call.** The remaining 24 files
(`src/` comments ×4, `scripts/` ×7, `docs/` ×11, `CHANGELOG.md` ×2) are itemised in the OUTSTANDING-LIST.

Gates 6/6 (article 147/147, vectors 95/95; footer 64, homepage 128), suite 128/0/7 — both re-run by the Manager,
not taken on the worker's transcript.

## [0.7.49] — 2026-10-09 — the currency glyph must follow the currency (King-found)
The King found it himself, 9 Oct 16:12: on the converter with **From = USD**, the amount field
showed a **₦** glyph. A naira symbol on a dollar amount mislabels the number you just typed — on a
finance site a currency symbol is a claim about the unit.

**Root cause.** `src/scripts/money-controls.js` injected the glyph into every `.field` whose **label
text merely CONTAINED the character ₦** and whose input was `inputmode="decimal"`:
`if (label.textContent.indexOf('\u20A6') === -1) return;`. The converter's label is
*"Amount (₦ $ £ € and 12 more)"*, where ₦ is one item in a list of fifteen. A substring test with no
notion of which currency the field holds. Injected once at boot and **never updated when the select
changed**, so it was wrong for every currency except the one it happened to assume.

**The substring test is gone from the source entirely.** A field now declares its unit —
`<div class="field" data-cur="NGN">` — and the script renders that. **42 decimal fields** declare it
across the fleet; the 36 that were genuinely naira got the attribute, with every label string
byte-identical and **no hand-edited labels**.

**Symbols come from the site's own table** (`fxCurrencies()`, `lib/fx.ts` — the same object the
converter's `<select>` is built from), so there is no second symbol map and none invented. A code the
table does not know prints **itself**, which is still honest.

**Dynamic, and it survives the re-render.** A delegated `change`/`input` listener re-syncs after the
page's own render, and injection is idempotent. Each conditional page re-declares `data-cur` in the
render it already had — the converter from `from.value`, the comparator from the origin currency it
had already computed.

| From | Before | After |
|---|---|---|
| USD | ₦ | **$** |
| NGN | ₦ | ₦ |
| GBP | ₦ | **£** |
| JPY | ₦ | **¥** |
| AED | ₦ | **د.إ** |
| ZAR / XOF / CAD / … | ₦ | R / CFA / CA$ / … |

**Manager follow-up, the same lie one line lower.** The worker flagged and did NOT touch it: the
transfer comparator's receipt hardcoded `q.dest === "NGN" ? "₦" : "$"`, so with Send-currency GBP the
field correctly read **"£ 100,000"** while the receipt on the same page still printed **"$100,000"**.
That is the identical lie, one line below the one just fixed, so it is fixed here — symbols now come
from the same table the field uses, and the two cannot disagree.

**Fleet-wide file touched, and it is the one that groups digits on blur.** `money-controls.js` is
additive here: the removed lines are the defective test and the old hardcoded glyph creation — the
**blur/comma-grouping logic is not in the removed set at all**. Suite confirms **15/15 tools, 128 pass /
0 fail / 7 skip**.

**Verified live, 42 fields swept:** 41 show ₦ and the one non-NGN field is the converter's USD seed
showing $ — correct by design. No field carries a duplicated glyph. 0 page errors.

**Left open and reported, not hidden:** the accessible name reads `AMOUNT IN BRITISH POUND (£) SAMPLE`
because smart-fields' SAMPLE badge lives inside the `<label>`. Pre-existing, not from this change, and
fixing it means touching the spine.

Gates 6/6 (article 147/147, vectors 95/95; footer 64, homepage 128), 79 pages, suite 128/0/7.

## [0.7.48] — 2026-10-09 — SITE-4 + PROC-5: the privacy policy, rewritten from the real flows
Audit Appendix A step 4. The policy had been describing a site that is not this one.

**The first thing found was worse than a wrong sentence.** The old "Last updated" date was derived
from `new Date()` — so **every single build silently re-dated a legal document.** The page carried two
different dates (October at the top, August at the bottom) because nothing tied them. The date is now
a human-edited literal in `src/data/policy.ts`, deliberately kept out of `site.ts` because that file
re-dirties on every build. One date, one place, and it can only move when someone means it to.

**It claimed an analytics service that does not exist.** "Anonymous analytics… a privacy-respecting
analytics service." Verified across the whole build: plausible, gtag, googletagmanager, analytics.js,
umami, goatcounter, counter.dev — **zero files**, the privacy page itself being the only mention. The
claim is gone, replaced by the honest and far more favourable truth: **"No analytics. No analytics
script and no tracking script runs anywhere on this site."** Replacing it with a different vendor
would have reintroduced the exact error being fixed.

**It named no processor for the newsletter.** Now established from source rather than guessed: the
newsletter and contact forms post to **the same Cloudflare Worker the comments use**
(`comments-api.gwill.workers.dev`) — `gwill-forms.js` reads `data-forms-api` off `<html>` and attaches
to every `.gwill-form`. There is no separate email platform. The audit had this as `[Guessing]`.

**It said "Cookies — a small storage flag".** The site uses `localStorage`, not cookies, and the
calculators remember far more than a preference. Corrected. The FX request to `open.er-api.com` and
the Gravatar requests to `secure.gravatar.com` are now disclosed at all — neither was mentioned.

**The policy is now a real data-flow table**: what / why / who receives it / where / how long, ten rows,
every one sourced from the built output. Where the answer is not knowable — chiefly how long the Worker
keeps a name, email or comment — the cell says **"Not published"** rather than inventing a period. No
lawful basis, controller identity, regulator or response deadline is asserted anywhere; those are legal
positions, not copy, and the audit itself says it is not a lawyer.

**Regime:** the **Nigeria Data Protection Act 2023** is named as what applies. GDPR/UK GDPR is
explicitly *not* claimed, because the site is not directed at those audiences and offering rights
handling we would not honour is worse than saying nothing.

**PROC-5 — the calculators remember salary, rent and income, and nobody said so.** On a finance site
that data sits in `localStorage` including on a shared or public computer, which is the most likely
way this policy could actually hurt someone.
- **Transmission audit, driven live, not assumed:** typing `487500` into income fired **0 requests,
  0 non-GET, 0 bodies containing the number** — while the number *was* written to
  `gwill-sf-50-30-20` and returned on reload wearing LAST USED. Nothing you type leaves the device.
  (A first attempt typed into a field the site deliberately excludes from memory and proved nothing;
  it was discarded and re-run against a genuinely remembered id.)
- **A visible "Clear my saved numbers" control at 44px**, sweeping every `gwill-sf-*` key while
  preserving the theme key and ticker cache. Verified: 1 key -> 0, label confirms, page returns to
  the worked example.
- **One sentence under every calculator** saying the numbers stay in that browser and Reset clears
  them — shared through `ToolShell`, so **no calculator page was hand-edited**.

**A fleet-wide file was touched, and it is the one that broke nine contracts once before.**
`src/scripts/smart-fields.js` is additive: 63 insertions, 1 deletion, and that deletion is only the
literal `"gwill-sf-" + tool` being replaced by the shared `PREFIX` constant. `clearExamples()`,
`takeSnapshot()`, `register()` and `sfFig()` have **zero removed lines** — the functions that caused
the earlier failure are untouched. Suite confirms: **15/15 tools, 128 pass / 0 fail / 7 skip.**

**Two corrections the leg made to itself, kept rather than hidden:** it first wrote the ticker row
naming CoinGecko while the browser showed the default call is **Coinbase**, and rewrote it — naming an
uncontacted vendor while omitting the contacted one is the same error under repair. And `vibe_guest_email`
goes to `sessionStorage`, not `localStorage` as the audit's note assumed; the policy says so precisely.

**⏸ OPEN — and it is a pre-launch blocker, not a finished policy:** the "Not published" retention
cells are honest, but retention, a named controller and a response deadline for the Worker's data have
to be settled properly before this goes live. The audit's own closing line stands: have it reviewed.

Gates 6/6 (article 147/147, vectors 95/95; footer 64, homepage 128), 79 pages, suite 128/0/7.

## [0.7.47] — 2026-10-09 — CALC-5/9/10: the label, the prose, the assumption, the separator
Audit Appendix A step 1, remainder. Four pages, copy and formatting only — **no maths changed.**

**CALC-5 — the label named the wrong quantity.** The tile read *"Discount to today 34.1%"*, but
682,215 ÷ 2,000,000 = 34.1% is the share you **keep**; the discount is 65.9%, which the same page
already printed correctly as "Buying power lost". The page contradicted itself inside one card. Now
**"Worth today (share of face value) 34.1%"**, with the number bound to it. The false *label* is gone;
the word "Discount" still appears three times on the page in correct uses — the element id
`nv-pv-disc`, the foot "Discounted at the inflation above — the reverse direction", and prose about
*discounting* future naira — none of which claim 34.1% is a discount. (An earlier draft of this entry
claimed the word appeared nowhere in the served bytes; that was wrong and is corrected here.)
The raw `e+23` print the audit flagged is already fixed; confirmed, nothing to do.

**CALC-9 — the prose described controls that do not exist.** Savings-goal claimed it *"converts any
of the four frequencies, monthly, quarterly, daily or annual"* and an FAQ told you to *"set the
number of years"*. The page has **four inputs and no frequency selector, and the unit is months**.
Three statements about controls that were never there. Both retired. The replacement says what is
true and useful: one compounding mode, monthly, converted from the annual rate you type, with the
rate field and the months field as the two controls that move the answer. No selector was invented to
rescue the prose — inventing a control to justify a sentence is how a calculator grows a lie.

**CALC-9 — deposit timing was undisclosed. This was the real harm.** Both savings-goal and
compound-interest assume deposits land at the **end** of each period. A salary-day deposit lands at
the **start**, and the difference is material: on the audit's own figures ₦100,000 + ₦50,000/month at
10% for 5 years is **₦4,036,385** end-of-month against **₦4,068,650** start-of-month — ₦32,265 of
difference between an assumption the page never stated. Each page now says so in a plain visible line
under the figure: **"Deposits land at the end of each month"** / **"...of each period"**.

**CALC-10 — `true APR 2333.9%` in the receipt while the FAQ said `2,333.9%`,** on the same page.
Both now use `Intl.NumberFormat("en-NG")`, defined in the frontmatter **and** in the client script,
because a fix that formats only the server-rendered copy leaves the live figure wrong the moment a
visitor types. Verified by driving the page: 2,333.9% → 1,250.5% → 2,303.1% across recalculations,
comma present every time.

**CALC-10 — the rounding footnote was measured, not reasoned about, and it was wrong.** It claimed
*"day tenors round up to whole months"* as though it governed every rate type. Measured across
29/30/31/45/60 days under all three rate types:
- **daily** runs on the exact day count and is perfectly smooth — month rounding has no effect at all;
- **flat** steps **discontinuously at 31 days** (19.6% → 26.7%, +7.1 points for one extra day, because
  a whole extra month of flat interest is charged: ₦101,500 → ₦103,000);
- **reducing** holds 34.5% at every tenor while its total still steps.
The footnote now says exactly that: month rounding applies to flat and reducing, 31 or 45 days is a
2-month loan, one extra day can step a flat APR, and daily uses the exact day count.

**HELD, as ordered:** the deposit-timing **toggle** (the full feature — new inputs, two engines, and
an oracle regeneration on PHP-first terms — is its own leg, deliberately deferred rather than
forgotten; the disclosure removes the misunderstanding today), and CALC-9's rate-guidance
disagreement across three pages, left quoted and unsourced rather than unified on a guess.

Gates 6/6 (article 147/147, vectors 95/95; footer 64, homepage 128), 79 pages, suite 128/0/7.

## [0.7.46] — 2026-10-09 — CALC-6/7/8: stop promising automation the site does not have
King's audit, Appendix A step 3. Honesty only: every claim now matches what the code does today.
The real data infrastructure (a daily FX-history append and CI) is PROC-2, a later leg.

**CALC-6 — the rate-history page described three different systems, one of them fiction.**
It promised *"30 and 90 days, the real recorded rates, updated daily"* and a
*"30/90-Day & 1-Year History"* title, offered a *"6-month"* window that does not exist, and carried
two FAQ answers describing a **server-side dataset that does not exist** — while its own receipt read
**"0 points on this device"**. The mechanism is genuinely device-local: the browser fetches the rate
on each visit and stores dated points in `localStorage`. A 12-month window therefore takes about a
year of daily visits from the same device.
Both server-dataset FAQs are **deleted**, not softened. The honest one now states the consequence
plainly instead of hiding it: the chart starts empty, fills one point per day as you visit, and
**lives on this device — it does not follow you to a new phone, another browser or a private window.**
The title, the badge, the disclaimer and the hub card copy all say the same thing now.

**CALC-7 — the tools hub claimed *"updated automatically so it never goes stale"*.**
False for the comparison tables, which are hand-kept snapshots. It now says the exchange rates
refresh on every build and again in your browser, while the comparison tables are checked by hand and
each row shows the date it was verified. Counted on the served hub: `never goes stale` = 0,
`always updated` = 0, `updated automatically` = 0.

**CALC-7 — per-row provenance.** The comparator showed one page-level month ("verified September
2026"). It now shows **`verified Sep 2026` on every row**, in the bar note and a new table column.
`sourceUrl` is deliberately left empty on all ten rows: `PENDING-WORK` R19 records 8 of the 10 rates
as UNVERIFIED, so naming a provider deep link would have been an invented citation. Every row carries
the month the data already claimed; no date was invented. The provenance rides a map beside the data
rather than new fields on the rows, because `savings_rate_data` is a vectors-oracle vector and
mutating the row objects would have failed the parity gate on a pure-metadata change — and
hand-editing the oracle to match would have inverted the gate's purpose.

**CALC-8 partial — the converter's automation FAQ invented a cache.** It claimed the rate was
*"cached for thirty minutes"*. **There is no cache anywhere in the code.** The real mechanism is both
stages, verified by reading `scripts/fetch-snapshot.mjs` and the compiled bundle: the page is built
from a snapshot taken at build time and stamped with the feed's own update time, and on every visit
the browser re-fetches the same feed and swaps the live rate in with an 8s abort. A failed fetch
leaves the snapshot in place and labels it, never pretending stale is live. The FAQ now describes
exactly that.

**A second false claim on the same page, caught and fixed by the Manager after hand-off.** The
converter's other FAQ asserted *"Static pages cannot call the rate feed at build time and stay
fresh"* — which is false in this very repo: `fetch-snapshot.mjs` is step 1 of `npm run build`. A
worker left it as "outside scope", but a false claim I have personally verified is not something to
ship past. Rewritten to describe what actually happens.

**HELD, and deliberately not "tidied":** CALC-7's inconsistent headline basis (Kuda 12% against its
own note "up to 16%, flex ~8%"; bank FD 12% against "Zenith 7–11%, Access 7–10%"; PiggyVest 18.5% as
a maximum) and the NDIC ₦5m wording — both unverified, and picking a rule would give unverified
numbers a confident frame. All three contradictions are quoted in the audit; **zero rate figures were
changed.**

Gates 6/6 (article 147/147, vectors 95/95; footer 64, homepage 128), 79 pages, suite 128/0/7.

## [0.7.45] — 2026-10-09 — copy truth pass (audit Appendix A step 1)
King's audit, six copy/data items. Every legal fact independently verified by me against the
**official Nigeria Revenue Service Act PDF** and PwC before any copy was touched — a YMYL site does
not get its tax law from a secondhand claim.

**SITE-1 — the footer put a URL after a copyright symbol.** Live it read
`© 2026 https://godschi10.github.io, Gwill Chijioke`, and at launch it would have read
`© 2026 https://gwillchijioke.com`. The port deliberately reproduces WP's `home_url()` so a migrated
site shows its new domain — sensible for a *link*, wrong for a *copyright holder*. Now
`© 2026 GWill Finance, Gwill Chijioke`; the "Designed & built by G-will Chijioke" credit is untouched.
**The gate that pinned this was fixed with it**: `check-footer-fidelity.mjs` asserted
"copyright line is the site host, like WP home_url()", so the bug was protected. Both the assertion
and its reason now recorded in the gate file — and it was negatively proven (re-pinning the old
string turns the gate red).

**CALC-2 — the tax FAQ claimed the old bands win "from around ₦400k/mo".** They don't. The winner
flips four times: new below ~₦150k, old ~₦150.5k–₦215k, new ~₦215k–₦324.5k, **old ~₦325k–₦535k**,
new up to ~₦1.285m, and old again above. The audit's replacement copy is shipped verbatim — it names
the ₦325k–₦535k window, the ~₦1,000 peak and the high-earner reversal.

**CALC-3a — "Is this the official FIRS figure?"** FIRS was replaced by the **Nigeria Revenue Service**
on 1 January 2026 under the NRS (Establishment) Act 2025. Confirmed on nrs.gov.ng and in the Act
itself. Heading now names the NRS; the answer is unchanged.

**CALC-3b — "NTA 2026" does not exist.** The Act's own text: *"This Act may be cited as the Nigeria
Tax Act, 2025 and shall come into effect on the first day of January, 2026."* All three real
occurrences fixed (`grep -rn "NTA 2026" src/` is now empty).

**SITE-2 — the home stat advertised 16 calculators for 15.** The count came from a directory scan
that still includes `budget-allocator`, which the King merged into 50-30-20 and whose URL is now only
a pointer. It now comes from the same `TOOL_MANIFEST` the tool hub renders, so the number and the
listing can't drift apart again — with the reason recorded, because the directory scan *looked* right.

**SITE-2 — "In-depth guides"** became **"Guides"**. A derived count was considered and rejected: the
only length field is a hand-authored `readMins` that disagrees with the posts' own word counts
(7 min on 316 words, 11 min on 355, 2 min on 482), so any threshold would have been invented. Better
an honest plain word than a confident false number.

**HELD, not touched — CALC-3c/d/e (pension base, NHF cap, minimum-wage exemption).** The audit's own
confidence is `[Likely]`/`[Guessing]` and it records that the sources conflict. Rewriting legal claims
on a YMYL site from a guess is worse than leaving them. Awaiting the King's word.

Gates 6/6 (article 147/147, vectors 95/95; footer 64 checks, homepage 128), 79 pages, suite 128/0/7.

## [0.7.44] — 2026-10-09 — CALC-1: "Months to finish" now measures against the finish line the page promised

**The definition changed.** `months_to_reach` in the emergency-fund engine no
longer answers *gap ÷ monthly saving* — the flat-price question. It answers the
question the page's own copy asks: how long to reach the **inflation-adjusted
finish line**, which moves while you save. On the seed (₦150,000 essentials,
₦450,000 saved, ₦80,000/month, 6 months' cover, 24%) that is **about 7.2
months**, not 5.6. At the 5.6-month horizon the real target is ₦995,483, so a
visitor who planned on 5.6 was about 1.5 months short of six months' cover.

**Why.** CALC-1 in the King's audit (2026-10-08). The page told the reader *"the
real target is the inflated finish line — the one to measure against"* and then
printed a number measured against the nominal target. v0.7.38 fixed the other
half of the same line — the whole target was being divided by the monthly rate,
so `saved` was ignored; that fix survives unchanged.

**What the row shows now.** Both figures, each named for what it is:

    Months to finish      about 7.2
    at 24% inflation · 5.6 months if prices stood still

The real answer carries "about" (it is a projection over the inflation you
typed); the flat-price figure is exact division and does not. The nominal number
is not hidden — it is informative — but it can no longer be misread as the
finish.

**New engine field: `never` (boolean).** The fund can never reach the inflated
finish line when inflation takes more each month than the visitor puts in. The
audit's reference implementation returned `Infinity` there; PHP cannot
`json_encode` INF and the vectors oracle is JSON, so the engine carries the fact
as a boolean instead and the page renders real words:
*"your saving doesn't catch up with inflation at this rate."* Nothing prints
`Infinity`, `NaN`, or `-0`. `months_to_reach` is `0` with `never: true`, which
keeps the derived horizon fields (`years_to_reach`, `future_essentials`,
`real_target`) finite and leaves the pre-existing "no monthly saving" convention
(0 months) untouched.

**The audit's loop was wrong and was not copied.** Its `while (n < 1200 …) n += 1`
walk cannot tell "never" from "slow": at zero inflation a plan that needs 1,401
months is entirely legitimate and it would have reported `Infinity` for it, after
walking 1,200 iterations to get there. Replaced with an exact constant-time
solve: with `g = 1 + inflation` and `f(n) = saved + monthly·n − target·g^(n/12)`
(concave: rises, peaks, then falls to −∞), the finish line gains
`drag0 = target·ln(g)/12` in month one and that only grows, so
`monthly ≤ drag0` means never; otherwise `f` peaks at
`nPeak = 12·ln(monthly/drag0)/ln(g)`, any crossing is bounded above by
`nHigh = 12/ln(g) − saved/monthly`, and a crossing exists **iff** `nPeak ≥ nHigh`
— then it lies in `[(target−saved)/monthly, nHigh]` and is found by bisection to
full double precision. It returns the audit's 7.17 on the seed, and it correctly
returns 6,000 months for a zero-inflation plan that genuinely needs 6,000.

**PHP was fixed first, exactly as v0.7.38 did.** `inc/emergency-fund.php` carries
the identical definition, so the port never diverged from its source of truth.
One further PHP fix came out of the parity proof: the 50-year cap on
`years_to_reach` existed only in TS, so for any horizon over 50 years the two
engines disagreed (`real_target` ₦Infinity in the theme). The cap is now in PHP.

**Oracle.** `scripts/php-harness/vectors.json` was regenerated by **running**
`php scripts/php-harness/vectors.php` (never hand-edited). Exactly two vectors
moved, both emergency, both downstream of the changed line:

| vector | before | after |
|---|---|---|
| `emergency_seed.months_to_reach` | 5.625 | 6.861037939217053 |
| `emergency_seed.years_to_reach` | 0.46875 | 0.5717531616014211 |
| `emergency_seed.future_essentials` | 163383.2264486119 | 166480.5058562274 |
| `emergency_seed.real_target` | 980299.3586916714 | 998883.0351373644 |
| `emergency_seed.never` | — | false |
| `emergency_nosave.never` | — | true |

The old `monthsToReach` vector (5.625) is **superseded**: it is the answer to a
different question, and it still appears on the page under its own name ("if
prices stood still"). `emergency_nosave` keeps every value it had — 0 months,
real target ₦1,200,000 — and only gains `never: true`.

**Oracle regeneration clock.** `gwill_fx_history_range()` windows on the real
clock, so a regeneration on 2026-10-09 moves `fxhist_range90_count` from 60 to 59
(next vector released on 2026-10-08) — calendar drift, nothing to do with CALC-1.
The gate pins `HIST_ORACLE_MS` to the generation instant and this leg may not
edit the gate, so the generator was run with its clock pinned to the same instant
(`php -d date.timezone=Pacific/Midway`), which reproduces 60/0 exactly. The
result is that the ONLY movement in the regenerated oracle is the emergency-fund
change above. The next person to regenerate at the real clock must bump
`HIST_ORACLE_MS` in `vectors-check.mjs` in the same change (README, "The PHP
oracle", consequence 1).

**v0.7.38 behaviour preserved.** `saved >= target` still prints *"done — target
reached"*, and the two answers agree: a fully-funded fund is finished, not "more
months" — the months row shows no figure and no note in that state. `gap`,
`progress_pct` and `runway_now` are unchanged in meaning.

Gates 6/6 (article 147/147, vectors 95/95), 79 pages, suite 128/0/7 green.

## [0.7.44] — 2026-10-09 — CALC-1: emergency-fund months-to-finish keeps its own promise
**King's audit (`~/work/finance-astro-audit-2026-10-08.md`), first item on the list. Manager-verified
on live bytes before anything was ordered.**

The page promised *"the real target is the inflated finish line — the one to measure against"* and
*"the real target prices your essentials at the inflation you set, so the fund still covers six months
when you finish it."* It then answered **`gap ÷ monthly saving`** — measured against the **nominal**
₦900,000 target, the exact thing it had just told the visitor not to measure against. On the seed
that printed **5.6 months** while the inflation-adjusted finish line is not reached until **month 8**;
a user who trusted it planned about a month and a half short.

A parity oracle cannot see this. The PHP engine carried the same definition, so both stayed green
while the page contradicted itself.

**Fixed PHP-first** (`inc/emergency-fund.php`, theme `2e2cd6e`), exactly as v0.7.38 did, so the port
never diverged from its source of truth. Months-to-finish now solves
`saved + monthly·n = target·(1+i)^(n/12)` — the finish line moves while you save, so the answer has
to chase it.

**The audit's own reference implementation was wrong, and it was not used.** Its `n < 1200` walk
returns `Infinity` for a perfectly legitimate 6,000-month plan (₦6,000,000 target, ₦1,000/mo saved,
0% inflation) — it conflates *never* with *slow*. Replaced with an exact constant-time solve:
`f(n) = saved + monthly·n − target·g^(n/12)` is concave, so a crossing exists iff `nPeak ≥ nHigh`,
and then lies in a bracket on which `f` is monotonic — bisected to full double precision.
"never" is carried as a boolean rather than `Infinity`, because the vectors oracle is JSON and PHP
cannot `json_encode` INF.

**A second divergence this proof exposed:** the 50-year cap on `years_to_reach` existed only in the
TypeScript port, so any horizon over 50 years made the two engines disagree and the theme could
print a `real_target` of `Infinity`. The cap is now in PHP as well. PHP and TS agree to 6dp across
every case tested, including inflation of 0%, 100%, and a ₦9bn-essentials absurd input.

**The row now names both answers, and never lets the comfortable one pass as the work being done:**
> `about 7.2` — *"at 24% inflation · 5.6 months if prices stood still"* — `real (inflated) target ₦1,023,391`

₦1,023,391 is exactly `450,000 + 80,000 × 7.167`: the finish line and the answer are the same
number, which is the whole point. The projection carries "about"; the flat-price division does not.

**Edges kept honest:** already funded → `done — target reached` (v0.7.38 behaviour survives); no
monthly saving → `— (save something monthly)`; saving that can never outrun inflation →
`never` + *"your saving doesn't catch up with inflation at this rate"* — never `Infinity`, `NaN` or
`-0`; gap that closes then reopens → the same honest words; absurd inputs → the existing rail.

**Oracle: regenerated by running PHP, never hand-edited.** Exactly four fields moved, all in
`emergency_seed` and all downstream of this line (months_to_reach 5.625 → 6.861038, plus
years_to_reach, future_essentials, real_target), and two `never` flags were added. Nothing else in
the 95 vectors moved. The generator's clock had to be pinned to the gate's own `HIST_ORACLE_MS`
instant to keep the unconnected fx-history window from drifting in the same regeneration; that
consequence is recorded here rather than left as a surprise for the next person who regenerates.

Gates 6/6 (article 147/147, vectors 95/95), 79 pages, suite 128/0/7 green.

## [0.7.43] — 2026-10-09 — housekeeping: remove committed scratch (foreman + tautology test)
King: "make a list of everything left to do then attack this first". First item on that list.

The repo carried scratch committed into `d582a25` (v0.7.31) that was never ours to keep:
- `.foreman/` — 21 files of foreman scratch: `PROTOCOL.md`, `events.jsonl`, `foreman.json`,
  `state.json`, and four `runs/T00{1,2}/run-*/` transcripts plus their tickets. Nothing in
  `src/` or `scripts/` reads `.foreman/`, and it was never gitignored, so it sat tracked
  in the working tree of every clone.
- `test/hello.test.js` — `assert.strictEqual('hello', 'hello')`. A tautology. Passing.
- the `"test": "node --test test/**/*.test.js"` script, whose only test was that tautology,
  so `npm test` could show green while asserting nothing at all.

`npm run test:calc` (the real suite) never read `test/`, so this changes no behaviour. It
removes 22 tracked files and two package.json entries.

The foreman integration itself is verified working and stays installed separately at
`~/.config/opencode/skills/gwill/foreman-integration/`; only the per-run scratch goes.

Gates 6/6 (article 147/147, vectors 95/95), 79 pages, suite 128/0/7 green — unchanged.

## [0.7.42] — 2026-10-09 — 50-30-20 E14: a near-miss number no longer prices your month
A14 audited the crash path and found a defect nobody had looked for: the junk rail
was blind to the most plausible typo on the page.

**A trailing comma.** Typing `250,` into monthly income — a fat-finger, since comma
is the thousands separator — was read as **₦250**, and the page then printed
*"Plan now: ₦125 needs · ₦75 wants · ₦50 savings"* and *"AHEAD — Our example puts
₦39,950 extra to savings"*. A 1000× wrong plan, delivered with total confidence,
with **no rail**, because `,` is legal in the money alphabet so the input looked
well-formed by the page's own test.

Fixed at the page level, since `pm()` is the fleet's shared reader and off-limits:
`malformedOf()` gains a `separator` kind from a new `misplacedComma()` predicate,
routed through the same `#bg-junk` rail with the same voice — *"the comma in there
is not a thousands separator (one sits between three-digit groups), so it was
dropped and the box was read as ₦250."* The plan, the three "left" rows, the live
and mini lines, step-2 buckets, mirror panel, verdict, CTAs and clipboard all
withhold together, and the verdict reads CANNOT SCORE.

**A bare comma** — `,` — withholds every figure correctly but left
`#bg-whatnow` printing *"needs and wants ₦185,000 over"*: invented figures on a
page where the plan is officially absent. Same predicate now closes it.

**Actuals.** Negatives were silently clamped to ₦0 and shown as "you entered ₦0";
they now leave the bucket **unscored** — a different truth, in the labels' own
words, naming the field. Spending and shares no longer share one blanket sentence
either: shares clamp and say so, spends stay unscored.

**No false positives**, which is the part that could have gone wrong: `250000`,
`₦1,500,000`, `1 234`, `1,234.50`, `007`, `1e5`, `+500`, `8.5%`, `0` are all
accepted as they parse today, and `1,500,000` prices ₦750,000/₦450,000/₦300,000.
`250,000` is accepted; `1,2,3`, `250,,000`, `,500`, `1,5000`, `12,34` are caught.

Two honest corrections to the audit, recorded rather than smoothed over: its
"actuals swallow all junk" claim was wrong for `abc`, `.` and `12.5.5`, which
already fired under E13; and the multi-tab lost write is plain last-write-wins
localStorage, accepted as browser semantics with no storage locking added.

Gates 6/6 (article 147/147, vectors 95/95), 79 pages, suite 128/0/7 green.

## [0.7.41] — 2026-10-08 — 50-30-20 E13: malformed input can no longer price a month
A13 claimed four CRITICALs; the Manager re-proved on live bytes and **three were
false** (a striking lesson in never shipping an auditor's unverified claim): both
Clear buttons work, and the seed disclosure fires. The one TRUE critical stood:
**zero input validation.**

`12.5.5` typed into income sat verbatim in the field while `pm()` read ₦0, and the
page then printed *"AHEAD — Our example puts ₦40,000 extra to savings"* — a verdict
about a figure that does not exist. `1e9` and `abc` were equally silent.

New rails, each naming its field and routing the visitor to it:
- **`#bg-junk` / `#al-junk`** — malformed input, split into two honest shapes
  because the page does two different things: "12.5.5" is in the money alphabet
  but not a number (reads ₦0, and the rail says so), "abc" is outside it (reads
  as never-entered, and the rail says that instead).
- **`#bg-range`** — a share outside 0–100, the range itself being the only fact.
- **`#bg-big`** — implausible magnitude, reusing the page's own ₦100M threshold and
  the salary-tax voice, now over income and the step-1 spends too. No invented
  salary benchmark; magnitude is the whole signal.
- **`#al-verdict`** — CANNOT SCORE, replacing every bogus verdict the moment a
  feeding field is unreadable.

False positives were tested for, not assumed: `₦1,234.50`, `1 234 500`, `8.5%`,
`007`, `1e5`, `+500`, `12.5e-3`, `.` and blank all stay silent.

**Manager follow-up, closing the boundary the leg logged rather than hid.** With
"12.5.5" in income the three receipt rows still printed *"Needs left −₦120,000"*
and the advice line still said *"needs and wants ₦185,000 over — spend less
there"* — confident numbers in the visitor's voice, derived from nothing. Both now
withhold on exactly the verdict's own predicate and print "—". Valid input
restores the real figures; proven false-positive-free on the clean seed.

Gates 6/6 (article 147/147, vectors 95/95), 79 pages, suite 128/0/7 green.

## [0.7.40] — 2026-10-08 — 50-30-20 E12: every named problem now offers a real action
A12 (next-action clarity) found the verdict's ownership gating was clean — one
auditor claim did not reproduce — but nine "problem named, no action offered"
spots. All closed.

- **"Splits at 115% → Rebalance to 100%"** overpromised — it only scrolled. Now
  honestly reads "→ Adjust splits to 100%".
- **"Fix rent overage"** always named rent regardless of which bucket overshot.
  Now it names the bucket that actually deviates most and routes to it; when none
  dominates it says "Adjust shares to fit your needs" and invents no field.
- **Reconcile mismatch** named the fix but offered no way to reach it. The line
  now carries a real button to the first empty bucket's actual field.
- **Absurd-figure rail** said "double-check" but not which field. Now it names
  the offending field and adds a Fix chip that routes to it.
- **NEEDS OVER advice was generic.** Now carries size plus a derived fix from
  their numbers: "cut about ₦75,000…, or raise Needs % from 50% to 80%."
- **Silence at a clean month** is a dead end. The banner now says so and names
  Savings Goal Calculator as the next destination; it does not manufacture a problem.
- **"ON PLAN"** had no closing note; "ON PLAN on all 5" now closes with a real next step.
- **Two variance definitions** (mirror "what you spent" vs foot "what you entered")
  settled to one — "what you entered", because the user types a figure, it is not
  already theirs.
- **Actuals forgot their data** whilst the page claimed a save. They now persist,
  restore with a Last Used pill, and are honestly wiped by Reset/Clear/footer.
- **Actuals had zero affordances.** Five `Use plan — rent/food/transport/data/bills`
  chips now write that bucket's live plan and raise the same disclosure as the
  step-1 fill chips; blank income still fires the disclosure, never a fake pill.

The verdict banner's ownership gating was left untouched: the audit's contrary
claim did not reproduce, and the Manager verified the banner reads "Our example…"
about seed numbers.

Gates 6/6 (article 147/147, vectors 95/95), 79 pages, suite 128/0/7 green.

## [0.7.39] — 2026-10-08 — 50-30-20 E11: honesty sweep after A11 FAIL
A11 found E10 regression clean (11/11) but 9 dishonest sentences. E10's repair
opened a fabrication of its own; this round closes it and three false claims.

**The CRITICAL (Manager-confirmed live before ordering).** The disclosure for
"we just wrote a plan figure into a spend field" existed — but was bound to ONE of
the two controls that perform the write. The `.offer [data-use]` rail disclosed.
The three `Use my targets` chips wrote the same plan into the same fields
SILENTLY: one tap put ₦125,000 into "Spent on needs", left "Needs left" at ₦0 as
if the visitor had simply spent exactly their target, and printed "within plan"
for a month nobody lived. Now both paths call one `disclosePlanWrite()`, so there
is one voice for one fact. The call sits AFTER the `dispatchEvent` on purpose:
the dispatch is synchronous and the bg-spn input listener lifts the note in the
same tick, so disclosing first would be undone instantly.

**Three false claims corrected.** "Leave the rest blank and they print no figure"
was untrue twice — a blank bucket still prints its plan amount. "Variance = your
figure" and "Variance = what you actually spent" were two definitions of one term
40px apart; now one. "you spent ₦X" became "you entered ₦X", which is what the
user did.

**New feature, the one A11 called a real gap.** Nothing reconciled the aggregate
needs spend against the scored buckets: ₦150,000 sat beside ₦80,000 of buckets
with the contradiction never mentioned. `#al-reconcile` now names the gap and
asks which side is wrong. It refuses to compare absurd figures, reusing the
page's existing too-large vocabulary, because a single stray keystroke otherwise
became a confident statement about a ₦12.5bn gap.

Two of those bugs were caught by calc-regress and not by eye — the line first
printed "the buckets are missing −₦1,696,968", and rails then rejected it as a
bare naira assertion because it never asked for anything. Both fixed; the line
now asks instead of reporting.

Gates 6/6 (article 147/147, vectors 95/95), 79 pages, suite 128/0/7 green.

## [0.7.38] — 2026-10-08 — C1: emergency-fund months-to-finish honours `saved`
King: "do the best recommendation" — fix the bug properly, PHP-first, no shortcuts.

**The bug.** `months_to_reach` divided the whole target by the monthly saving
rate, so it was mathematically independent of what the visitor had already put
away. `gap` was computed three lines below and ignored. Live proof on the seed
(essentials ₦150,000 / saved ₦450,000 / ₦80,000 a month): the receipt showed
**gap ₦0, a 100% bar, and still "11.3 months to reach."** A fully-funded user was
told they had 11 more months to go.

**Fixed in the required order, so the port never diverged:**
1. `inc/emergency-fund.php` — the PHP source of truth, first (theme repo `12bf9ea`).
2. `scripts/php-harness/vectors.php` — the oracle generator pointed at
   `/home/ubuntu/gwill-finance-theme/inc/`, a path from another machine, so it
   died on `require_once` and the oracle could not be regenerated AT ALL. That
   was the real reason C1 sat unfixed. Now `GWILL_INC`-overridable with
   auto-detection.
3. **Regenerated `vectors.json` by running PHP — never hand-edited.** Exactly
   four fields moved, all in `emergency_seed`, all downstream of the fix
   (months_to_reach 11.25 -> 5.625, plus years_to_reach, future_essentials and
   real_target). No other vector moved — proof the regeneration was surgical.
   Regeneration verified idempotent.
4. `scripts/vectors-check.mjs` — `HIST_ORACLE_MS` re-pinned to the generation
   instant, as that gate's own comment requires.
5. `src/lib/emergency.ts` — the port, following PHP.

Clamped twice in both languages: `max(0, target - saved)` so oversaving reads 0
and never negative; `monthlySave > 0` unchanged. PHP and TS agree to 6dp on five
cases including both clamp edges.

**Follow-on honesty defect found and fixed in the same round (Manager-caught).**
Fixing the maths made a THIRD zero case reachable — a closed gap — and the page
had no honest wording for it, so a fully-funded user was told "— (save something
monthly)": an instruction to change the one input they had nothing wrong with.
The three zero cases are three different facts and only one is advice:
gap closed → "done — target reached"; no cover asked → "0.0 (no cover asked
for)"; no monthly saving → the dash.

Gates 6/6 (article 147/147, vectors 95/95), 79 pages, suite 128/0/7 green.

## [0.7.37] — 2026-10-08 — 50-30-20 E10: honesty restoration (A10 FAIL fixed)
A10 milestone audit returned FAIL with two trust CRITICALs. Both fixed.

**The mirror measured nothing.** E9 computed each bucket's "actual" by rescaling
one aggregate: `actualAmt = planAmt/needs × spent`, so `variance = planAmt ×
(spent/needs − 1)` and sign(variance) = sign(spent − needs) for every bucket.
Five badges could never disagree, and the page asserted a ₦48,000 rent the user
never entered; there were zero per-bucket actual inputs on the page. Now five
optional `al-act-*` naira inputs ship EMPTY, `variance = actual − plan` per
bucket, blank = unknown prints no figure and no badge, and the fabricated
rescaling is deleted with no fallback.

**The page deleted its own safety disclosure.** `#al-actuals` held the honesty
sentence at `:419` and was overwritten by `innerHTML` at `:522`. The disclosure
now lives in `#al-mirror-own`, which nothing else writes, with the Example badge
riding inside the panel so ownership travels with the numbers.

The verdict banner no longer says "You're…" about seed figures on cold load. Also
repaired: both dead jargon glosses as visible labels; dark `--action` contrast
2.77:1 → 6.45:1; mirror panel heading; in-card Clear at a 44px target (the shell
pair untouched); allocator sum printed; theme token replaces hardcoded `#e8e4dc`.
Manager-caught: `clearExamples()` only walks `.field[data-sd]` so the unseeded
`al-act-*` fields survived Clear — a silent half-reset. Both exits wipe them now.

Gates 6/6, 79 pages, suite 128/0/7 green.

## [0.7.36] — 2026-10-08 — 50-30-20 E9: actuals mirror, verdicts, next actions, jargon
Shipped — but later AUDITED AND CORRECTED in 0.7.37: its "actuals mirror" never
measured anything real, and the correction is recorded there in full. Kept here
because the round genuinely shipped, and because deleting a shipped round from
the record would be exactly the kind of tidy history this changelog exists to
prevent.

## [0.7.35] — 2026-10-08 — 50-30-20 E8: stepper, active chips, gated fill, apply defaults
Visual stepper ("1. Plan" / "2. Itemise"), split-chip active state, fill-from-plan
gating with `aria-disabled`, and an "Apply defaults" button restoring the
allocator 40/25/15/10/7. A10 later rated E8 the second-highest regression risk
(4/5) for the stepper's second-person claims before badges existed.

## [0.7.34] — 2026-10-08 — 50-30-20 E7: mobile quick-fill + keystroke reduction
Income quick-fill chips (₦70k–₦500k), split presets (50/30/20, 60/20/20,
70/15/15), "Fill from plan" for the three actuals, button heights ≥44px, a sticky
Step 2 anchor, and autocomplete attributes across the calculator fields.

## [0.7.21] — 2026-10-05 — Architecture close-out: the four parked findings
King: "Fix all findings before we move on to the next one."

- **The stylesheet split, measured rather than assumed.** The audit said every
  page shipped the whole theme stylesheet; @builder built a ground-truth matrix
  of "classes defined per sheet × classes rendered per built page" and found
  **13 of 14 sheets are genuinely consumed by every page** — home.css,
  article.css, pages.css, search404.css, tools.css and hub.css all render
  vocabulary on every archive, tool and legal page. Only `r7.css` (the R7
  featured-stamp layer, every selector `.feat`-scoped) is genuinely
  homepage-only, so it alone moved to the page that renders it. Result: every
  non-homepage page ships **856 bytes less CSS**, the homepage is unchanged
  (+1 B, the `<style>` wrapper moving). Zero rule edits — `git diff src/styles/`
  is empty — and visual parity proven by computed-style comparison plus pixel
  diffs inside run-to-run noise (0.75%, confined to the live ticker marquee).
- **One archive, one door.** `/category/fixed-income/` is now canonical; the
  nested `/category/investing/fixed-income/` is a 652-byte canonical pointer
  instead of 181KB of duplicate archive HTML. Chosen on evidence: 26 distinct
  entry points already build the flat shape from the shared category list, and
  the nested href is pinned by the header gate. One door, no duplicate content.
- **The orphaned year archives are now reachable.** A footer **Archive** block
  (both footers, matching the footer's own link idiom, zero CSS, zero gates)
  exposes all 11 date routes — years and months, both previously unreachable.
  They were kept, not deleted: they are WordPress-faithful, fully populated, and
  the site's only chronological index.
- **The tool manifest.** One list of 16 tools now drives the hub page and the
  per-tool share card; the 16 duplicated `ogImage` props are gone. Measured
  honestly: only 2 of 16 props were real identity duplication (12.8% of lines) —
  the other 87% is ported WordPress copy with citations, which stays where it
  is. Meta parity proven byte-identical on 16/16 tool pages and 10/10 amount
  pages.

## [0.7.20] — 2026-10-05 — Smart fields: the fleet stops pretending it filled them in
King: *"I want fields like these to change dynamic and be smart… all my
calcutors have no ux plan at all, they don't actually find out how user would use
the product and be amazed and keep coming back."*

- **The real defect was honesty, not staticness.** Every calculator baked a
  seed value, so a first-timer saw a full ₦250,000 receipt he never entered.
  Now every non-user number wears a gold `SAMPLE` tag with a dashed rule, and
  the moment he types in a field that tag disappears — the field becomes his.
- **Three states, one law:** `SAMPLE` (gold = ours) · `LAST USED` (neutral,
  dated = his) · plain (his, no badge). Gold never means "yours".
- **`Clear examples`** empties every worked example in one tap and hands the
  receipt an honest empty state: the shape stays, the figures show `—` in dim
  ink. No confident gold ₦0 — a zero nobody entered is not a result.
- **₦ fields work properly now:** 57 fields converted from `type=number` to
  `type=text` + `inputmode` (63 minus 6 genuine integer counts), with the
  recovered in-field ₦ symbol, blur-time comma grouping and a tolerant parser
  that reads `"1,234.5"`, `"₦1,234.50"` and `""` correctly. `type=number` was
  silently rounding large values in Safari and exponentiating them in Chrome.
- **Memory:** the last numbers he used are restored, dated and badged neutrally
  — rent and gross never restore, because a stale rent silently moves a
  take-home claim.
- **Sourced context lines only:** Guardian median pay, NBS 15.39% inflation,
  the ₦70,000 statutory minimum wage — each with a "read the source" link. Two
  context lines were DROPPED because no citable source existed; a statistic with
  no source does not ship.
- **A real bug fixed:** the calculator receipt hardcoded `#0d0b08`, identical
  to the page background in dark mode, so the card dissolved into the page.
- Proofs: 79 pages; 6/6 gates (article 147/147, vectors 95/95); live probes on
  4 tools x 2 themes x 4 interactions; +1,338 B per page average, one shared
  8KB chunk per session — inside the 3KB budget.

## [0.7.19] — 2026-10-04 — The real logo on every card, and the controls I left raw
King rejected v0.7.18: "These are not my logos… og image doesn't have a single
place with my finance blog actual logo" + "why is the check box in the calculator
unstyled… there are plenty unstyled elements u added to calculators."

- **The logo.** I had invented a `#`-in-a-plate mark. His real lockup was in
  the repo the whole time (`Layout.astro:552`, `header.css:70-92`): `₦` in gold
  + `gwillchijioke` in ink + the gold→green underline. All 34 cards now carry
  that exact lockup; the invented plate is gone from source. The ₦ is typeset
  after proving the bake face renders it as a real glyph (not tofu).
- **The unstyled sweep.** My own class-vs-stylesheet diff found the rest of
  what he suspected: `.tool-h2` (11 uses, 8 pages, styled nowhere) now carries
  the tool heading scale; `.tool-faq` proven dead and removed. The 80+ unclassed
  number inputs were proven NOT defects (styled via `.field` descendants).
- **The checkbox** is now `.tgl`, a gold switch in the site's own vocabulary:
  44px target, gold focus ring in both themes, behaviour unchanged.
- **A wrong glyph swap** printed "N50k" on one card — removed; the real ₦ bakes.
- Proofs: 79 pages; 6/6 (article 147/147, vectors 95/95); 0 tofu across 74
  codepoints in all 34 cards; brand card gold 4,235px.

## [0.7.18] — 2026-10-04 — Premium OG cards: 34 brand-true share images
King: *"the og image is looking like shit… use our logo and all that and design
a premium OG image… all the pictures and brand files are made SVG logo."*

- **Root cause, found before designing:** the shipped card was 1200×**675** with
  a clipped calculator screenshot (not a brand card) and the wrong height baked
  into `og:image:height`. Two facts forced the design: the shipped JetBrains Mono
  subset has **no ₦ glyph** (U+20A6 missing → the mark is 4 SVG rects, never
  text), and the 7 category art files each carry a stale `₦ gwillchijioke`
  wordmark plus 7 files cover 15 articles → article art is **not** overlaid.
- **Design (@designer, coordinate contract + 3 rendered proofs):** dark ink
  ground (gold-on-ink 9.15:1 vs 3.4:1 on cream — cream vanishes in a WhatsApp
  bubble), 1200×630, footer baseline 524 (clear of the Twitter bottom-10%
  crop), 168px mark on the brand card / 64px elsewhere, dot-grid + gold glow
  ported from the site's own hero CSS, 88×4 gold rule, category-coloured chip.
- **Generator (@builder):** `scripts/og-card.mjs` + `scripts/gen-og.mjs` as the
  first build step — 34 cards (brand, 16 tools + hub + amount family, 15
  articles), idempotent, rsvg stdin, output gitignored. Brand card is
  **byte-identical** to the designer's proof.
- **Wiring:** ToolShell now forwards `ogImage` (26 tool pages were falling back
  to the brand card); article pages point at their own card; `BRAND_SHARE`
  height 675→630; the orphaned `gwill-social-share.png` deleted behind a
  zero-reference gate.
- **Proofs:** 79 pages; 6/6 gates (article 147/147, vectors 95/95); meta census
  reconciles (37 brand + 27 tool + 15 article, one og:image per page, zero old
  refs); 34/34 PNGs present; PIL: 1200×630, gold present, **0 bright pixels in
  the bottom 10%**, 80px margins.

## [0.7.17] — 2026-10-04 — Architecture audit fixes: the one broken link, concurrent counts, type-checking

- **Author page 2 route added** — `author/[slug]` rendered pagination to a page
  that never existed; every author with >10 posts was serving 404s.
- **Concurrent comment counts:** 15 serial `AbortSignal.timeout(4000)` Worker
  fetches at build → `Promise.allSettled` (route phase 7.16s → 0.9s; worst case
  with a hanging Worker 60s → ~4s).
- **`gwill-forms.js` route-scoped** via a Layout `forms` prop + `FormsScript`
  component (Astro hoists `src` scripts out of expressions — the component
  boundary is the working pattern).
- **Drawer `aria-modal="true"`** (was `false` while scroll-locked + focus-trapped).
- **`/search/` corpus dedupe** — one shared `#gwill-search-index`.
- **tsconfig + `@astrojs/check` + `typescript`** wired (`npm run check:types`);
  the 21-error backlog is reported, not gated.

## [0.7.16] — 2026-10-04 — Calculator correctness mission: every tool audited, proven, fixed
King: 50-30-20 screenshot showed empty % fields computing ₦0·₦0·₦1,000,000
silently. Fix this calculator, research ALL calculators for missing
fields/features/bugs, fix all while respecting UI/UX.

- **50-30-20**: Savings % field added (cleared fields used to zero the buckets
  and hand the full income to savings); trio math literal; sum-honesty note;
  negative leftover honest; zero CSS changes.
- **All tools researched** (3 readers, disjoint sets); worst bugs fixed:
  transfer from-Nigeria non-USD overstated +74.8% GBP / −50.7% CAD → corrected,
  USD legs untouched; allocator silent 3× oversum → warning rail; salary "Best"
  tag lied at ₦500k → crossover-aware; emergency Infinity → clamped + rail;
  NaN/Infinity class + empty/absurd silent zeros closed everywhere with honest
  "Out of range" notes; dividend cash headline labelled; savings-goal cleared
  field no longer reads "goal reached"; compound example + inflation copy
  synced to reality; amount-page blanks/{PARALLEL} removed; Reset on all tools.
- **Verification:** 6/6 gates (article 147/147, vectors 95/95); QA interaction
  proof across 20 components (zero JS errors, no overflow, every fix
  reproduced); v0.7.0 design LOCKED — no visual changes.

## [0.7.15] — 2026-10-04 — Portability fixes: base un-baked, config single-sourced, toolchain pinned
King: *"Fix all findings before we move to the next one"*

- **CRITICAL:** article media fields no longer bake the deploy base — base-less
  frontmatter + render-time prefix; importer emits base-less going forward;
  served bytes byte-identical.
- **Config:** ORIGIN/BASE single-sourced (site.ts → astro.config), SITE_ORIGIN/
  SITE_BASE overrides, trailingSlash trialed and reverted honestly, Worker URL
  one const (CSP stays explicit), MOVE-CHECKLIST.md, ship-pages.sh.
- **Toolchain:** lockfile regen (astro 5.18.2, npm ci works), .nvmrc,
  packageManager, py CWD anchoring. Icons → icon.svg; dead link + Rickroll gone.
- Proofs: build exit 0 / 78 pages; 6/6 (article 147/147, vectors 95/0); QA SHIP —
  images 32/32 200, prefixes exact, og absolute, zero JS errors, zero overflow.

## [0.7.14] — 2026-10-04 — Fingerprint fixes: human comments, human copy, closed escaper hole
King: *"fix all findings from latest audit before we move on to the next"*

- **Comment trims** (zero behavior change): lightbox TOC collapsed + echo banners
  deleted (incl. the one false gallery-skip claim rewritten true), search-core's
  7 name-echo banners deleted, vibe restatements + empty docblock deleted, desk
  banners downgraded.
- **Desk speaks English:** "approveing/spaming/trashing" → explicit verb map;
  past-tense confirmations; token/session/API notes in plain words.
- **Stale stub deleted:** the homepage "not connected" hijack contradicted the
  live list — the form now subscribes via gwill-forms.js like /newsletter/.
- **Seeds unified** to consts; dead guards/ternaries deleted; dividend casts
  removed (`divs: number`); renames (label/labelLower, cur, initialYield,
  payeBands2023 with alias for the gate).
- **escHtml hole closed:** the search escaper was a 4× identity no-op feeding
  innerHTML — now escapes (`&` first); highlight rewritten mark-before-escape
  after probes proved entity shredding. Adversarial-proven, no consumer changes.
- **Microcopy:** server errors in plain words, push/iOS notes fixed, "Questions",
  "today's rates", emoji stripped, 6 tone unifications.
- **5 gate pins updated** with overrides recorded. Proofs: build exit 0 / 78 pages;
  6/6 (article 147/147, vectors 95/0); QA SHIP — strings live in served bytes,
  XSS probe inert, marks intact, zero JS errors, zero overflow.

## [0.7.13] — 2026-10-04 — Cleanup audit fixes: dead code pruned, phantom deps pinned
King: *"Fix all findings before we move to the next."*

- **50 dead rules pruned from tools.css** (−8.8KB) — an abandoned calculator
  vocabulary nothing rendered. tools.css ships globally, so this weight rode
  every page. Live vocabulary (fx-card, receipt-*, bar-*, st-table, tool-h)
  untouched — verified rule by rule.
- **Dead ad/ticker/vibe/micro-orphan rules pruned** (≈−10.6KB more across
  article/home/header/search404/vibe skins). Carve-outs kept honestly: the
  `.ad-slot` base system (article.js queries it), the 4 `.vibe-rx-t-*` rules
  (live via JS composition), all wp-block/align forward-compat styles (the WP
  importer can bring articles carrying any block).
- **Phantom deps pinned:** esbuild + postcss (used by load-bearing gates, missing
  from package.json) added to devDependencies at their locked versions.
- **Hygiene:** tracked zero-width-space file deleted, .gitignore gains .env,
  engines node>=18, 3 gates de-absoluted to fileURLToPath (zero assertions
  touched), dead audit line removed, node: prefixes, 3 unused imports + 5 dead
  exports removed (payeBreakdown proven redundant — the page renders bands
  inline), public/sw.js removed (shipped but never registered; registering
  would be a new feature, not cleanup).
- **Records refreshed:** README (6 gates, 78 pages, fetch-snapshot step, retired
  prose note, real header anchors), TRANSFER layer chain (the King-reverted
  reality), article.css token block (RESOLVED — its own suggested fix is what
  shipped), port-posts.py comment (keep policy).
- **2 gates updated with the override recorded** (same sanctioned pattern as the
  hero CTA and category map): the article byte-pin 40720→38197 (the pin exists
  to force manager review — reviewed), and homepage reduced-motion now asserts
  the invariant (no unguarded animation) instead of pinning a duration value
  that existed only in dead code.
- Proofs: build exit 0 / 78 pages; `npm run check` 6/6 (article 147/147,
  vectors 95/0); QA visual proof — 8 phone pages unchanged (home luminances
  185.3 vs 17.3), converter computes 2500→₦3,325,350, salary bands render,
  comments validation holds with zero POST, ticker paints live figures, zero JS
  errors, zero overflow. Report: ~/work/research-notes/cleanup-proof-qa.md
- Deliberately parked (the King may overrule): tsconfig creation, CI, retention
  of prose.retired/port-posts.py/backup branch, receipt-div/tool-h
  used-but-undefined (pre-existing mirror image).

## [0.7.12] — 2026-10-03 — Every category gets its own brand-matched pill
King: *"savings crypto and dollar account category pill has a custom color
that match the brand. I want others to auto claim a new color on creation so
that all categories have color pill. and make sure which ever color matches
the site brand color palette."*

Before this, savings (green), crypto (purple) and dollar-accounts (gold)
were the ONLY categories with distinct pills — investing shared savings'
green and banking, remittance, budgeting and fixed-income were all grey
slate. After: every category carries its own hue.

- **Five new badge hues** added to article.css in the theme's OWN
  Tailwind-pastel badge vocabulary (`.bpu`/`.bsl` already are Tailwind
  pastels — this extends the theme's pattern rather than inventing a new
  design language): `.bte` teal, `.bbl` blue, `.bcy` cyan, `.bpk` rose,
  `.bin` indigo — light pastel + dark rgba, exactly matching the existing
  light/dark patterns.
- **Five matching chip classes** in home.css (`.db-te/.db-bl/.db-cy/.db-pk/
  .db-in`) so the hero "Topics:" row stays coherent with the cards.
- **New mapping:** investing→teal, banking→blue, remittance→cyan,
  budgeting→rose, fixed-income→indigo. **The King's named three are
  untouched:** savings=green, crypto=purple, dollar-accounts=gold.
  Uncategorized deliberately keeps slate — it is the catch-all, and grey is
  its semantic colour, not a real category's claim.
- **AUTO-CLAIM (the King's core requirement):** `autoClaim(slug)` in
  site.ts — a deterministic djb2 hash over a 9-colour palette (slate last,
  so it is claimed least). `catBySlug`'s unknown-slug fallback now calls it,
  so any category created without an explicit mapping **claims a stable
  colour on creation** — same slug, same colour, forever, across builds.
  Proven: `autoClaim("insurance")` → cyan, `("loans")` → green,
  `("side-hustles")` → purple, deterministic across runs. A category later
  promoted to an explicit CATEGORIES entry should pin its badge+chip.
- **GATE:** the homepage fidelity gate asserted the WP-verbatim mapping
  (investing=bgn, banking/bsl, remittance=bsl, unknown-slug→bsl). Those
  assertions encoded WP fidelity — the live theme still maps them that way
  — and the King has now deliberately overruled that fidelity decision, as
  he did for the hero CTA in v0.7.10. The assertions were UPDATED to expect
  the new mapping with the override, date and his stated reason recorded in
  the gate, and the gate now also asserts budgeting and fixed-income
  explicitly (they had no assertions before) plus the existence of
  autoClaim and the palette arrays. The gate stays live and will catch any
  future drift of this mapping.
- Proofs: build exit 0 / 78 pages; `npm run check` **6/6 green** (article
  147/147, vectors 95/0); dist carries all five new light+dark badge rules
  inlined; new badges verified across dist (bte 29, bbl 27, bcy 16, bpk 7,
  bin 2 across archives and cards); hero chips exactly one of each new
  class; the King's three unchanged in dist; the only remaining `bsl`
  anywhere is the uncategorized archive page.

## [0.7.11] — 2026-10-03 — Security audit fixes: frame-buster, CSP, session-scoped desk token
The 2026-10-03 four-auditor security audit (master report:
`~/work/research-notes/security-audit-MASTER-2026-10-03.md`) found
2 HIGH · 14 MEDIUM · ~20 LOW across this site and its comments Worker.
This release ships the site-side half; the Worker half shipped as
comments-api `cf7ceea` + a full secret rotation the same day.

- **Frame-buster on the /mod/ desk (MEDIUM).** `src/pages/mod.astro:50-59` —
  a synchronous inline script breaks the desk out of any frame before the
  desk markup parses. GitHub Pages cannot set `frame-ancestors` as a header
  and browsers ignore meta-delivered `frame-ancestors`, so this script is
  the REAL control; the meta value ships anyway as defence-in-depth.
  Verified in-browser both directions: no misfire top-level, and a framed
  desk navigates the top window out.
- **Desk token now session-scoped (MEDIUM).** The moderation token moved
  from localStorage to sessionStorage (same key, `gwill-mod-token`), and
  desk boot wipes any legacy localStorage forever-token on every visit.
  UX change the King should know: **the desk now asks for the token once
  per tab session** instead of remembering it forever.
- **Meta CSP (MEDIUM).** `src/layouts/Layout.astro:165` — script/style
  'self' 'unsafe-inline' (Astro inlines both; nonce plumbing is a larger
  change), img-src self + gravatar/ytimg/vimeocdn + data:, connect-src
  self + comments-api + the five FX/crypto APIs, frame-src the three video
  facades, form-action self + comments-api, base-uri 'self',
  object-src 'none'. Every runtime fetch origin in dist is in the policy —
  verified live in-browser with zero blocked resources and the FX ticker
  still populating from all external APIs.
- **`</script>` escaping (LOW).** `VibeComments.astro:356` — the config JSON
  is now serialized with `<` escaped to `\u003c`, same pattern the JSON-LD
  block already uses. Build-time data today; structurally safe forever.
- **Commenter email now session-scoped (LOW).** `vibe-comments.js:2476-2519`
  — the comment form's email field persists to sessionStorage, not
  localStorage (identity is saved on blur, not submit, so clear-after-submit
  would not have worked; session scope does). Display name unchanged.
- **http:// link upgraded (LOW).** `gutenberg-elements-showcase.md:157` —
  `http://finance.gwillchijioke.com` → `https://`. Honest note: the domain
  has no public DNS at all right now (NXDOMAIN), so the link is dead under
  both schemes; https is the only future-correct endpoint.
- **Referrer-Policy (NICE-TO-HAVE).** `Layout.astro:171` —
  `strict-origin-when-cross-origin`, matching the referrerPolicy the site's
  own video facades already use: same-origin referrers kept, cross-origin
  sites get the origin only, never article paths.

Proofs: build exit 0 / 78 pages; `npm run check` 6/6 green (homepage 123,
article 147/147, vectors 95/0); CDP on the live preview — 0 real console
errors across homepage/article/mod, 0 blocked resources, FX ticker live
across all external APIs, 9 comments rendering from the Worker, frame-buster
proven both directions, legacy localStorage token wiped on boot.
The homepage hero's secondary button now routes to the 18 calculators
instead of the apps hub. King: *"that 'Finance Apps' button should be
changed and linked to the finance calculators I feel they will bring more
clicks from my homepage"*, then confirmed *"money calculators I mean"*.

- `src/pages/index.astro:47` — `<a class="bhg" href={`${base}apps/`}>Finance Apps</a>`
  becomes `<a class="bhg" href={`${base}money-tools/`}>Money Calculators</a>`.
  One line. The `.bhg` ghost-button class is untouched, so the button keeps
  its exact appearance; only href and inner text moved.
- Copy reuses existing site vocabulary rather than inventing new wording —
  the `/money-tools/` hub H1 (index.astro:72) and the footer link
  (`src/data/site.ts:121`) are both already "Money Calculators".
- **`/apps/` is NOT orphaned.** It keeps 5 inbound links on the homepage
  (2 in the header mega-menu + 3 in the footer, from `NAV` and
  `FOOTER_GROUPS` in `site.ts`), and both pages serve 200.

**GATE — a deliberate, recorded divergence, not a softened check.**
`scripts/check-homepage-fidelity.mjs:83` asserted the hero's secondary CTA
must target `/apps/` with the copy "Finance Apps". That assertion encodes
WP fidelity: the live WordPress theme routes that button to the apps hub.
Fidelity to WP is the correct default for this port, and it was correct
until today — the King has now deliberately overruled it on conversion
grounds. The assertion was UPDATED to expect `/money-tools/` and its
comment records the override, its date, the King's stated reason, and the
fact that the live theme still sends the CTA to `/apps/`.

This was the only option that keeps the gate meaningful. The alternatives
were rejected deliberately: leaving the gate red would have shipped 5/6 and
trained everyone to ignore red gates (the state in which real bugs hide),
and reverting would have ignored a direct King order. The gate remains
live and will catch any future drift of this CTA away from the new target.

Proofs: build exit 0 / 78 pages; `npm run check` **6/6 green** (homepage
fidelity 123/123, article gate 147/147, vectors 95/0); dist confirms
`class="bhg" href="/finance-astro/money-tools/"` present in `hero-acts`,
the old `/apps/` CTA string absent (0 occurrences), and `/apps/` still
referenced 5 times.

## [0.7.7] — 2026-10-02 — Design Language R7: the featured stamp corner
The featured card's media plate stops being one flat ink field carrying
a lone centred emoji, and becomes a corner-anchored stamp on a framed
band (plan §P0-2 "stamp corner", rung R7 — the work 0.7.6 left open).
ADDITIVE only: one new stylesheet, 78 lines, imported after `chrome.css`
so the cascade reads R1 → … → R6 → R7. `home.css`, `article.css`,
`header.css`, `base.css` and `hub.css` are untouched by design, and
`index.astro:68` was not edited — the homepage fidelity gate asserts
`feat-img` + `feat-emoji` in that template and it stays green.

- **The void was real; a bigger dot was the wrong remedy.** 0.7.6
  removed the duplicate category wordmark from this card, which left the
  plate as a single `#0d0b08` field holding one centred emoji — measured
  **99% one flat colour / 96.8% empty ink** (0.7.6's Known issue (a)),
  and in dark mode the plate was `rgb(13,11,8)` on a `rgb(13,11,8)`
  page: a **1.00:1 collapse**, no edge at all. @qa-inspector explicitly
  recommended AGAINST a bigger-glyph remedy — even an impossible 56×56
  emoji caps at **5.33%** coverage, and the residual single-colour share
  is C4's *mandated* honest flat colour, not slack. So this is a
  **structural fix, not a scale change**: the plate had to stop being an
  undifferentiated field and stop being centre-anchored.
- **Corner-anchored stamp.** `.feat .feat-img` flips to
  `align-items: flex-end` / `justify-content: flex-start`, and the glyph
  is re-targeted as `.feat .feat-img > span.feat-emoji` —
  `position: absolute; left: 26px; bottom: 22px`, `z-index: 1`,
  `font-size: clamp(48px, 9vw, 84px)`, `line-height: 1`, colour
  `#f0ede6`, `pointer-events: none`. A centred orphan becomes an
  off-centre anchor: **□3** is the check the old plate actually failed.
- **The plate became a band on the phone.** `min-height` **170px →
  116px**, with a 768–1023px tier at **140px**. Phone only — see the
  deliberate limit below, which is stated rather than buried.
- **Dot-grid field, `::before`**: `radial-gradient(circle,
  rgba(240,237,230,0.055) 1px, transparent 1px)`, `background-size:
  28px 28px`, `background-position: 14px 14px`. Same 1px-dot,
  28px-pitch texture the hero already carries at `home.css:59`
  (`.hero::before`) — in cream, because this plate is dark in BOTH
  modes. It is a sanctioned texture, not a wash.
- **Inset hairline plate edge, `::after`**: `inset: 14px`,
  `1px solid rgba(240,237,230,0.20)`, `border-radius: var(--r-sm)`
  (6px — R1's closed ladder). D1's default elevation is a hairline, no
  shadow; this edge is also what makes the plate legible in dark mode,
  where the fill lift on its own is thin.
- **Dark-mode lift**: `[data-theme="dark"] .feat .feat-img` →
  `var(--surface-2)` = **`#171512`**, step 3 of the C2 warm-black
  ladder (`Layout.astro:405`). This is what breaks the collapse — the
  plate is no longer the page colour — and the hairline above is what
  makes the difference read.
- **Fidelity guard — real photos always win**:
  `.feat .feat-img:has(> img)::before, .feat .feat-img:has(> img)::after
  { content: none }`. Both new layers are absolutely positioned and
  would paint OVER a static `<img>` if this slot ever gains one, so the
  fallback decoration yields the moment a thumbnail is present. Today
  `index.astro:68` emits no `<img>` at all, so this is the plan's P0-2
  law made **enforceable** instead of merely stated.
- **Specificity was the fix, not a footnote.** The glyph rule lands at
  **(0,3,1)** and beats the pre-existing `.feat-img>span:first-child` at
  `src/layouts/Layout.astro:442` — **(0,2,1)**. *Line 442, not 441:*
  earlier notes, and 0.7.6's own Known issue (b), said 441. That older
  rule was silently defeating the phone downscale — **media queries add
  zero specificity** — so the verbatim `.feat-emoji { font-size: 32px }`
  in the 767px blocks (`home.css:497`, `article.css:881`) at
  **(0,1,0)** had never once applied, and the glyph rendered **56px at
  390**. This release closes that latent bug by out-specifying the rule
  that was eating it: no `!important`, and neither file edited.
- **Laws held**: no `!important` anywhere in the file, no gradient wash
  (C4), **no gold added** — the card's existing 3px gold left bar on
  `.feat-body` (`hub.css:89`) remains its single rationed D2 accent,
  and the frame, dots and glyph are all cream. No DOM and no JS change.
  `header.css`, `base.css`, `home.css`, `article.css` and `hub.css` are
  all untouched. Zero edits under `scripts/`.
- **Deliberate limit — desktop plate height is NOT reduced.** At
  ≥1024px the plate is grid-stretched to `.feat-body`: with
  `min-height: 116px` applied it still measured **290.016px**. So there
  `min-height` is not the binding constraint, and **a height fix is not
  a lever** — only the frame and the corner stamp carry the desktop
  read. Said plainly because it deserves saying: this release does not
  shrink the desktop plate, and it does not pretend to.

**Proof (Manager's runs, this tree)**: build exit 0 (78 pages) ·
`npm run check` **6/6 gates green** (vectors `pass=95 fail=0`) ·
`node scripts/tool-accuracy-audit.mjs` **26 pass / 0 fail** · `dist`
confirms the r7 rules present in served bytes — `.feat .feat-img
{ min-height: 116px }`, the dark `var(--surface-2)` lift, both pseudo
layers, the `clamp(48px, 9vw, 84px)` glyph, and the fidelity guard
`.feat .feat-img:has(>img):before, .feat .feat-img:has(>img):after
{ content: none }` — and shows the r7 block served *before*
`.feat-img>span:first-child{font-size:56px}` in source order while still
winning, which is the specificity claim above, proven in bytes. The
accuracy audit needed a slow **serial** run on this memory-constrained
box (**26 cases over ~10 min**); an earlier attempt was abandoned rather
than trusted, because shared CDP tab contention had previously produced
a false 15/11 and only one clean serial run counts. Served-byte CDP
verification is a separate @qa-inspector run — no screenshot or
luminance figure from it is quoted here, because none was handed to this
entry.

## [0.7.6] — 2026-10-01 — King's phone fixes: hero underline out, double category out
Two retraction edits, both from the King's own phone screenshots, both
pure subtraction — nothing added, no gate touched, no verbatim-WP rule
reinterpreted. This is a CORRECTION release: it takes back two things the
design run had proudly stamped, and it leaves one visible debt open and
unfixed on purpose (see Known issues).

- **The ledger rule is RETRACTED — and it was a signature.** The 48×3px
  solid `var(--gold-b)` bar between the hero sub and the CTAs was R5's
  named SIGNATURE (see 0.7.4), implemented as `.hero-sub::after` because
  the homepage fidelity gate forbids a real `.ledger` DOM element — the
  pseudo delivered the plan's exact geometry with zero markup invention,
  and the gate was never edited. The King: *"remove that small underline
  in the hero section it's useless."* The rule and its SIGNATURE comment
  are gone from hub.css, replaced in place by a plain retraction note.
  Said plainly, because it should not be dressed up: **this retires a
  signature the King himself stamped in R5.** The plan's 28px sub→CTAs
  contract (12 + 3 + 13) loses its middle term by order, and the gap now
  rides alone on `.hero-sub{margin-bottom:13px}` — measured 13px live,
  neither collapsed to 0 nor doubled.
- **The C7 `.hold-title::before` bar is a DIFFERENT element and is
  deliberately untouched.** It is also a 48×3 gold rule (`Layout.astro:468`),
  it is also a pseudo, and it is the section-anchor bar for the
  `.hold` rhyme on tools/legal pages. Same geometry, different job, its
  own approval — one King's order retracting the hero rule does not
  generalize to it. (Correction of record: this rule lives in
  `src/layouts/Layout.astro:468`, not `base.css`.)
- **Duplicated category label in the featured card — one kept, fidelity
  wins.** The featured card printed the category TWICE: R5's `ac-artword`
  wordmark on the ink tile AND a verbatim `a.badge` pill in the body. King:
  *"bad and ugly keep one."* **The `a.badge` pill was KEPT** because it is
  verbatim WordPress `template-parts/content.php` markup AND it is the
  working category-archive link (`href={base}category/{slug}/`) — the wordmark
  was decorative. Removing the pill would have been a functional regression
  dressed as a cleanup, so the decorative span lost instead: the
  `ac-artword` was removed from the featured card only (`index.astro:68`).
  Fidelity over novelty, and the archive link still works.
- **Ink tile height unaffected, by construction not by luck.** `.feat-img`
  is `min-height` — 260px base / 200px tablet / 170px phone, by tier — and
  the removed `ac-artword` was `position: absolute`, so it never
  contributed a single pixel of height in the first place. Measured
  **348×170 phone, 501×290 desk**.
- **`ArticleCard.astro` deliberately UNCHANGED.** The grid cards still carry
  the same wordmark-plus-badge doubling the featured card just lost. That is
  a second call, not a freebie: it awaits the King's decision and was
  declared out of scope here rather than half-decided.
- Diff is 2 files, 5 insertions / 14 deletions — `index.astro` one line,
  `hub.css` the rule plus its comment. No `src/**` beyond those two, no
  `scripts/**`, no `!important`, no gate edit.

**Proof (@qa-inspector's runs, built/served bytes)**: build exit 0 (78
pages) · `npm run check` **6/6 gates green** (article gate 147/147, vectors
95/0) · tool-accuracy-audit **26 pass / 0 fail** · `.hero-sub::after` count
**0** in `src`, `dist` and served, computed `content: none` · sub→CTA gap
measured **13px** · `.feat-img .ac-artword` count **0** · `.feat-body .badge`
count **1** · **0 JS errors** · sheen **0** · screenshots
`r7-hotfix-hero-light-phone.png` (lum 68.0),
`r7-hotfix-hero-dark-phone.png` (33.9),
`r7-hotfix-featured-light-phone.png`,
`r7-hotfix-featured-dark-phone.png`,
`r7-hotfix-home-desk-light.png` (94.3)
(/home/opc/work/research-notes/).

**Known issues — OPEN, not fixed in this release:**
- **(a) The ink tile now reads as a void.** With the wordmark gone, the
  flat `#0d0b08` tile sits at **~96.8% empty ink / ~3.2% glyph coverage**
  and reads as a black hole on the cream page. Flagged by @designer.
  Recommended remedy — a **96px / 64px `min-height` + glyph pair inside the
  existing 767px block in `hub.css`** — is **NOT applied**: it is queued for
  the King's approval, and shipping an unapproved second change under cover
  of a retraction release is exactly the over-reach the design law forbids.
- **(b) Latent specificity bug — phone emoji downscale never applies.**
  `Layout.astro:441` `.feat-img>span:first-child{font-size:56px}` scores
  **(0,2,1)** and beats the 767px `.feat-emoji{font-size:32px}` rule at
  **(0,1,0)**, so the featured emoji measures **56px at 390** where the
  verbatim phone rule says 32px. Pre-existing, unrelated to this release's
  intent, and left in place rather than silently folded into a design
  retraction — it needs its own approval like any other change.

## [0.7.5] — 2026-10-01 — Design Language R6: Chrome + live dot
The chrome stops being a frame the content sits in and becomes the site's
dark-on-cream boundary (DESIGN-LANGUAGE rung R6, plan §P1-4 · Chrome:
ticker + header + search + theme pill). Everything here is ADDITIVE — one
new stylesheet, 89 lines, imported after hub.css so the cascade reads
R1 → … → R5 → R6. `header.css` is deliberately untouched: the header
fidelity gate reads that file directly and asserts its media queries
(tablet fit-size, 767px show/hide switch), so it stays anchor, not edit
target.

- **Gold hairline**: 1px `rgba(245,158,11,0.22)` under BOTH sticky bars
  (`.sh` desktop, `.mh` mobile) — border-COLOR only, the 1px geometry and
  both bar heights (64/56px) are untouched. The header is the
  dark-on-cream edge; it earns the one gold rule in chrome.
- **Nav hierarchy**: `.snav-list > li > a` font-weight 700 at ALL widths
  (was 500 — links and the Newsletter CTA stop competing at one weight);
  font-size 13px only inside `@media (min-width: 1024px)`, so header.css's
  tablet 11px fit-size still governs 768–1023px where the bar is tightest.
- **Ticker voice**: `font-family: var(--font-mono)` on the strip.
  `.t-pair` (10px) and `.t-rate` (11px) carry explicit sizes and inherit
  the family — the rate line was already plan-correct, unchanged.
- **SIGNATURE — the live dot**: 6px solid `var(--green)` pulsing dot
  (`tl-pulse`, 2s ease-in-out, opacity 1→0.35 + scale 1→0.72), plus "LIVE"
  in 9px uppercase `0.14em` gold (`--gold-b`). It appears ONCE, never
  per-item. `prefers-reduced-motion: reduce` sets `animation: none`.
  Placed as a flow child of `.ticker` BEFORE `.ticker-drag` — outside the
  marquee entirely, so the two ticker halves stay byte-identical and the
  seam is untouched; its `--dark` bed + 1px `#2c2822` edge masks the items
  sliding cleanly behind it as they pass.
- **Drawer touch targets**: `.mno-list > li > a` → 15px, padding
  `14px 20px`. `font-weight: 700` and `min-height: 48px` are already in
  header.css and are preserved, so every item keeps a 44px+ target.
- **Search panel on phone**: `.gs-input` `min-height: 48px` with 13px
  vertical padding (box-sizing: border-box, so the 40px right clear-button
  gutter is not clipped); `.gs-foot` hidden below 768px. The kbd hint
  markup STAYS in the layout — the header fidelity gate asserts
  `<kbd>↑</kbd><kbd>↓</kbd>`, `<kbd>Enter</kbd>`, `<kbd>Esc</kbd>` are
  present, so this hides the row with CSS rather than deleting markup the
  contract owns.
- No `!important` anywhere, no WP rule rewritten (the single grep hit is
  the word inside chrome.css's own header comment), zero edits to any
  file under `scripts/`.

**Proof (Manager's runs)**: build exit 0 (78 pages) · `npm run check`
**6/6 gates green** (accuracy audit re-run on this tree: **26 pass /
0 fail**) · CDP: exactly **1 `.tl`** in the DOM, dot computed `6px × 6px`
at `rgb(21,128,61)`, animation `tl-pulse 2s`, the two marquee halves
measured **equal at 897 × 2** (no seam drift), gold hairline present on
`.sh` AND `.mh` in light AND dark, nav links `13px / 700` at desktop,
`scrollWidth` 390 on phone with no horizontal overflow, **zero JS
errors** · screenshots
`r6-desk-light.png`, `r6-desk-dark.png`, `r6-phone-light.png`,
`r6-phone-dark.png`, `r6-phone-drawer.png`, `r6-phone-search.png`,
`r6-phone-search-light.png`, `r6-phone-light-top.png`
(/home/opc/work/research-notes/).

## [0.7.4] — 2026-10-01 — Design Language R5: Hub + Hero
The homepage stops being a flat stack and becomes a designed spread
(plan §P0-1 hero + §P0-2 cards, rung R5). **Executed DIRECTLY by the
Manager** — all three delegation paths were down simultaneously (native
engine's schema-module fault, freebuff 0/25 Freebucks, opencode opt-in-gated
+ 3-min leg limit), which is the delegation law's stated condition for
direct work; freebuff retakes the ladder at refill.

- **P0-1 hero**: plan-exact spacing/type now live — phone padding
  56/20/52 (was 40/20/48), tablet 64/32/60, desktop 72/48/68 stands;
  phone H1 floor 38px (verbatim media had 30px), phone sub 15px (was 13);
  tag 10px/0.16em 6/14; chips row gets its hairline (1px
  rgba(245,158,11,.18) + 20px pad-top) and pills 10px/5/12 with 44px phone
  targets; CTAs 48px phone min-height.
- **SIGNATURE — the ledger rule**: 48×3px solid `var(--gold-b)` between sub
  and CTAs, left-aligned, static. Implemented as `.hero-sub::after` (the
  homepage fidelity gate explicitly forbids a `.ledger` DOM element — the
  pseudo-element delivers the plan's exact geometry with zero markup
  invention, and the gate stayed untouched).
- **P0-2 stamp corner**: `.ac-img`/`.feat-img` art tiles now flat brand ink
  `#0d0b08` (pastels overridden by cascade, `.i-*` class hooks kept), the
  category emoji stays at 40px card / 56px featured in warm-cream, plus a
  10px uppercase category wordmark bottom-left in the badge tint
  (`ac-artword` on ArticleCard fallback + featured). Real-photo thumbs
  always win — all 9 homepage cards are photos today, the ink tile is the
  fallback the archive (10 cards, photo:false) proves live.
- **Sanctioned subtractions** (the only verbatim-WP removals of the whole
  design run so far): the three `::after` white-sheen gradients
  (home.css ×2, article.css ×1), commented in place with the §P0-2
  citation.
- **Hierarchy**: featured body earns the single 3px gold left bar (D2's
  ration: the grid's only gold accent); `.ac:hover` drops `sh-gold` bloom →
  `sh-sm`, title→gold becomes the one hover signal; grid gaps 16/20/24.
- **M3 motion**: hub cards once-in-view translateY(6px)+fade 0.55s,
  fires once, reduced-motion mirrored. Armed BY JS ONLY inside index.astro's
  existing WP-ported script block (the gate truncates the template at the
  first `<script` — mid-file scripts break its structural predicates), with
  a viewport-scoped 2s safety so below-fold cards keep their scroll reveal.
- All homepage overrides are scoped `.hero:has(.hero-cats)` so tools/legal
  article heroes keep their own anatomy (C7 rhyme untouched there).

**Proof (Manager's runs)**: build exit 0 (78 pages) · **6/6 gates green**
including the homepage fidelity contract (after re-structuring to satisfy
it: pseudo-element ledger + in-script M3 — the gate was NEVER edited) ·
accuracy **26/26, 0 fail** · CDP: phone hero 56/20/52 + H1 38px + sub 15px,
ledger `48px×3px rgb(245,158,11)` in light AND dark, chips hairline
`1px rgba(245,158,11,0.18) pt:20` + db `10px 5px 14px`, featured bar
`3px rgb(245,158,11)`, sheens `none` both tiles, M3 armed 9 cards →
6 revealed on scroll (opacity 1), **no-JS: 9/9 cards visible, unarmed**,
archive: scrollW 390 + ink fallback + wordmark "Investing", no stray tabs ·
screenshots r5-{home,archive}-{light,dark}-{phone,desk} (light 64/92,
dark 33.5/22.2, archive 170 — separation verified, homepage light reads
darker than tools pages because the dark hero slab + ink tiles are the
brand, not a regression).

## [0.7.3] — 2026-10-01 — Design Language R4: Calculator Anatomy (K3/K5/K6/K7)
Every calculator now explains itself, restarts itself, and signs its work
(DESIGN-LANGUAGE §11 rung R4). Executed via freebuff shelter — the run
crashed mid-flight at 12:57 (provider stream death, zero session memory) and
a continuation session resumed from the on-disk diff, repairing two of the
crashed session's defects (a build-breaking brace in budget-allocator, three
reset buttons missing their `data-anat-reset` binding) without reverting any
completed work. Manager re-verified every claim independently.

**Phase-1 audit first (K5/K6/K7, before any visual edit):**
- **K5 default honesty: 73 inputs across 16 tools — 0 unrealistic.** No
  default was changed (changing honest zeros like rent/NHF would be
  manufacture, not repair). Full table in /tmp/r4-freebuff/AUDIT.md.
- **K6 reset: 0/16 tools had one.** All 15 interactive tools now carry
  `.anat-reset`; amount pages have no inputs (honest n/a).
- **K7 methodology: 0/16 tools had a disclosure.** Now 16/16.

**Implemented (additive only, 210 insertions / 20 deletions):**
- **K3** — 12 rationale hints reusing the existing `.hint` class, only where
  the formula is genuinely non-obvious (pension, rent relief, rate
  frequency, drip…); self-evident fields untouched.
- **K6** — `src/scripts/anatomy.js` (new, 46-line IIFE): captures
  server-rendered defaults at boot; reset sets `.value` + dispatches the
  `input`/`change` events each tool's own compute listens to. Scope is
  ToolShell's `.con` (verified to contain exactly the tool's inputs — a
  prior-session `.fx-card` scope silently skipped fields outside the card).
- **K7** — `.anat-verdict` runtime sentence on all 15 interactive tools,
  computed from each script's own values (effective PAYE rate, true APR,
  annuity monthly, runway months…) — no hardcoded claims; savings-goal
  adopts the site's own `.prog` bar as its progress signal; and
  `details.anat-methodology` "How we calculate this" on all 16 surfaces,
  describing each script's ACTUAL math as coded.
- **C6 signature** — one `.anat-stamp` per tool (gold mono 9px, hairline
  border, unique per tool: `TRUE APR · LENDING · NIGERIA`,
  `NGX TOTAL RETURN · DRIP-AWARE`…), slot-compatible with C3 since tool
  heroes carry no filled-gold CTA. Existing strong signatures (ladder,
  split-figure, ranked tables) kept.
- `src/styles/anatomy.css` (new, 71 lines) — the ONE new control (reset)
  + verdict/stamp type; K3 needed zero new CSS (`.hint` already matches the
  spec). Imported after ladder.css: cascade R1→R2→R3→R4.

**Proof (Manager's own runs)**: build exit 0 (78 pages) · 6/6 gates ·
accuracy **26/26, 0 fail** · independent CDP probe on two tools the worker
did NOT probe: loan-repayment perturb ₦100,000→₦777,777 figure
`₦130,000→₦1,011,110` (777,777×1.3 ✓), reset restored all three inputs +
`₦130,000` exactly; dividend select+number reset restored `3/500000`;
methodology text dumps real formulas (verdict's 2333.9% true-APR checks out
as 1.3^(365/30)−1) · stamps present, zero `!important`/gradient in diff
(the 2 grep hits are the English word in article prose) · screenshots
`r4-st-tax 156.7/23.2 phone · r4-goal 143.9/17.0 desk`.

## [0.7.2] — 2026-10-01 — Design Language R3: Converter Composition + Rates Ladder
The converter stops being an empty box you type into and becomes an
*instrument panel* (DESIGN-LANGUAGE §5 steps 1–5, 8, 9 — steps 6/7
stats-band/sparkline DEFERRED by the King and deliberately NOT built).
Executed via freebuff shelter (first attempt died on a provider stream
failure — "Giving up after repeated stream recoveries", zero file changes;
retry landed clean), then independently re-verified by the Manager.

- **Dynamic ladder on the converter** — `#cc-ladder` (new id, sole addition)
  mounts inside the .fx-card after the receipt: two verbatim `.st-table`
  tables side by side — forward q ∈ 1/5/10/25/50/100/500/1000 FROM→TO,
  reverse q ∈ 1/100/500/1000/5000/10000 TO→FROM (non-NGN targets use the
  1/5/10/25/50/100 step set) — rebuilt by the same `render()` on every
  input/swap/select through `fxConvert`/`money()`. Row 1 always equals the
  hero unit line (`1 USD = ₦1,329` verified equal by string compare).
- **Build-time ladder on all 16 amount pages** — `[amount].astro` adds the
  same two-column anatomy as a `.con` child (the pattern that engages the
  verbatim ≤767px full-bleed rule), values from `amountFmt(q * d.unit_rate)`
  / `d.rev_rate` — the SAME helpers as the hero, zero recomputation. The
  "Neighbouring conversions" link block stays untouched (SEO).
- **N6 disclosure (step 8)** — single stamp under each ladder reusing
  `.receipt-foot.hint` / `.fx-result-note`: `mid-market · {as_of} · live at
  build — refreshes in your browser · informational, not a quote` — no new
  trust block invented.
- `src/styles/ladder.css` (new, 36 lines) — imported AFTER controls.css
  (R1→R2→R3 cascade documented in Layout) and contains ONLY the `.fx-ladder`
  flex shell: tools.css already owns `.st-table th` (9px/0.14em uppercase),
  `.st-amt` (mono right), and tbody hover — grep-verified, so NOTHING was
  redeclared. No `!important`. css-parse gate passes.
- `scripts/r3-cdp-probe.mjs` kept as the rung's idempotent probe harness.

**Proof (Manager's own runs, not the worker's word)**: build exit 0 (78
pages) · 6/6 gates PASS · accuracy **26/26, 0 fail** · independent CDP probe:
ladder visible @390, 8 fwd rows, 2 tables, row1 `1 USD = ₦1,329` == `#cc-unit`,
swap flips header `USD → NGN` → `NGN → USD` and row1 → `1 NGN = $0.00`,
amount page row1 `$1.00 = ₦1,329` matches `1 × 1,328.6457` via `amountFmt`,
`scrollWidth == 390` on both pages (no sideways scroll), stamp present in
card, zero JS errors, neighbours links intact · screenshots
`r3-cc-light-phone 152.2 / r3-cc-dark-phone 23.9 / r3-cc-light-desk 125.7 /
r3-am-light-phone 140.8 / r3-am-dark-desk 17.0` (v3 storage-key seeding).

## [0.7.1] — 2026-10-01 — Design Language R2: The Control Law
**Money inputs are now instruments, not spreadsheet cells** (DESIGN-LANGUAGE §6
F1–F4, rung R2). Executed via freebuff shelter (native delegate engine threw
its schema-module fault again this session — the ladder held), then
independently re-verified file-by-file by the Manager.

- **F1 — no more `type=number`**: all 54 money inputs across the 15
  money-tools pages are `type="text" inputmode="decimal"` (stepper arrows and
  comma-rejection gone; every id/value/label/step attribute byte-identical —
  the diff is exactly the type word). Each page script gained a parse-tolerant
  reader `pm()` — typed `₦1,500`, `1,500.25`, even stray letters never break
  the live compute; all 54 `Number(.value)` reads rewired through it. Selects
  untouched. No formula changed anywhere (diff math: +123 = 54 type + 15 pm-def
  + 54 reads; −108 = 54 + 54; zero other lines).
- **F3 — ₦ inside the field**: `src/scripts/money-controls.js` (new, dep-free
  IIFE) wraps every `.field` with a ₦ label + decimal input in a `span.fi` and
  paints an aria-hidden gold-dim ₦ at `left:12px` (28px text gutter reserved);
  Years/Months (inputmode=numeric) and non-₦ fields are skipped by design.
  Wired sitewide exactly like spotlight-search/ticker-live; selector-gated so
  it is inert elsewhere.
- **F2 — the reformat cue**: blur comma-groups the integer part only
  (fractional tail byte-preserved), then a 200ms opacity dip (`.fx-dip`) says
  "I reformatted your number"; focus strips commas back for clean caret math.
  pm() re-tolerates commas on the next input event — the loop is closed.
- **F4/press**: phone `@media` min-heights (inputs/selects 48px, `.swapbtn`
  44px — restates ToolShell, cannot shrink desktop), `.swapbtn:active`
  press dip (translateY(1px)+brightness .96, 120ms). Focus gold 2px stays
  owned by the verbatim ToolShell rule — NOT duplicated (documented in
  controls.css header; re-declaring it would only risk a cascade fight).
- `src/styles/controls.css` — new additive layer, imported AFTER numbers.css
  (R1→R2 cascade order); no `!important`, no WP-verbatim rule rewritten;
  prefers-reduced-motion mirror pinned. `scripts/r2-*.mjs` kept as audit trail.

**Proof**: build exit 0 (Manager's own rebuild) · 6/6 gates PASS · accuracy
audit **26/26, 0 fail** on the R2 build · CDP probes: type 1500→blur→`1,500`
with ₦ inside field (rect+color+pointer-events verified), focus→`1500`,
`1500.2500`→`1,500.2500` (tail byte-exact), live results still recompute
through pm() (converter 2500→₦3,321,614; salary-tax 2,500,000→₦1,860,167).
Screenshots `r2-{st,cc}-{light,dark}-{phone,desk}.png` (theme seeded via the
real v3 localStorage key — media-emulation alone is defeated by the stored
choice; noted for all future dark proofs).

## [0.7.0] — 2026-09-30 — Design Language R1: The Number Law
**Phase change.** The King approved the sitewide design upgrade: research
complete (`~/work/research-notes/finance-design-research-2026-09-30.md`),
constitution stamped (`docs/DESIGN-LANGUAGE.md` v1.0, all five §9 decisions:
mono-everything KEPT · rates ladder YES · history DEFER · sticky result YES ·
dark tier YES). This is rung R1 — additive only.

- `src/styles/numbers.css` — NEW additive layer (DESIGN-LANGUAGE §1):
  `font-variant-numeric: tabular-nums` on every figure that refreshes or
  column-aligns — `.fxap-figure`, `.receipt-fig`, `.fx-big`, `.receipt-sub`,
  `.receipt-note`, `.fx-line b`, `.fx-rate-*`, `.st-table td`, `.st-amt`,
  `.sr-rate`, `.t-rate`, `.si-n`. No verbatim WP rule rewritten; the layer
  only ADDS properties the fidelity sheets never set, so the v0.6.8 cascade
  contract is untouched. Imported LAST in Layout.astro by design (no conflict
  to win; future rungs extend this file instead of scattering number rules).
- `--surface-3:#1c1a15` — dark theme's 4th warm-black tier (King's Q5;
  Linear surface-ladder doctrine). Token-only: nothing consumes it until the
  R6/R9 floating-panel rungs.
- `docs/DESIGN-LANGUAGE.md` — draft-1 → **v1.0 STAMPED**; §0 rule of
  construction: additive layers only, 6-gate battery green per rung.

**Proof (CDP, localhost preview mount):** six surfaces × phone 390 + desktop
1280 × light + dark — every money figure computes `tabular-nums` at the
feast scale (floor 30.4px @390, cap 48px @1280, tracking −0.912/−1.44px
unchanged); `--surface-3` resolves `#1c1a15` in dark, empty in light;
screenshots `r1-*.png` luminance-verified per theme. Gates: css-parse covers
numbers.css automatically (scan is directory-wide) — **6/6 PASS**; tool
accuracy audit re-run on the R1 build.

## [0.6.8] — 2026-09-30

### Sitewide spacing repair — the port's copy ran smaller and tighter than the theme

- **[FIX · ROOT CAUSE] article.css had a CORRUPTED comment** (introduced in
  6cad5a6): `@media (max-width: 767px) at style.css:2413-2417` lost its `/*`
  opener, so Chrome parsed the comment prose as an at-rule and SWALLOWED the
  base `.art-body { font-size:16px; line-height:1.8 }` typography rule that
  followed it — while every source grep still saw the bytes. Result: every
  calculator's copy silently fell through to `.fx-copy` 15px/27px (live serves
  16px/28.8px) — the "not enough space between text" the King photographed
  across the money pages. Restored the comment opener; the base rule parses
  again (verified at render: 16px/28.8 + 20px/36 h2 at 390px AND 17px/32.3 +
  24px h2 at 1280px, matching live byte-for-byte).
- **[FIX] Layout import order**: tools.css now imports BEFORE article.css so
  `.art-body` wins `.fx-copy` on the shared `.fx-copy art-body` wrapper —
  the same source order WP's style.css produces (art-body at line 2040 after
  fx-copy at 1341). Comment pins the contract.
- **[FIX] Amount ("conversion") pages**: the section copy + "Neighbouring
  conversions" + "The other direction" blocks were pulled OUTSIDE the live
  `.fx-copy art-body` wrapper with `.95rem/10px` inline overrides — flush
  under each other. Restored inside the wrapper exactly like
  page-amount-converter.php renders (28px h2 seat, 10px under, 16px body).
- **[FIX] FAQ answers** (net-new port block): answers read at 14.4px with an
  8px seat — now full body texture (1rem/1.8) under a 12px gap, card padding
  12/14 → 14/16. The FAQ wrapper's 8px top margin → 24px.
- **[FIX] Calculator result tables** (st): .75rem/10px → the theme's own
  st-table anatomy (12px rows, 10px/14px header, 12px/14px cells, --text-mid).
- **[FIX] Related-tool cards**: excerpt 11px bare → 13px/1.6, title seat
  6px → 8px.
- **[FIX] Footer gate conflict resolved honestly**: the mobile-blurb inline
  `margin-top:4px;font-size:11px` IS WP footer.php:122's own bytes — restored
  verbatim (a fidelity gate pinned it; my sitewide sweep had deleted it). The
  11px blurb is the theme's design, not port cramp; left as the theme ships.
- **[NEW] scripts/check-css-parse.mjs** (wired into `npm run check` as the
  FIRST gate): postcss-parses every stylesheet with zero warnings, fails on
  at-rule prose outside comments (the swallow signature), pins the cascade
  anchors (.art-body 16px/1.8 + h2 20px, .fx-copy 15px verbatim) and the
  Layout import ORDER. Proven it can fail: re-inserting the corruption makes
  it torch the build.
- **[NEW] scripts/spacing-audit.py**: cramp inventory over dist/ (font/margin
  floors on reading copy) — the 58 remaining hits are theme-verbatim rules
  (receipt labels, st-table 9-10px headers, ftag) that ALSO sit on the live
  site: parity, not drift. Deliberate floor excludes dense chrome.
- NOT touched: ticker digits, mono figures, badges/chips, receipt stamps,
  the /mod/ desk's dense console look, vibe-comments plugin vocabulary — all
  theme-shipped sizes; changing them would be re-design, not fidelity.

## [0.6.7] — 2026-09-30

### Build-time data freshness — ticker, converter, amount pages, stats strip

- **[FIX] Home stats strip** (King: "All data current seems useless"): the
  invented trio (10+ / 12+ / "2+ All data current") is replaced with REAL
  build-computed counts — articles from the content collection, apps from
  APPS, money calculators from the shipped money-tools pages (15 / 3 / 16 /
  ₦ 0 today; they update themselves every build).
- **[NEW] scripts/fetch-snapshot.mjs** runs as step 1 of `npm run build`:
  fetches open.er-api.com (the converter's own feed) + Coinbase BTC/ETH +
  gold-api XAU and REWRITES fx-snapshot.ts + TICKER_STATIC at build time.
  The top currency strip and the calculators now share ONE source of truth —
  the stale "₦1,336 vs ₦1,482 vs live ₦1,327" three-way disagreement is
  structurally impossible now. Fetch failure keeps the previous stamped
  snapshot (honest, never blanked).
- **[NEW] ticker-live.js ported VERBATIM** from the theme (assets/js/
  ticker-live.js): live price refresh (60s localStorage cache + data-ts skip)
  and the hover/drag marquee pause, which the port never had. .ticker now
  carries data-ts={FX_SNAPSHOT_TS}.
- **[FIX] currency converter**: hero badge + verified line + baked prose
  figures ($100→₦132,724.16, $1,000→$0.75, £50→₦, spot) all COMPUTED from
  the build snapshot (was four hardcoded stale numbers, incl. a fake
  "updated 30 Sep 2026, 00:02" badge); receipt foot falls back to the real
  as_of, not "Sep 2026".
- **[FIX] amount pages unit line now prints 4dp both directions** exactly
  like page-amount-converter.php (1 USD = ₦1,327.2416 · 1 NGN = $0.0008 —
  the tiny ₦→$ rate no longer truncates to "$0.00"), server + live-refresh.
- **[FIX] exchange-rate-history** snapshot anchor derives from the build
  feed (was "₦1,482 · Sep 2026"); footer stamps derive likewise.
- Savings-rate "verified September 2026" STAYS — it is a human-maintained
  marketing table, the stamp is honest and not build-fetchable.
- Gates: header gate pins ticker ANATOMY + generation marker (not frozen
  values); homepage gate pins the computed stats contract. All 5 gates PASS;
  accuracy audit 26/26; browser-proven local: ticker refreshes from cold
  cache, converter receipt goes "Live · Wed, 30 Sep 2026", $1,000 page reads
  ₦1,327,242 · unit line matches live bytes.

## [0.6.6] — 2026-09-30

### Content pages imported + canonical posts imported — forms are REAL now

- **About, Affiliate Disclosure, Privacy Policy, Disclaimer, Newsletter,
  Contact, Newsletter-Thanks ported from the live templates** (King's order):
  page-about.php (.about-hero + .what-i-do six-card $hc array + .sb-layout
  editorial/Elsewhere/Newsletter sidebar), page-legal.php dark hero + sticky
  TOC + gold-dot .legal-body for the three legal pages with the live
  post_content VERBATIM (heading ids match live anchors), page-newsletter.php
  (.nl-hero ₦ mark, perks, the page content) and template-contact.php
  (.phd + routed form + Contact Details/Work With Me/Newsletter sidebar with
  the template's inline styles verbatim). New src/styles/pages.css carries
  the verbatim §31/34/35/43/44/45 style.css blocks; the port's invented
  legal CSS and prose.css layer were retired in favour of the theme's.
- **Contact + newsletter forms went from placeholder to real**: the WP
  admin-ajax leg is replaced by new Worker endpoints on comments-api
  (POST /forms + GET /forms/nonce + GET /api/forms/list desk). Contract
  mirrors inc/forms.php: honeypot fake-success, HMAC-hour nonce, 5-min/IP
  rate limit, WP's exact error/success strings, newsletter dedupe, routed
  messages stored in D1 (form_submissions / newsletter_emails tables
  created remotely). gwill-forms.js ports assets/js/forms.js behaviour
  (nonce first, FormData, aria-busy loading, success-msg replace, redirect
  to data-success-url). Browser-proven end to end: newsletter submit
  redirects to /newsletter-thanks/ and lands a DB row; contact form shows
  "Thank you. Your message has been sent." and persists the row.
- **All 10 canonical live posts imported** (item 7: "any other page or post
  left"): scripts/port-posts.py converts WP REST content to the port's
  markdown (wp-block tables kept as raw HTML so .wp-block-table CSS styles
  them, WP dates, featured 1200x675 covers downloaded with srcset variants,
  categories mapped). 7 new article pages + 3 port files replaced by the
  canonical live copy under the existing canonical slugs (no shipped URL
  breaks); 4 port-only guides kept alongside. 78 pages built; sitemap 74;
  category/filter/search/OG/comments/related verified in browser.
- **[FIX] homepage + every newsletter form now carries data-success-url**, so
  the thanks redirect matches live on all 4 form instances.

## [0.6.5] — 2026-09-30

### Calculator accuracy certification + two real bugs fixed

- **New gate: `scripts/tool-accuracy-audit.mjs`** — drives all 26 money-tool
  pages in a real browser (CDP): feeds each calculator its input ids, asserts
  zero JS exceptions/console errors, every wired result element exists, the
  figure recomputes with the right currency token, and no
  NaN/undefined/Infinity ever reaches visible text. Result: 26 PASS / 0 FAIL,
  alongside 95/95 vectors-check against the PHP oracle.
- **[FIX] Amount pages: live-FX refresh never ran.** The inline script used
  `<script define:vars>` + ESM `import`, which Astro emits verbatim
  (`SyntaxError: Cannot use import statement outside a module` on all 10
  amount pages). Rewired as a bundlable module script reading the slug from a
  `data-amount-slug` holder. The "refreshes live" promise is now true.
- **[FIX] 50/30/20 calculator froze after the first keystroke.** The render
  wrote `#bg-else` into `#bg-sub`, then overwrote `#bg-sub`'s whole
  textContent — destroying the span; every later update threw
  `TypeError: null.textContent`. The clobbering line is deleted (the span
  update alone renders the leftover); full recalc works on every keystroke.
- **[FIX] Amount pages had no `#am-foot` node** for the live timestamp to
  land in — snapshot-stamped footer line added, honestly swapped for "Live ·"
  when the feed answers.

## [0.6.4] — 2026-09-30

### Money Calculators imported (/tools/ → /money-tools/)

- **The calculator hub + all 16 calculators imported from the live site**
  (King order: "import the money calculator. finance.fitnesslova.qzz.io/tools/
  … also import the calculators and tools themselves, maybe change the URL
  path"): page-tools.php ported faithfully — dark apps-hero with the "Free ·
  No sign-up · Always updated" gold pill, 16 .tool-card in the template's own
  order with verbatim titles/emoji/gradient tiles/descriptions ("Open tool →"),
  the 8 "Popular conversions" .fx-chip landing links, banner + rect ad slots
  and the "Why use these calculators?" hub copy. URL moved to **/money-tools/**
  per the King's suggestion; /tools/ is gone (404), sitemap, nav, search index,
  SW shell cache and every internal link followed (27 sitemap locs).
- **Every calculator page rebuilt on the live anatomy** (16 templates + the 10
  amount landing pages): ToolShell now renders the same dark hero as WP
  (3-level breadcrumb Home › Money Calculators › Tool, per-tool gold badge
  pill, the live hero H1 verbatim — e.g. "Dollar to Naira & Every Currency"),
  inputs+receipt wrapped in the theme .fx-card, dark receipt panel,
  st-table/st-table-wrap tables with the mobile full-bleed breakout,
  fx-disclaimer honesty line, the live .fx-copy art-body long-form section
  (14–24 paragraphs of the site's own copy per tool), FAQPage JSON-LD kept,
  .fx-aff affiliate CTA blocks + "Related guides" .g3 cards on the converter
  and the six tools that carry them (links remapped to articles that exist in
  this port — no 404 bait).
- **Theme calculator CSS imported verbatim**: new src/styles/tools.css carries
  style.css 1244–1500 (.fx-card .fx-field .fx-input .fx-swap .fx-result .fx-big
  .fx-chips .fx-rate .fx-copy .fx-aff .tool-card .st-table .st-compare .sr-chart
  .fx-rate-mode .hx-* .fxap-* + winner-row/tbl-best matrix), loaded globally via
  Layout so hub and calculators speak the same vocabulary as WordPress. Engines
  and math untouched (vectors gate PASS); only markup/classes moved.

## [0.6.3] — 2026-09-30

### Search clear-X branded, /apps/ imported, OG images done properly

- **The X that clears the search text is now tied to the design** (King
  screenshot, /search/ on mobile): the pill was letting WebKit draw its own
  `type=search` cancel glyph — a bare UA ✕ with zero brand. Suppressed in CSS
  and replaced with the theme's OWN clear anatomy (the spotlight panel's
  `.gs-clear` contract): 28px transparent circle, `--text-dim` stroke ✕, gold
  fill on hover, 2px gold focus ring, truly `hidden` at zero text. Same SVG,
  same class logic, ported onto the search pill + the 404 page; click empties
  the field, re-runs live results, keeps focus. Browser-proven: shows with
  text, 28px circle, vanishes on click, cards re-render.
- **/apps/ imported from the live page** (finance.fitnesslova.qzz.io/apps/):
  the old port page was an invented legal-hero anatomy — replaced with a
  faithful `page-apps.php` (v1.0.163) port: dark `.apps-hero` with dot-grid +
  gold-glow layers, Home › Finance Apps breadcrumbs, the inline gold "No paid
  placements · Independent rankings" pill, exact h1/sub inline styles; sticky
  `.apps-tabs` with derived category pills (emoji prefix, letters-only
  `data-filter` slugs); `.shd` count line "All Apps, 3 listed" · "Sorted by:
  Our Rating"; 3 live ACF slot cards (PiggyVest/Grey/Risevest — verbatim
  desc/stats/tile gradients/badges from the capture), `.app-card` anatomy
  (§36 CSS block completed in home.css from style.css:2444-2487 incl. the
  dark-hero breadcrumb overrides), `apps-filter.js` ported verbatim, empty
  state + hidden Load-More + rect ad slot. Live-slug Full-Review links remap
  to the port's own articles. Filter proven live: Savings → 1 card / count 1
  / label swaps; All → 3.
- **OG images done properly** (King: "make sure the og image is done properly
  and looks and has the brand logo and design"): the port pointed every page
  at `images/og-default.png` — a FILE THAT NEVER EXISTED (404; every share
  card rendered imageless). Now mirrors `inc/social-meta.php` exactly:
  single posts use their featured hero (all 8 verified 1200×675) with
  width/height/alt + `og:type=article` + `article:published_time` /
  `article:modified_time` (only when the post carries an updated date) /
  `article:author`, dates formatted like get_the_date('c'); every other page
  falls back to the theme's branded share card — the wordmark on the finance
  palette, `assets/brand/gwill-social-share.png` (1200×675) copied into the
  port's `public/images/` and served from there — so Twitter/FB/WhatsApp
  previews are rich brand cards everywhere, never bare text, never broken.

## [0.6.2] — 2026-09-30

### King's 3 reports: author archive, fully-clickable cards, the orange focus ring

- **Author archive ported for real** — the old page was an invented anatomy
  (`.con.sg` + `.author-bio` + text-link socials). Now it is the theme's
  `author.php` verbatim: `.phd` → `.bc` Home › {display_name} (helpers.php
  is_author branch carries no "All Articles" crumb) → `.author-head` →
  `.author-av` with the 96px get_avatar output (the real godschi10@gmail.com
  Gravatar, shared `GRAVATAR` constant) → `.author-id` h1 + bio p →
  `.abio-s.author-socials` icon row (AuthorSocials gains the `extraClass`
  prop exactly as the template renders it) → `.con` margin-top:28 /
  padding-bottom:48 → `.ad-bg` + `.g3` + the_posts_pagination contract, and
  the empty state `.page-surface` > h2 "No posts from this author yet".
  Theme §30 CSS (`.author-head/.author-av/.author-id/.author-socials`) ported
  from style.css:2313-2331; §50 phone override (64px avatar) verified live:
  64px @390w, 88px @1280w. SEO description matches inc/seo.php
  ('Articles written by %s on GWill Finance.'). Dead invented CSS removed
  from Layout.astro.
- **Cards clickable everywhere** — ROOT CAUSE: the theme's stretched-link
  selector `.ac h3 a::after` matches NOTHING on its own markup (content.php
  emits h2.ac-t — truth: 9/9 h2, zero h3; the comment says "Fully clickable
  card" but only the body ever was). The port inherited the dead rule.
  Fixed on `.ac .ac-t a::after` (title link is the only per-card anchor),
  `.ac-body` set static so the overlay spans the FULL card box including the
  art strip, and the featured-image anchor (`a.ac-img`, z-index:2) keeps its
  own href. Badge stays z-index:2: tapping the category pill navigates to its
  category, not the post. Browser-proven at 390px: art → article, body →
  article, Read → article, badge → /category/savings/. Search-result cards
  (same vocabulary) inherit the fix.
- **Thick orange border inside the search form — gone at the root.** Two
  rings were stacking on every mobile tap (Chrome/Android matches
  :focus-visible on tapped text inputs): (1) the port's stale global
  `a/button:focus-visible { outline:3px solid var(--gold-b); offset:3px }` —
  the theme's is `2px var(--gold-btn)`/dark `--gold-b`, offset 2px, and also
  covers [tabindex]; (2) `.search-field:focus-visible` drawing its own gold
  ring INSIDE the pill. The field now outlines none: the pill itself is the
  focus indicator (:focus-within gold border + soft glow — WCAG 2.4.7 held
  by the pill ring, as the theme's anatomy intends). Verified: computed
  outline-width 0px while focused.

## [0.6.0] — 2026-09-30

### King's 2 orders — the /search/ count gap + the whole archive family

- **"Let there be space between '1 result for gut' and the card below it"** —
  real bug: the port printed the count line TWICE. WP keeps it once in the
  `.phd` result header; the port also had a `<p id="result-count">` wedged
  between the search pill and the grid with 0px computed gaps (measured
  `gapToGrid: 0` at 390px and 1280px on the live build). The duplicate is
  gone — the controller writes the header line only. Verified @390px:
  header reads "1 result for gut", no duplicate node, pill margin 24px, card
  80px below the pill.
- **Archives imported — every type the live site actually has:**
  - `/articles/` rebuilt as WP's "All Articles" archive: `.phd` breadcrumb
    header + verbatim intro ("No filler. No AI slop."), the
    `.flex.aic.jsb.g16.mb20` toolbar (10 pills — All + the 9 categories —
    plus the inline search form posting into `/search/`), 8 cards, ad slot.
  - **Three new category archives**: `budgeting`, `fixed-income`,
    `uncategorized` (WP's archive descriptors captured verbatim; badges
    `bsl`), plus the CHILD route `/category/investing/fixed-income/` (WP
    answers both the nested and the flat path). Every archive strip now
    carries all 9 categories with the current one `.cp.on`.
  - **Date archives** `/2026/` + `/2026/03/07/08/09/` — h1 "Articles" with
    the date in the breadcrumb, exactly WP's anatomy (`.pill-strip`
    surface-2 strip, `.con` 28/40, collapsed `.ad-bg`).
  - **Pagination** (§38): WP's `posts_per_page = 10`, page N at
    `<archive>/page/N/`. `src/lib/pagination.ts` + `ArchivePagination.astro`
    reproduce `nav.navigation.pagination` byte-for-byte, wired into
    `/articles/page/N/`, `/{year}/page/N/` and `/category/{slug}/page/N/`.
    Renders only when an archive exceeds one page (at 8 posts WP prints
    nothing either); proven with a forced PER_PAGE=2 probe build that
    emitted pages 2/3/4 with the exact WP markup, then reverted to 10.
  - **Tags: nothing to import** — the live site has no tag archives
    (every `/tag/` probe 404s; zero tag links on any post). Author archives
    and day archives do not exist there either.
  - Homepage chips/pills now list all 9 categories, matching WP.
  - Sitemap carries the new archive routes (60 URLs).
- Article fidelity gates: 147/147 PASS. Build: 64 pages.

## [0.5.2] — 2026-09-28

### King's 2 orders — the author badge/star + the real gravatar

- **Author label/star on his comments** — the Worker hardcoded
  `is_author: false` on every row, so the gold AUTHOR pill
  (vibe-comments.gold.css §6 — the plugin's own badge, gold skin) never
  rendered on the author's replies. Derived truth, no new column:
  `is_author = avatar_hash ∈ AUTHOR_HASHES` (SHA-256 of each deploy-time
  author address), computed once per request and passed down the tree
  (children included). Live-proven: desk reply is_author TRUE, public tree
  carries it, guest comments stay FALSE. Smoke extended to 66 (15b block:
  desk-reply identity + public-tree flag), live 65/65 ALL GREEN.
- **The real gravatar** — "my gravatar is on godschi10@gmail.com": the
  author surfaces hashed hi@gwillchijioke.com, which serves the wavatar
  placeholder cartoon; the Gmail address serves the REAL photo (verified by
  vision: grayscale portrait on teal). Worker KING_EMAILS = [gmail, hi@]
  (gravatar from the Gmail), production D1 migrated: 9 author rows moved
  7d22209… → cd2c5f95… (verified: 9/9 on the new hash), and the article
  page's GRAVATAR constant + the moderation-desk reply path all key off the
  Gmail hash. Local + served article pages verified: .art-avatar +
  .abio 48px both serve cd2c5f95 (real photo, 48×48 natural on scroll).
- Worker deployed `83628b89`; smoke rows purged from production D1 (14
  rows, verify: only the King's own seeded QA row id 1056 remains).
- Gates 5/5 green (95/95 vectors).

## [0.5.1] — 2026-09-28

### King's verdict on v0.5.0 — 4 live-reported search defects, all fixed

All four reported from phone screenshots + live navigation ("You failed me,
why is your design always having bugs"). Root causes established by
measuring, not looking:

- **1. Search form ugly and large, excessive space** — REAL BUG: the port's
  own pre-fidelity layout CSS (Layout.astro) carried
  `.search-form{...;margin-top:20px;flex-wrap:wrap}`, which leaked into the
  theme's .search-pill on /search/ + /404/ — rendered 74px tall vs live
  WP's 54px (found by measuring both; the pill's own arithmetic said 54,
  the box measured 74 — the 20px was the form margin, nothing else).
  WP carries NO form margin (its margin is scoped to .gwill-form, the
  newsletter). Fixed: `.search-form{display:flex;align-items:center;gap:8px}`.
  Re-measured @390 after the fix: pill 350×54, field 16px (iOS zoom-on-focus
  rule — WP bumps the field to 16px on phones too), submit 36px — PIXEL-
  IDENTICAL to live WP at 390. docOverflowX false (the pill no longer
  overflows the 390px viewport).
- **2. Search drop-down not upgraded** — REAL BUG: the spotlight's embedded
  corpus was the OLD 7-item POSTS-only array (keys
  cat,date,excerpt,mins,title,url — zero calculators, no badge/art map),
  while the /search/ page searched 31 items. The layout's index builder was
  never upgraded when the engine landed. Fixed: ONE corpus shared by both
  surfaces — 8 articles (title/excerpt/category-name/date/read-mins +
  badge/art/emoji/category) + 16 calculators = 24 items. Live-proven on the
  public site: "loan calculator" → 8 rows, first = Loan Repayment
  (Calculator pill); "savigs" → 3 savings matches; "naira" → 6 rows incl.
  Currency Converter + Crypto Profit.
- **3. Enter in the drop-down redirects to the homepage** — REAL BUG + WP
  contract gap: the theme's handler navigates ONLY with a highlighted row
  (spotlight-search.js:541); with no highlight WP SUBMITS ?s=, which WP
  routes to its search template — but the static build's /?s= is the
  homepage. Fixed: Enter with no highlighted row now routes to
  {base}search/?q={term} (the highlighted-row path unchanged). Live-proven
  on the public site: type "savigs", press Enter with no row selected →
  lands on /search/?q=savigs, count "3 results for savigs".
- **4. /search/?q=naira directed to an empty search page** — REAL BUG:
  the static Pages build bakes value="" into the input (no server to
  interpolate ?q=), and the initial() block only MIGRATED ?s= (a ?q= load
  never seeded the input) — so the page ran() on an empty query and showed
  "Showing all 0 entries" + the no-results block. Fixed: initial() now
  seeds the input from ?q= / ?s= (or a raw querystring fragment) on load,
  then run() fires. Live-proven on the public site: /search/?q=naira →
  input "naira", "2 results for naira", 2 cards; /search/?s=emergency fund
  → migrates to ?q= and finds 2 results; /search/?q=zzqxjvvv → "0 results"
  + the .es no-results block with the ₦ glyph. The 404 page's own search
  pill submits natively (requestSubmit) → /search/?q=naira, 2 results.
- Gates 5/5 green (95/95 vectors); shipped main `ec346fa` → pages-dist
  `be95893` (Pages `built`, served /search/ sha-identical to the build).

## [0.5.0] — 2026-09-27

### King's next round — search upgrade + pages, single-image lightbox, copy-link follow-up

- **Search engine upgraded (order 2)** — the port's bare AND-containment
  replaced with the theme's own relevance engine
  (`scripts/search-core.js`, ONE engine shared by the spotlight overlay and
  the /search/ results page): title-weighted Google-ish scoring (exact
  title +150 / prefix +110 / substring +70, per-token title-word
  exact/prefix/fuzzy, ALL-tokens bonuses), typo tolerance with the
  first-letter anchor ("andriod"→"android" passes; "battery"↔"matter"
  can't), diacritic folding ("naıra", "NAÏRA RATES" find results),
  newest-first tie-break, and the no-match recent-posts fallback instead
  of a dead end. Zero speed cost: the corpus is an embedded JSON index,
  zero network per keystroke; the module is 5.6 KB minified. The old
  inline engine (7.4 KB) is gone from Layout.
- **Live-proven (overlay)**: typo "andriod" → 3 relevant posts; "savigs"
  → savings matches; two-token "savings vs" → PiggyVest #1 with both
  tokens <mark>ed; "zzqxjvvv" → "No matches…, try these recent posts:" +
  3 newest; caps/diacritic "NAÏRA RATES" → 4 results; ↑↓ keyboard nav
  sets aria-activedescendant; outer X closes keeping the text;
  perf.getEntriesByType resource footprint unchanged (1 _astro script).
- **/search/ results page (order 2)** — rebuilt in the theme's SERVED
  vocabulary (was an invented .hold-title/.phase-tag rebuild): .phd
  result header (surface bg + bottom border + h1 28px/800), breadcrumbs
  "Home › Search: {q}", "{n} results for <strong>{q}</strong>" count
  line, .search-pill site search (form + icon + 12px field + gold
  submit), category pill filter (Everything + 6 + Calculators), card
  grid in the theme's anatomy (.ac > .ac-img art gradient + emoji +
  .ac-body > badge + h2.ac-t + .ac-ex + .ac-ft) with the badge/art/emoji
  map baked into the index (theme's gwill_finance_cat_style map).
- **No-results page (order 2)** — the theme's .es block ported: ₦ glyph
  circle + h2.es-title "No results found" + p.es-copy + .cp-strip
  category links + "← Back to Home" gold button.
- **404 page (order 2)** — .error-404 ported: breadcrumbs "Home › 404
  Not Found" + .error-404__code (96px→clamp 64-120px, 800 weight, gold,
  glow text-shadow) + h1.es-title "Page Not Found" + p.es-copy + its own
  .search-pill + 6 category links + "← Back to Home". The page's search
  submits WP's ?s= dialect; /search/ accepts both ?s= and ?q=.
- **search404.css slice** — 31 rules ported verbatim with media context
  (incl. dark-mode variants + pointer:coarse + print), rule map in
  `docs/port/19-search404-rules.md`. article.css import moved into the
  layout so the category art gradients reach the search cards (the
  gradient was transparent before — found by measuring).
- **Single images lightbox (order 1)** — VERIFIED, not a port bug: the
  theme's own lightbox.js IS the single-image lightbox (every .art-body
  image, gallery grouping, decorative alt="" excluded — the accepted
  v0.4.8 verdict). Live click-through proof: standalone figure opens the
  overlay (opacity 1, z 99999, counter "1 / 4"), close + keyboard open
  work, tabindex 0 + role=button + "Enlarge image: <alt>" (WCAG). No
  code change — singles already lightbox on BOTH sites.
- **Copy-link SVG (order 3)** — copyDone's `btn.textContent = msg`
  destroyed the ordered inline SVG glyph (WP's own button ships no SVG,
  so its handler never hit this); the restore wrote plain text and the
  glyph never returned. Fixed by swapping only the label's TEXT NODE.
  Live-proven: served article module carries the label-node swap.
- Gates 5/5 (95/95 vectors); shipped main `44731b2` → pages-dist
  `0c18711` (Pages `built`, served bytes sha-identical to the build).

## [0.4.11] — 2026-09-27

### Full audit round — the three remaining MAJOR findings, fixed and live-proven

- **Ghost pending comments (MAJOR-2)** — the Worker hardcoded `approved:"1"` in
  its wire format, so a just-submitted PENDING comment arrived claiming to be
  live; the client appended it to the thread with a working Reply button. On
  refresh it vanished, and replying to the ghost 400'd ("parent not found") —
  because the Worker only nests replies under APPROVED parents. Fixed both
  sides: the Worker reports the row's real state (`approved:"0"` while
  pending), and the client no longer renders a comment that is
  `awaiting_moderation` — it shows the acknowledgement only, exactly like WP's
  guest path. Live-proven: submit now returns `approved: 0`.
- **New-comment detection structurally dead on busy posts (MAJOR-4)** — the
  30s live poll fetched page 1 in oldest-first order; once a post passes 20
  top-level comments, a brand-new comment is on the LAST page, so the "↑ N
  new" banner could never fire. Thread batches stay oldest-first (verified
  against the live WP site's served order — exact parity), but the poll now
  requests `order=desc` so the newest comment is always inside page 1.
  Live-proven: desc returns newest-first, asc unchanged.
- **Turnstile trap (MAJOR-1)** — the Worker enforced a Turnstile token that
  no client widget could ever produce. Had the secret ever been set, ALL
  commenting would have bricked with a silent 400. The verifier now treats an
  empty/unset secret identically (fail-open is explicit and documented;
  honeypot + rate limits remain the guard).
- **Unbounded reply depth (MAJOR-6)** — a script could nest replies 200-deep,
  collapsing the mobile content column. Both write paths (guest submit + desk
  reply) now cap chains at depth 5 and flatten deeper replies at the floor.
  Live-proven: an 8-long chain reports depths [0,1,2,3,4,1,2,3].
- Worker `567caf80`, smoke 60/60 ALL GREEN; site gates 5/5. main `b06d970`
  → pages-dist `ddb4be1` (Pages built, served bytes re-probed).

## [0.4.10] — 2026-09-27

### Comments audit round — the King's order: "Verify the logic, ux and ui
### has no bugs or errors"

- **Copy-link SVG replaced** (his report: "looking like shit" — correct).
  The old icon was a stroke-based chain drawn on a mismatched 14x14
  viewBox whose second path extended to y=14.36 — clipped at the bottom
  and outline-styled next to three solid brand glyphs. Now Bootstrap
  Icons' square solid link (16x16, fill=currentColor, both paths).
- **Live poll crash fixed (MAJOR)** — `vibe-comments.js` typo:
  `insertBefore(bannerWrap, list)` referenced an undeclared variable inside
  a strict-mode IIFE. Every 30s poll that found a new comment threw
  ReferenceError, so the "↑ N new — click to load" banner NEVER rendered
  on the live site. Live-proven broken → fixed → banner renders and
  click-loads.
- **Char counter no longer stale after posting** — form.reset() fires no
  input event; counter now syncs on the form's reset event.
- **Real API errors now surfaced** — the Worker reports failures as
  data.error; the client only read data.message, collapsing everything
  to "Failed to post comment." Rate limits now say the retry seconds.
- **Worker: mod-link approve left ghost pending rows** — the email
  approve-link set approved=1 without status='approved', leaving the row
  visibly public but stuck in the desk's pending queue. Fixed; Worker
  redeployed, smoke 60/60.
- **16-check live E2E on the public site**: validation, drafts, submit,
  moderation queue, author-reply auto-approve, banner, cleanup — all pass.

## [0.4.9] — 2026-09-26

### The King's verdict round — three failures repaired

- **Share row restored to WordPress truth** (his verdict: "Why the fuck did
  you center them like this and remove the share label. Inline it and
  return share label"). v0.4.8's `justify-content:center` and label-hiding
  were MY inventions, not the theme's — deleted. The row is again the
  theme's exact rule (style.css:2250): label inline+visible, buttons
  left-aligned, natural wrap. The 4 inline SVG glyphs and aria-labels
  (his actual orders) remain. Article gate re-pinned to the verbatim rule.
- **Desk links 404 — FIXED** (his report: "Clicking any link in moderation
  desk loads 404"). Root cause: Astro renders `import.meta.env.BASE_URL` as
  `/finance-astro` (no trailing slash) while `postUrl()` concatenated
  `base + "articles/…"` producing `/finance-astroarticles/…`. The define:vars
  now appends the slash. Live-verified: all queue and ranked-row hrefs now
  resolve (`/finance-astro/articles/<slug>/`).
- **Desk header spacing — the real fix** (his verdict: "look at the image
  you sent to me" — the jam was visible in my own screenshot). Root cause:
  `.mod-wrap con` — the shared `.con` class declares `padding: 0
  var(--con-pad)`, which overrode the 44px top padding in the cascade, so
  the "Comments desk" title rendered flush against the sticky header
  (rendered gap 0px). v0.4.8's 44px never applied. `con` dropped from the
  wrap; the desk keeps its own gutter. Live-proven at 390px: title 44px
  under the header.
- Cross-checked the article verse block (his #7 screenshots show the
  "$ naira watch" region): gaps are byte-identical to live WP
  (18/18/28/20px, verse box 350×130 both sides) — no article-side defect.

### Evidence
- Gates 5/5 (article 147/147 with the verbatim share rule, footer 64/64).
- Render probes @390px live: desk gap 0px→44px; desk hrefs all correct;
  share label inline+visible, justify normal, 4 SVGs.
- main `868a06b` → pages-dist `a494930` (Pages built, served bytes
  re-probed after CDN propagation).

## [0.4.8] — 2026-09-26

### The King's seven orders, executed
- **Share row rebuilt** (his order: "not aligned well, asin centered, also
  add svg"): `justify-content: center` at every width; on phone the wrapped
  pills center per line with `row-gap` and the label leaves the flex line
  (visually hidden, still in the a11y tree). All four buttons carry inline
  14px SVG glyphs — X and LinkedIn reuse the footer's own brand paths,
  WhatsApp is the simple-icons mark, Copy Link an in-house chain glyph —
  plus aria-labels. `.share-b` is now inline-flex with 6px icon gap.
- **"Add to Google News" removed** (his order: "it's useless"): both
  anchors, the gnews icon, the four dead `.fgooglenews` CSS rules, and the
  home.css flex-wrap reference — zero occurrences anywhere in src/ or the
  served bytes. Footer gate now asserts ABSENCE.
- **Author reply auto-approves the parent** (his order from the queue
  screenshot): `POST /api/moderation/reply` now flips a pending parent to
  approved the moment the King answers it — the conversation publishes
  itself. Response carries `parent_auto_approved` + the fresh parent row;
  the desk note explains what happened. Proven end-to-end on live D1 with
  seeded rows (seed → pending → desk reply → parent auto-approved → public
  thread shows both), cleaned up after. Worker `bf4498c4`, smoke 60/60.
- **"Updated" meta restored**: the showcase post was heavily edited after
  publish, so its frontmatter now carries `updated: 2026-08-19` (WP's real
  modified date) and the article renders "Updated Aug 2026" per
  single.php:98. The other 7 posts were never edited post-publish — WP
  shows no updated chip for them either (day-precision rule).
- **Comments hover-kill transcribed verbatim** (his order: "remove that
  ugly hover… the WP site solved this"): the theme's v1.0.151 block
  (style.css:2497-2515) the port had never transcribed — plugin blue card
  lift, author-link flips, summary bg, option transform, reply/view/
  sort/logout/load-more hovers — all neutralized to resting state.
  Focus-visible and :active press feedback kept (a11y intact). Nested
  threads verified already-correct by probe: 22px indent + 2px thread
  line, transparent chrome-less reply cards, 32px avatars, reply form
  breaking out of the indent chain — byte-identical nesting rules to the
  live WP override.
- **Lightbox: no port bug** — probe-proven the only non-zooming images
  are the two authored `alt=""` decorative ones (cover background,
  media+text), which the theme's isPresentational guard deliberately
  excludes — identical behavior on live WP.
- **Desk breathing room** (his order: "no space between the header and the
  first two text elements"): `.mod-wrap` top padding 28px → 44px.

### Evidence
- Gates 5/5 green (147/147 article, 64/64 footer — both evolved to pin the
  NEW truth: centered+iconed share row, gnews absent, 8 footer icons).
- Served-byte proofs on godschi10.github.io: aria-labels ×3 + 4 inline
  SVGs in the share row; zero gnews bytes; "Updated Aug 2026" meta;
  `padding:44px` desk wrap; hover-kill rules in the served CSS.
- Render probe @390px: share row centered on both wrapped lines, 4 icons
  at 14px, label out of flow; desk content 84px below the sticky header.
- main `0001f2b` → pages-dist `41b252e` (Pages `built`), Worker
  `bf4498c4`.

## [0.4.7] — 2026-09-26

### The King's four orders, executed
- **Real comments live**: 41 genuine reader comments + 127 reactions imported
  from the WP SQLite snapshot into production D1 (WP id + 1000; the King's
  own test/agent threads excluded, his live pending comment preserved as
  id 17). Verified on the wire: real names, real reaction tallies, relative
  dates, SHA-256 gravatars across all 8 articles.
- **Moderation desk**: Worker gains the desk API — `list` / `stats` /
  `action` (approve/spam/trash/restore; delete-forever only from trash) /
  `reply` (reply-as-author auto-approves), all Bearer-gated; `status`
  lifecycle column + index. New `/mod/` page: one unlock gate, Overview /
  Queue / All Comments tabs, action buttons derived from row status, post-name
  links, two-tap delete confirm, phone-restore session law, version stamp.
- **Guest form exposed by default**: the Comment-as-Guest ceremony is gone;
  name + email render open with a quiet "never shown publicly" note. The
  reply-move and cancel paths never collapse the form.
- **Faster**: the 153KB client module is lazy — zero requests until Load
  Comments is clicked (one press, replayed via `__vibeLoadRequested`);
  the per-view count fetch now waits for scroll proximity (IO); the count is
  baked at build. UX-audit upgrades: count-bearing trigger label
  ("Load 6 Comments"), comment-shaped skeleton on click (reduced-motion
  honored), email-why hint.

### Evidence
- Gates 5/5 green, article gate 147/147 (contract updated: exposed form,
  lazy single-bind, desk-era gold skin).
- Real-Chrome CDP proof on the public URL: 0 module scripts before click →
  1 press → 6 real comments (Chiamaka O., Tunde Bakare…), skeleton retired,
  heading "6 Comments", 42 reaction elements, guest form `display:grid`,
  desk lock + wrong-token rejection + version stamp.
- Served bytes byte-identical to dist; Worker endpoints live (stats: 41
  approved / 1 pending / 127 reactions; delete-guard 400; reply-as-author
  auto-approved then probe rows cleaned).

### Added
- **The comments surface — the King's own vibe-comments UI, live against a
  Cloudflare Worker** (plan `docs/port/15`, integration `docs/port/17`). The
  comment area now renders in WordPress's own position — inside
  `.comments-area.mt48`, after the related posts and before the mobile
  newsletter (`single.php:212-226`) — and talks to
  `https://comments-api.gwill.workers.dev` instead of WP admin-ajax.
  - `src/components/VibeComments.astro` — byte-faithful port of the plugin's
    `templates/comments.php` guest path: every id and class matches the source,
    and the click-to-load shell is preserved (zero requests until the reader
    asks for comments).
  - `src/scripts/vibe-comments.js` — the plugin's OWN 3,087-line client script
    with only its transport seam patched: **233 changed lines**. The render
    core, markdown-lite pipeline, i18n dict, draft autosave, char counter,
    relative-time sweep and guest-identity rail are verbatim. No admin-ajax,
    no nonce; the slug replaces the numeric post id; only the v1 inits boot.
  - `src/styles/vibe-comments.base.css` + `.gold.css` — the two shipped
    sheets, byte-identical (40,720 B / 24,412 B), in the theme's cascade order:
    plugin sheet first, our override second (`inc/enqueue.php:491-505`).
  - Build-time comment count (parity: WP bakes the stored count), non-fatal
    with a 0 fallback — the heading hides itself at zero through the plugin's
    own `:empty` rule.

### Held — absence, never a dead control
- The reply-push opt-in, the email opt-in and the `.vibe-or` separator are
  **removed**, not inert: the port has neither rail in v1 (plan §6).
- The sort toolbar stays **hidden**: WP ships that markup hidden and reveals it
  only from the P2 sort code, so v1 must not reveal it either (it would put an
  inert sort button on screen).
- No WP-login and no Google button — declared divergence, no WP auth behind a
  static site.

### Fixed (Worker side, found by comparing against live WP's own payload)
- **Gravatar URLs were MD5 with `s=64`.** Live WP runs WordPress 7.1, whose
  core hashes the address with `hash('sha256', strtolower(trim($email)))` and
  is called as `get_avatar_url($email, ['size' => 48])`. The Worker now stores
  and emits the SHA-256 digest with `?s=48&d=wavatar&r=g` — byte-identical to
  what the plugin emits. The hand-written MD5 helper is deleted (40 lines of
  dead crypto).
- **`date` was an ISO timestamp.** The plugin's payload carries WP's
  `human_time_diff()` string ("2 weeks ago"); the Worker now ports
  `human_time_diff()` and `gmdate('Y-m-d H:i:s')`, and the wire object carries
  the same 20 keys as live.

### Verified
- Article gate: **147/147** (was 124) — 24 new assertions for presence, WP's
  render position, cascade order, byte-faithful stylesheets, the live Worker
  base, the holds staying absent, single-bind, and the served bytes.
- Worker: **60/60 against the deployed URL**, now asserting the wire parity
  above alongside the existing approve-first, reactions, antispam, HMAC and
  CORS checks.
- Real Chrome at 390px: collapsed shell → Load Comments → live fetch → submit
  → "pending review" → approved → the card renders (author, gravatar, 7
  reaction controls, reply affordance, relative time) with **0 JS errors**.

## [0.4.5] — 2026-09-25

### Fixed
- **"Why is TOC showing &amp;"** (King, screenshot img_febf26ee0d1b) — the
  raw-HTML TOC extractor kept entity-encoded heading text, and Astro escaped
  it a second time, so the phone TOC printed `&amp;amp;` (visible as `&amp;`).
  Live WP's DOM textContent is entity-decoded and escaped once on output;
  the port now decodes (`< > " &#39; &#x27; &#x3D; &amp;`) before
  Astro escapes once. Dist bytes for all four ampersand headings now equal
  live WP byte-for-byte. Gate: 4 new assertions (decode helper present,
  ampersand unescape single-pass, no `&amp;amp;` in served dist, all four
  headings single-escaped) — 124/124.

## [0.4.4] — 2026-09-24

### Fixed
- **"Subtitles and posts meta are too close"** (King, screenshot
  img_30a2b4d4b69e) — the post deck (`.art-sub`, the net-new subtitle
  element from docs/port/08) had `margin-top: 16px` and **no
  `margin-bottom`**: its last line sat 0px on the author pill. Given the
  theme's own callout rhythm — the disclosure is `class="discl mb24"` —
  the deck now carries `margin-top: 24px; margin-bottom: 24px`, symmetric,
  matching `.mb24`/`.mt24` scale. Measured at 390 dark after the rebuild:
  title→deck **24px**, deck→meta **24px** (was 20 / 0).



**King's verdict on v0.4.2: "Why do I have to press the × twice to close?" +
"You still didn't fix the spacing issue, these elements are too close to each
other."** Both real; both root-caused with measurements; both fixed.

### Fixed
- **Double lightbox (× twice)** — the port bound the lightbox TWICE: the
  v0.4.2 verbatim `src/scripts/lightbox.js` import AND a full folded copy
  (§11, 211 lines) inside `article.js`. Two document-level click listeners →
  two stacked `.gl-overlay` per click → × closed only the top one. The folded
  copy is removed with a tombstone comment; the theme's architecture (lightbox
  as its own enqueue, `main.js` with no lightbox section) is now the port's.
  Proven: one click → `overlays: 1, open: 1`; one × press → `gl-open` gone,
  body scroll unlocked.
- **Spacing utilities were never extracted** — the theme's §48 LAYOUT
  UTILITIES (style.css:2966-2982) landed only partially (`.con/.g2/.g3/
  .sb-layout`); `.sg .mt20 .mt40 .mt48 .mb12 .mb20 .mb24 .flex .aic .jsb
  .g16 .fw3 .fz11/12/14 .cm-c .cd .lh .cl-layout` were missing from the
  served bundle on ALL 54 pages. Result: the disclosure sat flush on the
  body (0px vs live's 24px), the author box lost its 20px top gap, related
  lost its 40px. Installed GLOBALLY in base.css (the theme ships them in the
  one global stylesheet; 14 non-article page templates use them too).
  Measured after the fix, port vs live at 390 dark: toc→discl 20/20,
  discl→body 24/24, body→share 28/28, share→abio 20/20, abio→related 64/64 —
  **0 divergent pairs**.

### Note
- The v0.4.2 spacing matrix measured box HEIGHTS (all matched); margins
  between boxes were the untested dimension — the gap chain probe is the new
  acceptance instrument, and the gate now asserts the utilities' presence in
  the global sheet.



**King's verdict on v0.4.1: "Still highly unfinished, so many issues, lightbox
doesn't even work. Some elements aren't spaced enough." + "And no featured
images on posts."** All four measured against live WP; all real, all fixed.

### Fixed
- **Lightbox** — the theme's `assets/js/lightbox.js` (266 lines, enqueued on
  every singular page since enqueue.php:170) was never ported, and the `.gl-*`
  base CSS slice (style.css:2192-2237) was missing from the extracted
  article.css (only the 767px overrides had survived). Both ported verbatim;
  the `GwillLightbox` i18n object is printed exactly as `wp_localize_script`
  emits it. Proven with real input at 390 dark: click → overlay opens (opacity
  1, rgba(0,0,0,.92), z-index 99999, backdrop blur 8px, counter "1 / 4", the
  figure's caption, focus on .gl-close, body scroll locked); Esc → closes and
  returns focus to the triggering image; ArrowRight → 1/4→2/4 swapping to the
  next gallery image; Enter on the focused image opens it too. Rule-diff
  script: every `.gl-*`/`.art-cover` selector present, matching declarations.
- **Featured images** — the port's articles carried no image data at all. Live
  WP gives every post a category-art cover (verified: showcase and four probed
  live articles all render `.art-cover`). Schema gained
  `image`/`imageAlt`/`imageSrcset`; all 8 articles now map to the same category
  art WP serves; `.art-cover` renders WP's `get_the_post_thumbnail('gwill-hero')`
  markup (single.php:106-120); `inc/card-media.php` ported with BOTH branches —
  homepage grid 8/8 image cards, 0 emoji fallbacks (previously 8/8 emoji).
- **Author bio height (+19px)** — the port's authored bio was longer than the
  live ACF bio. Byte-matched to the live text ("Web developer and finance
  writer. I build this site and write everything on it. I test every app
  before recommending it. Based in Nigeria.") — abio 197→178px.
- **Spacing, measured** — port vs live at 390/768/1280, light+dark: cover,
  disclosure, TOC and share-row heights identical at every width; all
  remaining top-offsets trace to the declared subtitle divergence (live's
  title carries the "— Every Block Styled" suffix and wraps two lines; the
  port splits it into title + subtitle) and to different related-post sets —
  content flow, not styling.

### Added
- 12 new upload assets (banking/remittance/showcase ×4 sizes each) so every
  cover and card is served locally; no hotlinking.

**King's verdict on v0.4.0: *"Terrible spacing in so many places. Table is not
styled properly, so many elements were not ported and styled properly."* He was
right; measuring against his four screenshots found four real defects, and his
standing order — port the WordPress `gutenberg-elements-showcase` post so every
block style is exercised — is what exposed them.

1. **Tables rendered completely unstyled.** Markdown emits a bare `<table>`;
   Gutenberg (and this theme's `style.css:896-924`) always wraps tables in
   `<figure class="wp-block-table">`, which owns the border, radius, `thead`
   tint, cell padding and the thin gold scrollbar. Measured before the fix:
   `thPad 0px, tdPad 0px, border-collapse: separate`. New rehype plugin
   `scripts/rehype-wp-table.mjs` inserts exactly WordPress' wrapper
   (`[rehypeSlug, rehypeWpTable]`). After: table geometry identical to the
   live WordPress showcase at 390/768/1280, light *and* dark.
2. **`assets/css/embeds.css` was never ported** — a stylesheet outside
   `style.css` that `enqueue.php:471` loads on every singular page. Without it
   the click-to-play facade sat in normal flow: YouTube/Vimeo facades measured
   42px too tall at every width, Spotify collapsed to 42px instead of its
   152px box. The JS was already ported; only the CSS was missing. Now imported
   by `[slug].astro`; facades measure identical to WordPress.
3. **Desktop cascade order wrong at ≥1024px.** The theme places its
   `min-width: 1024px` block *before* the base `.art-body` rules, so on the
   live site the base shorthand WINS for lists and blockquotes
   (measured at 1280: `ul/ol margin 0 0 16px 20px`, `blockquote 18px`). The
   port had the media block after the bases, shipping `18px 0 22px` /
   `30px 0` — four margins WordPress never serves. The block now sits in the
   theme's source position, and source order itself is a gate assertion.
4. **The showcase page had no TOC on the port.** Astro's markdown `headings`
   cannot see headings inside raw HTML blocks; WordPress builds the TOC from
   the RENDERED content (`inc/table-of-contents.php` DOMXPath `//h2 | //h3`).
   `[slug].astro` now falls back to the theme's own pass over the raw body —
   11 rows render, matching WordPress' row heights.

Plus: the showcase post itself is ported as content — all 40 top-level blocks
byte-captured from the live page (headings, lists, quote, pullquote, table,
code, preformatted, verse, image, gallery, three embed facades, cover, columns,
media+text, buttons, details, search, categories, archives, social links,
latest comments), with its 16 image assets downloaded locally under
`wp-content/uploads/` so no page hotlinks the WordPress origin. Block-for-block
geometry diff vs the live post: **42/42 blocks, zero differing fields at
390/768/1280**. And the byline now mirrors `get_the_author()`'s display name —
**"G-will Chijioke"**, as the live site renders it, not the site title's
"Gwill Chijioke" (measured in both sites' meta pills and author boxes).

Gate: `check-article-fidelity.mjs` 79 → **106 assertions** (table wrapper,
embeds stylesheet, media source order, showcase block inventory). All 5 gates
green. King's meta-row screenshot (wrapped read-time + orphan separator dot at
a very narrow viewport) was measured on WordPress too: at 320px both sites wrap
h=64 with the dot orphaned — theme behaviour, faithfully ported; a joint
theme-level fix is offered separately rather than diverging the port alone.

## [0.4.0] — 2026-09-23

**The article page is now a port of `single.php`, not a page in the theme's
general idiom.** King's correction — *"you only focused on the subtitles, why
didn't you port the rest of the blogpost template"* — was right: the previous
article page shared almost no class vocabulary with WordPress, so nothing on it
could be checked against the original.

The class names are now WordPress's, which means the theme's own stylesheet
applies to the markup unchanged:

- **Markup** — `.art-hd` header (`.bc` breadcrumb → `.badge` → `h1.art-t` →
  subtitle → `.art-meta`), `.prog > .prog-f` progress, `.con` container,
  `.sb-layout` two-column grid, `.art-reading-surface` → `.art-surface-pad`,
  the mobile `.toc-dropdown.toc-mobile` with its `.toc-summary`/`.toc-caret`/
  `.toc-list`/`.toc-sub`, `.discl.mb24`, `.art-body`, `.share-row` with all four
  controls, `.abio.mt20`, the `.mt40`/`.shd`/`h2.stitle`/`.g2` related block,
  `.m-nl-wrap`, and `aside.article-sidebar[position:sticky;top:72px]` with its
  three `.sw` cards.
- **Copy** byte-exact, punctuation included: the affiliate sentence with its
  period inside `<strong>`, `In this article` (lower-case) in the mobile summary
  against `In This Article` in the sidebar, `Weekly digest.` in both newsletter
  blocks, the ⚠ at U+26A0, `Read →`, `{N} min read`.
- **Removed**: the invented `.art-h`, `.disc-box`, `.author-bio`, `.art-main`,
  `.art-side`, `.legal-toc` article sidebar, `.art-hero`, the `.progress`
  bar, and the *"Comments — read-only in v1"* staging notice — the kind of
  visible placeholder the porting rules forbid.
- **New components**: `NewsletterForm.astro` (the theme's partial, with the id
  passed in the way `wp_unique_id()` varies it) and `AuthorSocials.astro`, a
  **generated** file whose seven inline SVG icons are lifted verbatim from
  `inc/author.php` rather than hand-copied.
- **New files**: `src/styles/article.css` (the article slice of the theme's
  stylesheet, verbatim, with `style.css` line provenance) and
  `src/scripts/article.js` (progress, TOC scroll-spy, mobile dropdown, copy
  button, comment-ad cloning — ported from the theme's `main.js`).
- **Heading ids are server-rendered now.** WordPress injects them on
  `the_content` at priority 9; `rehype-slug` does the same at build time, so the
  TOC anchors exist in the served HTML and the old client-side id-patching hack
  is gone.
- **No `.art-cover`** — WordPress emits it only with a featured image, so with
  no featured image the correct behaviour is to omit it. **No ad slots** and
  **no `.comments-area`**: WordPress emits nothing for the former when no ad
  code is configured, and the latter needs a comment backend this build does not
  have (a posting form that cannot post would be a fake control).

**Three real divergences found by measuring against the live article, all
fixed:**

1. The copy button was 30px tall against WordPress's 27px, because an invented
   `button { font: inherit }` forced `line-height: 1.6` onto every button.
   WordPress leaves the browser default (`normal`) in place. Fixed globally and
   verified: every homepage button now matches WordPress exactly
   (`.btn b-gold b-sm` 32px/17.6, `.gwill-form__submit` 46→48, `.fpush` 40/13),
   at the cost of 3–4px of homepage document height — movement toward
   WordPress, which is why it stands.
2. The port's own `.art-body` prose (`max-width: 72ch`, `margin-top: 12px`, and
   a gold `h2::before` bar WordPress does not draw) leaked into the article page
   from `Layout.astro`. Moved verbatim to `src/styles/prose.css`, imported by
   about and contact only; both pages measure identical afterwards.
3. Two tokens the theme's `.brd` badge needs (`--red-muted`, `--red-border`)
   were never installed; the port had only `--red` and its own literal-rgba
   copy. The theme's values are installed and the duplicate rule removed.

**Evidence** — `docs/port/10-article-template.md`, specs in
`~/work/article-port/`, measurement runs in `~/work/regression/`. Behaviour and
geometry compared against the live WordPress article at 390/768/1280: identical
font sizes, line heights, letter spacing, colours, avatar sizes, disclosure
chrome, share-button chrome, sidebar padding/radius and grid columns. The
dropdown's default state, click state and stored value match. The only
differences are content-driven and listed in the doc (longer title, no
`Updated` fragment on this post, longer bio).

4. The related block showed **3 cards where WordPress showed 2**.
   `relatedTo()` appended other-category posts after the same-category matches,
   so every article always filled three slots. `gwill_get_related_posts()`
   queries the **primary category only**, capped at 3, and `single.php` falls
   back to the **2 most recent** posts only when that returns nothing. Fixed and
   verified across all seven articles: each now renders
   `min(same-category, 3)`, or 2 when its category has no siblings — which is
   why the live WordPress article shows 2.

Gate: `check-article-fidelity.mjs` grew from 22 assertions describing the stub
to **80 describing WordPress's contract**; all 5 gates green.

## [0.3.4] — 2026-09-23

**Base layer completed, and proven layout-neutral** — the last unported rules from
the theme's `RESET / BASE` section (`style.css:170-199`). The header, footer and
homepage ports each measured their own surface in isolation and deliberately left
this layer out; parity on the single-post page (in progress) requires the theme's
base underneath it, so it lands first.

Installed verbatim in `src/styles/base.css`, from `style.css:184, 185, 189`:

- `img, picture, video, canvas, svg, iframe, input, textarea, select, table { max-width: 100% }`
  — the port capped only `img`, so an oversized embed, video or data table could
  overflow a phone column. The theme never lets that happen.
- `img { height: auto; display: block }` — removes the inline baseline gap the
  theme does not have under figures and card images.
- `h1, h2, h3, h4 { letter-spacing: -0.02em }` — the theme's global heading
  tracking; any heading carrying its own tracking still wins on specificity.

Already installed by the v0.3.1 pass: `*, *::before, *::after { box-sizing:
border-box; margin: 0; padding: 0 }`, `a { text-decoration: none; color: inherit }`,
`button` / `input, select, textarea { font-family: var(--font) }`,
`.skip-link` / `.screen-reader-text`, and `html { scroll-behavior: smooth;
scroll-padding-top: … }`. **M-BASE-LAYER is closed.**

**Evidence that it moved nothing** — the same commit was built twice (CSS at `HEAD`,
then CSS with the three rules), the two trees served on separate local origins, and
measured over 15 page/width combinations (home, `/articles/`, a real article, about,
affiliate disclosure × 390/768/1280):

- the served byte diff is exactly **+143 bytes** — the three rules and nothing else
- the layout diff is **0 fields across all 15 combinations**: document height,
  horizontal overflow, section offsets, heading tracking and underlined-link count
  all identical
- `/ @768` reads 4209px on the new build, matching the live v0.3.3 baseline, which
  is what shows the agreement is real rather than a coincidence of two stale runs
- the port renders **no `<img>` elements** on those five pages today, so
  `display: block` is a no-op until the article port brings embedded media in

One outlier is recorded rather than smoothed over: the first old-build pass read
`/ @768` at 4159px against 4209px for the new build. Four repeat runs of that
combination on *both* builds read 4209 every time — a flaky render in the first
pass, not a layout shift.

Gates: 5/5 green (header 31, footer 18, homepage 123, article 22, vectors 95);
build 53 pages.

## [0.3.3] — 2026-09-23

**Article subtitles, designed into the theme's idiom** — King's order ahead of
the blog import: *"I want to add subtitles after the title, if you can design it
to match."*

WordPress has no post subtitle (`single.php` goes breadcrumb → badge → `h1.art-t`
→ `.art-meta`), so this is a net-new element rather than a port. It is built
**only from values the theme already uses**: supporting copy in the theme is
`font-weight: 300` in a dimmed colour, and its accent idiom for a passage that
stands apart is a **3px `--gold` left rule** — the treatment `.callout`,
`.art-body blockquote`, `.wp-block-pullquote` and `.tbl-best` all share.
The standfirst therefore takes 17px/300/`--text-mid`, line-height 1.6, a 62ch
measure, and that same gold rule with a 16px inset. No new tokens, no new
colours, no invented ornament.

- **Content model:** optional `subtitle` field in `src/content.config.ts`.
  The article page renders `subtitle` and falls back to `description`, so posts
  without an authored subtitle still show a complete header; `description` keeps
  its own jobs (card excerpt, search result, meta description, JSON-LD).
- **Placement:** `p.art-sub`, directly after `h1.art-h`, before `.feat-meta`.
- **Demonstrated:** the dollar-corridor article now carries an authored
  `subtitle` distinct from its excerpt, proving the field — not just the
  fallback.
- **Declared divergence:** the port now shows a line under titles that WordPress
  does not. Recorded in `docs/port/08-article-subtitle.md` so a later fidelity
  pass cannot "fix" it back out.
- **New gate:** `scripts/check-article-fidelity.mjs` — the article surface had
  **no contract gate at all** (header/footer/homepage did, article did not).
  22 assertions covering the title stack, the subtitle's placement, field and
  design contract, and the rest of the page. `npm run check` now reports
  **5/5 gates green**.
- Measured at 390/768/1280: 17px · weight 300 · line-height 27.2px · `--text-mid`
  · `border-left: 3px rgb(180,83,9)` · `padding-left: 16px` · `max-width: 632.4px`
  · 16px below the title · 5 lines at 390 → 3 at 768/1280.

## [0.3.2] — 2026-09-23

**The theme pill no longer jerks the page when tapped.** Reported from a phone:
"clicking on any darkmode toggle option jerks the page up."

The pill's JavaScript returned focus with a plain `.focus()`. The pill lives in
a sticky header, and the document carries `scroll-padding-top: calc(--header-h +
20px)` = 76px, so the browser scrolled the page to bring the focused segment
clear of that padding — **measured as a 19px upward jump on every tap** at
390px, and it happens on both paths: focusing the current segment when the menu
opens, and returning focus to the trigger after an option is chosen.

The theme already fought this exact bug and documented it in its own voice
(`assets/js/spotlight-search.js`, v1.0.199: *"plain .focus() scrolls the
sticky-header trigger into its DOCUMENT position, on Android Chrome this drags
the whole page up — browser-verified: 257px jump live"*). The fix is the theme's
fix: `focus({ preventScroll: true })` on all three focus returns in the pill
(open, option chosen, Escape). Arrow-key navigation keeps its plain `.focus()`,
matching the theme.

Verified with real taps against the rebuilt page at 390px: scroll 3000 → **3000**
on open (was 3000 → 2981), Dark applied with focus returned and no movement,
and a repeat at 4200 held at 4200. Focus return still works (WCAG 2.4.3) — it
just no longer moves the page.

### Added

- 2 assertions in `scripts/check-header-fidelity.mjs`: every focus return in the
  pill must use `preventScroll`, and no bare `sel.focus()` / `trigger.focus()`
  may reappear.

## [0.3.1] — 2026-09-23

**Phone-review fixes: the stray underlines are gone and the newsletter form is
styled.** Three defects reported from a phone screenshot, all three traced to
theme stylesheet sections the earlier scoped extractions could not see — the
homepage port was scoped to the sections the homepage renders, and the theme
styles anchors and form controls elsewhere.

### Fixed

- **Every link was underlined** — 79 of the homepage's 109 links. The theme
  resets anchors in its RESET/BASE section (`style.css:186`:
  `a { text-decoration: none; color: inherit; }`) and that layer had never been
  ported; without it, every link falls back to the browser default. The
  WordPress original measures 3 underlined links (the footer credit link and the
  cookie-consent policy link, both styled deliberately). The port now measures
  **2** — the credit link, twice, exactly as WP styles it. The banner's policy
  link is the third and arrives with the consent banner (footer part 2).
- **The newsletter email field was a browser-default box** — measured at 390px:
  `175×19`, radius 0, `2px` grey border, no padding, 13.33px text, against
  WordPress's `261×46`, radius `10px`, `1px` border, `12px 16px` padding, 16px
  text. The homepage rules only override that field's *colours*; its geometry
  lives in the theme's FORMS section. Now: `300×46`, radius `10px`,
  `1px rgba(245,158,11,0.4)`, `12px 16px`, 16px — WP's geometry, on our
  container width.
- **The newsletter's "Email" label was visible** — WordPress hides it with
  `.screen-reader-text` (base section, `style.css:191-198`); the placeholder
  already carries the meaning. Installed verbatim: the label measures `1×1`
  again.
- **The hidden "Subscribing…" label, the `[data-loading]` swap and the
  honeypot rule moved out of `home.css`** into `forms.css`, where the theme
  keeps them. Those three had been added to `home.css` as an ad-hoc patch — the
  reason they were ever missing is that they were the only part of that section
  anyone had noticed.

### Added

- `src/styles/base.css` — the theme's RESET/BASE rules the port was missing
  (`style.css:172-198`), scoped deliberately: antialiased text, the anchor
  reset, control font inheritance, and the visually-hidden utility. The theme's
  element resets that would re-flow pages already verified and reviewed
  (`* { margin: 0; padding: 0 }`, `img { display: block }`, `max-width: 100%` on
  img/iframe/table, heading letter-spacing) are **not** included; that debt is
  tracked as **M-BASE-LAYER** in `PENDING-WORK.md`.
- `src/styles/forms.css` — the theme's FORMS section verbatim (`style.css:2883-
  2948`): control geometry, label styling, focus ring, autofill guards, the
  brand select chevron, submit base + hover + loading states, status and
  field-error chrome.
- **17 new gate assertions** in `scripts/check-homepage-fidelity.mjs`
  (**123 total**), each pinning one of the moved or added rules in the file that
  now owns it — plus assertions that the anchor reset is present and that no
  underline declaration creeps back into the base layer.

## [0.3.0] — 2026-09-22

**The homepage is ported.** `front-page.php` sections 2–8 — the hero, the stats
strip, the featured article, the latest grid, the category pills (with their
filter), the ad slots and the newsletter band — now render from Astro with the
theme's own class vocabulary, copy and CSS. The old homepage's invented markup
(`.ledger`, `.card`, `.chip`, fake ad notices, a count-up animation and a
placeholder newsletter) is gone.

### Added

- `src/pages/index.astro` — the homepage in WP's vocabulary: `.hero` /
  `.hero-grain` / `.hero-tag` / `.hero-h .g`+`.w` / `.hero-acts` with the real
  `.bh` and `.bhg` CTAs, `.stat-strip` with four `.si`, `.feat` with
  `.feat-meta`, `.g3` of `.ac` cards, `.cp-strip` pills, an empty `.ad-bg`, and
  `.nl-s` with WP's actual `.gwill-form` newsletter markup.
- `src/components/ArticleCard.astro` — the card anatomy from
  `template-parts/content.php` + `inc/card-media.php`: `.ac`, `.ac-img`, the
  no-thumbnail branch (`.ac-emoji` + the category art class), `.badge` in the
  theme's per-category colour, `h2.ac-t`, `.ac-ex > p`, `.ac-ft` with `.a-dt`
  (`M Y · n min`) and `.a-rd`.
- `src/styles/home.css` — the homepage slice of the theme stylesheet in source
  order: 191 rules, every media context (`print`, `@supports not
  (aspect-ratio)`, touch, `prefers-reduced-motion`, 767/1023/1024+), and the
  custom properties they depend on.
- `scripts/check-homepage-fidelity.mjs` — **106 assertions** covering section
  order, class vocabulary, byte-exact copy, the pill/filter contract and the
  stylesheet values, wired into `npm run check` (now 4/4 green).

### Fixed — every one of these was found by measuring, not by reading

- **The legacy stylesheet out-voted the theme.** `Layout.astro`'s
  `<style is:global>` is emitted *after* the imported CSS, so the homepage's old
  rules beat the ported theme for the same selectors: `.con` was
  `calc(100% - 32px)`, `.g3` had `gap: 24px`, `.feat` was `1fr 1.4fr` and
  `.cp.on` was dark. 50 legacy rules removed; the theme's values now win —
  the 1280 grid measures `324px 324px 324px` gap 16px and the featured
  `501px 501px`, exactly WP's.
- **`--con-pad` had no responsive values.** WP shrinks it 48 → 28 → 20px;
  the port only carried 48, making every container 16–64px too narrow. Added.
- **Three category badge values were wrong in the port's own data.**
  `investing` → `bgn`, `remittance` → `bsl`, `dollar-accounts` → `bg`; the chip
  tints (`.db-g/.db-gr/.db-p/.db-s`) were missing entirely.
- **The newsletter button rendered both labels** — "Subscribe Subscribing…" in a
  198px button where WP measures 105px. The hide rule lives in the theme's FORMS
  section, outside the homepage scope the extraction covered.
- **The honeypot was visible.** `"Leave this blank"` printed in the form because
  `.gwill-honey`'s off-screen rule (`style.css:2948`) was in that same missed
  block. Now `left: -9999px`, `opacity: 0`, `height: 0`.
- Both missed rules were added to `home.css` as a documented port addition and
  are pinned by assertions.

### Divergences (deliberate, reasoned)

- **No AJAX.** WP swaps the grid through `admin-ajax.php`
  (`action=gwill_filter_posts`); a static build has no endpoint, so the filter
  produces the identical visible result locally — same active pill, same
  `aria-pressed`, same empty-state copy, no network call, no spinner. WP's own
  two bugs in that path (`cache['']` always refetching, and the empty category
  dropping the `.g3` wrapper) are not reproduced.
- **The newsletter form does not fake a subscription.** It stays pixel-identical
  to WP's, validates the address the same way, and on submit says the list is
  not open yet instead of redirecting to `/newsletter-thanks/`.
- **Ad slots render empty, as they do live.** `gwill_ads_enabled` is true but
  every ad code is empty, so WP emits wrappers and zero `.ad-slot` nodes and
  reserves 0px. The port matches that exactly, with no placeholder text.
- **Cards carry this repo's own articles** (7 with a category chip, vs WP's 9).
  The grid, the featured pick (`FEATURED_SLUG`, the theme-mod article) and every
  class come from WP; the content is the port's.

## [0.2.0] — 2026-09-22

**The footer is ported.** `footer.php` sections 2–5 — the desktop grid, the follow
CTAs, the social nav, the bottom bar, and the phone-only `.mfooter` — now render
from Astro, with the same visibility switch the header uses (`.footer` hidden at
≤767px, `.mfooter` hidden at ≥768px).

### Added

- `src/components/Footer.astro` — desktop and phone footers extracted against
  theme 1.13.39: the brand block and blurb, the four link columns of
  `inc/footer-links.php`, the network column, the four socials, the bell /
  Google News / install CTAs (including the iOS "Add to Home Screen" guide), the
  legal + credit bottom bar and the `#top` back-to-top link. Every icon is the
  theme's own SVG, copied verbatim.
- `src/styles/footer.css` — 94 lines, 65 rules: the footer's slice of stylesheet
  section 19 plus every media query and touch rule that touches those classes,
  declarations and breakpoints intact, and the custom properties it depends on.
- `scripts/check-footer-fidelity.mjs` — **64 assertions** against the WP source:
  markup structure and copy, class-by-class CSS values, the responsive contract,
  the icon-escape guard and the print rules. Wired into `npm run check`
  (now 3/3 green).

### Fixed — both found by measuring, not by looking

- **Four footer icons were rendered as literal text.** `{ICON.bell}` — and the
  install, iOS and Google News glyphs, in both footers — were interpolated
  without `set:html`, so Astro escaped them and the buttons printed
  `&lt;svg …&gt;` on the page. The bell measured 320×178 instead of 234×40. All
  ten icon interpolations now use `<Fragment set:html={…} />`, and the gate fails
  if a bare `>{ICON.x}` ever comes back.
- **A tablet rule was missing.** WP section 49's `@media (max-width: 1023px)
  { .footer { padding: 36px var(--con-pad) 20px } }` was not ported — 12px of
  extra height at 768px. A rule-by-rule diff of every footer selector against
  `style.css` is what caught it; it located nothing else in scope.
- **The bell no longer pretends to subscribe.** There is no push service behind a
  static build, so tapping it appends the theme's own inline-note style
  explaining that push needs a backend. `PUSH_ENDPOINT` is the single switch.
- Touch rule ported: `@media (hover: none) { .fsoc .soci:hover … }` (WP §54), so a
  tap on a social button no longer leaves the hover style stuck on a phone.

### Verified — measured against the live WordPress footer

| Viewport | `.ftop` grid template | `.fpush` | `.fgooglenews` | `.soci` | `.fbot` | overflow |
| --- | --- | --- | --- | --- | --- | --- |
| 1280px | `435.188px 217.609px 217.594px 217.609px` — identical | 234×40 | 203×40 | 34×34 | 1184×37 | 0 |
| 768px | `340px 340px` — identical | 234×40 | 203×40 | 34×34 | 712×65 | 0 |
| 390px | 2×2 `165px 165px`, `.mfgrid` 350×290 — identical | 234×40 | 203×40 | 34×34 | — | 0 |

Footer height: **461px at 1280** and **667px at 768** — exactly WP's own CSS
arithmetic (48 + 312 + 40 + 37 + 24, and 36 + 506 + 40 + 65 + 20). Two explained
deltas versus the live site:

- the live site's docked ad bar zeroes the footer's bottom padding
  (`body.ad-sticky-bottom`), so it measures 20–24px shorter; the port has no ad
  bar and keeps WP's designed padding;
- on a phone the port's install CTA is genuinely visible (Chrome fires
  `beforeinstallprompt` — the build is installable), which adds one 40px row plus
  the 10px gap. WP's headless render never qualified for it.

Screenshots: `docs/evidence/footer-port-{390,768,1280}.png`. Full record:
`docs/port/05-port-verification.md`.

### Not ported (deliberate)

Footer sections 6 (consent banner) and 7 (sticky ad bar), the bell's push panel,
the `.fs-lg` font-scale variants and the `no-flex-gap` Safari-14 fallbacks — all
need a service a static build lacks, or are inert without the JS class the WP
theme adds. Tracked in `PENDING-WORK.md`.

## [0.1.3] — 2026-09-22

### Fixed

- **On phones the popover came up icon-only — no words.** The
  `@media (max-width: 480px)` rule that hides the *trigger's* text was written as
  `.tp .tp-tx`, which also matched the three option rows inside the popover. On a
  handset the dropdown therefore showed three unlabelled icons. The rule is now
  scoped to `.tp-btn .tp-tx`: the trigger stays compact (icon + caret) while
  **System / Light / Dark stay readable inside the popover**. Reported after
  checking on a phone.
- Gate: new assertion pins the text-hide to the trigger, so `.tp .tp-tx` cannot
  come back.

### Verified

- 360 / 390 / 480px: all three option labels `SHOWN`; trigger label hidden as
  designed; popover 134px wide, fully inside the viewport; horizontal overflow 0.
- Screenshot: `docs/evidence/theme-menu-390-labels-fixed.png`.

## [0.1.2] — 2026-09-22

Theme control rebuilt as a single button. Requested change: one button, default
**System**, click to open — without losing any dark-mode feature or adding weight
to the page.

### Changed

- **One button instead of a three-segment pill.** The header used to render
  Dark · System · Light side by side in both headers. It is now a single compact
  pill showing the *current* choice (monitor / sun / moon icon + label) which
  opens a small popover containing the three options, System first.
- **Default is System**, unchanged: no stored key means "follow the device", and
  the trigger shows the monitor icon and the word *System* out of the box.
- **Same engine, same storage.** Still `gwill-finance-theme-v3`; still the inline
  pre-paint restore in `<head>` (so no flash of the wrong theme); System still
  tracks the OS live through the existing `prefers-color-scheme` listener, and a
  pinned Light/Dark still ignores the OS. No feature was dropped.
- **Keyboard support extended, not reduced.** With the menu closed the arrow keys
  still cycle the theme (legacy behaviour); with it open they move the focus ring
  and never change the theme. Escape and outside-click close it; the choice
  returns focus to the trigger.
- Active row now uses the brand amber (`--gold-b`, the accent used by the
  headline and stat numbers) in both themes, instead of the light-mode burnt
  orange, and the popover is sized to its trigger (`min-width: 100%`) so the two
  are flush; the panel radius is 12px so the 6px rows nest concentrically.

### Added

- Two gate assertions: exactly one theme trigger per header with the menu closed
  by default, and the popover styled + `hidden` until opened.
- `docs/evidence/theme-menu-{light-1280,dark-1280,dark-390}.png`.

### Verified (Chrome for Testing 153, CDP)

- One button per header; `aria-expanded="false"`, `aria-haspopup="true"`, menu
  `hidden` at first paint; label `System`; theme follows the OS (light here).
- Click → opens: `data-open="true"`, `display:flex`, `z-index:60`, focus lands on
  the current option, popover fully inside the viewport.
- Pick Dark → `data-theme="dark"`, storage `dark`, label/aria/label icon update,
  both headers' pressed state sync, menu closes, body background flips to ink.
- Reload → still dark, label `Dark`, menus closed (persistence intact).
- Pick System → storage key **removed**, theme matches the OS.
- **Forced-dark OS preference, no stored key** → page painted dark
  (`prefers-color-scheme: dark`, `data-theme="dark"`, no storage key): the System
  default genuinely follows the device.
- Escape closes; outside-click closes; 390px mobile variant opens 134px wide,
  fully inside the viewport, zero horizontal overflow, icon-only trigger with the
  label hidden as designed.
- Geometry: trigger and popover both 118px wide, identical left/right edges
  (922 → 1040) at 1280px.

### Cost

- Inline markup + CSS + ~45 lines of vanilla JS. **No new network request, no
  library, no build change** — the control is parsed with the document it already
  lived in.
- Measured transfer delta on the served page: 86,061 → 92,492 bytes raw and
  **19,288 → 20,413 bytes gzipped (+1.1 KB over the wire)**; resource requests
  unchanged at 5.

## [0.1.1] — 2026-09-22

Header-fidelity release. Closes the responsive header defects found once a real
browser was available on this box, and fixes two gates that were certifying
nothing.

### Fixed

- **Duplicate headers on mobile.** The WP theme shows the desktop header (`.sh`)
  *or* the mobile header (`.mh`) per breakpoint — never both. The first port pass
  carried no visibility switch, so both rendered stacked on phones. Ported WP
  sections 50/51 into `src/styles/header.css`: `≤767px` hides `.sh`, shows `.mh`;
  `≥768px` hides `.mh` and the drawer.
- **Phantom horizontal overflow on tablet (288px).** At 768–1023px the desktop
  header row (`.snav`, 882px of links + theme pill + search + newsletter CTA)
  overflows the viewport. WordPress clips this on `body`; the port clipped only
  `html`, so the document advertised 288px of overflow that production does not
  show. Added `overflow-x: hidden; overflow-x: clip; overflow-wrap: break-word`
  to the `body` rule in `src/layouts/Layout.astro`, matching WP line-for-line.
  Verified against the live WP site: identical header geometry, and overflow now
  reports 0 at 390 / 768 / 1280 — same as production.
- **Tablet ticker ran at desktop height.** WP section 49 sets the ticker to 30px
  (with 16px item padding) on tablet; the port left it at the 36px desktop value.
  Ported into a new `@media (max-width: 1023px)` block in `header.css`.
- **`npm run check` died with `MODULE_NOT_FOUND`.** `package.json` pointed at
  `scripts/check.mjs`, which did not exist in the tree — so the documented gate
  ran nothing, on every release. Added `scripts/check.mjs` as an umbrella that
  runs each gate and propagates failure.
- **fx-history vectors failed a little more each day.** The PHP oracle windows on
  `strtotime('-N days')` (a live clock at generation), while the TS gate called
  `fxHistoryRange()` with the default `Date.now()`. The gate therefore compared a
  moving window against a frozen count and drifted daily (observed 16/76 against
  the oracle's 20/80 — 4 days behind). The engine already accepts a clock
  argument; the gate now pins `HIST_ORACLE_MS` to the oracle's generation instant.

### Added

- Two header-fidelity assertions covering the fixes above (body-level clip; the
  tablet ticker rhythm), so the gate cannot regress silently.
- `README.md` and this changelog.
- `docs/HEADER-FIDELITY-INDEPENDENT-REVIEW.md` — verification record with exact
  commands and results.
- `docs/evidence/` — rendered screenshots at 390 / 768 / 1280.
- `scripts/.vectors-bundle.cjs` is now gitignored; it is a generated artifact of
  `vectors-check.mjs`, not source.

### Verified

- `npm run check` → `check: PASS — 2/2 gates green` (header contract PASS;
  vectors `pass=95 fail=0`).
- `npm run build` → 53 pages, exit 0.
- Rendered matrix in Chrome for Testing 153 via `agent-browser` (CDP), cache-busted:
  | viewport | `.sh` | `.mh` | ticker | `--con-pad` / `--header-h` | overflow |
  | --- | --- | --- | --- | --- | --- |
  | 390×844 | hidden | flex | 28px | 28px / 56px | 0 |
  | 768×1024 | flex | hidden | 30px | 28px / 56px | 0 |
  | 1280×800 | flex | hidden | 36px | 48px / 64px | 0 |

  No duplicate headers at any width.

- **Live staging** (`pages-dist` `88b28d6`, GitHub Pages reported `built` for that
  exact commit): served bytes carry all three CSS fixes, and the same matrix re-run
  against https://godschi10.github.io/finance-astro/ returned identical numbers —
  overflow 0 at 390/768/1280, ticker 28/30/36px, no duplicate headers. Evidence
  shots: `docs/evidence/live-header-*.png`.

### Known gaps (not in this release)

- WP's `@media (max-width: 1023px)` block also carries non-header tablet rules
  (`.footer` padding, `.nl-s` row layout, `.hero`, `.hero-h`, `.feat`,
  `.stat-strip`, `.si` borders, `.art-surface-pad`). Only the header-related lines
  were ported here; the rest is a separate tablet-parity workstream.
- On tablet the WP theme clips the desktop header's right side (search + theme
  pill edge + newsletter CTA) at 768px. The port now reproduces this exactly,
  because parity is the target — noted so it is not mistaken for a port bug.
- `scripts/php-harness/vectors.php` hardcodes the old box's theme path and so
  cannot regenerate the oracle here without editing `$INC`.

## [0.1.0] — 2026-09-21

Initial port: 53 pages green — chrome, homepage, legal, 17 calculators, articles,
search, about/apps/contact, WP-parity header (`sh`/`mh`/`mno`/`gs`/`tp`).
