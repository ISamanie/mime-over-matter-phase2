// Acceptance tests for the remaining spec features. node tests/expansion.js
const assert=require('node:assert/strict');
const {get,key,tick}=require('./harness')();
let checks=0;
function check(name,expr) {assert.ok(get(expr),name);checks++;console.log('ok    '+name);}

check('Game opens on a title screen without starting enemies','Game.state==="title" && Game.clowns.length===0');
get('var titleTime=Game.time;Game.update(10);Game.render()');
check('Title holds the game until Enter','Game.state==="title" && Game.time===titleTime');
key('keydown','Enter');tick(1/60);key('keyup','Enter');
check('Enter starts a fresh game','Game.state==="play" && Game.panelIndex===0');
check('Exactly 3 pages of 6 panels, with THE END only on panel 18','PANELS.length===18 && PANELS.every((p,i)=>p.page===Math.floor(i/6)&&!!p.theEnd===(i===17))');
check('The pages have distinct settings','new Set(PANELS.map(p=>p.setting)).size===3');
check('Each later fighting panel has solid obstacles and two hazard types',
  'PANELS.slice(6,17).every(p=>p.walls.length>0 && new Set(p.hazards.map(h=>h.type)).size>=2)');
check('There are traversal encounters and no repeated neighboring layouts',
  'PANELS.filter(p=>p.traversal).length>=2 && PANELS.slice(1,17).every((p,i)=>JSON.stringify(p.platforms)!==JSON.stringify(PANELS[i].platforms))');
get('Game.loadPanel(5); Game.pierre.hurt=()=>false; tickEnd=0;');
// Finish car and minis; entering page 2 must show the outgoing page first.
tick(9);get('Game.clowns.forEach(c=>c.hurt(99,0,Game));Game.freeze=0;Game.nextPanel();Game.render()');
check('A page boundary creates a frozen page turn retaining cleared snapshots','Game.state==="pageTurn"&&Game.turn.from===5&&Game.turn.to===6&&!!Game.pictures[5]');
get('var turnT=Game.turn.t;var handT=Game.rightHand.time');
key('keydown','p');tick(1/60);key('keyup','p');tick(2);
check('P pauses page turns and every game timer','Game.state==="paused" && Game.turn.t===turnT && Game.rightHand.time===handT');
key('keydown','p');tick(1/60);key('keyup','p');tick(2);
check('P resumes into the next page','Game.state==="play" && Game.panelIndex===6');

get(`var c=arena();Game.panel.walls=[{x:200,y:390,w:65,h:80}];Game.surfaces=surfacesOf(Game.panel);
  Game.pierre.x=140;Game.pierre.vx=260;Game.pierre.vy=0;`);
key('keydown','ArrowRight');tick(0.5);key('keyup','ArrowRight');
check('Solid crates stop horizontal movement','Game.pierre.x===180');
get('Game.pierre.x=230;Game.pierre.y=350;Game.pierre.vy=300;Game.pierre.onGround=false');tick(0.1);
check('Pierre lands on the top of a crate','Game.pierre.y===390 && Game.pierre.onGround');
get(`Game.panel.walls=[{x:200,y:220,w:65,h:30}];Game.surfaces=surfacesOf(Game.panel);
  Game.pierre.x=230;Game.pierre.y=390;Game.pierre.vy=-600;Game.pierre.onGround=false;Game.pierre.rising=false;`);
tick(0.05);
check('Solid props stop an upward head collision','Game.pierre.y>=374 && Game.pierre.vy>=0');
get(`var c=arena('unicyclist',300);Game.panel.walls=[{x:200,y:390,w:60,h:80}];
  c.facing=-1;c.update(0.3,Game)`);
check('Unicyclist turns at a solid crate','c.x>=285 && c.facing===1');
get(`arena();Game.hazards=[new Hazard({type:'banana',x:40,y:470,w:40},Game.surfaces)];
  Game.pierre.x=60;Game.pierre.invincible=0;Game.update(1/60);`);
check('Banana peel starts a harmless slide','Game.pierre.slipTimer>0 && Game.pierre.health===10');
tick(0.1);check('Slide overrides ordinary walk speed','Game.pierre.vx===CONFIG.hazards.slipSpeed');
get(`arena();Game.hazards=[new Hazard({type:'conveyor',x:0,y:470,w:200,dir:1},Game.surfaces)];var start=Game.pierre.x;`);tick(0.3);
check('Conveyor carries a stationary Pierre','Game.pierre.x>start+25');
get(`arena();var trap=new Hazard({type:'trapdoor',x:30,y:370,w:140},Game.surfaces);Game.hazards=[trap];
  Game.pierre.x=80;Game.pierre.y=370;trap.t=CONFIG.hazards.trapPeriod-CONFIG.hazards.trapOpen-0.02;`);tick(0.15);
check('Timed trapdoor opens and Pierre falls through','trap.open && trap.surface.disabled && Game.pierre.y>370');
tick(1.4);check('Trapdoor closes again','!trap.open && !trap.surface.disabled');
get(`var c=arena('unicyclist',180);Game.panel.walls=[{x:250,y:390,w:60,h:80}];c.knockNose(Game,0);
  c.nose.resting=true;c.nose.surface=c.surface;c.nose.x=400;
  for(let i=0;i<6;i++)c.update(1,Game);`);
check('A clown gives up on a nose blocked by a crate','!c.panicking && c.noseless && Number.isFinite(c.x)');

get(`var c=arena('clownCar');Game.pierre.x=455;var hp=c.health;
  for(let i=0;i<3;i++){Game.pierre.onGround=true;Game.pierre.punch(Game);Game.pierre.strike(Game);}
`);
check('Third quick ground attack is a damaging finisher','Game.pierre.combo===3 && Game.pierre.swingKind==="finisher" && c.health===hp-4');
check('Finisher produces freeze, screen shake and stagger','Game.freeze===CONFIG.combat.finisherFreeze && Game.shake>0 && c.stun>0');
get('Game.pierre.comboTime=0;Game.pierre.punch(Game)');
check('An expired combo starts over','Game.pierre.combo===1');
get('Game.pierre.onGround=false;Game.pierre.punch(Game)');
check('J in the air starts a forward/downward kick','Game.pierre.swingKind==="kick"');
get('var before=Game.rightHand.time;Game.freeze=0.1;Game.update(0.02)');
check('Hit freeze holds simulation timers','Game.rightHand.time===before && Game.freeze<0.1');
get('var c=arena("clownCar");Game.pierre.x=455;');
for(let i=0;i<3;i++) {key('keydown','j');tick(0.06);key('keyup','j');tick(0.02);}
tick(0.7);
check('Three rapid keypresses buffer a full combo through hit freeze','Game.pierre.combo===3 && c.health===5');
get('arena();Game.freeze=0.08;');
key('keydown','j');tick(1/60);key('keyup','j');
check('An attack pressed during hit freeze is buffered','Game.pierre.attackQueue===1 && Game.pierre.punchTimer===0');
tick(0.15);
check('Buffered attack starts after hit freeze without another keypress','Game.pierre.attackQueue===0 && Game.pierre.combo===1');

get('arena();var p=Game.pierre;var k=new Knives(50,470);k.active=true;k.update(0,Game);new Knives(50,470).pickUp(p)');
check('Knife pickups stack independently of melee items','p.knives===10');
get('p.x=400;p.held={kind:"hammer",swings:10};p.invincible=100;');
key('keydown','k');tick(1/60);key('keyup','k');
check('K consumes a knife and preserves the melee weapon','p.knives===9 && p.hasHammer && Game.friendly.length===1');
tick(0.3);check('A straight knife does more than a slap','Game.clowns[0].health===2');
get('arena();var c=Game.clowns[0];Game.panel.walls=[{x:200,y:300,w:40,h:170}];var knife=new Knife(100,400,1);knife.update(1,Game)');
check('Knife cannot tunnel through a solid obstacle','knife.done && c.health===4');
get('arena();var p=Game.pierre;new BalloonSword(0,0).pickUp(p);var hp=Game.clowns[0].health;p.x=455;p.onGround=true;p.punch(Game);p.strike(Game)');
check('Balloon sword is faster/weaker than the beret','p.punchCooldown<CONFIG.pierre.punchCooldown && Game.clowns[0].health===hp-CONFIG.balloonSword.damage');
get('for(let i=1;i<CONFIG.balloonSword.swings;i++)p.punch(Game)');
check('Balloon sword pops when its uses run out','p.held===null && Game.effects.some(e=>e.text==="POP!")');
get('arena();new Pogo(0,0).pickUp(Game.pierre);Game.update(1/60)');
check('Pogo automatically bounces higher than an ordinary jump','Game.pierre.vy===-CONFIG.pogo.jumpSpeed && CONFIG.pogo.jumpSpeed>CONFIG.pierre.jumpSpeed');
get(`var c=arena();new Pogo(0,0).pickUp(Game.pierre);Game.pierre.x=c.x;Game.pierre.y=c.y-c.h-4;
  Game.pierre.vy=300;Game.pierre.onGround=false;Game.update(1/60)`);
check('Landing on a clown with pogo damages it and bounces up','c.health===2 && Game.pierre.vy===-CONFIG.pogo.bounceSpeed');
get('Game.freeze=0;Game.pierre.held.time=0.01;Game.update(0.02)');
check('Pogo expires in game time','Game.pierre.held===null');
for(const kind of ['knives','balloonSword','pogo','slinky','invisibleDog']) {
  get(`arena();var item=makeItem('${kind}',50,470);Game.items=[item];Game.update(1/60);Game.render()`);
  check(`${kind}: cannot be picked up while being drawn`,'!item.taken && Game.items.length===1');
  get('var job=new DrawJob(item,CONFIG.leftHand.drawTime);job.update(CONFIG.leftHand.drawTime);Game.update(1/60);Game.render()');
  check(`${kind}: finished drawing can be picked up through the game loop`,'item.taken && Game.items.length===0');
}
get('arena();new Slinkies(0,0).pickUp(Game.pierre);Game.pierre.punch(Game)');
check('J throws a slinky and consumes one use','Game.pierre.slinkies===2 && Game.friendly[0] instanceof Slinky');
get('var s=new Slinky(420,470,1);var hp=Game.clowns[0].health;for(let i=0;i<60&&!s.done;i++)s.update(1/60,Game)');
check('Slinky walks toward and damages its target','s.done && Game.clowns[0].health===hp-CONFIG.slinky.damage');
get('var s=new Slinky(300,330,1);s.update(0.3,Game)');
check('Slinky falls down ledges','s.y>330');
get('arena();new InvisibleDogItem(0,0).pickUp(Game.pierre);Game.pierre.x=450;Game.dog.x=490;Game.dog.update(0.1,Game)');
check('Invisible Dog runs at nearby clowns and bites','Game.clowns[0].health===3');
get('Game.dog.update(CONFIG.invisibleDog.duration,Game)');
check('Invisible Dog is temporary','Game.dog.done');

get('var c=arena();Game.pierre.x=350;var p=Game.pierre;Game.mime.use("wall",Game)');
check('Invisible Wall materializes with a cooldown','!!Game.mime.wall && Game.mime.cooldowns.wall===CONFIG.mime.wall.cooldown');
get('var wall=Game.mime.wall;var pin=new BowlingPin(500,400,-1000,0);pin.update(0.3,Game)');
check('Invisible Wall blocks straight hostile projectiles','pin.done && pin.x>wall.x');
get('var pie=new Pie(500,400,-500,0);pie.update(0.3,Game)');
check('Invisible Wall blocks pies','pie.splatT===0');
get('var c=makeClown({type:"unicyclist",x:450},Game.surfaces);c.active=true;c.facing=-1;c.update(0.5,Game)');
check('Invisible Wall stops and turns a riding clown','c.x>=wall.x+wall.w+c.w/2 && c.facing===1');
check('Wall cannot be reused during cooldown','!Game.mime.use("wall",Game)');
get('Game.mime.update(CONFIG.mime.wall.duration+0.01)');
check('Wall disappears before its cooldown finishes','Game.mime.wall===null && Game.mime.cooldowns.wall>0');
get('arena();Game.pierre.x=300;Game.pierre.facing=1;var c=Game.clowns[0];var x=c.x;Game.mime.use("rope",Game)');
check('Invisible Rope pulls the nearest clown in front','c.x<x && Game.mime.cooldowns.rope>0');
get('arena();Game.pierre.x=300;Game.pierre.facing=-1');
check('Rope does not select clowns behind Pierre','!Game.mime.use("rope",Game)&&Game.mime.cooldowns.rope===0');
get('Game.mime.use("box",Game);var c=Game.clowns[0];var x=c.x;c.update(1,Game)');
check('Invisible Box stops movement and attacks','c.trapped>0 && c.x===x && Game.pies.length===0');
get('c.update(CONFIG.mime.box.duration+0.1,Game)');
check('Box expires and clown resumes attacking','c.trapped===0 && Game.pies.length===1');

get('Game.restart();Game.pierre.hurt=()=>false');tick(1.2);
get('var cancelled=Game.rightHand.current.thing;var total=Game.totalClowns;var hand=Game.rightHand;var hit=hand.tryHit({left:hand.tip.x+35,right:hand.tip.x+180,top:hand.tip.y-210,bottom:hand.tip.y-40},Game)');
check('Hammer hit interrupts drawing without counting a defeat','hit && hand.state==="hurt" && !Game.clowns.includes(cancelled) && Game.defeated===0 && Game.totalClowns===total');
tick(8);
check('Hand returns and redraws the cancelled clown','Game.clowns.includes(cancelled) && cancelled.active && hand.state==="away"');
get('Game.restart();Game.randomHelpIn=0;Game.pierre.health=10;Game.leftHand.reset();Game.randomHelp(0)');
check('Random assistance queues a drawable non-sandwich item','Game.leftHand.queue.length===1 && Game.leftHand.queue[0].thing instanceof InvisibleDogItem');
get('Game.restart();Game.pierre.invincible=0;Game.pierre.hurt(1,0)');
check('Pierre shows BONK and a silent hurt bubble','Game.pierre.bubbleTime>0 && Game.effects.some(e=>e.text==="BONK!")');
get('Game.loadPanel(17)');tick(4);get('Game.render()');
check('Ending is drawn by a hand on panel 18 while Pierre bows','Game.state==="end" && Game.lettering.active && Game.endTime>0');
key('keydown','r');tick(1/60);key('keyup','r');
check('Restart clears items, helpers and power cooldowns','Game.state==="play" && Game.panelIndex===0 && Game.pierre.knives===0 && Game.pierre.held===null && Game.dog===null && Object.values(Game.mime.cooldowns).every(v=>v===0)');
get('Sound.unlock();Sound.play("honk")');
check('Unsupported audio is harmless','Sound.ctx===null');
get(`var started=0,stopped=0;
  window.AudioContext=class {
    constructor(){this.state='running';this.currentTime=0;this.destination={};}
    createOscillator(){return {frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},start(){started++;},stop(){stopped++;}};}
    createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}
  };
  Sound.unlock();for(const cue of ['honk','squeak','pop','scratch'])Sound.play(cue);`);
check('All four sound cues create short-lived local audio nodes','started===4 && stopped===4');
get('Sound.enabled=false;Sound.play("honk")');
check('Mute suppresses new sound nodes','started===4');
console.log(`\n${checks} expansion checks passed`);
