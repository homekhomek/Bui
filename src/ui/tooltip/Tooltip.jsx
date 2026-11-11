// App-wide tooltip system.
//
// One tooltip element for the whole app, rendered by <TooltipProvider>.
// Anything can open it by spreading useTooltip(type, data) onto an element:
//
//   <div {...useTooltip('equipment', { id: 'sword' })} />
//
// `type` picks a renderer from TOOLTIP_TYPES (tooltipTypes.jsx); add new
// tooltip kinds there. Tooltips open instantly to the right of the hovered
// element (flipping left if there's no room) and fade out quickly.

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { TOOLTIP } from '../../data.js';
import { TOOLTIP_TYPES } from './tooltipTypes.jsx';

const TooltipContext = createContext(null);

export function TooltipProvider({ children }) {
  const [tip, setTip] = useState(null); // { type, data, rect }
  const [visible, setVisible] = useState(false);
  const suppressed = useRef(false);
  const boxRef = useRef(null);

  const show = useCallback((type, data, el) => {
    if (suppressed.current) return;
    setTip({ type, data, rect: el.getBoundingClientRect() });
    setVisible(true);
  }, []);
  const hide = useCallback(() => setVisible(false), []);
  // While suppressed (e.g. mid-drag) nothing opens.
  const setSuppressed = useCallback((on) => {
    suppressed.current = on;
    if (on) setVisible(false);
  }, []);

  // Clicking, dragging or scrolling closes the tooltip.
  useEffect(() => {
    window.addEventListener('pointerdown', hide);
    window.addEventListener('scroll', hide, true);
    return () => {
      window.removeEventListener('pointerdown', hide);
      window.removeEventListener('scroll', hide, true);
    };
  }, [hide]);

  // Place to the right of the element; flip left / clamp to stay on screen.
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!tip || !box) return;
    const { rect } = tip;
    const w = box.offsetWidth;
    const h = box.offsetHeight;
    let left = rect.right + TOOLTIP.gapPx;
    if (left + w > window.innerWidth - TOOLTIP.edgePx) left = rect.left - TOOLTIP.gapPx - w;
    const top = Math.min(Math.max(rect.top, TOOLTIP.edgePx), window.innerHeight - h - TOOLTIP.edgePx);
    box.style.left = `${Math.max(TOOLTIP.edgePx, left)}px`;
    box.style.top = `${top}px`;
  }, [tip]);

  const value = useMemo(() => ({ show, hide, setSuppressed }), [show, hide, setSuppressed]);
  const Content = tip && TOOLTIP_TYPES[tip.type];

  return (
    <TooltipContext.Provider value={value}>
      {children}
      {Content && (
        <div
          ref={boxRef}
          className="fixed z-50 pointer-events-none text-left rounded-lg border-stroke border-dusk bg-blush px-4 py-2"
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

// For screens that need to switch tooltips off for a while (e.g. dragging).
export function useTooltipControls() {
  return useContext(TooltipContext);
}
