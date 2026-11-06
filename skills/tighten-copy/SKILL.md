---
name: tighten-copy
user-invocable: true
argument-hint: "[paste the copy, a file/path, or a scope (strings, emails, release notes...)]"
description: Use when writing or reviewing words the public will read - UI strings, error messages, empty states, notifications, emails, release notes, changelogs, onboarding, landing pages, store listings, support replies. Hunts the four ways public copy goes bad: implementation talk (servers, retries, migrations leaking to readers), legalistic and courtesy filler ("please note", "we apologize for any inconvenience"), repetition (the same fact or CTA stated twice), and explanations that do not help the reader's next action. Triggers - "tighten this copy", "rewrite this error message", "sounds like a lawyer wrote it", "reads like AI wrote it", "audit our copy", or any task producing a user-facing string. NOT for code comments or internal docs (implementation talk belongs there) and NOT visual critique of a screen.
---

# Tighten copy: public words that earn their place

## Core principle

**A reader finishes any piece of public copy knowing exactly two things: what is true now, and what to do next.** Every sentence either advances one of those or gets cut.

Corollary: readers live in their world (their files, money, access, deadlines), not in yours (servers, retries, tokens, migrations). Ship effects, not mechanisms.

## Two modes

**Mode A - copy audit** (breadth-first). Scope = a product's user-facing surfaces. Harvest, hunt with the four lenses, rank by exposure. See Audit workflow below.

**Mode B - writing/sweeping** (the default). You are writing new copy, rewriting a pasted piece, or sweeping the strings a just-finished feature added. Apply the contract directly.

## The copy contract

Every piece of public copy - toast, email, empty state, release note item, landing section - is assembled from these parts, in this order. Each part appears **at most once** and carries information the other parts do not.

1. **State** - what is true right now, in the reader's world. This is the heading or first sentence. "Sync is paused." "We couldn't charge your card." "You no longer have access to this workspace." Not what the system did, tried, or encountered.
2. **Consequence** - only if it changes the reader's decisions: what this means for their stuff, plus any deadline. "Boards over the Free limit become read-only on {date}." When a reasonable reader would fear losing something, one sentence of grounded reassurance is part of the state, not filler: "Your files are safe on this device." Once. **The fear must already exist.** Reassure only against worries the reader brings to the sentence - a failed payment, files that look gone, an employer who could see personal data. Never introduce a danger just to wave it away: "nobody outside the company sees it" teaches the reader to worry that outsiders might, when "a private workspace" had already settled it. Test: would the reader have asked this question before your sentence raised it? If not, the negation PLANTS the fear instead of settling it - state the fact once, positively, and stop.
3. **Next action** - the single best thing to do now, carried by the button or link label. The body never restates the button; if the body's last sentence tells the reader to do what the button says, delete the sentence.

**One home per fact.** The heading, body, and button each say something different. A fact stated twice is a bug: pick its home, delete the other occurrence. One CTA per message; a second identical CTA is repetition, not emphasis.

The test for every sentence: does it change what the reader knows about their situation, or what they do next? If not, it goes - even if it is polite, even if it is true.

## The translation rule (implementation talk)

An internal fact may appear only translated into an effect the reader can observe. If you cannot name the observable effect, the fact produces no copy.

| You know | The reader reads |
|---|---|
| POST /sync returns 503, job queue saturated, client retries 5x over 2 min | Sync is paused. It will resume on its own; your files are safe on this device. [Sync now] |
| Stripe decline `insufficient_funds`, retry in 3 days, 3 attempts, then downgrade | We couldn't charge your card. We'll retry on {date}; if that also fails, your workspace moves to the Free plan and boards over its limit become read-only. [Update payment method] |
| Migrated SQLite to Postgres; lists load 3x faster | Boards now load about 3x faster. |
| Upgraded frontend to React 19 | (nothing - no observable effect, no item) |

**The zero-effect rule:** an internal change with no observable effect produces no copy at all. Do not dress it up ("under the hood improvements", "assorted stability fixes") and never invent a benefit for it ("snappier experience"). Tightening never adds claims; if you do not know the user-visible benefit, the item is dropped, not decorated.

**The register follows the reader.** "Implementation talk" is relative to the audience, not a banned-word list. On a developer tool's status page, "elevated 5xx rates on the API" is the reader's own language and exactly right. Ask whose implementation it is: the reader's stack is their world; yours is not.

## What replaces filler

Filler is any sentence whose job is sounding careful or courteous rather than informing. The courtesy of good copy is respecting the reader's time; warmth lives in word choice, not in extra sentences.

| Instead of | Write |
|---|---|
| "Please note that X" / "We would like to inform you that X" | "X" |
| "In order to" | "To" |
| "We apologize for any inconvenience this may have caused" | The fix, as the next action |
| "Don't worry" / "Rest assured" | The concrete fact that makes worry unnecessary |
| "If you have any questions, don't hesitate to reach out" | Cut - or a reply-to line, only if replies are read and this message plausibly raises questions |
| "As always, thanks for using X" / "we're listening" | Cut; end on the action |
| "At this time" / "currently unavailable at the moment" | Say when it will be available, or just the state |

**Not filler:** legally required text - unsubscribe links, terms, consumer/GDPR notices, safety warnings. Flag it as `required - confirm with legal owner`; never silently delete it. Legalistic *filler* is lawyer-flavored hedging in ordinary copy, not actual legal text.

## Explanations that earn their place

An explanation stays only when it changes what the reader does, or corrects a wrong belief about their own stuff.

- **Never speculate about causes you don't know.** "It may have been made private, or your access may have changed" is guessing dressed as information. If you cannot say why, say what is true and offer the action.
- **Never narrate system effort.** "We tried 5 times over the last two minutes" is your diary, not their situation.
- **Never expose bookkeeping.** Attempt counts, retry schedules, queue states. Give the reader the one date or deadline that matters and the final consequence, once.

## Audit workflow (Mode A)

1. **Harvest surfaces.** i18n catalogs and string files, hardcoded JSX/template strings, toast/error helper call sites, email templates, empty states, onboarding flows, store listings, README and landing pages, changelog. Note the audience of each surface (consumer vs developer) before judging register.
2. **Hunt with the four lenses.** Greppable tells, then read every hit in context:
   - *Implementation talk:* `server`, `database`, `request`, `token`, `cache`, `sync failed`, `an error occurred`, `unexpected error`, `try again later`, HTTP codes, library names in user strings.
   - *Filler:* `please note`, `in order to`, `we apologize`, `any inconvenience`, `don't hesitate`, `feel free`, `at this time`, `thank you for your patience`, `rest assured`.
   - *Repetition:* the same CTA label twice in one template; a body sentence containing the button's verb; the heading's phrase repeated in the first body sentence.
   - *Planted fears:* `nobody`, `no one`, `never shared`, `won't see`, `niemand`, `keine sorge`, `don't worry` - read each hit and ask whether the fear predates the sentence; a negation guarding against a worry the copy itself introduced gets cut, not softened.
   - *No next action:* terminal screens, error toasts, and emails with no actionable verb, or whose only instruction points at something unavailable there.
3. **File findings** in this shape:

```
COPY: <surface, file:line>
READ BY: <who, in what moment, roughly how often>
FAILURE: implementation-talk | filler | repetition | no-next-action | required-legal
NOW: <current text>
INSTEAD: <rewrite honoring the contract>
```

4. **Rank by exposure**: readers x prominence x emotional stakes. A payment-failure email read by every lapsing customer outranks ten awkward tooltip strings. Apply fixes surface by surface, keeping each rewrite's diff reviewable next to its `NOW`.

## Common mistakes

| Mistake | Fix |
|---|---|
| Cutting legally required text as "legalistic filler" | Required text is flagged, never deleted. Filler is hedging, not law. |
| Cutting the reassurance a scared reader needs | Fear of loss is real content. One grounded sentence, once. |
| Reassuring against a fear the reader never had | The negation plants the worry it answers. State the fact once ("private"), and reserve reassurance for the audience's standing fears. |
| Banning the audience's own jargon | Developers read "API" and "503" natively. Register follows the reader. |
| Inventing a benefit so an internal change can stay | Zero-effect rule: drop the item. Tightening never adds claims. |
| Stripping tone until copy reads robotic | Warmth lives in word choice inside informative sentences, not in added ones. |
| Body restating the button or the heading | One home per fact. Delete the restatement, keep the part that carries it. |
| Judging pasted copy without asking who reads it | Audience and moment first; the same sentence can be right for one surface and wrong for another. |
