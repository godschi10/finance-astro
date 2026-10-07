---
id: T001
title: Add a hello test
kind: test
assignee: tester
depends_on: []
budget:
  steps: 30
  outTokens: 10000
  ctxTokens: 60000
  usd: 0.10
  minutes: 15
verify:
  - npm test 2>&1 >/dev/null
---
# Add a hello test

## Goal
Add a minimal passing test to verify the test harness works.

## Context
Fresh project. No tests exist yet. Using Node's built-in test runner.

## Requirements
1. Create `test/hello.test.js` with a single passing test.
2. Test must use `node:test` and `node:assert`.
3. Test name: "hello world returns greeting".

## Acceptance criteria
1. `npm test` runs and exits 0.

## Out of scope
- Implementation code (only test file).
- CI configuration.
