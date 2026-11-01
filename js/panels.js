// The page's six panels, as data (spec 5.2 and section 8), so panels can be
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
      'Arrows or A / D: walk.  Space, W or Up: jump.  J: punch.',
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
    // A staircase up to the right, Pie Tossers on the two top steps.
    platforms: [{ x: 120, y: 370, w: 130 }, { x: 320, y: 280, w: 140 }, { x: 540, y: 190, w: 150 }, { x: 740, y: 330, w: 130 }],
    clowns: [
      { type: 'pieTosser', x: 390, on: 1 },
      { type: 'pieTosser', x: 615, on: 2 },
      { type: 'unicyclist', x: 560 },
    ],
  },
  {
    // Crowded: clowns on every level.
    crowded: true,
    platforms: [{ x: 120, y: 360, w: 160 }, { x: 350, y: 260, w: 140 }, { x: 560, y: 180, w: 130 }, { x: 720, y: 350, w: 150 }],
    clowns: [
      { type: 'pieTosser', x: 625, on: 2 },
      { type: 'unicyclist', x: 450 },
      { type: 'pieTosser', x: 830 },
      { type: 'unicyclist', x: 200, on: 0 },
      { type: 'unicyclist', x: 795, on: 3 },
    ],
  },
  {
    // A valley: high ground on both sides, Pie Tossers up top.
    platforms: [{ x: 110, y: 280, w: 150 }, { x: 300, y: 370, w: 140 }, { x: 500, y: 370, w: 140 }, { x: 690, y: 270, w: 160 }],
    clowns: [
      { type: 'unicyclist', x: 470 },
      { type: 'pieTosser', x: 185, on: 0 },
      { type: 'unicyclist', x: 570, on: 2 },
      { type: 'pieTosser', x: 770, on: 3 },
    ],
  },
  {
    // Panel 6: THE END. No clowns.
    theEnd: true,
    platforms: [],
    clowns: [],
  },
];
