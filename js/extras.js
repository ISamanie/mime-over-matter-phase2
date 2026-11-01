// Extra items share the same drawing/pickup lifecycle as sandwiches/hammer.
class Knives extends Item {
  constructor(x,y) { super('knives',x,y,48,35); }
  pickUp(p) { p.knives += CONFIG.knives.count; }
  parts() { return [-12,0,12].flatMap(x => knifeParts(x,-15)); }
}
class BalloonSword extends Item {
  constructor(x,y) { super('balloonSword',x,y,70,40); }
  pickUp(p) { p.held = {kind:'balloonSword',swings:CONFIG.balloonSword.swings}; }
  parts() { return balloonSwordParts([-30,-15]); }
}
class Pogo extends Item {
  constructor(x,y) { super('pogo',x,y,40,70); }
  pickUp(p) { p.held = {kind:'pogo',time:CONFIG.pogo.duration}; }
  parts() { return pogoParts(0,0); }
}
class Slinkies extends Item {
  constructor(x,y) { super('slinky',x,y,42,35); }
  pickUp(p) { p.slinkies += CONFIG.slinky.count; p.held = {kind:'slinky'}; }
  parts() { return slinkyParts(0,-14); }
}
class InvisibleDogItem extends Item {
  constructor(x,y) { super('invisibleDog',x,y,48,45); }
  pickUp(p) { Game.dog = new InvisibleDog(p.x,p.y); }
  parts() { return [{shape:'circle',x:0,y:-22,r:14,ry:8,fill:'#e53935'},
    {shape:'line',pts:[[0,-25],[23,-45]],lw:3}]; }
}

function knifeParts(x,y) {
  return [{shape:'poly',pts:[[x-5,y],[x+24,y-5],[x+10,y+5],[x-5,y+5]],fill:'#cfd8dc'},
    {shape:'rect',x:x-17,y:y,w:14,h:6,fill:'#6d4c41'}];
}
function balloonSwordParts([x,y]) {
  return [{shape:'circle',x:x+30,y:y-10,r:38,ry:6,fill:'#ec407a'},
    {shape:'circle',x:x+2,y:y-8,r:5,ry:17,fill:'#ffd600'},
    {shape:'circle',x:x-8,y:y-8,r:10,ry:5,fill:'#ec407a'}];
}
function pogoParts(x,y) {
  return [limb(x,y-64,x,y-5,7,7,'#1e88e5'),
    {shape:'line',pts:[[x-14,y-60],[x+14,y-60]],lw:7},
    {shape:'line',pts:[[x-16,y-10],[x+16,y-10]],lw:6},
    {shape:'circle',x,y:y-3,r:7,ry:4,fill:'#e53935'}];
}
function slinkyParts(x,y) {
  return Array.from({length:7},(_,i)=>({shape:'circle',x:x-16+i*5,y:y-Math.sin(i/6*Math.PI)*8,r:5,ry:12,fill:'#90a4ae'}));
}

class Knife {
  constructor(x,y,facing) {
    Object.assign(this,{x,y,facing,w:30,h:10,vx:facing*CONFIG.knives.speed,done:false,t:0});
  }
  update(dt,game) {
    if (this.done) return;
    this.t += dt;
    const dx = this.vx*dt;
    let nearest = projectileWallTime(this,dx,0,game), target = null;
    for (const c of game.clowns) if (c.active && !c.dead) {
      const b = c.box;
      const hit = segmentBoxTime(this.x,this.y,dx,0,{left:b.left-this.w/2,right:b.right+this.w/2,top:b.top,bottom:b.bottom+this.h});
      if (hit < nearest) { nearest=hit;target=c; }
    }
    for (const s of game.surfaces) if (!s.disabled) {
      const hit = segmentBoxTime(this.x,this.y,dx,0,{left:s.x-this.w/2,right:s.x+s.w+this.w/2,top:s.y,bottom:s.y+(s.ground?70:14)+this.h});
      if (hit < nearest) {nearest=hit;target=null;}
    }
    this.x += dx*Math.min(1,nearest);
    if (nearest<=1) {
      if (target) {target.hurt(CONFIG.knives.damage,this.x-this.facing*100,game);game.burst('THWIP!',this.x,this.y);}
      this.done=true;
    }
    if (this.x < -50 || this.x > CONFIG.panel.w+50 || this.t > 3) this.done=true;
  }
  render(ctx) {drawSketch(ctx,knifeParts(0,-5),this.x,this.y,this.facing,1,{lineWidth:2});}
}

class Slinky {
  constructor(x,y,facing) {Object.assign(this,{x,y,facing,w:34,h:26,vy:0,t:0,done:false});}
  update(dt,game) {
    if (this.done) return;
    this.t+=dt;
    const target=game.clowns.filter(c=>c.active&&!c.dead).sort((a,b)=>Math.abs(a.x-this.x)-Math.abs(b.x-this.x))[0];
    if (target) this.facing=target.x<this.x?-1:1;
    this.vx=this.facing*CONFIG.slinky.speed;
    this.vy+=CONFIG.gravity*dt;
    moveBody(this,dt,game);
    this.x=Math.max(this.w/2,Math.min(game.rightLimit()-this.w/2,this.x));
    if (target && boxesOverlap(boxOf(this),target.box)) {
      target.hurt(CONFIG.slinky.damage,this.x,game);game.burst('SPROING!',this.x,this.y-30);this.done=true;
    }
    if (this.t>=CONFIG.slinky.life) this.done=true;
  }
  render(ctx) {drawSketch(ctx,slinkyParts(0,-13),this.x,this.y,1,1,{lineWidth:2});}
}

class InvisibleDog {
  constructor(x,y) {Object.assign(this,{x,y,w:38,h:35,vy:0,t:0,bite:0,facing:1,done:false});}
  update(dt,game) {
    const c=CONFIG.invisibleDog,p=game.pierre;
    this.t+=dt;this.bite-=dt;
    const target=game.clowns.filter(t=>t.active&&!t.dead&&Math.hypot(t.x-p.x,t.y-p.y)<c.range)
      .sort((a,b)=>Math.hypot(a.x-this.x,a.y-this.y)-Math.hypot(b.x-this.x,b.y-this.y))[0];
    const goal=target||p;
    this.facing=goal.x<this.x?-1:1;
    this.vx=Math.abs(goal.x-this.x)>25?this.facing*c.speed:0;
    this.vy+=CONFIG.gravity*dt;
    const oldX=this.x;
    const floor=moveBody(this,dt,game);
    if (floor && ((this.vx!==0 && Math.abs(this.x-oldX)<1) || goal.y<this.y-60)) this.vy=-700;
    if (target&&boxesOverlap(boxOf(this),target.box)&&this.bite<=0) {
      target.hurt(c.damage,this.x,game);game.burst('CHOMP!',this.x,this.y-35);this.bite=c.biteEvery;
    }
    this.done=this.t>=c.duration;
  }
  render(ctx) {
    drawSketch(ctx,[{shape:'circle',x:0,y:-26,r:12,ry:7,fill:'#e53935'},
      {shape:'line',pts:[[0,-30],[-20,-62]],lw:3}],this.x,this.y,this.facing,1,{lineWidth:3});
  }
}

function makeItem(kind,x,y) {
  const types={sandwich:Sandwich,hammer:Hammer,knives:Knives,balloonSword:BalloonSword,pogo:Pogo,slinky:Slinkies,invisibleDog:InvisibleDogItem};
  if (!types[kind]) throw new Error('Unknown item: '+kind);
  return new types[kind](x,y);
}

// Synthesized locally, with no assets or libraries. Browsers require a real
// input gesture before starting audio. Unsupported audio simply stays silent.
const Sound = {
  ctx:null, enabled:true, scratchTimer:0,
  unlock() {
    if (!this.enabled) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (Audio && !this.ctx) this.ctx=new Audio();
      if (this.ctx && this.ctx.state==='suspended') this.ctx.resume().catch(()=>{});
    } catch (_) { this.ctx=null; }
  },
  play(kind) {
    if (!this.enabled || !this.ctx || this.ctx.state!=='running') return;
    const c=this.ctx,t=c.currentTime;
    const freq={honk:190,squeak:650,pop:120,scratch:1200}[kind]||250;
    const osc=c.createOscillator(),gain=c.createGain();
    osc.type=kind==='scratch'?'sawtooth':'square';
    osc.frequency.setValueAtTime(freq,t);osc.frequency.exponentialRampToValueAtTime(Math.max(40,freq*(kind==='squeak'?2:0.35)),t+0.12);
    gain.gain.setValueAtTime(0.035,t);gain.gain.exponentialRampToValueAtTime(0.001,t+0.13);
    osc.connect(gain);gain.connect(c.destination);osc.start(t);osc.stop(t+0.14);
  },
  update(dt,drawing) {
    this.scratchTimer-=dt;
    if (drawing&&this.scratchTimer<=0) {this.play('scratch');this.scratchTimer=0.16;}
  },
};
