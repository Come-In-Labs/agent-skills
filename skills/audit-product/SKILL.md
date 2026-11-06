---
name: audit-product
user-invocable: true
argument-hint: "[flow or area (checkout, team invites, onboarding...)]"
description: Use when auditing a product for inconsistencies rather than a screen for design quality - "find product inconsistencies", "audit our user flows", "what edge cases are we missing", "where does this dead-end", "which features should talk to each other but don't", "does this product hang together", pre-launch product review. Also use when two features overlap and nobody is sure which one owns a behavior.
---

# Auditing product coherence

## Core principle

**A finding is a state a person reaches, not code that looks wrong.**

Code-level audits ask "is this correct?". This asks "can someone get here, and does the
product still make sense when they do?" The two produce different lists, and the second one
is ranked differently: by **who reaches this and how often**, never by severity in the
abstract.

The most expensive mistake this skill prevents: reporting an unreachable state as urgent
while a bug every single session hits sits three items lower.

## When to use

- Pre-launch or pre-milestone product review across a whole flow
- Two features overlap and behavior is inconsistent between them
- "Edge cases" hunt: states nobody designed (zero items, cancelled parent, blocked user)
- Looking for features that should connect and don't

**Not this skill:**
- A design critique - one screen's visual hierarchy, cognitive load, persona reactions
- UX design - shaping an experience before code exists
- A technical-quality audit - a11y, performance, theming
- `cil:audit-code` - code defects, dead code, duplication. Complementary: run that
  for "is the code wrong", this for "is the product incoherent"
- `cil:audit` - the full sweep that runs this lens plus untangle and audit-code in one pass

## Step 1: Map the journey before reading any file

Write the stages end to end (create → discover → commit → the event → aftermath, or the
equivalent for your domain). For each stage list **every entry point**, including the ones
that skip earlier stages: deep links, push notifications, shared links, search results,
back-navigation, and a signed-out visitor arriving cold.

Entry points that skip stages are where most incoherence lives, because the state the screen
assumed was established never was.

## Step 2: Run the state matrix (do not skip this for free exploration)

Free-form exploration is unreliable here - see Calibration. Enumerate systematically. For
each stage, walk these states and ask what every surface shows:

| Axis | States to check |
|---|---|
| Cardinality | zero, exactly one, many, at the maximum, over the maximum |
| Ownership | mine, someone else's, one I administer |
| Time | before, during, after, long after |
| Lifecycle | draft, active, cancelled, deleted, expired, parent deleted |
| Permission | allowed, not allowed, blocked/blocking, signed out, guest |
| History | first time ever, returning, already acted, acted then undid |
| Conditions | offline, slow, request failed, partial data |

The richest seams: **cancelled/deleted parents** (does every child surface notice?),
**zero and one** (empty states and singular grammar), and **already acted** (does the UI
offer an action the user has already taken?).

## Step 3: The four hunts

Run these deliberately. Each finds a class the others miss.

**Asymmetry.** For every action, does its inverse exist and work? create/delete, join/leave,
invite/revoke, follow/unfollow, mute/unmute, check-in/undo. Then: does the same state render
the same way on every surface that shows it? A state styled as success in one place and
pending in another is a trust bug.

**Marriage** (the one that needs deliberate hunting - it never emerges by reading files in
order). Where does feature A produce a signal feature B should consume but doesn't? Where
must a user supply something the system already knows? Where was a gate opened on one axis
but not on its dependents - permission widened without widening the notification, search, or
counting that depended on the old rule? Where does a nudge or reminder skip the very person
most likely to act, because eligibility is computed from a proxy?

**Drift.** One rule, N independent implementations. Find a rule that matters (is this
cancelled? is this visible to you? has this ended?) and grep every place that decides it.
Sibling features that disagree are the finding; the canonical helper usually already exists
and the newer surfaces just never adopted it. Look especially at the newest and the
deprecated implementations - the fix sometimes lives in the one scheduled for deletion.

**Dead end.** A state whose screen offers no forward action, or whose copy instructs the user
to do something unavailable there.

## Step 4: The finding contract

Every finding carries these. `REACHED BY` and `TODAY` are required.

```
FINDING: <one sentence, in user terms, not code terms>
STAGE: <where in the journey>
REACHED BY: <who, via what concrete path, how often>
EVIDENCE: <file:line, or the flow you traced>
TODAY: live | latent - blocked by <what>
FIX / OPPORTUNITY: <the change, or the connection worth making>
```

**`TODAY` exists because impact-if-reached is not severity.** A data leak through a feature
users cannot yet create is latent: real, worth fixing before that feature ships, not a
launch blocker. Check reachability before assigning severity - look for the toggle that says
"coming soon", the mutation input that does not exist, the client mode nothing calls
anymore, the entitlement that gates the surface.

Write `REACHED BY` in user terms: "anyone opening the dashboard while an export is in progress,
every session" beats "the `loadDashboardExports` query window".

## Step 5: Rank and present

Sort by **reachability × frequency**, not by category. Then group:

1. **Live and frequent** - hit today, by many, often
2. **Live and narrow** - hit today, by few or rarely
3. **Latent** - real, currently unreachable; name the event that makes it live
4. **Opportunities** - the marriages. Not bugs; connections worth making
5. **Deliberate, checked and correct** - variation you confirmed is intentional. Record it so
   the next audit does not re-file it

## Calibration

**Run this more than once, or with several independent passes.** Measured on a real
codebase: three independent audits of the identical scope produced ~60 findings and agreed
on only a handful. Each found serious issues the other two missed entirely. A single pass is
a sample, not a survey - if the result matters, run several and merge.

Variation is not automatically inconsistency. A different threshold, layout, or rule may be a
deliberate call, sometimes documented in a comment right next to it. Read before flagging,
and put confirmed-intentional variation in the "deliberate" bucket rather than dropping it
silently.

A "missing feature" is not an inconsistency. Wanting the product to do more is a roadmap
conversation; this audit is about the product contradicting itself.

## Common mistakes

| Mistake | Fix |
|---|---|
| Severity assigned by imagined impact | Rank by reachability × frequency. Fill in `TODAY` first. |
| Generic UX advice that fits any app | If the finding would read identically for a different product, delete it. |
| Reading files in order and opining | Trace a path a person walks, from an entry point to a terminal state. |
| Flagging deliberate variation | Check for the comment or decision record first, then file under "deliberate". |
| One pass treated as complete coverage | High variance between passes. Say what you did not cover. |
| Marriages left to emerge | They do not. Hunt them explicitly (Step 3). |
| Findings phrased in code terms | A PM should be able to act without opening the file. |
