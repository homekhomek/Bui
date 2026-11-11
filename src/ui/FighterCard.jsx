import { FIGHTER_TEMPLATES, SPRITE, STATUSES } from '../data.js';
import { t } from '../translate.js';
import { maxHp } from '../game/fighter.js';
import FighterSprite from './FighterSprite.jsx';
import Inventory from './Inventory.jsx';
import MetricDisplay from './MetricDisplay.jsx';
import StatusCounter from './StatusCounter.jsx';
import SymbolText from './SymbolText.jsx';

// A fighter's card (name, health, inventory) with its sprite standing on top:
// the sprite's body is bottom-anchored to the card's top edge and drawn behind
// the card, which overlaps it by SPRITE.cardOverlapPx. Works for battle state fighters and
// for edit-phase loadouts (pass hp/statuses as undefined to hide the bars and
// show the fighter's max HP, which changes with its equipment, instead).
// flip: mirror the sprite to face left (fighters on the right in battle).
export default function FighterCard({ fighter, area, animMs, flip = false }) {
  const def = FIGHTER_TEMPLATES[fighter.def];
  const showHealth = fighter.hp !== undefined;

  return (
    <div className={`flex flex-col items-center ${fighter.alive === false ? 'opacity-40' : ''}`}>
      <div className="relative z-0">
        <FighterSprite template={def.id} equipment={fighter.equipment} flip={flip} />
      </div>

      <div
        className="relative z-10 flex flex-col items-center gap-2 p-4 rounded-xl border-stroke border-dusk bg-blush"
        style={{ marginTop: -SPRITE.cardOverlapPx }}
      >
        <div className="flex items-center gap-3">
          <h2 className="text-xl">{t(`fighter.${def.id}`)}</h2>
          {!showHealth && <MetricDisplay k="metricHp" tip="metricTip.fighterHp" vars={{ n: maxHp(def.id, fighter.equipment) }} />}
        </div>

        {showHealth && (
          <div className="w-full flex flex-col items-center gap-1">
            <div className="w-full h-4 rounded-full bg-haze overflow-hidden">
              <div className="h-full bg-mint" style={{ width: `${(fighter.hp / fighter.maxHp) * 100}%` }} />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <span className="inline-flex items-center leading-none">
                <SymbolText k="hp" vars={{ current: fighter.hp, max: fighter.maxHp }} trim />
              </span>
              {/* Status counters, in STATUSES order */}
              {Object.keys(STATUSES)
                .filter((id) => fighter.statuses?.[id] > 0)
                .map((id) => (
                  <StatusCounter key={id} id={id} count={fighter.statuses[id]} />
                ))}
            </div>
          </div>
        )}

        <Inventory
          area={area}
          equipment={fighter.equipment}
          maxEquipment={fighter.maxEquipment ?? def.maxEquipment}
          nodes={fighter.nodes}
          animMs={animMs}
        />
      </div>
    </div>
  );
}
