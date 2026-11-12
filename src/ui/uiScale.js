// The UI scale follows the window's height (see UI_SCALE in data.js). This
// keeps the CSS side (root font size, text sizes, stroke width) in step with
// it and re-renders the app when it changes.

import { useEffect, useState } from 'react';
import { CORNERS, fitUiScale, px, TEXT_SIZES, UI, uiScale } from '../data.js';

// Push the current scale into the CSS variables Tailwind's classes use.
function applyCss() {
  const root = document.documentElement.style;
  // Tailwind's spacing classes (p-4, gap-2, ...) are in rem.
  root.fontSize = `${UI.remPx}px`;
  // Text sizes, for the text-* classes.
  for (const { name, px: size } of TEXT_SIZES) root.setProperty(`--size-${name}`, `${px(size)}px`);
  // The standard stroke width, for the border-stroke class.
  root.setProperty('--stroke', `${UI.strokePx}px`);
  // The two corner roundings, for rounded-tile and rounded-panel.
  root.setProperty('--corner-tile', `${CORNERS.tilePx}px`);
  root.setProperty('--corner-panel', `${CORNERS.panelPx}px`);
}

// Once, before the first render.
export function initUiScale() {
  fitUiScale(window.innerHeight);
  applyCss();
}

// Re-fits the scale when the window is resized; returns the current scale.
// Use it once, at the top of the app: everything below re-renders with it.
export function useUiScale() {
  const [scale, setScale] = useState(uiScale);
  useEffect(() => {
    let frame = 0;
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!fitUiScale(window.innerHeight)) return;
        applyCss();
        setScale(uiScale());
      });
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
    };
  }, []);
  return scale;
}
