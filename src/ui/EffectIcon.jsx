import { UI } from '../data.js';
import { effectIcon } from './assets.js';

// The one way an effect / symbol icon (public/assets/effects) is drawn:
// effect rows, status counters, metrics and {symbols} in text all use it, at
// UI.iconPx. Inline (sits on a text line) and works as a flex item too.
export default function EffectIcon({ icon, size = UI.iconPx }) {
  return (
    <img src={effectIcon(icon)} alt="" width={size} height={size} draggable={false} className="inline-block align-middle shrink-0" />
  );
}
