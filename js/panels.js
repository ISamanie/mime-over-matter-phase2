// The panels, as data (spec 5.2 and section 8), so panels can be
// added or rebalanced without touching game code.
//
// Positions are in panel coordinates: the panel is CONFIG.panel.w wide, and
// the top of the ground is at CONFIG.groundY. Platforms are {x, y, w}, with
// y the platform's top; Pierre can jump up through them and land on top.
// A clown is {type, x}, standing on the ground, or {type, x, on: n},
// standing on platform n. The right hand draws the clowns in the order
// listed. A `crowded` panel gets an item from the left hand first (spec 5.5).
// `caption` lines show in a yellow caption box at the top left.
// Every fighting panel has risers at two or more heights (spec 9.2). Keep
// each step up within Pierre's jump: about 120 px up, and no more than about
// 100 px across a gap (tests/smoke.js checks this).
const PANELS = [
  {
    // Panel 1: tutorial. A two-step climb to practice jumping.
    platforms: [{ x: 300, y: 370, w: 150 }, { x: 520, y: 280, w: 150 }],
    clowns: [{ type: 'unicyclist', x: 720 }],
    caption: [
      'Meanwhile, at KlownKon...',
      'Arrows or A / D: walk.  Space, W or Up: jump.  J: slap.',
      'Beat every clown to wipe away the ink line on the right.',
    ],
  },
  {
    // A hill: up the middle to reach the Pie Tosser on top.
    platforms: [{ x: 200, y: 360, w: 140 }, { x: 410, y: 270, w: 170 }, { x: 650, y: 360, w: 150 }],
    clowns: [
      { type: 'pieTosser', x: 495, on: 1 },
      { type: 'unicyclist', x: 600 },
    ],
  },
  {
    // Solo introductions before mixing any new act (spec 9.2 / 48).
    platforms: [{ x: 240, y: 365, w: 160 }, { x: 490, y: 270, w: 170 }],
    clowns: [{ type: 'seltzerSpritzer', x: 650 }],
    caption: ['Seltzer Spritzer!', 'Get close for a slap, or jump over the spray.'],
  },
  {
    platforms: [{ x: 160, y: 370, w: 150 }, { x: 380, y: 280, w: 150 }, { x: 620, y: 370, w: 170 }],
    clowns: [{ type: 'juggler', x: 690, on: 2 }],
    caption: ['Juggler!', 'Those pins fly straight. Jump or use the risers as cover.'],
  },
  {
    platforms: [{ x: 180, y: 365, w: 180 }, { x: 440, y: 270, w: 170 }],
    clowns: [{ type: 'balloonTwister', x: 660 }],
    caption: ['Balloon Twister!', 'Slap the chasing dogs to pop them. Catch their maker!'],
  },
  {
    crowded: true,
    platforms: [{ x: 150, y: 370, w: 150 }, { x: 370, y: 275, w: 180 }, { x: 650, y: 375, w: 160 }],
    clowns: [{ type: 'clownCar', x: 690 }],
    caption: ['Clown Car!', 'Smash the car to stop the minis. Then clear the stragglers.'],
  },
  {
    // Mixed acts, after their solo debuts. A staircase up to the right.
    walls: [{x:260,y:400,w:60,h:70}],
    hazards: [{type:'banana',x:690,y:470,w:32},{type:'conveyor',x:80,y:470,w:140,dir:1}],
    caption: ['Backstage: mind the props!', 'Crates are solid. Jump over peels and moving belts.'],
    platforms: [{ x: 120, y: 370, w: 130 }, { x: 320, y: 280, w: 140 }, { x: 540, y: 190, w: 150 }, { x: 740, y: 330, w: 130 }],
    clowns: [
      { type: 'juggler', x: 390, on: 1 },
      { type: 'pieTosser', x: 615, on: 2 },
      { type: 'seltzerSpritzer', x: 560 },
    ],
  },
  {
    // Crowded: clowns on every level.
    crowded: true,
    walls:[{x:300,y:395,w:60,h:75}],
    hazards:[{type:'banana',x:660,y:470,w:32},{type:'trapdoor',x:420,y:365,w:100}],
    platforms: [{ x: 120, y: 360, w: 160 }, { x: 350, y: 260, w: 140 }, { x: 560, y: 180, w: 130 }, { x: 720, y: 350, w: 150 }],
    clowns: [
      { type: 'pieTosser', x: 625, on: 2 },
      { type: 'balloonTwister', x: 450 },
      { type: 'pieTosser', x: 830 },
      { type: 'unicyclist', x: 200, on: 0 },
      { type: 'juggler', x: 795, on: 3 },
    ],
  },
  {
    // A valley: high ground on both sides.
    walls:[{x:620,y:390,w:60,h:80}],
    hazards:[{type:'conveyor',x:250,y:470,w:140,dir:-1},{type:'banana',x:730,y:470,w:32}],
    platforms: [{ x: 110, y: 280, w: 150 }, { x: 300, y: 370, w: 140 }, { x: 500, y: 370, w: 140 }, { x: 690, y: 270, w: 160 }],
    clowns: [
      { type: 'clownCar', x: 470 },
      { type: 'pieTosser', x: 185, on: 0 },
      { type: 'unicyclist', x: 570, on: 2 },
      { type: 'balloonTwister', x: 770, on: 3 },
    ],
  },
  {
    // Backstage hazard run: reading the traps matters more than combat.
    traversal:true,
    platforms:[{x:130,y:365,w:140},{x:560,y:355,w:140}],
    walls:[{x:300,y:390,w:70,h:80},{x:730,y:375,w:60,h:95}],
    hazards:[{type:'banana',x:420,y:470,w:32},{type:'trapdoor',x:360,y:365,w:140},{type:'conveyor',x:520,y:470,w:160,dir:-1}],
    clowns:[],
    caption:['The prop department!', 'The ink line is gone. Time your jumps across the trapdoor.'],
  },
  {
    crowded:true,gift:'pogo',
    platforms:[{x:100,y:370,w:130},{x:300,y:265,w:150},{x:530,y:170,w:160},{x:730,y:300,w:140}],
    walls:[{x:450,y:395,w:60,h:75}],
    hazards:[{type:'banana',x:650,y:470,w:32},{type:'conveyor',x:240,y:470,w:150,dir:1}],
    clowns:[{type:'pieTosser',x:610,on:2},{type:'juggler',x:800,on:3},{type:'unicyclist',x:350}],
    caption:['A spring in his step...', 'The pogo jumps higher. Land on a clown for a bounce!'],
  },
  {
    crowded:true,gift:'slinky',
    platforms:[{x:160,y:360,w:160},{x:420,y:260,w:150},{x:660,y:350,w:170}],
    walls:[{x:340,y:390,w:60,h:80}],
    hazards:[{type:'trapdoor',x:460,y:375,w:110},{type:'banana',x:580,y:470,w:32}],
    clowns:[{type:'balloonTwister',x:760},{type:'seltzerSpritzer',x:500},{type:'pieTosser',x:490,on:1}],
    caption:['Loose springs!', 'J sends a slinky after the nearest clown. It walks down ledges.'],
  },
  {
    crowded:true,gift:'knives',
    platforms:[{x:110,y:370,w:180},{x:370,y:280,w:170},{x:650,y:370,w:180}],
    walls:[{x:300,y:400,w:55,h:70}],
    hazards:[{type:'conveyor',x:450,y:470,w:140,dir:1},{type:'banana',x:720,y:470,w:32}],
    clowns:[{type:'juggler',x:730,on:2},{type:'pieTosser',x:460,on:1},{type:'unicyclist',x:630}],
    caption:['Under the big top!', 'K throws a knife. L, U and I perform your mime powers.'],
  },
  {
    traversal:true,
    platforms:[{x:100,y:360,w:140},{x:320,y:255,w:150},{x:570,y:170,w:140},{x:750,y:345,w:120}],
    walls:[{x:480,y:390,w:70,h:80}],
    hazards:[{type:'trapdoor',x:260,y:360,w:110},{type:'banana',x:700,y:470,w:32},{type:'conveyor',x:100,y:470,w:180,dir:-1}],
    clowns:[],caption:['The trapeze shortcut!', 'Climb or cross the floor. Watch the trapdoor.'],
  },
  {
    crowded:true,gift:'invisibleDog',
    platforms:[{x:150,y:370,w:170},{x:400,y:275,w:160},{x:650,y:365,w:180}],
    walls:[{x:340,y:400,w:50,h:70}],
    hazards:[{type:'banana',x:580,y:470,w:32},{type:'conveyor',x:680,y:470,w:140,dir:-1}],
    clowns:[{type:'clownCar',x:710},{type:'balloonTwister',x:500},{type:'pieTosser',x:480,on:1}],
    caption:['Good invisible dog!', 'Only the collar and stiff leash show. The bites are real.'],
  },
  {
    crowded:true,
    platforms:[{x:120,y:360,w:150},{x:330,y:260,w:140},{x:550,y:175,w:160},{x:740,y:355,w:130}],
    gift:'balloonSword',
    walls:[{x:470,y:395,w:60,h:75}],
    hazards:[{type:'trapdoor',x:300,y:365,w:130},{type:'conveyor',x:620,y:470,w:160,dir:1}],
    clowns:[{type:'seltzerSpritzer',x:620},{type:'juggler',x:630,on:2},{type:'pieTosser',x:805,on:3},{type:'unicyclist',x:195,on:0}],
    caption:['The last laugh?', 'Three quick slaps finish with a shove. J in the air kicks.'],
  },
  {
    crowded:true,
    platforms:[{x:100,y:370,w:150},{x:310,y:280,w:150},{x:520,y:370,w:150},{x:720,y:275,w:140}],
    walls:[{x:470,y:390,w:50,h:80}],
    hazards:[{type:'banana',x:300,y:470,w:32},{type:'trapdoor',x:650,y:370,w:100},{type:'conveyor',x:100,y:470,w:170,dir:1}],
    clowns:[{type:'clownCar',x:700},{type:'juggler',x:790,on:3},{type:'pieTosser',x:385,on:1},{type:'balloonTwister',x:600},{type:'unicyclist',x:175,on:0}],
    caption:['Big Top Brawl: final act!', 'Clear every clown and make your silent exit.'],
  },
  {
    // Panel 18: THE END.
    theEnd: true,
    platforms: [],
    clowns: [],
  },
];

// Page identity stays beside the encounter data; all 18 panels use the same
// logical coordinate system and the same combat/drawing rules.
PANELS.forEach((panel,index)=>{
  panel.page=Math.floor(index/6);
  panel.setting=['convention','backstage','bigTop'][panel.page];
});
