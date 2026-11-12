import { useEffect, useRef } from 'react';
import { ADMIN, INVENTORY, LIMITS } from '../data.js';


// maxNodeSize x maxNodeSize grid of tiles. Press on a tile to toggle it, then
// drag to paint (or erase) more. setShape takes an updater: (shape) => shape.
export default function ShapeEditor({ shape, color, setShape }) {
  const { shapeCellPx } = ADMIN;
  const STEP = shapeCellPx + INVENTORY.gapPx;
  const size = LIMITS.maxNodeSize;
  const on = new Set(shape.map(([x, y]) => `${x},${y}`));
  const painting = useRef(null); // true = adding tiles, false = erasing

  useEffect(() => {
    const stop = () => (painting.current = null);
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    return () => {
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
  }, []);

  const apply = (x, y, add) =>
    setShape((s) => {
      const has = s.some(([sx, sy]) => sx === x && sy === y);
      if (has === add) return s;
      return add ? [...s, [x, y]] : s.filter(([sx, sy]) => sx !== x || sy !== y);
    });

  const cellAt = (e) => document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-cell]')?.dataset.cell;

  const onPointerDown = (e) => {
    const cell = cellAt(e);
    if (!cell || e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.releasePointerCapture?.(e.pointerId); // touch: keep getting moves over other tiles
    painting.current = !on.has(cell);
    apply(...cell.split(',').map(Number), painting.current);
  };

  const onPointerMove = (e) => {
    if (painting.current === null) return;
    const cell = cellAt(e);
    if (cell) apply(...cell.split(',').map(Number), painting.current);
  };

  return (
    <div
      className="relative"
      style={{ width: size * STEP - INVENTORY.gapPx, height: size * STEP - INVENTORY.gapPx, touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
    >
      {Array.from({ length: size * size }, (_, i) => {
        const x = i % size;
        const y = Math.floor(i / size);
        const filled = on.has(`${x},${y}`);
        return (
          <div
            key={i}
            data-cell={`${x},${y}`}
            className={`absolute rounded-tile cursor-pointer border-stroke ${filled ? 'border-dusk' : 'border-transparent bg-haze hover:bg-mist'}`}
            style={{
              width: shapeCellPx,
              height: shapeCellPx,
              left: x * STEP,
              top: y * STEP,
              backgroundColor: filled ? `var(--color-${color})` : undefined,
            }}
          />
        );
      })}
    </div>
  );
}
