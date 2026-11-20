---
name: trim-tests
user-invocable: true
argument-hint: "[scope: 'post-work' (default, the tests in the working diff), a path, or 'repo']"
description: Use when tests were just written or changed and are about to be committed, when a suite feels slow or brittle, or when someone asks "are these tests worth it", "trim the tests", "too many tests", "this test suite is overkill", "this test breaks on every refactor", "why does this test exist". Hunts four kinds of waste - tests that only guard that a removed or renamed thing stays gone ("no longer shows the old link"), tests written for trivial edits (a removed menu row, a copy tweak, spacing), tests that mock and assert far more than the behavior they are named after (call counts, log lines, internal arguments), and tests or fixture cases that repeat what another test in the file already catches. NOT for finding missing coverage or bugs (use /code-review or cil:audit-code) and NOT for structural complexity in production code (use cil:untangle).
---

# Trim tests: every test earns its run

## Core principle

Keep a test when it can fail for a reason someone cares about: a rule broke, a user-visible behavior changed, data leaked. A test that can only fail because someone deliberately re-added a deleted thing, reworded a log line or refactored internals is pure cost. It runs on every commit, breaks on honest changes, and tells the next reader that the removed thing still matters.

## Modes

- **post-work** (default): the test files added or changed in the working diff (`git diff --name-only` plus untracked `*.test.*` / `*.spec.*`). Run it after writing tests, before committing. Read the change itself first: what was removed, what was renamed, what is new.
- **path / repo**: a grep-led hunt (patterns at the end). For a whole repo, split by directory across parallel agents; each returns candidates in the output shape below, and you read every deletion candidate yourself before deleting.

## Decide by one question

For every absence check (`not.toBeInTheDocument`, `queryBy… null`, `toHaveCount(0)`, `not.toContain`, `not.toHaveBeenCalled`):

**Is there code today that decides whether this appears?**

- **No, it would only come back if someone typed it in again** → history guard → delete.
- **Yes, a branch decides it** (role, permission, tenant, feature flag, status, a privacy or security canary, a lint-like rule that also applies to new code, wording with legal or financial weight) → rule → keep.

## The four kinds of waste

### 1. History guards

The test name or a comment says "no longer", "anymore", "instead of", "drops", "used to", "without the old"; or the test asserts that an old label, sentence, button, route, CSS class, field or link is absent, usually next to a positive check of its replacement.

**Verdict: delete it.** Do not shrink it to one assertion, and do not swap the label check for an href check: that is the same guard in another form. When the test also holds a positive check of what is there now, keep that check and drop only the absence line, and rename the test if its name described the removed part.

### 2. Tests for trivial edits

Removing a menu row, renaming a label, a copy tweak, a spacing, icon, color or order change: no test. Check it by eye or with a screenshot. A test pins new copy word for word only when the words carry a rule (a legal text, a price, a promise to the user).

### 3. Over-specified tests

Signs:
- More mocks than behaviors, and mocks of modules the code under test owns (templates, repositories) instead of the boundary (network, mail transport, clock).
- Call counts, call order and exact arguments of internal collaborators; log messages; debug call counts.
- Asserting that the test's own input reached a mock.
- Full-object equality where one field is the behavior; the same fact asserted twice (a count and every call, a label and its href).
- One test named after one behavior with ten expectations about others; a whole-page snapshot; a fixture builder larger than the code under test.
- The same rule tested in a unit test, a component test and an e2e test: keep the cheapest level that can see it.

**Verdict: shrink to the outcomes the test's name promises.** Prefer real collaborators (a test database, the real template) and mock only what leaves the process. Delete the extra assertions and the mocks, imports and helpers that only they used; do not rewrite them into cleverer forms. An outcome that is a requirement of its own (an audit entry, a stored record, a sent message) is not waste even when the name leaves it out: keep it and put it in the name.

### 4. Overlapping tests and fixture cases

Tests in one file that fail for the same changes, and fixture cases (users, rows, inputs) that take the same path through the code. Typical shape: one test compares the code with a reference (the old implementation, a model method) for every case, and the next test spells out by hand what that comparison already checks.

For each test, ask: **which change to the code under test fails this test and no other test?** Name the change: a line removed, a condition flipped, a query moved into a loop. If there is none, delete the test. If it has one assertion no other test makes (often: the reference comparison would also pass when both sides are empty), move that assertion into the test that covers the rest.

For each fixture case, ask: **which path through the code does this case take that no other case takes?** A path is a branch (`if`, `??`, a filter, a fallback) or an input that changes the result (an empty list, two groups instead of one). Another role, an admin or a second record is not a path of its own when the code treats it the same. If there is none, drop the case and the setup only it needed.

## What trimming never does

- **Add scenarios, edge cases or coverage.** That is a different job. Name a serious gap in one line under "Not done".
- **The one exception: a vacuous negative.** "Members do not see Delete" passes even if nobody ever sees the button. Give it its positive twin in the same test (owners do see it), or delete it.
- **Delete a rule test because it is "not part of this change".** A rule stays wherever it lives.

| Thought | Reality |
|---|---|
| "Keep one absence check, just in case" | A deleted thing returns only when someone re-adds it on purpose. Then the test blocks them; it protected nothing. |
| "It's a regression test" | A regression test guards a bug that a code path can bring back. A deleted link has no code path. |
| "It's cheap, so it's harmless" | It runs on every commit and every refactor has to read it. |
| "While I'm here, add the missing edge case" | Out of scope. One line under "Not done". |
| "The log line documents intent" | Logs are not behavior. A privacy canary over the log is; a string match on a message is not. |
| "This test catches a bug the other one misses" | Name the bug and run it through the other test. If that test fails too, this one adds nothing. |
| "More fixture cases make it more thorough" | A case without a path of its own is the same case run again. |

## Workflow

1. Collect the tests in scope and, in post-work mode, read the change they came with.
2. Grep the candidates (patterns below) and read each test; open the code under test whenever the one question above is not obvious. Then ask the two overlap questions (kind 4) for every test and every fixture case in the file.
3. Give every test, and every assertion whose verdict differs from its test, one verdict: keep, delete or shrink.
4. Apply: delete, shrink, remove what only the deleted lines used, rename tests whose names described a removed part.
5. Run the touched files. They must pass. A test that fails after trimming had a hidden dependency: understand it before putting anything back.

## Output shape

```
Deleted: <file:line> <test> - <the old state it guarded>
Shrunk:  <file:line> <test> - <what was cut> / <what it still checks>
Kept on purpose: <file:line> <test> - <the rule behind an absence check that looks like history>
Not done: <a serious gap noticed, one line>   (optional)
Ran: <command> - <result>
```

## Grep patterns

Assertions: `not\.toBeInTheDocument|queryBy|toHaveCount\(0\)|not\.toContain|not\.toMatch|toBeNull\(\)|toBeHidden|not\.toBeVisible|not\.toHaveBeenCalled|toHaveBeenCalledTimes|toHaveBeenNthCalledWith|toMatchSnapshot|vi\.mock|jest\.mock`

Names and comments: `no longer|anymore|instead of|used to|drops|without the|old |legacy|previously|regression`

Most hits are rules. In a mature suite, expect a few percent to be history guards; read before you delete.
