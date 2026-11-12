// Art templates: an SVG to start drawing art in, at art scale, for nodes,
// equipment and fighter sprites. Every template starts with the same
// non-visual SVG setup as the existing art (the XML header, the root <svg>'s
// namespaces / viewBox / size, and Boxy SVG's export settings and grid), so it
// opens in Boxy SVG just like art drawn there:
//   equipment  like redscale.svg: one tile, no guides (the art fills the piece)
//   fighters   like ant.svg: the whole sprite canvas, with Boxy's grid on the body
//   nodes      below, with guides
//
// Node templates:
// One tile is SPRITE.tileArt (70) across, and everything else (the gap between
// tiles, tile rounding) is scaled up from the inventory by the same factor, so
// art drawn on the template lines up with the node in game. The template has:
//   guide-node   the node's outline, filled with its color (exactly the shape
//                the game draws: connected tiles bridge the gaps between them)
//   guide-border the band the game's border covers (it is drawn inside the
//                outline): keep the art inside it, or the border hides its edge
//   guide-empty  a square on every tile inside the node's bounding box that the
//                node doesn't take up
// All are guides: delete or hide them once the art is drawn.

import { CORNERS, INVENTORY, SPRITE, UI, fullPx } from '../data.js';
import { nodeOutlinePath } from '../ui/nodeOutline.js';
import { PALETTE_HEX } from './entities.js';

// From the full-size (unscaled) values, so templates never depend on the window.
const scale = SPRITE.tileArt / fullPx(INVENTORY, 'cellPx');
export const ART = {
  tile: SPRITE.tileArt,
  gap: fullPx(INVENTORY, 'gapPx') * scale,
  radius: fullPx(CORNERS, 'tilePx') * scale,
  border: fullPx(UI, 'strokePx') * scale,
};
const step = ART.tile + ART.gap;

// Round away floating point noise (72.50000001 -> 72.5).
const r = (n) => Math.round(n * 1000) / 1000;
const roundPath = (d) => d.replace(/-?\d+(\.\d+)?(e-?\d+)?/g, (m) => String(r(Number(m))));

// The XML header and root <svg> of a w x h template (as in the existing art).
const svgOpen = (w, h) => [
  '<?xml version="1.0" encoding="utf-8"?>',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}px" height="${h}px" xmlns:bx="https://boxy-svg.com">`,
];
// Boxy SVG's export settings (export as SVG).
const BX_EXPORT = '<bx:export><bx:file format="svg"/></bx:export>';

// Equipment: one tile (the art fills the piece, inside its double border).
export function equipmentArtTemplate() {
  const size = ART.tile;
  return [...svgOpen(size, size), `  <defs>${BX_EXPORT}</defs>`, '</svg>', ''].join('\n');
}

// A fighter's sprite: the whole canvas, with Boxy's grid marking the body (the
// square that stands on the card; see SPRITE).
export function fighterArtTemplate() {
  const size = SPRITE.sizeArt;
  const body = SPRITE.bodyArt;
  const grid = `<bx:grid x="${(size - body) / 2}" y="${size - body}" width="${body}" height="${body}" divisions="1"/>`;
  return [...svgOpen(size, size), `  <defs>${BX_EXPORT}${grid}</defs>`, '</svg>', ''].join('\n');
}

// node: a NODES entry (shape already normalized to the top-left).
export function nodeArtTemplate(node) {
  const cols = 1 + Math.max(...node.shape.map(([x]) => x));
  const rows = 1 + Math.max(...node.shape.map(([, y]) => y));
  const width = r(cols * step - ART.gap);
  const height = r(rows * step - ART.gap);
  const taken = new Set(node.shape.map(([x, y]) => `${x},${y}`));
  const outline = roundPath(nodeOutlinePath(node.shape, { cellPx: ART.tile, gapPx: ART.gap, radiusPx: ART.radius }));

  const empty = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (taken.has(`${x},${y}`)) continue;
      empty.push(
        `    <rect x="${r(x * step)}" y="${r(y * step)}" width="${ART.tile}" height="${ART.tile}" rx="${r(ART.radius)}" fill="${PALETTE_HEX.haze}"/>`
      );
    }
  }

  return [
    ...svgOpen(width, height),
    `  <!-- Art template for node "${node.id}": ${cols} x ${rows} tiles, each ${ART.tile} x ${ART.tile}, ${r(ART.gap)} apart. -->`,
    `  <!-- guide-border: the game's ${r(ART.border)}-wide border covers this band; keep the art inside it. -->`,
    '  <defs>',
    `    ${BX_EXPORT}`,
    `    <bx:grid x="0" y="0" width="${r(step)}" height="${r(step)}" divisions="1"/>`,
    `    <clipPath id="guide-clip"><path d="${outline}" fill-rule="evenodd"/></clipPath>`,
    '  </defs>',
    '  <g id="guide-node">',
    `    <path d="${outline}" fill="${PALETTE_HEX[node.color] ?? PALETTE_HEX.mist}" fill-rule="evenodd"/>`,
    '  </g>',
    '  <g id="guide-border" clip-path="url(#guide-clip)">',
    // Centered stroke twice as wide, clipped to the outline: the inner half is the band.
    `    <path d="${outline}" fill="none" stroke="${PALETTE_HEX.dusk}" stroke-width="${r(ART.border * 2)}" fill-rule="evenodd"/>`,
    '  </g>',
    '  <g id="guide-empty">',
    ...empty,
    '  </g>',
    '</svg>',
    '',
  ].join('\n');
}
