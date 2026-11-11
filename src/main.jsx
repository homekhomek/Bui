import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { STROKE_PX, TEXT_SIZES } from './data.js';

// Feed text sizes from data.js into the CSS variables Tailwind's text-* classes use.
for (const { name, px } of TEXT_SIZES) {
  document.documentElement.style.setProperty(`--size-${name}`, `${px}px`);
}
// The standard stroke width, used by the border-stroke class.
document.documentElement.style.setProperty('--stroke', `${STROKE_PX}px`);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
