import { STATUS_COUNTER, STATUSES } from '../data.js';
import EffectIcon from './EffectIcon.jsx';
import { effectRowHeight } from './EffectRow.jsx';
import { useTooltip } from './tooltip/Tooltip.jsx';

// One status counter on a fighter in battle: the status's icon and its count,
// in a small box tinted the status's color.
export default function StatusCounter({ id, count }) {
  const { paddingXPx, paddingYPx, gapPx } = STATUS_COUNTER;
  const status = STATUSES[id];
  const tooltip = useTooltip('status', { id, count });
  return (
    <span
      {...tooltip}
      className="inline-flex items-center rounded-tile border-stroke border-dusk leading-none cursor-pointer"
      style={{ height: effectRowHeight(), gap: gapPx, padding: `${paddingYPx}px ${paddingXPx}px`, backgroundColor: `var(--color-${status.color})` }}
    >
      <EffectIcon icon={status.icon} />
      <span className="font-heading text-trim">{count}</span>
    </span>
  );
}
