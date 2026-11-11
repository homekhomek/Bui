// data.js — ALL numbers and game data live here.
// Stats, costs, timings, sizes, unit definitions, wave tables, etc.
// Components and logic should import values from here instead of hardcoding them.

export const GAME = {
  version: '0.1.0',
};

// The one stroke width for the whole app: borders, outlines, SVG strokes.
// Use STROKE_PX in code, or the border-stroke class in markup.
export const STROKE_PX = 2;

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
  ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
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

// App-wide tooltips (see src/ui/tooltip)
export const TOOLTIP = {
  gapPx: 12, // space between the hovered thing and its tooltip
  edgePx: 8, // minimum distance from the window edge
  maxWidthPx: 360,
  fadeOutMs: 120, // tooltips open instantly and fade out this fast
};

// Explore / edit phase
export const EXPLORE = {
  offerCount: 3, // random nodes floating above the fighter each visit
  equipmentOfferCount: 1, // random equipment offered alongside them
  bobMs: 2400, // floating nodes gently bob; one full cycle
  bobPx: 6, // bob height
};

export const EDIT = {
  moveAnimMs: 130, // drop / bump slide animation length
  ghostOpacity: 0.3, // opacity of a node's original spot while it is being dragged
  previewOpacity: 0.5, // opacity of the drop preview highlight
  upgradeOutlinePx: 5, // exception to STROKE_PX: highlight around a node a drop would upgrade
  popScale: 1.15, // a node briefly grows when it levels up
  popMs: 220,
};

// ---------------------------------------------------------------------------
// Game data
// Colors are Saccharide palette names (see index.css).
// ---------------------------------------------------------------------------

// Hard size limits. No fighter's maxEquipment may exceed maxEquipment, and no
// equipment's nodeSlots may exceed maxNodeSlots (largest inventory: 6 x 8).
export const LIMITS = {
  maxEquipment: 6,
  maxNodeSlots: 8,
};

// Fighters hold equipment (up to maxEquipment) and nodes.
export const FIGHTERS = {
  knight: { id: 'knight', maxHp: 40, maxEquipment: 6, color: 'mint' },
  brute: { id: 'brute', maxHp: 50, maxEquipment: 3, color: 'plum' },
};

// Equipment sits in a column on the left of the inventory. icon (optional) =
// file name in public/assets/equipment; without one the tile is a plain color. Each piece opens a
// row of nodeSlots tiles to its right. Nodes touching it (column 0 of its row)
// gain chargeRate charge per second (rates from several rows add up).
export const EQUIPMENT = {
  sword: { id: 'sword', nodeSlots: 5, chargeRate: 10, color: 'peach' },
  shield: { id: 'shield', nodeSlots: 5, chargeRate: 10, color: 'sky' },
  charm: { id: 'charm', nodeSlots: 4, chargeRate: 20, color: 'orchid' },
  pack: { id: 'pack', nodeSlots: 8, chargeRate: 5, color: 'cream', icon: 'knapsack' },
};

// Effect keywords. icon = file name in public/assets/effects; color = the
// palette color its box is tinted (matches the icon's own fill).
export const KEYWORDS = {
  attack: { id: 'attack', icon: 'attack', color: 'rose' }, // red
  shield: { id: 'shield', icon: 'shield', color: 'ice' }, // blue
  heal: { id: 'heal', icon: 'heal', color: 'mint' }, // green
};

// Charge is always shown as its symbol, never the word ({charge} in strings).
export const CHARGE = { icon: 'charge', color: 'cream' };

// Nodes are tetris-like pieces. shape = [x, y] tile offsets from the node's
// position. At maxCharge the node runs its effects in order, then teleports to
// the far right and slides back left (gravity), joining the back of the queue.
//
// effects: what the node does, in order. Each effect is
//   { keyword, value, upgradeDelta? }
// keyword: attack (damage the first living enemy), shield (self), heal (self).
// value at a given level = value + upgradeDelta * (level - 1).
// A node with any upgradeDelta can be upgraded by dropping another node of the
// same type and level onto it.
export const NODES = {
  slash: {
    id: 'slash',
    shape: [[0, 0]],
    maxCharge: 10,
    color: 'pink',
    effects: [{ keyword: 'attack', value: 3, upgradeDelta: 2 }],
  },
  bash: {
    id: 'bash',
    shape: [[0, 0], [1, 0]],
    maxCharge: 18,
    color: 'dusty',
    effects: [{ keyword: 'attack', value: 6, upgradeDelta: 3 }],
  },
  guard: {
    id: 'guard',
    shape: [[0, 0], [0, 1]],
    maxCharge: 15,
    color: 'cornflower',
    effects: [{ keyword: 'shield', value: 5, upgradeDelta: 3 }],
  },
  mend: {
    id: 'mend',
    shape: [[0, 0], [1, 0], [0, 1]],
    maxCharge: 25,
    color: 'sage',
    effects: [{ keyword: 'heal', value: 6, upgradeDelta: 4 }],
  },
  spin: {
    id: 'spin',
    shape: [[0, 0], [1, 0], [2, 0], [1, 1]],
    maxCharge: 30,
    color: 'lavender',
    effects: [
      { keyword: 'attack', value: 4, upgradeDelta: 2 },
      { keyword: 'shield', value: 3, upgradeDelta: 1 },
    ],
  },
};

// Placeholder loadouts until the explore/edit phase builds real ones.
// Node x/y are starting positions in the inventory grid (row y = equipment y).
export const DEMO_TEAMS = {
  player: [
    {
      fighter: 'knight',
      equipment: ['sword', 'shield', 'charm', 'pack', 'pack', 'pack'], // max size: 6 rows, up to 8 slots
      nodes: [
        { node: 'slash', x: 0, y: 0 },
        { node: 'bash', x: 1, y: 0 },
        { node: 'mend', x: 0, y: 1 },
        { node: 'guard', x: 2, y: 1 },
      ],
    },
  ],
  enemy: [
    {
      fighter: 'brute',
      equipment: ['sword', 'sword'],
      nodes: [
        { node: 'bash', x: 0, y: 0 },
        { node: 'slash', x: 2, y: 0 },
        { node: 'bash', x: 0, y: 1 },
        { node: 'slash', x: 3, y: 1 },
      ],
    },
  ],
};

// Approved text sizes in px. These are the ONLY text sizes in the project.
// Use them as Tailwind classes: text-base, text-lg, ... text-8xl.
export const TEXT_SIZES = [
  { name: 'base', px: 24 },
  { name: 'lg', px: 30 },
  { name: 'xl', px: 36 },
  { name: '2xl', px: 48 },
  { name: '3xl', px: 60 },
  { name: '4xl', px: 72 },
  { name: '5xl', px: 96 },
  { name: '6xl', px: 120 },
  { name: '7xl', px: 144 },
  { name: '8xl', px: 192 },
];
