---
name: roast
user-invocable: true
argument-hint: "[branch, PR or path of the feature]"
description: Use when a feature, branch or PR was just built and someone wants it looked at critically before it ships or before review - "roast this", "roast the implementation", "tear it apart", "be critical", "what did we miss", "does this fit the codebase", "is this maintainable", "what is untested", "what about the cases we forgot" - especially for a large, fast or AI-built change, a port of a prototype, or a second implementation of something the product already has. NOT a whole-repo sweep (use cil:audit), NOT a line-by-line bug hunt on a diff (use /code-review), NOT a walk through the running app as a user (use cil:ux-review).
---

# cil:roast - three critics on one feature

## What this is

A feature is judged against the codebase and product it lands in, not on its own. The author, human or agent, knows what was built and is blind to what was left out. So three fresh agents read the change, each with one question, and none of them is told what the author thinks of it.

| Critic | The question | Measured against |
|---|---|---|
| **Coherence** | Where does this ignore, duplicate or contradict how the repo already does things? | The neighbouring modules |
| **Maintenance** | Who pays for this in six months? | The change itself |
| **Gaps** | What does the existing product do that this forgot, and what has no test? | An inventory of the existing product |

The third critic finds the most. A new player, editor, importer or API almost always covers the cases its author thought of. The old one covers the cases users hit.

## 1. Scope it

- Name the change as a diff a stranger can run: `git diff <base>...HEAD`, a PR number, or a path. For stacked PRs, review the whole stack as one.
- Write three lines the critics get: what the feature is, where its code lives, and which existing thing it replaces, extends or sits beside. That last line is what makes the Gaps critic possible. If nothing existing is close, say so and name the nearest sibling feature.
- List what to ignore (untracked scratch folders, generated files).
- Point at the repo's convention files. Do not paste them.

Leave out your own verdict, your known-issues list and the review history. A critic handed your conclusions returns them confirmed.

## 2. Send three critics at once

One message, three read-only agents. Every brief has the same frame:

```
Critical, unsparing review. Read-only: no edits, commits, pushes or posts. No servers.
Change under review: <diff command>. Ignore: <list>. Read <convention files> first.
What it is: <three lines from step 1>.
YOUR LENS: <one of the three below>.
Verify every claim against the source and say what you checked. Do not manufacture
findings; mark anything you could not verify as unverified. A fix is a deletion, a
reuse or a dropped requirement, never a new layer. Report at most <N> findings, ranked,
each with file:line, the concrete failure or cost, and the smallest fix.
```

**Coherence.** Name the neighbours to compare with, per layer: the existing component that does the same job, the data layer other domains use, the form and service patterns next door, the resolver, model, migration and test conventions of sibling modules, naming, folders, styling, translation and test-id habits. Each finding quotes the existing convention with its own file:line, then what the new code does instead. Ends with what was checked and found coherent.

**Maintenance.** Accidental complexity, one rule written in several places (lists, limits, validation on server, client and prompt text), stored shapes and how they evolve, what an older client or server does with newer data, leftovers of a port, casts, failure states, performance, tests that assert little, docs that will rot. Essential complexity is named and skipped. Ends with a verdict: shippable as is, and what must change before real users get it.

**Gaps.** Build the inventory from the existing product first, then check each item against the new code and its tests:

- every variant of the core entity (each type, mode, status, template, role)
- every feature the existing implementation supports for those variants
- every way in (deep link, search, push, embed, export, import, API, older client)
- every state (empty, locked, expired, offline, failed, mid-way, repeated)
- what is recorded (analytics, progress, points, audit trail) compared with the existing path

Each gap is classed: silently broken for users, degraded but acceptable, or a documented difference. Output is a coverage table for the variants, then the ranked gaps, then what is well covered.

Size N to the change: 12 per critic for a feature of a few thousand lines, 15 for Gaps.

## 3. Check before you pass anything on

The critics report in a confident voice whether they are right or not.

- Open the source for every finding that would change what ships. Drop the wrong ones and say how many you dropped.
- Merge findings two critics both hit. A duplicated rule is a Coherence and a Maintenance finding; report it once.
- A finding that indicts your own work gets the same check as any other, and the same place in the report.
- Suggestions to add a wrapper, provider or abstraction go in as "likely over-engineering" with the trim beside them.

## 4. Report

```
## Must fix before it ships        (broken for users, data or security)
## Should fix before the flag goes on
## Known differences to write down (acceptable, but undocumented today)
## Not fixing, and why
## Coverage                        (the Gaps table)
Checked N findings against the source, dropped M.
```

Each line: file:line, what breaks for whom, the smallest fix. Then stop and let the owner pick. Fixing is a separate request, and a roast that rewrites the feature has stopped being one.

## Common mistakes

| Mistake | Instead |
|---|---|
| One agent with all three questions | Three agents; a single reviewer settles into one lens |
| Telling the critics what you already suspect | Give them the code and the question only |
| Gaps critic reads only the diff | It starts from the existing product and works towards the diff |
| "Not covered" with no user consequence | Say what a user sees: an error, a blank, a silent skip |
| Passing the three reports on as they came | Verify, merge, rank on one scale |
| Roasting a whole repository | That is cil:audit |
