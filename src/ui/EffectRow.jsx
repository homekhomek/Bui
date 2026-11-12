import { EFFECT_ROW, KEYWORDS, UI } from '../data.js';
import { t } from '../translate.js';
import { effectValue } from '../game/effects.js';
import EffectIcon from './EffectIcon.jsx';
import { useTooltip } from './tooltip/Tooltip.jsx';

// An effect row's full height (icon, padding, border). Metric displays match it.
export const effectRowHeight = () => UI.iconPx + 2 * EFFECT_ROW.paddingYPx + 2 * UI.strokePx;

// One effect as a clear horizontal box: icon, name, then the number.
// Hovering it explains what the effect does. With onPointerDown it can be
// dragged (an effect an encounter offers, to drop onto a node).
// boosts: what the node has built up this battle (keyword -> amount).
export default function EffectRow({ effect, level = 1, boosts, onPointerDown }) {
  const { paddingXPx, paddingYPx, gapPx, minWidthPx } = EFFECT_ROW;
  const kw = KEYWORDS[effect.keyword];
  const value = effectValue(effect, level, boosts);
  const tooltip = useTooltip('effect', { keyword: kw.id });
  return (
    <div
      {...tooltip}
      onPointerDown={onPointerDown}
      className="flex items-center rounded-tile border-stroke border-dusk cursor-pointer"
      style={{
        gap: gapPx,
        padding: `${paddingYPx}px ${paddingXPx}px`,
        minWidth: minWidthPx,
        backgroundColor: `var(--color-${kw.color})`,
        touchAction: onPointerDown ? 'none' : undefined,
      }}
    >
      <EffectIcon icon={kw.icon} />
      <span className="flex-1">{t(`effect.${kw.id}`)}</span>
      <span className="font-heading">{value}</span>
    </div>
  );
}
