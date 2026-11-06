# AI-coding failure modes: the hunt catalogue

Angles to split across parallel finder agents. Each entry: what it is, how to detect it,
and the calibration note that stops it becoming a false positive.

Sources for the pattern list: GitClear's 2025 analysis of 211M changed lines (code cloning
up 4x, copy/paste overtook moved code, refactoring fell from 25% to under 10% of changed
lines); OX Security's 2025 review of 300+ repos ("Army of Juniors"); Veracode's 2026 GenAI
code security update; plus the vibe-code anti-pattern lists in circulation.

---

## 1. Duplicate divergence (the highest-yield angle)

**Why it dominates:** an LLM clones logic instead of reusing a helper because it does not
know the helper exists. Copies then drift independently.

Grep for repeated concepts rather than repeated text: date/relative-time formatting,
currency/unit formatting, slug generation, initials/avatar fallback, truncation,
escaping (HTML/XML/SQL), error→message mapping, image URL building, debounce/throttle,
array chunking, base64 conversion, clipboard/share, retry loops, ID generation.

Also: near-identical components across sibling feature folders, and near-identical
server helpers (two ways to resolve the current user, two pagination cursor encoders,
two permission checks for one entity).

**Calibration:** three similar lines is not duplication. The finding is worth reporting when
either (a) the copies have already drifted behaviorally, or (b) one copy is missing a fix
the canonical version has. Drift is what makes it a bug rather than an aesthetic complaint.

## 2. Reimplementation of an existing internal helper

The special case of #1 worth its own pass: a hand-rolled version of something the repo
already solved *and tested*. Find the canonical helper first (highest import count wins),
then grep for its logic being open-coded elsewhere.

**Tell:** the canonical version handles an edge case the copies do not, and there is a
passing test proving the edge case matters.

## 3. Bypassed canonical paths

A component calls a platform/browser API directly instead of the repo's wrapper, and
silently loses everything the wrapper handles (native branch, error taxonomy, fallback,
telemetry). Grep for raw platform calls that have an in-repo wrapper.

**Higher severity than duplication:** the behavior is genuinely missing, not just repeated.

## 4. Dead code and orphans

Whole unused files, unused exports, unreferenced feature folders, expired shims, stale
feature flags, commented-out blocks, stray debug logging.

**Calibration - this angle has the worst false-positive rate.** A dead-code scanner cannot
see: framework file-name conventions, build `entryPoints` strings, GraphQL fragment spreads,
registry/config lookups, ambient `@types`, native entry points, dynamic route strings.
Verify every hit by hand. Also check `.tsx`/other extensions are actually in the scanner's
glob - a missing extension silently undercounts and produces phantom "unused dependency" hits.

## 5. Expired deprecation shims

Grep `DEPRECATED`, `@deprecated`, `remove after`, `TODO: remove`, `LEGACY`, and cross-
reference every date against today. Report expired vs still-open separately.

**Also report undated shims** - a deprecation with no date can never expire and will
outlive everyone who understood it.

## 6. Test theater

- **Assertion mirage:** `toBeDefined()` / `toBeTruthy()` / `not.toThrow()` as the *only*
  assertion. Filter to tests where every assertion is mirage-style; most raw grep hits sit
  beside real assertions.
- **Inflated coverage:** tests for one-line derivations, tests restating the implementation,
  test seams (`buildX()`, injected `now?`) added solely to make trivial code testable.
- **Mock-heavy tests of things mocks cannot verify:** DB transactions, advisory locks,
  atomic increments, unique constraints, races. A `Map`-backed fake Redis trivially
  serializes, so it cannot catch the race the test claims to cover.
- **Coverage gaps that matter:** list the riskiest modules (money, entitlements, authz,
  ranking, scheduling) and check each for a real test. One genuine gap beats twenty
  style notes.

## 7. Type escape hatches

Count `any`, `as any`, `@ts-ignore`, `@ts-expect-error`, `as unknown as`, non-null `!`.

**Calibration:** raw greps massively overcount. Prose comments contain "any"; GraphQL SDL
in template literals (`ID!`, `[Type!]!`) looks exactly like a TS non-null assertion. Filter
before reporting a number, and report per-area counts with the worst files named.

## 8. Convention drift

Repo-specific rules that were adopted but never applied uniformly: layout primitives,
design tokens vs hardcoded colors, i18n wrapping vs hardcoded strings, logging helper vs
raw console, error-handling shape.

**Always report a denominator.** "0 of 41 admin routes use the mandated container" is
actionable; "found 3 violations" is not.

## 9. God files and fat components

Biggest files by LOC. Classify each as: split-by-responsibility (name the exact cut points),
copy-paste-to-collapse (name the loop/config table), or essential domain size (long
fixtures, flat schema modules, templates) - and leave the third kind alone.

For components, count hooks, queries, and whether logic sits inline in JSX. Flag effect
cascades (an effect that sets state that triggers another effect).

**Calibration:** big and coherent with low churn beats small and scattered. Cross-reference
against the churn list - a 1400-line file nobody touches is not the problem.

## 10. Impossible state combinations

Look for clusters of independent booleans that actually describe one choice: several
`is*Open` flags for mutually exclusive overlays, separate loading / success / error flags,
or one flag per workflow step. Enumerate the legal combinations. If the model permits
states the UI or domain forbids, replace it with one union / enum / discriminated state
plus an idle value.

**Disproof requirement:** prove the flags are mutually exclusive. Editing plus a nested
date picker, loading plus stale data, or two independent panels may intentionally coexist.
Report structural state-space inflation as debt; call it a bug only when a real transition
can activate an invalid combination or render conflicting behavior.

## 11. Data-layer performance

Unbatched per-row resolvers on list paths (N+1), wide projections pre-baked "just in case",
missing indexes on filtered columns.

**Disproof requirement:** show the field is actually selected by a real client query on a
list path. "Could be selected" is not a finding.

## 12. Error handling shape

Generic catch-alls collapsing every failure into one status; the inverse - swallowed errors
(empty catch, catch-and-continue); and inconsistent taxonomies across sibling endpoints.

**Calibration:** best-effort fire-and-forget cleanup (cache invalidation, orphan deletes)
legitimately swallows errors. Read the comment before flagging.

## 13. Security-shaped patterns

Types used as if they were runtime validation; auth applied inconsistently across sibling
routes (newer endpoints missing it); secrets in source; missing ownership/row-level checks.

**Calibration:** verify the guard is genuinely absent rather than applied one layer up at
the router or middleware. Check the mount point before reporting a missing guard.

---

## Angles that are usually NOT worth an agent

- **Comment density.** Reported as the most common AI artifact, but long explanatory
  comments are indistinguishable from good documentation, and stripping them destroys the
  "why" that makes an unfamiliar codebase readable. Skip unless comments are provably stale.
- **"Monolith instead of microservices".** Architecture preference, not a defect.
- **Formatting.** A linter's job.
