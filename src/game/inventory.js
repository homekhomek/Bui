// Inventory grid rules. Pure functions, no React.
//
// Grid: row y belongs to equipment y and is EQUIPMENT[id].nodeSlots tiles wide
// (rows can be different lengths). Column 0 is the tile touching the equipment.
// A placed node is { uid, def, x, y, charge }.

import { EQUIPMENT, NODES } from '../data.js';

export function rowWidths(equipment) {
  return equipment.map((id) => EQUIPMENT[id].nodeSlots);
}

export function cellsAt(def, x, y) {
  return NODES[def].shape.map(([dx, dy]) => [x + dx, y + dy]);
}

function occupiedBy(nodes, ignoreUid) {
  const taken = new Set();
  for (const n of nodes) {
    if (n.uid === ignoreUid) continue;
    for (const [cx, cy] of cellsAt(n.def, n.x, n.y)) taken.add(`${cx},${cy}`);
  }
  return taken;
}

// Can `node` sit at (x, y), ignoring its own current position?
export function fits(widths, nodes, node, x, y) {
  const taken = occupiedBy(nodes, node.uid);
  return cellsAt(node.def, x, y).every(
    ([cx, cy]) => cy >= 0 && cy < widths.length && cx >= 0 && cx < widths[cy] && !taken.has(`${cx},${cy}`)
  );
}

// Rows in which the node touches the equipment column.
export function touchingRows(node) {
  return cellsAt(node.def, node.x, node.y)
    .filter(([cx]) => cx === 0)
    .map(([, cy]) => cy);
}

// Battle rows have no right edge: same rows, unlimited length.
export function unboundedWidths(equipment) {
  return equipment.map(() => Infinity);
}

// Where a used node re-enters: past the visible grid and past every other node
// in its rows, so gravity then pulls it in from the right to the back of the queue.
export function spawnX(equipment, nodes, node) {
  const rows = new Set(cellsAt(node.def, node.x, node.y).map(([, cy]) => cy));
  let x = Math.max(...rowWidths(equipment));
  for (const n of nodes) {
    if (n.uid === node.uid) continue;
    for (const [cx, cy] of cellsAt(n.def, n.x, n.y)) {
      if (rows.has(cy)) x = Math.max(x, cx + 1);
    }
  }
  return x;
}

// Left gravity: slide every node left as far as it goes, front nodes first.
// Mutates nodes. Returns [{ uid, x }] for nodes that moved.
export function settle(widths, nodes) {
  const moves = new Map();
  const leftEdge = (n) => Math.min(...cellsAt(n.def, n.x, n.y).map(([cx]) => cx));
  let moved = true;
  while (moved) {
    moved = false;
    for (const n of [...nodes].sort((a, b) => leftEdge(a) - leftEdge(b) || a.y - b.y)) {
      while (fits(widths, nodes, n, n.x - 1, n.y)) {
        n.x -= 1;
        moved = true;
        moves.set(n.uid, n.x);
      }
    }
  }
  return [...moves].map(([uid, x]) => ({ uid, x }));
}
