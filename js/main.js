// The game loop, keyboard input, game states and moving between panels.
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// Draw in logical 960 x 640 coordinates on a canvas with one pixel per
// device pixel, so the ink lines stay sharp on high-density screens.
canvas.width = CONFIG.canvas.width * DPR;
canvas.height = CONFIG.canvas.height * DPR;

// Keyboard state. `down` holds keys being held; `pressed` holds keys that
// went down since the last frame (for one-shot actions like jump and punch).
const Input = {
  down: new Set(),
  pressed: new Set(),
  isDown(...keys) { return keys.some(k => this.down.has(k)); },
  wasPressed(...keys) { return keys.some(k => this.pressed.has(k)); },
  endFrame() { this.pressed.clear(); },
};
const KEYS = {
  left: ['ArrowLeft', 'a'],
  right: ['ArrowRight', 'd'],
  jump: [' ', 'w', 'ArrowUp'],
  attack: ['j'],
  restart: ['r', 'Enter'],
};
const keyName = e => (e.key.length === 1 ? e.key.toLowerCase() : e.key);
addEventListener('keydown', e => {
  const k = keyName(e);
  if (!Input.down.has(k)) Input.pressed.add(k);
  Input.down.add(k);
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault();
});
addEventListener('keyup', e => Input.down.delete(keyName(e)));
addEventListener('blur', () => Input.down.clear());

const Game = {
  state: 'play',   // 'play', 'pageTurn', 'gameover' or 'end'
  time: 0,

  restart() {
    this.pierre = new Pierre();
    this.rightHand = new Hand('right');
    this.leftHand = new Hand('left');
    this.sandwichCooldown = 0;
    this.pictures = [];   // each panel as Pierre left it, for the page view
    this.state = 'play';
    this.loadPanel(0);
  },

  loadPanel(index) {
    this.panelIndex = index;
    this.panel = PANELS[index];
    this.surfaces = surfacesOf(this.panel);
    this.clowns = [];
    this.items = [];
    this.pies = [];
    this.noses = [];
    this.effects = [];
    this.defeated = 0;
    this.pierre.placeAtStart();

    // The right hand draws this panel's clowns, one at a time, in order.
    this.leftHand.reset();
    this.rightHand.reset();
    for (const spec of this.panel.clowns) {
      this.rightHand.draw(makeClown(spec, this.surfaces), clown => this.clowns.push(clown));
    }
    // A crowded panel: the left hand draws the hammer at once. It draws
    // faster and starts sooner, so the hammer is ready before the first
    // clown (spec 5.5).
    if (this.panel.crowded) {
      const spot = this.spotForItem();
      this.leftHand.draw(new Hammer(spot.x, spot.y), item => this.items.push(item));
    }
  },

  // The left hand's rescue (spec 5.5): when Pierre is low on health, it
  // quickly draws a sandwich. Not while one is on screen or being drawn,
  // and not again until the cooldown is over.
  helpIfLosing(dt) {
    this.sandwichCooldown -= dt;
    if (this.panel.theEnd || this.leftHand.busy || this.sandwichCooldown > 0) return;
    if (this.pierre.health > CONFIG.sandwich.lowHealth) return;
    if (this.items.some(i => i.kind === 'sandwich')) return;
    const spot = this.spotForItem();
    this.leftHand.draw(new Sandwich(spot.x, spot.y), item => this.items.push(item));
    this.sandwichCooldown = CONFIG.sandwich.cooldown;
  },

  // Somewhere Pierre can reach, away from clowns: the spot on the ground
  // or a platform that's farthest from every clown, with a pull toward
  // Pierre so it isn't on the far side of the room. Not right on top of
  // him, though, or he'd hide the drawing.
  spotForItem() {
    const right = Math.min(CONFIG.panel.w, this.rightLimit()) - 40;
    const spots = [];
    for (const s of this.surfaces) {
      for (let x = Math.max(s.x + 25, 40); x <= Math.min(s.x + s.w - 25, right); x += 30) {
        spots.push({ x, y: s.y });
      }
    }
    const clowns = [...this.clowns, ...this.rightHand.queue.map(q => q.thing)];
    const score = spot => {
      const fromClowns = Math.min(260, ...clowns.map(c => Math.hypot(c.x - spot.x, c.y - spot.y)));
      const fromPierre = Math.hypot(this.pierre.x - spot.x, this.pierre.y - spot.y);
      return fromClowns - 0.35 * fromPierre - (fromPierre < 80 ? 200 : 0);
    };
    return spots.reduce((best, spot) => (score(spot) > score(best) ? spot : best));
  },

  clownDefeated() {
    this.defeated++;
  },

  // The ink line goes once every clown in the panel is defeated.
  get gateOpen() {
    return !this.panel.theEnd && this.defeated >= this.panel.clowns.length;
  },

  // How far right Pierre can go: the ink line, or off the edge once it's
  // gone. THE END panel's right edge is a plain wall.
  rightLimit() {
    if (this.panel.theEnd) return CONFIG.panel.w;
    return this.gateOpen ? Infinity : CONFIG.panel.w - CONFIG.gateWidth;
  },

  // A comic impact word ("POW!") at a spot in the panel.
  burst(text, x, y, color = '#e53935') {
    this.effects.push({ text, x, y, color, t: 0, tilt: (Math.random() - 0.5) * 0.4, seed: Math.floor(Math.random() * 1e6) });
  },

  // Pierre walked off the right edge: snapshot the panel he's leaving and
  // the next one as he enters it, then play the page turn between them.
  // The game is frozen until it finishes.
  nextPanel() {
    const from = this.panelIndex;
    this.pictures[from] = this.snapshot();
    this.loadPanel(from + 1);
    this.pictures[from + 1] = this.snapshot();
    this.turn = { from, to: from + 1, t: 0 };
    this.state = 'pageTurn';
  },

  snapshot() {
    return offscreen(CONFIG.panel.w, CONFIG.panel.h, g => this.drawPanelContents(g));
  },

  update(dt) {
    this.time += dt;
    if ((this.state === 'gameover' || this.state === 'end') && Input.wasPressed(...KEYS.restart)) {
      this.restart();
      return;
    }
    if (this.state === 'gameover') return;   // freeze the panel under the stamp
    if (this.state === 'pageTurn') {
      const c = CONFIG.pageTurn;
      this.turn.t += dt;
      if (this.turn.t >= c.zoomOut + c.hold + c.zoomIn) this.state = this.panel.theEnd ? 'end' : 'play';
      return;
    }

    this.pierre.update(dt, this);
    if (this.pierre.x - this.pierre.w / 2 > CONFIG.panel.w) {
      this.nextPanel();
      return;
    }
    this.rightHand.update(dt);
    this.leftHand.update(dt);
    this.helpIfLosing(dt);
    for (const i of this.items) if (i.active) i.update(dt, this);
    this.items = this.items.filter(i => !i.taken);
    for (const c of this.clowns) if (c.active) c.update(dt, this);
    this.clowns = this.clowns.filter(c => !c.dead);
    for (const p of this.pies) p.update(dt, this);
    this.pies = this.pies.filter(p => !p.done);
    for (const n of this.noses) n.update(dt, this);
    this.noses = this.noses.filter(n => !n.gone);
    for (const e of this.effects) e.t += dt;
    this.effects = this.effects.filter(e => e.t < CONFIG.burstTime);
    if (this.pierre.health <= 0) this.state = 'gameover';
  },

  render() {
    const { x, y, w, h } = CONFIG.panel;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    drawPaper(ctx);

    if (this.state === 'pageTurn') {
      const zoom = drawPageTurn(ctx, this.turn, this.pictures);
      ctx.save();
      ctx.globalAlpha = zoom;   // the HUD fades out with the zoom
      drawHUD(ctx, this);
      ctx.restore();
      return;
    }

    // Everything inside the panel is drawn in panel coordinates and clipped
    // to the panel.
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.clip();
    this.drawPanelContents(ctx);
    ctx.restore();

    drawPanelFrame(ctx);
    drawHUD(ctx, this);

    // The hands reach in from outside the panel, over everything.
    ctx.save();
    ctx.translate(x, y);
    this.rightHand.render(ctx);
    this.leftHand.render(ctx);
    ctx.restore();
  },

  // Everything inside the panel, in panel coordinates. Also used to
  // snapshot a panel for the page view.
  drawPanelContents(ctx) {
    drawPanelBackground(ctx, this.panel, this.panelIndex);
    drawSurfaces(ctx, this.panel.platforms);
    drawCaption(ctx, this.panel.caption);
    for (const c of this.clowns) if (c.active) drawShadow(ctx, this.surfaces, c.x, c.y, c.w);
    drawShadow(ctx, this.surfaces, this.pierre.x, this.pierre.y, this.pierre.w);
    if (this.panel.theEnd) drawTheEnd(ctx);
    else if (this.gateOpen) drawExitArrow(ctx, this.time);
    else drawGate(ctx);
    for (const i of this.items) i.render(ctx);
    for (const c of this.clowns) c.render(ctx);
    for (const p of this.pies) p.render(ctx);
    for (const n of this.noses) n.render(ctx);
    this.pierre.render(ctx);
    for (const e of this.effects) drawBurst(ctx, e);
    if (this.state === 'gameover') drawGameOver(ctx);
  },
};

let last = performance.now();
function frame(now) {
  // Cap the step so a background tab or a slow frame can't tunnel things
  // through platforms.
  const dt = Math.min(1 / 30, (now - last) / 1000);
  last = now;
  Game.update(dt);
  Game.render();
  Input.endFrame();
  requestAnimationFrame(frame);
}

Game.restart();
requestAnimationFrame(frame);
