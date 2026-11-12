import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { initUiScale } from './ui/uiScale.js';

// Fit the UI scale to the window, and feed text sizes, stroke width and the
// root font size into the CSS variables Tailwind's classes use.
initUiScale();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
