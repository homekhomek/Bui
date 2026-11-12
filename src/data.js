// data.js — ALL numbers and game data live here.
// Stats, costs, timings, sizes, unit definitions, wave tables, etc.
// Components and logic should import values from here instead of hardcoding them.

export const GAME = {
  version: "0.1.0",
};

// Rendering scale: the UI scales with the window's height. Every key ending
// in "Px" in a sized() block is an on-screen size, written here at full size;
// reading it gives it times the current scale (rounded to whole px). Art is
// SVG, so it stays crisp at any scale. Tailwind's spacing and rounding classes
// follow it too (the root font size is UI.remPx), and so do TEXT_SIZES.
// scale = window height / designHeight, kept between min and max.
export const UI_SCALE = {
  designHeight: 1200, // a window this tall (a 1080p screen's browser) shows everything at full size
  min: 0.5,
  max: 2, // e.g. 4K screens
};

let scale = 1;
export const uiScale = () => scale;
// Set the scale for a window of this height; returns whether it changed.
export function fitUiScale(windowHeight) {
  const next = Math.min(
    UI_SCALE.max,
    Math.max(UI_SCALE.min, windowHeight / UI_SCALE.designHeight),
  );
  const changed = next !== scale;
  scale = next;
  return changed;
}
export const px = (n) => Math.max(1, Math.round(n * scale));

// Turns every numeric "...Px" key of obj into a scaled size (see above).
const FULL = new WeakMap();
function sized(obj) {
  FULL.set(obj, { ...obj });
  for (const [key, full] of Object.entries(obj)) {
    if (!key.endsWith("Px") || typeof full !== "number") continue;
    Object.defineProperty(obj, key, { get: () => px(full), enumerable: true });
  }
  return obj;
}
// A size as written here, unscaled (for art-scale math that must not depend
// on the window), e.g. fullPx(INVENTORY, "cellPx").
export const fullPx = (obj, key) => FULL.get(obj)[key];

export const UI = sized({
  remPx: 16, // root font size: what Tailwind's spacing / rounding classes are based on
  // The one stroke width for the whole app: borders, outlines, SVG strokes.
  // Use UI.strokePx in code, or the border-stroke class in markup.
  strokePx: 3,
  // Every effect / symbol icon (art in public/assets/effects) is drawn at this
  // one size everywhere: effect rows, symbols in text and metrics ({charge},
  // {hp}, {lvl}), status counters. At node-art scale (a 56px tile = 70 art
  // units), 36px is a 45x45 art canvas.
  iconPx: 36,
});

// Corner rounding: the only two roundings in the game (Tailwind classes
// rounded-tile and rounded-panel; rounded-full is left for pills/circles).
//   tile:  grid cells, node tiles, equipment, buttons, chips, effect rows
//   panel: boxes that hold other things (cards, tooltips, the run display)
export const CORNERS = sized({
  tilePx: 6,
  panelPx: 12,
});

export const LAYOUT = sized({
  maxWidthPx: 1280, // width of the centered game area (fits two max-size fighters)
});

// ---------------------------------------------------------------------------
// Battle simulation
// ---------------------------------------------------------------------------

export const BATTLE = {
  maxSeconds: 300, // safety cap; a battle still running after this is a draw
};

// Easing for all node slides: starts fast, settles quickly (snappy).
export const ANIM = {
  ease: "cubic-bezier(0.16, 1, 0.3, 1)",
};

// Visual queue playback
export const PLAYBACK = {
  speeds: [0.25, 0.5, 1, 2, 4, 8], // speed multipliers offered to the player
  defaultSpeed: 1,
  moveAnimMs: 120, // node slide animation length at 1x (divided by speed)
};

// Inventory grid rendering
export const INVENTORY = sized({
  cellPx: 56, // size of one equipment square / node tile
  gapPx: 2, // gap between tiles (connected node tiles bridge it)
  unchargedOpacity: 0.6, // how washed out the uncharged part of a node is
  // Equipment's double border: two lines, each UI.strokePx thick (like a
  // node's border), with equipmentGapPx between them.
  equipmentGapPx: 1.5,
  pipRadiusPx: 5, // level pips drawn on upgraded nodes
  pipGapPx: 3,
  pipInsetPx: 8, // pip distance from the node's top-left corner
  slotSymbolScale: 0.62, // {slot} symbol size, relative to UI.iconPx
});

// The health bar on fighters in battle, behind the health metric (centered).
export const HEALTH_BAR = {
  heightRatio: 0.5, // the bar's height, relative to the metric's
};

// Effect rows (icon, name, number) shown wherever a node's effects are listed
export const EFFECT_ROW = sized({
  paddingXPx: 8,
  paddingYPx: 4,
  gapPx: 8, // between icon, name and number
  minWidthPx: 200,
});

// Metric displays: small bordered boxes holding one stat (e.g. 10 {charge}/s)
export const METRIC = sized({
  paddingXPx: 8,
  paddingYPx: 2,
});

// Rarity badges: a rarity's name in a box tinted its color (same everywhere)
// Badges (rarity, and the type badge in tooltips)
export const BADGE = sized({
  paddingXPx: 12,
  paddingYPx: 6,
  // The type badge's tint, by kind (rarity badges use the rarity's color)
  typeColors: {
    node: "pink",
    equipment: "cream",
    fighter: "sky",
    effect: "orchid",
  },
});

// Status counters on fighters in battle (icon + count, see STATUSES)
export const STATUS_COUNTER = sized({
  paddingXPx: 6,
  paddingYPx: 2,
  gapPx: 4,
});

// Selecting a node or piece of equipment (click it): a border drawn over its
// own, which starts at fromScale times its size and quickly shrinks onto it.
export const SELECT = sized({
  borderPx: 6, // exception to UI.strokePx: the selection border
  fromScale: 1.25,
  animMs: 140,
});

// App-wide tooltips (see src/ui/tooltip)
export const TOOLTIP = sized({
  gapPx: 12, // space between the hovered thing and its tooltip
  edgePx: 8, // minimum distance from the window edge
  minWidthPx: 300, // so effect rows have room
  maxWidthPx: 400,
  fadeOutMs: 120, // tooltips open instantly and fade out this fast
});

// Explore / edit phase
export const EXPLORE = sized({
  bobMs: 2400, // floating things (nodes, equipment, encounter cards) gently bob; one full cycle
  bobPx: 6, // bob height
  bobStagger: 1 / 3, // neighbours bob this fraction of a cycle apart
  // The top area (encounter, things to take, Continue / Fight) spans the
  // window and is always exactly this tall, so the fighters below it never
  // move. Raise it if its content ever grows past it (it would then overlap
  // the fighters).
  topAreaPx: 300,
  infoMaxWidthPx: 420, // its upper-left text (what this is) wraps at this width
  topGapPx: 24, // between things in the top area's center
  fightersGapPx: 16, // between the top area and the fighters
});

export const EDIT = sized({
  moveAnimMs: 130, // drop / bump slide animation length
  dragThreshold: 5, // screen px (not scaled) of pointer travel before a press becomes a drag (less = a click, which selects)
  ghostOpacity: 0.3, // opacity of a node's original spot while it is being dragged
  previewOpacity: 0.5, // opacity of the drop preview highlight
  upgradeOutlinePx: 5, // exception to UI.strokePx: highlight around a node a drop would upgrade
  popScale: 1.15, // a node briefly grows when it levels up
  popMs: 220,
});

// Admin dashboard (dev only, never in player builds; see src/admin)
export const ADMIN = sized({
  maxWidthPx: 1800, // the admin page may use more of the screen than the game
  explorerWidthPx: 440, // the entity explorer (search + list) column
  explorerHeightPx: 640, // the scrolling list's height
  thumbPx: 48, // thumbnails in the explorer list
  thumbMinTiles: 3, // small nodes are drawn as if at least this many tiles across
  shapeCellPx: 36, // one tile in the shape editor
  swatchPx: 32, // palette color swatches
  swatchColumns: 12,
  flashMs: 1500, // how long "Copied!" stays up
  newNode: {
    maxCharge: 10,
    color: "mint",
    effect: { keyword: "attack", value: 1, upgradeDelta: 1 },
  },
  newEquipment: { nodeSlots: 4, chargeRate: 10, hp: 5, color: "cream" },
  newTemplate: { baseHp: 10, maxEquipment: 3 },
});

// Encounter cards and panels (the choices between battles)
export const ENCOUNTER_UI = sized({
  cardWidthPx: 320,
  slotPx: 140, // the box a node is dragged into, for encounters that need one
  slotPaddingPx: 16,
});

// The run display: the whole run as a line of battle and encounter icons
// (public/assets/gui), always shown at the top of the screen, over the page.
// Icons and the line tiles between them are each one node tile
// (INVENTORY.cellPx; 70x70 in the art). The run is wider than the screen, so
// the strip slides to keep the current step in the middle.
export const RUN_DISPLAY = sized({
  currentScale: 1.25, // the current step is drawn this much bigger, and bobs
  slideMs: 400, // how long the strip takes to slide to a new current step
  // Line tiles tuck under the icons on each side by this much (art units, of
  // 70): line.svg's stroke is a little shorter than its tile, so this pulls
  // the icons closer together.
  lineOverlapArt: 30,
  paddingXPx: 16,
  paddingYPx: 8,
  topPx: 8, // distance from the top of the screen
  sidePx: 8, // distance from the screen's left and right edges (the explore top area lines up with it)
  // The page keeps the display's height (plus this) free at its top, so the
  // display never covers anything until the page scrolls under it.
  belowPx: 8,
});

// ---------------------------------------------------------------------------
// Game data
// Colors are Saccharide palette names (see index.css).
// ---------------------------------------------------------------------------

// Hard size limits. No fighter's maxEquipment may exceed maxEquipment, and no
// equipment's nodeSlots may exceed maxNodeSlots (largest inventory: 6 x 6).
// No node shape may be wider or taller than maxNodeSize tiles (more than the
// largest inventory could never be placed).
export const LIMITS = {
  maxEquipment: 6,
  maxNodeSlots: 6,
  maxNodeSize: 6,
};

// Fighter sprites: SVGs in public/assets/fighters, drawn on a sizeArt x sizeArt
// canvas on which one node tile is tileArt across. The fighter's body fills the
// bodyArt x bodyArt square at the bottom middle; the rest of the canvas is room
// for details that overflow it (drawn, but given no layout space). Sprites are
// scaled so their tiles match the inventory's node tiles (INVENTORY.cellPx).
export const SPRITE = sized({
  sizeArt: 350,
  tileArt: 70, // one node tile in art units (also the scale of node art templates)
  bodyArt: 210,
  cardOverlapPx: 12, // how far the fighter card overlaps the bottom of the sprite's body (card in front)
});

// Particles: one canvas over the whole screen (src/ui/particles) that draws
// small sprites, built to keep 100+ on screen at once. Sprites are
// public/assets/gui/particles/<name>.svg, sizeArt x sizeArt art units drawn to
// scale (a node tile is SPRITE.tileArt; 45 units = UI.iconPx, the size of
// inline symbols). Each burst gives its sprites one palette color: the art's
// currentColor fill takes it, and its border keeps its own color.
//
// effects: what each kind of burst looks like. Speeds are px at full UI scale
// (scaled with the UI), times in ms (in battle, also divided by the playback
// speed). Two kinds:
//   Particle bursts: count random sprites burst out from a point.
//     count             particles per burst
//     color             a palette color
//     speed [min, max]  px/s, in random directions within spreadDeg of the
//                       burst's direction (360 = all around)
//     gravity           px/s^2 pulling down; drag = speed lost per second (0..1)
//     lifeMs [min,max]  how long each lives (fading out from fadeFrom of its life)
//     scale [min,max]   size, times the sprite's art size; spin = max deg/s
//   Image flashes (image: true): one picture (e.g. a node's art, at its
//   in-game size and in its own colors) appears at a random rotation (up to
//   rotateDeg either way), grows from scale[0] to scale[1], rises risePx and
//   fades out over lifeMs (from fadeFrom of its life).
export const PARTICLES = {
  sprites: ["part1", "part2", "part3"],
  sizeArt: 45,
  maxAlive: 400, // the oldest go first past this
  effects: {
    // A node's attack: the node's art flashes on the fighter it hits...
    attackFlash: {
      image: true,
      lifeMs: 320,
      scale: [0.9, 1.6],
      rotateDeg: 180, // any angle
      fadeFrom: 0.2,
    },
    // ...while bits fly off that fighter (see also HIT).
    attackHit: {
      count: 6,
      color: "white",
      speed: [450, 1000],
      spreadDeg: 140,
      gravity: 500,
      drag: 0.6,
      lifeMs: [250, 450],
      fadeFrom: 0.5,
      scale: [1, 1], // drawn to scale (45 art units: inline-icon size)
      spin: 540,
    },
    // A node's effect on its own fighter (shield, heal, strengthen, ...): the
    // node's art rises off that fighter and fades. No particles.
    selfRise: {
      image: true,
      lifeMs: 550,
      scale: [1, 1],
      rotateDeg: 0,
      risePx: 90,
      fadeFrom: 0.3,
    },
    // A node is strengthened (strengthen, strengthen all): the effect's icon
    // flashes on it, growing and fading.
    boostFlash: {
      image: true,
      lifeMs: 320,
      scale: [1, 1.8],
      rotateDeg: 20,
      fadeFrom: 0.2,
    },
    // A node goes up a level (however it happened): a small green burst on it.
    upgrade: {
      count: 5,
      color: "mint",
      speed: [350, 650],
      spreadDeg: 360,
      gravity: 150,
      drag: 0.8,
      lifeMs: [250, 400],
      fadeFrom: 0.4,
      scale: [1, 1],
      spin: 360,
    },
  },
};

// A fighter's sprite when hit: it shakes sideways (settling down) and a
// sprite-shaped flash of flashColor appears and quickly fades.
export const HIT = sized({
  shakePx: 6,
  shakeMs: 260,
  shakes: 4, // back-and-forth swings
  flashColor: "white",
  flashMs: 180,
});

// Rarities, from most to least common. Every node and piece of equipment has
// one. weight = how likely an offer slot is to roll that rarity (relative to the
// others); color = the palette color of its badge. Name: 'rarity.<id>' in
// translate.js.
export const RARITIES = {
  common: { id: "common", weight: 65, color: "mist" },
  uncommon: { id: "uncommon", weight: 30, color: "mint" },
  rare: { id: "rare", weight: 5, color: "lavender" },
};

// Equipment sits in a column on the left of the inventory. icon (optional) =
// file name in public/assets/equipment; without one the tile is a plain color. Each piece opens a
// row of nodeSlots tiles to its right. rarity = a RARITIES id. Nodes touching it (column 0 of its row)
// gain chargeRate charge per second (rates from several rows add up).
// hp is added to the max HP of the fighter it is equipped on. rarity = a RARITIES id.
export const EQUIPMENT = {
  bluefur: {
    id: "bluefur",
    nodeSlots: 3,
    chargeRate: 10,
    hp: 10,
    color: "ice",
    rarity: "common",
    icon: "bluefur",
  },
  redplate: {
    id: "redplate",
    nodeSlots: 4,
    chargeRate: 10,
    hp: 20,
    color: "shell",
    rarity: "uncommon",
    icon: "redscale",
  },
  leafnecklace: {
    id: "leafnecklace",
    nodeSlots: 2,
    chargeRate: 20,
    hp: 5,
    color: "sage",
    rarity: "common",
    icon: "leafnecklace",
  },
  pack: {
    id: "pack",
    nodeSlots: 6,
    chargeRate: 5,
    hp: 5,
    color: "cream",
    rarity: "uncommon",
    icon: "knapsack",
  },
  powerstone: {
    id: "powerstone",
    nodeSlots: 1,
    chargeRate: 40,
    hp: 10,
    color: "lavender",
    rarity: "rare",
    icon: "energystone",
  },
};

// Status counters: stacks a fighter carries during a battle, shown as the icon
// (file name in public/assets/effects) with the count. Battle-only: every
// fighter starts each battle with none. Name / description: 'status.<id>' and
// 'statusTip.<id>' in translate.js.
//   shield: each counter blocks 1 damage, and is used up doing so.
export const STATUSES = {
  shield: { id: "shield", icon: "shield", color: "ice" },
  // Each counter makes the fighter's next attack effect deal damageBonus more
  // (0.5 = 50%), then one counter is used up.
  focus: { id: "focus", icon: "focus", color: "orchid", damageBonus: 0.5 },
};

// Effect keywords. icon = file name in public/assets/effects; color = the
// palette color its box is tinted (matches the icon's own fill).
// status (optional) = the status counter the effect gives its own fighter, one
// counter per point of value.
// boosts (optional) = a keyword this effect strengthens: for the rest of the
// battle, every effect of that keyword on the same node gets +value.
export const KEYWORDS = {
  attack: { id: "attack", icon: "attack", color: "rose" }, // red
  shield: { id: "shield", icon: "shield", color: "ice", status: "shield" }, // blue
  focus: { id: "focus", icon: "focus", color: "orchid", status: "focus" }, // pink-purple
  heal: { id: "heal", icon: "heal", color: "sage" }, // green
  strengthen: {
    id: "strengthen",
    icon: "strengthen",
    color: "peach",
    boosts: "attack",
  }, // peach
  // Like strengthen, but every node of the fighter gets it (allNodes).
  strengthenAll: {
    id: "strengthenAll",
    icon: "strengthenAll",
    color: "peach",
    boosts: "attack",
    allNodes: true,
  },
};

// Charge is always shown as its symbol, never the word ({charge} in strings).
export const CHARGE = { icon: "charge", color: "cream" };

// HP is likewise always shown as its symbol ({hp} in strings): the heal icon.
export const HP = { icon: "heal" };

// A node's level is shown as its symbol ({lvl} in strings).
export const LEVEL = { icon: "lvl" };

// Nodes are tetris-like pieces. shape = [x, y] tile offsets from the node's
// position (rarity = a RARITIES id). icon (optional) = file name in
// public/assets/nodes, drawn from the admin's art template so it fits the shape
// exactly; without one the node is a plain color. At maxCharge the node runs its effects in order, then teleports to
// the far right and slides back left (gravity), joining the back of the queue.
//
// effects: what the node does, in order. Each effect is
//   { keyword, value, upgradeDelta? }
// keyword: attack (damage the first living enemy; shield counters block it),
// shield (gain that many shield counters), heal (self), strengthen (this
// node's attacks deal that much more for the rest of the battle),
// strengthenAll (every node of the fighter's attacks deal that much more for
// the rest of the battle).
// value at a given level = value + upgradeDelta * (level - 1).
// A node with any upgradeDelta can be upgraded by dropping another node of the
// same type and level onto it.
export const NODES = {
  redgrassblade: {
    id: "redgrassblade",
    shape: [
      [0, 0],
      [1, 0],
      [2, 0],
    ],
    maxCharge: 28,
    color: "pink",
    rarity: "uncommon",
    icon: "redgrassblade",
    effects: [
      { keyword: "attack", value: 8, upgradeDelta: 4 },
      { keyword: "focus", value: 2, upgradeDelta: 1 },
    ],
  },
  stalkclub: {
    id: "stalkclub",
    shape: [
      [0, 0],
      [1, 0],
      [2, 0],
    ],
    maxCharge: 32,
    color: "pink",
    rarity: "common",
    icon: "stalkclub",
    effects: [{ keyword: "attack", value: 12, upgradeDelta: 3 }],
  },
  claw: {
    id: "claw",
    shape: [[0, 0]],
    maxCharge: 9,
    color: "pink",
    rarity: "common",
    icon: "claw",
    effects: [{ keyword: "attack", value: 2, upgradeDelta: 1 }],
  },
  bite: {
    id: "bite",
    shape: [
      [0, 0],
      [0, 1],
    ],
    maxCharge: 17,
    color: "pink",
    rarity: "common",
    effects: [{ keyword: "attack", value: 4, upgradeDelta: 2 }],
  },
  block: {
    id: "block",
    shape: [
      [0, 0],
      [1, 0],
    ],
    maxCharge: 19,
    color: "sky",
    rarity: "common",
    icon: "block",
    effects: [{ keyword: "shield", value: 3, upgradeDelta: 2 }],
  },
  battlestance: {
    id: "battlestance",
    shape: [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ],
    maxCharge: 35,
    color: "mauve",
    rarity: "common",
    icon: "battlestance",
    effects: [{ keyword: "strengthenAll", value: 2, upgradeDelta: 2 }],
  },
};

// Fighter templates: every fighter in the game, ready-made with its equipment
// and nodes. Used for starting builds (RUN.startingTeam) and for enemies
// (ENEMIES). Name: 'fighter.<id>' in translate.js.
//   sprite        file name in public/assets/fighters (see SPRITE)
//   baseHp        the fighter's own HP; each equipped piece adds its hp on top
//   maxEquipment  how many pieces it can hold (at most LIMITS.maxEquipment)
//   equipment     starting equipment, top to bottom
//   nodes         starting nodes; x/y in the inventory grid (row y = equipment y),
//                 level optional (default 1)
export const FIGHTER_TEMPLATES = {
  ant: {
    id: "ant",
    sprite: "ant",
    baseHp: 10,
    maxEquipment: 4,
    equipment: ["redplate", "redplate"],
    nodes: [{ node: "redgrassblade", x: 0, y: 0 }],
  },
  maxed: {
    id: "maxed",
    sprite: "ant",
    baseHp: 10,
    maxEquipment: 4,
    equipment: ["bluefur", "redplate", "redplate", "bluefur"],
    nodes: [
      { node: "claw", x: 2, y: 1 },
      { node: "claw", x: 3, y: 2 },
      { node: "claw", x: 3, y: 1 },
      { node: "claw", x: 2, y: 2 },
      { node: "battlestance", x: 0, y: 2, level: 2 },
      { node: "redgrassblade", x: 0, y: 0 },
    ],
  },
  mite: {
    id: "mite",
    sprite: "mite",
    baseHp: 10,
    maxEquipment: 2,
    equipment: ["bluefur", "bluefur"],
    nodes: [
      { node: "claw", x: 1, y: 1, level: 2 },
      { node: "bite", x: 0, y: 0 },
      { node: "block", x: 1, y: 0 },
    ],
  },
};

// Enemies: the teams a battle can be fought against, as fighter template ids.
// Boss teams (boss: true) are fought every RUN.bossEvery-th battle; the rest
// are regular. Each run picks its enemies from the seed.
export const ENEMIES = {
  mite: { id: "mite", fighters: ["mite"], boss: false },
  miteBrood: { id: "miteBrood", fighters: ["mite", "mite"], boss: true }, // placeholder boss
};

// Encounters: the choices between battles. Each is one of the encounter types
// in src/game/encounters.js (the code that runs it), with that type's params.
// rarity = a RARITIES id: how likely it is to be offered (by RARITIES weight).
// Name / description / action button: 'encounter.<id>', 'encounterTip.<id>'
// and 'encounterAction.<id>' in translate.js; the description can show params
// as {param}.
export const ENCOUNTERS = {
  lootArea: {
    id: "lootArea",
    type: "lootNodes",
    rarity: "common",
    params: { count: 3 },
  },
  lootCarcass: {
    id: "lootCarcass",
    type: "pickNode",
    rarity: "common",
    params: { options: 2, nodeRarity: "uncommon" },
  },
  travelingMerchant: {
    id: "travelingMerchant",
    type: "pickEquipment",
    rarity: "common",
    params: { options: 2 },
  },
  intenseTraining: {
    id: "intenseTraining",
    type: "upgradeNode",
    rarity: "uncommon",
    params: { levels: 1 },
  },
  sharpen: {
    id: "sharpen",
    type: "addEffect",
    rarity: "uncommon",
    params: { effect: { keyword: "attack", value: 3, upgradeDelta: 2 } },
  },
  meditation: {
    id: "meditation",
    type: "maxEquipment",
    rarity: "rare",
    params: { amount: 1 },
  },
};

// Runs. Every run has a seed (seedLength characters, or ?seed=... in the URL)
// that all of its randomness comes from; see src/game/random.js.
// A run is enemyCount battles; every bossEvery-th is a boss. Before the first
// battle come encountersBefore encounters, and between two battles
// encountersBetween, each a choice of encounterChoices.
// The first encounter after a boss always offers one of afterBossRarity.
export const RUN = {
  seedLength: 8,
  startingTeam: ["maxed"], // fighter template ids (normally "ant"; "maxed" for layout debugging)
  enemyCount: 9,
  bossEvery: 3,
  firstEnemy: "mite", // the first battle is always this ENEMIES id
  encountersBefore: 2, // encounters before the first battle
  encountersBetween: 2, // encounters between two battles
  encounterChoices: 2,
  afterBossRarity: "rare", // the first encounter after a boss always offers one of this rarity
};

// Approved text sizes, in px at full size (scaled with the UI, see UI_SCALE).
// These are the ONLY text sizes in the project.
// Use them as Tailwind classes: text-base, text-lg, ... text-8xl.
export const TEXT_SIZES = [
  { name: "base", px: 24 },
  { name: "lg", px: 30 },
  { name: "xl", px: 36 },
  { name: "2xl", px: 48 },
  { name: "3xl", px: 60 },
  { name: "4xl", px: 72 },
  { name: "5xl", px: 96 },
  { name: "6xl", px: 120 },
  { name: "7xl", px: 144 },
  { name: "8xl", px: 192 },
];
