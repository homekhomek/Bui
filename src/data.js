// data.js — ALL numbers and game data live here.
// Stats, costs, timings, sizes, unit definitions, wave tables, etc.
// Components and logic should import values from here instead of hardcoding them.

export const GAME = {
  version: "0.1.0",
};

// The one stroke width for the whole app: borders, outlines, SVG strokes.
// Use STROKE_PX in code, or the border-stroke class in markup.
export const STROKE_PX = 3;

export const LAYOUT = {
  maxWidth: 1280, // px, width of the centered game area (fits two max-size fighters)
};

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
export const INVENTORY = {
  cellPx: 56, // size of one equipment square / node tile
  gapPx: 2, // gap between tiles (connected node tiles bridge it)
  tileRadiusPx: 6, // corner rounding of tiles
  unchargedOpacity: 0.6, // how washed out the uncharged part of a node is
  equipmentBorderPx: 8, // exception to STROKE_PX: equipment's heavy double border
  pipRadiusPx: 5, // level pips drawn on upgraded nodes
  pipGapPx: 3,
  pipInsetPx: 8, // pip distance from the node's top-left corner
  slotSymbolScale: 0.8, // {slot} symbol size, relative to the inline icon size
};

// Effect rows (icon, name, number) shown wherever a node's effects are listed
export const EFFECT_ROW = {
  iconPx: 36,
  paddingXPx: 8,
  paddingYPx: 4,
  gapPx: 8, // between icon, name and number
  minWidthPx: 200,
  inlineIconPx: 28, // symbols inside a line of text, e.g. {charge}
};

// Metric displays: small bordered boxes holding one stat (e.g. 10 {charge}/s)
export const METRIC = {
  paddingXPx: 8,
  paddingYPx: 2,
};

// Rarity badges: a rarity's name in a box tinted its color (same everywhere)
export const RARITY_BADGE = {
  paddingXPx: 12,
  paddingYPx: 6,
};

// Status counters on fighters in battle (icon + count, see STATUSES)
export const STATUS_COUNTER = {
  iconPx: 28,
  paddingXPx: 6,
  paddingYPx: 2,
  gapPx: 4,
};

// Selecting a node or piece of equipment (click it): a border drawn over its
// own, which starts at fromScale times its size and quickly shrinks onto it.
export const SELECT = {
  borderPx: 6, // exception to STROKE_PX: the selection border
  fromScale: 1.25,
  animMs: 140,
};

// App-wide tooltips (see src/ui/tooltip)
export const TOOLTIP = {
  gapPx: 12, // space between the hovered thing and its tooltip
  edgePx: 8, // minimum distance from the window edge
  maxWidthPx: 360,
  fadeOutMs: 120, // tooltips open instantly and fade out this fast
};

// Explore / edit phase
export const EXPLORE = {
  bobMs: 2400, // floating things (nodes, equipment, encounter cards) gently bob; one full cycle
  bobPx: 6, // bob height
  bobStagger: 1 / 3, // neighbours bob this fraction of a cycle apart
};

export const EDIT = {
  moveAnimMs: 130, // drop / bump slide animation length
  dragThresholdPx: 5, // pointer travel before a press becomes a drag (less = a click, which selects)
  ghostOpacity: 0.3, // opacity of a node's original spot while it is being dragged
  previewOpacity: 0.5, // opacity of the drop preview highlight
  upgradeOutlinePx: 5, // exception to STROKE_PX: highlight around a node a drop would upgrade
  popScale: 1.15, // a node briefly grows when it levels up
  popMs: 220,
};

// Admin dashboard (dev only, never in player builds; see src/admin)
export const ADMIN = {
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
};

// Encounter cards and panels (the choices between battles)
export const ENCOUNTER_UI = {
  cardWidthPx: 320,
  panelWidthPx: 480,
  slotPx: 140, // the box a node is dragged into, for encounters that need one
  slotPaddingPx: 16,
};

// ---------------------------------------------------------------------------
// Game data
// Colors are Saccharide palette names (see index.css).
// ---------------------------------------------------------------------------

// Hard size limits. No fighter's maxEquipment may exceed maxEquipment, and no
// equipment's nodeSlots may exceed maxNodeSlots (largest inventory: 6 x 8).
// No node shape may be wider or taller than maxNodeSize tiles.
export const LIMITS = {
  maxEquipment: 6,
  maxNodeSlots: 8,
  maxNodeSize: 8,
};

// Fighter sprites: SVGs in public/assets/fighters, drawn on a sizeArt x sizeArt
// canvas on which one node tile is tileArt across. The fighter's body fills the
// bodyArt x bodyArt square at the bottom middle; the rest of the canvas is room
// for details that overflow it (drawn, but given no layout space). Sprites are
// scaled so their tiles match the inventory's node tiles (INVENTORY.cellPx).
export const SPRITE = {
  sizeArt: 350,
  tileArt: 70, // one node tile in art units (also the scale of node art templates)
  bodyArt: 210,
  cardOverlapPx: 12, // how far the fighter card overlaps the bottom of the sprite's body (card in front)
};

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
    nodeSlots: 2,
    chargeRate: 5,
    hp: 15,
    color: "ice",
    rarity: "common",
    icon: "bluefur",
  },
  redplate: {
    id: "redplate",
    nodeSlots: 4,
    chargeRate: 10,
    hp: 25,
    color: "shell",
    rarity: "uncommon",
    icon: "redscale",
  },
  charm: {
    id: "charm",
    nodeSlots: 4,
    chargeRate: 20,
    hp: 3,
    color: "orchid",
    rarity: "rare",
  },
  pack: {
    id: "pack",
    nodeSlots: 8,
    chargeRate: 5,
    hp: 4,
    color: "cream",
    rarity: "uncommon",
    icon: "knapsack",
  },
};

// Status counters: stacks a fighter carries during a battle, shown as the icon
// (file name in public/assets/effects) with the count. Battle-only: every
// fighter starts each battle with none. Name / description: 'status.<id>' and
// 'statusTip.<id>' in translate.js.
//   shield: each counter blocks 1 damage, and is used up doing so.
export const STATUSES = {
  shield: { id: "shield", icon: "shield", color: "ice" },
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
  heal: { id: "heal", icon: "heal", color: "sage" }, // green
  strengthen: {
    id: "strengthen",
    icon: "strengthen",
    color: "peach",
    boosts: "attack",
  }, // peach
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
// node's attacks deal that much more for the rest of the battle).
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
    maxCharge: 30,
    color: "pink",
    rarity: "uncommon",
    icon: "redgrassblade",
    effects: [
      { keyword: "attack", value: 8, upgradeDelta: 4 },
      { keyword: "strengthen", value: 2, upgradeDelta: 1 },
    ],
  },
  stalkclub: {
    id: "stalkclub",
    shape: [
      [0, 0],
      [1, 0],
      [2, 0],
    ],
    maxCharge: 30,
    color: "pink",
    rarity: "common",
    icon: "stalkclub",
    effects: [{ keyword: "attack", value: 12, upgradeDelta: 3 }],
  },
  guard: {
    id: "guard",
    shape: [
      [0, 0],
      [0, 1],
    ],
    maxCharge: 15,
    color: "cornflower",
    rarity: "common",
    effects: [{ keyword: "shield", value: 5, upgradeDelta: 3 }],
  },
  mend: {
    id: "mend",
    shape: [
      [0, 0],
      [1, 0],
      [0, 1],
    ],
    maxCharge: 25,
    color: "sage",
    rarity: "uncommon",
    effects: [{ keyword: "heal", value: 6, upgradeDelta: 4 }],
  },
  spin: {
    id: "spin",
    shape: [
      [0, 0],
      [1, 0],
      [2, 0],
      [1, 1],
    ],
    maxCharge: 30,
    color: "lavender",
    rarity: "rare",
    effects: [
      { keyword: "attack", value: 4, upgradeDelta: 2 },
      { keyword: "shield", value: 3, upgradeDelta: 1 },
    ],
  },
  claw: {
    id: "claw",
    shape: [[0, 0]],
    maxCharge: 10,
    color: "pink",
    rarity: "common",
    icon: "claw",
    effects: [{ keyword: "attack", value: 2, upgradeDelta: 1 }],
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
  mite: {
    id: "mite",
    sprite: "mite",
    baseHp: 10,
    maxEquipment: 2,
    equipment: ["bluefur", "bluefur"],
    nodes: [
      { node: "claw", x: 1, y: 0 },
      { node: "guard", x: 0, y: 0 },
      { node: "claw", x: 1, y: 1, level: 2 },
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
    type: "lootEquipment",
    rarity: "common",
    params: { count: 1 },
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
// A run is enemyCount battles; every bossEvery-th is a boss. Between two
// battles come encountersBetween encounters, each a choice of encounterChoices.
// The first encounter after a boss always offers one of afterBossRarity.
export const RUN = {
  seedLength: 8,
  startingTeam: ["ant"], // fighter template ids
  enemyCount: 9,
  bossEvery: 3,
  firstEnemy: "mite", // the first battle is always this ENEMIES id
  encountersBetween: 2,
  encounterChoices: 2,
  afterBossRarity: "rare", // the first encounter after a boss always offers one of this rarity
};

// Approved text sizes in px. These are the ONLY text sizes in the project.
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
