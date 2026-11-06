---
name: audit
user-invocable: true
argument-hint: "[scope (repo, path, domain...)]"
description: Use when you want ONE coordinated sweep of a codebase across all three audit lenses at once - structural over-engineering, code defects/dead code/duplication, AND product incoherence - instead of running cil:untangle, cil:audit-code and cil:audit-product separately. Triggers - "full audit", "cil audit", "deep audit before launch", "the codebase grew faster than I can track, show me the whole picture", "onboard me and tell me what's wrong", "structure + code + product review in one pass", "audit everything". Fans out parallel agents per lens, then merges, cross-verifies and ranks into one report. NOT a single-lens audit (use cil:untangle / cil:audit-code / cil:audit-product) or a line-by-line diff review (use /code-review).
---

# cil:audit - full sweep

## What this is

Three audit skills, one orchestrated pass. It runs all three lenses over the same
scope, shares one orientation, and merges the results into a single verified, ranked
report - instead of three overlapping lists a human has to reconcile.

The three lenses ask genuinely different questions:

| Lens | Sub-skill | The question |
|---|---|---|
| **Structure** | `cil:untangle` (Mode A) | Is there too much code - accidental complexity, duplicated plumbing, god files? |
| **Code** | `cil:audit-code` | What is wrong, fake, dead or duplicated - and is the finding real? |
| **Product** | `cil:audit-product` | Can a person reach an incoherent state? Does the product contradict itself? |

**This skill does not re-teach those three.** Each dispatched agent loads its lens's
sub-skill and applies that skill's own angles, finding contract and disproof
discipline. This orchestrator owns only what is *shared*: one orientation, the dispatch
matrix, the cross-lens merge, one ranking, and one report.

**Why combine instead of running three times:** they share the same expensive
orientation (scale / churn / spine / typecheck baseline), the same fan-out-then-verify
shape, and the same triage discipline. Combining lets you **dedupe across lenses** (a
duplicated helper is a code-dup *and* a product-drift finding; a god file is structure
*and* code) and rank everything on one scale. Running them separately triples the
orientation cost and yields three lists that overlap and disagree.

## Phase 1 - Scope and orient ONCE (shared, do not repeat per lens)

- Read repo conventions first: root `CLAUDE.md` / `AGENTS.md` - file-size limits,
  layering, state norms, "deprecated, don't touch" notes, and the API-compatibility rules.
- Run the orientation block from `cil:audit-code` Step 1: scale per area, churn
  (most-changed files), the spine (most-imported modules), growth rate, biggest files,
  the dead-code scanner, and the **typecheck baseline (record the current error count
  before touching anything)**. Also check stale worktrees / unmerged branches - stranded
  work is invisible to file surveys.
- Map the product journey from `cil:audit-product` Step 1: the stages end to end
  and **every entry point that skips a stage** (deep links, push, shared links, search,
  back-nav, signed-out cold arrival).

Hand this one orientation output to every agent so none of them repeat it.

## Phase 2 - Fan out three lenses in parallel

Dispatch read-only finder agents, grouped by lens. Give each agent: the Phase 1
orientation output, the repo conventions file, the name of its lens sub-skill to load,
its one angle, and the instruction to report in that sub-skill's contract and to skip
essential complexity with a reason.

- **Structure agents** → follow `cil:untangle` Mode A. Angles: parallel state / caches,
  callback / prop-drilling chains, provider / wrapper stacks, copy-paste blocks, trivial
  wrappers, fat root projections, parallel write paths, god files.
- **Code agents** → follow `cil:audit-code` and its `failure-modes.md`. Angles:
  duplicate divergence, reimplemented helpers, bypassed canonical paths, dead code /
  orphans, expired shims, test theater, type escape hatches, convention drift, data-layer
  N+1, error-handling shape, security-shaped patterns.
- **Product agents** → follow `cil:audit-product`: the state matrix (cardinality,
  ownership, time, lifecycle, permission, history, conditions) and the four hunts
  (asymmetry, marriage, drift, dead end). **Run this lens at least twice** - it has high
  inter-pass variance; a single pass is a sample, not a survey.

Scale the agent count per lens to scope. One angle per agent keeps findings sharp.

## Phase 3 - Merge and cross-verify (the orchestrator's real job)

Collect every finding, then:

1. **Dedupe across lenses.** The same underlying issue surfaces under several lenses.
   Merge into ONE finding carrying all its evidence - do not report it three times.
2. **Reconcile the contracts.** Every merged finding must carry BOTH: `disproof
   attempted` + `confidence: verified | inferred` (code / structure discipline) AND
   `reached by` + `today: live | latent` (product discipline). A structural deletion
   still needs "does this touch API surface?"; a code bug still benefits from "who hits
   this path, how often". Fill in whichever field its origin lens omitted.
3. **Personally re-derive every HIGH / "bug" / live-and-frequent finding.** *A finding is
   not a finding until you tried to disprove it.* This step is why you combined rather
   than just ran three tools - the cross-lens list is a hypothesis pile until verified.

## Phase 4 - Rank on one scale, then tier

Tier by **risk**, and within the user-facing tiers order by **reachability × frequency**
(not imagined severity):

1. **Tier 0** - deletions / dead weight. Zero risk, immediate relief.
2. **Tier 1** - correctness, ordered live-and-frequent first.
3. **Tier 2** - dedup / drift. One commit per duplication group.
4. **Tier 3** - structural splits. One at a time, own verification run each.
5. **Opportunities** - the "marriages": features that should connect and don't. Not bugs.
6. **Deferred** - anything that renames / removes API surface (GraphQL fields, REST routes,
   event payloads, DB columns read elsewhere). Additive migration with a deprecation
   window, **never bundled with cleanup**.

Keep two memory sections so the next sweep doesn't rediscover dead work:
- **Disproven - do not re-file** (findings that died during verification, with why).
- **Essential / deliberate - do not re-flag** (complexity or variation confirmed
  load-bearing or intentional).

## Phase 5 - Present, then apply safe tiers in verified increments

Present the ranked report and let the user choose tiers. When applying: one logical change
at a time; run `tsc` / lint / tests after each; one tier per commit so the mechanical
file-split diff doesn't drown the high-value deletions; re-run the full suite at the end.
**Survey and fix are separate passes** - never fix while finders are still surveying.
Evidence before "done".

## Calibration

A disciplined codebase yields **few** real findings; most suspicious-looking code is
essential. Expect the sweep to *disconfirm* "it's all slop" where it's expensive to fix
(types, migrations, deprecation discipline) and confirm it in the one cheap-but-spreading
place: duplication. If every file looks like a problem, you're pattern-matching on surface
shape - recalibrate before reporting.

## Output shape

```
## Tier 0 - delete now (dead / redundant)
## Tier 1 - correctness (live-and-frequent first)
## Tier 2 - dedup / drift
## Tier 3 - structural splits (mechanical, separate commits)
## Opportunities - connections worth making
## Deferred - breaking / API migration (deprecation window)
## Disproven - do not re-file
## Essential / deliberate - do not re-flag
```

End with a recommendation: which tiers to apply now, and what to leave.
