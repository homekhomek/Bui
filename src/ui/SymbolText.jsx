import { CHARGE, EFFECT_ROW, HP, INVENTORY, LEVEL } from '../data.js';
import { t } from '../translate.js';
import { effectIcon } from './assets.js';

const imgSymbol = (src) => (size) => (
  <img src={src} alt="" width={size} height={size} draggable={false} className="inline-block align-middle shrink-0" />
);

// Placeholders drawn as symbols instead of words.
const SYMBOLS = {
  charge: imgSymbol(effectIcon(CHARGE.icon)),
  hp: imgSymbol(effectIcon(HP.icon)),
  lvl: imgSymbol(effectIcon(LEVEL.icon)),
  // A node slot: a small grey rounded square, like a grid tile.
  slot: (size) => (
    <span
      className="inline-block align-middle shrink-0 rounded bg-mist"
      style={{ width: size * INVENTORY.slotSymbolScale, height: size * INVENTORY.slotSymbolScale }}
    />
  ),
};

export function SymbolIcon({ name, size = EFFECT_ROW.inlineIconPx }) {
  return SYMBOLS[name](size);
}

// t(key, vars), with symbol placeholders like {charge} or {slot} drawn as icons.
// trim: each text run is trimmed to its letters (no font padding above/below)
// and keeps its spaces, for use inside a centering flex row.
// text: an already-built string to draw instead of t(k, vars).
export default function SymbolText({ k, vars = {}, text, trim = false }) {
  const parts = (text ?? t(k, vars)).split(/\{(\w+)\}/);
  return parts.map((part, i) => {
    if (i % 2 === 1 && SYMBOLS[part]) return <SymbolIcon key={i} name={part} />;
    if (!trim || part === '') return part;
    return (
      <span key={i} className="text-trim whitespace-pre">
        {part}
      </span>
    );
  });
}
