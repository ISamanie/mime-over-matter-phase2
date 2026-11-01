// Items the left hand draws (spec 5.6). Pierre picks an item up by
// touching it, but only once the drawing is finished (`active`).
class Item {
  constructor(kind, x, y, w, h) {
    this.kind = kind;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.facing = 1;
    this.active = false;
    this.drawProgress = 0;
    this.taken = false;
    this.bob = 0;
  }

  get box() { return boxOf(this); }

  update(dt, game) {
    this.bob += dt;
    if (boxesOverlap(this.box, game.pierre.box)) {
      this.pickUp(game.pierre);
      this.taken = true;
    }
  }

  render(ctx) {
    const lift = this.active ? Math.abs(Math.sin(this.bob * 4)) * 4 : 0;
    drawSketch(ctx, this.parts(), this.x, this.y - lift, this.facing,
      this.active ? 1 : this.drawProgress, { lineWidth: CONFIG.leftHand.lineWidth });
  }
}

// Eaten on the spot: restores a good chunk of health, never above full.
class Sandwich extends Item {
  constructor(x, y) { super('sandwich', x, y, 54, 42); }

  pickUp(pierre) { pierre.heal(CONFIG.sandwich.heal); }

  parts() {
    return [
      { shape: 'rect', x: -25, y: -12, w: 50, h: 12, fill: '#e0a85a' },
      { shape: 'poly', pts: [[-28, -12], [-19, -21], [-10, -13], [0, -21], [10, -13], [19, -21], [28, -12]], fill: '#66bb6a' },
      { shape: 'rect', x: -24, y: -24, w: 48, h: 8, fill: '#e53935' },
      { shape: 'circle', x: 0, y: -30, r: 27, ry: 12, fill: '#e0a85a' },
      { shape: 'line', pts: [[-10, -34], [-7, -33]], lw: 2.5 },
      { shape: 'line', pts: [[5, -36], [8, -35]], lw: 2.5 },
    ];
  }
}

// The squeaky hammer (spec 5.6): replaces the punch until it breaks.
class Hammer extends Item {
  constructor(x, y) { super('hammer', x, y, 56, 56); }

  pickUp(pierre) { pierre.held = { kind: 'hammer', swings: CONFIG.hammer.swings }; }

  // Lying on its side.
  parts() {
    return hammerParts([-24, -12], [10, -12], 'flat');
  }
}

// A squeaky toy hammer: a striped handle from `grip` to `end`, and a
// red head with yellow rubber caps at `end`. The head sits across the
// handle: 'flat' when the handle is level, 'up' when it points up.
function hammerParts([gx, gy], [ex, ey], head) {
  const across = head === 'up'
    ? { shape: 'rect', x: ex - 22, y: ey - 14, w: 44, h: 26 }
    : { shape: 'rect', x: ex - 13, y: ey - 22, w: 26, h: 44 };
  const caps = head === 'up'
    ? [{ shape: 'rect', x: ex - 30, y: ey - 12, w: 9, h: 22 }, { shape: 'rect', x: ex + 21, y: ey - 12, w: 9, h: 22 }]
    : [{ shape: 'rect', x: ex - 11, y: ey - 30, w: 22, h: 9 }, { shape: 'rect', x: ex - 11, y: ey + 21, w: 22, h: 9 }];
  return [
    limb(gx, gy, ex, ey, 8, 8, '#ffd600', { stripes: { color: '#1e88e5', gap: 10, width: 4 } }),
    ...caps.map(c => ({ ...c, fill: '#ffeb3b' })),
    { ...across, fill: '#e53935' },
  ];
}
