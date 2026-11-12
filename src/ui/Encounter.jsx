// Encounter cards (the choice, floating above the fighter) and the panel of
// the encounter being done.

import { ENCOUNTER_UI, ENCOUNTERS } from '../data.js';
import { t } from '../translate.js';
import { canUseEncounter, encounterType } from '../game/encounters.js';
import { slotNode } from '../game/edit.js';
import { useEdit } from './editContext.js';
import FloatingItem, { bobStyle } from './FloatingItem.jsx';
import RarityBadge from './RarityBadge.jsx';
import SymbolText from './SymbolText.jsx';
import { encounterAction, encounterDescription, encounterName } from './encounterText.js';

export function Button({ primary, ...props }) {
  return (
    <button
      className={`px-6 py-1 rounded-tile disabled:opacity-40 ${primary ? 'bg-rose hover:bg-dusty' : 'bg-haze hover:bg-mist'}`}
      {...props}
    />
  );
}

// One encounter on offer: click to pick it. entry / name / description
// override data.js and translate.js (admin previews).
export function EncounterCard({ id, index = 0, onPick, entry = ENCOUNTERS[id], name = encounterName(id), description }) {
  return (
    <div style={bobStyle(index)}>
      <button
        onClick={onPick}
        className="flex flex-col items-start gap-2 p-4 rounded-panel border-stroke border-dusk bg-blush hover:bg-haze text-left"
        style={{ width: ENCOUNTER_UI.cardWidthPx }}
      >
        <h3 className="text-xl">{name}</h3>
        <RarityBadge id={entry.rarity} />
        <span>
          <SymbolText text={description ?? encounterDescription(id, entry)} />
        </span>
      </button>
    </div>
  );
}

// The picked encounter, split over the explore screen's top area:
//   EncounterInfo   (upper left)  what it is: name, rarity, what it does
//   EncounterStage  (center)      the things it offers to take (loot,
//                                 choices, an effect to drag onto a node), or
//                                 its slot (if it needs a node) and action button
// Leave / Continue sits on the right (see ExploreScreen). Encounters move on
// by themselves once their action is done (see settleEncounter in run.js).

export function EncounterInfo({ encounter, loadout }) {
  const id = encounter.picked;
  const type = encounterType(id);
  const left = type.toTake?.(loadout) ?? 0;
  return (
    <div className="flex flex-col items-start gap-2 text-left">
      <h2 className="text-2xl leading-tight">{encounterName(id)}</h2>
      <RarityBadge id={ENCOUNTERS[id].rarity} />
      <span>
        <SymbolText text={encounterDescription(id)} />
      </span>
      {type.instant && left > 0 && (
        <span className="text-slate">{type.hint ? t(type.hint) : t(left === 1 ? 'takeThing' : 'takeThings', { n: left })}</span>
      )}
    </div>
  );
}

export function EncounterStage({ encounter, loadout, onUse }) {
  const edit = useEdit();
  const id = encounter.picked;
  const type = encounterType(id);
  const node = slotNode(loadout);
  const canUse = canUseEncounter(id, loadout, node);
  const items = loadout.floating.filter((n) => n.zone === 'loot' || n.zone === 'choice');

  if (type.instant) {
    return items.map((n, i) => <FloatingItem key={n.uid} node={n} index={i} />);
  }
  return (
    <div className="flex items-center gap-6">
      {/* Drag a node in here (the node can be dragged back out) */}
      {type.needsNode && (
        <div
          ref={edit.registerSlot}
          className="flex items-center justify-center rounded-tile border-stroke border-dashed border-dusk"
          style={{
            minWidth: ENCOUNTER_UI.slotPx,
            minHeight: ENCOUNTER_UI.slotPx,
            padding: ENCOUNTER_UI.slotPaddingPx,
            backgroundColor: edit.hover?.slot ? 'var(--color-mint)' : undefined,
          }}
        >
          {node ? <FloatingItem node={node} index={0} /> : <span className="text-slate">{t('slotHint')}</span>}
        </div>
      )}
      {!encounter.used && (
        <Button primary disabled={!canUse} onClick={onUse}>
          {encounterAction(id)}
        </Button>
      )}
    </div>
  );
}

