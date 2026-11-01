// Moving between panels like reading a comic: the camera zooms out from
// the panel Pierre just left to the whole page, a reading arrow draws to
// the next panel, and the camera zooms into it.
//
// The page is the canvas at normal scale, with each panel as a small
// rectangle of the same shape (a "slot"). Zooming in so a slot exactly
// fills the panel's place on screen makes the page view and the live
// panel line up.

const PAGE_COLUMNS = 3;
const PAGE_GAP = 24;

// Where panel i sits on the page, in canvas coordinates.
function pageSlot(i) {
  const { w, h } = CONFIG.panel;
  const rows = Math.ceil(PANELS.length / PAGE_COLUMNS);
  const sw = 270, sh = (sw * h) / w;
  const left = (CONFIG.canvas.width - (PAGE_COLUMNS * sw + (PAGE_COLUMNS - 1) * PAGE_GAP)) / 2;
  const top = (CONFIG.canvas.height - (rows * sh + (rows - 1) * PAGE_GAP)) / 2 + 30;
  const col = i % PAGE_COLUMNS, row = Math.floor(i / PAGE_COLUMNS);
  return { x: left + col * (sw + PAGE_GAP), y: top + row * (sh + PAGE_GAP), w: sw, h: sh };
}

// A panel's empty set (background and platforms), for panels Pierre
// hasn't reached yet. Drawn once and kept on the panel.
function panelSetPicture(panel, index) {
  const { w, h } = CONFIG.panel;
  panel._set ||= offscreen(w, h, g => {
    drawPanelBackground(g, panel, index);
    drawSurfaces(g, panel.platforms);
    if (panel.theEnd) drawTheEnd(g);
  });
  return panel._set;
}

// The whole page: a title, then every panel, as Pierre left it if he's
// been there, or as an empty set if not. `arrow` (0 to 1) is how much of
// the reading arrow from panel `from` to panel `to` is drawn, and
// `arrowAlpha` fades it.
function drawComicPage(ctx, pictures, from, to, arrow, arrowAlpha = 1) {
  outlinedText(ctx, 'BIG TOP BRAWL  ·  PAGE 1', CONFIG.canvas.width / 2, pageSlot(0).y - 46, 40, '#e53935', { stroke: 7 });
  PANELS.forEach((panel, i) => {
    const r = pageSlot(i);
    ctx.drawImage(pictures[i] || panelSetPicture(panel, i), r.x, r.y, r.w, r.h);
    if (i > to) {                       // not reached yet: faded
      ctx.fillStyle = 'rgba(239, 227, 196, 0.5)';
      ctx.fillRect(r.x, r.y, r.w, r.h);
    }
    const rand = seededRandom(20 + i);
    ctx.strokeStyle = INK;
    const b = 3 * (CONFIG.panel.border / 9);
    inkLine(ctx, r.x, r.y, r.x + r.w, r.y, b, rand);
    inkLine(ctx, r.x + r.w, r.y, r.x + r.w, r.y + r.h, b * 1.2, rand);
    inkLine(ctx, r.x + r.w, r.y + r.h, r.x, r.y + r.h, b * 1.2, rand);
    inkLine(ctx, r.x, r.y + r.h, r.x, r.y, b, rand);
  });
  if (arrow > 0 && arrowAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = arrowAlpha;
    drawReadingArrow(ctx, pageSlot(from), pageSlot(to), arrow);
    ctx.restore();
  }
}

// A dotted arrow across the gutter from one panel to the next, aimed
// center to center but starting and stopping just outside the panels.
// Drawn in as `progress` goes from 0 to 1.
function drawReadingArrow(ctx, a, b, progress) {
  const cx = a.x + a.w / 2, cy = a.y + a.h / 2;
  const dx = b.x + b.w / 2 - cx, dy = b.y + b.h / 2 - cy;
  const pad = 8;
  // Where the center-to-center line leaves panel a and enters panel b.
  const exitA = Math.min(...[[dx, a.x - pad, a.x + a.w + pad, cx], [dy, a.y - pad, a.y + a.h + pad, cy]]
    .filter(([d]) => d !== 0).map(([d, lo, hi, c]) => ((d > 0 ? hi : lo) - c) / d));
  const enterB = Math.max(...[[dx, b.x - pad, b.x + b.w + pad, cx], [dy, b.y - pad, b.y + b.h + pad, cy]]
    .filter(([d]) => d !== 0).map(([d, lo, hi, c]) => ((d > 0 ? lo : hi) - c) / d));
  const ax = cx + dx * exitA, ay = cy + dy * exitA;
  const bx = cx + dx * enterB, by = cy + dy * enterB;
  const ex = ax + (bx - ax) * progress, ey = ay + (by - ay) * progress;
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.fillStyle = '#ffd600';
  ctx.lineWidth = 5;
  ctx.setLineDash([2, 12]);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  ctx.setLineDash([]);
  const ang = Math.atan2(by - ay, bx - ax);
  ctx.translate(ex, ey);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-12, -14);
  ctx.lineTo(-12, 14);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

const smooth = t => t * t * (3 - 2 * t);

// The page turn in progress: zoom out of panel `from`, hold on the page
// while the arrow draws, zoom into panel `to`. Returns how zoomed in the
// camera is (1 = a panel fills the screen, 0 = the whole page), so the HUD
// can fade with it.
function drawPageTurn(ctx, turn, pictures) {
  const c = CONFIG.pageTurn;
  let slot, zoom, arrow;
  if (turn.t < c.zoomOut) {
    slot = turn.from; zoom = 1 - smooth(turn.t / c.zoomOut); arrow = 0;
  } else if (turn.t < c.zoomOut + c.hold) {
    slot = turn.from; zoom = 0; arrow = smooth((turn.t - c.zoomOut) / c.hold);
  } else {
    slot = turn.to; zoom = smooth(Math.min(1, (turn.t - c.zoomOut - c.hold) / c.zoomIn)); arrow = 1;
  }
  // Interpolate between the page at normal scale and the camera that makes
  // the slot exactly fill the panel's place on screen.
  const r = pageSlot(slot), P = CONFIG.panel, k = P.w / r.w;
  ctx.save();
  ctx.translate((P.x - r.x * k) * zoom, (P.y - r.y * k) * zoom);
  ctx.scale(1 + (k - 1) * zoom, 1 + (k - 1) * zoom);
  drawComicPage(ctx, pictures, turn.from, turn.to, arrow, slot === turn.to ? 1 - zoom * 2 : 1);
  ctx.restore();
  return zoom;
}
