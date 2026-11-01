# Mime Over Matter

A comic-book brawler-platformer in plain HTML and JavaScript. Pierre, a silent mime, fights across a comic while the cartoonist's right hand draws enemies and the rebellious left hand draws supplies. The design is in [SPEC.md](SPEC.md).

## Current handoff — November 1, 2026

The previously missing gameplay features are implemented. The campaign now has **18 panels on three pages**: the convention floor, backstage, and the big top, with THE END on panel 18. Each new clown still debuts alone before appearing in mixed fights. Panels 10 and 14 focus on traversal.

- **Terrain:** solid crates block movement from the sides and below and support standing on top. From page 2 onward, every encounter has crates and at least two hazard types: banana peels cause a harmless slide, conveyors carry Pierre, and elevated trapdoors open and close on a timer. Open trapdoors drop Pierre to the floor; they are not instant-death pits.
- **Combat:** three quick J presses queue two beret strikes and a stronger finisher with extra knockback. J in the air kicks forward and down. Hits briefly freeze the simulation; finishers shake the panel; clowns stagger. Input buffering preserves quick combo presses through hit freeze.
- **Items:** sandwiches, hammer, throwing knives, balloon sword, pogo stick, slinkies, and Invisible Dog all use the shared drawing/pickup system. Knife stacks are separate from the held weapon. Picking up a melee item replaces the previous one. A pogo automatically bounces until its timer expires. A slinky walks toward a clown and drops off ledges; it cannot climb crates.
- **Left hand:** low-health rescue, early crowded-panel supplies, and random supplies in about one third of non-crowded encounters. Random supplies are mostly sandwiches. Any Clown Car automatically makes a panel crowded. Some crowded encounters supply a specific new item so it can be tried without waiting for a random drop.
- **Mime powers:** Invisible Wall blocks clowns, pies and thrown props; Rope pulls the nearest clown in front of Pierre; Box prevents the nearest clown in reach from moving or attacking. Each has its own HUD cooldown. A failed cast does not consume the cooldown. Pierre presses flat palms against the wall, pulls the rope hand over hand, and traces the box's edges; brief edge sparkles and a moving rope accent each cast. Attacking or getting hit interrupts the gesture.
- **Presentation:** Pierre uses the approved angular design: a faceted face and gloves, tilted beret, tapered trousers and wedge shoes, drawn with the shared comic brush and animated by the existing joint rig. Title/story screen, pause, silent hurt bubble, BONK impacts, drawing countdown rings, six-panel page views, distinct settings, and a silent bow while the right hand draws THE END. HUD information stays above the drawing hands.
- **Right-hand interruption:** a hammer hit on the visible hand cancels its current clown drawing. The hand shakes, shows OW and stars, retreats, and returns to redraw the cancelled clown and its remaining queue. Cancelling never counts as defeating a clown.
- **Sound:** locally synthesized honk, squeak, pop and drawing scratch. Audio starts after a keyboard or pointer gesture, as required by browsers. M toggles sound. No downloaded audio or libraries are needed.

## Run

Open `index.html` directly in a desktop browser. There is no installation, build step or required server. Press Enter on the title screen; click the canvas if it needs keyboard focus.

For an optional localhost preview:

```
node tests/serve.js
```

Open [the game](http://127.0.0.1:8765/index.html) or [the acceptance playtest](http://127.0.0.1:8765/tests/preview.html). The server binds to localhost and serves only the game scripts and these two HTML pages. Stop it with Ctrl+C.

## Controls

- **Arrows / A / D:** walk.
- **Space / W / Up:** jump; release early for a short hop. A held pogo bounces automatically.
- **J:** attack with the held item, or use the beret; three quick presses make a combo. In the air, J kicks. While holding slinkies, J releases one.
- **K:** throw a knife if available.
- **L / U / I:** Invisible Wall / Rope / Box.
- **Enter:** start from the title; restart at the ending.
- **R:** restart after Game Over or THE END.
- **P:** pause or resume, including during a page turn.
- **M:** mute or enable sound.

## Tests

With a recent Node version, run:

```
node tests/smoke.js
node tests/clowns.js
node tests/expansion.js
```

No packages are required. These tests load the real scripts from `index.html` with a fake canvas.

- **Smoke:** drawing immunity, movement, platform reachability, beret impact timing, nose recovery, gate progression, sandwiches, crowded-panel hammer, page turns, Game Over, restart and THE END.
- **Clowns:** all four added types separately, including their attacks, spawn caps and replenishment, drawing immunity, nose behavior, dead-enemy guards, car/minion gate accounting, and progression through all 18 panels. The progression check gives Pierre immunity and places him beside targets to isolate attack/gate rules from combat skill and navigation.
- **Expansion:** campaign structure, solid collision, all hazard types, buffered combo keypresses, kick selection, freeze/shake/stagger, every new item's drawing/pickup lifecycle and behavior, knife collision, all three mime powers and cooldowns, pause, hand cancellation/redraw, random supplies, title, ending, restart, audio-node lifecycle and mute.

Open `tests/preview.html` directly or through the optional server for browser checks. It has scene selection, frame stepping, simulated movement/attacks/powers, test supplies and optional damage immunity. These inspection controls are not in the actual game. Browser checks verified the title, both new settings, crates, jumping, mime-wall display, knife input, HUD, whole-page transitions, pause overlay and drawn ending without console errors. Web Audio entered its running state; audible quality still needs a listening check.

## Spec coverage

All previously missing features have implementations, including P3 additions. This is implementation coverage, not a claim that balance and every browser have been fully playtested.

- **1–13:** file-friendly startup, title, movement/combat/health, restart, hurt bubble, both drawing hands and clown shouts. Basic attacks use the later beret-slap requirement (49).
- **14–18:** countdown rings; Unicyclist, Pie Tosser and all four additional clown types.
- **19–23, 37–40:** gates, 18-panel campaign, three settings/pages, snapshots and page transitions, reachable multi-level layouts, drawn ending and bow.
- **24–30:** sandwich rescue and pickup immunity, hammer, knives, early crowded supplies and weighted random supplies.
- **31:** balloon sword is fast/weak and pops after eight swings; pogo is temporary, jumps higher and bounces off damaged clowns; slinkies have limited charges, seek clowns and descend ledges.
- **32:** temporary Invisible Dog, represented only by collar and stiff leash, following Pierre and biting nearby clowns.
- **33:** hammer interruption, cancellation without a defeat, and right-hand recovery/redrawing.
- **34–36:** impact lettering, pause and synthesized effects.
- **41–44:** solid obstacles, three hazard types, combo/finisher, jump kick, freeze/shake/stagger.
- **45–47:** Wall, Rope and Box with HUD cooldowns.
- **48–50:** solo clown debuts, beret slap, and the lost-nose gag. A nose blocked by a crate now also times out correctly.

## Clown reports (criterion 18)

- **Seltzer Spritzer:** 3 health. Walks toward Pierre, then sprays nearby. Each short burst pushes once without removing health. Jumping over the spray avoids it.
- **Juggler:** 3 health. Stands juggling and throws a pin straight toward nearby Pierre. Pins damage once and are intercepted by platforms, crates and mime walls. Swept collision prevents fast pins skipping targets.
- **Balloon Twister:** 4 health. Retreats and maintains up to two live dogs. Dogs chase, drop onto lower surfaces, and pop on contact, a beret/hammer hit, or expiry. The Twister replaces popped dogs while alive.
- **Clown Car:** 9 health. Parks and releases one-hit mini clowns, up to three alive per car. Minis chase and hurt on contact. Destroying the car stops spawning; surviving minis must still be defeated to open the exit.

## Code map

- `js/config.js`: tuning values, timers, health, damage, ranges and cooldowns.
- `js/panels.js`: all 18 encounters, page settings, platforms, crates, hazards, captions and early supplies.
- `js/physics.js`: surfaces, one-way landing, solid-body collision and projectile collision helpers.
- `js/world.js`: hazards and crate rendering.
- `js/drawing.js`: inked parts, progressive sketching and shared DrawJob lifecycle.
- `js/clowns.js`: clown AI, mini clowns, noses, pies, seltzer, pins and balloon dogs.
- `js/pierre.js`: movement, buffered combos, kicks, held items, taking hits and character poses.
- `js/items.js`: base item, sandwich, hammer and shared hammer artwork.
- `js/extras.js`: the other items, friendly projectiles/helpers and synthesized sound.
- `js/mime.js`: mime powers, targeting, cooldowns and effect rendering.
- `js/hands.js`: drawing queues, hand movement, hammer interruption and recovery.
- `js/page.js`: six-panel page layouts, snapshots, reading arrows and cross-page transitions.
- `js/render.js`: backgrounds, HUD, story/title, pause, impact lettering and ending.
- `js/main.js`: keyboard input, states, scheduling, update/render order and panel transitions.
- `tests/`: rule tests, shared test harness, browser inspection page and optional preview server.

Scripts intentionally remain ordinary script tags so the game works from disk. There are no external assets, dependencies, saves, mobile controls, multiplayer or scrolling levels.

## Remaining playtesting

Difficulty and feel still need a complete human playthrough without practice immunity. The automated progression test does not prove that every encounter is well balanced or fun. Browser checks used the available Chromium browser; Firefox/Safari and different display densities need further checking. Audio-node tests cannot judge the sound by ear.

Ground-based clowns cannot jump between platforms. A lost nose on an unreachable surface is abandoned after five seconds; abandoned noses remain until the next panel. Trapdoors are forgiving shortcuts rather than lethal pits. These choices keep the game slapstick and recoverable.

Earlier implementation prompts and handoffs are preserved in [prompt_log.md](prompt_log.md).
