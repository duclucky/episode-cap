# EC_V2 verification - 2026-10-06

The approved replacement is FINALIZED/SUCCESS on Studio Dev, chain 61997,
at 0x8bcD9EA123F0066Eb913ACf6BbEb4D26fD772ed6. Independent read-only verification passed after
all five signed lifecycles completed. Public GitHub and successful CI are verified.
Strict historical test-first compliance is not certified; see the limitation below.

## Commands and actual results

Command: npm run check

    Lint passed (3 checks)
    Validation passed
    Contract: EpisodeCap
    Methods: 12 (6 view, 6 write)
    107 passed
    tests 21 / pass 21 / fail 0
    CHECK PASS: contract lint, direct tests, metadata, receipt parsers, script syntax

Command: node scripts/studio-dev.mjs deploy

    transactionHash: 0xf636067e3b0fde4216c91c9ccac123b67562b1f2ef92ef3d42772e3f65ba9e21
    status: FINALIZED
    executionResult: SUCCESS
    contractAddress: 0x8bcD9EA123F0066Eb913ACf6BbEb4D26fD772ed6

Command: node scripts/lifecycle.mjs

    LIFECYCLE_PASS
    cases: 5
    received: 7 GEN / withdrawn: 7 GEN
    locked: 0 GEN / credits: 0 GEN / nativeBalance: 0 GEN

Command: node scripts/verify.mjs

    STUDIO_DEV_VERIFY_PASS
    cases: 5
    receipts: 29
    withdrawals: 6
    schemaMethods: 12
    all covers CLOSED / nativeBalance: 0 GEN

The verifier compares deployed bytes to the source SHA256, rereads every cover,
event, attempt, occurrence, credit and all receipts, and rechecks exact native
transfer decreases, recipient fee equations and external-message recipients.
All five review transactions used five initial validators, leaderOnly=false and
MAJORITY_AGREE. Same=1 occurrence, separate=2. Both retry attempts used authenticated
COMPLETE source acquisition but rejected the unsupported compensation predicate
as UNVERIFIABLE; they were not source-unavailability substitutes. Wrong digest
returned DIGEST_MISMATCH before semantic judgment. Expiry refunded all reserves.
Six withdrawals reconcile; all five covers and the contract have zero liability.

The first read-only verifier encountered the explicit hosted RPC limit of
30 requests/minute. HTTP request pacing at 2200 ms now preserves the quota,
including SDK subrequests. The test module failed with ERR_MODULE_NOT_FOUND
before implementation; both regressions now pass: concurrent reads remain
within the rolling quota, and a failed read
consumes its slot without replay or queue poisoning. No state/receipt assertion
or evidence requirement was removed. Official tooling notes describe hosted
Studio as rate-limited: https://docs.genlayer.com/developers/intelligent-contracts/tooling-setup

Proofs: [deployment](evidence/studio-dev/deployment.json),
[lifecycle](evidence/studio-dev/lifecycle.json),
[fresh canonical verification](evidence/studio-dev/reverification.json),
[local checks](evidence/local/check.json).

## Source and runtime

Version EC_V2; source commit 8c462ac90e94f9d5e848eaf3a135978dbaec405e.
Source SHA256: 8b1e0311e3ff2bc63cdf5d94f92603d8eb882c54d440c02747957ea0a50df825.
Pinned runner: py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng.
ASCII scan: zero non-ASCII bytes, exact three-line header, one EpisodeCap
contract. Three storage structs use the exact pinned SDK decorator gl.storage.allow.
The upstream linter compatibility adapter preserves rejection of missing or
unrelated decorators. The owner-requested workspace checker correction replaces
legacy substring matching with exact SDK names and additionally rejects fake
origins/factory calls. All 21 checker/knowledge regressions pass; severity,
scoring, provenance, meaning, time, value and evidence rules were not weakened.
The grading engine and orchestrator hashes are unchanged.

Unsigned schema/constructor, four production semantic regressions and the
negative runtime payability probe are separate from signed/finalized evidence.
The payability probe rejects a simulated 1 GEN value on close_cover while its
zero-value control succeeds; no keys, transaction or actual GEN were used.
See [metadata proof](evidence/studio-dev/metadata-smoke.json) and
[production regression](evidence/studio-dev/production-semantic-regression.json).

## Superseded semantic defect

EC_V1 accepted an unsupported compensation proposition after a genuine outage
excerpt. Its failed expectation was retained, new funding stopped, every cover
closed and all 5 GEN received withdrawn. A fresh read also confirms its native
balance is 0 GEN. It is ABANDONED_SEMANTIC_DEFECT and is excluded from successful
replacement evidence. See the [incident](evidence/studio-dev/archive/193d6ea/INCIDENT.md)
and [recovery](evidence/studio-dev/archive/193d6ea/recovery.json).
Historical unsigned EC_V1 probes remain in that revision's archive.

The owner approved EC_V2's exact reviewed-text digest and full-event proposition
policy before promotion and replacement deployment. Changed reviewed content,
wrong origin/URL/date/excerpt and unsupported meaning cannot open credit.

## Process limitation

Eleven settlement-normalization regressions were RED before their implementation.
The full value/recovery negative matrix was added after the initial draft method
bodies. This does not certify the strict required test-first chronology. Later
accounting and request-pacing regressions were RED before their repairs; all
current tests pass. Past events are not rewritten or presented as perfect
procedural compliance. Technical NO BLOCKER cannot erase that historical limit.

Only provider-published statement meaning is judged, not customer loss,
subscription, external service delivery, legal insurance or compensation receipt.
The tested value recipient boundary is EOA/EVM; Intelligent Contract recipients
and callbacks are outside verified scope. Three proposed consumers are documented
in [integration guidance](INTEGRATION.md); no external adoption is claimed.

## Public evidence

Repository: https://github.com/duclucky/episode-cap (PUBLIC).
Successful Windows CI: https://github.com/duclucky/episode-cap/actions/runs/37438962606 at commit 2296bb11d6261267d40120f54b51b57cbbb1114d.
107 direct tests and 21 script/receipt tests pass with one recognized EpisodeCap
contract. The current workspace grader reports 0 BLOCKER, 0 WARN, dynamic checks
PASS and GATE OK; manual meaning/reuse/source/lifecycle criteria are addressed
in REVIEW.md and the specification. No grading rule was weakened.
