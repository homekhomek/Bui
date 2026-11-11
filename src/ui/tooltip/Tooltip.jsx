// App-wide tooltip and selection system.
//
// Hover tooltips: anything can open one by spreading useTooltip(type, data)
// onto an element:
//
//   <div {...useTooltip('equipment', { id: 'sword' })} />
//
// `type` picks a renderer from TOOLTIP_TYPES (tooltipTypes.jsx); add new
// tooltip kinds there. Tooltips open instantly to the right of the hovered
// element (flipping left if there's no room) and fade out quickly.
//
// Selection: one thing at a time can be selected (nodes, equipment, ...), via
// useSelectable(type, data). Its tooltip is then pinned open and follows the
// element around; the pinned tooltip takes the pointer, so things inside it
// (effects, metrics) open their own hover tooltips for more detail. Pressing
// anywhere outside the pinned tooltip unselects.

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { TOOLTIP } from '../../data.js';
import { TOOLTIP_TYPES } from './tooltipTypes.jsx';

const TooltipContext = createContext(null);

const boxClass = 'fixed z-50 text-left rounded-lg border-stroke border-dusk bg-blush px-4 py-2';

// Place a tooltip box to the right of rect; flip left / clamp to stay on screen.
function place(box, rect) {
  const w = box.offsetWidth;
  const h = box.offsetHeight;
  let left = rect.right + TOOLTIP.gapPx;
  if (left + w > window.innerWidth - TOOLTIP.edgePx) left = rect.left - TOOLTIP.gapPx - w;
  const top = Math.min(Math.max(rect.top, TOOLTIP.edgePx), window.innerHeight - h - TOOLTIP.edgePx);
  box.style.left = `${Math.max(TOOLTIP.edgePx, left)}px`;
  box.style.top = `${top}px`;
}

export function TooltipProvider({ children }) {
  const [tip, setTip] = useState(null); // hover: { type, data, rect }
  const [visible, setVisible] = useState(false);
  const [pinned, setPinned] = useState(null); // selection: { type, data, el }
  const pinnedRef = useRef(null);
  pinnedRef.current = pinned;
  const suppressed = useRef(false);
  const boxRef = useRef(null);
  const pinBoxRef = useRef(null);

  const show = useCallback((type, data, el) => {
    // The selected thing already has its tooltip out.
    if (suppressed.current || pinnedRef.current?.el === el) return;
    setTip({ type, data, rect: el.getBoundingClientRect() });
    setVisible(true);
  }, []);
  const hide = useCallback(() => setVisible(false), []);

  const select = useCallback((type, data, el) => {
    setPinned({ type, data, el });
    setVisible(false);
  }, []);
  const unselect = useCallback(() => setPinned(null), []);
  // Keep the pinned tooltip current if the selected thing changes (e.g. levels up).
  const updateSelected = useCallback((el, data) => setPinned((p) => (p && p.el === el ? { ...p, data } : p)), []);

  // While suppressed (e.g. mid-drag) nothing opens.
  const setSuppressed = useCallback((on) => {
    suppressed.current = on;
    if (on) setVisible(false);
  }, []);

  // Pressing anywhere closes the hover tooltip and, unless it's inside the
  // pinned tooltip, unselects. Scrolling closes the hover tooltip.
  useEffect(() => {
    const onDown = (e) => {
      hide();
      if (!pinBoxRef.current?.contains(e.target)) unselect();
    };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('scroll', hide, true);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('scroll', hide, true);
    };
  }, [hide, unselect]);

  useLayoutEffect(() => {
    if (tip && boxRef.current) place(boxRef.current, tip.rect);
  }, [tip]);

  // The pinned tooltip follows its element (battle nodes keep moving), and
  // goes away if the element does.
  useLayoutEffect(() => {
    if (!pinned) return;
    let raf;
    const follow = () => {
      if (!pinned.el.isConnected) return setPinned(null);
      if (pinBoxRef.current) place(pinBoxRef.current, pinned.el.getBoundingClientRect());
      raf = requestAnimationFrame(follow);
    };
    follow();
    return () => cancelAnimationFrame(raf);
  }, [pinned]);

  const selectedEl = pinned?.el ?? null;
  const value = useMemo(
    () => ({ show, hide, setSuppressed, select, unselect, updateSelected, selectedEl }),
    [show, hide, setSuppressed, select, unselect, updateSelected, selectedEl]
  );
  const Content = tip && TOOLTIP_TYPES[tip.type];
  const Pinned = pinned && TOOLTIP_TYPES[pinned.type];

  return (
    <TooltipContext.Provider value={value}>
      {children}
      {Pinned && (
        <div ref={pinBoxRef} className={boxClass} style={{ maxWidth: TOOLTIP.maxWidthPx }}>
          <Pinned {...pinned.data} />
        </div>
      )}
      {Content && (
        <div
          ref={boxRef}
          className={`${boxClass} pointer-events-none`}
          style={{
            maxWidth: TOOLTIP.maxWidthPx,
            opacity: visible ? 1 : 0,
            transition: visible ? 'none' : `opacity ${TOOLTIP.fadeOutMs}ms ease-out`,
          }}
        >
          <Content {...tip.data} />
        </div>
      )}
    </TooltipContext.Provider>
  );
}

// Spread the result onto any element to give it a tooltip.
export function useTooltip(type, data) {
  const ctx = useContext(TooltipContext);
  if (!ctx) return {};
  return {
    onPointerEnter: (e) => ctx.show(type, data, e.currentTarget),
    onPointerLeave: ctx.hide,
  };
}

// Make an element selectable. Put `ref` on the same element that has the
// useTooltip handlers, and call select() on click. `selected` says whether to
// draw the selection border (see SelectBorder).
export function useSelectable(type, data) {
  const ctx = useContext(TooltipContext);
  const ref = useRef(null);
  const selected = Boolean(ctx?.selectedEl) && ctx.selectedEl === ref.current;
  const dataKey = JSON.stringify(data);
  useEffect(() => {
    if (selected) ctx.updateSelected(ref.current, data);
  }, [selected, dataKey]); // eslint-disable-line react-hooks/exhaustive-deps
  return {
    ref,
    selected,
    select: () => ctx && ref.current && ctx.select(type, data, ref.current),
  };
}

// For screens that need to switch tooltips off for a while (e.g. dragging).
export function useTooltipControls() {
  return useContext(TooltipContext);
}
