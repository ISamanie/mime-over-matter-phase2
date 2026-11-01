// All the tuning values in one place (spec section 8). Times are in seconds,
// distances in pixels, speeds in pixels per second. Positions inside a panel
// are measured from the panel's top-left corner.
const CONFIG = {
  canvas: { width: 960, height: 640 },
  panel: { x: 30, y: 72, w: 900, h: 540, border: 9 },
  groundY: 470,            // top of the floor, in panel coordinates
  gravity: 2000,
  gateWidth: 22,           // the ink line blocking the right edge

  pierre: {
    w: 40, h: 124,         // hit box
    startX: 50,            // where he enters each panel
    speed: 260,
    jumpSpeed: 860,        // jumps about 185 px high
    jumpCut: 0.45,         // upward speed kept when Jump is let go early
    maxHealth: 10,         // about ten hits
    punchDamage: 1,        // the beret slap (it replaces a plain punch)
    punchRange: 48,        // reach in front of his body, beret included
    punchCooldown: 0.3,
    punchShow: 0.2,        // how long the swing animation lasts
    strikeDelay: 0.1,      // the hit lands this far into a swing
    invincible: 1.0,       // flashing after a hit
    knockbackX: 300,
    knockbackY: 320,
    knockbackLock: 0.25,   // no control for this long after a hit
  },
  clowns: {
    unicyclist: { w: 50, h: 150, health: 2, speed: 150, contactDamage: 1 },
    pieTosser: { w: 60, h: 150, health: 4, throwEvery: 2.6, firstThrow: 0.5, windup: 0.5 },
    hitFlash: 0.2,         // a hit clown flickers for this long
    hitStun: 0.25,         // and stops moving for this long
    hitPush: 12,           // and gets pushed back this far
    noseChance: 0.35,      // chance a hit that doesn't defeat a clown knocks its nose off
    noseGiveUp: 5,         // a clown that can't reach its nose gives up after this long
    chaseSpeed: { unicyclist: 220, pieTosser: 120 },   // scrambling after a lost nose
    shouts: ['HONK!', 'HAW HAW!', 'NICE FACE PAINT!', 'SAY SOMETHING!'],
    bubbleTime: 1.4,       // how long a speech bubble stays up
  },
  nose: { r: 7, bounce: 0.45, launchUp: 480, launchSide: [80, 160] },
  pie: {
    w: 30, h: 14,
    damage: 1,
    gravity: 1300,
    flightPerPixel: 1 / 450, minFlight: 0.6, maxFlight: 1.3,  // longer throws fly longer
    splatTime: 0.6,
  },
  // The cartoonist's hands (spec 5.3 and 5.5). drawTime is per thing drawn.
  rightHand: { drawTime: 2.0, speed: 1300, enterDelay: 0.4, lineWidth: 4 },
  leftHand: { drawTime: 1.2, speed: 1000, enterDelay: 0, lineWidth: 6, wobble: 5 },
  hammer: {
    damage: 3,             // a punch does 1
    range: 66,             // reaches further than a punch
    cooldown: 0.45,        // slower than a punch
    show: 0.2,
    push: 30,              // knocks clowns back further
    swings: 10,            // breaks after this many swings, hit or miss
  },
  pageTurn: {
    zoomOut: 0.6,          // from the panel out to the whole page
    hold: 0.7,             // on the page while the reading arrow draws
    zoomIn: 0.6,           // into the next panel
  },
  drawing: {
    outlineShare: 0.6,     // the outline takes 60% of a drawing, color the rest
  },
  burstTime: 0.4,          // how long "POW!" and friends stay up
  sandwich: {
    lowHealth: 3,          // the left hand draws a sandwich at or below this
    heal: 4,               // about four hits' worth
    cooldown: 10,          // at least this long between low-health sandwiches
  },
};
