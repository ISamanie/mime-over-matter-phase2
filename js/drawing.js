// Characters and items are lists of simple "parts" in local coordinates,
// with (0, 0) at the feet and +x the way the thing is facing:
//
//   { shape: 'rect', x, y, w, h, fill }
//   { shape: 'circle', x, y, r, ry, fill }   ry is optional (an ellipse)
//   { shape: 'poly', pts: [[x, y], ...], fill }
//   { shape: 'line', pts: [[x, y], ...], lw } an open ink stroke, no fill
//
// Optional on filled parts:
//   stripes: { color, gap, width }   horizontal stripes
//   dots: { color, r, gap }          polka dots
//   flat: true                       no shading
//   shade: 0.1                       shadow depth as a share of the part's size
//                                    (default 0.24; faces use less)
//
// drawSketch() inks them in a comic style: brush outlines that thicken on
// the shadow side, and a cel shadow with cross-hatching on the side away
// from the light (top left). It draws them finished (progress 1) or partly
// drawn (progress below 1): first the outline is traced, then the color
// fills in from the top down.

// A tapered arm or leg from (ax, ay) to (bx, by), w1 wide at the start and
// w2 at the end, with round ends.
function limb(ax, ay, bx, by, w1, w2, fill, extra = {}) {
  const ang = Math.atan2(by - ay, bx - ax);
  const pts = [];
  for (let i = 0; i <= 6; i++) {
    const a = ang - Math.PI / 2 + (i / 6) * Math.PI;
    pts.push([bx + Math.cos(a) * w2 / 2, by + Math.sin(a) * w2 / 2]);
  }
  for (let i = 0; i <= 6; i++) {
    const a = ang + Math.PI / 2 + (i / 6) * Math.PI;
    pts.push([ax + Math.cos(a) * w1 / 2, ay + Math.sin(a) * w1 / 2]);
  }
  return { shape: 'poly', pts, fill, ...extra };
}

// One part as a list of points; closed shapes end where they started.
function partPoints(p) {
  if (p.shape === 'rect') {
    return [[p.x, p.y], [p.x + p.w, p.y], [p.x + p.w, p.y + p.h], [p.x, p.y + p.h], [p.x, p.y]];
  }
  if (p.shape === 'circle') {
    const ry = p.ry || p.r;
    const n = p.r > 12 ? 28 : 16;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
      pts.push([p.x + Math.cos(a) * p.r, p.y + Math.sin(a) * ry]);
    }
    return pts;
  }
  return p.shape === 'poly' ? p.pts.concat([p.pts[0]]) : p.pts;
}

function boundsOf(pts) {
  let top = Infinity, bottom = -Infinity, left = Infinity, right = -Infinity;
  for (const [px, py] of pts) {
    top = Math.min(top, py);
    bottom = Math.max(bottom, py);
    left = Math.min(left, px);
    right = Math.max(right, px);
  }
  return { top, bottom, left, right };
}

// The parts placed in the panel at (x, y): their point lists in panel
// coordinates, the total outline length and the bounding box.
function sketchOf(parts, x, y, facing) {
  const loops = parts.map(p => partPoints(p).map(([px, py]) => [x + px * facing, y + py]));
  let length = 0;
  for (const pts of loops) {
    for (let i = 1; i < pts.length; i++) length += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  }
  return { loops, length, ...boundsOf(loops.flat()) };
}

function tracePath(ctx, pts, dx = 0, dy = 0) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0] + dx, pts[0][1] + dy);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] + dx, pts[i][1] + dy);
  ctx.closePath();
}

// How far along a drawing is: the outline share (0 to 1) and the color
// share (0 to 1). The outline takes the first part of the drawing time.
function sketchStages(progress) {
  const share = CONFIG.drawing.outlineShare;
  return {
    outline: Math.min(1, progress / share),
    color: progress <= share ? 0 : Math.min(1, (progress - share) / (1 - share)),
  };
}

// Color, pattern, cel shadow and hatching for one closed part.
function paintPart(ctx, pts, p) {
  const b = boundsOf(pts);
  const w = b.right - b.left, h = b.bottom - b.top;
  tracePath(ctx, pts);
  ctx.fillStyle = p.fill;
  ctx.fill();
  ctx.save();
  tracePath(ctx, pts);
  ctx.clip();
  if (p.stripes) {
    ctx.fillStyle = p.stripes.color;
    for (let y = b.top + p.stripes.gap / 2; y < b.bottom; y += p.stripes.gap) {
      ctx.fillRect(b.left - 2, y, w + 4, p.stripes.width);
    }
  }
  if (p.dots) {
    ctx.fillStyle = p.dots.color;
    const { r, gap } = p.dots;
    for (let row = 0, y = b.top + gap / 2; y < b.bottom + r; row++, y += gap) {
      for (let x = b.left + (row % 2 ? gap / 2 : 0); x < b.right + r; x += gap) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  if (!p.flat && Math.min(w, h) >= 9) {
    // The shadow is the part minus a copy of itself nudged toward the light.
    const d = Math.max(2, Math.min(w, h) * (p.shade ?? 0.24));
    ctx.beginPath();
    ctx.rect(b.left - 50, b.top - 50, w + 100, h + 100);
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(px - d, py - d) : ctx.moveTo(px - d, py - d)));
    ctx.closePath();
    ctx.clip('evenodd');
    ctx.fillStyle = 'rgba(40, 20, 70, 0.3)';
    ctx.fillRect(b.left, b.top, w, h);
    ctx.strokeStyle = 'rgba(17, 17, 17, 0.55)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (let k = -h; k < w; k += 5) {
      ctx.moveTo(b.left + k, b.bottom);
      ctx.lineTo(b.left + k + h, b.top);
    }
    ctx.stroke();
  }
  ctx.restore();
  // A glint on round things.
  if (p.shape === 'circle' && !p.flat && p.r >= 6) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.ellipse(b.left + w * 0.32, b.top + h * 0.28, w * 0.11, h * 0.08, -0.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function signedArea(pts) {
  let a = 0;
  for (let i = 1; i < pts.length; i++) a += pts[i - 1][0] * pts[i][1] - pts[i][0] * pts[i - 1][1];
  return a / 2;
}

// Inks up to `ink` pixels of a part's outline with a brush: closed shapes
// get a thicker line on their shadow side (bottom right), open lines taper
// at both ends. Returns the ink left over.
function brushOutline(ctx, pts, p, base, ink) {
  const closed = p.shape !== 'line';
  const orient = closed ? Math.sign(signedArea(pts)) || 1 : 0;
  let total = 0, along = 0;
  if (!closed) for (let j = 1; j < pts.length; j++) total += Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]);
  for (let j = 1; j < pts.length && ink > 0; j++) {
    const [ax, ay] = pts[j - 1];
    let [bx, by] = pts[j];
    const dx = bx - ax, dy = by - ay;
    const seg = Math.hypot(dx, dy);
    if (seg === 0) continue;
    if (seg > ink) {
      bx = ax + dx * (ink / seg);
      by = ay + dy * (ink / seg);
    }
    let lw = p.lw || base;
    if (closed) {
      const nx = (orient > 0 ? dy : -dy) / seg, ny = (orient > 0 ? -dx : dx) / seg;
      lw *= 0.7 + 0.55 * Math.max(0, (nx + ny) / Math.SQRT2);
    } else {
      lw *= 0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, (along + seg / 2) / total));
    }
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
    ink -= seg;
    along += seg;
  }
  return ink;
}

// Draws the parts at (x, y). `style.lineWidth` sets the brush size (the
// left hand's crayon is chunkier than the right hand's pen).
function drawSketch(ctx, parts, x, y, facing, progress = 1, style = {}) {
  const s = sketchOf(parts, x, y, facing);
  const { outline, color } = sketchStages(progress);
  let ink = outline >= 1 ? Infinity : outline * s.length;
  const colorBottom = s.top + (s.bottom - s.top) * color;
  const base = style.lineWidth || 4;

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = INK;
  parts.forEach((p, i) => {
    const pts = s.loops[i];
    if (p.fill && p.shape !== 'line' && color > 0) {
      ctx.save();
      if (color < 1) {
        ctx.beginPath();
        ctx.rect(s.left - 10, s.top - 10, s.right - s.left + 20, colorBottom - s.top + 10);
        ctx.clip();
      }
      paintPart(ctx, pts, p);
      ctx.restore();
    }
    if (ink > 0) {
      ctx.strokeStyle = INK;
      ink = brushOutline(ctx, pts, p, base, ink);
    }
  });
  ctx.restore();
}

// Where the pen tip is at this point in a drawing: tracing the outline,
// then scribbling side to side along the color line.
function penPoint(parts, x, y, facing, progress, time) {
  const s = sketchOf(parts, x, y, facing);
  const { outline, color } = sketchStages(progress);
  if (outline < 1) {
    let ink = outline * s.length;
    for (const pts of s.loops) {
      for (let j = 1; j < pts.length; j++) {
        const [ax, ay] = pts[j - 1], [bx, by] = pts[j];
        const seg = Math.hypot(bx - ax, by - ay);
        if (seg >= ink) {
          const t = seg > 0 ? ink / seg : 0;
          return { x: ax + (bx - ax) * t, y: ay + (by - ay) * t };
        }
        ink -= seg;
      }
    }
  }
  const sweep = Math.abs(((time * 5) % 2) - 1);
  return { x: s.left + (s.right - s.left) * sweep, y: s.top + (s.bottom - s.top) * color };
}

// The shared "being drawn" system (spec section 8). A DrawJob draws one
// thing (a clown or an item) over `duration` seconds. While it runs, the
// thing is inactive: it can't move, hurt, be hurt or be picked up. When it
// finishes, the thing becomes active at once.
//
// A drawable thing has x, y, facing, parts(), and gets `active` and
// `drawProgress` (0 to 1) from here.
class DrawJob {
  constructor(thing, duration) {
    this.thing = thing;
    this.duration = duration;
    this.t = 0;
    thing.active = false;
    thing.drawProgress = 0;
  }

  get done() { return this.t >= this.duration; }

  update(dt) {
    this.t = Math.min(this.duration, this.t + dt);
    this.thing.drawProgress = this.t / this.duration;
    if (this.done) this.thing.active = true;
  }

  tip(time) {
    const th = this.thing;
    return penPoint(th.parts(), th.x, th.y, th.facing, th.drawProgress, time);
  }
}
