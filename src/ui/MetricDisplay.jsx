import { METRIC } from '../data.js';
import SymbolText from './SymbolText.jsx';

// A metric display: a small bordered, padded inline box holding one stat,
// e.g. "5 {slot}" or "10 {charge}/s". k/vars are a translate key and its vars.
// Text and icons are vertically centered on each other.
export default function MetricDisplay({ k, vars }) {
  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded border-stroke border-dusk bg-white leading-none"
      style={{ padding: `${METRIC.paddingYPx}px ${METRIC.paddingXPx}px` }}
    >
      <SymbolText k={k} vars={vars} trim />
    </span>
  );
}
