import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { TEXT_SIZES } from './data.js';

// Feed text sizes from data.js into the CSS variables Tailwind's text-* classes use.
for (const { name, px } of TEXT_SIZES) {
  document.documentElement.style.setProperty(`--size-${name}`, `${px}px`);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
