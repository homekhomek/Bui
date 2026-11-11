import { FIGHTER_TEMPLATES, INVENTORY, SPRITE } from '../data.js';
import { fighterSprite } from './assets.js';
import { useTooltip } from './tooltip/Tooltip.jsx';

// Sprites are scaled so one sprite tile matches one inventory node tile.
const scale = INVENTORY.cellPx / SPRITE.tileArt;
const sizePx = SPRITE.sizeArt * scale;
const bodyPx = SPRITE.bodyArt * scale;
// The body sits at the bottom middle of the canvas.
const bodyLeftPx = ((SPRITE.sizeArt - SPRITE.bodyArt) / 2) * scale;
const bodyTopPx = (SPRITE.sizeArt - SPRITE.bodyArt) * scale;

// A fighter's sprite. Only its body square takes up layout space (and is
// hoverable); the rest of the canvas overflows around it.
// equipment (optional) lets the tooltip show max HP with that equipment.
// Sprites face right; flip mirrors them to face left (the right-hand side in battle).
// sprite overrides the template's sprite file; interactive=false drops the
// tooltip (both for admin previews of unsaved templates).
export default function FighterSprite({ template, equipment, flip = false, sprite, interactive = true }) {
  const file = sprite ?? FIGHTER_TEMPLATES[template].sprite;
  const tooltip = useTooltip('fighter', { id: template, equipment });
  return (
    <div {...(interactive ? tooltip : {})} className="relative shrink-0 cursor-pointer" style={{ width: bodyPx, height: bodyPx }}>
      <img
        src={fighterSprite(file)}
        alt=""
        width={sizePx}
        height={sizePx}
        draggable={false}
        className="absolute max-w-none pointer-events-none"
        style={{ left: -bodyLeftPx, top: -bodyTopPx, transform: flip ? 'scaleX(-1)' : undefined }}
      />
    </div>
  );
}
