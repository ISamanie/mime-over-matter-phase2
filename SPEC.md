# Mime Over Matter: Game Spec

A comic-book brawler-platformer played panel by panel. A silent street mime is trapped inside a comic full of clowns, and the cartoonist's hands draw the level while you play: the right hand draws clowns to stop you, and the left hand secretly draws things to help you.

Inspired by *Comix Zone* (Sega Genesis, 1995). What's different here: **two** drawing hands with opposite goals, everything appears in real time as the hand draws it, and the whole thing is a joke about a mime at a clown convention.

---

## 1. Story

**Chuckles McGraw** draws *Big Top Brawl*, a comic set at **KlownKon**, the world's biggest clown convention. Sales are falling because the clowns just aren't funny anymore.

At a real-world comic convention, a street mime named **Pierre** sets up across the aisle from Chuckles's table. Pierre's "trapped in an invisible box" routine pulls a huge crowd. Chuckles's table pulls nobody.

Furious, Chuckles sketches Pierre into the gutter of his drawing board, the blank space between comic panels, and pulls him into the page. The new storyline: *the clowns humiliate the mime.* Chuckles's **right hand** (ink pen) starts drawing clowns into every panel ahead of Pierre.

But Chuckles is right-handed, and **his left hand has had enough.** It sneaks into panels and draws Pierre what he needs: sandwiches, a squeaky hammer, throwing knives, whatever's lying around in a cartoonist's imagination. Pierre's only way out is to fight through to the last panel, the one that says **THE END**.

This story should appear in the game as a short title/intro screen (see criterion 2).

## 2. Feel

**Light, silly, and fun.** Pierre is the odd duck: a silent, black-and-white mime surrounded by loud, colorful clowns. The humor comes from that contrast. Clowns are loud (huge speech bubbles: "HONK!", "HAW HAW!"), while Pierre's speech bubbles are always empty or contain only "…".

It should never feel scary or punishing. Getting hit is slapstick: a comic "BONK!" burst, a little knockback, Pierre flashing. The right hand drawing a clown should feel like a cartoon rival setting up a gag, giving you time to react, not an ambush.

## 3. Look

Simple shapes are fine. A consistent comic style matters more than detailed art.

- **Panels:** each level screen is one comic panel with a thick black border and a white gutter around it, like a page of a comic.
- **Outlines:** every character and object has a thick black outline.
- **Colors:** Pierre is only black, white, and grey (striped shirt, white face, black beret). Clowns and their props use loud primary colors (red, yellow, blue, green). The panel background is a pale halftone dot pattern.
- **Hands:** each hand is a large cartoon hand, drawn bigger than Pierre. The right hand holds a black ink pen. The left hand holds a fat colored crayon and moves a little wobbly and clumsy.
- **Impact text:** hits show a quick comic burst ("POW!", "BONK!", "SQUEAK!", "POP!").

## 4. Controls

| Key | Action |
|---|---|
| Left / Right arrows (or A / D) | Walk |
| Space (or W / Up arrow) | Jump |
| J | Attack (punch, or swing the held melee item) |
| K | Throw a knife (if Pierre has any) |
| Enter | Start game / continue from title and end screens |
| R | Restart from panel 1 after Game Over or THE END |
| P | Pause / unpause |

## 5. How the game works

### 5.1 Pierre
Pierre moves like a classic arcade platformer hero: quick and responsive, with a slightly floaty, cartoonish jump. Without items, he fights with his fists: a short-range punch with a "POW!".

He can take about ten hits before going down. Getting hit is slapstick: a little knockback, a moment of flashing invincibility so he can't be hit twice in a row, and an empty speech bubble (he's a mime; he can't complain). When his health runs out, it's Game Over.

### 5.2 Panels and progression
*(Section 9 expands this to 3 pages and 18 panels. This table is still page 1.)* The game is one comic **page** of **6 panels**: 5 fighting panels plus a final **THE END** panel. Each panel is one fixed screen, with no scrolling. Pierre enters on the left, and the right edge is **blocked by a thick ink line** until every clown in the panel is defeated. Then the line disappears, an arrow appears, and walking off the right edge takes Pierre to the next panel.

Reaching THE END wins the game: Pierre takes a silent bow, "THE END" is drawn across the panel, and the player can press R to play again.

Panel contents (core version, using only the two core clowns):

| Panel | Contents | Notes |
|---|---|---|
| 1 | 1 Unicyclist | Tutorial panel. Show the controls as text in the panel background. |
| 2 | 1 Pie Tosser, 1 Unicyclist | |
| 3 | 2 Pie Tossers on raised platforms, 1 Unicyclist on the ground | Platforms needed |
| 4 | **Crowded:** 2 Pie Tossers, 3 Unicyclists | Left hand draws an item first (see 5.5) |
| 5 | 2 Pie Tossers, 2 Unicyclists | |
| 6 | THE END | No enemies |

When stretch clowns are added, swap them into panels 3 to 5 so each panel introduces at most one new clown type.

### 5.3 The right hand (enemy artist)
When Pierre enters a panel, the right hand reaches in from the top of the screen and draws that panel's clowns **one at a time**. Each drawing takes **about 2 seconds**: the black outline appears gradually, with the pen tip moving along it, then the color fills in.

**A clown that's still being drawn can't hurt Pierre and can't be hurt.** It just sits there half-finished. This is the player's warning window. When the drawing finishes, the clown comes to life right away and shouts something in a speech bubble ("HONK!", "HAW HAW!", "NICE FACE PAINT!", "SAY SOMETHING!"). After the last clown, the hand leaves.

**Optional:** a small countdown or shrinking ring over a clown that's being drawn.

### 5.4 Clowns
Each clown has one simple job, so each feels different to fight.

**Core clowns** (needed for the core game):
- **Unicyclist:** fragile but fast. Rides back and forth on its platform, turns around at walls and ledges (never falls off), and hurts Pierre if he touches it. Goes down in a couple of punches.
- **Pie Tosser:** a little sturdier, and stays put. Every few seconds it lobs a pie in an arc toward Pierre. The pie splats on whatever it hits.

**Stretch clowns:**
- **Seltzer Spritzer:** walks toward Pierre and sprays seltzer at close range. The spray mostly pushes Pierre back rather than doing much damage.
- **Juggler:** stands still juggling bowling pins and throws one straight at Pierre whenever he gets close.
- **Balloon Twister:** stands back and keeps twisting balloon dogs (a couple at a time) that chase Pierre and pop when they reach him.
- **Clown Car:** a tiny car that parks and keeps releasing mini clowns until Pierre smashes it. Tougher than any other clown. A panel with a Clown Car counts as "crowded".

### 5.5 The left hand (secret helper)
The left hand draws one item at a time, in the same outline-then-color style but in crayon, and a little faster than the right hand. Items can't be picked up until the drawing is finished. It puts items somewhere Pierre can reach, away from clowns. Pierre picks an item up by touching it.

The left hand shows up in three situations:
1. **Pierre is losing:** when he's low on health (around a third left), it quickly draws a **sandwich**. It shouldn't spam them: there's a cooldown, and it won't draw one if a sandwich is already on screen.
2. **Before a crowded panel:** in panels with lots of clowns (panel 4 in the core version), it draws an item as soon as Pierre enters, before the first clown is finished.
3. **At random:** in the other fighting panels, it occasionally (roughly 1 panel in 3) shows up at a random moment and draws a random item.

Random items are **mostly sandwiches**, with the hammer and knives less common. When stretch items are added, they share the non-sandwich odds.

### 5.6 Items
Pierre can hold **one melee item** at a time (hammer, balloon sword, or pogo stick). Picking up a new one replaces the old one. Throwing knives are separate and stack. The HUD shows what he's holding and how much is left.

**Core items:**
- **Sandwich:** restores a good chunk of health (about 4 hits' worth). Eaten right away, not held.
- **Squeaky hammer:** replaces the punch. Slower, but hits much harder and reaches a bit further. Squeaks on every hit. Breaks after about 10 swings. (In the stretch goal, it can also hurt the right hand.)
- **Throwing knives:** a handful per pickup (around 5). K throws one straight ahead. Stronger than a punch.

**Stretch items:**
- **Balloon sword:** replaces the punch. Very fast and weak, and pops after a few hits.
- **Pogo stick:** temporary. Pierre bounces much higher (reaching spots he otherwise can't), and landing on a clown damages it and bounces him back up.
- **Slinky:** a few per pickup. Thrown with J while held. It "walks" along the ground toward the nearest clown, going down ledges like a real slinky, and damages the clown when it arrives.
- **Invisible Dog** (animal helper): a mime gag. Only a stiff leash and collar are visible. Follows Pierre for a while, runs at nearby clowns, and bites them.

### 5.7 Hurting the right hand (stretch)
Hitting the right hand with the **squeaky hammer** while it's drawing cancels the drawing. The hand jerks back and shakes it off for a second, with an "OW!" bubble and cartoon stars, then leaves. The half-drawn clown wipes away.

The hand comes back shortly after and redraws everything left in the panel, **including the clown that was cancelled**. Interrupting buys time; it doesn't skip clowns.

### 5.8 Screens and HUD
- **Title screen:** a comic-book cover reading "MIME OVER MATTER", with the story from section 1 in 2 to 4 short caption boxes, and "Press Enter to start".
- **HUD:** health bar, held item and uses left, knife count, "Panel N / 6".
- **Game Over:** a big red "CANCELLED!" stamp across the panel, and "Press R to try again". Restarting puts Pierre back at panel 1 with full health and no items.
- **Pause:** P freezes everything and shows "PAUSED".

## 6. Acceptance criteria

Tags: **[P1]** must have, **[P2]** next most important, **[P3]** stretch. See section 7 for what to cut first.

### Getting started
1. **[P1]** Following the README, the game runs on a machine other than the author's.
2. **[P2]** A title screen shows the game name and the story in a few caption boxes. Enter starts the game.

### Pierre
3. **[P1]** Pierre walks left/right with the arrow keys (and A/D) and jumps with Space (and W/Up).
4. **[P1]** Pierre lands on platforms and the ground, and can't walk through walls or off the left edge of a panel.
5. **[P1]** Pressing J punches. A punch that connects damages the clown and shows "POW!".
6. **[P1]** Pierre has a visible health bar. A hit removes some health, knocks him back, and gives a brief flashing invincibility so he can't be hit twice in a row.
7. **[P1]** When his health runs out, a Game Over screen appears. R restarts at panel 1 with full health and no items.
8. **[P2]** When hit, Pierre shows an empty (or "…") speech bubble.

### The right hand
9. **[P1]** When Pierre enters a panel, a hand holding a pen appears and draws each of the panel's clowns one at a time.
10. **[P1]** Each clown takes about 2 seconds to draw: outline first, then color.
11. **[P1]** A clown that's still being drawn doesn't move, doesn't hurt Pierre, and can't be damaged.
12. **[P1]** When the drawing finishes, the clown starts moving/attacking immediately.
13. **[P2]** Each clown shouts something in a speech bubble when it comes to life.
14. **[P3]** A countdown or shrinking ring appears over a clown being drawn.

### Clowns
15. **[P1]** Unicyclist: rides back and forth, turns at walls and ledges without falling off, and hurts Pierre on contact. Goes down in a couple of punches.
16. **[P1]** Pie Tosser: stays put and lobs a pie in an arc at Pierre every few seconds. Takes more hits than the Unicyclist.
17. **[P1]** A defeated clown disappears.
18. **[P3]** Seltzer Spritzer, Juggler, Balloon Twister, and Clown Car each work as described in section 5.4. (Report each one separately.)

### Panels
19. **[P1]** The right edge of each panel is blocked until every clown in it is defeated, then unblocks and shows an arrow.
20. **[P1]** Walking off the right edge loads the next panel, with Pierre on its left side.
21. **[P1]** There are 5 fighting panels matching the table in section 5.2, and the HUD shows "Panel N / 6".
22. **[P1]** Reaching panel 6 shows THE END, and R starts a new game.
23. **[P2]** In the THE END panel, Pierre takes a bow and "THE END" is drawn across the panel.

### The left hand and items
24. **[P1]** When Pierre is low on health, a second hand (holding a crayon) quickly draws a sandwich. It doesn't draw another one right away, or while one is already on screen.
25. **[P1]** Touching a sandwich restores a good chunk of health (never above full).
26. **[P1]** Items can't be picked up until the left hand finishes drawing them.
27. **[P2]** Squeaky hammer: replaces the punch, hits harder, and breaks after about 10 swings. The HUD shows swings left.
28. **[P2]** Throwing knives: a pickup gives a handful. K throws one straight ahead. The HUD shows the count.
29. **[P2]** In a crowded panel, the left hand draws an item before the first clown is finished.
30. **[P2]** In other fighting panels, the left hand occasionally shows up and draws a random item, usually a sandwich.
31. **[P3]** Balloon sword, pogo stick, and slinky each work as described in section 5.6. (Report each one separately.)
32. **[P3]** The Invisible Dog works as described in section 5.6.

### Hurting the hand
33. **[P3]** Hitting the right hand with the hammer while it's drawing cancels the drawing. The hand shows pain ("OW!", shaking, stars) and leaves, the half-drawn clown wipes away, and the hand comes back shortly after to finish the panel.

### Polish
34. **[P2]** Hits show comic burst text ("POW!", "BONK!", "SQUEAK!", "POP!").
35. **[P2]** P pauses and unpauses the game.
36. **[P3]** Sound effects: honk when a clown comes to life, squeak on hammer hits, pop on balloon items, a pen-scratch sound while drawing.

## 7. Priorities

**What matters most** is the two-hand drawing mechanic: clowns appearing as the right hand draws them (criteria 9 to 12), and the left hand rescuing Pierre with a sandwich when he's losing (24 to 26). If someone plays this and the hands don't draw things, it isn't this game.

**Order to build in:**
1. All [P1] criteria. This alone is a complete, winnable game: walk, punch, two clown types, 5 panels, the right hand, the sandwich rescue, game over, THE END.
2. The hammer and knives (27, 28), then the left hand's other triggers (29, 30).
3. Remaining [P2] polish (2, 8, 13, 23, 34, 35).
4. [P3] in this order: hurting the hand (33), pogo stick, balloon sword, more clown types, slinky, Invisible Dog, countdown, sound.

**If time runs short, cut in this order (first to go at the top):**
1. Sound
2. Invisible Dog
3. Extra clown types (keep just the Unicyclist and Pie Tosser)
4. Stretch items
5. Speech bubbles and burst text
6. The left hand's random and crowded-panel triggers (keep the low-health sandwich)

**Never cut:** the right hand drawing clowns before they can act, and the left hand's low-health sandwich.

**The art can stay simple.** Rectangles and circles with thick black outlines and the right colors are acceptable for every character. Spend time on the hands and the drawing effect before improving the sprites.

## 8. Notes for whoever builds this
- **Planned tech:** plain JavaScript and an HTML canvas, no build step and no libraries, so the game runs by opening `index.html` in a browser.
- **This spec describes how things should feel, not exact values.** Pick numbers (speeds, damage, timings) that feel right, and keep the main tuning values together in one place so they're easy to adjust.
- Panel contents (which clowns, where, in what order, whether the panel is "crowded") should live in one data list, separate from the game logic, so panels can be added or rebalanced without touching code.
- One shared "being drawn" system should handle both hands: something appears at a position over a few seconds and becomes active when finished. Clowns and items both use it.
- **Out of scope:** saving progress, mobile/touch controls, two-player, scrolling levels. (Multiple pages were out of scope in the first version; section 9 adds them.)

## 9. Expansion (approved Wed 10/28/2026, after the first playtest)

The first playable version (sections 1 to 8) was too short and too repetitive: 6 flat panels, two clowns and a single punch. This section extends the game. Where it conflicts with an earlier section, this section wins.

### 9.1 Length: 3 pages, 18 panels
- The game is **3 pages of 6 panels** (18 panels). Page 1 is the table in 5.2. The last panel of page 3 is THE END.
- Each page has its own setting: **page 1, the KlownKon convention floor; page 2, backstage** (props, rigging, dressing rooms); **page 3, the big top** (ring, bleachers, trapeze platforms).
- Between pages, the whole page is shown laid out as a comic page, with the panels Pierre has cleared, before the next page starts.
- The HUD shows the page and panel, e.g. "Page 2 · Panel 3 / 6".

### 9.2 Level design
- Levels need dimensionality. Every fighting panel has **at least two heights** to stand on (platforms, stacked crates, bleachers), and some clowns stand up high.
- From page 2 on, panels also have **obstacles** (solid crates or walls Pierre has to jump over or climb) and **hazards**, such as a banana peel that slips Pierre, a trapdoor, or a pie conveyor belt.
- No two panels in a row share a layout. Each new clown type appears alone in a panel before it is mixed with others.
- Some panels are mainly about getting across (a climb or a hazard run) rather than fighting.

### 9.3 Fighting
- **Combo:** pressing J three times quickly does jab, jab, then a finisher that knocks the clown back.
- **Jump kick:** J in the air kicks forward and down.
- **Hit feel:** a short freeze on every hit, a screen shake on finishers, and clowns stagger when hit.
- All items in 5.6 (hammer, knives, balloon sword, pogo stick, slinky) are part of the main game, not stretch.
- **Beret slap** (added after the second playtest): Pierre's basic attack is not a punch. He whips off his beret and slaps the clown with it ("SLAP!"), his bald head showing until the beret is back on.
- **Knocking noses off** (added after the second playtest): a hit that doesn't defeat a clown sometimes knocks its red nose off. The nose bounces away, and the clown freaks out ("MY NOSE!"), stops attacking and tries to get the nose and put it back on. If it can't reach the nose, it eventually gives up and fights on without it.

### 9.4 Mime powers
Pierre's mime routines work for real inside the comic. Each power has its own cooldown, shown in the HUD.
- **Invisible Wall (L):** Pierre mimes a wall in front of him. For a moment it blocks pies and thrown things and stops clowns walking into it.
- **Invisible Rope (U):** Pierre mimes pulling a rope, dragging the nearest clown in front of him toward him.
- **Invisible Box (I):** Pierre mimes a box around the nearest clown in reach, trapping it in place (it can't move or attack) for a few seconds.

### 9.5 Look
The comic ink style is now the target, replacing "simple shapes are fine" in section 3: brush outlines that are thicker on the shadow side, cel shadows with cross-hatching, patterned costumes, posable characters, detailed backgrounds faded behind the characters, aged paper gutters, yellow caption boxes and big extruded sound-effect lettering. The art is still drawn in code, so the hands can keep drawing things stroke by stroke.

### 9.6 Priority changes
- The extra clowns (criterion 18) and the extra items (criterion 31) move from **[P3] to [P2]**.
- Criteria 21 and 22 now mean 18 panels and "THE END" on panel 18.

### 9.7 New acceptance criteria
37. **[P2]** The game has 3 pages of 6 panels. The HUD shows the page and the panel. Panel 18 is THE END.
38. **[P2]** Between pages, the whole page is shown with the cleared panels.
39. **[P2]** Each page has its own background setting (convention floor, backstage, big top).
40. **[P2]** Every fighting panel has at least two heights to stand on, and no two panels in a row share a layout.
41. **[P2]** From page 2 on, panels include solid obstacles and at least two kinds of hazard (banana peel, trapdoor, pie conveyor belt).
42. **[P2]** Three quick J presses do jab, jab, finisher; the finisher knocks the clown back.
43. **[P2]** J in the air does a jump kick.
44. **[P2]** Hits freeze the action briefly, finishers shake the screen, and hit clowns stagger.
45. **[P2]** Invisible Wall (L) blocks pies and stops clowns for a moment, then goes on cooldown.
46. **[P2]** Invisible Rope (U) pulls the nearest clown in front of Pierre toward him, then goes on cooldown.
47. **[P2]** Invisible Box (I) traps the nearest clown in reach for a few seconds, then goes on cooldown.
48. **[P3]** Each new clown type appears alone in a panel before it is mixed with others.
49. **[P2]** J is a beret slap: Pierre takes his beret off and slaps with it, showing "SLAP!". (This replaces the punch in criterion 5.)
50. **[P2]** A hit that doesn't defeat a clown sometimes knocks its nose off. The clown panics (stops attacking, "MY NOSE!"), goes after the nose, and puts it back on if it can reach it.

### 9.8 Build order for the expansion
1. Level dimensionality and obstacles on the existing panels (40, 41), since flat panels were the biggest complaint.
2. Combo, jump kick and hit feel (42 to 44).
3. Hammer and knives (27, 28), then the left hand's other triggers (29, 30).
4. The extra clowns (18), introduced one at a time (48).
5. Pages 2 and 3 with their settings (37 to 39).
6. Mime powers (45 to 47), then the extra items (31).
7. The remaining [P2] polish from section 7, then [P3].
