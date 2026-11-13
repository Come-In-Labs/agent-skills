---
name: visualize
user-invocable: true
argument-hint: "[spec, plan, PR or feature to draw]"
description: Use when someone wants a design, feature, flow or data model shown as real diagrams instead of prose - "visualisiere das", "zeig mir die Abläufe als Diagramme", "draw the flows", "show the schema", "before and after", "what changes in the data model", "what can be dropped or shrunk", "side by side today vs new", "Datenschema aufzeigen" - for a spec, a plan, a redesign or an existing feature, usually as a page to share. NOT a single quick chart of numbers (use dataviz), NOT a UI mockup (use a design tool), NOT a review of the design itself (use cil:roast or cil:cross-examine).
---

# cil:visualize - flows and schema as diagrams that say something

## What this is

A diagram earns its place when a cold reader sees a mechanism they would otherwise assemble from prose: who decides, what gets stored, where two records exist for one thing, what disappears. A box per noun with arrows between them says nothing the spec did not.

The page shows **today and after** side by side, wherever something changes. Every statement about today is read in the code before it is drawn. Proposals are labelled as proposals.

## 1. Collect the facts first

Before drawing anything, write down what the figures will claim and check each claim in the source:

- the stored values behind every state (enum or status column values, not invented labels)
- every table and column you will show, read from the schema files
- who triggers each transition (a person, the system, a webhook, a cron job)
- counts you will print ("20 files read this table"), measured with a grep you can repeat
- columns or tables that nothing reads or writes; a grep for readers and writers proves it

Keep the file:line for each. A wrong fact in a confident diagram does more damage than a missing diagram.

## 2. Pick the figures

Draw only what the decision turns on. Most designs need four to seven figures from this set:

| Figure | Shows | Must carry |
|---|---|---|
| **Ways in** | Inputs to the stores they land in | Edge labels saying what happens automatically, and who decides |
| **Lifecycle** | States of the main record | The stored value under each state; edges labelled by actor or trigger; the transition nobody approves, marked |
| **Who creates what** | One flow, step by step | Per step: an actor pill, the action, and the record that comes into being. Duplicates become visible here |
| **Computation** | How a derived result is built | Stages in order, sources feeding in, what is stored and what is only computed |
| **Schema today** | Tables that move, columns that matter | What goes away, marked × in the warning colour, with the phase it goes in |
| **Schema after** | The same tables after the change | New columns +, changed ~, each tagged with its phase; a "goes away" box |
| **Shrink table** | Everything that can be dropped or made smaller | Today (verified), after, when; what can go **now** without waiting for a phase |

Pair today and after for every figure where both exist. A "new" figure without its "today" hides what the change costs. For a feature that is already built, "after" is the trimmed version the shrink table proposes.

Pick figures from the reader's question, not from the code's structure. The reader is usually the person who decides what the product does. A component tree, a call graph of server functions or a request sequence through every helper describes the code, and belongs on the page only when the question is about the code's structure.

**The page is, in this order:** a three-line summary with the legend; the figures, today next to after; the schema pair; the shrink table; the phases with their schema change, when the work ships in steps; one line naming the spec, plan and other pages it draws from. Test coverage maps, file indexes and decision lists are not part of it.

## 3. Draw by hand, as inline SVG on a page

Publish an Artifact page. **REQUIRED SUB-SKILL:** load `artifact-diagramming` for the SVG mechanics and the page contract, then:

- **Theme through page CSS classes** on the SVG elements (`.n`, `.n-new`, `.n-warn`, `.n-gone`, `.e`, `.el`), each reading colour tokens defined on `:root` with dark-mode overrides. No literal colours inside the SVG.
- **One state language across all figures:** unchanged, new or changed, a problem today, goes away (dashed in the warning colour), computed and not stored (dashed neutral). Show it once in a legend at the top.
- **Give every marker id a per-figure prefix** (`f2a-arrow`). Ids are page-wide, and a duplicate silently breaks arrowheads in the other figures.
- **Put wide figures in an `overflow-x: auto` wrapper** with a `min-width` on the SVG, so the page itself never scrolls sideways.
- **Lay out on fixed columns and rows.** Write the coordinates down before the markup. Schema boxes get a header band plus 18 px per row.
- **Draw FK lines only between neighbouring columns**, routed orthogonally through the gap. Farther relations go into the row text as `client_id → clients`. Twenty crossing lines read as noise.
- **Budget the text.** At these sizes, mono 10.5 px is about 6.3 px per character, body 11 px about 5.5, and bold 12.5 px about 7. Shorten a label rather than let it run past its box.
- **Keep edge labels off the line.** For a curve, estimate the point at the label's height and set the label beside it, not on it.
- **Write a caption under each figure** that states its claim and what the drawing leaves out, such as an edge drawn only in the caption or an exception.

## 4. Check before publishing

- Run a script over the page: balanced `<text>` tags, no duplicate ids, none of the project's banned characters.
- Look at the page once in light and dark mode at phone and desktop width, if the session offers a preview.
- Re-read every number and name on the page against your step 1 notes.

## Common mistakes

| Mistake | Instead |
|---|---|
| Labels that restate box names ("Booking → Bookings") | Label the edge with the action or rule: `paid: confirmed, nobody reviewed it` |
| Only the new design drawn | Today and after side by side, with the same layout |
| State names invented for the picture | The stored value under each state |
| Full column dumps in the schema | Only the columns that move or that the argument needs |
| A schema line to every FK | Lines for neighbours, `→ table` text for the rest |
| Mermaid or a chart library for flows | Hand SVG; theming and label placement stay under your control |
| "Can be dropped" without proof | A grep showing no reader and no writer, cited in the shrink table |
| Proposed names shown as if they exist | Say in the caption which names are proposals |
