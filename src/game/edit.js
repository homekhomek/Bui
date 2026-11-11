// Edit-phase loadout rules. Pure functions, no React.
//
// Loadout:  { fighters: [{ fighter, equipment: [equip], nodes: [node] }], floating: [float] }
// equip:    { uid, def }                equipment; its index is its row
// node:     { uid, def, level, x, y }   placed in a fighter's inventory grid
// float:    { uid, kind, def, level?, zone }   not in any grid, "floating in the ether"
//           kind 'node' or 'equipment'
//           zone 'offer'    = the random picks above the fighter
//           zone 'overflow' = bumped / removed nodes, to the right of the fighter
// area:     a fighter index (number) or 'float'
//
// The fighter's inventory is the only storage. No gravity while editing: nodes
// stay wherever they fit. Gravity only applies once the battle starts.
// Anything still floating is destroyed when a battle starts.

import { EQUIPMENT, EXPLORE, FIGHTERS, NODES } from '../data.js';
import { canUpgrade } from './effects.js';
import { cellsAt, fits, rowWidths } from './inventory.js';

let nextUid = 0;
const uid = () => `e${nextUid++}`;

export function createLoadout(team) {
  return {
    fighters: team.map((f) => ({
      fighter: f.fighter,
      equipment: f.equipment.map((def) => ({ uid: uid(), def })),
      nodes: f.nodes.map(({ node, level = 1, x, y }) => ({ uid: uid(), def: node, level, x, y })),
    })),
    floating: [],
  };
}

const pick = (obj) => {
  const keys = Object.keys(obj);
  return keys[Math.floor(Math.random() * keys.length)];
};

// Random nodes and equipment offered at the start of an explore visit.
export function rollOffer(loadout) {
  const nodes = Array.from({ length: EXPLORE.offerCount }, () => ({
    uid: uid(),
    kind: 'node',
    def: pick(NODES),
    level: 1,
    zone: 'offer',
  }));
  const equipment = Array.from({ length: EXPLORE.equipmentOfferCount }, () => ({
    uid: uid(),
    kind: 'equipment',
    def: pick(EQUIPMENT),
    zone: 'offer',
  }));
  return { ...loadout, floating: [...loadout.floating, ...equipment, ...nodes] };
}

// Battle start: everything still floating is destroyed.
export function clearFloating(loadout) {
  return { ...loadout, floating: [] };
}

// Loadout -> battle team format.
export function loadoutToTeam(loadout) {
  return loadout.fighters.map((f) => ({
    fighter: f.fighter,
    equipment: f.equipment.map((e) => e.def),
    nodes: f.nodes.map((n) => ({ node: n.def, level: n.level, x: n.x, y: n.y })),
  }));
}

export function areaWidths(loadout, area) {
  return rowWidths(loadout.fighters[area].equipment.map((e) => e.def));
}

// Every cell of a def at (x, y) is inside the grid.
export function inBounds(widths, def, x, y) {
  return cellsAt(def, x, y).every(([cx, cy]) => cy >= 0 && cy < widths.length && cx >= 0 && cx < widths[cy]);
}

// Nodes in fighter `area` that a def placed at (x, y) would land on.
export function overlapping(loadout, area, uid, def, x, y) {
  const cells = new Set(cellsAt(def, x, y).map(([cx, cy]) => `${cx},${cy}`));
  return loadout.fighters[area].nodes.filter(
    (n) => n.uid !== uid && cellsAt(n.def, n.x, n.y).some(([cx, cy]) => cells.has(`${cx},${cy}`))
  );
}

// Take node `uid` out of wherever it is. Returns [node, area].
function take(loadout, uid) {
  const i = loadout.floating.findIndex((n) => n.uid === uid);
  if (i >= 0) return [loadout.floating.splice(i, 1)[0], 'float'];
  for (const [a, f] of loadout.fighters.entries()) {
    const j = f.nodes.findIndex((n) => n.uid === uid);
    if (j >= 0) return [f.nodes.splice(j, 1)[0], a];
  }
  return [null, null];
}

const toFloat = ({ uid, def, level }, zone) => ({ uid, kind: 'node', def, level, zone });

// Find a node anywhere in the loadout (inventory or floating).
export function findNode(loadout, uid) {
  return (
    loadout.floating.find((n) => n.uid === uid && n.kind !== 'equipment') ??
    loadout.fighters.flatMap((f) => f.nodes).find((n) => n.uid === uid)
  );
}

// Drop node `uid` onto node `targetUid` to upgrade it. The dropped node is used
// up; the target goes up one level. Returns the new loadout, or null if the two
// can't be combined (different type or level, or not upgradable).
export function upgradeNode(loadout, uid, targetUid) {
  const a = findNode(loadout, uid);
  const b = findNode(loadout, targetUid);
  if (!a || !b || !canUpgrade(a, b)) return null;
  const next = structuredClone(loadout);
  take(next, uid);
  findNode(next, targetUid).level = (b.level ?? 1) + 1;
  return next;
}

// Free spot in the grid closest to the node's current position, or null.
function nearestSpot(widths, nodes, node) {
  let best = null;
  let bestDist = Infinity;
  for (let y = 0; y < widths.length; y++) {
    for (let x = 0; x < Math.max(0, ...widths); x++) {
      const dist = Math.abs(x - node.x) + Math.abs(y - node.y);
      if (dist < bestDist && fits(widths, nodes, node, x, y)) {
        best = { x, y };
        bestDist = dist;
      }
    }
  }
  return best;
}

// Move node `uid` to (x, y) in fighter `to`. Each node it lands on moves to
// the nearest free spot in the same inventory; if there is none, it floats to
// the right of the fighter as a last resort.
// Returns the new loadout, or null if the spot is out of bounds.
export function moveNode(loadout, uid, to, x, y) {
  const next = structuredClone(loadout);
  const [moving] = take(next, uid);
  const widths = areaWidths(next, to);
  if (!moving || !inBounds(widths, moving.def, x, y)) return null;

  const target = next.fighters[to].nodes;
  const bumped = overlapping(next, to, uid, moving.def, x, y);
  for (const b of bumped) target.splice(target.indexOf(b), 1);
  target.push({ uid: moving.uid, def: moving.def, level: moving.level, x, y });

  for (const b of bumped) {
    const spot = nearestSpot(widths, target, b);
    if (spot) {
      Object.assign(b, spot);
      target.push(b);
    } else {
      next.floating.push(toFloat(b, 'overflow'));
    }
  }
  return next;
}

// Dropped outside any grid: inventory nodes float off to the right;
// floating nodes stay where they were.
export function dropToFloat(loadout, uid) {
  if (loadout.floating.some((n) => n.uid === uid)) return loadout;
  const next = structuredClone(loadout);
  const [node] = take(next, uid);
  next.floating.push(toFloat(node, 'overflow'));
  return next;
}

// ---------------------------------------------------------------------------
// Equipment
// ---------------------------------------------------------------------------

export const maxEquipment = (loadout, area) => FIGHTERS[loadout.fighters[area].fighter].maxEquipment;

// Where equipment `uid` is: { area, index } (index into floating or equipment).
export function locateEquipment(loadout, uid) {
  const i = loadout.floating.findIndex((n) => n.uid === uid && n.kind === 'equipment');
  if (i >= 0) return { area: 'float', index: i };
  for (const [area, f] of loadout.fighters.entries()) {
    const j = f.equipment.findIndex((e) => e.uid === uid);
    if (j >= 0) return { area, index: j };
  }
  return null;
}

const rowsOf = (f) => f.equipment.map((e, from) => ({ e, from }));

// Rebuild fighter `area` with new equipment rows. rows: [{ e, from }] where
// `from` is the row index it had before (null if new). Nodes follow their row's
// equipment and keep their column; a node that no longer fits moves to the
// nearest free spot, or floats off to the right if there is none.
function relayout(next, area, rows) {
  const f = next.fighters[area];
  const rowMap = new Map();
  rows.forEach((r, i) => r.from !== null && rowMap.set(r.from, i));
  f.equipment = rows.map((r) => r.e);
  const widths = areaWidths(next, area);

  const placed = [];
  const homeless = [];
  for (const n of [...f.nodes].sort((a, b) => a.y - b.y || a.x - b.x)) {
    const y = rowMap.get(n.y);
    const moved = { ...n, y: y ?? n.y };
    if (y !== undefined && fits(widths, placed, moved, moved.x, y)) placed.push(moved);
    else homeless.push(moved);
  }
  for (const n of homeless) {
    const spot = nearestSpot(widths, placed, n);
    if (spot) placed.push({ ...n, ...spot });
    else next.floating.push(toFloat(n, 'overflow'));
  }
  f.nodes = placed;
}

// What dropping equipment `uid` onto slot `slot` of fighter `to` would do.
//   same fighter:  reorder (it moves to that slot, the rest shift)
//   otherwise:     insert there if the fighter has a free slot, else replace
//                  that slot (the replaced piece swaps back to where the dropped
//                  one came from, or floats off if it came from the ether)
// Returns { index, replacing } or null if the drop does nothing.
export function equipmentDrop(loadout, uid, to, slot) {
  const src = locateEquipment(loadout, uid);
  if (!src) return null;
  const count = loadout.fighters[to].equipment.length;
  if (src.area === to) {
    const index = Math.min(slot, count - 1);
    return index === src.index ? null : { index, replacing: false };
  }
  if (count < maxEquipment(loadout, to)) return { index: Math.min(slot, count), replacing: false };
  return { index: slot, replacing: true };
}

// Drop equipment `uid` onto slot `slot` of fighter `to` (see equipmentDrop).
// Returns the new loadout, or null if nothing changes.
export function moveEquipment(loadout, uid, to, slot) {
  const drop = equipmentDrop(loadout, uid, to, slot);
  if (!drop) return null;
  const next = structuredClone(loadout);
  const src = locateEquipment(next, uid);
  const dst = rowsOf(next.fighters[to]);

  if (src.area === to) {
    const [moved] = dst.splice(src.index, 1);
    dst.splice(drop.index, 0, moved);
    relayout(next, to, dst);
    return next;
  }

  let item;
  if (src.area === 'float') {
    const [{ uid: u, def }] = next.floating.splice(src.index, 1);
    item = { uid: u, def };
  } else {
    item = next.fighters[src.area].equipment[src.index];
  }

  let replaced = null;
  if (drop.replacing) [replaced] = dst.splice(drop.index, 1, { e: item, from: null });
  else dst.splice(drop.index, 0, { e: item, from: null });

  if (src.area === 'float') {
    if (replaced) next.floating.push({ uid: replaced.e.uid, kind: 'equipment', def: replaced.e.def, zone: 'overflow' });
  } else {
    // The source fighter loses the piece; a replaced piece swaps into its slot.
    const srcRows = rowsOf(next.fighters[src.area]);
    if (replaced) srcRows[src.index] = { e: replaced.e, from: null };
    else srcRows.splice(src.index, 1);
    if (srcRows.length === 0) return null; // a fighter always keeps at least one piece
    relayout(next, src.area, srcRows);
  }
  relayout(next, to, dst);
  return next;
}

// Equipment dropped outside any slot: a fighter's piece floats off to the right
// (unless it is the fighter's last one); floating pieces stay where they were.
export function dropEquipmentToFloat(loadout, uid) {
  const src = locateEquipment(loadout, uid);
  if (!src || src.area === 'float') return loadout;
  if (loadout.fighters[src.area].equipment.length <= 1) return loadout;
  const next = structuredClone(loadout);
  const rows = rowsOf(next.fighters[src.area]);
  const [{ e }] = rows.splice(src.index, 1);
  next.floating.push({ uid: e.uid, kind: 'equipment', def: e.def, zone: 'overflow' });
  relayout(next, src.area, rows);
  return next;
}
