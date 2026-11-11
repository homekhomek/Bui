// Tooltip renderers, by type. To add a new tooltip kind, add a component here
// and open it with useTooltip('<type>', props).

import { EQUIPMENT, NODES } from '../../data.js';
import { t } from '../../translate.js';
import { isUpgradable } from '../../game/effects.js';
import EffectRow from '../EffectRow.jsx';
import MetricDisplay from '../MetricDisplay.jsx';

function Title({ children }) {
  return <h3 className="text-lg leading-tight">{children}</h3>;
}

// { def, level }
function NodeTooltip({ def, level = 1 }) {
  const node = NODES[def];
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3">
        <Title>{t(`node.${def}`)}</Title>
        <MetricDisplay k="metricCharge" vars={{ n: node.maxCharge }} />
      </div>
      <span className="text-slate">{t('tipLevel', { n: level })}</span>
      {node.effects.map((e, i) => (
        <EffectRow key={i} effect={e} level={level} />
      ))}
      {isUpgradable(def) && <span className="text-slate">{t('tipUpgrade')}</span>}
    </div>
  );
}

// { id }
function EquipmentTooltip({ id }) {
  const eq = EQUIPMENT[id];
  return (
    <div className="flex flex-col gap-1">
      <Title>{t(`equipment.${id}`)}</Title>
      <div className="flex flex-wrap gap-2">
        <MetricDisplay k="metricSlots" vars={{ n: eq.nodeSlots }} />
        <MetricDisplay k="metricChargeRate" vars={{ n: eq.chargeRate }} />
      </div>
    </div>
  );
}

// {}
function EmptySlotTooltip() {
  return <Title>{t('emptySlot')}</Title>;
}

export const TOOLTIP_TYPES = {
  node: NodeTooltip,
  equipment: EquipmentTooltip,
  emptySlot: EmptySlotTooltip,
};
