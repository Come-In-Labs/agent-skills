# Analytics profile: <product>

Confirmed by <owner> on <date>. Update this file whenever a definition, an exclusion or a trap changes.

## Sources

| Source | Holds | How to reach it, read-only |
|---|---|---|
| Product DB replica | Accounts, actions, the per-day activity table | `<tunnel command>`, then `<secret runner> -- psql ... -f <file>` with a read-only session and a timeout. Close the tunnel afterwards. |
| Product analytics | Client events, web funnels | `<tool or API>`. Consent coverage: `<share or "unknown">`. |
| Web analytics | Visitors and referrers before signup | `<API>` |
| Logs | Request outcomes | `<query entry point>` |

## Who is not a user

Exclude these as subjects and as actors:

- staff and admin: `<predicate>`
- test, seeded, synthetic and system accounts: `<predicate>`, defined in code at `<path>`
- disabled or deleted accounts: `<predicate>`
- a spam or bot cohort, kept out of retention reads: `<predicate>`

## Definitions

- **Active:** `<an opened day in activity_days (UTC days)>`
- **Signup day and week:** `<created_at in the business time zone, weeks start Monday>`
- **Returning:** signed up before the period.
- **Privacy floor:** a group figure needs at least `<5>` people.

## Segments

`<region CASE, or market / platform / source>`. Keep the SQL in the base CTE (`queries/base.sql`).

## Features and their proof

| Feature | Table and condition |
|---|---|
| `<created a project>` | `<projects.owner_id, created_at>` |

## Experiments and holdouts

| Name | Assignment | Split | Eligible | Start | Outcomes and window |
|---|---|---|---|---|---|
| `<onboarding holdout>` | `<sha256(id + ':<salt>'), first 32 bits mod 100 < 20>` | 20% holdout | `<verified signups>` | `<date>` | `<back on 2+ days in 14>` |

## Traps

- `<returning and day are reserved words: quote the aliases>`
- `<one staff account follows every new signup>`

## Last read

`snapshots/<date>.md`: compare the next read against it.
