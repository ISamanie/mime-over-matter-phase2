// The clowns (spec 5.4) and their props. Each clown has one job.
// Clowns are drawn by the right hand and do
// nothing until `active` (see DrawJob in drawing.js).
//
// Any hit that doesn't defeat a clown may knock its red nose off. The
// clown panics, stops attacking and scrambles after the nose; if it gets
// there it puts the nose back on. If it can't reach it, it gives up after a
// while and carries on without it.
class Clown {
  constructor(spec, surfaces) {
    const cfg = CONFIG.clowns[spec.type];
    this.type = spec.type;
    this.w = cfg.w;
    this.h = cfg.h;
    this.health = cfg.health;
    // Platform n is surfaces[n + 1]; surfaces[0] is the ground.
    this.surface = spec.on === undefined ? surfaces[0] : surfaces[spec.on + 1];
    this.x = spec.x;
    this.y = this.surface.y;
    this.facing = -1;           // Pierre comes in from the left
    this.active = false;
    this.drawProgress = 0;
    this.dead = false;
    this.hitFlash = 0;
    this.stun = 0;
    this.anim = 0;
    this.nose = null;       // the Nose it's chasing, while it panics
    this.noseless = false;  // gave up on its nose
    this.bubble = null;     // { text, t }: a speech bubble
    this.greeted = false;
  }

  get panicking() { return !!this.nose; }

  say(text) {
    this.bubble = { text, t: CONFIG.clowns.bubbleTime };
  }

  get box() { return boxOf(this); }

  hurt(damage, fromX, game, push = CONFIG.clowns.hitPush) {
    if (!this.active || this.dead) return;
    const c = CONFIG.clowns;
    this.health -= damage;
    this.hitFlash = c.hitFlash;
    this.stun = c.hitStun;
    this.x += (this.x < fromX ? -1 : 1) * push;
    this.x = Math.max(this.surface.x + this.w / 2, Math.min(this.surface.x + this.surface.w - this.w / 2, this.x));
    if (this.health <= 0) {
      this.dead = true;
      if (this.nose) this.nose.gone = true;
      game.clownDefeated(this);
    } else if (!this.nose && !this.noseless && Math.random() < c.noseChance) {
      this.knockNose(game, fromX);
    }
  }

  // The nose pops off and bounces away from the hit.
  knockNose(game, fromX) {
    const part = this.parts().find(p => p.tag === 'nose');
    const n = CONFIG.nose, [lo, hi] = n.launchSide;
    const away = this.x < fromX ? -1 : 1;
    this.nose = new Nose(this.x + part.x * this.facing, this.y + part.y + n.r,
      away * (lo + Math.random() * (hi - lo)), -n.launchUp);
    this.panicTime = 0;
    game.noses.push(this.nose);
    game.burst('POP!', this.x + part.x * this.facing, this.y + part.y, '#e53935');
    this.say('MY NOSE!');
  }

  // Panicking: run to the nose if it has landed on this clown's own
  // surface, put it back on, and stop panicking.
  chaseNose(dt, game) {
    const n = this.nose, c = CONFIG.clowns;
    this.panicTime += dt;
    if (!this.bubble || this.bubble.t < 0.3) this.say('MY NOSE!');
    if (!n.resting) return;
    if (n.surface !== this.surface) {
      if (this.panicTime > c.noseGiveUp) {
        this.nose = null;
        this.noseless = true;
        this.say('GRR!');
      }
      return;
    }
    const half = this.w / 2, s = this.surface;
    const target = Math.max(s.x + half, Math.min(s.x + s.w - half, game.rightLimit() - half, n.x));
    const dx = target - this.x, step = c.chaseSpeed[this.type] * dt;
    this.facing = dx < 0 ? -1 : 1;
    if (this.wheel !== undefined) this.wheel += step / 24;
    if (Math.abs(dx) > step) {
      this.x += Math.sign(dx) * step;
    } else if (Math.abs(n.x - target) < 1) {
      this.x = target;
      n.gone = true;
      this.nose = null;
      this.say('HONK!');
    } else if (this.panicTime > c.noseGiveUp) {
      this.nose = null;      // the nose is past where this clown can go
      this.noseless = true;
      this.say('GRR!');
    }
  }

  // The parts to show: no nose while it's off.
  visibleParts() {
    const parts = this.parts();
    return this.nose || this.noseless ? parts.filter(p => p.tag !== 'nose') : parts;
  }

  update(dt, game) {
    if (!this.active || this.dead) return;
    this.anim += dt;
    this.hitFlash -= dt;
    this.stun -= dt;
    if (this.bubble && (this.bubble.t -= dt) <= 0) this.bubble = null;
    if (!this.greeted) {
      this.greeted = true;   // a shout as it comes to life (spec 5.3)
      const shouts = CONFIG.clowns.shouts;
      this.say(shouts[Math.floor(Math.random() * shouts.length)]);
    }
    if (this.stun > 0) return;
    if (this.nose) this.chaseNose(dt, game);
    else this.act(dt, game);
  }

  render(ctx) {
    ctx.save();
    if (this.hitFlash > 0 && Math.floor(this.hitFlash * 30) % 2 === 0) ctx.globalAlpha = 0.35;
    const shake = this.panicking ? Math.sin(this.anim * 45) * 2 : 0;
    drawSketch(ctx, this.visibleParts(), this.x + shake, this.y, this.facing,
      this.active ? 1 : this.drawProgress, { lineWidth: CONFIG.rightHand.lineWidth });
    ctx.restore();
    if (this.panicking) {
      // Sweat drops flying off its head.
      for (let i = 0; i < 3; i++) {
        const t = (this.anim * 2 + i / 3) % 1;
        const side = i - 1;
        const drop = [{ shape: 'poly', pts: [[0, -12], [5, -3], [0, 2], [-5, -3]], fill: '#81d4fa', flat: true }];
        drawSketch(ctx, drop, this.x + side * (22 + t * 24), this.y - this.h + 10 - t * 20 + t * t * 40, 1, 1, { lineWidth: 2 });
      }
    }
    if (this.bubble) drawSpeechBubble(ctx, this.x, this.y - this.h - 40, this.bubble.text);
  }
}

// Fragile and fast. Rides back and forth on its own surface, turning at
// walls and ledges, and hurts Pierre on contact.
class Unicyclist extends Clown {
  constructor(spec, surfaces) {
    super(spec, surfaces);
    this.wheel = 0;
  }

  act(dt, game) {
    const s = this.surface, half = this.w / 2;
    const minX = Math.max(s.x, 0) + half;
    const maxX = Math.min(s.x + s.w, game.rightLimit()) - half;
    this.x += this.facing * CONFIG.clowns.unicyclist.speed * dt;
    if (this.x <= minX) { this.x = minX; this.facing = 1; }
    if (this.x >= maxX) { this.x = maxX; this.facing = -1; }
    this.wheel += CONFIG.clowns.unicyclist.speed * dt / 24;
    if (boxesOverlap(this.box, game.pierre.box)) {
      game.pierre.hurt(CONFIG.clowns.unicyclist.contactDamage, this.x);
    }
  }

  // Polka-dot suit, ruffled collar, orange hair, pedaling a unicycle.
  parts() {
    const a = this.wheel;
    const wobble = Math.sin(this.anim * 6) * 4;
    const panic = this.panicking, flail = Math.sin(this.anim * 22) * 8;
    const suit = '#e53935';
    const pedal = k => [Math.cos(a + k) * 12, -24 + Math.sin(a + k) * 12];
    const leg = (hipX, k, fill) => {
      const foot = pedal(k), hip = [hipX, -72];
      const knee = [(hip[0] + foot[0]) / 2 + 12, (hip[1] + foot[1]) / 2 - 2];
      return [
        limb(...hip, ...knee, 15, 13, fill),
        limb(...knee, ...foot, 13, 11, fill),
        { shape: 'circle', x: foot[0] + 8, y: foot[1] + 2, r: 13, ry: 6, fill: '#ffd600' },
      ];
    };
    const arm = (sx, ex, hx, dy) => [
      limb(sx, -106, ex, -98 + dy, 12, 11, suit, { dots: { color: '#ffd600', r: 3, gap: 11 } }),
      limb(ex, -98 + dy, hx, -110 + dy, 11, 10, suit),
      { shape: 'circle', x: hx, y: -110 + dy, r: 7, fill: '#fff' },
    ];
    const ruff = [];
    for (let i = 0; i <= 12; i++) {
      const t = Math.PI * (1 + i / 12);
      const r = i % 2 ? 16 : 24;
      ruff.push([Math.cos(t) * r, -108 - Math.sin(t) * r * 0.35]);
    }
    return [
      ...arm(-16, -34, -46, panic ? -40 + flail : -wobble),
      ...leg(-4, Math.PI, '#1565c0'),
      { shape: 'circle', x: 0, y: -24, r: 24, fill: '#2b2b2b' },
      { shape: 'circle', x: 0, y: -24, r: 17, fill: '#ffd600' },
      { shape: 'line', pts: [[-Math.cos(a) * 16, -24 - Math.sin(a) * 16], [Math.cos(a) * 16, -24 + Math.sin(a) * 16]], lw: 3 },
      { shape: 'line', pts: [[Math.sin(a) * 16, -24 - Math.cos(a) * 16], [-Math.sin(a) * 16, -24 + Math.cos(a) * 16]], lw: 3 },
      { shape: 'circle', x: 0, y: -24, r: 4, fill: INK, flat: true },
      limb(0, -24, 0, -64, 7, 7, '#9e9e9e', { flat: true }),
      { shape: 'circle', x: 0, y: -66, r: 13, ry: 5, fill: '#e53935' },
      { shape: 'poly', pts: [[-21, -110], [21, -110], [25, -70], [-25, -70]], fill: suit, dots: { color: '#ffd600', r: 4, gap: 15 } },
      ...leg(5, 0, '#1976d2'),
      { shape: 'poly', pts: ruff, fill: '#fff' },
      { shape: 'circle', x: -17, y: -133, r: 10, fill: '#ff9800' },
      { shape: 'circle', x: 17, y: -133, r: 10, fill: '#ff9800' },
      { shape: 'circle', x: -10, y: -146, r: 9, fill: '#ff9800' },
      { shape: 'circle', x: 11, y: -146, r: 9, fill: '#ff9800' },
      { shape: 'circle', x: 0, y: -128, r: 17, ry: 18, fill: '#fff', shade: 0.1 },
      { shape: 'poly', pts: [[6, -141], [10, -134], [6, -127], [2, -134]], fill: '#42a5f5', flat: true },
      { shape: 'line', pts: [[6, -137], [6, -131]], lw: 3 },
      panic
        ? { shape: 'circle', x: 5, y: -116, r: 5, ry: 6, fill: '#5d0000', flat: true }
        : { shape: 'poly', pts: [[-6, -118], [6, -120], [16, -124], [12, -114], [0, -112]], fill: '#c62828', flat: true },
      { shape: 'circle', x: 14, y: -127, r: 7, fill: '#e53935', tag: 'nose' },
      { shape: 'poly', pts: [[-9, -149], [9, -149], [3, -172]], fill: '#43a047' },
      { shape: 'circle', x: 3, y: -173, r: 4, fill: '#fff', flat: true },
      ...arm(14, 34, 48, panic ? -40 - flail : wobble),
    ];
  }
}

// Sturdier, and stays put. Every few seconds it lobs a pie in an arc at
// Pierre.
class PieTosser extends Clown {
  constructor(spec, surfaces) {
    super(spec, surfaces);
    this.throwTimer = CONFIG.clowns.pieTosser.firstThrow;
  }

  act(dt, game) {
    const cfg = CONFIG.clowns.pieTosser;
    this.facing = game.pierre.x < this.x ? -1 : 1;
    this.throwTimer -= dt;
    if (this.throwTimer <= 0) {
      this.throwPie(game);
      this.throwTimer = cfg.throwEvery;
    }
  }

  // Aims so the pie comes down where Pierre is standing now. Longer throws
  // fly longer, so the arc stays readable.
  throwPie(game) {
    const c = CONFIG.pie;
    const fromX = this.x + this.facing * 42, fromY = this.y - 144;
    const toX = game.pierre.x, toY = game.pierre.y - 50;
    const flight = Math.max(c.minFlight, Math.min(c.maxFlight, Math.abs(toX - fromX) * c.flightPerPixel));
    const vx = (toX - fromX) / flight;
    const vy = (toY - fromY - 0.5 * c.gravity * flight * flight) / flight;
    game.pies.push(new Pie(fromX, fromY, vx, vy));
  }

  // A round clown in a bowler hat with a pie at the ready.
  parts() {
    const cfg = CONFIG.clowns.pieTosser;
    const windup = this.active && this.throwTimer < cfg.windup;
    const reloaded = !this.active || this.throwTimer < cfg.throwEvery - 0.4;
    const sleeve = '#43a047', pants = '#7e57c2';
    const panic = this.panicking, flail = Math.sin(this.anim * 22) * 8;
    const glove = (x, y) => ({ shape: 'circle', x, y, r: 8, fill: '#fff' });
    const backArm = panic
      ? [limb(-22, -96, -40, -114, 13, 12, sleeve), limb(-40, -114, -36, -136 + flail, 12, 11, sleeve), glove(-36, -138 + flail)]
      : [limb(-22, -96, -38, -76, 13, 12, sleeve), limb(-38, -76, -32, -56, 12, 11, sleeve), glove(-32, -54)];
    const parts = [
      ...backArm,
      limb(-11, -50, -15, -12, 18, 15, pants),
      limb(11, -50, 17, -12, 18, 15, pants),
      { shape: 'circle', x: -18, y: -7, r: 19, ry: 8, fill: '#e53935' },
      { shape: 'circle', x: 21, y: -7, r: 19, ry: 8, fill: '#e53935' },
      { shape: 'circle', x: 0, y: -74, r: 31, ry: 32, fill: sleeve, dots: { color: '#ffeb3b', r: 4, gap: 14 } },
      { shape: 'poly', pts: [[-12, -108], [0, -102], [-12, -96]], fill: '#e53935' },
      { shape: 'poly', pts: [[12, -108], [0, -102], [12, -96]], fill: '#e53935' },
      { shape: 'circle', x: -20, y: -124, r: 11, fill: '#1e88e5' },
      { shape: 'circle', x: 20, y: -124, r: 11, fill: '#1e88e5' },
      { shape: 'circle', x: 0, y: -122, r: 18, ry: 19, fill: '#fff', shade: 0.1 },
      { shape: 'poly', pts: [[7, -135], [11, -128], [7, -121], [3, -128]], fill: '#ab47bc', flat: true },
      { shape: 'line', pts: [[7, -131], [7, -125]], lw: 3 },
      panic
        ? { shape: 'circle', x: 5, y: -109, r: 5, ry: 6, fill: '#5d0000', flat: true }
        : { shape: 'poly', pts: [[-4, -112], [14, -114], [10, -106], [0, -106]], fill: '#c62828', flat: true },
      { shape: 'circle', x: 15, y: -121, r: 7, fill: '#e53935', tag: 'nose' },
      { shape: 'circle', x: 0, y: -141, r: 13, ry: 11, fill: '#424242' },
      { shape: 'rect', x: -21, y: -138, w: 42, h: 5, fill: '#424242', flat: true },
    ];
    if (panic) {
      parts.push(limb(22, -96, 40, -114, 13, 12, sleeve), limb(40, -114, 36, -136 - flail, 12, 11, sleeve), glove(36, -138 - flail));
    } else if (windup) {
      parts.push(limb(22, -96, 36, -114, 13, 12, sleeve), limb(36, -114, 40, -134, 12, 11, sleeve));
      parts.push(...pieParts(42, -144), glove(40, -134));
    } else {
      parts.push(limb(22, -96, 36, -80, 13, 12, sleeve), limb(36, -80, 48, -86, 12, 11, sleeve));
      if (reloaded) parts.push(...pieParts(54, -94));
      parts.push(glove(48, -86));
    }
    return parts;
  }
}

function makeClown(spec, surfaces) {
  if (spec.type === 'unicyclist') return new Unicyclist(spec, surfaces);
  if (spec.type === 'pieTosser') return new PieTosser(spec, surfaces);
  if (spec.type === 'seltzerSpritzer') return new SeltzerSpritzer(spec, surfaces);
  if (spec.type === 'juggler') return new Juggler(spec, surfaces);
  if (spec.type === 'balloonTwister') return new BalloonTwister(spec, surfaces);
  if (spec.type === 'clownCar') return new ClownCar(spec, surfaces);
  throw new Error(`Unknown clown type: ${spec.type}`);
}

// Walking enemies stay on their own riser and inside the ink line.
function walkClown(clown, dir, speed, dt, game) {
  const s = clown.surface, half = clown.w / 2;
  clown.x = Math.max(s.x + half, Math.min(s.x + s.w - half,
    game.rightLimit() - half, clown.x + dir * speed * dt));
}

// Shared posable costume; the prop and silhouette distinguish each act.
function performerParts(clown, suit, hair, hands = [[-37, -73], [40, -79]]) {
  const stride = Math.sin(clown.anim * 9) * 6;
  if (clown.panicking) hands = [[-38, -135 + stride], [38, -135 - stride]];
  const parts = [];
  for (const side of [-1, 1]) {
    parts.push(limb(side * 11, -48, side * 16 + stride * side, -12, 18, 13, '#1565c0'));
    parts.push({ shape: 'circle', x: side * 20 + stride * side, y: -7, r: 18, ry: 7, fill: '#ffd600' });
  }
  parts.push({ shape: 'poly', pts: [[-22, -105], [22, -105], [28, -47], [-28, -47]], fill: suit,
    dots: { color: '#fff176', r: 3, gap: 13 } });
  hands.forEach(([x, y], i) => {
    const sx = i ? 20 : -20;
    parts.push(limb(sx, -96, x * 0.8, y + 10, 13, 11, suit),
      limb(x * 0.8, y + 10, x, y, 11, 9, suit),
      { shape: 'circle', x, y, r: 7, fill: '#fff' });
  });
  parts.push(
    { shape: 'poly', pts: [[-25, -106], [0, -96], [25, -106], [0, -113]], fill: '#fff' },
    { shape: 'circle', x: -19, y: -126, r: 11, fill: hair },
    { shape: 'circle', x: 19, y: -126, r: 11, fill: hair },
    { shape: 'circle', x: 0, y: -124, r: 18, ry: 20, fill: '#fff', shade: 0.1 },
    { shape: 'poly', pts: [[4, -137], [10, -130], [4, -123], [0, -130]], fill: '#42a5f5', flat: true },
    { shape: 'line', pts: [[5, -133], [5, -127]], lw: 3 },
    clown.panicking
      ? { shape: 'circle', x: 5, y: -111, r: 5, ry: 6, fill: '#5d0000' }
      : { shape: 'poly', pts: [[-7, -116], [13, -116], [7, -107], [-2, -107]], fill: '#e53935' },
    { shape: 'circle', x: 15, y: -123, r: 7, fill: '#e53935', tag: 'nose' });
  return parts;
}

class SeltzerSpritzer extends Clown {
  constructor(spec, surfaces) {
    super(spec, surfaces);
    this.sprayTimer = CONFIG.clowns.seltzerSpritzer.windup;
  }

  act(dt, game) {
    const c = CONFIG.clowns.seltzerSpritzer, p = game.pierre;
    this.facing = p.x < this.x ? -1 : 1;
    const close = Math.abs(p.x - this.x) <= c.range && p.box.bottom > this.y - 102 && p.box.top < this.y - 54;
    if (!close) {
      walkClown(this, this.facing, c.speed, dt, game);
      this.sprayTimer = Math.max(c.windup, this.sprayTimer - dt);
    } else if ((this.sprayTimer -= dt) <= 0) {
      game.props.push(new SeltzerSpray(this.x + this.facing * 30, this.y - 54, this.facing));
      this.say('PSSSH!');
      this.sprayTimer = c.sprayEvery;
    }
  }

  parts() {
    return [...performerParts(this, '#1e88e5', '#ff9800'),
      { shape: 'circle', x: 39, y: -64, r: 13, ry: 20, fill: '#81d4fa' },
      { shape: 'rect', x: 34, y: -91, w: 10, h: 12, fill: '#ffd600' },
      { shape: 'line', pts: [[38, -91], [55, -91], [55, -84]], lw: 5 }];
  }
}

// A visible short burst, with at most one push and no health damage.
class SeltzerSpray {
  constructor(x, y, facing) {
    Object.assign(this, { x, y, facing, t: 0, hit: false, done: false });
  }
  update(dt, game) {
    if (this.done) return;
    const c = CONFIG.seltzer;
    this.t += dt;
    if (this.t >= c.duration) { this.done = true; return; }
    const reach = { left: this.facing > 0 ? this.x : this.x - c.w,
      right: this.facing > 0 ? this.x + c.w : this.x, top: this.y - c.h, bottom: this.y };
    const p = game.pierre;
    if (!this.hit && boxesOverlap(reach, p.box) && p.hurt(0, this.x - this.facing * 100)) {
      this.hit = true;
      p.vx = this.facing * c.push;
      p.vy = -c.lift;
    }
  }
  render(ctx) {
    const c = CONFIG.seltzer;
    const parts = Array.from({ length: 12 }, (_, i) => {
      const f = ((i / 12 + this.t * 2) % 1);
      return { shape: 'circle', x: f * c.w, y: -c.h / 2 + Math.sin(i * 7) * f * c.h / 2,
        r: 2 + f * 3, fill: '#81d4fa', flat: true };
    });
    drawSketch(ctx, parts, this.x, this.y, this.facing, 1, { lineWidth: 2 });
  }
}

class Juggler extends Clown {
  constructor(spec, surfaces) {
    super(spec, surfaces);
    this.throwTimer = CONFIG.clowns.juggler.windup;
  }
  act(dt, game) {
    const c = CONFIG.clowns.juggler, p = game.pierre;
    this.facing = p.x < this.x ? -1 : 1;
    this.throwTimer = Math.max(0, this.throwTimer - dt);
    if (Math.hypot(p.x - this.x, p.y - this.y) > c.range) {
      this.throwTimer = Math.max(c.windup, this.throwTimer);
    } else if (this.throwTimer <= 0) {
      const x = this.x + this.facing * 38, y = this.y - 85;
      const dx = p.x - x, dy = p.y - p.h / 2 - y;
      const length = Math.hypot(dx, dy) || 1;
      game.props.push(new BowlingPin(x, y, dx / length * CONFIG.pin.speed, dy / length * CONFIG.pin.speed));
      this.throwTimer = c.throwEvery;
    }
  }
  parts() {
    const parts = performerParts(this, '#ab47bc', '#43a047', [[-38, -105], [38, -105]]);
    if (!this.panicking) for (let i = 0; i < 3; i++) {
      const a = this.anim * 3 + i * Math.PI * 2 / 3;
      parts.push(...pinParts(Math.cos(a) * 48, -155 - Math.sin(a) * 32));
    }
    return parts;
  }
}

function pinParts(x, y) {
  return [
    { shape: 'poly', pts: [[x - 5, y - 13], [x + 5, y - 13], [x + 3, y - 5], [x + 9, y + 8], [x + 7, y + 14], [x - 7, y + 14], [x - 9, y + 8], [x - 3, y - 5]], fill: '#fff' },
    { shape: 'line', pts: [[x - 4, y - 5], [x + 4, y - 5]], lw: 4, stroke: '#e53935' },
  ];
}

// Straight flight: no pie gravity. Segment sweep prevents fast pins from
// skipping Pierre or a platform, including hits against platform sides.
function segmentBoxTime(x, y, dx, dy, box) {
  let enter = 0, exit = 1;
  for (const [pos, delta, lo, hi] of [[x, dx, box.left, box.right], [y, dy, box.top, box.bottom]]) {
    if (delta === 0) { if (pos < lo || pos > hi) return Infinity; }
    else {
      const a = (lo - pos) / delta, b = (hi - pos) / delta;
      enter = Math.max(enter, Math.min(a, b));
      exit = Math.min(exit, Math.max(a, b));
      if (enter > exit) return Infinity;
    }
  }
  return enter;
}

class BowlingPin {
  constructor(x, y, vx, vy) {
    Object.assign(this, { x, y, vx, vy, w: CONFIG.pin.w, h: CONFIG.pin.h, t: 0, done: false });
  }
  update(dt, game) {
    if (this.done) return;
    this.t += dt;
    const dx = this.vx * dt, dy = this.vy * dt, half = this.w / 2;
    const expanded = b => ({ left: b.left - half, right: b.right + half, top: b.top, bottom: b.bottom + this.h });
    const hitPierre = segmentBoxTime(this.x, this.y, dx, dy, expanded(game.pierre.box));
    let hitSet = Infinity;
    for (const s of game.surfaces) {
      hitSet = Math.min(hitSet, segmentBoxTime(this.x, this.y, dx, dy,
        expanded({ left: s.x, right: s.x + s.w, top: s.y, bottom: s.y + (s.ground ? CONFIG.panel.h : 14) })));
    }
    const hit = Math.min(hitPierre, hitSet);
    this.x += dx * Math.min(1, hit);
    this.y += dy * Math.min(1, hit);
    if (hit !== Infinity) {
      if (hitPierre < hitSet) game.pierre.hurt(CONFIG.pin.damage, this.x - Math.sign(this.vx) * 100);
      game.burst('BONK!', this.x, this.y, '#ffd600');
      this.done = true;
    }
    if (this.t >= CONFIG.pin.life || this.x < -50 || this.x > CONFIG.panel.w + 50 || this.y < -50 || this.y > CONFIG.panel.h) this.done = true;
  }
  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y - this.h / 2);
    ctx.rotate(this.t * 12);
    drawSketch(ctx, pinParts(0, 0), 0, 0, 1);
    ctx.restore();
  }
}

class BalloonTwister extends Clown {
  constructor(spec, surfaces) {
    super(spec, surfaces);
    this.twistTimer = CONFIG.clowns.balloonTwister.firstTwist;
  }
  act(dt, game) {
    const c = CONFIG.clowns.balloonTwister, p = game.pierre;
    this.facing = p.x < this.x ? -1 : 1;
    if (Math.abs(p.x - this.x) < c.standOff) walkClown(this, -this.facing, c.speed, dt, game);
    this.twistTimer -= dt;
    const dogs = game.props.filter(p => p instanceof BalloonDog && p.owner === this && !p.done);
    if (this.twistTimer <= 0 && dogs.length < c.maxDogs) {
      game.props.push(new BalloonDog(this.x, this.y, this));
      this.twistTimer = c.twistEvery;
    }
  }
  parts() {
    return [...performerParts(this, '#ffd600', '#e53935', [[-15, -80], [27, -80]]),
      ...balloonDogParts(20, -86, '#ec407a')];
  }
}

function balloonDogParts(x = 0, y = 0, color = '#ec407a') {
  const balloon = (px, py, r, ry) => ({ shape: 'circle', x: x + px, y: y + py, r, ry, fill: color, shade: 0.15 });
  return [balloon(-18, -20, 12, 5), balloon(-12, -9, 5, 11), balloon(12, -9, 5, 11),
    balloon(0, -22, 17, 7), balloon(15, -30, 7, 12), balloon(11, -41, 4, 8),
    balloon(21, -33, 10, 5), { shape: 'circle', x: x + 19, y: y - 35, r: 2, fill: INK, flat: true }];
}

class BalloonDog {
  constructor(x, y, owner) {
    Object.assign(this, { x, y, owner, w: CONFIG.balloonDog.w, h: CONFIG.balloonDog.h,
      vy: 0, facing: -1, t: 0, active: true, done: false });
  }
  get box() { return boxOf(this); }
  hurt(damage, fromX, game) {
    if (this.done || damage <= 0) return;
    this.done = true;
    game.burst('POP!', this.x, this.y - 24, '#ec407a');
  }
  update(dt, game) {
    if (this.done) return;
    const c = CONFIG.balloonDog, p = game.pierre;
    this.t += dt;
    if (this.t >= c.life) { this.hurt(1, this.x, game); return; }
    this.facing = p.x < this.x ? -1 : 1;
    this.x += this.facing * Math.min(Math.abs(p.x - this.x), c.speed * dt);
    const prevY = this.y;
    this.vy += CONFIG.gravity * dt;
    this.y += this.vy * dt;
    landOn(this, prevY, game.surfaces);
    this.x = Math.max(this.w / 2, Math.min(game.rightLimit() - this.w / 2, this.x));
    if (boxesOverlap(this.box, p.box)) {
      p.hurt(c.damage, this.x);
      this.hurt(1, p.x, game);
    }
  }
  render(ctx) {
    drawSketch(ctx, balloonDogParts(0, Math.sin(this.t * 16) * 2), this.x, this.y, this.facing, 1, { lineWidth: 3 });
  }
}

class ClownCar extends Clown {
  constructor(spec, surfaces) {
    super(spec, surfaces);
    this.releaseTimer = CONFIG.clowns.clownCar.firstRelease;
  }
  act(dt, game) {
    const c = CONFIG.clowns.clownCar;
    this.releaseTimer -= dt;
    const minis = game.clowns.filter(m => m.owner === this && !m.dead);
    if (this.releaseTimer <= 0 && minis.length < c.maxMinis) {
      const mini = new MiniClown({ type: 'miniClown', x: this.x }, game.surfaces);
      mini.surface = this.surface;
      mini.y = this.y;
      mini.facing = game.pierre.x < this.x ? -1 : 1;
      mini.x += mini.facing * (this.w / 2 + mini.w / 2);
      walkClown(mini, 0, 0, 0, game);
      mini.owner = this;
      // These emerge fully drawn from the finished car; no second hand job.
      game.spawnClown(mini);
      this.say('BEEP BEEP!');
      this.releaseTimer = c.releaseEvery;
    }
  }
  parts() {
    return [
      { shape: 'circle', x: 0, y: -73, r: 21, fill: '#fff' },
      { shape: 'circle', x: -20, y: -80, r: 10, fill: '#ff9800' },
      { shape: 'circle', x: 18, y: -80, r: 10, fill: '#ff9800' },
      { shape: 'line', pts: [[-2, -79], [5, -79]], lw: 3 },
      { shape: 'circle', x: 13, y: -69, r: 7, fill: '#e53935', tag: 'nose' },
      { shape: 'poly', pts: [[-53, -47], [-32, -53], [-25, -66], [29, -66], [39, -48], [53, -41], [53, -15], [-53, -15]], fill: '#e53935', dots: { color: '#ffd600', r: 4, gap: 18 } },
      { shape: 'rect', x: -20, y: -62, w: 44, h: 19, fill: '#81d4fa' },
      { shape: 'circle', x: -33, y: -17, r: 17, fill: INK },
      { shape: 'circle', x: 33, y: -17, r: 17, fill: INK },
      { shape: 'circle', x: -33, y: -17, r: 8, fill: '#ffd600' },
      { shape: 'circle', x: 33, y: -17, r: 8, fill: '#ffd600' },
      { shape: 'circle', x: 48, y: -37, r: 7, fill: '#fff176' },
    ];
  }
}

class MiniClown extends Clown {
  act(dt, game) {
    const c = CONFIG.clowns.miniClown;
    this.facing = game.pierre.x < this.x ? -1 : 1;
    walkClown(this, this.facing, c.speed, dt, game);
    if (boxesOverlap(this.box, game.pierre.box)) game.pierre.hurt(c.contactDamage, this.x);
  }
  parts() {
    return performerParts(this, '#43a047', '#ab47bc').map(p => {
      const part = { ...p };
      if (part.pts) part.pts = part.pts.map(([x, y]) => [x * 0.5, y * 0.5]);
      for (const key of ['x', 'y', 'r', 'ry', 'w', 'h', 'lw']) if (part[key] !== undefined) part[key] *= 0.5;
      return part;
    });
  }
}

// A cream pie in a tin, centered at (x, y).
function pieParts(x, y) {
  return [
    { shape: 'circle', x, y: y + 3, r: 17, ry: 6, fill: '#c68642' },
    { shape: 'circle', x, y: y - 3, r: 14, ry: 7, fill: '#fff8e1' },
    { shape: 'circle', x: x + 3, y: y - 9, r: 4, fill: '#e53935', flat: true },
  ];
}

// A clown's red rubber nose, knocked off. It bounces until it comes to
// rest on a surface; its clown may come and get it (`gone` once it does).
class Nose {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.w = this.h = CONFIG.nose.r * 2;
    this.resting = false;
    this.surface = null;
    this.gone = false;
    this.spin = 0;
  }

  update(dt, game) {
    if (this.resting) return;
    const prevY = this.y, fallSpeed = this.vy + CONFIG.gravity * dt;
    this.vy = fallSpeed;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.spin += this.vx * dt / CONFIG.nose.r;
    const r = CONFIG.nose.r, right = Math.min(CONFIG.panel.w, game.rightLimit()) - r;
    if (this.x < r || this.x > right) {
      this.x = Math.max(r, Math.min(right, this.x));
      this.vx = -this.vx * 0.6;
    }
    const s = landOn(this, prevY, game.surfaces);
    if (s) {
      if (fallSpeed > 220) {
        this.vy = -fallSpeed * CONFIG.nose.bounce;
        this.vx *= 0.7;
      } else {
        this.resting = true;
        this.surface = s;
      }
    }
  }

  render(ctx) {
    const r = CONFIG.nose.r;
    drawSketch(ctx, [{ shape: 'circle', x: 0, y: -r, r, fill: '#e53935' }], this.x, this.y, 1, 1, { lineWidth: 3 });
  }
}

// A pie in flight. It splats on whatever it hits: Pierre, a platform, the
// ground.
class Pie {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.w = CONFIG.pie.w;
    this.h = CONFIG.pie.h;
    this.splatT = -1;    // seconds since it splatted; -1 while flying
    this.done = false;
  }

  get box() { return boxOf(this); }

  update(dt, game) {
    if (this.splatT >= 0) {
      this.splatT += dt;
      if (this.splatT > CONFIG.pie.splatTime) this.done = true;
      return;
    }
    const prevY = this.y;
    this.vy += CONFIG.pie.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (boxesOverlap(this.box, game.pierre.box)) {
      game.pierre.hurt(CONFIG.pie.damage, this.x - Math.sign(this.vx) * 100);
      this.splatT = 0;
    } else if (landOn(this, prevY, game.surfaces)) {
      this.splatT = 0;
    } else if (this.x < -50 || this.x > CONFIG.panel.w + 50 || this.y > CONFIG.panel.h + 50) {
      this.done = true;
    }
  }

  render(ctx) {
    if (this.splatT < 0) {
      drawSketch(ctx, pieParts(0, -7), this.x, this.y, 1);
      return;
    }
    // A cream splat that fades away.
    ctx.save();
    ctx.globalAlpha = 1 - this.splatT / CONFIG.pie.splatTime;
    ctx.beginPath();
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const r = i % 2 ? 13 : 26;
      ctx.lineTo(this.x + Math.cos(a) * r * 1.4, this.y - 8 + Math.sin(a) * r * 0.7);
    }
    ctx.closePath();
    ctx.fillStyle = '#fff8e1';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.restore();
  }
}
