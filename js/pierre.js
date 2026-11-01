// Pierre the mime (spec 5.1): walk, jump, punch, take hits.
class Pierre {
  constructor() {
    this.w = CONFIG.pierre.w;
    this.h = CONFIG.pierre.h;
    this.health = CONFIG.pierre.maxHealth;
    this.held = null;   // a melee item, e.g. { kind: 'hammer', swings: 10 }
    this.placeAtStart();
  }

  // Each panel starts with Pierre standing at its left side.
  placeAtStart() {
    this.x = CONFIG.pierre.startX;
    this.y = CONFIG.groundY;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.onGround = true;
    this.rising = false;        // jumping with Jump still held
    this.invincible = 0;        // seconds of flashing left after a hit
    this.knockLock = 0;         // seconds of knockback before control returns
    this.punchCooldown = 0;
    this.punchTimer = 0;        // seconds left in the swing animation
    this.strikeIn = 0;          // seconds until the current swing's hit lands
    this.swingTool = 'beret';   // what the current swing is with: 'beret' or 'hammer'
    this.walkPhase = 0;
  }

  get box() { return boxOf(this); }

  update(dt, game) {
    const c = CONFIG.pierre;
    this.invincible = Math.max(0, this.invincible - dt);
    this.knockLock -= dt;
    this.punchCooldown -= dt;
    this.punchTimer -= dt;
    if (this.strikeIn > 0 && (this.strikeIn -= dt) <= 0) this.strike(game);

    if (this.knockLock <= 0) {
      const dir = (Input.isDown(...KEYS.right) ? 1 : 0) - (Input.isDown(...KEYS.left) ? 1 : 0);
      this.vx = dir * c.speed;
      if (dir) this.facing = dir;
      if (this.onGround && Input.wasPressed(...KEYS.jump)) {
        this.vy = -c.jumpSpeed;
        this.onGround = false;
        this.rising = true;
      }
      if (Input.wasPressed(...KEYS.attack) && this.punchCooldown <= 0) this.punch(game);
    }
    // Letting go of Jump early gives a shorter hop.
    if (this.rising && (this.vy >= 0 || !Input.isDown(...KEYS.jump))) {
      if (this.vy < 0) this.vy *= c.jumpCut;
      this.rising = false;
    }

    const prevY = this.y;
    this.vy += CONFIG.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.onGround = !!landOn(this, prevY, game.surfaces);

    // The left edge is a wall; so is the right edge until the ink line goes.
    this.x = Math.max(this.w / 2, Math.min(game.rightLimit() - this.w / 2, this.x));

    if (this.onGround && this.vx !== 0) this.walkPhase += dt * 14;
  }

  get hasHammer() { return this.held && this.held.kind === 'hammer'; }

  // J: Pierre whips off his beret and slaps with it, or swings the
  // squeaky hammer if he's holding it. The hit lands partway through the
  // swing (strike).
  punch(game) {
    const c = CONFIG.pierre, hammer = this.hasHammer ? CONFIG.hammer : null;
    this.swingTool = hammer ? 'hammer' : 'beret';
    this.punchCooldown = hammer ? hammer.cooldown : c.punchCooldown;
    this.punchTimer = hammer ? hammer.show : c.punchShow;
    this.strikeIn = c.strikeDelay;
    if (hammer && --this.held.swings <= 0) {
      this.held = null;
      game.burst('CRACK!', this.x + this.facing * 50, this.y - 90, '#8d6e63');
    }
  }

  strike(game) {
    const c = CONFIG.pierre, hammer = this.swingTool === 'hammer' ? CONFIG.hammer : null;
    const range = hammer ? hammer.range : c.punchRange;
    const reach = {
      left: this.facing > 0 ? this.x : this.x - this.w / 2 - range,
      right: this.facing > 0 ? this.x + this.w / 2 + range : this.x,
      top: this.y - this.h + 8,
      bottom: this.y - 16,
    };
    for (const clown of game.clowns) {
      if (clown.active && boxesOverlap(reach, clown.box)) {
        const y = clown.y - clown.h * 0.6;
        if (hammer) {
          clown.hurt(hammer.damage, this.x, game, hammer.push);
          game.burst('SQUEAK!', clown.x - this.facing * clown.w / 4, y, '#1e88e5');
        } else {
          clown.hurt(c.punchDamage, this.x, game);
          game.burst('SLAP!', clown.x - this.facing * clown.w / 4, y);
        }
      }
    }
  }

  // Takes a hit from something at fromX. Ignored while flashing.
  hurt(damage, fromX) {
    if (this.invincible > 0 || this.health <= 0) return false;
    const c = CONFIG.pierre;
    this.health = Math.max(0, this.health - damage);
    this.invincible = c.invincible;
    this.knockLock = c.knockbackLock;
    this.vx = (this.x < fromX ? -1 : 1) * c.knockbackX;
    this.vy = -c.knockbackY;
    this.onGround = false;
    this.rising = false;
    return true;
  }

  heal(amount) {
    this.health = Math.min(CONFIG.pierre.maxHealth, this.health + amount);
  }

  // Black, white and grey only: striped shirt, white face and gloves,
  // black beret, mime makeup. Arms and legs are posed from joint positions.
  parts() {
    const shirt = { stripes: { color: '#1c1c1c', gap: 12, width: 5 } };
    const pants = '#3b3b3b';
    const walking = this.onGround && this.vx !== 0;
    const ph = this.walkPhase;
    const bob = walking ? Math.abs(Math.sin(ph)) * 3 : 0;
    const hurt = this.knockLock > 0;
    const lean = hurt ? -6 : 0;

    // Legs: [hip, knee, foot] for the back and front leg.
    let legs;
    if (!this.onGround) {
      legs = [[[-5, -46], [6, -28], [-2, -10]], [[6, -46], [22, -34], [16, -14]]];
    } else {
      legs = [0, Math.PI].map((off, i) => {
        const swing = walking ? Math.sin(ph + off) * 0.55 : (i ? 0.08 : -0.08);
        const hip = [i ? 6 : -5, -46];
        const knee = [hip[0] + Math.sin(swing) * 23, hip[1] + Math.cos(swing) * 23];
        const shin = swing - (walking ? Math.max(0, Math.sin(ph + off + 1.2)) * 0.5 : 0);
        return [hip, knee, [knee[0] + Math.sin(shin) * 23, knee[1] + Math.cos(shin) * 23]];
      });
    }
    // Arms: [shoulder, elbow, hand].
    let backArm, frontArm;
    if (hurt) {
      backArm = [[-4, -84], [-20, -98], [-26, -116]];
      frontArm = [[8, -84], [22, -100], [18, -118]];
    } else if (this.punchTimer > 0) {
      backArm = [[-4, -84], [-10, -68], [4, -74]];
      if (this.swingTool === 'hammer') {
        frontArm = [[8, -84], [30, -84], [52, -83]];
      } else {
        // The beret slap: the arm sweeps from up behind his head to out in front.
        const a = slapAngle(this.punchTimer);
        const elbow = [8 + Math.cos(a - 0.35) * 21, -84 + Math.sin(a - 0.35) * 21];
        frontArm = [[8, -84], elbow, [elbow[0] + Math.cos(a + 0.1) * 21, elbow[1] + Math.sin(a + 0.1) * 21]];
      }
    } else if (!this.onGround) {
      backArm = [[-4, -84], [-20, -92], [-24, -108]];
      frontArm = [[8, -84], [24, -94], [30, -110]];
    } else {
      const a = walking ? Math.sin(ph) * 0.5 : 0.1;
      const arm = (sx, ang) => {
        const elbow = [sx + Math.sin(ang) * 20, -84 + Math.cos(ang) * 20];
        return [[sx, -84], elbow, [elbow[0] + Math.sin(ang + 0.5) * 19, elbow[1] + Math.cos(ang + 0.5) * 19]];
      };
      backArm = arm(-4, a);
      frontArm = arm(8, -a);
    }
    const leg = ([hip, knee, foot]) => [
      limb(...hip, ...knee, 15, 13, pants),
      limb(...knee, ...foot, 13, 11, pants),
      { shape: 'circle', x: foot[0] + 6, y: foot[1] - 3, r: 11, ry: 5, fill: INK },
    ];
    const arm = ([sh, el, hand], glove) => [
      limb(...sh, ...el, 12, 11, '#fff', shirt),
      limb(...el, ...hand, 11, 10, '#fff', shirt),
      { shape: 'circle', x: hand[0], y: hand[1], r: glove, fill: '#fff' },
    ];
    const up = (parts) => parts.map(p => shiftPart(p, lean, -bob));
    // While slapping, the beret is in his hand and his bald head shows.
    const slapping = this.punchTimer > 0 && this.swingTool === 'beret' && !hurt;
    const beretOn = [
      { shape: 'circle', x: 1, y: -120, r: 18, ry: 6, fill: INK },
      { shape: 'circle', x: 1, y: -127, r: 3, fill: INK },
    ];
    const beretOff = [
      { shape: 'line', pts: [[-6, -118], [-3, -125]], lw: 2 },
      { shape: 'line', pts: [[0, -120], [2, -127]], lw: 2 },
      { shape: 'line', pts: [[6, -119], [9, -125]], lw: 2 },
    ];

    return up([
      ...arm(backArm, 7),
      ...leg(legs[0]),
      ...leg(legs[1]),
      { shape: 'poly', pts: [[-12, -54], [14, -54], [15, -40], [-13, -40]], fill: pants },
      { shape: 'poly', pts: [[-14, -90], [16, -90], [13, -50], [-11, -50]], fill: '#fff', ...shirt },
      { shape: 'circle', x: 3, y: -104, r: 16, ry: 17, fill: '#fff', shade: 0.1 },
      // Mime makeup: a high arched brow, a long painted eye, a black tear, dark lips.
      { shape: 'line', pts: [[2, -115], [8, -120], [14, -116]], lw: 3 },
      { shape: 'poly', pts: [[8, -114], [11, -108], [8, -100], [5, -108]], fill: INK, flat: true },
      { shape: 'circle', x: 9, y: -108, r: 1.5, fill: '#fff', flat: true },
      { shape: 'poly', pts: [[13, -100], [15, -96], [13, -93], [11, -96]], fill: INK, flat: true },
      { shape: 'poly', pts: [[6, -92], [17, -93], [12, -88]], fill: '#222', flat: true },
      ...(slapping ? beretOff : beretOn),
      ...arm(frontArm, this.punchTimer > 0 ? 9 : 7),
      ...(slapping ? beretInHand(frontArm[2], slapAngle(this.punchTimer)) : []),
      // The hammer: carried angled forward (clear of his face), swung out
      // level when attacking.
      ...(this.hasHammer
        ? (this.punchTimer > 0
          ? hammerParts(frontArm[2], [frontArm[2][0] + 40, frontArm[2][1]], 'flat')
          : hammerParts(frontArm[2], [frontArm[2][0] + 30, frontArm[2][1] - 30], 'up'))
        : []),
    ]);
  }

  render(ctx) {
    // Flash while invincible after a hit.
    if (this.invincible > 0 && Math.floor(this.invincible * 12) % 2 === 1) return;
    drawSketch(ctx, this.parts(), this.x, this.y, this.facing);
  }
}

// The angle of Pierre's arm during a beret slap, from up behind his head
// (start) to out in front (end), given the time left in the swing.
function slapAngle(timeLeft) {
  const t = 1 - Math.max(0, timeLeft) / CONFIG.pierre.punchShow;
  return -2.0 + Math.min(1, t * 1.4) * 2.15;
}

// The beret held flat-on at the end of the arm, with speed lines curving
// behind it.
function beretInHand([hx, hy], a) {
  const cx = hx + Math.cos(a) * 12, cy = hy + Math.sin(a) * 12;
  const rot = a + Math.PI / 2, pts = [];
  for (let i = 0; i < 16; i++) {
    const t = (i / 16) * Math.PI * 2;
    const ex = Math.cos(t) * 19, ey = Math.sin(t) * 6;
    pts.push([cx + ex * Math.cos(rot) - ey * Math.sin(rot), cy + ex * Math.sin(rot) + ey * Math.cos(rot)]);
  }
  const arc = r => {
    const out = [];
    for (let k = 0; k <= 6; k++) {
      const t = a - 1.1 + (k / 6) * 0.9;
      out.push([8 + Math.cos(t) * r, -84 + Math.sin(t) * r]);
    }
    return { shape: 'line', pts: out, lw: 2.5 };
  };
  return [arc(56), arc(66), { shape: 'poly', pts, fill: INK }];
}

// A copy of a part moved by (dx, dy).
function shiftPart(p, dx, dy) {
  if (!dx && !dy) return p;
  if (p.pts) return { ...p, pts: p.pts.map(([x, y]) => [x + dx, y + dy]) };
  return { ...p, x: p.x + dx, y: p.y + dy };
}
