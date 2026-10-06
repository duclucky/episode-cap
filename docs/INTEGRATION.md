# Integrating EpisodeCap EC_V2

This is a contract primitive with six writes and six canonical views. The
submitted repository contains no user-facing application. The API reseller,
DAO contingency reserve and LangGraph outage-budget agent below are proposed
consumers, not claimed adopters.

## Shared transaction sequence

1. Independently select 2-4 event propositions from at most two public
   Cloudflare provider reports. Each definition contains `id`, `event`,
   `excerpt`, `source_url`, `source_digest` and `report_date`.
2. Compute `source_digest` as SHA256 of the exact UTF8 `_text` representation
   in the pinned EC_V2 source. It excludes script/style elements, strips tags,
   unescapes HTML and collapses whitespace. Hashes lock reviewed content; they
   do not authenticate its origin. Every validator fetches the locked official
   URL and verifies origin bindings and digest before semantic judgment.
3. The funder calls `create_cover(id, beneficiary, events_json,
   ratify_deadline, review_deadline)` with a whole GEN reserve. For a demo use
   `value: 2n * 10n**18n` (2 GEN). The beneficiary must be distinct and nonzero.
   Both timestamps are timezone-aware; now < ratify < review <= now + 7 days.
4. Wait for FINALIZED and SUCCESS, then read `get_cover(id)` and all
   `get_event(id, event_id)` records. The beneficiary reviews the full locked
   definition and calls `ratify_cover(id, definition_digest)` before ratify
   expiry. The digest binds version, chain, contract, cover, actors, amount,
   deadlines and exact definitions. Never approve only an excerpt.
5. Either named party calls `review_cover(id)` before review expiry. After
   finalization reload cover, the dynamic attempt number, `get_attempt`,
   `get_occurrences`, `get_credit` and `get_accounting`. Read canonical state
   rather than deriving success from a transaction hash.
6. A complete supported causal matrix opens deterministic credits. Each party
   calls `withdraw_credit(id)` for its own positive credit. Verify finalized
   receipt, exact native contract-balance decrease and recipient delta plus
   settled fee. The contract never accepts a caller-selected destination.
7. RETRYABLE opens no credit. Diagnose source/extraction versus structural model
   failure before a bounded second review. At/after review expiry the funder
   calls `expire_cover(id)`, withdraws the full remaining reserve and verifies
   the same transfer evidence. The funder calls `close_cover(id)` only after
   all liabilities are zero.

Use `genlayer-js` 2.0.0-rc.1 with the account configured in `createClient`; pass
an ABI address value as in `scripts/network.mjs:addressArg`, not a raw per-call
account override. The deployed network is Studio Dev, chain 61997. See
`scripts/examples.mjs` for real report definitions and `scripts/lifecycle.mjs`
for resumable transactions. Its ignored checkpoint prevents duplicate funding;
an ambiguous unhashed write intent requires status recovery before retry.

## Proposed consumers

| Consumer | Purpose | Exact primitive interface |
| --- | --- | --- |
| API reseller service-credit reserve | Limit a funded public-report trigger per causal outage rather than per listed symptom | create/ratify/review; finalized occurrences + credit; withdraw/close |
| DAO infrastructure contingency reserve | Release its fixed GEN contingency per independently interpreted provider occurrence | create/ratify/review; cover/attempt/accounting; expiry/withdraw/close |
| LangGraph infrastructure budget agent | Make a named counterparty accept a bounded incident budget and avoid counting one cascade repeatedly | same six writes; get_event/get_attempt/get_occurrences/get_credit |

Each consumer supplies a funder and named beneficiary; none can bypass assent,
the semantic verdict or deterministic cap. No consumer contract or status
mirroring guard is required because EpisodeCap owns settlement and funds.
The report does not establish a customer's actual loss, delivery, entitlement,
subscription, compensation receipt or legal insurance claim.
