---
name: cross-examine
user-invocable: true
argument-hint: "[PR, branch or diff, plus the other approach if there is one]"
description: Use when a change rests on a design decision that is costly to get wrong, or when two approaches compete and one is about to win - "which approach is better", "the review pivoted to a different approach", "is this pivot justified", "is this biased", "challenge this decision", "check it from different angles", "people say it is cleaner", "what does this break that nobody asked about" - especially for changes to access rules, permissions, data copied or derived from another record, migrations, unique or foreign keys, and contracts between services. Sends separate agents, each with one question, and gives every competing option the same hearing. NOT a critique of one finished feature (use cil:roast), NOT a line-by-line bug hunt (use /code-review), NOT a whole-repo sweep (use cil:audit).
---

# cil:cross-examine - separate angles on one decision

## What this is

A general reviewer improves the approach in front of it. It rarely asks whether the approach is the right one, and it takes the claims in the PR description, the review thread and your own brief as given. A persuasive write-up wins the same way with a model as with a team: nobody asks what the new option costs.

So the decision is questioned by separate agents. Each gets one question and none is told which answer you expect. Every competing option gets the same brief, including the one that is about to lose.

## 1. Write down the decision

Before any agent runs, put three things in plain words:

- **The decision.** One sentence. "Access to a child record is copied from its parent on save" or "it is looked up on every read".
- **The options.** Each with a way to read it: a commit, a diff command, a PR comment. If only one exists, the second option is "what the repo does today".
- **The claims.** List every factual statement the case for the winning option leans on: "this is the existing pattern", "only one mutation writes this", "the framework fires no hook here", "users never reach this path". These are what the Claims agent checks.

Read code that is not in the working tree with `git show <sha>:<path>`. Do not check out another branch in a tree someone is working in.

## 2. Pick the angles

| Angle | The question | Run it when |
|---|---|---|
| **Writers** | Every path that can change the data this rule depends on: is each one covered, and if not, which way does it fail? | The change keeps two things in step, or assumes "only X writes this" |
| **Precedent** | How does the repo solve this kind of problem elsewhere, and what does its history say went wrong with each way? | Someone calls an option "cleaner", "the existing pattern" or "how we do it" |
| **Rollout** | What happens with old code on the new schema and new code on the old one, on real data, and can it be undone? | Migrations, constraints, backfills, contract changes |
| **Claims** | Is each listed claim true in the source, including the installed version of the framework? | Always |
| **One per option** | What is really wrong with this option, what does fixing each defect in place cost, and what is its best case? | Always, the same brief for each option |

Four to six agents is the normal size. Narrow briefs like these suit a fast model.

## 3. Brief them

One message, all agents at once, read-only. The shared frame:

```
Read-only research. No checkout, commit, stash, push or post. No servers.
Code under review: <how to read each option>. Read <convention files> first.
Background: <the decision and the data involved, three to five lines, no verdict>.
YOUR QUESTION: <one angle>.
Give file:line for every finding. Separate what you verified by reading the source
from what you infer. Say what you checked and found fine. Under <N> words.
```

Angle specifics:

- **Writers.** Name the inputs of the rule, then ask for an inventory beyond the obvious mutations: import and export, duplication, restore, background jobs, AI or automation tools, seeds, client-specific code, raw queries, cascades in the database. For every uncovered path it gives a concrete sequence and the direction: someone is locked out, or someone keeps something they should not have.
- **Precedent.** Give it both positions as "two engineers disagree" and ask it to find out what the code does. It tables the comparable cases, then searches the history for past fixes caused by each way of doing it, with counts. It also reports when a pattern has no history because it never existed, which is not a clean record.
- **Rollout.** Point it at the repo's rules for migrations and compatibility. It checks partial failure and reruns, unbounded queries on a large tenant, records that are not the pure case the author had in mind, and it writes the queries to run on production beforehand to size the effect.
- **Claims.** Hand it the list from step 1 and nothing else. For framework behaviour it reads the installed source, not the docs and not memory.
- **One per option.** Identical wording for each. It rates each finding as bug, behaviour change or cosmetic, and says whether the defect belongs to the option or only to this implementation of it.

Leave out which option you prefer, who proposed which, and what the thread already concluded.

## 4. Check what comes back

- Where two agents disagree, open the source yourself. One of them is wrong, and it may be the claim you already repeated.
- Open the source for every finding that would change the decision.
- Sort findings by direction. A failure that locks someone out produces a ticket. A failure that leaves access, data or money where it should not be produces nothing, so it ranks higher.
- "No bugs of this kind in the history" counts only if the pattern existed.

## 5. Report

```
## What stands whoever asked     (verified facts, with file:line)
## What is judgement             (where a reasonable team could choose either way)
## Each option, with its costs   (same shape for every option)
## Corrections                   (what you or the thread said earlier that turned out wrong)
## Not verified                  (inferred, untested, needs production data)
## Recommendation                (one, with the deciding reason, or "open" with what would settle it)
```

Before sending, ask what the person who requested this hopes to hear and whether the report leans that way further than the findings do. If it does, say so in the report. Keep it about the code: no guesses at why someone proposed what they proposed.

## Running it by default

The angles do not need a person to choose them each time. In the project's agent instructions, name the paths that trigger this before review: access and permission code, tables that link or copy between records, migrations, shared contracts. A reviewer that only runs when someone remembers the question misses the failures that never file a ticket.

## Common mistakes

| Mistake | Instead |
|---|---|
| One reviewer asked "is this good?" | Separate agents, one question each |
| Only the winning option gets examined | The same brief for every option, including the one being dropped |
| Asking agents to find what is wrong with the option you doubt | Ask what the code does; give both positions without a verdict |
| Repeating a claim about the framework from memory | The Claims agent reads the installed source |
| Counting covered write paths from the PR description | Inventory the writers of the data, then check each |
| Treating lockouts and leaks as the same severity | Rank the silent direction higher |
| Changing your verdict because the requester pushed | Say what evidence moved it, and what did not |
| A report that argues for one option | Facts, judgement and costs per option, then one recommendation |
