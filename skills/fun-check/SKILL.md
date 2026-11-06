---
name: fun-check
user-invocable: true
argument-hint: "[game, game mode, challenge or loop]"
description: Use when designing, balancing or judging a game, game mode, challenge or any gamified loop and the real question is whether people will enjoy it - "is this fun", "will people come back", "balance it", "make it more playful", "simulate the game", "should we add streaks, badges or a daily bonus", "the sim says fair but a player says they never win". Also when a simulation, a persona review or a retention chart is offered as proof that something is fun.
---

# Measuring fun

## Core principle

**Fun is a feeling, but it has causes you can test.** Measure the causes in a simulation, check understanding with personas, measure the feeling through what real people do, and keep only the sim measures that predicted what people did. No single source signs off fun: a balanced sim is a precondition, a persona's "I'd come back" is a hypothesis, a retention chart is engagement.

## What causes fun, and how sure we are

Name the evidence tier whenever a claim rests on one of these.

| Cause | In a game | Evidence |
|---|---|---|
| Competence | challenge matched to skill, clear feedback on how you did | experiment: Keller and Bless 2008 (difficulty matched to the player produced flow, too easy or too hard did not); Peng et al. 2012 (an exergame with competence features switched on and off) |
| Autonomy | real choices, your own way of playing can win | experiment: Peng et al. 2012; survey: Ryan, Rigby and Przybylski 2006 |
| Relatedness | rivals, teammates, people you know | survey: Ryan, Rigby and Przybylski 2006 |
| Uncertainty to the end | the result stays open, comebacks happen | game measures checked against player rankings: Browne and Maire 2010 |
| Something left to learn | a better way to play keeps paying off | theory: Koster 2004, Schmidhuber 2010 (fun as learning progress) |
| Peak and end | people remember the best moment and the ending, not the average | experiment: Kahneman et al. 1993 |
| Novelty fades | badges and streaks lift use for weeks, then less | review: Hamari, Koivisto and Sarsa 2014 |

**Engagement is not fun.** Near misses raise the urge to keep playing while players rate them as unpleasant (Clark et al. 2009). Variable rewards, daily spins and loss-framed streaks raise opens, not enjoyment.

## Steps

1. **Write the fun promise and the guardrails before measuring.** The promise: who plays, which feeling (mastery, discovery, rivalry, people), at which moments. The guardrails: what the game must never push people to do, such as skip sleep, play while driving, pay, or share where they live. Selling a way out of a loss (a paid streak freeze, a paid retry) is a guardrail failure. Write down each measure's range and the decision a miss triggers, before you look at any result.
2. **Run the sim scorecard** (table below) on real behaviour data, with a ladder of bots: a random bot, a greedy beginner who plays the best of what it got, a planner who goes for a goal, a bold player who takes calculated risks, and one restricted bot per honest play style ("only plays safe", "only explores").
   - **Bend the replayed behaviour.** Nobody in last month's data played the game. When a bot goes for something, it changes the activity within that person's own range (amount, time, place) with a set chance of success. That chance is a guess: write it down and test it with people.
   - **Run the bad cases:** one very active player, a player who stops, the cheapest exploit.
   - **In team games, measure the team and the people in it.** Add "carry": the share of a team's points made by its most active member. Most points from one person means the others are watching, not playing.
3. **Use personas for understanding only.** Use cil:ux-review for whether people find the game, understand the rules and read the copy right. A persona's feeling ("it never wins") is a hypothesis for step 2 and step 4, never evidence of fun.
4. **Test with people, over the time the game really spans.**
   - **Compare two versions instead of rating one.** Ask "which was more fun, A or B?"; ratings drift and bunch up (Yannakakis and Martínez 2015).
   - **Take the decision away once.** Each player plays one round where the app decides for them and one where they decide, in random order. When a round lasts a week, split the testers into two groups instead. If behaviour doesn't drop without the decision, the fun is elsewhere (the rival, the activity itself), and a simpler game would do.
   - **Ask for a moment, not a score.** "Tell me about that game" a few days later. A specific moment ("I called it and made it by two minutes") is a peak; "it was nice" is not.
   - **Read the behaviour signals** (table below) against a holdout, in week 3, not on day 1.
5. **Calibrate the sim against people.** For every scorecard measure, check whether it moved with the human results. Does "open into the last round" predict a rematch? Keep the measures that predicted, retire the rest, adjust the ranges, and write the calibration next to the scorecard.
6. **Report:** the scorecard with pass or fail and the feeling each miss stands for, what only people can settle, and one question.

**Fun is not a launch gate.** Block a launch only when a guardrail fails or the scorecard shows a broken game (choices are fake, volume decides, one piece wins everything). Otherwise ship it as a test: part of the users, a holdout, no streaks or spins, and the kill criteria from step 1. The fun verdict comes from week 3.

## Sim scorecard

A "round" is whatever unit scores: a round, a day, a week. A "piece" is whatever players pick: a card, an option, a strategy, a map zone, a quest. In a solo game the goal is the rival: "win" means making it, the bot ladder compares going for it with not trying (if ordinary behaviour already makes most goals, the goal is fake), and "volume doesn't decide" compares the time to a reward for a three-times-a-week player and a daily one. Skip rows that don't exist in the game, such as collecting. Starting ranges come from one game and must be recalibrated in step 5.

| Measure | How | Start range | Feeling it stands for |
|---|---|---|---|
| Choices are real | best bot against random | far above 50% | decisions are not fake; random is no stand-in for a weak human |
| Learning ladder | each rung against the one below: planner over greedy, bold over planner | each step 55 to 80% | something left to learn, beginners not crushed |
| Every style can win | each restricted-style bot against the free bot | 45 to 55% | my way of playing counts |
| Volume doesn't decide | the player with fewer sessions wins | 45 to 55% | it is about play, not hours |
| Decision weight | share of plays where the best and the worst legal choice end the round differently | 40% or more | my decision counts; below it, autoplay would feel the same |
| Open to the end | undecided going into the last round | 45% or more | uncertainty |
| Comebacks | the side behind after the first round wins | 20% or more | never out of it |
| Peak at the end | games ending with a comeback, a deciding round won by a small margin, or a bold play that came off | 50% or more | what people remember |
| No dominant piece | share of rounds won by the most common card or option | 2.5 times its fair share at most (25% with 10 or more) | variety, nothing solved |
| Collecting gives choice | full collection against a starter set | 58% at most | no pay or grind to win |
| Length | median time a game takes | what the promise needs | fits the rhythm of life |

A fair average can hide a missing peak: when a style wins half its games but never gets the big moment, the dominant-piece and peak measures show it, not the win rate.

## Behaviour signals

| Signal | What it means |
|---|---|
| The losing side starts the next game | the strongest single sign of fun |
| Next game started without a push or mail | wanted, not reminded |
| Delegation rate: decisions left to autoplay or defaults | high means the choice is not fun |
| Behaviour changed for the game (schedule, habit, effort) | the game reached their life |
| Visits between sessions without a prompt | they think about it |
| Which version people pick when asked A or B | preference, not politeness |
| Guardrails: lost sleep, overuse, spending, complaints | the cost of the engagement |

## Common mistakes

| Mistake | Instead |
|---|---|
| "The sim is balanced, so it's fun" | Balance is a precondition; the sim measures causes, people measure the feeling |
| A persona says it would come back | A hypothesis; test it with the behaviour signals |
| Retention from another feature as proof | It describes that feature's engagement; this game gets its own holdout |
| Asking people to rate fun from 1 to 5 | Ask A or B, and ask for a moment |
| Reading day 1 | Read week 3, against a holdout; novelty fades |
| Adding streaks, spins or daily bonuses to lift retention | Launch without them and test later against a holdout; never variable rewards tied to money |
| Fixing a "never wins" complaint by tuning the win rate | Check peaks and the dominant piece first; give the style a big moment, not more average points |
| Tuning every check to the middle | The ranges guard the floor; the promise decides the shape |
