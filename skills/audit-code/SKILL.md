---
name: audit-code
user-invocable: true
argument-hint: "[scope (repo, path, domain...)]"
description: Use when auditing a large codebase that grew fast under AI assistance - "find the AI slop", "audit before launch", "the codebase grew faster than I can track", "what did we break", "onboard me to this repo" - or whenever fanning out parallel agents to hunt bugs, dead code, duplication or debt across a repo. Also use when a survey or subagent has produced a list of findings that nobody has verified yet.
---

# Auditing AI-built code

## Core principle

**A finding is not a finding until you tried to disprove it.**

Fan-out audits are cheap to run and produce confident, well-formatted, `file:line`-cited
claims. A meaningful share of them are wrong. At the scale where you need an audit, you
cannot personally re-derive every claim - which is exactly when a plausible-but-false
finding gets acted on. The value of this skill is not the hunting. It is the disproving.

## When to use

- A repo grew faster than anyone's mental model and you need a map plus a cleanup plan
- Pre-launch sweep of a codebase largely written with AI assistance
- Onboarding to an unfamiliar large codebase
- You are about to dispatch parallel finder agents at a repo
- Someone handed you a findings list and the next step is acting on it

**Not this skill:**
- `cil:untangle` - structural over-engineering (parallel state, callback chains, god files). Complementary; run it for the "too much code" question. This skill asks "what is wrong or fake, and is the finding real?"
- `cil:audit` - the full sweep that runs this lens plus untangle and product-coherence in one pass. Reach for it when you want all three at once, not just code.
- `/code-review`, `/simplify` - line-by-line correctness on a diff you already have

## Step 1: Orientation before hunting

Never start by reading files. Establish scale, churn, and the spine first - it tells you
which findings matter. Run these and keep the output:

```bash
# Scale per area
for d in <dirs>; do echo "$d: $(find $d -name '*.ts' -o -name '*.tsx' | wc -l) files"; done

# Churn: where the pain actually is (most-changed files)
git log --since="6 months ago" --name-only --pretty=format: -- '<globs>' \
  | grep -v '^$' | sort | uniq -c | sort -rn | head -30

# The spine: most-imported modules. This is the reading list for a newcomer.
grep -rhoE "from ['\"](@alias)/[^'\"]+" <dirs> | sed "s/from ['\"]//" | sort | uniq -c | sort -rn | head -40

# Growth rate - calibrates how much drift to expect
git log --since="12 months ago" --pretty=format:'%ad' --date=format:'%Y-%m' | sort | uniq -c

# Biggest files, dead code, type baseline
find <dirs> -name '*.ts*' -exec wc -l {} + | sort -rn | head -30
<dead-code-scanner>   # knip / ts-prune / etc
<typecheck>           # record the CURRENT error count as a baseline, per config
```

**Record the typecheck baseline before changing anything.** Without it you cannot tell new
breakage from pre-existing.

Also check what is *not* in the code: stale worktrees, branch divergence from the deploy
branch, and unmerged branches. Work stranded outside the main line is invisible to every
file-based survey. A tested fix sitting in a forgotten worktree is a real finding.

## Step 2: Fan out finders

Dispatch parallel read-only agents on **distinct angles** (see `failure-modes.md` for the
catalogue). Give each one: the repo conventions file, one angle, and the finding contract
below. Tell them explicitly to skip essential complexity and say why they skipped it.

## Step 3: The finding contract

This is the load-bearing part of the skill. Every finding - yours or a subagent's -
is reported in this shape. The evidence line is **required**; a finding without one is
not reportable.

```
FINDING: <one sentence, what is wrong>
LOCATION: path/to/file:line  (+ every other copy, if duplication)
CLAIM TYPE: bug | dead | duplicate | perf | drift | gap
DISPROOF ATTEMPTED: <the specific check you ran to try to kill this finding, and its result>
CONFIDENCE: verified | inferred
FIX: <the concrete simpler/correct form>
```

`CONFIDENCE: verified` means you ran the disproof and it failed to kill the finding.
`inferred` means you read the code and reasoned. **Both are allowed to be reported.
Silently mixing them is not.** The reader must be able to tell them apart at a glance.

### What counts as a disproof attempt

Matched to claim type. These are derived from real false findings:

| Claim | Required disproof attempt |
|---|---|
| "X is dead / unused" | Grep the **whole repo**, not one directory. Then check dynamic references: route strings, registry/config lookups, framework file-name conventions, build `entryPoints`, GraphQL fragment spreads, ambient `@types`, native/mobile entry points, test-only usage. Dead-code scanners produce false positives on every one of these. |
| "X is a bug" | Trace to an actual call site and state concrete input → wrong output. If it is runnable, run it. A rule that looks missing may not be required in the context where the function is used. |
| "X and Y are duplicates" | Diff them. Name the behavioral difference, or state explicitly that there is none. Duplicates that have already drifted are the higher-value finding. |
| "X causes N+1 / is slow" | Show the field is actually selected by a real client query, on a list path, not just that it could be. |
| "X is unwired / never reached" | Find the real consumer before concluding there is none. Absence from the directory you searched is not absence from the repo. |
| "convention Y is violated" | Count the violations AND the compliant sites. "0 of 41 routes comply" is a finding; "I found 3 violations" without a denominator is noise. |
| "these booleans should be one state" | Trace every setter and list reachable combinations. Prove the surfaces are mutually exclusive. If operations can overlap, keep keyed independent state instead of replacing it with one boolean. |
| "this save is atomic" | Count browser requests and database transactions behind the visible action. Force or reason through failure after each write, then verify whether earlier writes persist. One button with several sequential mutations is not atomic. |
| "state leaks between entities" | Navigate from entity A to warm-cached entity B without unmounting. Check editors, confirmations, reducers, and overlays. Partial dependency-reset effects do not prove the whole local state was reset. |

### Verify the high-severity claims yourself

Do not batch-trust. Before reporting to a human, personally re-derive every finding marked
HIGH or "bug". That is a small number of checks and it is where the credibility of the
whole audit lives.

## Step 4: Triage, then tier

Sort every surviving finding:

- **Accidental** - duplicates something that exists, supports a non-load-bearing requirement, or is plumbing composition would remove. Flag it.
- **Essential** - real concurrency/locking, non-obvious SQL, list batching, intentional duplication with a documented sync marker, long fixtures. **Skip it and say why**, so the next audit does not re-flag it.

Then tier by risk, not by line count:

1. **Tier 0** - deletions and dead weight. Zero risk, immediate relief.
2. **Tier 1** - correctness. Things that would embarrass you in front of a user.
3. **Tier 2** - dedup. One commit per duplication group.
4. **Tier 3** - structural splits. One at a time, each with its own verification run.
5. **Deferred** - anything that changes a contract a shipped client depends on. That is an API migration with a deprecation window, not cleanup. Never bundle it with the safe tiers.

Keep a **"disproven - do not re-file"** section in the output. Findings that died during
verification will be rediscovered by the next audit unless you write down why they are wrong.

## Calibration

A disciplined codebase yields **few** real findings. Most suspicious-looking code turns out
essential. If every file looks like a problem, you are pattern-matching on surface shape
rather than tracing behavior - recalibrate before reporting.

Expect the audit to *disconfirm* the "it's all AI slop" hypothesis in the areas that are
expensive to fix later (types, migrations, deprecation discipline, test placement) and
confirm it in the one that is cheap but spreads: duplication. Report both halves honestly.

## Common mistakes

| Mistake | Fix |
|---|---|
| Reporting a survey's findings as fact | The survey is a hypothesis list. Verify before it reaches a human. |
| Grepping one directory, concluding "nowhere in the codebase" | Scope every absence claim to what you actually searched, or search everything. |
| Trusting a dead-code scanner's output | It cannot see dynamic references. Check each hit by hand. |
| Presenting inferred and verified claims in identical prose | Required evidence field. Every finding. |
| Fixing while surveying | Survey produces a list; fixing changes the ground under the other finders. Separate the passes. |
| Deleting a "redundant" guard without checking every reader | A value derived on render can still have a second consumer reading the raw state. |
| Bundling an API-contract change into "cleanup" | Separate bucket, deprecation window, never mixed in. |
