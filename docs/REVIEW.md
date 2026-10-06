# EC_V2 review against the Intelligent Contracts bar

The source reviewed is EC_V2 at commit `8c462ac`, SHA256
`8b1e0311e3ff2bc63cdf5d94f92603d8eb882c54d440c02747957ea0a50df825`.
It contains one EpisodeCap contract, six writes and six views. Finalized
replacement lifecycle and public CI evidence must be read separately; local
correctness alone is not submission acceptance.

| Criterion | Source and verification |
| --- | --- |
| Meaning rather than format | `_semantic_task` obtains event support and every unordered causal pair. Independent validator replay compares normalized enum/ID/coverage/component vectors in `_equivalent`; reasons are excluded. `test_validator_replays_meaning_and_rejects_different_decision` and `test_equivalent_rationale_changes_never_change_partition` prove opposing decisions fail and different prose can agree. |
| Structured isolated state | Typed Cover/ReportedEvent/ReviewAttempt records in str-keyed TreeMaps, stable cover IDs and append-only bounded attempts. No global last-result slot. Entity-isolation and immutable-definition tests pass. |
| Bounded authentic evidence | Only configured official Cloudflare HTTPS URLs; HTTP/UTF8/size/canonicalURL/date/excerpt/exact review-text digest checks precede the model. Wrong binding with a matching digest and unsupported/injected propositions cannot open credit. Authority is provider-origin acquisition, never the hash itself. |
| Deterministic consequence | Complete IDs/enums/coverage and clique consistency revalidated before mutation. The contract computes roots, cap, fixed recipients and residual. No model-selected amount or recipient; malicious valid-shaped outputs are rejected with unchanged accounting. |
| Edge cases | UserError paths for malformed/empty/zero/dust input, unauthorized/wrong-state/duplicate/closed writes, invalid model output and broken accounting. Technical source failure records non-penalizing RETRYABLE; structural invalid output reverts without a fake verdict. |
| Safety rows | Every write has its prior caller/state/time/idempotency/value/view/negative-test row in the specification. Recovery methods use the same role/state/accounting checks as settlement. Full negative suite passes now; the historical strict test-first limitation remains in VERIFICATION.md. |
| Direct temporal guards | create checks future ordered bounded deadlines; ratify and review each check now < their own deadline; expiry checks now >= review deadline. -1/equality/+1 tests deliberately leave phase stale and verify rejected state/accounting unchanged. |
| Value and recovery | One settlement or full unresolved expiry refund, positive own-credit withdrawals, debit before EVM recipient emission, closure only at zero liabilities. Exact native decrease and fee-adjusted recipient evidence are mandatory for every live withdrawal. |
| Reuse | Reseller, DAO and LangGraph budget consumers use the unchanged create/ratify/review/expiry/withdraw/close API and canonical views. No app or second pass-through contract; these consumers are proposed, not adopters. |

Minimal repairs applied: invariant checks before create/ratify mutation and even
idempotent closed returns; full event proposition support instead of an excerpt
proxy; exact reviewed-text digest binding. EC_V2's public evidence-policy change
was approved by the owner before promotion and replacement deployment. The
failed EC_V1 judgment remains archived, with all 5 GEN recovered and zero native
balance. No evidence failure or grading severity was suppressed.

This creates a jointly accepted provider-report trigger, not legal insurance or
proof of customer loss, subscription, external delivery or compensation receipt.
Independent semantic consensus can still be conservatively unverifiable; the
bounded retry and expiry path retains funder recovery. Universal novelty and
external adoption are not claimed.
