# EC_V2 evidence policy - owner approved

The first revision is abandoned and recovered to zero native balance. There is
no active replacement deployment yet. The owner approved this concrete policy
and replacement deployment on 2026-10-06 ("duyet"). Production promotion is
complete; finalized replacement lifecycle evidence is still pending.

## Concrete change

The `source_digest` field is SHA256 of the exact UTF8 review text,
derived once by the versioned `_text` function, rather than SHA256 of raw HTML.
That same text is passed to the semantic model. The representation is locked by
EC_V2, source commit and deployment address; existing EC_V1 ratifications are not
portable and no activated cover would be changed.

Checks retained before any model call:

1. Independently fetch only the configured authoritative HTTPS origin.
2. Require HTTP200, bounded raw bytes and valid UTF8.
3. Match the exact canonical URL and publication date to locked state.
4. Derive bounded review text once, hash its exact UTF8 bytes and compare the
   committed digest. Changed review content remains DIGEST_MISMATCH/RETRYABLE.
5. Require the exact excerpt anchor to be present in that text.
6. Judge every material assertion of the full event description, then all pairs.
7. Revalidate exact coverage, labels and causal partition invariants before
   deterministic fixed-recipient GEN credit.

Raw HTML-only script/style changes, whose bytes are excluded from the model's
input, no longer invalidate an unchanged reviewed report. Wrong origin,
canonical URL/date, excerpt, or reviewed-content version still cannot pay.
Amounts, callers, deadlines, attempt limit, payout mapping, accounting,
withdrawals and all six safety rows remain unchanged.

## Prototype evidence

`node scripts/representation-probe.mjs` returned six HTTP200 acquisitions with
matching canonical URLs/dates. The exact review-text hashes were stable across
three requests per source; the June raw HTML had changed since prior probes.
See [representation proof](evidence/studio-dev/representation-probe.json).

The proposed full-event prompt rejects unsupported payment and contradictory
event predicates. A raw HTML version change interrupted the next regression
run before the model; this failure is not a semantic PASS. The replacement
requires a full proposed canonical-text regression plus negative source-binding
tests before promotion and fresh finalized lifecycle evidence after deployment.

## Required regression proof

Completed prototype checks on 2026-10-06:

- Lint recognizes EpisodeCap, 12 methods, and all three checks pass.
- Six local representation tests pass: exact model-text digest, excluded script
  noise, changed review text rejected before LLM, and matching-hash wrong
  URL/date/excerpt rejected.
- Two consecutive unsigned EC_V2 runtime regressions return same=1 component,
  separate=2, unsupported payment=UNVERIFIABLE and contradictory event=UNVERIFIABLE.
  See [first pass](evidence/studio-dev/proposed-v2-regression-pass-1.json) and
  [second pass](evidence/studio-dev/proposed-v2-regression-pass-2.json).
- After approval, all six representation regressions target the production
  source. `npm run check` passes 107 direct tests and 19 deployment/parser tests.
  The unsigned exact-production regression passes all four cases; see
  [production proof](evidence/studio-dev/production-semantic-regression.json).
  Unsigned results remain distinct from finalized validator agreement.

Canonical text unchanged under an excluded script/style mutation; changed
reviewed content rejected before the model; wrong URL/date/excerpt rejected even
with a matching review digest; malformed/oversized data non-penalizing; positive
same/separate meanings and unsupported/contradictory full predicates stable in
the exact runtime. No previous failed case may be deleted or relabeled.

## Authority and limits

This follows the requirement to derive reviewed text/bytes once and hash that
same representation. It changes the public meaning of `source_digest`, so it
received owner approval before production promotion or replacement deployment.
It does not prove actual customer loss, payment, subscription or service delivery;
only the meaning of authenticated provider-published statements is judged.
