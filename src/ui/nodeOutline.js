// Turns a node shape (list of [x, y] tiles) into one SVG outline path.
// Works for any polyomino, including holes and tiles touching only diagonally.
//
// Pixel geometry: tile x spans [x*step, x*step + cellPx], where step = cellPx + gap.
// Tracing the shape in grid units, scaling by step and insetting by gap/2 lands
// every edge exactly on its tiles, and fills the gaps *inside* the node.

const key = (x, y) => `${x},${y}`;

// Boundary loops in grid units, clockwise on screen (interior on the right).
function traceLoops(shape) {
  const cells = new Set(shape.map(([x, y]) => key(x, y)));
  const has = (x, y) => cells.has(key(x, y));
  const edges = new Map(); // start key -> [{ from, to }]
  const add = (from, to) => {
    const k = key(...from);
    if (!edges.has(k)) edges.set(k, []);
    edges.get(k).push({ from, to });
  };
  for (const [x, y] of shape) {
    if (!has(x, y - 1)) add([x, y], [x + 1, y]);
    if (!has(x + 1, y)) add([x + 1, y], [x + 1, y + 1]);
    if (!has(x, y + 1)) add([x + 1, y + 1], [x, y + 1]);
    if (!has(x - 1, y)) add([x, y + 1], [x, y]);
  }

  const dir = (e) => [Math.sign(e.to[0] - e.from[0]), Math.sign(e.to[1] - e.from[1])];
  const loops = [];
  for (;;) {
    const startList = [...edges.values()].find((l) => l.length);
    if (!startList) break;
    let edge = startList.pop();
    const loop = [];
    while (edge) {
      loop.push({ point: edge.from, dir: dir(edge) });
      const next = edges.get(key(...edge.to));
      if (!next || next.length === 0) break;
      // Where two loops share a vertex, prefer turning right to keep them apart.
      const [dx, dy] = dir(edge);
      const i = next.findIndex((e) => {
        const [nx, ny] = dir(e);
        return nx === -dy && ny === dx;
      });
      edge = next.splice(i >= 0 ? i : 0, 1)[0];
    }
    // Drop vertices in the middle of straight runs.
    loops.push(loop.filter((v, i) => {
      const prev = loop[(i - 1 + loop.length) % loop.length];
      return prev.dir[0] !== v.dir[0] || prev.dir[1] !== v.dir[1];
    }));
  }
  return loops;
}

// SVG path data, in px, relative to the node's top-left tile.
export function nodeOutlinePath(shape, { cellPx, gapPx, radiusPx }) {
  const step = cellPx + gapPx;
  const d = gapPx / 2;
  const inward = ([dx, dy]) => [-dy, dx];

  return traceLoops(shape)
    .map((loop) => {
      const pts = loop.map((v, i) => {
        const prev = loop[(i - 1 + loop.length) % loop.length];
        const [ax, ay] = inward(prev.dir);
        const [bx, by] = inward(v.dir);
        return [v.point[0] * step + (ax + bx) * d - d, v.point[1] * step + (ay + by) * d - d];
      });
      // Round every corner: stop short of it, curve through it.
      let path = '';
      pts.forEach((p, i) => {
        const prev = pts[(i - 1 + pts.length) % pts.length];
        const next = pts[(i + 1) % pts.length];
        const toward = (a, b) => {
          const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
          const r = Math.min(radiusPx, len / 2);
          return [a[0] + ((b[0] - a[0]) / len) * r, a[1] + ((b[1] - a[1]) / len) * r];
        };
        const enter = toward(p, prev);
        const exit = toward(p, next);
        path += `${i === 0 ? 'M' : 'L'}${enter[0]},${enter[1]} Q${p[0]},${p[1]} ${exit[0]},${exit[1]} `;
      });
      return path + 'Z';
    })
    .join(' ');
}
