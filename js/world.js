// Solid props and three readable slapstick hazards (spec 9.2).
class Hazard {
  constructor(spec, surfaces) {
    Object.assign(this, spec);
    this.t = spec.phase || 0;
    this.open = false;
    if (this.type === 'trapdoor') {
      this.surface = { x: this.x, y: this.y, w: this.w, disabled: false };
      surfaces.push(this.surface);
    }
  }
  update(dt) {
    this.t += dt;
    if (this.surface) {
      this.open = this.t % CONFIG.hazards.trapPeriod >= CONFIG.hazards.trapPeriod - CONFIG.hazards.trapOpen;
      this.surface.disabled = this.open;
    }
  }
  touches(p) {
    return p.onGround && Math.abs(p.y - this.y) < 3 && p.x + p.w / 2 > this.x && p.x - p.w / 2 < this.x + this.w;
  }
  apply(p, game) {
    if (this.type === 'banana' && this.touches(p) && p.slipTimer <= 0 && p.slipGrace <= 0) {
      p.slipTimer = CONFIG.hazards.slipTime;
      p.slipGrace = CONFIG.hazards.slipTime + 0.8;
      p.slipDir = Math.sign(p.vx) || p.facing;
      game.burst('WHOOPS!', p.x, p.y - 80, '#ffd600');
    }
  }
  carry(p) {
    return this.type === 'conveyor' && this.touches(p) ? (this.dir || 1) * CONFIG.hazards.conveyorSpeed : 0;
  }
  render(ctx) {
    let parts;
    if (this.type === 'banana') {
      parts = [{ shape: 'poly', pts: [[0,-3],[10,-10],[15,-21],[18,-8],[32,-1],[18,-3],[12,-1]], fill: '#ffd600' }];
    } else {
      const color = this.type === 'trapdoor' ? '#b57d47' : '#607d8b';
      parts = [{ shape: 'rect', x: 0, y: -5, w: this.w, h: 14, fill: color, stripes: {color:'#ffd600',gap:8,width:3} }];
      if (this.open) parts = [{ shape: 'rect', x:0, y:-3, w:this.w, h:12, fill:INK },
        { shape:'line', pts:[[0,0],[12,35]],lw:6 }, {shape:'line',pts:[[this.w,0],[this.w-12,35]],lw:6}];
      if (this.type === 'conveyor') for (let x = 12; x < this.w; x += 28) {
        const shift = (this.t * 35 * (this.dir || 1)) % 14;
        const dir=this.dir||1;
        parts.push({shape:'line',pts:[[x+shift-dir*4,-15],[x+shift+dir*4,-10],[x+shift-dir*4,-5]],lw:3});
      }
    }
    drawSketch(ctx, parts, this.x, this.y, 1, 1, {lineWidth:3});
  }
}

function drawObstacles(ctx, walls) {
  for (const wall of walls || []) {
    drawSketch(ctx, [
      {shape:'rect',x:0,y:0,w:wall.w,h:wall.h,fill:'#b4814d',stripes:{color:'#79502b',gap:17,width:3}},
      {shape:'line',pts:[[5,5],[wall.w-5,wall.h-5]],lw:5},
      {shape:'line',pts:[[wall.w-5,5],[5,wall.h-5]],lw:5},
    ], wall.x, wall.y, 1, 1, {lineWidth:4});
  }
}
