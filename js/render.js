// Drawing helpers for the comic-book look: the page paper, the panel's
// background art and border, platforms, caption boxes, impact bursts and
// the HUD.
const INK = '#111';
const COMIC_FONT = '"Comic Sans MS", "Chalkboard SE", "Comic Neue", cursive';
const IMPACT_FONT = 'Impact, "Arial Black", sans-serif';
const PAPER = '#efe3c4';

// Screens are sharper when the canvas has one pixel per device pixel.
const DPR = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);

// A canvas to pre-render something once, at device resolution, in
// logical (CSS pixel) coordinates.
function offscreen(w, h, paint) {
  const c = document.createElement('canvas');
  c.width = w * DPR;
  c.height = h * DPR;
  const g = c.getContext('2d');
  g.scale(DPR, DPR);
  paint(g);
  return c;
}

// A small seeded random number generator, so the scenery is the same
// every time a panel is drawn.
function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function outlinedText(ctx, text, x, y, size, fill, opts = {}) {
  ctx.save();
  ctx.font = `${opts.weight || 'bold'} ${size}px ${opts.font || IMPACT_FONT}`;
  ctx.textAlign = opts.align || 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  const stroke = opts.stroke ?? Math.max(3, size / 7);
  if (stroke > 0) ctx.lineWidth = stroke;
  ctx.strokeStyle = INK;
  if (stroke > 0) ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
  ctx.restore();
}

// --- The page ---

// Aged comic paper with faint specks, for the gutters around the panel.
let paperCanvas = null;
function drawPaper(ctx) {
  const { width, height } = CONFIG.canvas;
  paperCanvas ||= offscreen(width, height, g => {
    g.fillStyle = PAPER;
    g.fillRect(0, 0, width, height);
    const rand = seededRandom(7);
    for (let i = 0; i < 2500; i++) {
      g.fillStyle = `rgba(120, 90, 40, ${0.05 + rand() * 0.1})`;
      g.fillRect(rand() * width, rand() * height, 1 + rand() * 1.5, 1 + rand() * 1.5);
    }
  });
  ctx.drawImage(paperCanvas, 0, 0, width, height);
}

// A hand-inked line from a to b: slightly uneven width, thicker mid-stroke.
function inkLine(ctx, ax, ay, bx, by, width, rand) {
  const steps = Math.max(2, Math.round(Math.hypot(bx - ax, by - ay) / 30));
  ctx.lineCap = 'round';
  for (let i = 0; i < steps; i++) {
    const t0 = i / steps, t1 = (i + 1) / steps;
    ctx.lineWidth = width * (0.8 + 0.4 * Math.sin(Math.PI * (t0 + t1) / 2)) * (0.9 + rand() * 0.2);
    ctx.beginPath();
    ctx.moveTo(ax + (bx - ax) * t0, ay + (by - ay) * t0);
    ctx.lineTo(ax + (bx - ax) * t1, ay + (by - ay) * t1);
    ctx.stroke();
  }
}

// The panel border: a thick brush line, slightly uneven.
function drawPanelFrame(ctx) {
  const { x, y, w, h, border } = CONFIG.panel;
  const rand = seededRandom(3);
  ctx.save();
  ctx.strokeStyle = INK;
  const l = x - border / 2, t = y - border / 2, r = x + w + border / 2, b = y + h + border / 2;
  inkLine(ctx, l, t, r, t, border, rand);
  inkLine(ctx, r, t, r, b, border * 1.2, rand);
  inkLine(ctx, r, b, l, b, border * 1.2, rand);
  inkLine(ctx, l, b, l, t, border, rand);
  ctx.restore();
}

// --- The panel's background art: the KlownKon convention hall ---

const BOOTHS = ['FACE PAINT', 'BALLOON ART', 'SQUEAK SHOP', 'PIE BAR', 'HONK HUT', 'WIG WORLD'];

function drawPanelBackground(ctx, panel, index) {
  const { w, h } = CONFIG.panel;
  panel._backdrop ||= offscreen(w, h, g => {
    if(panel.setting==='backstage') paintBackstage(g,index);
    else if(panel.setting==='bigTop') paintBigTop(g,index);
    else paintConventionHall(g,index);
  });
  ctx.drawImage(panel._backdrop, 0, 0, w, h);
}

function paintConventionHall(g, index) {
  const { w, h } = CONFIG.panel;
  const floor = CONFIG.groundY;
  const rand = seededRandom(100 + index * 17);
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.strokeStyle = INK;

  // Back wall, darker toward the floor, with colored halftone shading.
  const wall = g.createLinearGradient(0, 0, 0, floor);
  wall.addColorStop(0, '#e6d3a8');
  wall.addColorStop(1, '#bca57a');
  g.fillStyle = wall;
  g.fillRect(0, 0, w, floor);
  for (let y = 6, row = 0; y < floor; y += 10, row++) {
    const r = 0.6 + (y / floor) * 2.6;
    g.fillStyle = 'rgba(110, 70, 30, 0.22)';
    for (let x = (row % 2) * 5; x < w; x += 10) {
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
  }
  // Wall panels.
  g.lineWidth = 2;
  g.strokeStyle = 'rgba(17, 17, 17, 0.35)';
  for (let x = 75; x < w; x += 150) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, floor);
    g.stroke();
  }

  // Bunting across the top.
  const colors = ['#e57373', '#fff176', '#64b5f6', '#81c784'];
  g.strokeStyle = INK;
  g.lineWidth = 2;
  g.beginPath();
  for (let x = 0; x <= w; x += 10) g.lineTo(x, 18 + Math.sin((x / w) * Math.PI * 3) * 8 + 8);
  g.stroke();
  for (let x = 12, i = 0; x < w; x += 34, i++) {
    const y = 18 + Math.sin((x / w) * Math.PI * 3) * 8 + 8;
    g.beginPath();
    g.moveTo(x - 12, y);
    g.lineTo(x + 12, y);
    g.lineTo(x, y + 26);
    g.closePath();
    g.fillStyle = colors[i % colors.length];
    g.fill();
    g.lineWidth = 2.5;
    g.stroke();
  }

  // The big KLOWNKON banner.
  const bx = 250 + (index % 3) * 40, by = 52;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(bx + 20, 0); g.lineTo(bx + 30, by);
  g.moveTo(bx + 380, 0); g.lineTo(bx + 370, by);
  g.stroke();
  g.fillStyle = '#c62828';
  g.fillRect(bx, by, 400, 74);
  g.fillStyle = 'rgba(40, 0, 0, 0.35)';
  g.fillRect(bx, by + 56, 400, 18);
  g.lineWidth = 5;
  g.strokeRect(bx, by, 400, 74);
  outlinedText(g, 'KLOWNKON', bx + 200, by + 38, 50, '#ffd600', { stroke: 6 });

  // A crowd of clowns behind the booths: silhouettes with hats and hair.
  for (let i = 0; i < 26; i++) {
    const cx = rand() * w, cy = floor - 115 - rand() * 30, r = 13 + rand() * 6;
    g.fillStyle = `rgba(${90 + rand() * 40}, ${100 + rand() * 30}, ${150 + rand() * 40}, 0.9)`;
    g.beginPath();
    g.ellipse(cx, cy + r * 2.6, r * 1.7, r * 2, 0, Math.PI, 0);
    g.fill();
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.arc(cx - r, cy - 3, r * 0.6, 0, Math.PI * 2);
    g.arc(cx + r, cy - 3, r * 0.6, 0, Math.PI * 2);
    g.fill();
    if (rand() < 0.5) {
      g.beginPath();
      g.moveTo(cx - r * 0.7, cy - r * 0.7);
      g.lineTo(cx + r * 0.7, cy - r * 0.7);
      g.lineTo(cx, cy - r * 2.4);
      g.fill();
    }
  }

  // Booths: a striped tent back, a sign and a draped table.
  const first = Math.floor(rand() * BOOTHS.length);
  for (let i = 0; i < 3; i++) {
    const x = 40 + i * 300 + rand() * 40, top = floor - 230, bw = 210;
    for (let k = 0; k < 7; k++) {
      g.fillStyle = k % 2 ? '#f5f5f5' : ['#ef5350', '#42a5f5', '#66bb6a'][i];
      g.fillRect(x + (k * bw) / 7, top + 34, bw / 7 + 0.5, 120);
    }
    g.fillStyle = 'rgba(40, 20, 70, 0.25)';
    g.fillRect(x + bw * 0.7, top + 34, bw * 0.3, 120);
    g.lineWidth = 3.5;
    g.strokeRect(x, top + 34, bw, 120);
    g.fillStyle = '#fff59d';
    g.fillRect(x + 20, top, bw - 40, 36);
    g.lineWidth = 3.5;
    g.strokeRect(x + 20, top, bw - 40, 36);
    outlinedText(g, BOOTHS[(first + i) % BOOTHS.length], x + bw / 2, top + 19, 20, '#d32f2f', { stroke: 0 });
    g.fillStyle = '#fafafa';
    g.fillRect(x - 10, floor - 78, bw + 20, 60);
    g.fillStyle = 'rgba(40, 20, 70, 0.22)';
    g.fillRect(x - 10, floor - 40, bw + 20, 22);
    g.lineWidth = 3.5;
    g.strokeRect(x - 10, floor - 78, bw + 20, 60);
    g.lineWidth = 1.5;
    for (let k = 1; k < 6; k++) {
      g.beginPath();
      g.moveTo(x - 10 + (k * (bw + 20)) / 6, floor - 72);
      g.lineTo(x - 10 + (k * (bw + 20)) / 6 + 4, floor - 20);
      g.stroke();
    }
    g.fillStyle = 'rgba(0, 0, 0, 0.25)';
    g.fillRect(x - 6, floor - 18, bw + 12, 18);
  }

  // Fade everything behind the floor line toward the paper, so the
  // characters stand out in front of it.
  g.fillStyle = 'rgba(239, 227, 196, 0.38)';
  g.fillRect(0, 0, w, floor);

  // Wooden floor in perspective.
  g.fillStyle = '#b4834f';
  g.fillRect(0, floor, w, h - floor);
  g.strokeStyle = 'rgba(17, 17, 17, 0.55)';
  g.lineWidth = 2;
  const vx = w / 2, vy = floor - 260;
  for (let x = -600; x <= w + 600; x += 70) {
    const t = (floor - vy) / (h - vy);
    g.beginPath();
    g.moveTo(vx + (x - vx) * t, floor);
    g.lineTo(x, h);
    g.stroke();
  }
  for (const y of [floor + 18, floor + 42]) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(w, y);
    g.stroke();
  }
  g.strokeStyle = INK;
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(0, floor);
  g.lineTo(w, floor);
  g.stroke();
}

// Platforms are wooden stage risers on posts. They're drawn behind the
// characters; only their tops are solid.
function drawSurfaces(ctx, platforms) {
  for (const p of platforms) {
    const parts = [
      { shape: 'rect', x: p.x + 14, y: p.y + 20, w: 10, h: CONFIG.groundY - p.y - 20, fill: '#8d5a2b' },
      { shape: 'rect', x: p.x + p.w - 24, y: p.y + 20, w: 10, h: CONFIG.groundY - p.y - 20, fill: '#8d5a2b' },
      { shape: 'rect', x: p.x, y: p.y, w: p.w, h: 22, fill: '#c98b4b', stripes: { color: 'rgba(17,17,17,0.35)', gap: 11, width: 1.5 } },
    ];
    drawSketch(ctx, parts, 0, 0, 1);
  }
}

// A soft shadow on whatever surface is under something, to ground it.
function drawShadow(ctx, surfaces, x, y, w) {
  const under = surfaces.filter(s => s.y >= y - 1 && x >= s.x && x <= s.x + s.w);
  if (!under.length) return;
  const sy = Math.min(...under.map(s => s.y));
  const scale = Math.max(0.4, 1 - (sy - y) / 300);
  ctx.save();
  ctx.fillStyle = 'rgba(30, 15, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(x, sy + 2, (w / 2 + 10) * scale, 7 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// A yellow comic caption box, top-left of the panel.
function drawCaption(ctx, lines, x = 14, y = 14) {
  if (!lines || !lines.length) return;
  ctx.save();
  ctx.font = `bold 16px ${COMIC_FONT}`;
  const width = Math.max(...lines.map(l => ctx.measureText(l.toUpperCase()).width)) + 28;
  const height = lines.length * 22 + 16;
  ctx.fillStyle = '#ffe873';
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
  ctx.fillRect(x, y + height - 6, width, 6);
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  ctx.strokeRect(x, y, width, height);
  ctx.fillStyle = INK;
  ctx.textBaseline = 'top';
  lines.forEach((l, i) => ctx.fillText(l.toUpperCase(), x + 14, y + 10 + i * 22));
  ctx.restore();
}

// A white speech bubble with a tail pointing down to the speaker at
// (x, y + bubble height). Kept inside the panel.
function drawSpeechBubble(ctx, x, y, text) {
  ctx.save();
  ctx.font = `bold 17px ${COMIC_FONT}`;
  const w = ctx.measureText(text).width + 30, h = 36;
  const bx = Math.max(w / 2 + 6, Math.min(CONFIG.panel.w - w / 2 - 6, x));
  const by = Math.max(h / 2 + 6, y);
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 9, by + h / 2 - 4);
  ctx.lineTo(x - 2, by + h / 2 + 18);
  ctx.lineTo(x + 9, by + h / 2 - 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(bx, by, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, bx, by + 1);
  ctx.restore();
}

// --- Effects and overlays ---

// A comic impact burst: a jagged red and yellow star behind slanted,
// extruded lettering, popping in and fading out.
function drawBurst(ctx, b) {
  const life = b.t / CONFIG.burstTime;
  const scale = life < 0.2 ? 0.5 + life * 2.5 : 1;
  const rand = seededRandom(b.seed);
  ctx.save();
  ctx.globalAlpha = life > 0.75 ? 1 - (life - 0.75) / 0.25 : 1;
  ctx.translate(b.x, b.y);
  ctx.scale(scale, scale);
  ctx.rotate(b.tilt);
  for (const [outer, inner, fill] of [[54, 30, '#e53935'], [40, 24, '#ffeb3b']]) {
    ctx.beginPath();
    for (let i = 0; i < 22; i++) {
      const r = (i % 2 ? inner : outer) * (0.8 + rand() * 0.4);
      const a = (i / 22) * Math.PI * 2;
      ctx.lineTo(Math.cos(a) * r * 1.35, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    ctx.stroke();
  }
  ctx.transform(1, 0, -0.25, 1, 0, 0);
  ctx.font = `bold 34px ${IMPACT_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = INK;
  for (let k = 4; k > 0; k--) ctx.fillText(b.text, k, k + 2);
  outlinedText(ctx, b.text, 0, 2, 34, b.color, { stroke: 4 });
  ctx.restore();
}

// The thick ink line blocking the right edge until the panel is cleared.
function drawGate(ctx) {
  const x = CONFIG.panel.w - CONFIG.gateWidth / 2;
  const rand = seededRandom(11);
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.fillStyle = INK;
  for (let y = 0; y < CONFIG.groundY; y += 24) {
    inkLine(ctx, x + Math.sin(y * 0.05) * 2, y, x + Math.sin((y + 24) * 0.05) * 2, y + 24, CONFIG.gateWidth * 0.8, rand);
  }
  for (const [dy, r] of [[130, 5], [290, 4], [400, 6]]) {   // ink drips
    ctx.beginPath();
    ctx.arc(x - 10, dy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// A bobbing arrow at the right edge once the way is open.
function drawExitArrow(ctx, time) {
  const x = CONFIG.panel.w - 100 + Math.sin(time * 6) * 8, y = CONFIG.groundY - 70;
  const pts = [[0, -14], [44, -14], [44, -32], [80, 0], [44, 32], [44, 14], [0, 14]];
  drawSketch(ctx, [{ shape: 'poly', pts, fill: '#ffd600' }], x, y, 1);
}

// Game Over: a big red "CANCELLED!" stamp across the panel.
function drawGameOver(ctx) {
  const { w, h } = CONFIG.panel;
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(0, 0, w, h);
  ctx.translate(w / 2, h / 2 - 30);
  ctx.rotate(-0.18);
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#d50000';
  ctx.strokeRect(-260, -70, 520, 140);
  outlinedText(ctx, 'CANCELLED!', 0, 4, 96, '#d50000', { stroke: 0 });
  ctx.restore();
  outlinedText(ctx, 'Press R to try again', w / 2, h / 2 + 120, 34, '#fff', { stroke: 6 });
}

// The last panel: "THE END" across the panel.
function drawTheEnd(ctx, progress = 1) {
  const { w } = CONFIG.panel;
  const lettering=new EndLettering();
  drawSketch(ctx,lettering.parts(),lettering.x,lettering.y,1,progress,{lineWidth:8});
  if (progress>=1) outlinedText(ctx, 'Press R or Enter to play again', w / 2, 300, 32, '#fff', { stroke: 6 });
}

// --- HUD, in the top gutter ---

function drawHUD(ctx, game) {
  const p = game.pierre;
  const box = (x, y, w, h) => {
    ctx.fillStyle = '#ffe873';
    ctx.fillRect(x, y, w, h);
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    ctx.strokeRect(x, y, w, h);
  };
  box(26, 14, 400, 44);
  outlinedText(ctx, 'PIERRE', 40, 37, 24, '#fff', { align: 'left', stroke: 5 });
  for (let i = 0; i < CONFIG.pierre.maxHealth; i++) {
    const x = 140 + i * 27;
    ctx.fillStyle = i < p.health ? (p.health <= CONFIG.sandwich.lowHealth ? '#e53935' : '#43a047') : '#e0d6b8';
    ctx.fillRect(x, 24, 22, 26);
    if (i < p.health) {
      ctx.fillStyle = 'rgba(40, 20, 70, 0.3)';
      ctx.fillRect(x + 14, 24, 8, 26);
    }
    ctx.lineWidth = 3;
    ctx.strokeRect(x, 24, 22, 26);
  }
  if (p.held) {
    box(450, 14, 250, 44);
    const label=p.held.kind==='pogo'?`POGO: ${Math.ceil(p.held.time)}s`:p.held.kind==='slinky'?`SLINKY: ${p.slinkies}`:
      `${p.held.kind==='balloonSword'?'BALLOON SWORD':'HAMMER'}: ${p.held.swings}`;
    outlinedText(ctx, label, 575, 37, 21, '#fff', { stroke: 5 });
  } else {
    box(450,14,250,44);
    outlinedText(ctx, 'MIME OVER MATTER',575,37,25,'#e53935',{stroke:4});
  }
  box(720, 14, 214, 44);
  outlinedText(ctx, `PAGE ${Math.floor(game.panelIndex/6)+1} · PANEL ${game.panelIndex%6+1} / 6`, 827, 37, 18, '#fff', { stroke: 4 });
  const ready=kind=>game.mime.cooldowns[kind]>0?`${Math.ceil(game.mime.cooldowns[kind])}s`:'READY';
  ctx.fillStyle=PAPER;ctx.fillRect(26,59,908,21);
  outlinedText(ctx,`K KNIVES: ${p.knives}    L WALL: ${ready('wall')}    U ROPE: ${ready('rope')}    I BOX: ${ready('box')}    P PAUSE    M ${Sound.enabled?'SOUND ON':'MUTED'}`,
    480,70,14,INK,{stroke:0,font:COMIC_FONT});
}

function paintBackstage(g,index) {
  const {w,h}=CONFIG.panel,floor=CONFIG.groundY;
  g.fillStyle='#c6bdd0';g.fillRect(0,0,w,h);
  for(let x=10;x<w;x+=90) {g.fillStyle=x%180?'#736982':'#9686a3';g.fillRect(x,0,45,floor);}
  g.strokeStyle=INK;g.lineWidth=5;
  for(let i=0;i<3;i++) {
    const x=90+i*285;
    g.fillStyle='#6b4541';g.fillRect(x,190,150,280);g.strokeRect(x,190,150,280);
    g.fillStyle='#fff59d';g.fillRect(x-5,160,160,32);
    outlinedText(g,['DRESSING ROOM','PROPS','NO HONKING'][(i+index)%3],x+75,177,18,INK,{stroke:0,font:COMIC_FONT});
    g.fillStyle='#ffd600';g.beginPath();g.arc(x+130,335,6,0,Math.PI*2);g.fill();
  }
  for(let x=50;x<w;x+=190) {g.beginPath();g.moveTo(x,0);g.lineTo(x+30,150);g.stroke();g.fillStyle='#424242';g.fillRect(x+10,130,55,25);}
  g.fillStyle='rgba(239,227,196,0.44)';g.fillRect(0,0,w,floor);
  g.fillStyle='#8b6953';g.fillRect(0,floor,w,h-floor);
  for(let y=floor;y<h;y+=22) {g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();}
}

function paintBigTop(g,index) {
  const {w,h}=CONFIG.panel,floor=CONFIG.groundY;
  g.fillStyle='#f4dda8';g.fillRect(0,0,w,h);
  for(let x=-100;x<w;x+=180) {
    g.fillStyle='#d35454';g.beginPath();g.moveTo(w/2,-40);g.lineTo(x,floor);g.lineTo(x+90,floor);g.closePath();g.fill();
  }
  g.strokeStyle='#473b48';g.lineWidth=4;
  for(let row=0;row<3;row++) {
    const y=330+row*42;
    g.fillStyle='#9b7560';g.fillRect(20,y,w-40,32);g.strokeRect(20,y,w-40,32);
    for(let x=45;x<w;x+=42) {g.fillStyle=['#685e82','#88748c','#7b8297'][(row+index)%3];g.beginPath();g.arc(x,y-6,11,0,Math.PI*2);g.fill();}
  }
  for(const x of [210,650]) {g.beginPath();g.moveTo(x,0);g.lineTo(x,180);g.moveTo(x+85,0);g.lineTo(x+85,180);g.moveTo(x,180);g.lineTo(x+85,180);g.stroke();}
  g.fillStyle='rgba(239,227,196,0.42)';g.fillRect(0,0,w,floor);
  g.fillStyle='#d3a55f';g.fillRect(0,floor,w,h-floor);
  g.strokeStyle='#e53935';g.lineWidth=12;g.beginPath();g.ellipse(w/2,floor+40,360,40,0,0,Math.PI*2);g.stroke();
}

function drawTitle(ctx) {
  const {width:w,height:h}=CONFIG.canvas;
  ctx.fillStyle='#ffe873';ctx.fillRect(42,35,w-84,h-70);
  ctx.lineWidth=10;ctx.strokeStyle=INK;ctx.strokeRect(42,35,w-84,h-70);
  outlinedText(ctx,'MIME OVER MATTER',w/2,108,76,'#e53935',{stroke:9});
  const lines=[
    ['Chuckles McGraw draws BIG TOP BRAWL.','His clowns are losing their audience.'],
    ["Across the aisle, Pierre's silent mime act steals the show.",'Jealous, Chuckles traps him inside the comic!'],
    ['The right hand draws clowns to stop Pierre.','The rebellious left hand secretly draws supplies.'],
    ['Fight across three pages. Reach THE END.','Escape without saying a word.'],
  ];
  lines.forEach((pair,i)=>{
    const y=170+i*78;
    ctx.fillStyle=i%2?'#fffaf0':'#f7e1a1';ctx.fillRect(80,y,w-160,65);ctx.lineWidth=3;ctx.strokeRect(80,y,w-160,65);
    pair.forEach((line,j)=>outlinedText(ctx,line,w/2,y+20+j*25,21,INK,{stroke:0,font:COMIC_FONT}));
  });
  outlinedText(ctx,'PRESS ENTER TO START',w/2,533,36,'#e53935',{stroke:3});
  outlinedText(ctx,'ARROWS / A D: WALK · SPACE: JUMP · J: ATTACK · K: KNIFE',w/2,577,18,INK,{stroke:0,font:COMIC_FONT});
}

function drawPause(ctx) {
  ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(0,0,CONFIG.canvas.width,CONFIG.canvas.height);
  outlinedText(ctx,'PAUSED',480,285,90,'#ffe873');
  outlinedText(ctx,'P to resume',480,370,30,'#fff');
}

class EndLettering {
  constructor() {this.x=120;this.y=125;this.facing=1;this.active=false;this.drawProgress=0;}
  parts() {
    const glyphs={T:[[[0,0],[75,0]],[[37,0],[37,95]]],H:[[[0,0],[0,95]],[[75,0],[75,95]],[[0,45],[75,45]]],
      E:[[[75,0],[0,0],[0,95],[75,95]],[[0,45],[60,45]]],N:[[[0,95],[0,0],[75,95],[75,0]]],
      D:[[[0,95],[0,0],[40,0],[75,25],[75,70],[40,95],[0,95]]]};
    return [...'THE END'].flatMap((letter,i)=>(glyphs[letter]||[]).map(pts=>({shape:'line',pts:pts.map(([x,y])=>[x+i*97,y]),lw:10})));
  }
}
