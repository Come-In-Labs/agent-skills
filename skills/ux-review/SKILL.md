---
name: ux-review
user-invocable: true
argument-hint: "[feature or flow (seasonal challenge, onboarding, checkout...)]"
description: Use when someone wants a feature checked from the user's point of view - "walk through it as a user", "where do people get stuck", "would people understand this", "can people even find it", "UX review", "persona walkthrough", "spawn some personas", "check it before we launch". Especially for features that unfold over days or weeks (calendars, streaks, challenges, seasons, games) or that outside promotion (posts, stories, pushes, mails) points people to.
---

# UX review with lived persona walkthroughs

## Core principle

**A finding is something a person ran into on their own way through the running product, not something a reviewer suspects.** Several distinct people use the feature in the real app, over the time it really spans, starting from wherever they would really start. Every finding is verified before it reaches the owner.

`cil:audit-product` finds reachable incoherent states from the code and `cil:tighten-copy` fixes wording. This skill finds what people actually trip over, including whether they find the feature at all. Use those two for the follow-up fixes.

## What only a lived walkthrough catches

- **Discoverability.** Can a person find the feature from where they actually are (home, a tab, the menu, a push, an Instagram post)? Does the place that promotion names really hold it?
- **Promise drift.** The intro, terms, labels, help, notifications and marketing each state the rules, and one of them still states last month's rule.
- **Time.** What day 2 and day 3 look like, what a late joiner sees, what the home surface says once the day's action is done.
- **Taught but not kept.** A gesture or flow the intro teaches that the real screen does not support.

## Steps

1. **Inventory the doors and the promises.** Before any persona starts, list from code, copy catalogs, help, push and mail templates, and marketing drafts:
   - every place that tells people where the feature is: tabs, menus, home cards, pushes, mails, posts, stories, help articles;
   - every statement of the rules: intro, terms, labels, empty states, notifications, marketing.

   Step 6 checks both lists.
2. **Design 3 to 5 personas who pull in different directions.** Vary them on:
   - patience: skims or reads everything;
   - skill with apps;
   - motivation: prize, habit, brand fan, sceptic;
   - language and locale;
   - how and when they arrive: existing user from home, newcomer from an outside post, late joiner;
   - their real activity pattern.

   Give each one a name, one line of life, an entry point, a language, the days they live through and what they do between days. Spread them across the timeline so together they cover every kind of content and state: first day, a reward day, a task day, a plain day, joining halfway.
3. **Give every persona its own world.** Parallel personas must never share mutable state.
   - **A fresh account per persona.** Never the owner's account, and no admin rights unless the persona has them.
   - **Its own copy of anything time travel moves.** If "jump to day N" shifts shared data, clone the feature per persona.
   - **Its own browser process.** A browser MCP server is one shared browser, so parallel agents overwrite each other. Launch one persistent browser per persona and drive it over CDP: `scripts/persona-kit.example.mts` has the generic part.
   - **Time and activity through the product's own functions.** Use its dev or seed hooks, not raw SQL that skips side effects. Write down what the kit fakes (for example, activity that only one feature sees) so step 5 can discount it.
   - **Local or dev only, on a single-user machine.** Mint short-lived sessions inside the kit process so no token ever appears in tool output, and revoke them when the browser stops. A browser's debugging port is open to every local process while it runs.
4. **Dispatch one agent per persona, in parallel.** The brief holds:
   - the persona and the day plan;
   - the kit commands;
   - start from the real entry point, and never open the feature by link unless the persona would arrive by link;
   - stay in character while exploring, and when stuck, note it and then find the way anyway;
   - look at every screenshot, ignore dev-only controls, clean up at the end.

   Require this report shape:
   1. who they are;
   2. per day, what they did, with screenshot paths;
   3. confusions: where, what they thought versus what it meant, severity (blocker, slows down, minor), screenshot;
   4. what they liked;
   5. copy that reads wrong, as exact text;
   6. bugs and glitches;
   7. discoverability: how they found it, how long it took, whether the promised path worked;
   8. would they come back tomorrow, would they tell a friend.
5. **Verify before reporting.** Agent reports sound equally sure whether right or wrong. Open the code or reproduce each finding, then sort it:
   - **product problem**;
   - **content problem**: stand-in or editorial text, for whoever writes it;
   - **test artefact**: caused by the kit, such as a shifted clock, faked activity or a page loaded before a time jump.
6. **Hold the inventory against what happened.** A rule statement from step 1 that disagrees with what personas experienced is a finding, even if no persona named it. A door from step 1 that no persona could use is a discoverability finding.
7. **Report to the owner.**
   - **Ranked findings:** by how many personas hit each one and how badly, one line each with persona and screenshot.
   - **Content notes.**
   - **Test artefacts,** named so nobody fixes them.
   - **What they liked,** so nobody removes it.
   - **Would they return.**

   End with one question. Delete the accounts, cloned data and browser profiles; keep the screenshots.

## Kit contract

The kit is one small CLI the persona agents call, one step per command:

| Command | Does |
|---|---|
| `setup <key> <name> <locale>` | account plus that persona's own world, prints the start path |
| `browser <key> <port> <locale>` | phone-sized persistent browser, run in the background; mints the session inside and prints only `ready` |
| `act <key> <port> <verb>` | `goto`, `click`, `tap`, `drag`, `scroll`, `shot`, `text`, `buttons`, `back`, `wait` |
| `day <key> <n>` | moves this persona's world to step n |
| `activity <key> <amount>` | what the persona does between days |
| `cleanup <key>` | removes the account, the world and the profile |

Prove it on a throwaway persona first: one setup, one screenshot, one time jump, one cleanup.

## Common mistakes

| Mistake | Instead |
|---|---|
| Personas as seeded data states that one reviewer walks | Each persona lives its days in order, as its own agent |
| Starting personas on the feature's URL | Start where they start; finding it is part of the test |
| All personas drive one MCP browser | One browser process per persona, driven over CDP |
| Shifting time on shared data while others walk | Clone the feature per persona |
| Passing every agent claim on | Verify, and label artefacts and content separately |
| Listing only problems | Keep the likes; they protect what works |
| "Consider improving the onboarding" | The exact text, the screen, the persona, the screenshot |
