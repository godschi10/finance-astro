/* Legal-text dates. ONE constant, ONE place.
 *
 * WHY THIS IS A LITERAL AND NOT `new Date()` (SITE-4):
 * the privacy policy used to compute its date from the build clock, so every
 * build silently re-dated a legal document — a page nobody edited would claim
 * to have been reviewed in whatever month it happened to compile. A policy date
 * is a fact about the TEXT, so it moves when a human edits the text. It is
 * written down here, once, and rendered once.
 *
 * Deliberately NOT in src/data/site.ts: that module is rewritten on every build
 * by scripts/fetch-snapshot.mjs, which would drag a legal date back into the
 * per-build dirt and re-dirty the file on every commit.
 *
 * House rule that keeps this from rotting: this string appears EXACTLY ONCE in
 * the repository. Every page that shows a "Last updated" line imports it from
 * here. To update the date, change this line — do not type a date into a page.
 */
export const PRIVACY_LAST_UPDATED = "October 2026";