// Inventory grid rules. Pure functions, no React.
//
// Grid: row y belongs to equipment y and is EQUIPMENT[id].nodeSlots tiles wide
// (rows can be different lengths). Column 0 is the tile touching the equipment.
// A placed node is { uid, def, x, y, charge }.

import { EQUIPMENT, NODES } from '../data.js';

export function rowWidths(equipment) {
  return equipment.map((id) => EQUIPMENT[id].nodeSlots);
}

// The cells a shape (a list of [dx, dy] offsets) covers when placed at (x, y).
export const shapeCells = (shape, x, y) => shape.map(([dx, dy]) => [x + dx, y + dy]);

export function cellsAt(def, x, y) {
  return shapeCells(NODES[def].shape, x, y);
}

// Grid cells as Set keys, for "is this cell taken" checks.
export const cellKey = ([x, y]) => `${x},${y}`;
export const cellSet = (cells) => new Set(cells.map(cellKey));

// The cells taken by nodes ({ uid, def, x, y }), leaving out node ignoreUid.
export function takenCells(nodes, ignoreUid) {
  return cellSet(nodes.filter((n) => n.uid !== ignoreUid).flatMap((n) => cellsAt(n.def, n.x, n.y)));
}

// The one placement rule, used by the game and the admin alike: every cell is
// inside the grid (rows of `widths` tiles) and none of them is in `taken`.
export function cellsFit(widths, cells, taken = new Set()) {
  return (
    cells.length > 0 &&
    cells.every(([x, y]) => y >= 0 && y < widths.length && x >= 0 && x < widths[y] && !taken.has(cellKey([x, y])))
  );
}

// Can `node` sit at (x, y), ignoring its own current position?
export function fits(widths, nodes, node, x, y) {
  return cellsFit(widths, cellsAt(node.def, x, y), takenCells(nodes, node.uid));
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
