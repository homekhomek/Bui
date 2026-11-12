import { METRIC } from '../data.js';
import SymbolText from './SymbolText.jsx';
import { effectRowHeight } from './EffectRow.jsx';
import { useTooltip } from './tooltip/Tooltip.jsx';

// A metric display: a small bordered, padded inline box holding one stat,
// e.g. "5 {slot}" or "10 {charge}/s". k/vars are a translate key and its vars.
// Drawn in the heading font, like effect numbers, and as tall as an effect row.
// Text and icons are vertically centered on each other.
// Hovering it explains what the stat does (no numbers): tip = translate key
// (default 'metricTip.<k>').
export default function MetricDisplay({ k, vars, tip = `metricTip.${k}` }) {
  const tooltip = useTooltip('metric', { k: tip });
  return (
    <span
      {...tooltip}
      className="inline-flex items-center whitespace-nowrap rounded-tile border-stroke border-dusk bg-white font-heading leading-none cursor-pointer"
      style={{ height: effectRowHeight(), padding: `${METRIC.paddingYPx}px ${METRIC.paddingXPx}px` }}
    >
      <SymbolText k={k} vars={vars} trim />
    </span>
  );
}
