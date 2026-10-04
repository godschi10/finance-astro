#!/usr/bin/env bash
# Ship the Astro build to GitHub Pages (tribal deploy, encoded).
#
# Pipeline reality: `npm run build` renders 78 static pages to dist/ (gitignored).
# GitHub Pages serves them from the `pages-dist` branch checkout, which lives as
# a SEPARATE clone (default /home/opc/work/finance-astro-pages) — this repo's
# own branch is never pushed to Pages. This script: build → rsync → commit →
# push → poll the Pages build → curl-probe the served bytes.
#
# Usage: scripts/ship-pages.sh <version> <message...>
#   e.g. scripts/ship-pages.sh 0.7.15 "portability leg A: toolchain + manifest"
# Commit lands as: v0.7.15 — portability leg A: toolchain + manifest
#
# Env: PAGES_CHECKOUT (default /home/opc/work/finance-astro-pages).
# The MANAGER runs this. Do not run it from a worker leg.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PAGES_CHECKOUT="${PAGES_CHECKOUT:-/home/opc/work/finance-astro-pages}"
GH_REPO="godschi10/finance-astro"
SITE="https://godschi10.github.io/finance-astro"

if [[ $# -lt 2 ]]; then
  echo "usage: $0 <version> <message...>" >&2
  exit 2
fi
VER="${1#v}"; shift
MSG="$*"
SUBJECT="v${VER} — ${MSG}"

echo "==> [1/6] preflight: repos + tools"
command -v rsync >/dev/null || { echo "missing: rsync" >&2; exit 1; }
command -v gh >/dev/null || { echo "missing: gh" >&2; exit 1; }
command -v curl >/dev/null || { echo "missing: curl" >&2; exit 1; }
[[ -d "$PAGES_CHECKOUT/.git" ]] || { echo "no git checkout at $PAGES_CHECKOUT" >&2; exit 1; }
[[ "$(git -C "$PAGES_CHECKOUT" branch --show-current)" == "pages-dist" ]] || {
  echo "checkout at $PAGES_CHECKOUT is not on pages-dist" >&2; exit 1; }
echo "    repo=$REPO_ROOT checkout=$PAGES_CHECKOUT subject=$SUBJECT"

echo "==> [2/6] build (384MB heap cap: small-box OOM guard)"
cd "$REPO_ROOT"
NODE_OPTIONS=--max-old-space-size=384 npm run build
echo "    build exit 0; pages: $(find dist -name '*.html' | wc -l)"

echo "==> [3/6] rsync dist/ over pages-dist checkout"
# --delete keeps removals real, but .git and the committed .nojekyll must
# survive (dist/ has no .nojekyll: public/ doesn't ship one, Pages needs it).
rsync -a --delete --exclude='.git/' --exclude='.nojekyll' dist/ "$PAGES_CHECKOUT"/
touch "$PAGES_CHECKOUT/.nojekyll"
echo "    rsync done; checkout status:"; git -C "$PAGES_CHECKOUT" status --short | head -20

echo "==> [4/6] commit + push origin pages-dist"
BEFORE="$(gh api "repos/${GH_REPO}/pages/builds/latest" --jq '.created_at' 2>/dev/null || true)"
echo "    latest Pages build before push: ${BEFORE:-none}"
git -C "$PAGES_CHECKOUT" add -A
git -C "$PAGES_CHECKOUT" commit -m "$SUBJECT" || echo "    (nothing to commit — dist identical)"
git -C "$PAGES_CHECKOUT" push origin pages-dist
echo "    pushed"

echo "==> [5/6] poll Pages build (timeout 10 min)"
deadline=$((SECONDS + 600))
BUILD_STATUS=""
for ((i = 1; ; i++)); do
  INFO="$(gh api "repos/${GH_REPO}/pages/builds/latest" --jq '[.created_at, .status] | @tsv')"
  CREATED="$(printf '%s' "$INFO" | cut -f1)"; BUILD_STATUS="$(printf '%s' "$INFO" | cut -f2)"
  echo "    poll $i: created_at=$CREATED status=$BUILD_STATUS"
  if [[ "$CREATED" > "${BEFORE:-}" && ("$BUILD_STATUS" == "built" || "$BUILD_STATUS" == "errored") ]]; then
    break
  fi
  if (( SECONDS >= deadline )); then echo "    TIMEOUT waiting for Pages build" >&2; exit 1; fi
  sleep 20
done
[[ "$BUILD_STATUS" == "built" ]] || { echo "    Pages build ERRORED" >&2; exit 1; }
echo "    Pages build: built"

echo "==> [6/6] curl-probe served bytes (expect 200)"
for URL in "$SITE/" "$SITE/category/banking/"; do
  CODE="$(curl -s -o /dev/null -w '%{http_code}' "$URL")"
  echo "    $CODE $URL"
  [[ "$CODE" == "200" ]] || { echo "    PROBE FAILED: $URL -> $CODE" >&2; exit 1; }
done
echo "SHIP OK: $SUBJECT"
