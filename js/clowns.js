// The clowns (spec 5.4) and the pies they throw. Each clown has one job:
// the Unicyclist rides back and forth and hurts on contact; the Pie Tosser
// stays put and lobs pies. Clowns are drawn by the right hand and do
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
  throw new Error(`Unknown clown type: ${spec.type}`);
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
