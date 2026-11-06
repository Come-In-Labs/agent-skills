---
name: untangle
user-invocable: true
argument-hint: "[scope (repo, path, domain...) or 'post-work' for a sanity sweep]"
description: Find and remove over-engineered, lots-of-code patterns - parallel state/caches that duplicate a library, divergent copies of one domain rule (who owns/manages/may see X, re-written in TS, SQL and client checks), callback/prop-drilling chains, copy-paste blocks, trivial wrappers, fat projections, god files - then produce a ranked, risk-assessed cleanup plan and apply the safe tiers. Two modes - (1) breadth-first hunt across a repo or scoped path, (2) a sanity sweep over a chunk of work that was JUST finished to catch complexity you introduced. Use when asked to "find over-engineering", "reduce complexity", "simplify the architecture", "cleanup audit", "trim", "too much code", "where can we delete code", OR to "sanity-check what we just did", "make sure this isn't over-engineered", "is this sane". NOT a line-by-line correctness diff review (use /code-review or /simplify for that) - this hunts structural over-engineering. For code defects/dead code use cil:audit-code, for product incoherence use cil:audit-product, or run all three at once with cil:audit.
---

# Untangle: find and remove accidental complexity

## Core principle: trim the requirement before patching around it

When you find growing complexity, the win is usually **deleting a requirement**, not engineering around it. A feature that needs callbacks + state-lifting + a pub/sub + a wrapper + a remount hack is almost always supporting a constraint that isn't load-bearing. Drop the constraint and the plumbing evaporates.

The job of this skill is to find those spots, prove which complexity is accidental (vs essential), and collapse the accidental kind in small, verified steps.

**The first move on any "simplify" request is to delete code, not refactor it.**

## Two modes

**Mode A - repo hunt** (breadth-first). Scope = whole repo or a path/domain. Dispatch the parallel finder agents below. Use for "where can we delete code", periodic cleanup, or onboarding to an unfamiliar codebase.

**Mode B - post-work sanity sweep** (depth-first, narrow). Scope = the chunk of work that was just finished (the working diff + the handful of files it touches and their immediate neighbours). Run this right after completing a feature/refactor, *before* committing, to catch over-engineering you just introduced. No parallel agents needed - it's small enough to inspect directly. Ask of every new/changed unit:

- Did I add plumbing (callback, wrapper, pub/sub, state-lift, remount, ref-flag) for a requirement that isn't load-bearing? Can I drop the requirement?
- Did I encode one mutually exclusive mode as several booleans? If only one sheet, modal, tool, loading phase, or workflow step can be active, replace `isX` + `isY` + `isZ` with one union / enum state plus an idle value. Keep genuinely independent or intentionally layered states separate.
- Did I add a thing next to something that already does it? (a cache beside the query lib, a helper beside an existing helper, hand-typed shapes beside codegen) - grep the neighbours to be sure.
- Did I write a **rule** that already exists in another form - who owns / manages / may see / counts as a member of an entity, which statuses count as active? Grep the concept's vocabulary *and* the columns it reads (`creator_id`, `assigned_to`, `role = 'admin'`, ...) across server, worker, client and raw SQL strings before writing it. Build on the canonical function; if none exists, create one. If the rule genuinely needs two forms (a per-row check and a SQL set for list queries), put both in one module with a parity test. And did I use a **permission bit as a label**? `canManage`/`isAdmin` answers "may they do it", not "is it theirs": a superadmin can manage everything and owns nothing.
- Did I add a new create/save mutation or endpoint when an existing canonical one for that entity could have taken a new optional input instead (a source id, an extra field)? Did I make the client re-send/re-upload data the server already has? Reuse or extend the canonical write path.
- Does one Save button orchestrate several browser mutations? Keep separate server-owned tables if the domain needs them, but put the user action behind one canonical command and one transaction. A client-side sequence can partially commit and then report failure.
- Did I create a new file for something that belongs to a neighbour? A new file holding a single function that wraps, extends, or is only ever used together with an existing module should join that module. A separate file needs its own concern or a real size reason.
- Did I just touch a file and leave dead/now-redundant code behind? (The classic trap: you migrate a file's internals and miss that the whole file is now obsolete.)
- Is anything I added explainable only in more than one sentence? That's the smell.

Mode B is the cheap insurance that the work you just shipped doesn't become next quarter's Mode A finding. When in doubt after a non-trivial change, run it.

## Workflow (Mode A)

### 1. Scope the hunt

Ask (or infer) the boundary: whole repo, one runtime (`app/`, `server/`), or one domain. A focused scope yields sharper findings. Note the project's conventions first - read root `CLAUDE.md` / `AGENTS.md` for file-size limits, layering rules, state-management norms, and any "this is deprecated, don't touch" notes.

### 2. Dispatch parallel finder agents (opus)

Run several finder agents concurrently, each on a distinct angle, each returning **ranked concrete candidates** with `file:line`, current line count / moving parts, the specific simpler form, confidence, and rough lines saved. Tell them: read-only survey, be concrete (name the replacement), and explicitly skip complexity that is essential.

Angles to cover (split across 2-4 agents):

- **Parallel state / caches** that duplicate a library or encode one choice several times: a hand-rolled singleton cache next to React Query / SWR; a custom event emitter next to context; manual memoization next to `useMemo`; a bespoke retry loop next to the HTTP client's; clusters of `useState(false)` flags for sheets, dialogs, phases, or modes that cannot legally coexist. For boolean clusters, write down the legal combinations first. If the state is "one of these or none," use one union / enum value. Do not merge orthogonal flags or nested surfaces that must coexist.
- **Callback / prop-drilling chains**: child calls `onXResolved` -> parent `setState` -> passes back down. The state lives in the wrong place.
- **Provider / wrapper stacks**: 3+ layers of glue where composition or self-detection would do; `key={...}` remount hacks; refs that track "did I already do X"; effect cascades (effect sets state that triggers another effect).
- **Divergent copies of one domain rule** (concept drift): the same "who counts as X" rule - owner, manager, member, assignee, viewer of a draft, eligible recipient - re-implemented in a TS policy, a hand-written SQL predicate in a list query, a worker fanout, a client `entity.creatorId === user.id` check, a hardcoded role exclusion (`role === 'editor'`). Each copy picks a slightly different set of columns, so they disagree at the edges (one forgets the assignee, one skips team admins, one drops an exclusivity rule, one lets a superadmin through). Tells: comments like "mirrors X" or "superset of X"; the same `OR creator_id = ... OR assigned_to = ...` shape in several files; the client re-deriving a decision the server already makes; a permission flag reused as wording ("you own this" from `canManage`). Method: pick the concept, grep its vocabulary and the columns it reads everywhere (TS, SQL strings, worker, app), write a table of site / who counts / consumer, then diff the rows - every disagreement is a finding. Fix: one canonical module owns the rule, with its per-row form and set form side by side and a test that holds them to the same answers; wider concepts are built on it (manage = own + extras), not re-derived; readers switch to it; labels read the role, gates read the permission. Ask the owner which definition is right before converging - the copies often encode a product question nobody settled.
- **Copy-paste blocks**: the same multi-line try/catch, load-and-authorize preamble, or fetch+error boilerplate repeated across N sites -> one helper. (But: 3 similar lines is fine; don't over-abstract.)
- **Trivial wrappers**: functions that just rename a one-line library call. Inline them.
- **Satellite files**: a file holding one small function that only wraps, extends, or is always used with a neighbouring module (`fooOnBar.ts` next to `onBar.ts`). Merge it into that module.
- **Fat root projections** (GraphQL/ORM): a wide row pre-baked "just in case" instead of field-level resolvers + dataloaders. (Exception: list endpoints where one wide query genuinely beats N+1 batching - that's essential.)
- **Redundant guards**: a safety net stacked on a check that already covers it.
- **Manual reimplementations** of framework features (hand-rolled validation where a schema lib exists, etc.).
- **Parallel create/write paths**: a new feature-specific mutation or endpoint (`saveXDraft`, `createXFromY`) that re-implements creation when a canonical create path already exists and could be **reused or extended with one optional input** (a `sourceId`/`sourceX` field, an extra arg). Tells: the new resolver internally rebuilds or re-derives data the existing creator already accepts; or the client is made to re-upload / re-send something the server already has. Before adding a write path, grep for an existing create/update for that entity and ask "can I add a field to it instead?".
- **One-action multi-write sequences**: one visible Save button awaits mutation A, then B, then C. Trace failure after every step. If the user perceives one save, prefer one server command whose transaction updates the canonical entity plus related rows. Separate storage ownership is not a reason for separate browser requests.
- **Entity-scoped state without an identity boundary**: a route renders entity B in the same component instance that held entity A's editor, confirmation, or reducer state. Check parameter changes and warm-cache navigation. A key at the entity boundary is legitimate identity modeling when all local state belongs to that entity; scattered reset effects are the remount-hack smell.
- **God files**: biggest files by LOC (`find ... | xargs wc -l | sort -rn | head -40`). Distinguish split-by-responsibility from copy-paste-to-collapse from essential-domain-size.

### 3. Triage: essential vs accidental

This is the most important step and the one a careless pass gets wrong. For every candidate, decide:

- **Accidental** - the complexity supports a non-load-bearing requirement, or duplicates something that already exists, or is plumbing that composition removes. **Flag it.**
- **Essential** - genuine domain need: real concurrency/locking, non-obvious SQL (geo, recursive CTEs, lineage), list-cardinality batching, cross-tab sync, error-recovery remounts, content that's just long (templates, fixtures, seeds). **Skip it and say why**, so it doesn't get re-flagged next time.
- **Essential paired forms of one rule** - a per-row check and a SQL set (or a client mirror of a server field for instant UI) can both be needed. That is not the drift finding as long as they live together and a test pins them to the same answers; flag them only when they sit apart or nothing checks they agree.
- **Essential independent activity state** - uploads, requests, or jobs that can overlap need distinct keys or a set/counter. Do not "simplify" them into one raw boolean, which races when one operation finishes before another.

Bias of a good auditor: most suspicious-looking files turn out essential. A clean repo yields **few** real findings. If every file looks like a problem, recalibrate.

### 4. Guard the API surface (do not conflate cleanup with breaking changes)

Internal cleanup is safe. Changing a contract that something else depends on is not. Before flagging, check whether the thing is **API surface**:

- GraphQL type/field names, REST routes + response shapes, event/push payloads, public package exports, DB columns read by other services.
- Shipped mobile clients and external consumers may be weeks behind. Renaming/removing surface breaks them.

If a "simplification" would rename or remove surface, it is **not cleanup** - it's an API migration that needs an additive deprecation window. Put it in a separate **"breaking - needs migration"** bucket; never bundle it with the safe cleanup. Often there's a non-breaking version of the same win (e.g. share the *implementation* behind two stable type names instead of merging the types).

### 5. Rank into tiers

- **Tier 1 - same anti-pattern, delete now**: parallel caches, dead plumbing, the exact over-engineering. Highest value, lowest risk.
- **Tier 2 - DRY / dedup**: collapse copy-paste into helpers. Low risk.
- **Tier 3 - file splits**: mechanical move-by-responsibility of god files. Reviewable on its own.
- **Deferred**: tracked deprecations (let their window close), and breaking API migrations from step 4.

Correctness/clarity wins outrank pure line-count. Report lines saved as a signal, not the goal.

### 6. Present, then apply in verified increments

Present the ranked tiers and let the user choose. When applying:

- One logical change at a time. After each: run the project's `tsc` / typecheck, lint, and tests. Never batch unverified edits.
- Keep tiers in separate commits so the mechanical file-split diff doesn't drown the high-value deletions.
- If a deletion uncovers a latent bug (it often does - the dead complexity was hiding it), fix it and call it out.
- Re-run the full suite at the end. Evidence before "done".

## Red flags that you're adding complexity instead of removing it

If during the cleanup you reach for any of these, stop - you're patching, not trimming:

- Adding a third piece to bridge "X needs Y but Y needs X" (one of X/Y is over-specified)
- Adding another boolean to represent a new member of an already mutually exclusive set
- A new callback prop to sync parent and child state
- A new wrapper/provider/abstraction "to make it cleaner"
- An explanation for why a new piece exists that runs longer than one sentence
- Writing a "mirrors X" or "superset of X" comment - that is a copy of X; call or build on X instead
- Comparing raw ids on the client (`creatorId === user.id`) to decide a role the server already knows

## Output shape

```
## Tier 1 - <same anti-pattern, delete now>
1. path/to/file:line - what it is now (~N lines) -> simpler form. confidence, ~lines saved.

## Tier 2 - DRY / dedup
...

## Tier 3 - file splits (mechanical, separate commit)
...

## Deferred (tracked deprecations / breaking API - needs migration window)
...

## Explicitly NOT touching (essential complexity)
- file - why it's load-bearing
```

End with a recommendation: which tier(s) to apply now, and what to leave.
