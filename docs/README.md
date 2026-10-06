# EpisodeCap specification

## Identity

- Idea ID: IDEA-039.
- Name/slug: EpisodeCap / episode-cap.
- Category: Intelligent Contracts; contract-only.
- Status: DESIGN; fourteen admission gates passed, execution pending.
- Repository: local child Git root episode-cap; public URL pending publication.
- Target: Studio Dev, chain 61997, RPC https://studio-next.genlayer.com/api.

## One-sentence product hook

Apply a funded GEN cap per independently judged causal occurrence, even when
one provider reports several related failures or unrelated events together.

## Trust problem

Neither funder nor beneficiary may unilaterally split or collapse reported
events before native GEN liability is allocated. A database or backend model
gives one operator control over the causal grouping; ordinary EVM arithmetic
cannot interpret causal meaning. The contract creates the report-trigger promise
itself and escrows its funded cap. It does not adjudicate customer loss.

## Fingerprint

- Trust problem: neutral causal occurrence counting before a funded cap.
- Actors/adversary: immutable funder prefers fewer payable occurrences;
  different named beneficiary prefers more.
- Evidence/authenticity: independent HTTPS fetch of provider-owned Cloudflare
  postmortems, canonical URL/publication date/raw digest/exact excerpt binding,
  plus authenticated beneficiary ratification of the complete definition.
- Consensus question: each exact reported event is supported, and every pair
  has affirmative same-cause, separate/non-causal or unverifiable meaning.
- State machine: funded RATIFYING -> READY -> SETTLED/RETRYABLE; bounded
  attempts; post-deadline refund; own-credit withdrawal; zero-liability close.
- Direct consequence: code derives a consistent causal partition, opens
  min(reserve, occurrence_count * 1 GEN) beneficiary credit and funder remainder.
- Reuse surface: cover/event/attempt/occurrence/credit/accounting API for
  incident-credit reserves; no app or pass-through consumer contract required.

## Mandatory gate matrix

All results are admission, not execution or adoption.

| Gate | PASS/FAIL | Evidence/reason |
| --- | --- | --- |
| Replacement | PASS_ADMISSION | Unilateral causal grouping can bias funded cap; independent semantic consensus must precede ledger allocation |
| Judgment | PASS_ADMISSION | Real authoritative report distinguishes one cascade from an explicitly non-causal simultaneous event |
| Evidence availability | PASS_ADMISSION | Two unsigned exact-runtime probes: HTTP200, bounded raw bodies, extraction and live meanings SUCCESS twice |
| Evidence authenticity | PASS_ADMISSION | Complete authority matrix below; provider-origin acquisition is authority, digest only binds version; invalid provenance pays nothing |
| Equivalence | PASS_ADMISSION | Independent refetch/replay compares complete normalized support/relation meaning; exact coverage and clique invariants |
| Consequence | PASS_ADMISSION | Actual escrow cap opens deterministic GEN credit/refund once |
| Adversarial | PASS_ADMISSION | Funder wants collapsed groups; beneficiary wants split groups |
| State model | PASS_ADMISSION | Keyed immutable covers/events, roles, append-only attempts, direct time gates and full value recovery |
| Reuse | PASS_ADMISSION | Three named consumers call the same documented API below |
| Contract count | PASS_ADMISSION | One state owner owns evidence, causal judgment, cap and enforcement |
| Differentiation | PASS_ADMISSION | Causal partition/cap differs from applicability, research attribution, replay lease and priority waterfall |
| Claim-to-code | PASS_ADMISSION | Complete method/state/view/test/required network proof table below |
| Full lifecycle | PASS_ADMISSION / PENDING_EXECUTION | Same/separate/retry/expiry/withdraw/zero-close acceptance specified; real finalized lifecycle still required |
| Scope honesty | PASS_ADMISSION | Only provider-published report-trigger promise; no insurance/customer-loss/adoption claim |

## Actors, roles and incentives

| Actor | Permissions | Value at risk | Incentive to bias |
| --- | --- | --- | --- |
| Funder | Create funded cover, review, expire, withdraw own credit, close | Actual cap in GEN | Collapse distinct occurrences or force early refund |
| Beneficiary | Exact definition ratification, review, withdraw own credit | Contractual trigger credit/opportunity | Split one cascade into several occurrences |
| Validators | Independently fetch, verify and judge bounded report meaning | Consensus responsibility; no caller-selected role | Malicious/incorrect leader must be rejected by independent replay |

## Scope and non-goals

In scope: 2-4 selected reported events, at most two source URLs, Cloudflare
postmortem origin, one fixed beneficiary, 1 GEN per validated causal component,
1-100 whole-GEN actual cap, two bounded review attempts, expiry and withdrawal.
Out of scope: insurance, loss/subscription/performance verification, legal debt,
unnamed cross-provider causation, private/uploaded evidence, customer telemetry,
any frontend, callback, external adoption or production claim.

## Product/frontend blueprint

N/A in every subsection: Intelligent Contracts is contract-only. Human jobs are
expressed through the public API. Information architecture is canonical views;
visibility/UI action/state-label/visual-preservation matrices are not app claims.
No screens, wallet UI, browser workflow or hosted app will be created.

## State model

### Stable IDs and structured storage

ASCII unique cover IDs <=64; per-cover ordered event IDs, pair keys i:j with
i<j; attempts keyed cover:attempt. TreeMap keys are str. Covers, events and
attempts use storage-allowed dataclasses; amounts/counters use bigint, never
bare int storage. No raw JSON is canonical storage. JSON is bounded transport
decoded into typed records. Views serialize canonical records and display GEN.

### State machine

RATIFYING --beneficiary exact digest--> READY --party review--> SETTLED or
RETRYABLE; RETRYABLE --party bounded retry--> SETTLED or RETRYABLE.
RATIFYING/READY/RETRYABLE --funder after full review deadline--> REFUNDED.
SETTLED/REFUNDED --own credit withdrawal--> same phase with reduced credit.
SETTLED/REFUNDED --funder and zero liability--> CLOSED.

### Temporal entrypoint rules

Canonical time: gl.message.raw['datetime']; parse timezone-aware UTC seconds.
Create requires now < ratify_deadline < review_deadline <= now+7 days and
report publication date <= transaction date. Ratification requires
now < ratify_deadline. Review requires now < review_deadline. Expiry requires
now >= review_deadline; equality is expired. Each entrypoint enforces time
itself while phase may remain stale. Withdrawal/close are non-temporal because
earned liability stays withdrawable forever. Reject before mutation.

### Illegal transitions, authorization and idempotency

No outsider may ratify/review/recover/withdraw/close; funder and beneficiary
must differ. Existing IDs, changed definitions, wrong digest, repeated assent,
review after terminal state, excess attempts, early expiry and nonzero-liability
closure reject. Settlement and refund are exclusive; one credit allocation.
Positive own-credit guard prevents double withdrawal. Duplicate funder close
of CLOSED is a no-op. Attempts append only on valid review processing.

## Write-method safety matrix

| Method | Caller | Allowed states | Forbidden states | Temporal/expiry gate | Idempotency | Value/accounting effect | Views affected | Negative tests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| create_cover | Funder sender; distinct beneficiary | New unique ID | Existing/invalid ID or definitions, zero/dust GEN | now < ratify < review <= now+7d; source publication <= now | Duplicate rejects before mutation | Payable receives whole GEN; received/locked increase once | cover/event/accounting | Duplicate/bad ID/roles/value/source/digest/date, creation time -1/0/+1; unchanged ledger |
| ratify_cover | Beneficiary | RATIFYING, unassented | Other callers/digest; ready/retry/terminal/closed | now < ratify; equality late with stale phase | Duplicate rejects | No movement; false-to-true exact assent | cover | Wrong signer/entity/version/digest, replay, stale phase -1/0/+1, unchanged ledger |
| review_cover | Funder or beneficiary | Ratified READY/RETRYABLE, attempts<2 | Outsider/unratified/exhausted/terminal/closed | now < review; equality late with stale phase | Terminal rejects; bounded attempts append only | Only complete valid matrix opens capped credit plus refund; provenance failure no settlement/credit | cover/attempt/occurrences/credit/accounting | Caller/state/duplicate/closed, source provenance/output, triangle, temporal -1/0/+1, unchanged accounting |
| expire_cover | Funder | RATIFYING/READY/RETRYABLE | Outsider/settled/refunded/closed | now >= review; full actor window honored | Duplicate rejects | Remaining reserve to funder credit once | cover/credit/accounting | Caller/state/premature/equality/+1 stale phase, duplicate/closed, no double refund |
| withdraw_credit | Exact credit owner | SETTLED/REFUNDED, positive own credit | Outsider/pending/closed/zero credit | N/A: earned liability remains withdrawable | Zero credit rejects | Debit before finalized EVM transfer to owner; withdrawn increments once | cover/credit/accounting | Wrong caller/state/duplicate/closed, no arbitrary receiver/double withdrawal, accounting and native decrease |
| close_cover | Funder | SETTLED/REFUNDED, zero reserve and credits | Outsider/pending/nonzero liability | N/A: only state/liability governs | CLOSED funder no-op | No movement; terminal closure | cover/accounting | Wrong caller/state/nonzero reserve/credits; duplicate no-op and invariant |

Constructor is nonpayable and only initializes zero global counters.

## Frontend lifecycle coverage matrix

N/A: no frontend or claimed browser lifecycle. Scripts and canonical view reads
prove the contract-only integration boundary; they never count as browser proof.

## Evidence policy

Authority is the provider's own published statement, independently fetched from
HTTPS blog.cloudflare.com. Strict path: /[a-z0-9-]{1,120}/, max URL200, no query,
fragment, port, credentials or other host. Max two distinct URLs per cover.
Raw body 1000-500000 bytes, HTTP200, UTF8, exact canonical self-URL and JSON-LD
datePublished matching the locked YYYY-MM-DD; source date <= creation time.
Raw SHA256 must match the exact locked digest before any model call. Derive
text only from those bytes: remove script/style and tags, HTML-unescape,
normalize whitespace; bound text <=60000. Required exact excerpt <=500 must
occur; semantic selector <=300 is role-authored and jointly accepted.

Canonical policy EC_V1, network/contract/cover/roles/amount/deadlines and complete
event definitions are included in the definition digest. Beneficiary's network
signature constitutes assent only; no issuer signature or external fact is
invented. Unique ID, exact digest, false-to-true assent and transaction time
prevent replay. Every review refetches pinned sources before deadline.
Changes/disappearance/conflict/provenance/date/coverage failures are RETRYABLE,
with no settlement or credit, then authorized expiry returns all locked value.
Do not update source version automatically after ratification.

Report prose is untrusted data. It cannot set objectives, IDs, payout rules,
destinations, authority or consequences. Private, claimant-hosted, uploaded,
screenshotted or self-reported evidence is rejected, even with a valid hash.
Only supported provider-reported causal meaning may reach the consequence.

### Evidence Authority Matrix

| Consequential claim/fact | Evidence/artifact | Data controller | Authoritative source/issuer | Deterministic verification | Canonical objective/entity/actor binding | Freshness/anti-replay | Semantic role after verification | Non-penalizing failure state | Consequence blocked | Required negative test |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Exact funded trigger and destinations jointly accepted | Immutable typed cover/events and assent tx | Funder authors definitions; beneficiary assent | Protocol-native actual escrow; network authenticated named wallets | Strict inputs, full EC_V1 digest, sender equals beneficiary | chain/contract/cover/roles/GEN/deadlines/event definitions | Unique ID; exact digest once before ratify deadline | Locked selection/policy only, no external loss proof | Revert/retain pending | Readiness, review, credits, settlement | Valid digest from outsider/other entity/version; replay/late/future creation keeps hard state/accounting unchanged |
| Provider published selected reported events | Bound exact remote postmortem | Provider; actor chooses only selectors/digest | Independent exact HTTPS blog.cloudflare.com acquisition | URL allowlist, HTTP200, canonical URL/date, raw hash, UTF8/size and excerpt containment | Exact cover/event/source/provider/publication/version binding | Publication <=creation; immutable digest; refetch per timely attempt | Reported event support and causal interpretation only | RETRYABLE | Credit/refund settlement, slash/access/routing/value consequence | Hash-valid claimant host, copied canonical tag, wrong report/date/event/digest, missing excerpt or injection pays nothing |
| Full verdict defines valid occurrence partition | Normalized full support/pair labels | Leader proposes; validators independently judge | Independent refetch/replay and deterministic invariants | Exact IDs/coverage/enums, clique consistency; code derives roots/count/amounts | Locked expected event set, current cover/digest/attempt | Bounded current attempt; no terminal review | Meaning of support and causal relations; rationale noncritical | Revert or RETRYABLE | Credits, settlement, reserve release | Opposite meaning/invalid leader, missing/extra/duplicate IDs, invalid enum or nontransitive triangle leaves accounting unchanged |

## Consensus design

### Leader task

Capture locked records outside nondet; inner no-arg leader never accesses self.
Fetch each distinct source once, validate objective bindings and exact digest,
derive bounded text, verify excerpts, then ask only for semantic fields. Every
expected event gets support SUPPORTED/UNVERIFIABLE. Every unordered pair gets
SAME_CAUSE/SEPARATE_CAUSES/UNVERIFIABLE. Time overlap, same URL/provider or
similar symptoms alone never establishes a shared cause. No missing external
cause may be invented. Output amounts, recipients, policy changes are ignored
as non-authoritative metadata or rejected when they change required shape.

### Consensus-critical fields

| Field | Type/bounds | Comparison | Why critical |
| --- | --- | --- | --- |
| Stage and coverage | Locked complete/retryable/invalid markers | Exact normalized stage | Missing provenance cannot settle |
| Event support | Every expected ID once; 2 locked enums | Independent normalized ID->support equality | Unsupported actor selector cannot receive credit |
| Pair relation | Every i<j pair once; 3 locked enums | Independent normalized pair->relation equality | Different causal grouping changes funded cap |
| Derived components | Complete clique equivalence relation | Deterministic code, never model selected | No transitive union hides explicit separate pair |

### Validator and rationale

Sandboxed gl.vm.run_nondet_default. Reject candidate that is not gl.vm.Return.
Independently refetch and re-judge locked inputs, normalize and compare meaning;
never compare raw JSON or reasons. Distinct substantive decisions cannot both
pass. Invalid normalized output cannot settle. Technical UNDETERMINED writes
no fake verdict/state; investigate source versus extraction/model failure
before retry. Rationale may differ and has no financial authority.

## Consequence and accounting

| Verdict | Canonical state | Consumer action | Value movement |
| --- | --- | --- | --- |
| Complete supported consistent causal matrix | SETTLED, derived occurrence roots | Read finalized components/credits | Beneficiary min(reserve,count*1 GEN); residual funder credit |
| Unknown support/relation or provenance/source failure | RETRYABLE attempt only | Diagnose; bounded retry before deadline | No credit/settlement; reserve remains recoverable |
| Invalid schema/inconsistent partition/malicious leader | Reject before mutation | Correct structural error; no blind retry | No movement |
| Authorized expiry | REFUNDED | Own credit withdraw | All unallocated reserve to funder once |

Ledger invariant: received = locked + credits + withdrawn globally, and
deposit = reserve + both credits + withdrawn per cover. Bigint exact internal
units; human views show GEN. Every demo application amount is 1 or 2 GEN.
Credit transfer debits before EVM-interface emission on finalized; parent
finality alone is insufficient. Require exact native contract balance decrease,
child sender/recipient/value/finality and recipient balance with fee context.
Cure/restore/callback N/A: no quarantined service or consumer boundary exists.

### Value-destination matrix

| Value item | Payer/source | Locked state | Release destination | Refund destination | Forfeit destination | Terminal states | Duplicate/late/retry | Proof view |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cap reserve | Funder payable create | Ratifying/ready/retryable | Fixed beneficiary capped count credit | Residual to funder; full refund after review expiry | N/A no penalty/bond | Settled/refunded, then zero-close | Settlement/expiry once; retry retains reserve; no early cancellation | cover/credit/accounting/native |
| Beneficiary credit | Validated cap | Settled | Same credit owner via EVM transfer | N/A earned credit | N/A no confiscation | Withdrawn then closed | Positive credit, no expiry/double withdraw | own credit/withdrawn/native decrease/recipient |
| Funder credit | Residual or expiry | Settled/refunded | Funder via EVM transfer | This is the explicit refund destination | N/A no forfeiture | Withdrawn then closed | Created once; positive own-credit guard; no deadline | funder credit/accounting/native/recipient |

## Reusable interface

Writes: create_cover(cover_id, beneficiary, events_json, ratify_deadline,
review_deadline), ratify_cover(cover_id, definition_digest), review_cover(cover_id),
expire_cover(cover_id), withdraw_credit(cover_id), close_cover(cover_id).
Views: get_cover, get_event, get_attempt, get_occurrences, get_credit,
get_accounting. Public JSON-string views serialize typed canonical records.

Three proposed integrations: API reseller incident-credit reserve,
DAO infrastructure contingency reserve, LangGraph infrastructure budget agent.
Each creates/ratifies a cover, requests review, reads finalized occurrences and
credit, and withdraws/reconciles through the same interface. These are proposed
consumers, not adoption. Callback auth/idempotency/failure are N/A because the
primitive enforces liability itself. Only funder post-deadline expiry is allowed.

## Threat model

| Threat | Attack | Mitigation | Test |
| --- | --- | --- | --- |
| Forged provenance | Hash-valid claimant copy or wrong report/date | Exact provider fetch/bindings and pre-LLM checks | Valid-hash unauthenticated tripwires per authority row |
| Role/replay | Wrong wallet/cover/digest/version, repeated assent | Named role, unique ID, full digest/time gates | Wrong signer/entity/version/replay unchanged ledger |
| Causal laundering | Same URL/time or nontransitive triangle treated as one group | Affirmative source support plus complete clique invariant | Independent relation replay and triangle rejection |
| Prompt injection | Evidence instructs payout/IDs/authority | Locked policy separated from untrusted data, enums and deterministic code | Injected report/model metadata cannot move value |
| Recovery grief/theft | Early expiry or arbitrary withdrawal | Entrypoint role/state/time/interest/credit guards | Each recovery row negative matrix |
| Orphaned GEN | Retry/exhaustion/unratified cover never closes | Full expiry refund and indefinite credit withdrawal | Complete recovery plus native zero proof |

## Test plan

Test-first behavior before completion of each recovery/value method. Direct
happy paths: same/separate classes, cap conservation, assent, withdrawals and
close. Unauthorized/isolated entities/locked definitions. Evidence 404/malformed/
missing/contradictory/changed/unbound/unauthenticated with exact hash. Complete
event/pair coverage, JSON fences/duplicate keys, unsupported event, invalid enums,
nontransitive triangle, malicious leader and independent validator replay.
Prompt injection and harmless rationale variation. Every temporal write covers
boundary-1/equality/+1 while phase stale and canonical state/accounting unchanged.
Every recovery/value write covers wrong caller/state, duplicate/terminal/closed,
no double credit/refund/withdraw/settle and accounting. Metadata payable/no-value
paths; raw and normalized receipt fixtures. Direct tests do not prove consensus.
Cure/restore/consumer notification N/A for this state model. Real Studio Dev
schema/negative smoke and finalized judgments supplement local tests.

## Claim-to-code matrix

| Product claim | Method/state | View/read | Direct test | Network evidence |
| --- | --- | --- | --- | --- |
| Exact jointly accepted definition | create/ratify, RATIFYING->READY | cover/event | Wrong role/digest/entity/version/replay, immutable definitions | PENDING: finalized create/assent and digest reads |
| One cascade, one occurrence | review/full matrix | attempt/occurrences | June12 Access/WARP same cause, paraphrase vs opposite relation | PENDING: finalized same-cause canonical roots |
| Non-causal same-time events separate | review/full matrix | occurrences/credit | July14 resolver outage vs explicitly non-causal BGP event | PENDING: finalized two-component read |
| Actual deterministic cap | review/ledger | credit/accounting | 2 GEN gives 1+1 for one group, 2+0 for two groups | PENDING: exact reserve and finalized credit reads |
| Stable forged evidence cannot pay | provenance/normalization | cover/attempt/accounting | Each authority-row tripwire with unchanged hard state | PENDING: exact-source metadata/negative smoke |
| Invalid partition cannot move GEN | normalization/clique checks | attempt/occurrences | Extra/missing/duplicate IDs, enums, unsupported event and triangle | PENDING: source commit and valid full matrix evidence |
| Recovery reaches zero | expire/withdraw/close | cover/credit/accounting | Full recovery/time/duplicate/accounting negative matrix | PENDING: refund/child/native/recipient and zero-close evidence |

## Analogue and differentiation matrix

| Analogue | Similar dimensions | Structural difference | Decision |
| --- | --- | --- | --- |
| IncidentScope | Provider evidence, credit incentives (2) | Causal partition among reports, not impact-to-profile applicability | Distinct |
| DisclosureDividend | Joint relations, clustered credit technique (2) | Provider causal occurrences; no researchers, roles, commit priority or apportionment | Distinct |
| SemanticNonce | Meaning comparison, authenticated parties (2) | Batch causal partition; no consumed actions/tickets/novelty budget | Distinct |
| RankReserve | Funded reserve (1) | No seniority/face/proportional waterfall | Distinct |
| SemanticSetoff | Ratified definitions/accounting (2) | No reciprocal debt/netting/discharge | Distinct |
| ClauseFlow | Escrow machinery (1) | No delivered-work judgment or binary release; complete causal matrix/cap | Distinct |
| Self-consistency checker | Semantic relation comparison (1) | Live authoritative causal evidence and funded consequence | Distinct |

Bounded search establishes no >=4 material matches; universal originality is
not claimed. No source implementation is extracted from an old submission.

## Deployment and evidence plan

Studio Dev only, exact matched v0.3.0/runner unit from current target template.
Use existing separated authorized EOAs, config project .env then parent .env,
never print secrets or full RPC receipts. No faucet or implicit new/funded wallet.
After lint/direct/gltest/parser/check: commit exact source, unsigned exact-source
smoke, authorized deploy, verify SUCCESS plus finalized receipt and ctor/methods.
Run 2 GEN same-cause case (1 GEN each withdrawal), 2 GEN separate-cause case
(2 GEN beneficiary withdrawal), 1 GEN expiry refund. Source hash and deadlines
are current; read dynamic attempt ID. Recover existing state before retry.
Archive superseded deployment identity; no funds to broken revision.
Evidence docs/evidence/studio-dev/, local checks docs/evidence/local/.
Record network/source commit/runner/address/tx/roles/canonical views and native/
recipient balances using explicit safe projections. Signed lifecycle is not
simulation. Fee requests and action authority remain separately enforced.

## Definition of Done

- [ ] Reusable contract primitive and canonical API documented.
- [ ] Semantic independent validator and deterministic settlement invariants.
- [ ] Lint recognizes exactly one project class; ASCII/header/metadata correct.
- [ ] Direct/gltest/adversarial/recovery/temporal/receipt/check all pass.
- [ ] Real finalized same/separate/recovery lifecycles with direct consequence.
- [ ] Canonical reads, exact native decreases, recipient/child and zero liability.
- [ ] Public hygiene, meaningful history, public repo and successful CI verified.
- [ ] Copy-ready verified Portal fields and unchanged grading bot NO BLOCKER.
- [ ] Final master-prompt item-by-item audit; all uncertainty listed honestly.

Projects checks N/A: no user-facing app, browser workflow or hosting.

## Honest limitations

Admission and unsigned feasibility are verified; implementation/network/GitHub/CI
are pending. Only provider-published statement meaning is judged, not objective
independent telemetry, customer identity/loss or legal insurance coverage.
One fixed origin and two sources per bounded cover; changes may require expiry
and a new co-ratified cover. Proposed consumers are not adopters.

## Adoption path

First publish clear integration calls and exact canonical examples for the three
named consumers. Future substantial increment: separately verified additional
provider authorities and a real incident-credit consumer with its own live proof.

## Kill criteria

Stop on unauthenticated source/consequential claim, unstable target extraction,
unproven semantic agreement, inconsistent partition, duplicate architectural
fingerprint, unsafe value destination, missing safety/time guard or real runtime
blocker. Never widen origin/labels, ignore digest, weaken meaning validation,
edit grading bot or invent evidence to complete a phase.
