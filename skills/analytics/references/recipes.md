# Recipes

Postgres SQL for the standard read, written against placeholder names:

- `users(id, created_at, ...)`
- `activity_days(user_id, day)`: one row per person per UTC day they used the product
- one table per feature, such as `follows(follower_id, following_id, created_at)`

Swap in the project's real names from its profile. Every block starts from the base CTE, so the exclusions and segments live in one place.

## Running queries

- Start every file with `\pset pager off`, and put `\echo '== A. label =='` before each query so one output file can be read top to bottom.
- Run the whole file with `psql -f` in one read-only session, with a timeout. Save the output next to the query file.
- Quote reserved words used as aliases: `"returning"`, `"day"`, `"user"`, `"order"`, `"group"`, `"limit"`, `"window"`, `"all"`.
- Paste the base CTE into each query with a placeholder, such as `WITH --BASE-- SELECT ...` replaced by a script, so it is written once.
- Timestamps are `timestamptz`, and `day` columns are often UTC dates. Convert on purpose with `AT TIME ZONE '<business tz>'`.

## Base CTE

```sql
b AS (
  SELECT u.id, u.created_at,
    (u.created_at AT TIME ZONE 'UTC')::date AS sday_utc,          -- to join UTC activity days
    (u.created_at AT TIME ZONE '<business tz>')::date AS sday,    -- business calendar
    lower(coalesce(u.signup_platform, '-')) AS plat, u.signup_source,
    CASE WHEN ... THEN '1 home market' WHEN ... THEN '2 second market' ELSE '9 unknown' END AS segment
  FROM users u
  WHERE NOT u.is_staff AND u.disabled_at IS NULL
    AND NOT u.is_synthetic                    -- synthetic, test and system accounts, from the profile
)
```

Join every actor through `b` as well: a follow, a reaction or a game join made by a staff account is not user behaviour.

## Signups per week, by segment and platform

```sql
WITH --BASE-- SELECT date_trunc('week', sday)::date wk, count(*) n,
  count(*) FILTER (WHERE segment = '1 home market') home,
  count(*) FILTER (WHERE plat = 'ios') ios, count(*) FILTER (WHERE plat = 'android') android, count(*) FILTER (WHERE plat = 'web') web
FROM b WHERE sday >= current_date - 70 GROUP BY 1 ORDER BY 1;
```

The same query grouped by `sday` gives signups per day. Grouped by source and UTM over 7 days, it gives the channels.

## Weekly active people, new and returning

```sql
WITH --BASE--, w AS (SELECT generate_series(date_trunc('week', current_date - 63)::date, date_trunc('week', current_date)::date, '7 days')::date wk)
SELECT w.wk, count(DISTINCT d.user_id) active,
  count(DISTINCT d.user_id) FILTER (WHERE b.sday < w.wk) "returning",
  count(DISTINCT d.user_id) FILTER (WHERE b.sday >= w.wk) new_in_week
FROM w JOIN activity_days d ON d.day >= w.wk AND d.day < w.wk + 7 JOIN b ON b.id = d.user_id
GROUP BY 1 ORDER BY 1;
```

## Retention by signup-week cohort, elapsed windows only

```sql
WITH --BASE--, c AS (
  SELECT date_trunc('week', b.sday)::date wk, b.sday_utc s,
    EXISTS (SELECT 1 FROM activity_days d WHERE d.user_id = b.id AND d.day BETWEEN b.sday_utc + 1 AND b.sday_utc + 7) w1,
    EXISTS (SELECT 1 FROM activity_days d WHERE d.user_id = b.id AND d.day BETWEEN b.sday_utc + 8 AND b.sday_utc + 14) w2,
    EXISTS (SELECT 1 FROM activity_days d WHERE d.user_id = b.id AND d.day BETWEEN b.sday_utc + 22 AND b.sday_utc + 28) w4
  FROM b WHERE b.sday >= current_date - 70)
SELECT wk, count(*) n,
  count(*) FILTER (WHERE s + 7 < current_date) w1_n,  count(*) FILTER (WHERE s + 7 < current_date AND w1) w1_back,
  count(*) FILTER (WHERE s + 14 < current_date) w2_n, count(*) FILTER (WHERE s + 14 < current_date AND w2) w2_back,
  count(*) FILTER (WHERE s + 28 < current_date) w4_n, count(*) FILTER (WHERE s + 28 < current_date AND w4) w4_back
FROM c GROUP BY 1 ORDER BY 1;
```

Report `w1_back of w1_n`. Each window's denominator holds only the people whose window has passed.

## Feature use among active people

```sql
WITH --BASE--, a AS (SELECT b.id FROM b WHERE EXISTS (SELECT 1 FROM activity_days d WHERE d.user_id = b.id AND d.day > current_date - 28)),
x AS (
  SELECT 'followed someone' f, follower_id user_id, created_at t FROM follows
  UNION ALL SELECT 'joined a game', user_id, joined_at FROM game_members
  UNION ALL SELECT 'commented', user_id, created_at FROM comments WHERE deleted_at IS NULL)
SELECT f, count(DISTINCT x.user_id) FILTER (WHERE t > now() - interval '28 days') actors_28d,
  count(DISTINCT x.user_id) FILTER (WHERE t > now() - interval '7 days') actors_7d, (SELECT count(*) FROM a) active_28d
FROM x JOIN a ON a.id = x.user_id GROUP BY 1 ORDER BY 2 DESC;
```

A feature with no rows in the window is missing from the output. Report it as zero.

## Concentration: who makes this number

```sql
WITH --BASE-- SELECT left(f.follower_id::text, 6) uid, count(*) n,
  round(100.0 * count(*) / sum(count(*)) OVER (), 1) pct_of_total
FROM follows f JOIN b b1 ON b1.id = f.follower_id JOIN b b2 ON b2.id = f.following_id
WHERE f.created_at > now() - interval '28 days' GROUP BY 1 ORDER BY 2 DESC LIMIT 5;
```

Run it once with the exclusions turned off as well. That shows how much staff or system accounts would have added.

## Social graph

```sql
WITH --BASE--, fo AS (SELECT f.* FROM follows f JOIN b b1 ON b1.id = f.follower_id JOIN b b2 ON b2.id = f.following_id)
SELECT count(*) edges, count(DISTINCT follower_id) following_someone, count(DISTINCT following_id) followed,
  count(*) FILTER (WHERE EXISTS (SELECT 1 FROM follows r WHERE r.follower_id = fo.following_id AND r.following_id = fo.follower_id)) / 2 mutual_pairs
FROM fo;
```

Per week, add the edges that were followed back. For the spread, bucket each active account's out-degree into 0, 1, 2-4, 5-9, 10-24 and 25+.

## Overlap: how many of X also did Y

```sql
WITH x AS (SELECT m.user_id FROM game_members m JOIN users u ON u.id = m.user_id WHERE m.game_id = :x AND NOT u.is_staff)
SELECT count(*) x_people,
  count(*) FILTER (WHERE EXISTS (SELECT 1 FROM game_members y WHERE y.user_id = x.user_id AND y.game_id = :y)) also_y,
  count(*) FILTER (WHERE (SELECT created_at FROM users WHERE id = x.user_id) > :y_end) new_since_y
FROM x;
```

Report it in both directions: what share of X was in Y, and what share of Y moved on to X.

## Experiments and holdouts

Rebuild each person's arm from the rule in code. For a hash split, `hash(id + ':' + salt)`, the first 32 bits mod 100, below the holdout percentage:

```sql
CASE WHEN ('x' || substr(encode(sha256((b.id::text || ':<salt>')::bytea), 'hex'), 1, 8))::bit(32)::bigint % 100 < 20
     THEN 'holdout' ELSE 'treatment' END AS arm
```

Mirror the code's hash exactly: the algorithm, the separator, the byte order, which bits it takes. Then check the arms come out near the intended split.

Restrict to the eligible population: people who could have received the treatment, in the dates the experiment ran, with the outcome window fully elapsed. Pull each outcome per arm, then:

```bash
node scripts/two-proportions.mjs <treat_hits> <treat_n> <ctrl_hits> <ctrl_n>
```

It prints both rates, the difference with a Newcombe 95% interval, z and p, and the smallest difference this sample detects with 80% power. Re-run it at every read and keep the series in the snapshots.

When the arms live in an analytics tool (a PostHog experiment, say), read its results there too. Then check its exposure count against the database's eligible population. Client tools lose everyone who blocked or declined tracking.

## Other sources

- **Product analytics (PostHog and similar):** good for anonymous web funnels, client events and session paths. Filter internal and test users. State the consent coverage: people who declined are missing. Load the tool's own query skill before writing HogQL.
- **Cookieless web analytics (Umami, Plausible):** visitors, referrers and landing pages before signup. Use it to tell "nobody came" apart from "people came and left".
- **Logs (Loki and similar):** whether auth and signup requests arrived and what they returned. Use it for "broken or quiet".
- **Mail and push providers:** delivery, bounces, opens. Note when open or click tracking is off.
