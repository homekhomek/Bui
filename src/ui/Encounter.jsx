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

function Button({ primary, ...props }) {
  return (
    <button
      className={`px-6 py-1 rounded-lg disabled:opacity-40 ${primary ? 'bg-rose hover:bg-dusty' : 'bg-haze hover:bg-mist'}`}
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
        className="flex flex-col items-start gap-2 p-4 rounded-xl border-stroke border-dusk bg-blush hover:bg-haze text-left"
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

// The picked encounter: what it does, then either the things it offers to
// take (instant encounters: loot, choices, an effect to drag onto a node), or
// its slot (if it needs a node) and action button. Continue / Leave moves on.
export function EncounterPanel({ encounter, loadout, onUse, onFinish }) {
  const edit = useEdit();
  const id = encounter.picked;
  const type = encounterType(id);
  const node = slotNode(loadout);
  const canUse = canUseEncounter(id, loadout, node);
  const items = loadout.floating.filter((n) => n.zone === 'loot' || n.zone === 'choice');
  const left = type.toTake?.(loadout) ?? 0;

  return (
    <div
      className="flex flex-col items-center gap-3 p-4 rounded-xl border-stroke border-dusk bg-blush"
      style={{ width: ENCOUNTER_UI.panelWidthPx }}
    >
      <h2 className="text-2xl">{encounterName(id)}</h2>
      <RarityBadge id={ENCOUNTERS[id].rarity} />
      <span>
        <SymbolText text={encounterDescription(id)} />
      </span>

      {/* What this encounter offers: drag things out to take them */}
      {type.instant && left > 0 && (
        <span className="text-slate">{type.hint ? t(type.hint) : t(left === 1 ? 'takeThing' : 'takeThings', { n: left })}</span>
      )}
      {type.instant && items.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-6 py-2">
          {items.map((n, i) => (
            <FloatingItem key={n.uid} node={n} index={i} />
          ))}
        </div>
      )}

      {/* Drag a node in here (the node can be dragged back out) */}
      {type.needsNode && (
        <div
          ref={edit.registerSlot}
          className="flex items-center justify-center rounded-lg border-stroke border-dashed border-dusk"
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

      <div className="flex flex-wrap justify-center gap-2">
        {encounter.used ? (
          <Button primary onClick={onFinish}>
            {t('continue')}
          </Button>
        ) : (
          <>
            <Button primary disabled={!canUse} onClick={onUse}>
              {encounterAction(id)}
            </Button>
            <Button onClick={onFinish}>{t('leave')}</Button>
          </>
        )}
      </div>
    </div>
  );
}
