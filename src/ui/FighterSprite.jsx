import { HIT, INVENTORY, SPRITE } from '../data.js';
import { fighterSprite } from './assets.js';
import { useTooltip } from './tooltip/Tooltip.jsx';

// A fighter's sprite. Only its body square takes up layout space (and is
// hoverable); the rest of the canvas overflows around it.
// fighter: the run's copy of a fighter (see createFighter in game/fighter.js),
// or a battle fighter; its tooltip shows its current stats.
// Sprites face right; flip mirrors them to face left (the right-hand side in battle).
// interactive=false drops the tooltip (admin previews pass just { sprite }).
export default function FighterSprite({ fighter, flip = false, interactive = true }) {
  // Scaled so one sprite tile matches one inventory node tile (which follows
  // the UI scale). The body sits at the bottom middle of the canvas.
  const scale = INVENTORY.cellPx / SPRITE.tileArt;
  const sizePx = SPRITE.sizeArt * scale;
  const bodyPx = SPRITE.bodyArt * scale;
  const bodyLeftPx = ((SPRITE.sizeArt - SPRITE.bodyArt) / 2) * scale;
  const bodyTopPx = (SPRITE.sizeArt - SPRITE.bodyArt) * scale;
  const tooltip = useTooltip('fighter', { fighter });
  return (
    <div {...(interactive ? tooltip : {})} data-fighter-body className="relative shrink-0 cursor-pointer" style={{ width: bodyPx, height: bodyPx }}>
      {/* The art, and over it a same-shaped flash (hidden): battle effects
          shake data-fighter-art and flash data-fighter-flash on a hit. */}
      <div data-fighter-art className="absolute pointer-events-none" style={{ left: -bodyLeftPx, top: -bodyTopPx, width: sizePx, height: sizePx }}>
        <img
          src={fighterSprite(fighter.sprite)}
          alt=""
          width={sizePx}
          height={sizePx}
          draggable={false}
          className="absolute inset-0 max-w-none"
          style={{ transform: flip ? 'scaleX(-1)' : undefined }}
        />
        <div
          data-fighter-flash
          className="absolute inset-0 opacity-0"
          style={{
            backgroundColor: `var(--color-${HIT.flashColor})`,
            maskImage: `url(${fighterSprite(fighter.sprite)})`,
            maskSize: '100% 100%',
            transform: flip ? 'scaleX(-1)' : undefined,
          }}
        />
      </div>
    </div>
  );
}
