// Tooltip renderers, by type. To add a new tooltip kind, add a component here
// and open it with useTooltip('<type>', props).

import { EQUIPMENT, FIGHTER_TEMPLATES, NODES } from '../../data.js';
import RarityBadge from '../RarityBadge.jsx';
import { maxHp } from '../../game/fighter.js';
import { t } from '../../translate.js';
import EffectRow from '../EffectRow.jsx';
import MetricDisplay from '../MetricDisplay.jsx';
import SymbolText from '../SymbolText.jsx';

function Title({ children }) {
  return <h3 className="text-lg leading-tight">{children}</h3>;
}

// { def, level, extra, boosts }. extra = effects this one node has gained on
// top of its type's; boosts = what it has built up this battle (keyword ->
// amount). node / name override the data.js entry (admin previews).
export function NodeTooltip({ def, level = 1, extra = [], boosts, node = NODES[def], name = t(`node.${def}`) }) {
  const effects = [...node.effects, ...(extra ?? [])];
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3">
        <Title>{name}</Title>
        <div className="flex gap-2">
          <MetricDisplay k="metricLevel" vars={{ n: level }} />
          <MetricDisplay k="metricCharge" vars={{ n: node.maxCharge }} />
        </div>
      </div>
      <RarityBadge id={node.rarity} />
      {effects.map((e, i) => (
        <EffectRow key={i} effect={e} level={level} boosts={boosts} />
      ))}
      {effects.some((e) => e.upgradeDelta) && <span className="text-slate">{t('tipUpgrade')}</span>}
    </div>
  );
}

// { id }. equipment / name override the data.js entry (admin previews).
export function EquipmentTooltip({ id, equipment: eq = EQUIPMENT[id], name = t(`equipment.${id}`) }) {
  return (
    <div className="flex flex-col gap-1">
      <Title>{name}</Title>
      <RarityBadge id={eq.rarity} />
      <div className="flex flex-wrap gap-2">
        <MetricDisplay k="metricSlots" vars={{ n: eq.nodeSlots }} />
        <MetricDisplay k="metricChargeRate" vars={{ n: eq.chargeRate }} />
        <MetricDisplay k="metricHp" vars={{ n: eq.hp }} />
      </div>
    </div>
  );
}

// {}
function EmptySlotTooltip() {
  return <Title>{t('emptySlot')}</Title>;
}

// { id, equipment? }: a fighter template. With equipment, max HP includes it.
function FighterTooltip({ id, equipment }) {
  const def = FIGHTER_TEMPLATES[id];
  return (
    <div className="flex flex-col gap-1">
      <Title>{t(`fighter.${id}`)}</Title>
      <div className="flex flex-wrap gap-2">
        <MetricDisplay k="metricHp" tip="metricTip.fighterHp" vars={{ n: equipment ? maxHp(id, equipment) : def.baseHp }} />
        <MetricDisplay k="metricEquipment" vars={{ n: def.maxEquipment }} />
      </div>
    </div>
  );
}

// { id, count }: a status counter on a fighter
function StatusTooltip({ id, count }) {
  return (
    <div className="flex flex-col gap-1">
      <Title>{t(`status.${id}`)}</Title>
      <span className="text-slate">{t('statusCount', { n: count })}</span>
      <span>{t(`statusTip.${id}`)}</span>
    </div>
  );
}

// { keyword }: what an effect does, in general (no numbers)
function EffectTooltip({ keyword }) {
  return (
    <div className="flex flex-col gap-1">
      <Title>{t(`effect.${keyword}`)}</Title>
      <span>
        <SymbolText k={`effectTip.${keyword}`} />
      </span>
    </div>
  );
}

// { k }: what a metric means, in general (k = its explanation's translate key)
function MetricTooltip({ k }) {
  return (
    <span>
      <SymbolText k={k} />
    </span>
  );
}

// { text }: a plain line of text
function TextTooltip({ text }) {
  return <span>{text}</span>;
}

export const TOOLTIP_TYPES = {
  text: TextTooltip,
  fighter: FighterTooltip,
  status: StatusTooltip,
  effect: EffectTooltip,
  metric: MetricTooltip,
  node: NodeTooltip,
  equipment: EquipmentTooltip,
  emptySlot: EmptySlotTooltip,
};
