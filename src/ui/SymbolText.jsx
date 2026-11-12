import { CHARGE, HP, INVENTORY, LEVEL, UI } from '../data.js';
import { t } from '../translate.js';
import EffectIcon from './EffectIcon.jsx';

const iconSymbol = (icon) => (size) => <EffectIcon icon={icon} size={size} />;

// Placeholders drawn as symbols instead of words.
const SYMBOLS = {
  charge: iconSymbol(CHARGE.icon),
  hp: iconSymbol(HP.icon),
  lvl: iconSymbol(LEVEL.icon),
  // A node slot: a small grey bordered rounded square, like a grid tile.
  // The border sits inside its size (border-box), so it takes the same space.
  slot: (size) => (
    <span
      className="inline-block align-middle shrink-0 rounded-tile border-stroke border-dusk bg-mist"
      style={{ width: size * INVENTORY.slotSymbolScale, height: size * INVENTORY.slotSymbolScale }}
    />
  ),
};

export function SymbolIcon({ name, size = UI.iconPx }) {
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
