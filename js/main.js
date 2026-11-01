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
  knife:['k'],pause:['p'],wall:['l'],rope:['u'],box:['i'],mute:['m'],
};
const keyName = e => (e.key.length === 1 ? e.key.toLowerCase() : e.key);
addEventListener('keydown', e => {
  Sound.unlock();
  const k = keyName(e);
  if (!Input.down.has(k)) Input.pressed.add(k);
  Input.down.add(k);
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault();
});
addEventListener('keyup', e => Input.down.delete(keyName(e)));
addEventListener('blur', () => Input.down.clear());
addEventListener('pointerdown',()=>Sound.unlock());

const Game = {
  state: 'play',   // 'play', 'pageTurn', 'gameover' or 'end'
  time: 0,

  restart() {
    this.pierre = new Pierre();
    this.rightHand = new Hand('right');
    this.leftHand = new Hand('left');
    this.sandwichCooldown = 0;
    this.mime = new MimePowers();
    this.dog = null;
    this.pictures = [];   // each panel as Pierre left it, for the page view
    this.state = 'play';
    this.loadPanel(0);
  },

  loadPanel(index) {
    if (this.leftHand && this.leftHand.busy &&
        ((this.leftHand.current && this.leftHand.current.thing.kind==='sandwich') ||
          this.leftHand.queue.some(q=>q.thing.kind==='sandwich'))) this.sandwichCooldown=0;
    this.state = 'play';
    this.panelIndex = index;
    this.panel = PANELS[index];
    this.isCrowded=!!this.panel.crowded || this.panel.clowns.some(c=>c.type==='clownCar');
    this.surfaces = surfacesOf(this.panel);
    this.hazards = (this.panel.hazards || []).map(h=>new Hazard(h,this.surfaces));
    this.mime.wall = this.mime.rope = null;
    this.friendly = [];
    this.freeze = this.shake = this.endTime = 0;
    this.lettering = null;
    this.clowns = [];
    this.items = [];
    this.pies = [];
    this.props = [];  // seltzer bursts, straight pins and poppable balloon dogs
    this.noses = [];
    this.effects = [];
    this.defeated = 0;
    this.totalClowns = this.panel.clowns.length;
    this.pierre.placeAtStart();
    if (this.dog) { this.dog.x=this.pierre.x;this.dog.y=this.pierre.y;this.dog.vy=0; }
    this.randomHelpIn = !this.panel.theEnd && !this.isCrowded && Math.random()<CONFIG.helper.chance
      ? CONFIG.helper.minDelay+Math.random()*(CONFIG.helper.maxDelay-CONFIG.helper.minDelay) : null;

    // The right hand draws this panel's clowns, one at a time, in order.
    this.leftHand.reset();
    this.rightHand.reset();
    for (const spec of this.panel.clowns) {
      this.rightHand.draw(makeClown(spec, this.surfaces), clown => this.clowns.push(clown));
    }
    if (this.panel.theEnd) {
      this.lettering = new EndLettering();
      this.rightHand.draw(this.lettering,()=>{});
      this.state = 'end';
    }
    // A crowded panel: the left hand draws the hammer at once. It draws
    // faster and starts sooner, so the hammer is ready before the first
    // clown (spec 5.5).
    if (this.isCrowded) {
      const spot = this.spotForItem();
      this.leftHand.draw(makeItem(this.panel.gift || 'hammer',spot.x,spot.y), item => this.items.push(item));
    }
  },

  solidWalls() { return [...(this.panel.walls || []), ...(this.mime.wall ? [this.mime.wall] : [])]; },

  hitFeel(finisher) {
    this.freeze=Math.max(this.freeze,finisher?CONFIG.combat.finisherFreeze:CONFIG.combat.freeze);
    if (finisher) this.shake=CONFIG.combat.shake;
  },

  randomHelp(dt) {
    if (this.randomHelpIn === null || this.panel.theEnd) return;
    this.randomHelpIn-=dt;
    if (this.randomHelpIn>0 || this.leftHand.busy || this.pierre.health<=CONFIG.sandwich.lowHealth) return;
    this.randomHelpIn=null;
    const kinds=['hammer','knives','balloonSword','pogo','slinky','invisibleDog'];
    const kind=Math.random()<0.65?'sandwich':kinds[Math.floor(Math.random()*kinds.length)];
    if (kind==='sandwich' && this.items.some(i=>i.kind==='sandwich')) return;
    const spot=this.spotForItem();
    this.leftHand.draw(makeItem(kind,spot.x,spot.y),item=>this.items.push(item));
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
      if (s.disabled) continue;
      for (let x = Math.max(s.x + 25, 40); x <= Math.min(s.x + s.w - 25, right); x += 30) {
        if ((this.panel.walls || []).some(w=>x+28>w.x&&x-28<w.x+w.w&&s.y>w.y&&s.y-56<w.y+w.h)) continue;
        if (this.hazards.some(h=>h.type==='trapdoor'&&Math.abs(h.y-s.y)<2&&x+28>h.x&&x-28<h.x+h.w)) continue;
        spots.push({ x, y: s.y });
      }
    }
    const clowns = [...this.clowns, ...this.rightHand.queue.map(q => q.thing)];
    const score = spot => {
      const fromClowns = Math.min(260, ...clowns.map(c => Math.hypot(c.x - spot.x, c.y - spot.y)));
      const fromPierre = Math.hypot(this.pierre.x - spot.x, this.pierre.y - spot.y);
      return fromClowns - 0.35 * fromPierre - (fromPierre < 80 ? 200 : 0);
    };
    return spots.length ? spots.reduce((best, spot) => (score(spot) > score(best) ? spot : best)) : {x:70,y:CONFIG.groundY};
  },

  clownDefeated() {
    this.defeated++;
    if (this.defeated>=this.totalClowns) {
      this.pies=[];
      for (const prop of this.props) prop.done=true;
    }
  },

  spawnClown(clown) {
    clown.active = true;
    clown.drawProgress = 1;
    this.totalClowns++;
    this.clowns.push(clown);
  },

  // The ink line goes once every clown in the panel is defeated.
  get gateOpen() {
    return !this.panel.theEnd && this.defeated >= this.totalClowns;
  },

  // How far right Pierre can go: the ink line, or off the edge once it's
  // gone. THE END panel's right edge is a plain wall.
  rightLimit() {
    if (this.panel.theEnd) return CONFIG.panel.w;
    return this.gateOpen ? Infinity : CONFIG.panel.w - CONFIG.gateWidth;
  },

  // A comic impact word ("POW!") at a spot in the panel.
  burst(text, x, y, color = '#e53935') {
    if (text==='SQUEAK!') Sound.play('squeak');
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
    if (Input.wasPressed(...KEYS.mute)) Sound.enabled=!Sound.enabled;
    if (this.state==='title') {
      if (Input.wasPressed('Enter')) this.restart();
      return;
    }
    if (Input.wasPressed(...KEYS.pause) && ['play','pageTurn','paused'].includes(this.state)) {
      if (this.state==='paused') this.state=this.beforePause;
      else {this.beforePause=this.state;this.state='paused';}
      return;
    }
    if (this.state==='paused') return;
    if ((this.state === 'gameover' || this.state === 'end') && Input.wasPressed(...KEYS.restart)) {
      this.restart();
      return;
    }
    if (this.state === 'gameover') return;   // freeze the panel under the stamp
    this.time += dt;
    if (this.state === 'pageTurn') {
      const c = CONFIG.pageTurn;
      this.turn.t += dt;
      if (this.turn.t >= c.zoomOut + c.hold + c.zoomIn) this.state = this.panel.theEnd ? 'end' : 'play';
      return;
    }
    if (this.state==='end') {
      this.endTime+=dt;this.rightHand.update(dt);
      Sound.update(dt,this.rightHand.state==='drawing');return;
    }
    this.shake=Math.max(0,this.shake-dt);
    if (this.freeze>0) {
      if (Input.wasPressed(...KEYS.attack) && this.pierre.knockLock<=0) this.pierre.bufferAttack();
      this.freeze=Math.max(0,this.freeze-dt);return;
    }
    this.mime.update(dt);
    for (const h of this.hazards) h.update(dt);

    this.pierre.update(dt, this);
    if (this.pierre.x - this.pierre.w / 2 > CONFIG.panel.w) {
      this.nextPanel();
      return;
    }
    this.rightHand.update(dt);
    this.leftHand.update(dt);
    this.helpIfLosing(dt);
    this.randomHelp(dt);
    for (const i of this.items) if (i.active) i.update(dt, this);
    this.items = this.items.filter(i => !i.taken);
    // Newly released minis begin acting next frame, after their entrance.
    for (const c of [...this.clowns]) if (c.active && !c.dead) c.update(dt, this);
    this.clowns = this.clowns.filter(c => !c.dead);
    for (const p of this.props) if (!p.done) p.update(dt, this);
    this.props = this.props.filter(p => !p.done);
    for (const p of this.pies) p.update(dt, this);
    this.pies = this.pies.filter(p => !p.done);
    for (const f of this.friendly) f.update(dt,this);
    this.friendly=this.friendly.filter(f=>!f.done);
    if (this.dog) {this.dog.update(dt,this);if(this.dog.done)this.dog=null;}
    for (const n of this.noses) n.update(dt, this);
    this.noses = this.noses.filter(n => !n.gone);
    for (const e of this.effects) e.t += dt;
    this.effects = this.effects.filter(e => e.t < CONFIG.burstTime);
    if (this.pierre.health <= 0) this.state = 'gameover';
    Sound.update(dt,this.rightHand.state==='drawing'||this.leftHand.state==='drawing');
  },

  render() {
    const { x, y, w, h } = CONFIG.panel;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    drawPaper(ctx);
    if (this.state==='title') {drawTitle(ctx);return;}

    if (this.state === 'pageTurn' || (this.state==='paused' && this.beforePause==='pageTurn')) {
      const zoom = drawPageTurn(ctx, this.turn, this.pictures);
      ctx.save();
      ctx.globalAlpha = zoom;   // the HUD fades out with the zoom
      drawHUD(ctx, this);
      ctx.restore();
      if (this.state==='paused') drawPause(ctx);
      return;
    }

    // Everything inside the panel is drawn in panel coordinates and clipped
    // to the panel.
    ctx.save();
    ctx.translate(x, y);
    if (this.shake>0) ctx.translate(Math.sin(this.time*140)*CONFIG.combat.shakePixels,Math.cos(this.time*110)*CONFIG.combat.shakePixels/2);
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.clip();
    this.drawPanelContents(ctx);
    ctx.restore();

    drawPanelFrame(ctx);

    // The hands reach in from outside the panel, over everything.
    ctx.save();
    ctx.translate(x, y);
    this.rightHand.render(ctx);
    this.leftHand.render(ctx);
    ctx.restore();
    drawHUD(ctx,this);
    if (this.state==='paused') drawPause(ctx);
  },

  // Everything inside the panel, in panel coordinates. Also used to
  // snapshot a panel for the page view.
  drawPanelContents(ctx) {
    drawPanelBackground(ctx, this.panel, this.panelIndex);
    drawSurfaces(ctx, this.panel.platforms);
    drawObstacles(ctx,this.panel.walls);
    for (const h of this.hazards) h.render(ctx);
    drawCaption(ctx, this.panel.caption);
    for (const c of this.clowns) if (c.active) drawShadow(ctx, this.surfaces, c.x, c.y, c.w);
    drawShadow(ctx, this.surfaces, this.pierre.x, this.pierre.y, this.pierre.w);
    if (this.panel.theEnd) drawTheEnd(ctx,this.lettering ? this.lettering.drawProgress : 0);
    else if (this.gateOpen) drawExitArrow(ctx, this.time);
    else drawGate(ctx);
    for (const i of this.items) i.render(ctx);
    for (const c of this.clowns) c.render(ctx);
    for (const p of this.pies) p.render(ctx);
    for (const p of this.props) if (!p.done) p.render(ctx);
    for (const f of this.friendly) f.render(ctx);
    if (this.dog) this.dog.render(ctx);
    this.mime.render(ctx);
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
Game.state='title';
requestAnimationFrame(frame);
