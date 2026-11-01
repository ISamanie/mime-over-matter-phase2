# Prompt Log

## Tools and models
- **Claude Code** (CLI), model **Claude Opus 5.5** (`claude-opus-5-5`)

## Phase 1, part 1: designing the game and writing SPEC.md (Tue 10/27/2026)

Prompts are copied word for word, typos included. The notes under each one say what came back and what I decided, so it's clear which design choices were mine and which were the AI's.

### Prompt 1
```
help me come up with a game idea for this https://www.cs.cmu.edu/~113/hw7.html
```
**What came back:** five game ideas (Echo Maze, Past Selves, Parallel Parking, Recipe Relay, Shelf Life), with a note on how each would split between Phase 1 and Phase 2. I didn't use any of them.

### Prompt 2
```
how about a comic book themed platformer, where the levels are being drawn by a hand as you play. so for example I'm thinking the old game Comix Zone for sega genesis, maybe there is a hand that draws enemies and obsticles for you, and occasionallly another hand that draws things that help such as a weapon or a little animal helper or a hammer etc
```
**What came back:** feedback on my idea. It pointed out that Comix Zone already has a villain's hand drawing enemies, so my version needs to be different (the second, helpful hand and live drawing). It suggested fixed comic panels instead of a scrolling camera to save time, and a cheap outline-then-fill drawing effect. It also asked me six design questions (answered in Prompt 3).

### Prompt 3
My answers to the six design questions. I pasted each question back in with my answer underneath.
```
1. Is the drawing a warning? If an enemy can’t hurt you until it’s fully drawn, the drawing time is your window to get ready. How long should it be?


can't hurt you til its fully draw, you can give a countdown until the drawing is done but not required

1. Can you mess with the hands? Punch the pencil to stop a drawing halfway, or grab a helper item before it’s finished? This could be the best mechanic in the game, or a stretch goal.

this can be a stretch goal, maybe certain weapons or certain siutations you can stop the hand and it clearly shows pain, shakes it off and leaves

1. When does the friendly hand show up? On a timer, at random, or when you’re losing (low health)? Each one feels very different.


for sure when you're losing, draw a sandwich for health most of the time. it should come out at random, or before rooms that have a lot of enemies.

1. Which helpers, and what does each one do? Give each a different job, e.g. the hammer breaks walls and the weapon hits from range. The animal helper is the most work, since it needs its own behavior, so rank it near the bottom.


the animal helper can be a stretch goal. i like the hammer can hurt the hand or deal more damage to enemies, some throwing knives against the enemies instead of a gun. 

1. How do you win and lose? Health, the number of panels in a page, what happens at the end.


health you lose. I want a story where for some reason a Mime is pulled into a comic book full of clowns. write a plausible backstory and build the world for this. the weapons should be fun things like a baloon sword or a pogo stick to jump around on, a slinky, etc.


1. What should it feel like? Frantic and funny? A duel with the artist? Write a sentence or two on this.


this should be light and fun. the theme is like an odd duck, a mime at a clown convention or something. make a variety of clowns and the protagonist a mime fighting in a comic book inspired by Comix zone
```
**What came back:** a story draft (the cartoonist Chuckles McGraw, the mime Pierre, KlownKon, the right-handed artist whose left hand rebels), a table of six clown types, a table of items, and a suggested must-have / next / stretch split.

### Prompt 4
```
this looks good, log all of these prompts to prompt_log.md and write them up as specific as possible for the spec.md go
```
**What came back:** this file and the first draft of `SPEC.md`.

### Prompt 5
```
create a new repo for this project
```
**What came back:** the AI set up a local git repo for the project. Creating the public GitHub repo was blocked at first by a Claude Code permission check. I added a permission rule allowing `gh repo create`, and then the AI created the repo.

### Prompts 6 to 8 (repo setup)
```
how do I change this settin I couldn’t create the GitHub repo: a permission check blocked me from making a public repo.
```
```
ok persmissions changed
```
```
all three
```
**What came back:** instructions for adding the permission rule. After I added it, the AI created the GitHub repo, committed `SPEC.md` alone as the first commit, committed this log second, and pushed.

### Prompt 9
```
this seems like more detail than needed

* 10 health points (HP). Starts every game at 10. Health never goes above 10.
* Walks at 240 px/second. Jump apex is about 130 px above where he jumped from. Normal jumps can reach platforms up to 110 px higher than the one he's on.
* Base attack is a punch: 1 damage, reaches 40 px in front of Pierre, can be used at most once every 0.3 seconds, shows "POW!" on hit.
* After taking damage, Pierre is invincible for 1.0 second and flashes during that time. He is knocked back 60 px away from the source.
* When Pierre takes damage, an empty speech bubble (or one containing "…") pops up over his head for 1 second.
* At 0 HP: Game Over. 


be more broad about what the gameplay is like. specifiying pixels per second seems overkill
```
**What came back:** a revised `SPEC.md` that describes how the gameplay should feel instead of exact values. Pixel distances, speeds, cooldowns, HP numbers, and exact odds were replaced with broad descriptions (e.g. "takes about ten hits", "mostly sandwiches"). A few rough numbers that define the main mechanic were kept: about 2 seconds to draw a clown, about 10 hammer swings, 6 panels. Section 8 now tells the builder to choose the exact values and keep them in one place.

### Who decided what (for my Phase 2 partner)
- **My decisions:** comic-book platformer inspired by Comix Zone; a hand drawing enemies while you play and a second hand drawing help; enemies can't hurt you until fully drawn; an optional countdown; hurting the hand as a stretch goal (it shows pain, shakes it off, leaves); the helper hand mainly draws sandwiches when you're losing, sometimes at random, and before rooms with lots of enemies; the hammer does extra damage and can hurt the hand; throwing knives instead of a gun; balloon sword, pogo stick, and slinky as fun weapons; the animal helper as a stretch goal; you lose when health runs out; a mime pulled into a comic full of clowns; a light and fun "odd duck" tone.
- **Drafted by the AI and approved by me:** the story and character names, the six clown types and what each one does, the Invisible Dog as the animal helper, what the slinky does, the "CANCELLED!" game-over stamp, the panel contents, and the few rough numbers left in the spec. I decided the spec should describe feel rather than exact values (Prompt 9), so exact speeds, damage, and timings are left to whoever builds it.

## Phase 1, part 2: building (Wed 10/28/2026)

Same tool and model: Claude Code (CLI), Claude Opus 5.5 (`claude-opus-5-5`).

### Prompt 10
```
look at the spec in mime-over-matter, create build plan and check it with me and then start building
```
**What came back:** a build plan for me to check before any code was written:
- Plain JavaScript and canvas with ordinary `<script>` tags. ES modules would break opening `index.html` straight from disk.
- One file per part of the game, with all tuning values in `config.js` and the panel table in `panels.js`, as the spec's section 8 asks.
- One shared "being drawn" system for both hands.
- A build order of one commit per step: skeleton, Pierre, right hand and clowns, panels and win/lose, left-hand sandwich, then README and this log.

It asked whether to stop after the [P1] criteria and docs or keep going into [P2]. To check what the README needed, the AI also opened the assignment page itself. I hadn't given it the page.

### Prompt 11
```
stop for me to play it before P2 work
```
**What came back:** the [P1] game, built in five commits, then this log and the README. The AI tested each step with a throwaway script that runs the game in Node with a fake canvas, plus screenshots in Chrome. It found and fixed one problem along the way: the left hand was drawing the sandwich right on top of Pierre, which hid the drawing, so it now prefers a spot a short walk away. All [P2] and [P3] work is left for next time; the README lists what's met.

(One unrelated question about Claude Code itself is left out.)

## Phase 1, part 3: expanding the game (Wed 10/28/2026)

### Prompt 12
I played through and attached a screenshot of the THE END panel.
```
ok i played through, for a first run it's fine. 6 panels is way to short for a game, we should extend to like 12-24 panels. the game is really repetitive so far becausa the level design is boring and only two kinds of enemies and only a punch. we need to improve the fighting, the enemies, and the visuals. I was hoping for visuals that look something like Comix Zone eventually, but this looks really cartoony rather than a comic
```
**What came back:** a plan in five parts:
1. An art-style test panel first, so the look is settled before more clowns are drawn.
2. Better fighting.
3. The spec's extra clowns and smarter versions of the existing two.
4. Longer and more varied levels.
5. Spec changes drafted for me to approve.

It then asked me four questions. My answers:
- **Where the work goes:** keep going on main.
- **Length:** 18 panels, as 3 pages of 6.
- **Fighting:** combos and hit feel, the spec's items, and mime powers. I didn't pick the boss fight against the right hand.
- **Art:** still drawn in code, but in a comic ink style, not with sprite images.

**What came back (art test):** a comic ink style for everything:
- brush outlines that are thicker on the shadow side, cel shadows with cross-hatching, striped and polka-dot costumes;
- Pierre and the clowns redrawn about 1.7× bigger, with posable arms and legs;
- inked hands;
- a KlownKon convention-hall background, aged paper gutters, a brush panel border, caption boxes and extruded "POW!" lettering.

The AI took screenshots and fixed two things it saw itself. The face shadows covered half of each face and hid Pierre's makeup, so they're lighter now. The background was as bright as the characters, so it's faded back. It then asked me to judge the look, to choose mime powers, and to approve spec changes.

### Prompt 13
```
overall look is much better, but there is not much dimensionality to the level like platforms to jump on or obsticles. the levels are really boring. approve all spec changes. in 20 minutes we need to stop and hand this project off to someone else so make sure documentation is good and code is clean
```
**What came back:**
- **Spec:** section 9 added with the changes I approved: 18 panels on 3 pages with a setting for each, level dimensionality with obstacles and hazards, combos, a jump kick, hit feel, the extra clowns and items moved to [P2], and new criteria 37 to 48. I hadn't picked mime powers myself, so "approve all" took the AI's three suggestions: Invisible Wall, Invisible Rope and Invisible Box.
- **Levels:** with only 20 minutes left, the AI gave panels 1 to 5 multi-level riser layouts (data only) instead of rushing obstacles. Obstacles and hazards are listed as the first next step.
- **Tests:** it added `tests/smoke.js`, which checks the core rules and that every riser can be reached by jumping.
- **Cleanup and docs:** it removed one unused function and rewrote the README for handoff.

### Prompt 14
```
ok looks good still more time, can you tyr to add a weapon or something relatively small? do a small loop and check back with me
```
**What came back:** the squeaky hammer (criterion 27). The left hand draws it as soon as Pierre enters the crowded panel 4, so it's ready before the first clown (criterion 29). While Pierre holds it, J swings it for 3 damage with more reach and knockback, and a "SQUEAK!" burst. It breaks after 10 swings ("CRACK!"), and the HUD shows the swings left.

To keep the code tidy, the AI made a shared `Item` base class for the sandwich and the hammer, and added hammer checks to `tests/smoke.js`. The first screenshot showed the hammer covering Pierre's face while he carried it, so it's now carried angled forward.

### Prompt 15 (sent while the AI was finishing the hammer)
```
the transitions in between levels should have a cool animation like you are moving between panels in a comic. like a zoom out and look at all the panels, then zoom in or omsething
```
**What came back:** a page turn between panels (new file `js/page.js`). When Pierre walks off the edge, the game freezes and the camera zooms out to the whole comic page ("BIG TOP BRAWL · PAGE 1"). Cleared panels show as Pierre left them, and panels ahead are faded. A dotted reading arrow draws across the gutter to the next panel, then the camera zooms into it, with the panel border growing to become the real one. The AI's screenshots showed the arrowhead sitting in the middle of the next panel at the end of the zoom, so it now stops at the panel edges and fades out. This also covers most of criterion 38.

### Prompt 16
```
the punching is boring, perhaps he takes his hat off and slaps the clowns with his hat? it would also be great to slap the red nose off a clown, if you hit a clown somtimes the nose falls off and he freaks out and tries to get it and put it back on
```
**What came back:**
- **Beret slap:** J is now a beret slap instead of a punch. Pierre whips off his beret and swings it in an arc from behind his head, with speed lines, while his bald head shows three hairs. The hit lands partway through the swing with "SLAP!".
- **Noses:** a hit that doesn't finish a clown has about a 1 in 3 chance to pop its nose off ("POP!"). The nose bounces away. The clown stops attacking, throws its arms up, shakes, sweats and says "MY NOSE!", then scrambles after the nose. It puts the nose back with a "HONK!", or gives up with a "GRR!" if the nose landed where it can't reach.
- **Speech bubbles:** the same bubbles let clowns shout when they come to life (criterion 13).
- **Spec:** the AI added my two ideas to section 9.3 as criteria 49 and 50.

### Prompt 17 (sent while the AI was building the slap)
```
ok keep doing small cycles of knocking things off the P2 list etc and checking with me
```
**What came back:** the beret slap and the nose gag were finished and committed. The AI then suggested obstacles and hazards (criterion 41) as the next cycle.

### Prompt 18
```
we are out of time, write your final commit to github, ensuring everything is well documented and ready for handoff
```
**What came back:** a last pass over the README (stale lines fixed, the next cycle noted in the handoff section) and this log. Everything is in the final commit.
