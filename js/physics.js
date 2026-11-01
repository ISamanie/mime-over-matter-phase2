// Standing on things. Everything stands on "surfaces": the ground plus the
// panel's platforms, each {x, y, w} with y its top. Surfaces are one-way:
// things fall onto them from above and can jump up through them.

function surfacesOf(panel) {
  return [{ x: 0, y: CONFIG.groundY, w: CONFIG.panel.w, ground: true }, ...panel.platforms];
}

// Moves a falling body (x, y = bottom center, w = width) onto the highest
// surface it crossed this frame. prevY is its bottom before the move.
// Returns the surface it landed on, or null.
function landOn(body, prevY, surfaces) {
  if (body.vy < 0) return null;
  let best = null;
  for (const s of surfaces) {
    const overlaps = body.x + body.w / 2 > s.x && body.x - body.w / 2 < s.x + s.w;
    if (overlaps && prevY <= s.y && body.y >= s.y && (!best || s.y < best.y)) best = s;
  }
  if (best) {
    body.y = best.y;
    body.vy = 0;
  }
  return best;
}

function boxOf(body) {
  return { left: body.x - body.w / 2, right: body.x + body.w / 2, top: body.y - body.h, bottom: body.y };
}

function boxesOverlap(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}
