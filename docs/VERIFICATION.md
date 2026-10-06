# Verification checkpoint - 2026-10-06

This repository is not deployment-ready or submission-ready. No transaction was
submitted, no GEN was transferred, and no deployed address is claimed.

## Local verification

Command: `npm run check`

Actual output:

```text
Lint passed (3 checks)
Validation passed
Contract: EpisodeCap
Methods: 12 (6 view, 6 write)
101 passed
tests 9
pass 9
fail 0
CHECK PASS: contract lint, direct tests, metadata, receipt parsers, script syntax
```

The production contract is ASCII-only; the scan found zero non-ASCII lines.
There is one validator-visible contract class, EpisodeCap, and three typed
storage structs. The pinned SDK requires `@gl.storage.allow @dataclass`.

The upstream linter adapter recognizes that exact current decorator spelling.
Its tests still reject an undecorated storage class and an unrelated decorator.
All upstream storage checks remain active. The adapter does not modify the
workspace grading bot.

The direct-mode harness aligns the mock JSON wire response and transaction
datetime with the pinned SDK. These are synthetic test fixtures, not evidence
of authentic public reports or finalized network consensus.

## Unsigned Studio Dev simulations

Commands:

```text
node scripts/studio-dev.mjs smoke
node scripts/semantic-smoke.mjs
```

The first simulation recognized all 12 public methods and returned SUCCESS for
the exact production constructor. The second reused the production semantic
helpers in an instrumented constructor: two provider-origin reports returned
HTTP200 with the expected hashes, dates and exact excerpt bindings. It produced
one common causal component for the June report and two explicitly separate
components for the July report.

Safe outputs: [constructor/schema](evidence/studio-dev/smoke.json),
[semantic helper simulation](evidence/studio-dev/semantic-smoke.json).

These simulations loaded no keys and submitted no persistent transaction. They
do not prove finalized consensus, credited funds, completed withdrawal, recipient
balances or zero native liability.

## Resolved checker incompatibility

The earlier workspace static precheck reported three R18 L1.12 BLOCKER findings
for Cover, ReportedEvent and ReviewAttempt. Its decorator recognizer searches
for the legacy string `allow_storage`, so it does not recognize the current
`gl.storage.allow` decorator required by the pinned SDK.

The owner requested a correction. The checker now accepts exact SDK decorator
names, including `gl.storage.allow`; it also rejects fake substring matches and
unrelated origins that the old rule accepted. Regression tests were observed
RED (seven failures) before the checker change. All 21 checker/knowledge tests
now pass. No severity, score, authenticity, meaning, time, value or evidence rule
was disabled. The production source has no legacy compatibility alias.

Three additional accounting regressions were observed failing before fixes:
create/ratify checked accounting only after mutation, and closed idempotency
skipped accounting validation. Invariants now precede those mutations/returns.
The expanded direct suite passes 101 cases, plus nine receipt/fee tests.

No ExplorerUrl can be supplied honestly before an actual deployment. GitHub
publication, successful public CI, finalized lifecycle evidence, and the final
acceptance command remain pending.

## Process limitation

The eleven settlement-normalization regression tests were observed failing
before their implementation. The complete negative test matrix for value and
recovery methods was added after their initial draft bodies. That does not
satisfy a strict claim that every such method was developed test-first. The
later failures and fixes are preserved honestly; no historical compliance is
claimed or fabricated.
