---
name: analytics
user-invocable: true
argument-hint: "[question or area (signups, retention, a campaign, an experiment...)]"
description: Use when someone asks how a product is doing in numbers - "recheck analytics", "give me an update on the numbers", signups, active users, DAU/WAU, retention, cohorts, activation, feature adoption, funnels, follow or social graph, game, challenge or campaign numbers, "did the holdout / A/B test / experiment work", "how many of X also did Y", "is signup broken or just quiet", a partner's numbers question about their campaign, or a numbers report, weekly update or one-pager to pass on to the team, investors or a partner.
---

# Analytics: read the product's own numbers

## Core principle

**A number is an answer only with its definition, its denominator and the last read beside it.** Read the system of record first (a read-only replica of the product database), say what changed since the last read, and keep randomized comparisons apart from correlations.

## The profile comes first

Each project keeps one profile at `.analytics/profile.md` in the repo root (template: `assets/profile.example.md`), with saved queries in `.analytics/queries/` and past reads in `.analytics/snapshots/`. Read the profile before any query. It holds what a cold start has to rediscover:

- **Sources** and how to reach each one read-only: the connection recipe, never a secret.
- **Who is not a user:** staff and admin, test, seeded or synthetic, system, bot or spam accounts. Find them in code: search for `superadmin`, `staff`, `internal`, `synthetic`, `seed`, `demo`, `test`, `system`, and the filters the product's own mailers already apply.
- **Active:** the definition, and the table that records it. A per-day activity table beats a `last_seen` column, which is overwritten and has no history. It also beats consent-gated client analytics, which miss everyone who opted out.
- **Calendar:** the business time zone, the week start, and which columns hold UTC.
- **Segments** that change the story: market or region, platform, signup source.
- **Features**, each with the table that proves it was used.
- **Experiments and holdouts:** how the arms are assigned (a hash with a salt, a column, a flag), the split, the start date and the outcome window.
- **The base query** (the exclusions plus the segments), and known traps.

If no profile exists, build one from the schema, the code and the docs. Show the owner the exclusions and the definition of "active" in a few lines and get them confirmed once. Ask before committing `.analytics/`, because snapshots hold business figures.

## The standard read

"An update" or "recheck" means every block below. A narrower question still gets its denominator and its comparison. `references/recipes.md` has SQL for each block.

| Block | What to pull |
|---|---|
| Accounts | Total by segment, new in 7 and 28 days, active in 7 days |
| Signups | Per week (about 10 weeks) and per day (10 to 14 days), by segment, platform and source |
| Activity | Weekly active people split into new and returning, daily active people for the last 10 days |
| Retention | Signup-week cohorts: came back in days 1-7, 8-14 and 22-28 |
| Activation | The key first actions within 7 or 14 days, per cohort |
| Feature use | Of the N people active in 28 days, how many used each feature in 28 and in 7 days |
| Live objects | For each running game, challenge or campaign: members, joined this week, did the core action, still opening the app |
| Social graph | Edges, people with at least one, mutual pairs, new edges per week and the share reciprocated, the out-degree spread |
| Experiments | For each running holdout or A/B test: arms, n, outcome rates, the difference with its interval |
| Lifecycle messages | Mails and pushes sent and delivered per run |

Then answer what the owner asks next before they ask it:

- **Who drives the number?** Concentration: the top actor's share.
- **How many of X also did Y?** Overlaps between cohorts, games and campaigns.
- **Is it broken or just quiet?** See below.

## Rules for every number

1. **Exclude non-users as subjects and as actors.** A staff account that follows every newcomer turns "got a follower in week 1" into a count of that account. Use real people in denominators too: "18 of 31 players" when the board shows 32, one of them staff.
2. **Put the denominator beside every rate:** "16 of 17", not "94%". Below about 20, give counts only.
3. **Check concentration before reporting a total.** If one account makes more than a fifth of it, say so.
4. **Compare like with like.** Cohort rates use fully elapsed windows only. Mark the current day and week as partial. Compare equal window lengths and the same weekdays. Convert time zones explicitly.
5. **Observational is not causal.** "People who did X in week 1 stayed" describes who chooses X. Only randomized arms support "X causes". Rebuild arm membership from the assignment rule, never from exposure: "got no mail" picks the unreachable.
6. **Read experiments whole.** Take the eligible period from the code's history: when assignment started and when it was switched off (`git log -S <salt>`). Check that the control really went untreated. Measure every outcome in a fixed window per person ("back in days 8-14"), never "active in the last 7 days" counted from today, which mixes people of different ages. Give n per arm, both rates, the difference with a 95% interval, and the smallest effect this sample could detect (`node scripts/two-proportions.mjs`). A lift that fades in later windows is a finding of its own. One significant read is not a stopping rule.
7. **Keep people out of the output.** No names, emails or handles. Use a short id prefix when one account must be singled out. A group figure needs at least 5 people, or the project's own floor.
8. **Explain jumps.** More than twice the last snapshot needs a cause (a campaign, a launch, a bug, a changed definition) before it is reported as growth.

## Before calling something broken

For zero signups or a sudden drop, check these before reporting an outage:

- the auth and signup endpoints in the logs: errors, or requests that never came;
- the traffic and its referrers in web analytics: did visitors arrive and stop at the first screen;
- the window itself: a partial day, a quiet weekday, a holiday.

## Safety

- **Stay read-only.** Use the replica, a read-only session (Postgres: `PGOPTIONS='-c default_transaction_read_only=on'`) and a timeout.
- **Inject secrets** through the project's secret runner and never print them.
- **Close only the tunnels you opened.**
- **Never write, backfill or "fix" data** while reading it.

## Report shape (to the owner)

1. **Headline:** 2 to 4 sentences on what changed since the last read and what it means.
2. **The blocks** in the standard order. Each is a short table or 2 to 4 bullets, with the previous read in brackets.
3. **Each experiment** with a verdict: lift, no detectable lift, or too small to tell.
4. **Caveats:** exclusions, partial periods, what could not be measured and why.

Write in the owner's language. When a partner asked, add a ready-to-forward line in their language.

## Shareable report (for other people)

When the numbers go to anyone besides the owner (the team, investors, a partner), also write a Markdown file at `.analytics/reports/YYYY-MM-DD-<audience>.md`, built from `assets/report.example.md`. It is a document a reader outside the codebase understands on its own, in these parts:

1. **Title:** the product or campaign, the period covered, and the date, time and time zone of the read.
2. **In short:** 2 to 4 sentences, each a takeaway with its number.
3. **One section per topic** this reader cares about. Each is a table with this period and the previous period side by side, or 2 to 4 bullets. Every figure says in plain words what it counts ("people who opened the app at least once that week").
4. **Tests:** one line each, the result and the verdict in plain words ("the tour group came back more often, but the groups are too small to be sure").
5. **How to read these numbers:** who is counted, what active means, the calendar and time zone, which period is incomplete, and the smallest group shown.

The period is the last complete week or month, with absolute dates. The words are the reader's: features by the names the product shows, and no table or column names, query text, account ids or internal code names. Staff and test accounts appear only as "left out".

Pick the content by reader:

| Reader | Contents |
|---|---|
| Team | The standard read, condensed, with the owner's next questions answered |
| Investors | Growth, activity, retention and the strongest proof points. A test result appears only with its verdict. |
| Partner | Their campaign: participants, activity, completion, reach, and their own participants' history in the product (how many are new, how many took part in an earlier campaign, by its public name). Anything the product already shows publicly, such as a leaderboard, appears as shown there. Platform-wide figures only when the owner agrees. Never another partner's own figures. |

Write it in the reader's language and in the product's own voice, with one form of address throughout. Read it once as that reader before showing it: every date matches its weekday, every number matches the read, and every question the reader already asked is answered. Show the owner the file before it goes anywhere: the owner sends it. Where pages can be published, offer the file as a page as well.

**PDF.** When the report will be printed, attached or forwarded as a file, print it with `node scripts/report-to-pdf.mjs <report.md>`: A4 on white paper, hairline tables, page numbers. `--css <brand.css>` sets the project's fonts and accent. Then read every page of the PDF before showing it: the name leads page 1, no page is mostly empty, and no table is cut. Fix the Markdown, not the PDF, and print again.

## After the read

1. Save `.analytics/snapshots/YYYY-MM-DD.md`: the headline numbers, compact, which the next read compares against. A shareable report is written for people. The snapshot is for the next read, and stays separate.
2. Keep new or fixed queries in `.analytics/queries/`.
3. Add any new trap or definition to the profile.

## Common mistakes

| Mistake | Fix |
|---|---|
| Retention from client analytics events | Use the server's per-day activity table. Client analytics only covers people who consented. |
| Retention from a `last_seen` column | Overwritten, no history. Use per-day rows. |
| Arm = "did not get the treatment" | Recompute the assignment hash with its salt. |
| Rates for the current, unfinished week | Mark it partial, or gate on elapsed windows. |
| A staff account in a player count or a social metric | Exclude it as subject and as actor. |
| "94% retained" from 17 people | "16 of 17". |
| A query dies on `returning`, `day`, `user` or `order` as an alias | Quote reserved words: `"returning"`. |
| Rediscovering the connection, exclusions and segments every time | Write them to the profile the first time. |
