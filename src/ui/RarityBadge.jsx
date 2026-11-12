import { RARITIES, RARITY_BADGE } from '../data.js';
import { t } from '../translate.js';

// A rarity's name in a small box tinted its color. No tooltip.
// The one rarity badge used everywhere: its size never depends on where it sits.
export default function RarityBadge({ id }) {
  const rarity = RARITIES[id];
  if (!rarity) return null;
  return (
    <span className="flex">
      <span
        className="inline-flex items-center text-base whitespace-nowrap rounded border-stroke border-dusk leading-none"
        style={{ padding: `${RARITY_BADGE.paddingYPx}px ${RARITY_BADGE.paddingXPx}px`, backgroundColor: `var(--color-${rarity.color})` }}
      >
        <span className="text-trim">{t(`rarity.${id}`)}</span>
      </span>
    </span>
  );
}
