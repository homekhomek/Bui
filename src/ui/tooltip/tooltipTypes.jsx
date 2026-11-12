// Tooltip renderers, by type. To add a new tooltip kind, add a component here
// and open it with useTooltip('<type>', props).

import { ENEMIES, EQUIPMENT, KEYWORDS, NODES, STATUSES } from '../../data.js';
import RarityBadge, { TypeBadge } from '../RarityBadge.jsx';
import { maxHp } from '../../game/fighter.js';
import { t } from '../../translate.js';
import EffectRow from '../EffectRow.jsx';
import MetricDisplay from '../MetricDisplay.jsx';
import SymbolText from '../SymbolText.jsx';

function Title({ children }) {
  return <h3 className="text-lg leading-tight">{children}</h3>;
}

// Under the title: its rarity if it has one, then what sort of thing this is
// (see TypeBadge).
function Badges({ kind, rarity }) {
  return (
    <div className="flex flex-wrap gap-2">
      {rarity && <RarityBadge id={rarity} />}
      <TypeBadge kind={kind} />
    </div>
  );
}

// { def, level, extra, boosts }. extra = effects this one node has gained on
// top of its type's; boosts = what it has built up this battle (keyword ->
// amount). node / name override the data.js entry (admin previews).
export function NodeTooltip({ def, level = 1, extra = [], boosts, node = NODES[def], name = t(`node.${def}`) }) {
  const effects = [...node.effects, ...(extra ?? [])];
  return (
    <div className="flex flex-col gap-1">
      <Title>{name}</Title>
      <Badges kind="node" rarity={node.rarity} />
      <div className="flex flex-wrap gap-2">
        <MetricDisplay k="metricLevel" vars={{ n: level }} />
        <MetricDisplay k="metricCharge" vars={{ n: node.maxCharge }} />
      </div>
      {effects.map((e, i) => (
        <EffectRow key={i} effect={e} level={level} boosts={boosts} />
      ))}
    </div>
  );
}

// { id }. equipment / name override the data.js entry (admin previews).
export function EquipmentTooltip({ id, equipment: eq = EQUIPMENT[id], name = t(`equipment.${id}`) }) {
  return (
    <div className="flex flex-col gap-1">
      <Title>{name}</Title>
      <Badges kind="equipment" rarity={eq.rarity} />
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

// { fighter }: a fighter as it is now (the run's copy, or in battle), so
// anything the run has changed about it shows.
function FighterTooltip({ fighter }) {
  return (
    <div className="flex flex-col gap-1">
      <Title>{t(`fighter.${fighter.template}`)}</Title>
      <Badges kind="fighter" />
      <div className="flex flex-wrap gap-2">
        <MetricDisplay k="metricHp" tip="metricTip.fighterHp" vars={{ n: maxHp(fighter) }} />
        <MetricDisplay k="metricEquipment" vars={{ n: fighter.maxEquipment }} />
      </div>
    </div>
  );
}

// Numbers a status's text can show (from STATUSES in data.js).
const statusVars = (id) => ({ percent: Math.round((STATUSES[id]?.damageBonus ?? 0) * 100) });

// { id, count }: a status counter on a fighter
function StatusTooltip({ id, count }) {
  return (
    <div className="flex flex-col gap-1">
      <Title>{t(`status.${id}`)}</Title>
      <span className="text-slate">{t('statusCount', { n: count })}</span>
      <span>{t(`statusTip.${id}`, statusVars(id))}</span>
    </div>
  );
}

// { keyword }: what an effect does, in general (no numbers)
function EffectTooltip({ keyword }) {
  return (
    <div className="flex flex-col gap-1">
      <Title>{t(`effect.${keyword}`)}</Title>
      <Badges kind="effect" />
      <span>
        <SymbolText k={`effectTip.${keyword}`} vars={statusVars(KEYWORDS[keyword].status)} />
      </span>
    </div>
  );
}

// { k }: what a metric means, in general (k = its explanation's translate key,
// 'metricTip.<name>'). Headed by the metric's name and symbol ('metricName.<name>').
function MetricTooltip({ k }) {
  return (
    <div className="flex flex-col gap-1">
      <Title>
        <span className="inline-flex items-center gap-1">
          <SymbolText k={k.replace(/^metricTip\./, 'metricName.')} trim />
        </span>
      </Title>
      <span>
        <SymbolText k={k} />
      </span>
    </div>
  );
}

// A step of the run display (see runSteps in game/run.js): what it is, when
// it is, and for battles who is fought.
function RunStepTooltip({ kind, stage, boss, enemy, state }) {
  const title = kind === 'encounter' ? t('runStep.encounter') : t(boss ? 'runStep.boss' : 'runStep.battle', { n: stage + 1 });
  return (
    <div className="flex flex-col gap-1">
      <Title>{title}</Title>
      <span className="text-slate">{t(`runState.${state}`)}</span>
      {enemy && <span>{t('runEnemy', { names: ENEMIES[enemy].fighters.map((f) => t(`fighter.${f}`)).join(', ') })}</span>}
    </div>
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
  runStep: RunStepTooltip,
};
