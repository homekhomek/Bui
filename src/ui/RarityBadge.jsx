import { METRIC, RARITIES } from '../data.js';
import { t } from '../translate.js';
import { useTooltip } from './tooltip/Tooltip.jsx';

// A rarity's name in a small box tinted its color. Hovering it explains it.
export default function RarityBadge({ id }) {
  const rarity = RARITIES[id];
  const tooltip = useTooltip('rarity', { id });
  if (!rarity) return null;
  return (
    <span className="flex">
      <span
        {...tooltip}
        className="inline-flex items-center rounded border-stroke border-dusk leading-none cursor-pointer"
        style={{ padding: `${METRIC.paddingYPx}px ${METRIC.paddingXPx}px`, backgroundColor: `var(--color-${rarity.color})` }}
      >
        <span className="text-trim">{t(`rarity.${id}`)}</span>
      </span>
    </span>
  );
}
