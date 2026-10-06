# Abandoned revision: full event predicate was not enforced

Contract: 0xE68d3276a00E47474EDfd401690f94505f4FDb6f.
Source commit: 193d6eaa10ba71b06ce58eb099d6be0cd454f5cc.
Source SHA256: bde505671761fb7d6249e538553d99d874f7c69044eff76312e74f48e7d4de43.

The same-cause and separate-cause cases finalized with five validators and
MAJORITY_AGREE, and their 1 GEN / 2 GEN withdrawals were verified. The adversarial
case then showed that a genuine outage excerpt was treated as support for an
unrelated compensation-transfer event description. This revision must not be
used for new funding or submission evidence of correct full-event support.

Failed review:
0xf5322cff3236b1f553d3d80e5c05d16c3230df160392565e0ec15390fb132076.
Expected: unsupported event, RETRYABLE, zero credit.
Observed: SETTLED, access SUPPORTED, one causal component, 1 GEN beneficiary credit.
The failed expectation was not removed or relabeled as a pass.

Recovery used only existing canonical credits and fixed registered recipients.
All three funded covers reached CLOSED. Read-only accounting confirmed received
5 GEN, withdrawn 5 GEN, locked/credits 0 GEN, conserved=true; native balance 0 GEN.
See [sanitized recovery](recovery.json) for exact receipts, native decreases and
recipient fee equations. No further GEN may be sent to this revision.

The proposed correction treats the whole event description as the proposition
to verify and the excerpt solely as its location anchor. Every material assertion
must be supported; absent/contradictory claims remain UNVERIFIABLE. A positive
WARP case was unstable in the second probe, so the not-yet-ratified new demo
selector was narrowed and its anchor expanded to include the explicit WARP
observation. No source hash, meaning check or consequence invariant was weakened.

Prototype success is not finalized acceptance. A replacement requires fresh
checks, source identity, deployment, adversarial consensus and complete recovery.
