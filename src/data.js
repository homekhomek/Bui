// data.js — ALL numbers and game data live here.
// Stats, costs, timings, sizes, unit definitions, wave tables, etc.
// Components and logic should import values from here instead of hardcoding them.

export const GAME = {
  version: '0.1.0',
};

export const LAYOUT = {
  maxWidth: 960, // px, width of the centered game area
};

export const UNITS = {
  // example: { id: 'bui', hp: 10, attack: 2, speed: 1 }
};

// Approved text sizes in px. These are the ONLY text sizes in the project.
// Use them as Tailwind classes: text-base, text-lg, ... text-8xl.
export const TEXT_SIZES = [
  { name: 'base', px: 24 },
  { name: 'lg', px: 30 },
  { name: 'xl', px: 36 },
  { name: '2xl', px: 48 },
  { name: '3xl', px: 60 },
  { name: '4xl', px: 72 },
  { name: '5xl', px: 96 },
  { name: '6xl', px: 120 },
  { name: '7xl', px: 144 },
  { name: '8xl', px: 192 },
];
