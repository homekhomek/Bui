// Shared state for the edit phase's drag and drop, plus the slide animation.
// Components outside an EditContext (e.g. the battle screen) are not draggable.

import { createContext, useContext, useLayoutEffect, useRef } from 'react';
import { ANIM, EDIT } from '../data.js';

// value: {
//   rootRef,                     element positions are measured relative to
//   positions: Map<uid, {x,y}>,  last laid-out position of each node
//   dropFrom: Map<uid, {x,y}>,   where a just-dropped node was released
//   dragUid, hover,              current drag + drop preview
//   startDrag(event, node, area, element),
//   registerArea(area, element, colOffset),
// }
export const EditContext = createContext(null);

export const useEdit = () => useContext(EditContext);

// Slide animation for nodes: whenever a node's laid-out position changes
// (drop, bump, gravity, even between grids), it slides from where it was
// on screen to where it now is.
export function useSlide(uid) {
  const ctx = useEdit();
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const root = ctx?.rootRef.current;
    if (!el || !root) return;
    const rootRect = root.getBoundingClientRect();
    const rel = (r) => ({ x: r.left - rootRect.left, y: r.top - rootRect.top });

    // By now React has already moved the element, so its current box is the NEW
    // spot. Where it was on screen = its last recorded spot + any slide still
    // in progress (the transform, which React doesn't touch).
    const running = getComputedStyle(el).transform;
    const offset = running && running !== 'none' ? new DOMMatrixReadOnly(running) : { e: 0, f: 0 };
    el.style.transition = 'none';
    el.style.transform = '';
    const layout = rel(el.getBoundingClientRect());

    let from;
    if (ctx.dropFrom.has(uid)) {
      from = ctx.dropFrom.get(uid); // just released from a drag
      ctx.dropFrom.delete(uid);
    } else if (ctx.positions.has(uid)) {
      const prev = ctx.positions.get(uid);
      from = { x: prev.x + offset.e, y: prev.y + offset.f };
    }
    ctx.positions.set(uid, layout);

    if (from && (Math.abs(from.x - layout.x) > 0.5 || Math.abs(from.y - layout.y) > 0.5)) {
      el.style.transform = `translate(${from.x - layout.x}px, ${from.y - layout.y}px)`;
      el.getBoundingClientRect(); // commit the start position before animating
      el.style.transition = `transform ${EDIT.moveAnimMs}ms ${ANIM.ease}`;
      el.style.transform = '';
    }
  });

  return ref;
}
