# EpisodeCap

A standalone GenLayer Intelligent Contract for jointly accepted public-report
triggers with a native GEN cap per causal occurrence. Independent validators
judge the complete relation matrix among provider-reported events; contract
code rejects inconsistent partitions and derives fixed credit and refund amounts.

Category: Intelligent Contracts. No user-facing app.

Status: owner-approved EC_V2 passes lint, 107 direct tests and 21 script/receipt
tests. The replacement deployment is FINALIZED/SUCCESS on Studio Dev; all five
signed lifecycle cases pass with 7 GEN received and withdrawn and zero native
balance. Unsigned exact-source constructor/schema
and four production semantic regressions succeeded.
The workspace precheck storage incompatibility was corrected with regression
tests, preserving rejection of missing or fake decorators. The first deployed
revision failed an adversarial event-support case, was fully recovered to zero
liability and is abandoned. Public GitHub and CI are verified; strict historical
test-first compliance cannot be certified. See
[verification and limits](docs/VERIFICATION.md).

See [specification](docs/README.md) for the public interface, trust boundary,
authority, settlement invariants and adversarial acceptance cases.

This is a protocol-created public-report trigger. It does not establish actual
customer loss, insurance entitlement, subscription, external service delivery
or unnamed third-party causation. Hash stability does not authenticate a fact;
validators must independently acquire the exact provider-origin evidence.

## Consensus and reuse

Each validator independently fetches the locked provider pages, checks exact
review-text hashes, canonical URLs, publication dates and excerpt bindings, then judges
support for every selected event and the causal relation of every unordered
pair. Equivalence compares the normalized **meaning** of those complete vectors;
different explanations are permitted, opposing causal decisions are rejected.
Contract code checks exact coverage and transitive causal partition consistency
before deriving credits. Missing provenance or unsupported meaning cannot pay.

An API reseller's service-credit reserve, a DAO infrastructure contingency
reserve and an agent's outage-budget reserve can use the same interface. These
are proposed integrations, not existing adoption.

| Write | Purpose |
| --- | --- |
| create_cover | Lock 1-100 whole GEN, a named beneficiary, exact event definitions and deadlines |
| ratify_cover | Beneficiary accepts the exact chain/contract/cover-bound digest before its deadline |
| review_cover | Obtain validator judgment and deterministic credit, or a non-penalizing retry record |
| expire_cover | Funder recovers the unresolved reserve at or after the review deadline |
| withdraw_credit | Each fixed party withdraws its own credit through the EVM recipient boundary |
| close_cover | Funder closes only a terminal cover with zero liabilities |

Views: get_cover, get_event, get_attempt, get_occurrences, get_credit and
get_accounting. See the specification for exact argument types and time bounds,
and [integration sequence](docs/INTEGRATION.md) for downstream use.

## Local checks

Use Python 3.12, install `requirements-dev.txt` into `.venv`, run `npm ci`, then
`npm run check` on Windows. It runs contract lint, all direct tests, metadata
checks, receipt/fee parser tests and deployment script syntax checks. Local
success does not prove deployed or finalized Studio Dev execution.

## Worked example - finalized real result

Cover `ec-8c462ac-same` locked 2 GEN for the June 12 provider-reported Access
login failures and WARP registration failures from `scripts/examples.mjs`.
The named beneficiary ratified its exact definition digest. `review_cover`
finalized with five validators, MAJORITY_AGREE, both events SUPPORTED and
`access:warp = SAME_CAUSE`. `get_occurrences` returned one causal occurrence.
The beneficiary and funder each received 1 GEN credit and withdrew 1 GEN.
Every withdrawal reduced native contract balance by exactly 1 GEN; recipient
delta plus settled net fee equaled 1 GEN. The cover is CLOSED with zero credits.

| Real case | Deposit | Finalized judgment/recovery | Withdrawal |
| --- | --- | --- | --- |
| Same causal outage | 2 GEN | 1 occurrence; fixed 1 GEN to each party | 1 GEN + 1 GEN |
| Explicitly non-causal events | 2 GEN | 2 occurrences | 2 GEN beneficiary |
| Unsupported compensation proposition | 1 GEN | Two authenticated-source UNVERIFIABLE reviews; no credit until expiry refund | 1 GEN funder |
| No ratification | 1 GEN | No review; expiry refund | 1 GEN funder |
| Wrong reviewed-text digest | 1 GEN | DIGEST_MISMATCH, no semantic judgment/credit; expiry refund | 1 GEN funder |

All five covers are CLOSED. Canonical accounting: received 7 GEN, withdrawn
7 GEN, reserve/credits 0 GEN; native balance 0 GEN. Source, transaction,
consensus, canonical-view and exact transfer evidence are in the
[sanitized lifecycle](docs/evidence/studio-dev/lifecycle.json).

## Active deployment

NETWORK = Studio Dev, chain ID 61997.
CONTRACT_ADDRESS = `0x8bcD9EA123F0066Eb913ACf6BbEb4D26fD772ed6`.
Deployment **Result: SUCCESS**, Status: FINALIZED.

[Contract explorer](https://explorer-studio-dev.genlayer.com/address/0x8bcD9EA123F0066Eb913ACf6BbEb4D26fD772ed6)
| [Deploy transaction](https://explorer-studio-dev.genlayer.com/transactions/0xf636067e3b0fde4216c91c9ccac123b67562b1f2ef92ef3d42772e3f65ba9e21)
| [Deployment identity](docs/evidence/studio-dev/deployment.json).

EC_V2 binds source commit `8c462ac` and the pinned
`py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng` runner.
The live same-cause case finalized one occurrence, fixed 1 GEN credits to each
party, exact 1 GEN native decreases for both withdrawals and zero-liability
closure. All five replacement cases now pass the full signed lifecycle.

## Archived deployment - do not fund

NETWORK = Studio Dev, chain ID 61997.
CONTRACT_ADDRESS = `0xE68d3276a00E47474EDfd401690f94505f4FDb6f`.
Deployment **Result: SUCCESS**, Status: FINALIZED.

[Contract explorer](https://explorer-studio-dev.genlayer.com/address/0xE68d3276a00E47474EDfd401690f94505f4FDb6f)
| [Deploy transaction](https://explorer-studio-dev.genlayer.com/transactions/0x65b35540cf28310b5375a64d381e85f8c64387f663107221f7954e3b1f28b59b)
| [Archived deployment identity](docs/evidence/studio-dev/archive/193d6ea/deployment.json).

The deployment binds exact source commit `193d6ea` to contract EC_V1 and runner
`py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng`.
This revision is ABANDONED_SEMANTIC_DEFECT, not an active successful contribution.
See [incident and zero-liability recovery](docs/evidence/studio-dev/archive/193d6ea/INCIDENT.md).
