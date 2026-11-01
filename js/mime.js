// Pierre's routines are real inside the comic; cooldowns run in game time.
class MimePowers {
  constructor() {
    this.cooldowns = {wall:0,rope:0,box:0};
    this.wall = null;
    this.rope = null;
  }
  update(dt) {
    for (const key of Object.keys(this.cooldowns)) this.cooldowns[key] = Math.max(0, this.cooldowns[key] - dt);
    if (this.wall && (this.wall.time -= dt) <= 0) this.wall = null;
    if (this.rope && (this.rope.time -= dt) <= 0) this.rope = null;
  }
  use(kind, game) {
    if (this.cooldowns[kind] > 0) return false;
    const p = game.pierre, c = CONFIG.mime[kind];
    if (kind === 'wall') {
      const x = p.facing > 0 ? p.x + p.w / 2 + 25 : p.x - p.w / 2 - 25 - c.w;
      const wall = {x,y:p.y-c.h,w:c.w,h:c.h,time:c.duration,mime:true};
      // Never materialize a wall inside somebody or beyond the ink line.
      if (x < 0 || x+c.w > Math.min(CONFIG.panel.w, game.rightLimit()) ||
          game.clowns.some(t => t.active && !t.dead && boxesOverlap(t.box,wallBox(wall))) ||
          (game.panel.walls || []).some(w => boxesOverlap(wallBox(w),wallBox(wall)))) return false;
      this.wall = wall;
    } else {
      const targets = game.clowns.filter(t => t.active && !t.dead &&
        Math.hypot(t.x-p.x,t.y-p.y) <= c.range && (kind !== 'rope' || (t.x-p.x)*p.facing >= 0));
      const target = targets.sort((a,b) => Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
      if (!target) return false;
      if (kind === 'box') target.trapped = c.duration;
      else {
        const oldX = target.x;
        const distance = Math.max(0, Math.abs(target.x-p.x) - (p.w+target.w)/2 - 12);
        target.x -= p.facing * Math.min(c.pull,distance);
        target.x = Math.max(target.surface.x+target.w/2,Math.min(target.surface.x+target.surface.w-target.w/2,target.x));
        resolveSides(target,oldX,game.solidWalls());
        target.stun = Math.max(target.stun,0.35);
        this.rope = {x:p.x,y:p.y-75,toX:target.x,toY:target.y-65,time:CONFIG.mime.poseDuration};
      }
    }
    p.mimeKind = kind;
    p.mimePose = CONFIG.mime.poseDuration;
    this.cooldowns[kind] = c.cooldown;
    return true;
  }
  render(ctx) {
    if (this.wall) {
      drawMimeBox(ctx,wallBox(this.wall));
      const age = CONFIG.mime.wall.duration - this.wall.time;
      drawMimeGlimmer(ctx,wallBox(this.wall),age);
    }
    if (this.rope) {
      const r = this.rope;
      const t = 1-r.time/CONFIG.mime.poseDuration;
      const slack = Math.sin(t*Math.PI*4)*12*(1-t);
      ctx.save();ctx.globalAlpha=Math.min(1,r.time/0.18);ctx.setLineDash([6,8]);
      ctx.lineDashOffset=-t*60;ctx.strokeStyle='#d7f3ff';ctx.lineWidth=4;
      ctx.beginPath();ctx.moveTo(r.x,r.y);
      ctx.quadraticCurveTo((r.x+r.toX)/2,(r.y+r.toY)/2+slack,r.toX,r.toY);
      ctx.stroke();ctx.restore();
    }
  }
}

// A brief silent sparkle makes the imaginary edges readable on arrival.
function drawMimeGlimmer(ctx, box, age) {
  if (age < 0 || age >= 0.6) return;
  const radius = 4 + Math.sin(age / 0.6 * Math.PI) * 7;
  ctx.save();ctx.globalAlpha=1-age/0.6;ctx.strokeStyle='#fff';ctx.lineWidth=2.5;
  for (const [x,y] of [[box.left,box.top],[box.right,box.bottom]]) {
    ctx.beginPath();ctx.moveTo(x-radius,y);ctx.lineTo(x+radius,y);
    ctx.moveTo(x,y-radius);ctx.lineTo(x,y+radius);ctx.stroke();
  }
  ctx.restore();
}

function drawMimeBox(ctx, box) {
  ctx.save();ctx.setLineDash([9,6]);ctx.lineWidth=3;ctx.strokeStyle='#42a5f5';
  ctx.fillStyle='rgba(187,222,251,0.12)';
  ctx.fillRect(box.left,box.top,box.right-box.left,box.bottom-box.top);
  ctx.strokeRect(box.left,box.top,box.right-box.left,box.bottom-box.top);
  ctx.restore();
}
