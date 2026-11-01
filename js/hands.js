// The cartoonist's two hands (spec 5.3 and 5.5). Both run the same code:
// the hand reaches in from above the panel, draws each thing in its queue
// with a DrawJob, one at a time, then leaves. The right hand holds an ink
// pen and draws clowns. The left hand holds a fat crayon, draws items a
// little faster, and wobbles.
class Hand {
  constructor(side) {
    this.side = side;   // 'right' or 'left'
    this.cfg = side === 'right' ? CONFIG.rightHand : CONFIG.leftHand;
    this.reset();
  }

  reset() {
    this.queue = [];
    this.job = null;
    this.state = 'away';  // 'away', 'waiting', 'moving', 'drawing' or 'leaving'
    this.tip = { x: 0, y: -400 };
    this.time = 0;
  }

  get busy() { return this.state !== 'away'; }

  // Queues a thing to draw. onStart runs when the pen first touches the
  // page, which is when the half-drawn thing appears in the panel.
  draw(thing, onStart) {
    this.queue.push({ thing, onStart });
    if (this.state === 'away') {
      const start = penPoint(thing.parts(), thing.x, thing.y, thing.facing, 0, 0);
      this.tip = { x: start.x + (this.side === 'right' ? 160 : -160), y: -CONFIG.panel.y - 260 };
      this.state = 'waiting';
      this.wait = this.cfg.enterDelay;
    }
  }

  update(dt) {
    this.time += dt;
    if (this.state === 'waiting') {
      this.wait -= dt;
      if (this.wait <= 0) this.state = 'moving';
    } else if (this.state === 'moving') {
      const next = this.queue[0].thing;
      const start = penPoint(next.parts(), next.x, next.y, next.facing, 0, 0);
      if (this.moveToward(start, dt)) {
        const { thing, onStart } = this.queue.shift();
        this.job = new DrawJob(thing, this.cfg.drawTime);
        onStart(thing);
        this.state = 'drawing';
      }
    } else if (this.state === 'drawing') {
      this.job.update(dt);
      this.tip = this.job.tip(this.time);
      if (this.job.done) {
        this.job = null;
        if (this.queue.length) {
          this.state = 'moving';
        } else {
          this.state = 'leaving';
          this.exit = { x: this.tip.x + (this.side === 'right' ? 200 : -200), y: -CONFIG.panel.y - 300 };
        }
      }
    } else if (this.state === 'leaving') {
      if (this.moveToward(this.exit, dt)) this.state = 'away';
    }
  }

  // Moves the pen tip toward a point; true once it's there.
  moveToward(target, dt) {
    const dx = target.x - this.tip.x, dy = target.y - this.tip.y;
    const d = Math.hypot(dx, dy), step = this.cfg.speed * dt;
    if (d <= step) {
      this.tip = { x: target.x, y: target.y };
      return true;
    }
    this.tip = { x: this.tip.x + (dx / d) * step, y: this.tip.y + (dy / d) * step };
    return false;
  }

  // Drawn in panel coordinates but not clipped to the panel: the hands
  // belong to the real world, outside the comic.
  render(ctx) {
    if (this.state === 'away') return;
    let { x, y } = this.tip;
    if (this.side === 'left') {
      const w = this.cfg.wobble;
      x += Math.sin(this.time * 11) * w;
      y += Math.cos(this.time * 8) * w * 0.6;
    }
    const topY = -(CONFIG.panel.y + y) - 20;
    drawSketch(ctx, handParts(this.side === 'right' ? 'pen' : 'crayon', topY), x, y,
      this.side === 'right' ? 1 : -1, 1, { lineWidth: 4.5 });
  }
}

// A big cartoon hand, as parts, with the tool's tip at (0, 0) and the hand
// up and to the right of it. The sleeve runs up to `topY` (the top of the
// screen).
function handParts(tool, topY) {
  const ang = -0.95;                       // the tool points down-left from the hand
  const c = Math.cos(ang), s = Math.sin(ang);
  const along = (u, v) => [u * c - v * s, u * s + v * c];   // tool axis -> local
  const poly = (pts, fill, extra) => ({ shape: 'poly', pts: pts.map(([u, v]) => along(u, v)), fill, ...extra });
  const blob = (u, v, r, fill) => { const [x, y] = along(u, v); return { shape: 'circle', x, y, r, fill }; };
  const box = (u, v, w, h) => [[u, v], [u + w, v], [u + w, v + h], [u, v + h]];
  const skin = '#f6c9a0';
  const [px, py] = along(158, -6);         // palm center

  const parts = [
    { shape: 'rect', x: px - 44, y: topY, w: 92, h: py - 46 - topY, fill: '#3949ab', stripes: { color: 'rgba(255,255,255,0.18)', gap: 26, width: 3 } },
    { shape: 'rect', x: px - 50, y: py - 72, w: 104, h: 32, fill: '#fff' },
    { shape: 'circle', x: px, y: py, r: 58, ry: 50, fill: skin },
  ];
  if (tool === 'pen') {
    parts.push(
      poly([[0, 0], [28, -8], [28, 8]], '#cfd8dc'),
      poly(box(28, -10, 132, 20), '#222'),
      poly(box(96, -10, 14, 20), '#9e9e9e', { flat: true }),
    );
  } else {
    parts.push(
      poly([[0, 0], [34, -16], [34, 16]], '#26a69a'),
      poly(box(34, -18, 116, 36), '#26a69a'),
      poly(box(66, -18, 54, 36), '#80cbc4', { stripes: { color: 'rgba(17,17,17,0.3)', gap: 9, width: 2 } }),
    );
  }
  parts.push(
    blob(92, -12, 17, skin),
    blob(112, -15, 18, skin),
    blob(132, -13, 17, skin),
    blob(104, 24, 16, skin),   // thumb
  );
  return parts;
}
