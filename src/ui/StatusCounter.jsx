import { STATUS_COUNTER, STATUSES } from '../data.js';
import { effectIcon } from './assets.js';
import { useTooltip } from './tooltip/Tooltip.jsx';

const { iconPx, paddingXPx, paddingYPx, gapPx } = STATUS_COUNTER;

// One status counter on a fighter in battle: the status's icon and its count,
// in a small box tinted the status's color.
export default function StatusCounter({ id, count }) {
  const status = STATUSES[id];
  const tooltip = useTooltip('status', { id, count });
  return (
    <span
      {...tooltip}
      className="inline-flex items-center rounded border-stroke border-dusk leading-none cursor-pointer"
      style={{ gap: gapPx, padding: `${paddingYPx}px ${paddingXPx}px`, backgroundColor: `var(--color-${status.color})` }}
    >
      <img src={effectIcon(status.icon)} alt="" width={iconPx} height={iconPx} draggable={false} className="block shrink-0" />
      <span className="font-heading text-trim">{count}</span>
    </span>
  );
}
