# EpisodeCap

A standalone GenLayer Intelligent Contract for jointly accepted public-report
triggers with a native GEN cap per causal occurrence. Independent validators
judge the complete relation matrix among provider-reported events; contract
code rejects inconsistent partitions and derives fixed credit and refund amounts.

Category: Intelligent Contracts. No user-facing app.

Status: local implementation passes lint and 101 direct tests. Unsigned Studio
Dev constructor/schema and production semantic helper simulations succeeded.
The workspace precheck storage incompatibility was corrected with regression
tests, preserving rejection of missing or fake decorators. Finalized consensus,
real value transfers, public CI and submission readiness remain pending. No
deployed address is claimed. See [verification and limits](docs/VERIFICATION.md).

See [specification](docs/README.md) for the public interface, trust boundary,
authority, settlement invariants and adversarial acceptance cases.

This is a protocol-created public-report trigger. It does not establish actual
customer loss, insurance entitlement, subscription, external service delivery
or unnamed third-party causation. Hash stability does not authenticate a fact;
validators must independently acquire the exact provider-origin evidence.

## Consensus and reuse

Each validator independently fetches the locked provider pages, checks raw-byte
hashes, canonical URLs, publication dates and excerpt bindings, then judges
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
get_accounting. See the specification for exact argument types and time bounds.

## Local checks

Use Python 3.12, install `requirements-dev.txt` into `.venv`, run `npm ci`, then
`npm run check` on Windows. It runs contract lint, all direct tests, metadata
checks, receipt/fee parser tests and deployment script syntax checks. Local
success does not prove deployed or finalized Studio Dev execution.

## Worked example - expected, not finalized evidence

The funder locks 2 GEN; the beneficiary accepts two provider-reported events.
If validators determine both share one causal outage, the beneficiary receives
1 GEN credit and the funder receives 1 GEN residual credit. If there are two
validated separate causes, the beneficiary receives 2 GEN credit. A malformed,
unverifiable or hash-mismatched report never opens a payment path; unresolved
funds remain available for expiry refund. Actual withdrawals require finalized
receipts, exact native balance decreases and fee-adjusted recipient evidence.
