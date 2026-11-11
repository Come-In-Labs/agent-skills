# cil - Come In Labs engineering skills

A Claude Code and Codex plugin for predictable software systems, verified
audits, and product quality checks.

The architecture skill designs low-entropy domain systems. The audit suite
hunts with parallel agents, tries to disprove every finding before it reaches a
human, and ranks findings by risk and reachability.

| Invoke | Skill | The question it answers |
|---|---|---|
| `cil:architecture` | architecture | How should this system be organized so one domain teaches me how to navigate every other domain? |
| `cil:audit` | full sweep | What do all audit lenses find after deduplication and verification? |
| `cil:untangle` | structure | Is accidental complexity, duplicated plumbing, or dead structure making this harder than necessary? |
| `cil:audit-code` | code | What is wrong, fake, dead, or duplicated, and is the finding real? |
| `cil:audit-product` | product | Can a person reach an incoherent state, or does the product contradict itself? |
| `cil:roast` | one feature, three critics | Does this change fit the codebase it lands in, who pays for it in six months, and what does the existing product do that it forgot or never tested? |
| `cil:tighten-copy` | public copy | Does every user-facing sentence tell the reader what is true and what to do next, without implementation talk, filler, or repetition? |
| `cil:ux-review` | lived use | Can real kinds of people find the feature, understand it, and come back to it over the days it spans, and do its promises match what they experience? |
| `cil:fun-check` | fun | Will people enjoy this game or loop, which of its causes a simulation can measure, and what only real players' behaviour can settle? |
| `cil:fix-typo` | visual hierarchy | Does the eye land on each element in the order that matters to this reader, with sizes, weights, colours and gaps that each make a true claim? |
| `cil:analytics` | product numbers | How is the product doing in signups, activity, retention, feature use and experiments, compared with the last read, with every figure's definition and denominator? |

`cil:audit` is the audit orchestrator. It shares one orientation pass,
dispatches the other lenses, and merges their findings into one verified,
tiered report. Run an individual audit skill when only one lens is needed.

`cil:ux-review` sends one agent per persona through the running app over the
days a feature spans, each in its own account, data copy and browser, starting
where that person would really start. It checks discoverability and every
promise the product makes against what the personas experienced, and verifies
every finding before it reaches the owner.

`cil:fun-check` treats fun as a feeling with testable causes. It runs a sim
scorecard with a ladder of bots (choices are real, every play style can win,
decision weight, open to the end, peak at the end, no dominant piece), uses
personas only for understanding, and measures the feeling through what people
do: A-or-B comparisons, one round with the decision taken away, whether the
losing side plays again. Then it keeps only the sim measures that predicted
what people did.

`cil:analytics` reads a product's own numbers from a read-only replica first,
then product and web analytics. It keeps one profile per project (sources,
who is not a user, what "active" means, segments, experiment assignment) so
every read is comparable with the last one, keeps randomized results apart
from correlations, and writes a report to pass on (Markdown, and a print-ready
PDF) for the team, investors or a partner.

## Install

For Claude Code:

```bash
claude plugin marketplace add Come-In-Labs/agent-skills
claude plugin install cil@cil
```

Start a new session and invoke `/cil:architecture`, `/cil:audit`,
`/cil:untangle`, `/cil:audit-code`, `/cil:audit-product`, `/cil:roast`, `/cil:tighten-copy`,
`/cil:ux-review`, `/cil:fun-check`, `/cil:fix-typo`, or `/cil:analytics`. Each
takes an optional scope argument where appropriate.

The repository also includes `.codex-plugin/plugin.json` for Codex plugin
discovery.

## Develop

This repo is also a `skills-dir` plugin. When cloned into
`~/.claude/skills/cil/`, it auto-loads as `cil@skills-dir` on the next session.

Validate changes with:

```bash
claude plugin validate .
```

## License

MIT. See [LICENSE](LICENSE).
