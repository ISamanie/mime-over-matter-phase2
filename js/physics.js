// Standing on things. Everything stands on "surfaces": the ground plus the
// panel's platforms, each {x, y, w} with y its top. Surfaces are one-way:
// things fall onto them from above and can jump up through them.

function surfacesOf(panel) {
  return [{ x: 0, y: CONFIG.groundY, w: CONFIG.panel.w, ground: true }, ...panel.platforms,
    ...(panel.walls || []).map(w => ({ x: w.x, y: w.y, w: w.w, solid: true }))];
}

// Moves a falling body (x, y = bottom center, w = width) onto the highest
// surface it crossed this frame. prevY is its bottom before the move.
// Returns the surface it landed on, or null.
function landOn(body, prevY, surfaces) {
  if (body.vy < 0) return null;
  let best = null;
  for (const s of surfaces) {
    if (s.disabled) continue;
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

// Axis-separated solid collision. Horizontal movement happens first; the
// previous bottom then distinguishes landings from hits under a crate.
function moveBody(body, dt, game, carry = 0) {
  const oldX = body.x, oldY = body.y;
  body.x += (body.vx + carry) * dt;
  const walls = game.solidWalls();
  resolveSides(body, oldX, walls);
  body.y += body.vy * dt;
  let surface = landOn(body, oldY, game.surfaces);
  for (const wall of walls) {
    if (body.vy < 0 && oldY - body.h >= wall.y + wall.h && body.y - body.h <= wall.y + wall.h &&
        body.x + body.w / 2 > wall.x && body.x - body.w / 2 < wall.x + wall.w) {
      body.y = wall.y + wall.h + body.h;
      body.vy = 0;
    }
  }
  return surface;
}

function resolveSides(body, oldX, walls) {
  let blocked = false;
  for (const wall of walls) {
    if (body.y <= wall.y || body.y - body.h >= wall.y + wall.h) continue;
    if (oldX + body.w / 2 <= wall.x && body.x + body.w / 2 >= wall.x) {
      body.x = wall.x - body.w / 2; blocked = true;
    } else if (oldX - body.w / 2 >= wall.x + wall.w && body.x - body.w / 2 <= wall.x + wall.w) {
      body.x = wall.x + wall.w + body.w / 2; blocked = true;
    }
  }
  return blocked;
}

function wallBox(wall) {
  return { left: wall.x, right: wall.x + wall.w, top: wall.y, bottom: wall.y + wall.h };
}

// Shared swept collision for thrown props against solid scenery/mime walls.
function projectileWallTime(body, dx, dy, game) {
  return Math.min(Infinity, ...game.solidWalls().map(w => segmentBoxTime(body.x, body.y, dx, dy,
    { left: w.x - body.w / 2, right: w.x + w.w + body.w / 2, top: w.y, bottom: w.y + w.h + body.h })));
}
