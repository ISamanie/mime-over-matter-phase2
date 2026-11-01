// Pierre the mime (spec 5.1): walk, jump, punch, take hits.
class Pierre {
  constructor() {
    this.w = CONFIG.pierre.w;
    this.h = CONFIG.pierre.h;
    this.health = CONFIG.pierre.maxHealth;
    this.held = null;   // a melee item, e.g. { kind: 'hammer', swings: 10 }
    this.knives = 0;
    this.slinkies = 0;
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
    this.combo = 0;
    this.comboTime = 0;
    this.swingKind = 'slap';
    this.slipTimer = this.slipGrace = 0;
    this.slipDir = 1;
    this.knifeCooldown = 0;
    this.bubbleTime = 0;
    this.mimePose = 0;
    this.mimeKind = null;
    this.attackQueue = 0;
    this.attackBufferTime = 0;
  }

  get box() { return boxOf(this); }

  update(dt, game) {
    const c = CONFIG.pierre;
    this.invincible = Math.max(0, this.invincible - dt);
    this.knockLock -= dt;
    this.punchCooldown -= dt;
    this.punchTimer -= dt;
    this.comboTime -= dt;
    this.slipTimer -= dt;
    this.slipGrace -= dt;
    this.knifeCooldown -= dt;
    this.bubbleTime -= dt;
    this.mimePose = Math.max(0, this.mimePose - dt);
    this.attackBufferTime -= dt;
    if (this.attackBufferTime <= 0) this.attackQueue = 0;
    if (Input.wasPressed(...KEYS.attack) && this.knockLock <= 0) {
      this.bufferAttack();
    }
    if (this.held && this.held.kind === 'pogo' && (this.held.time -= dt) <= 0) this.held = null;
    if (this.strikeIn > 0 && (this.strikeIn -= dt) <= 0) this.strike(game);

    if (this.knockLock <= 0) {
      const dir = (Input.isDown(...KEYS.right) ? 1 : 0) - (Input.isDown(...KEYS.left) ? 1 : 0);
      this.vx = this.slipTimer > 0 ? this.slipDir * CONFIG.hazards.slipSpeed : dir * c.speed;
      if (dir) this.facing = dir;
      if (this.onGround && Input.wasPressed(...KEYS.jump)) {
        this.vy = -(this.held && this.held.kind === 'pogo' ? CONFIG.pogo.jumpSpeed : c.jumpSpeed);
        this.onGround = false;
        this.rising = true;
      }
      if (this.attackQueue > 0 && this.punchCooldown <= 0) {
        this.attackQueue--; this.punch(game);
      }
      if (Input.wasPressed(...KEYS.knife) && this.knifeCooldown <= 0 && this.knives > 0) {
        this.knives--;
        this.knifeCooldown = CONFIG.knives.cooldown;
        game.friendly.push(new Knife(this.x + this.facing * 24, this.y - 76, this.facing));
      }
      for (const power of ['wall', 'rope', 'box']) if (Input.wasPressed(...KEYS[power])) game.mime.use(power, game);
    }
    // Letting go of Jump early gives a shorter hop.
    if (this.rising && (this.vy >= 0 || !Input.isDown(...KEYS.jump))) {
      if (this.vy < 0) this.vy *= c.jumpCut;
      this.rising = false;
    }

    const prevY = this.y;
    this.vy += CONFIG.gravity * dt;
    const carry = game.hazards.reduce((n, h) => n + h.carry(this), 0);
    this.onGround = !!moveBody(this, dt, game, carry);
    if (this.held && this.held.kind === 'pogo' && this.vy >= 0) {
      const target = game.clowns.find(c => c.active && !c.dead && prevY <= c.y - c.h + 18 &&
        this.y >= c.y - c.h && Math.abs(this.x - c.x) < (this.w + c.w) / 2);
      if (target) {
        target.hurt(CONFIG.pogo.damage, this.x, game);
        game.burst('BOING!', target.x, target.y - target.h);
        this.y = target.y - target.h; this.vy = -CONFIG.pogo.bounceSpeed; this.onGround = false;
      }
    }
    if (this.onGround && this.held && this.held.kind==='pogo') {
      this.vy=-CONFIG.pogo.jumpSpeed; this.onGround=false; this.rising=false;
    }
    for (const hazard of game.hazards) hazard.apply(this, game);

    // The left edge is a wall; so is the right edge until the ink line goes.
    this.x = Math.max(this.w / 2, Math.min(game.rightLimit() - this.w / 2, this.x));

    if (this.onGround && this.vx !== 0) this.walkPhase += dt * 14;
  }

  get hasHammer() { return this.held && this.held.kind === 'hammer'; }

  bufferAttack() {
    this.attackQueue=Math.min(3,this.attackQueue+1);
    this.attackBufferTime=CONFIG.pierre.comboWindow;
  }

  // J: Pierre whips off his beret and slaps with it, or swings the
  // squeaky hammer if he's holding it. The hit lands partway through the
  // swing (strike).
  punch(game) {
    this.mimePose = 0;
    const c = CONFIG.pierre, hammer = this.hasHammer ? CONFIG.hammer : null;
    const sword = this.held && this.held.kind === 'balloonSword' ? CONFIG.balloonSword : null;
    if (this.held && this.held.kind === 'slinky') {
      if (this.slinkies > 0) {
        this.slinkies--;
        game.friendly.push(new Slinky(this.x, this.y, this.facing));
      }
      if (this.slinkies <= 0) this.held = null;
      this.punchCooldown = c.punchCooldown;
      return;
    }
    this.swingTool = hammer ? 'hammer' : sword ? 'balloonSword' : 'beret';
    this.swingKind = !this.onGround ? 'kick' : 'slap';
    if (!hammer && !sword && this.onGround) {
      this.combo = this.comboTime > 0 ? this.combo % 3 + 1 : 1;
      this.comboTime = c.comboWindow;
      if (this.combo === 3) this.swingKind = 'finisher';
    } else { this.combo = 0; this.comboTime = 0; }
    this.punchCooldown = hammer ? hammer.cooldown : sword ? sword.cooldown : c.punchCooldown;
    this.punchTimer = hammer ? hammer.show : c.punchShow;
    this.strikeIn = c.strikeDelay;
    if (hammer && --this.held.swings <= 0) {
      this.held = null;
      game.burst('CRACK!', this.x + this.facing * 50, this.y - 90, '#8d6e63');
    }
    if (sword && --this.held.swings <= 0) {
      this.held = null;
      game.burst('POP!', this.x + this.facing * 50, this.y - 90, '#ec407a');
      Sound.play('pop');
    }
  }

  strike(game) {
    const c = CONFIG.pierre, hammer = this.swingTool === 'hammer' ? CONFIG.hammer : null;
    const sword = this.swingTool === 'balloonSword' ? CONFIG.balloonSword : null;
    const kick = this.swingKind === 'kick', finisher = this.swingKind === 'finisher';
    const range = kick ? c.kickRange : hammer ? hammer.range : sword ? sword.range : c.punchRange;
    const reach = {
      left: this.facing > 0 ? this.x : this.x - this.w / 2 - range,
      right: this.facing > 0 ? this.x + this.w / 2 + range : this.x,
      top: kick ? this.y - 65 : this.y - this.h + 8,
      bottom: kick ? this.y + 24 : this.y - 16,
    };
    const targets = [...game.clowns, ...game.props.filter(p => p instanceof BalloonDog)];
    for (const clown of targets) {
      if (clown.active && !clown.dead && !clown.done && boxesOverlap(reach, clown.box)) {
        const y = clown.y - clown.h * 0.6;
        if (kick) {
          clown.hurt(c.kickDamage, this.x, game, 35);
          game.burst('KICK!', clown.x, y, '#ffd600');
        } else if (hammer) {
          clown.hurt(hammer.damage, this.x, game, hammer.push);
          game.burst('SQUEAK!', clown.x - this.facing * clown.w / 4, y, '#1e88e5');
        } else if (sword) {
          clown.hurt(sword.damage, this.x, game, 4);
          game.burst('POK!', clown.x, y, '#ec407a');
        } else {
          clown.hurt(finisher ? c.finisherDamage : c.punchDamage, this.x, game, finisher ? c.finisherPush : CONFIG.clowns.hitPush);
          game.burst('SLAP!', clown.x - this.facing * clown.w / 4, y);
        }
        game.hitFeel(finisher);
      }
    }
    if (hammer && !kick) game.rightHand.tryHit(reach, game);
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
    this.combo = 0; this.comboTime = 0;
    this.attackQueue = 0;
    this.bubbleTime = 1;
    this.mimePose = 0;
    if (damage > 0) { Game.burst('BONK!', this.x, this.y - 80, '#ffd600'); Game.hitFeel(false); }
    return true;
  }

  heal(amount) {
    this.health = Math.min(CONFIG.pierre.maxHealth, this.health + amount);
  }

  // Design D's angular silhouette, using the same brush and joint rig as
  // the rest of the comic: faceted face/gloves, tilted beret and wedge shoes.
  parts() {
    const shirt = { stripes: { color: '#1c1c1c', gap: 12, width: 5 } };
    const pants = '#3b3b3b';
    const walking = this.onGround && this.vx !== 0;
    const ph = this.walkPhase;
    const bob = walking ? Math.abs(Math.sin(ph)) * 3 : 0;
    const hurt = this.knockLock > 0;
    const lean = hurt ? -6 : 0;
    const gesture = !hurt && this.punchTimer <= 0 && this.mimePose > 0
      ? mimeGesture(this.mimeKind, 1-this.mimePose/CONFIG.mime.poseDuration) : null;

    // Legs: [hip, knee, foot] for the back and front leg.
    let legs;
    if (this.swingKind === 'kick' && this.punchTimer > 0) {
      legs = [[[-5,-46],[-14,-25],[-17,-9]], [[6,-46],[31,-27],[55,-10]]];
    } else if (!this.onGround) {
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
    } else if (gesture) {
      backArm = gesture.back;
      frontArm = gesture.front;
    } else if (this.punchTimer > 0) {
      backArm = [[-4, -84], [-10, -68], [4, -74]];
      if (this.swingTool === 'hammer') {
        frontArm = [[8, -84], [30, -84], [52, -83]];
      } else {
        // The beret slap: the arm sweeps from up behind his head to out in front.
        const a = slapAngle(this.punchTimer) + (this.combo === 2 ? -0.35 : this.swingKind === 'finisher' ? 0.35 : 0);
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
      pierreSegment(...hip, ...knee, 18, 13, pants),
      pierreSegment(...knee, ...foot, 13, 10, pants),
      { shape: 'poly', pts: [[foot[0]-7,foot[1]-9],[foot[0]+6,foot[1]-9],
        [foot[0]+20,foot[1]-1],[foot[0]+18,foot[1]+2],[foot[0]-9,foot[1]+2]], fill: INK },
    ];
    const arm = ([sh, el, hand], glove) => [
      pierreSegment(...sh, ...el, 12, 11, '#fff', shirt),
      pierreSegment(...el, ...hand, 11, 10, '#fff', shirt),
      ...(gesture && gesture.palms
        ? [{shape:'poly',pts:[[hand[0]-5,hand[1]+7],[hand[0]-6,hand[1]-8],
          [hand[0]-1,hand[1]-13],[hand[0]+5,hand[1]-11],[hand[0]+7,hand[1]+5]],fill:'#fff'},
          {shape:'line',pts:[[hand[0]+1,hand[1]-8],[hand[0]+2,hand[1]+2]],lw:1.5}]
        : [{shape:'poly',pts:[[-0.65,-1],[0.55,-1],[1,-0.25],[0.7,0.8],[-0.45,1],[-1,0.2]]
          .map(([x,y])=>[hand[0]+x*glove,hand[1]+y*glove]),fill:'#fff'}]),
    ];
    const up = (parts) => parts.map(p => shiftPart(p, lean, -bob));
    // While slapping, the beret is in his hand and his bald head shows.
    const slapping = this.punchTimer > 0 && this.swingTool === 'beret' && this.swingKind!=='kick' && !hurt;
    const beretOn = pierreBeret(0, -123, -0.32);

    return up([
      ...arm(backArm, 7),
      ...leg(legs[0]),
      ...leg(legs[1]),
      { shape: 'poly', pts: [[-12,-61],[11,-61],[18,-44],[10,-39],[-15,-42]], fill: pants },
      { shape: 'poly', pts: [[-12,-90],[15,-90],[9,-59],[-13,-59]], fill: '#fff', ...shirt },
      { shape: 'poly', pts: [[-6,-123],[11,-120],[20,-105],[11,-89],[-3,-91],[-14,-107]], fill: '#fff', shade: 0.1 },
      // Mime makeup: a high arched brow, a long painted eye, a black tear, dark lips.
      { shape: 'line', pts: [[2, -115], [8, -120], [14, -116]], lw: 3 },
      { shape: 'poly', pts: [[8, -114], [11, -108], [8, -100], [5, -108]], fill: INK, flat: true },
      { shape: 'circle', x: 9, y: -108, r: 1.5, fill: '#fff', flat: true },
      { shape: 'poly', pts: [[13, -100], [15, -96], [13, -93], [11, -96]], fill: INK, flat: true },
      { shape: 'line', pts: [[8,-94],[16,-94]], lw: 2.5 },
      ...(slapping ? [] : beretOn),
      ...arm(frontArm, this.punchTimer > 0 ? 9 : 7),
      ...(slapping ? beretInHand(frontArm[2], slapAngle(this.punchTimer)) : []),
      ...(this.held && this.held.kind === 'balloonSword' ? balloonSwordParts(frontArm[2]) : []),
      ...(this.held && this.held.kind === 'pogo' ? pogoParts(0, 0) : []),
      // The hammer: carried angled forward (clear of his face), swung out
      // level when attacking.
      ...(this.hasHammer
        ? (this.punchTimer > 0
          ? hammerParts(frontArm[2], [frontArm[2][0] + 40, frontArm[2][1]], 'flat')
          : hammerParts(frontArm[2], [frontArm[2][0] + 30, frontArm[2][1] - 30], 'up'))
        : []),
    ]).map(part=>{
      if (Game.state!=='end') return part;
      const points=partPoints(part);
      if (points.some(([,y])=>y>-45)) return part;
      // Bend from the waist; Pierre's feet stay planted for the silent bow.
      const a=Math.min(1,Game.endTime/1.4)*0.9;
      return {...part,shape:part.shape==='line'?'line':'poly',pts:points.map(([x,y])=>
        [x*Math.cos(a)-(y+45)*Math.sin(a),-45+x*Math.sin(a)+(y+45)*Math.cos(a)])};
    });
  }

  render(ctx) {
    // Flash while invincible after a hit.
    if (this.invincible > 0 && Math.floor(this.invincible * 12) % 2 === 1) return;
    drawSketch(ctx, this.parts(), this.x, this.y, this.facing);
    if (this.bubbleTime > 0) drawSpeechBubble(ctx, this.x, this.y - this.h - 25, '…');
  }
}

// Straight tapered costume pieces keep their angular silhouette as the
// existing shoulder/elbow/hip/knee joints move. Overlap hides joint gaps.
function pierreSegment(ax, ay, bx, by, w1, w2, fill, extra = {}) {
  const length = Math.hypot(bx-ax,by-ay) || 1;
  const ux=(bx-ax)/length, uy=(by-ay)/length, nx=-uy, ny=ux;
  return {shape:'poly',pts:[
    [ax-ux*2+nx*w1/2,ay-uy*2+ny*w1/2],
    [bx+ux*2+nx*w2/2,by+uy*2+ny*w2/2],
    [bx+ux*2-nx*w2/2,by+uy*2-ny*w2/2],
    [ax-ux*2-nx*w1/2,ay-uy*2-ny*w1/2],
  ],fill,...extra};
}

// One hat design for wearing and slapping, including its little stalk.
function pierreBeret(cx, cy, angle) {
  const turn = ([x,y]) => [cx+x*Math.cos(angle)-y*Math.sin(angle),cy+x*Math.sin(angle)+y*Math.cos(angle)];
  const rim = Array.from({length:16},(_,i)=>{
    const t=i/16*Math.PI*2;
    return turn([Math.cos(t)*19,Math.sin(t)*6]);
  });
  return [
    {shape:'poly',pts:[[-4,-5],[-5,-12],[-2,-13],[0,-5]].map(turn),fill:INK},
    {shape:'poly',pts:rim,fill:INK},
  ];
}

// Local joint poses: ease into a routine, perform it, then settle back.
// Purely visual; movement, hits and power cooldowns stay responsive.
function mimeGesture(kind, progress) {
  const t = Math.max(0, Math.min(1, progress));
  const smooth = v => {v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
  const weight = smooth(t/0.18)*smooth((1-t)/0.22);
  const rest = {back:[[-4,-84],[-2,-64],[8,-49]],front:[[8,-84],[10,-64],[20,-49]]};
  let back,front;
  if (kind === 'rope') {
    // Alternating fists reach forward and draw the rope into his chest.
    const pull = (phase, shoulder) => {
      const reach = (1+Math.cos(t*Math.PI*4+phase))/2;
      return [[shoulder,-84],[18+reach*12,-72],[19+reach*35,-81-reach*5]];
    };
    back=pull(Math.PI,-4);front=pull(0,8);
  } else if (kind === 'box') {
    // Both palms trace the top corners, sides, then bottom of the box.
    const trace = smooth((t-0.12)/0.65)*3;
    const spread = trace<1 ? trace : trace<2 ? 1 : 3-trace;
    const y = trace<1 ? -121 : trace<2 ? -121+(trace-1)*59 : -62;
    back=[[-4,-84],[12,-91],[27-spread*23,y]];
    front=[[8,-84],[29,-84],[27+spread*23,y]];
  } else {
    // Two flat palms meet the wall, with a small elastic recoil.
    const press = Math.sin(Math.max(0,t-0.18)*Math.PI*3)*2;
    back=[[-4,-84],[20,-101],[48+press,-108]];
    front=[[8,-84],[30,-66],[48+press,-70]];
  }
  const blend = (from,to) => from.map((joint,i)=>joint.map((v,j)=>v+(to[i][j]-v)*weight));
  return {back:blend(rest.back,back),front:blend(rest.front,front),palms:kind!=='rope'};
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
  const arc = r => {
    const out = [];
    for (let k = 0; k <= 6; k++) {
      const t = a - 1.1 + (k / 6) * 0.9;
      out.push([8 + Math.cos(t) * r, -84 + Math.sin(t) * r]);
    }
    return { shape: 'line', pts: out, lw: 2.5 };
  };
  return [arc(56), arc(66), ...pierreBeret(cx, cy, a + Math.PI / 2)];
}

// A copy of a part moved by (dx, dy).
function shiftPart(p, dx, dy) {
  if (!dx && !dy) return p;
  if (p.pts) return { ...p, pts: p.pts.map(([x, y]) => [x + dx, y + dy]) };
  return { ...p, x: p.x + dx, y: p.y + dy };
}
