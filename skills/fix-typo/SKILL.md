---
name: fix-typo
user-invocable: true
argument-hint: "[a component, screen, page, poster or email - file path, URL, screenshot, or 'post-work' for what you just built]"
description: Use when a screen, card, row, page, poster, slide or email "looks off" and the cause is visual or typographic hierarchy - "the hierarchy is not good", "everything looks the same", "too flat", "too busy", "washed out", "spacing is weird", "I don't know where to look", "the title gets lost", "the label is louder than the title", "rows don't read as units" - and after building any UI, before showing it. Covers size, weight, colour tiers, spacing and grouping, alignment and read order. NOT for the words themselves (use cil:tighten-copy), NOT a full UX or product critique (use cil:audit-product), NOT colour palette or brand design.
---

# Fix typo: make the eye read in the order that matters

## Core principle

**The eye should land on a surface's elements in the order of their importance to this reader in this moment, and nowhere else.** Every visual difference (size, weight, colour, space, position) claims "this matters more" or "this belongs elsewhere". A difference that claims nothing is noise; a claim that is false is a bug.

Hierarchy is decided by purpose before it is decided by pixels. Tuning sizes on a surface whose first-read element is the wrong one polishes the wrong thing.

## Two modes

**Mode B - fix one surface** (the default). A component, screen or graphic the user points at, or what you just built (`post-work`). Run the contract below and ship the change.

**Mode A - hierarchy audit.** Many surfaces. Run steps 1-3 of the contract on each, file findings in the format below, rank by exposure (readers x prominence), then fix surface by surface.

## The contract

1. **Purpose and intended read order.** Name the reader and the moment ("a returning customer scanning the home screen for what to do today", "a follower swiping stories, 2 seconds"). Write the intended order: **1st** (exactly one thing per unit), **2nd**, **3rd**, everything else. If you cannot name one first thing, the surface has two jobs; split it or drop one before styling anything.
2. **Render the current state at real size and measure it.** Screenshot the element at the real viewport and device scale (Playwright / headless Chrome `element.screenshot()`, export resolution for graphics). Cover every state the unit has (empty, in progress, upcoming, joined, long text, missing optional parts), light and dark if themed, phone and desktop if both exist. Read computed styles, not class names, into a role table:

   | Element | Role | Size | Weight | Colour | Gap above |
   |---|---|---|---|---|---|

3. **Find the actual read order.** Look at the render shrunk to a thumbnail (or blurred): the order your eye hits things in is the actual order. Every mismatch with step 1 is a finding. Check the unit against its context too: its siblings in the same column or list, the section title above it, the page title.
4. **Subtract before you restyle.** A line that repeats something already on the surface, or that this reader does not need in this moment, goes. Fewer elements need fewer tiers.
5. **Assign tiers inside these budgets.**
   - **At most three text tiers per unit**, plus one label style per surface.
   - **One heavy weight per unit**: the first-read element. A second bold line, however small, is a second claim to come first.
   - **Two text colours**: primary and muted. Never separate two tiers by weight inside the same muted colour.
   - **Each adjacent pair of tiers differs on at least one strong channel**: size by ≥1.25x, weight by ≥200, or primary vs muted colour. Title vs everything below it differs on two channels. A 1px or 50-weight step is noise; check every pair against the numbers, including the ones you quote.
   - **Demote with colour and weight before size.** Never go below the readable floor (the project's own floors win; without them, about 12px for UI text and 11px for caps labels on screens).
   - **Snap to the project's type scale and tokens.** Invented in-between values (11.5, 12.5, 13) are usually what made the scale flat.
6. **Make space carry grouping.** Gap inside a group < gap between groups < gap between units < gap between sections, each step about 1.5x or more. Things that belong together by meaning sit closest; check that the grouping your gaps draw matches the meaning. No gap may be leftover space between independently positioned blocks: lay a unit out as one flow so every gap is chosen.
7. **One alignment axis per unit.** Centring an element that is built flush left (stacked words, bars, a list) opens a second axis. Everything shares an edge unless a deliberate centred composition owns the whole unit.
8. **Context rules.** A unit's title steps below the section or page title above it. Siblings in one column use one row recipe. A label is never louder than what it labels. An action never outweighs the content it acts on, unless the action is the unit's first-read element.
9. **Re-render and compare.** Before and after at real size, every state from step 2, same scale side by side. Report measured values (sizes, weights, ratios, gaps), not intentions.

## Failure catalogue

| Failure | Tell | Fix |
|---|---|---|
| flat-scale | Several lines within 1-2px of each other | Collapse to three tiers on the project scale |
| weight-inflation | Three or more semibold/bold lines in one unit | One heavy line; the rest regular |
| grey-soup | Tiers told apart only by weight or 1px inside one muted grey | Primary vs muted colour does the work |
| inverted-emphasis | Context (brand, location, metadata) louder than content (the task, the value) | Swap tiers; context goes last and quiet |
| proximity-lie | The gaps group things that do not belong together | Re-gap by meaning, closest = most related |
| leftover-gap | A gap nobody chose, between blocks pinned from top and bottom | One flow; every gap a token |
| split-axis | Centred element above flush-left text | One edge |
| loud-label | Caps label or eyebrow heavier or brighter than the title under it | Label at the surface's one quiet label style |
| heavy-action | Full-width button outweighs the title in a list row | Smaller or secondary control, or a text action |
| below-floor | Demoted text shrunk under the readable size | Demote by colour and weight instead |
| wrong-hero | The first-read element is not what the reader needs first | Change the composition before any pixel tuning |

## Finding format (Mode A)

```
UNIT: <surface, file:line>
READER/MOMENT: <who, doing what, how long>
INTENDED ORDER: 1 <...> 2 <...> 3 <...>
ACTUAL ORDER: <from the render>
FAILURE: <catalogue ids>
NOW: <measured size / weight / colour / gaps>
INSTEAD: <tier assignment, classes or CSS>
```

## Common mistakes

| Mistake | Fix |
|---|---|
| Proposing classes from the source without rendering | Step 2 and step 9 are the work; a proposal without a render is a guess |
| Keeping a second bold line because it is small | Small and bold still claims attention; regular weight, muted colour |
| Shrinking context to 10px to make it quiet | Quiet comes from colour and weight; size stays above the floor |
| Quoting a ratio rule, then shipping a pair that breaks it | Check every adjacent pair with numbers before reporting |
| Fixing the state in the screenshot only | Upcoming, running, done, empty and long-text states share the recipe |
| Restyling a shared component to fix one surface | Keep the change on the surface you were asked about; a shared change is done only when every consumer is rendered before and after |
| Perfecting spacing while the hero is wrong for the purpose | Step 1 first; a well-spaced surface that leads with the wrong thing still fails |
| Adding dividers, boxes or colour to separate tiers | Separation comes from size, weight, colour tier and space; add nothing until those are right |
| Judging from a thumbnail or zoomed crop only | Thumbnail for read order, real size for legibility and rhythm |
