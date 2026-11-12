import { EFFECT_ROW, KEYWORDS } from '../data.js';
import { t } from '../translate.js';
import { effectValue } from '../game/effects.js';
import { effectIcon } from './assets.js';
import { useTooltip } from './tooltip/Tooltip.jsx';

const { iconPx, paddingXPx, paddingYPx, gapPx, minWidthPx } = EFFECT_ROW;

// One effect as a clear horizontal box: icon, name, then the number.
// Hovering it explains what the effect does. With onPointerDown it can be
// dragged (an effect an encounter offers, to drop onto a node).
// boosts: what the node has built up this battle (keyword -> amount).
export default function EffectRow({ effect, level = 1, boosts, onPointerDown }) {
  const kw = KEYWORDS[effect.keyword];
  const value = effectValue(effect, level, boosts);
  const tooltip = useTooltip('effect', { keyword: kw.id });
  return (
    <div
      {...tooltip}
      onPointerDown={onPointerDown}
      className="flex items-center rounded-lg border-stroke border-dusk cursor-pointer"
      style={{
        gap: gapPx,
        padding: `${paddingYPx}px ${paddingXPx}px`,
        minWidth: minWidthPx,
        backgroundColor: `var(--color-${kw.color})`,
        touchAction: onPointerDown ? 'none' : undefined,
      }}
    >
      <img src={effectIcon(kw.icon)} alt="" width={iconPx} height={iconPx} draggable={false} className="block shrink-0" />
      <span className="flex-1">{t(`effect.${kw.id}`)}</span>
      <span className="font-heading">{value}</span>
    </div>
  );
}
