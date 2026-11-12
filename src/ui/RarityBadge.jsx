import { BADGE, RARITIES } from '../data.js';
import { t } from '../translate.js';

// A small label in a box tinted `color`, in the heading font (like metric
// displays). No tooltip. Its size never depends on where it sits.
export function Badge({ color, children }) {
  return (
    <span className="flex">
      <span
        className="inline-flex items-center font-heading text-base whitespace-nowrap rounded-tile border-stroke border-dusk leading-none"
        style={{ padding: `${BADGE.paddingYPx}px ${BADGE.paddingXPx}px`, backgroundColor: `var(--color-${color})` }}
      >
        <span className="text-trim">{children}</span>
      </span>
    </span>
  );
}

// What sort of thing something is ('node', 'equipment', ...; 'kind.<kind>'
// in translate.js), e.g. next to its rarity in a tooltip.
export function TypeBadge({ kind }) {
  return <Badge color={BADGE.typeColors[kind]}>{t(`kind.${kind}`)}</Badge>;
}

// A rarity's name, tinted the rarity's color.
export default function RarityBadge({ id }) {
  const rarity = RARITIES[id];
  if (!rarity) return null;
  return <Badge color={rarity.color}>{t(`rarity.${id}`)}</Badge>;
}
