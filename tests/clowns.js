// Focused acceptance/regression tests for spec 5.4, 11, 18, 19, 29, 48, 50.
// Run: node tests/clowns.js. No dependencies; real game code, fake canvas.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const ctx = new Proxy({}, {
  get: (t, k) => k in t ? t[k] : k === 'measureText' ? () => ({ width: 10 })
    : k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : () => {},
  set: (t, k, v) => { t[k] = v; return true; },
});
const canvas = { getContext: () => ctx };
const sandbox = { console, Math: Object.assign(Object.create(Math), { random: () => 0.9 }),
  document: { getElementById: () => canvas, createElement: () => ({ ...canvas }) },
  performance: { now: () => 0 }, requestAnimationFrame() {}, addEventListener() {} };
sandbox.window = sandbox;
vm.createContext(sandbox);
for (const [, src] of fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"/g)) {
  vm.runInContext(fs.readFileSync(path.join(root, src), 'utf8'), sandbox, { filename: src });
}
const get = code => vm.runInContext(code, sandbox);
const check = (name, code) => { assert.ok(get(code), name); console.log(`ok    ${name}`); };
get(`
  function arena(type, x = 600) {
    Game.restart();
    Game.rightHand.reset(); Game.leftHand.reset();
    Game.panel = { platforms: [], clowns: [{type, x}] };
    Game.surfaces = surfacesOf(Game.panel);
    Game.clowns = [makeClown({type, x}, Game.surfaces)];
    Game.totalClowns = 1;
    return Game.clowns[0];
  }
  function tick(seconds) {
    for (let i = 0; i < Math.ceil(seconds * 60); i++) {
      Game.update(1 / 60); Input.endFrame();
    }
  }
`);

const types = ['seltzerSpritzer', 'juggler', 'balloonTwister', 'clownCar'];
for (const type of types) {
  get(`var c = arena('${type}'); var x = c.x; var hp = c.health;
    c.hurt(99, 0, Game); c.update(5, Game); Game.render();`);
  check(`${type}: inert, immune and harmless while being drawn`,
    'c.x === x && c.health === hp && !c.dead && Game.props.length === 0 && Game.clowns.length === 1 && Game.pierre.health === 10');
  get('var job = new DrawJob(c, CONFIG.rightHand.drawTime); job.update(CONFIG.rightHand.drawTime); c.update(1/60, Game)');
  check(`${type}: activates through shared drawing job and shouts`, 'c.active && c.greeted && !!c.bubble');
  get('c.stun = 1; var frozenX = c.x; var propCount = Game.props.length; var clownCount = Game.clowns.length; c.update(0.1, Game)');
  check(`${type}: stagger stops movement and attacks`, 'c.x === frozenX && Game.props.length === propCount && Game.clowns.length === clownCount');
  get('c.stun = 0; c.knockNose(Game, 0); var attackCount = Game.props.length; c.update(0.1, Game); Game.render()');
  check(`${type}: nose panic suspends attacks`, 'c.panicking && c.bubble.text === "MY NOSE!" && Game.props.length === attackCount');
  get('c.nose.resting = true; c.nose.surface = c.surface; c.nose.x = c.x; c.update(0.1, Game)');
  check(`${type}: can retrieve its nose (finite chase speed)`, '!c.panicking && !c.noseless && Number.isFinite(c.x)');
  get('c.hurt(99, 0, Game); var defeatedOnce = Game.defeated; c.hurt(99, 0, Game); c.update(10, Game)');
  check(`${type}: defeated once, never acts after death`, 'c.dead && Game.defeated === defeatedOnce');
}

get(`var c = arena('seltzerSpritzer'); c.active = true; c.act(0.5, Game);`);
check('Spritzer walks toward Pierre outside spraying range', 'c.x < 600 && Game.props.length === 0');
get('Game.pierre.x = c.x - 100; c.sprayTimer = 0; c.act(1/60, Game); var spray = Game.props[0]; spray.update(1/60, Game)');
check('Seltzer pushes strongly without removing health', 'spray.hit && Game.pierre.vx === -CONFIG.seltzer.push && Game.pierre.health === 10 && Game.pierre.invincible > 0');
get('var vx = Game.pierre.vx; Game.pierre.invincible = 0; spray.update(1/60, Game)');
check('A burst pushes at most once', 'Game.pierre.vx === vx && Game.pierre.invincible === 0');
get('spray.update(CONFIG.seltzer.duration, Game)');
check('Seltzer expires', 'spray.done');
get('Game.props = []; Game.pierre.x = c.x - 100; Game.pierre.y = c.y - 180; c.sprayTimer = 0; c.act(1/60, Game)');
check('Spritzer does not spray at an unreachable height', 'Game.props.length === 0');
get('Game.pierre.y = c.y; Game.pierre.x = c.x + 100; c.sprayTimer = 0; c.act(1/60, Game); Game.props[0].update(1/60, Game)');
check('Seltzer faces and pushes right too', 'Game.pierre.vx === CONFIG.seltzer.push');
get('c.surface = { x: 200, y: 370, w: 180 }; c.x = 201; Game.pierre.x = 0; c.act(10, Game)');
check('Spritzer never walks off its riser', 'c.x === c.surface.x + c.w/2');

get(`var c = arena('juggler'); c.active = true; var start = c.x; c.act(4, Game)`);
check('Juggler stands still and does not throw at distant Pierre', 'c.x === start && Game.props.length === 0');
get('Game.pierre.x = c.x - 240; c.throwTimer = 0; c.act(1/60, Game); var pin = Game.props[0]; var pinVX = pin.vx; var pinVY = pin.vy; pin.update(0.1, Game)');
check('A nearby Pierre triggers a straight aimed pin, no gravity', 'pin instanceof BowlingPin && pin.vx === pinVX && pin.vy === pinVY && pin.vx < 0');
get('c.act(0.1, Game)');
check('Pin throws respect their cooldown', 'Game.props.length === 1');
get('for (let i=0; i<120 && !pin.done; i++) pin.update(1/60, Game)');
check('Pin hits Pierre once and is removed', 'pin.done && Game.pierre.health === 9');
get(`Game.pierre.x = 400; Game.pierre.invincible = 0;
  var pin = new BowlingPin(600, 400, -2000, 0); pin.update(0.2, Game)`);
check('Fast straight pins cannot tunnel through Pierre', 'pin.done && Game.pierre.health === 8');
get(`Game.surfaces.push({x:500, y:350, w:50});
  Game.pierre.x=400; Game.pierre.invincible=0;
  var pin = new BowlingPin(600, 355, -1000, 0); pin.update(0.3, Game)`);
check('A riser intercepts a pin before Pierre', 'pin.done && pin.x > 550 && Game.pierre.health === 8');
get('var pin = new BowlingPin(400, 300, 0, 0); pin.update(CONFIG.pin.life, Game)');
check('Pins have bounded lifetime', 'pin.done');

get(`var c = arena('balloonTwister'); c.active = true; Game.pierre.x = 450; var start = c.x; c.act(0.1, Game)`);
check('Twister retreats from nearby Pierre', 'c.x > start');
get('c.act(20, Game); c.act(20, Game); c.act(20, Game)');
check('Twister maintains at most two live dogs', 'Game.props.filter(p => p instanceof BalloonDog && !p.done).length === 2');
get('var dog = Game.props[0]; var dogX = dog.x; dog.update(0.1, Game)');
check('Balloon dog chases Pierre', 'dog.x < dogX');
get('Game.pierre.x = dog.x - 40; Game.pierre.y = dog.y; Game.pierre.facing = 1; Game.pierre.swingTool = "beret"; Game.pierre.strike(Game)');
check('Beret slap pops a dog without counting a clown defeat', 'dog.done && Game.defeated === 0 && Game.effects.some(e => e.text === "POP!")');
get('var dog = new BalloonDog(c.x, c.y, c); Game.props.push(dog); Game.pierre.x = dog.x; Game.pierre.y = dog.y; dog.update(1/60, Game)');
check('Dog pops on reaching Pierre and inflicts one hit', 'dog.done && Game.pierre.health === 9');
get('Game.pierre.invincible = 0; dog.update(1/60, Game)');
check('A popped dog cannot inflict another hit', 'Game.pierre.health === 9');
get('c.act(20, Game)');
check('Twister replaces popped dogs', 'Game.props.filter(p => !p.done).length === 1');
get('var dog = Game.props.find(p => !p.done); Game.pierre.x = 50; dog.update(CONFIG.balloonDog.life, Game)');
check('Stranded dogs eventually pop', 'dog.done');
get('var dog = new BalloonDog(320, 300, c); Game.props = [dog]; tick(1)');
check('Dogs drop off ledges and land on the ground', 'dog.y === CONFIG.groundY');
get(`var c = arena('balloonTwister'); c.active = true;
  var other = makeClown({type:'balloonTwister', x:750}, Game.surfaces);
  other.active = true;
  c.act(20, Game); c.act(20, Game); other.act(20, Game); other.act(20, Game)`);
check('Dog caps belong to each Twister, not the whole panel', 'Game.props.length === 4');

get(`var c = arena('clownCar'); c.active = true; var parked = c.x; c.act(1.1, Game)`);
check('Car stays parked and releases an active mini clown', 'c.x === parked && Game.clowns.length === 2 && Game.clowns[1].active && Game.totalClowns === 2');
get('c.act(20, Game); c.act(20, Game); c.act(20, Game)');
check('Car is tougher than all other clowns and caps live minis', 'c.health > Math.max(...Object.values(CONFIG.clowns).filter(v => v && v.health && v !== CONFIG.clowns.clownCar).map(v => v.health)) && Game.clowns.length === 4');
get('var mini = Game.clowns[1]; var miniX = mini.x; mini.act(0.1, Game)');
check('Mini clowns chase Pierre', 'mini.x < miniX');
get('Game.pierre.x = mini.x; mini.act(1/60, Game)');
check('Mini clown contact hurts', 'Game.pierre.health === 9');
get('mini.hurt(1, 0, Game); c.act(20, Game)');
check('Car keeps replacing defeated minis', 'Game.totalClowns === 5 && Game.clowns.filter(m => m.owner === c && !m.dead).length === 3');
get('c.hurt(99, 0, Game); var spawned = Game.totalClowns; c.update(30, Game)');
check('Smashing the car stops spawning, surviving minis keep gate shut', 'Game.totalClowns === spawned && !Game.gateOpen');
get('Game.clowns.forEach(m => m.hurt(99, 0, Game)); tick(0.1)');
check('Gate opens only after the car AND every mini are defeated', 'Game.gateOpen && Game.clowns.length === 0 && Game.defeated === Game.totalClowns');

for (const type of types) {
  get(`Game.restart(); var index = PANELS.findIndex(p => p.clowns.some(c => c.type === '${type}')); Game.loadPanel(index)`);
  check(`${type}: first appears alone`, 'Game.panel.clowns.length === 1');
  if (type === 'clownCar') {
    get('var savedCrowded = Game.panel.crowded; Game.panel.crowded = false; Game.loadPanel(index); Game.panel.crowded = savedCrowded');
    check('Car panel automatically draws a crowded-panel hammer', 'Game.leftHand.busy');
    get('tick(2.2)');
    check('Car-panel hammer finishes before the car', 'Game.items.some(i => i.kind === "hammer" && i.active) && Game.clowns.every(c => !c.active)');
  }
  get('tick(3.2); Game.render()');
  check(`${type}: drawn by right hand in actual level`, 'Game.clowns[0].active && Game.clowns[0].greeted');
}
get('var oldProps = Game.props; Game.loadPanel(0)');
check('Panel changes clear spawned clowns and hostile props', 'Game.props.length === 0 && Game.clowns.length === 0 && Game.totalClowns === 1 && Game.defeated === 0');
get('var slot = pageSlot(PANELS.length - 1)');
check('Expanded page view stays inside canvas', 'pageSlot(0).y > 60 && slot.y + slot.h < CONFIG.canvas.height');

// Complete every real panel via actual attacks, hand draws, and page turns.
// Immunity isolates progression from combat difficulty, but no gate overrides.
get(`Game.restart(); Game.pierre.hurt = () => false;
  var cleared = 0;
  while (!Game.panel.theEnd && cleared < PANELS.length) {
    tick(19);
    for (const target of [...Game.clowns]) {
      for (let hit=0; hit<12 && !target.dead; hit++) {
        Game.pierre.x = target.x - 35;
        Game.pierre.y = target.y;
        Game.pierre.facing = 1;
        Game.pierre.swingTool = 'beret';
        Game.pierre.strike(Game);
      }
    }
    if (!Game.gateOpen) throw new Error('Gate stuck on panel ' + Game.panelIndex);
    Game.pierre.x = CONFIG.panel.w + Game.pierre.w;
    Game.update(1/60); tick(2); cleared++;
  }
`);
check('Every panel can be cleared through combat and page turns to THE END', 'Game.state === "end" && Game.panelIndex === PANELS.length - 1 && cleared === PANELS.length - 1');
console.log('\nall clown checks passed');
