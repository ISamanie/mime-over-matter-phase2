# Mime Over Matter

A comic-book brawler-platformer played panel by panel. Pierre, a silent mime, is trapped in a comic full of clowns. The cartoonist's right hand draws clowns into each panel to stop him, and his left hand secretly draws sandwiches to help. The full design is in [SPEC.md](SPEC.md).

## Handoff: where things stand (Sat 10/31/2026)

The four remaining clown types are implemented (spec 5.4 / criterion 18), with a solo introduction each (criterion 48). The game now has **10 panels**: two original tutorial panels, four introductions, three mixed fights, then THE END. The full 18-panel, three-setting expansion remains unfinished.

- **Seltzer Spritzer:** 3 health. Walks toward Pierre on its surface, then sprays at close range. Each short burst pushes once with strong knockback, does no health damage, and respects invincibility. Jumping over the spray avoids it.
- **Juggler:** 3 health. Stands still juggling three pins, and throws a pin straight toward nearby Pierre on a cooldown. Pins damage once, hit risers/ground, and expire; swept collision prevents fast pins skipping targets.
- **Balloon Twister:** 4 health. Backs away and twists up to two live dogs at a time. Dogs chase, fall onto lower surfaces, pop on contact or a beret/hammer hit, and eventually expire if stranded. The Twister replaces popped dogs while alive.
- **Clown Car:** 9 health. Parks and releases one-hit mini clowns, up to three alive per car. Minis chase and hurt on contact. Smashing the car stops spawning; every surviving mini still counts toward the exit gate. Minis emerge fully drawn from the finished car. Any car panel automatically receives the crowded-panel hammer, even without a `crowded` flag.

All four inherit drawing immunity, stagger, shouts, defeat and the nose gag. Tuning values are in `js/config.js`; props and spawned enemies reset between panels. Solo introductions are panels 3 (Spritzer), 4 (Juggler), 5 (Twister), and 6 (Car). Mixed fights follow in panels 7 to 9.

Run both `node tests/smoke.js` and `node tests/clowns.js`. The focused suite reports each type separately and checks drawing, attacks, nose recovery, spawn limits/replenishment, gate accounting and combat progression through all panels to THE END. Progression tests give Pierre immunity to isolate progression from difficulty.

Open `tests/preview.html` for browser playtesting. Buttons jump to each new type; normal controls still work. "Advance 1 second" steps the real simulation. Disable "Practice: no damage" to test pushes and damage. These inspection controls only appear on the test page.

### Earlier handoff (Wed 10/28/2026)

- **Built:** every [P1] criterion. The first version (spec sections 1 to 8) is a complete, winnable 6-panel game: walk, jump, attack, two clown types, the right hand drawing clowns, the left hand's sandwich rescue, Game Over and THE END.
- **Since the first playtest:** a comic ink art style (spec 9.5), multi-level risers in every panel (criterion 40), the squeaky hammer, which the left hand draws at the start of the crowded panel 4 (criteria 27 and 29), a page-turn animation between panels (the camera zooms out to the whole comic page, a reading arrow points to the next panel, and the camera zooms into it), the beret slap in place of the punch, knocking clowns' noses off, and clowns' speech bubbles (criteria 13, 38, 49 and 50).
- **Approved but not built:** [SPEC.md section 9](SPEC.md#9-expansion-approved-wed-10282026-after-the-first-playtest) expands the game to 18 panels on 3 pages, with obstacles and hazards, combos, a jump kick, hit feel, mime powers, and the extra clowns and items as [P2]. Its build order is in spec 9.8, and the [Next steps](#next-steps) below map each step to the code.
- **The playtest verdict to fix first:** "the levels are really boring." Panels need obstacles, hazards and more variety (criterion 41) before anything else. This was the planned next cycle when time ran out.
- **How it was built:** in small cycles (build, test, screenshot, check with the designer). Every commit message says what changed, and `prompt_log.md` has every prompt word for word.
- **Before changing anything,** run `node tests/smoke.js` and play through once.

## Install and run

You need any current desktop browser (Chrome, Firefox, Safari or Edge). Nothing to install, no build step, no server.

1. Clone or download this repository: `git clone https://github.com/bcollier/mime-over-matter.git`
2. Open `index.html` in the browser (double-click it, or drag it onto a browser window).
3. Click the game once if the keyboard doesn't respond, so the page has focus.

The scripts are plain `<script>` tags, not ES modules, on purpose: browsers block modules on `file://` pages, so modules would need a local server.

### Tests

With [Node](https://nodejs.org) installed (any recent version, no packages), run from the repo root:

```
node tests/smoke.js
node tests/clowns.js
```

It loads the real game scripts with a fake canvas and checks the core rules:
- panel data, including that every platform can be reached by jumping;
- clowns being harmless while drawn;
- punching, the gate and moving between panels;
- the sandwich rescue and its cooldown;
- the hammer: drawn first in the crowded panel, 3 damage, breaks after 10 swings;
- the page turn: it starts when Pierre walks off the edge, the game is frozen during it, and play resumes in the next panel;
- the beret slap landing partway through the swing, and a knocked-off nose that the clown chases down and puts back on;
- Game Over, restart and THE END.

It doesn't check how anything looks or feels, so play the game too.

## Controls

| Key | Action |
|---|---|
| Left / Right arrows, or A / D | Walk |
| Space, W or Up arrow | Jump (let go early for a short hop) |
| J | Beret slap, or swing the squeaky hammer while holding it |
| R (or Enter) | Restart from panel 1 after Game Over or at THE END |

Not built yet: K (throw knife), P (pause), and the mime powers L, U and I (spec 9.4). There is no title screen yet, so the game starts as soon as the page loads.

## Acceptance criteria

Numbers match sections 6 and 9.7 of [SPEC.md](SPEC.md). The original core criteria were met; the expanded panel-count criteria remain partial. The art style, multi-level panels, hammer, page view, beret slap, nose gag, shouts and all four extra clown types are in.

| # | Pri | Status | Notes |
|---|---|---|---|
| 1 | P1 | Met | Plain HTML and JavaScript. Checked by opening `index.html` from disk in Chrome, not from a server. |
| 2 | P2 | Not met | No title screen; the game starts at panel 1 on load. |
| 3 | P1 | Met | Arrows/A/D walk, Space/W/Up jump. |
| 4 | P1 | Met | Lands on the ground and platforms (one-way: jump up through, land on top). The left edge and the ink line are walls. |
| 5 | P1 | Met (as a slap) | J attacks: since criterion 49 it's a beret slap. A hit on a finished clown damages it and shows a "SLAP!" burst. |
| 6 | P1 | Met | 10-segment health bar in the HUD. A hit removes 1, knocks Pierre back, and makes him flash and ignore hits for 1 second. |
| 7 | P1 | Met | At 0 health a "CANCELLED!" stamp covers the frozen panel. R restarts at panel 1 with full health and no items. |
| 8 | P2 | Not met | No speech bubble when hit. |
| 9 | P1 | Met | On entering a panel, a big hand with an ink pen reaches down from above the screen and draws each clown in turn. |
| 10 | P1 | Met | 2 seconds per clown: the pen traces the outline (60% of the time), then scribbles the color in from the top down. |
| 11 | P1 | Met | A clown being drawn doesn't move or attack, can't hurt Pierre and can't be punched. |
| 12 | P1 | Met | The moment the drawing finishes, the clown starts riding or throwing. |
| 13 | P2 | Met | When a clown comes to life it shouts one of the spec's lines in a speech bubble ("HONK!", "HAW HAW!", "NICE FACE PAINT!", "SAY SOMETHING!"). |
| 14 | P3 | Not met | No countdown ring. |
| 15 | P1 | Met | Unicyclist rides back and forth on its own ground or platform, turns at ledges, walls and the ink line, and hurts on contact. 2 punches. |
| 16 | P1 | Met | Pie Tosser stays put, faces Pierre and lobs a pie in an arc at where he is every 2.6 seconds. 4 punches. Pies splat on Pierre, platforms or the ground. |
| 17 | P1 | Met | A defeated clown is removed at once. |
| 18 | P2 (was P3) | Met | All four implemented; see the separate reports in the current handoff above. |
| 19 | P1 | Met | A thick wavy ink line blocks the right edge until every clown in the panel is defeated; then it disappears and a bobbing yellow arrow shows. |
| 20 | P1 | Met | Walking off the right edge loads the next panel with Pierre on its left side. |
| 21 | P1 | Partly met for expansion | Two tutorials, four solo introductions, then three mixed fights. The HUD shows "Panel N / 10"; the full 18-panel expansion remains. |
| 22 | P1 | Partly met for expansion | Panel 10 shows "THE END"; R starts a new game. Moving THE END to panel 18 remains. |
| 23 | P2 | Partly met | "THE END" is shown, but it isn't drawn in by a hand, and Pierre doesn't bow. |
| 24 | P1 | Met | At 3 health or less, a second hand holding a crayon wobbles in and draws a sandwich in 1.2 seconds. It won't draw another while one is on screen, or within 10 seconds of the last. |
| 25 | P1 | Met | Touching a finished sandwich restores 4 health, never above 10. |
| 26 | P1 | Met | A sandwich being drawn can't be eaten. |
| 27 | P2 | Met | Touching the hammer replaces the punch: J swings it for 3 damage (a punch does 1), with more reach and knockback, slower, and a "SQUEAK!" burst. It breaks after 10 swings, hit or miss ("CRACK!"). The HUD shows the swings left. Picking up another hammer resets the count. |
| 28 | P2 | Not met | No knives. |
| 29 | P2 | Met | In crowded or car panels (6, 8 and 9), the left hand draws the hammer immediately, finishing before the first clown. The item is always the hammer for now. |
| 30 | P2 | Not met | No random items. |
| 31 | P2 (was P3) | Not met | No balloon sword, pogo stick or slinky. |
| 32 | P3 | Not met | No Invisible Dog. |
| 33 | P3 | Not met | The hand can't be hurt. |
| 34 | P2 | Partly met | "SLAP!" on beret slaps, "SQUEAK!" on hammer hits, "POP!" when a nose comes off, and "CRACK!" when the hammer breaks. No "BONK!" when Pierre is hit. |
| 35 | P2 | Not met | No pause. |
| 36 | P3 | Not met | No sound. |
| 37 | P2 | Not met | Interim roster has one page of 10 panels; three pages remain pending. |
| 38 | P2 | Partly met | Between every pair of panels, the camera zooms out to the whole page and back in (`js/page.js`). Cleared panels show as Pierre left them, and panels ahead are faded. There's only one page so far, so it never moves on to a second page. |
| 39 | P2 | Partly met | Page 1's setting, the KlownKon convention hall, is built (`paintConventionHall` in `js/render.js`). No backstage or big top yet. |
| 40 | P2 | Met for panels 1 to 9 | Multiple risers and distinct neighboring layouts; the smoke test checks every riser can be reached. |
| 41 | P2 | Not met | No solid obstacles or hazards. Platforms are one-way. |
| 42 | P2 | Not met | No combo. |
| 43 | P2 | Not met | No jump kick. |
| 44 | P2 | Not met | No hit freeze or screen shake. Clowns flicker and pause briefly when hit. |
| 45 | P2 | Not met | No Invisible Wall. |
| 46 | P2 | Not met | No Invisible Rope. |
| 47 | P2 | Not met | No Invisible Box. |
| 48 | P3 | Met | Each new type debuts alone in panels 3 to 6 before the mixed fights in panels 7 to 9. |
| 49 | P2 | Met | Pierre whips off his beret and swings it in an arc from behind his head, with speed lines, while his bald head (three hairs) shows. The hit lands 0.1 seconds into the swing. While he holds the hammer, J swings that instead. |
| 50 | P2 | Met | A hit that doesn't defeat a clown has a 35% chance (`CONFIG.clowns.noseChance`) to pop its nose off. The nose bounces. The clown stops attacking, raises its arms, shakes, sweats, says "MY NOSE!", and goes after it on its own platform. It puts the nose back with a "HONK!", or says "GRR!" and fights on without it if the nose landed somewhere it can't reach within 5 seconds. |

## Code map

`index.html` loads the scripts below in this order. They share one global scope, so a function can use something from a later file as long as it only runs after loading. `main.js` comes last and starts the game.

| File | What's in it |
|---|---|
| `js/config.js` | `CONFIG`: every tuning value (speeds, health, damage, draw times, cooldowns, sizes). Change numbers here. |
| `js/panels.js` | `PANELS`: the ten panels as data: platforms, clowns in drawing order, solo introductions, the `crowded` flag and captions. |
| `js/page.js` | The page turn between panels: `pageSlot` (where each panel sits on the page), `drawComicPage` (the whole page, with the reading arrow) and `drawPageTurn` (the zoom out, hold and zoom in, timed by `CONFIG.pageTurn`). |
| `js/render.js` | The comic look: paper gutters, the brush panel border, the KlownKon convention-hall background (drawn once per panel and cached), stage-riser platforms, caption boxes, shadows, "POW!" bursts, ink-line gate, exit arrow, "CANCELLED!", "THE END" and the HUD. |
| `js/drawing.js` | The ink style and the shared "being drawn" system both hands use. Things are lists of shapes ("parts"); `limb` makes tapered arms and legs. `drawSketch` inks them with brush outlines, cel shadows, hatching, stripes and dots, finished or partly drawn. `penPoint` says where the pen tip is, and `DrawJob` runs one drawing and makes the thing `active` when it's done. |
| `js/physics.js` | Surfaces (ground plus platforms), landing on them, and box overlap tests. |
| `js/pierre.js` | `Pierre`: input, movement, jumping, attacking (`punch` starts a swing, `strike` lands it: a beret slap, or the held hammer), getting hurt, healing, and his parts, posed from joint positions for walking, slapping, jumping and getting hit. |
| `js/clowns.js` | `Clown` base class, six clown types, mini clowns, seltzer bursts, bowling pins, balloon dogs, noses, pies and `makeClown(spec)`. A clown's nose is tagged `tag: 'nose'`. |
| `js/items.js` | `Item` (the shared base: drawn by the left hand, picked up by touch once finished), `Sandwich`, `Hammer`, and `hammerParts`, which both the hammer on the floor and the one in Pierre's hand use. A new item subclasses `Item` and defines `pickUp(pierre)` and `parts()`. |
| `js/hands.js` | `Hand`, one class for both hands: queue things, fly in, draw each with a `DrawJob`, leave. `handParts` is the hand holding a pen or crayon, as inked parts. |
| `js/main.js` | Keyboard input (`Input`, `KEYS`), the `Game` object (states `play`, `pageTurn`, `gameover` and `end`; loading panels; `nextPanel`, which snapshots panels for the page view; the gate; the sandwich rescue and where to put it; update and render order), and the frame loop. `drawPanelContents` draws everything inside the panel, for both the live screen and snapshots. |
| `tests/smoke.js` | The Node smoke test (see [Tests](#tests)). |
| `tests/clowns.js` | Focused acceptance tests for each extra clown and combat progression to THE END. |
| `tests/preview.html` | Browser playtest page with introduction selection, practice mode and frame stepping. |

**How a panel runs:**
1. `Game.loadPanel` queues each clown from `PANELS` with the right hand.
2. The hand adds each clown to `Game.clowns` when its pen first touches the page, so the clown appears half drawn and inactive.
3. When the drawing finishes, `Game.update` starts calling the clown's `act`.
4. Each defeated clown counts toward `gateOpen`.

**Adding a clown or item:** give it `x`, `y`, `facing`, `parts()`, `update` and `render`, then pass it to a hand's `draw(thing, onStart)`.

**Testing from the browser console:** `Game` is a global.
- `Game.loadPanel(2)` jumps to the Spritzer introduction; indexes 3, 4 and 5 introduce Juggler, Twister and Car.
- `Game.pierre.health = 3` triggers the sandwich rescue.
- `Game.clowns.forEach(c => c.hurt(99, 0, Game))` defeats every finished clown.

## Next steps

In the order of spec 9.8, with where each one goes in the code:

1. **Obstacles and hazards (41).** This was the playtest's biggest complaint.
   - Add `walls: [{x, y, w, h}]` to panels in `js/panels.js`. In `js/physics.js`, add a function that pushes a body out of walls sideways and lets it stand on top. Call it from `Pierre.update` and `Unicyclist.act` (the Unicyclist should turn at walls).
   - Hazards fit as a `hazards` list per panel, with classes beside the clowns: a banana peel that sets Pierre sliding, a trapdoor that opens on a timer, a conveyor that adds `vx` while he stands on it.
2. **Combo, jump kick and hit feel (42 to 44).**
   - Combo: in `Pierre.punch`, count presses within a short window. In `Pierre.strike`, make the third hit a finisher with more damage and a bigger push (`Clown.hurt` takes a push). Add a pose for each hit in `Pierre.parts`, next to the beret slap.
   - Jump kick: when `!this.onGround`.
   - Hit freeze: a `Game.freeze` timer that skips `update` for a few frames.
   - Screen shake: a random offset applied in `Game.render` before drawing the panel.
3. **Knives (28), then random items (30).** The hammer is done; copy its pattern.
   - Knives: a `Knives` subclass of `Item` whose `pickUp` adds to a `pierre.knives` count. Add K to `KEYS`, a `Knife` projectile shaped like `Pie` in `js/clowns.js`, and the count to `drawHUD`.
   - Random items: roll about 1 in 3 per fighting panel in `Game.loadPanel` and schedule a left-hand draw at a random time. Mostly sandwiches, sometimes a hammer or knives. The crowded-panel draw in `loadPanel` could then pick a random non-sandwich item too.
   - Spec 5.7 (hurting the right hand with the hammer) now has the hammer it needs.
4. **Extra clowns (18, 48): done.** Keep the solo introductions before mixed encounters when distributing panels across the planned three pages. Tune difficulty after playtesting.
5. **Pages 2 and 3 (37 to 39).**
   - Turn `PANELS` into a list of pages and show "Page P · Panel N" in `drawHUD`.
   - Add `paintBackstage` and `paintBigTop` beside `paintConventionHall`, picked by a `setting` field on each page.
   - The page view already exists (`js/page.js`). Make `pageSlot` and the page title use the panel's position within its page, and pass that page's panels to `drawComicPage`.
6. **Mime powers (45 to 47), then the extra items (31).** A new `js/mime.js` with one class per power and a cooldown each. Wall: a short-lived box that pies and clowns treat as solid. Rope: pull the nearest clown in front of Pierre. Box: set the nearest clown's `stun` for a few seconds and draw a mimed box around it.
7. **The remaining [P2] polish (2, 8, 23, 34, 35):**
   - title screen with the story captions (a `'title'` state);
   - Pierre's empty "…" bubble when hit (`drawSpeechBubble` in `js/render.js` is ready to use);
   - Pierre's bow and a hand drawing "THE END";
   - "BONK!" when Pierre is hit;
   - P to pause.

   Then [P3].

## Known bugs

- The hands can run past the edge of the canvas. When the right hand draws a clown near the right edge, its sleeve covers "Panel N / 6" in the HUD for a moment.
- If Pierre leaves a panel while the left hand is still drawing a sandwich, the sandwich is lost and the 10-second cooldown still applies.
- Pies already in the air keep flying after the last clown is defeated and can still hit Pierre.
- Difficulty is untuned. Pierre's hitbox is large (40 × 124), and the mixed fights in panels 7 to 9 need further playtesting. Tune `CONFIG.clowns`, `CONFIG.pie` and `CONFIG.sandwich` together. Automated progression checks use damage immunity and don't measure combat difficulty.
- The multi-level panels, the hammer, the page turn, the beret slap and the nose gag have been checked by the smoke test and in Chrome screenshots, but not yet played through by hand.
- A clown that gives up on its nose leaves the nose lying where it landed for the rest of the panel. Clowns can't jump between platforms, so a nose that falls off a clown's platform is always out of its reach.

## Where I cut corners, and why

- **Art drawn in code.** There are no image files. Characters are inked shapes with brush outlines, cel shadows and hatching, so the hands can still draw them stroke by stroke. Every panel uses the same convention-hall background (with a different banner position and crowd), because page 1 is all one setting.
- **One-way platforms only.** There are no solid walls inside a panel; the only walls are the panel edges and the ink line. Spec 9.2 now asks for solid obstacles; that's next step 1.
- **The Pie Tosser doesn't hurt on contact.** The spec only gives contact damage to the Unicyclist, so Pierre can walk through a Pie Tosser.
- **Item placement is a simple score.** Each candidate spot on the ground or a platform scores higher the farther it is from clowns, minus a pull toward Pierre, and spots right under him are avoided.
- **Tests check rules, not feel.** `tests/smoke.js` covers the core rules, but nothing checks the art or how the game plays.
- **Enter also restarts.** The spec uses Enter for "continue from title and end screens". There's no title screen yet, so Enter does the same as R.
