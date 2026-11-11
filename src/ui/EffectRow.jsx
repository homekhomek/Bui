import { EFFECT_ROW, KEYWORDS } from '../data.js';
import { t } from '../translate.js';
import { effectValue } from '../game/effects.js';
import { effectIcon } from './assets.js';

const { iconPx, paddingXPx, paddingYPx, gapPx, minWidthPx } = EFFECT_ROW;

// One effect as a clear horizontal box: icon, name, then the number.
export default function EffectRow({ effect, level = 1 }) {
  const kw = KEYWORDS[effect.keyword];
  return (
    <div
      className="flex items-center rounded-lg border-stroke border-dusk"
      style={{
        gap: gapPx,
        padding: `${paddingYPx}px ${paddingXPx}px`,
        minWidth: minWidthPx,
        backgroundColor: `var(--color-${kw.color})`,
      }}
    >
      <img src={effectIcon(kw.icon)} alt="" width={iconPx} height={iconPx} draggable={false} className="block shrink-0" />
      <span className="flex-1">{t(`effect.${kw.id}`)}</span>
      <span className="font-heading">{effectValue(effect, level)}</span>
    </div>
  );
}
