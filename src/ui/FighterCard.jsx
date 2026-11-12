import { HEALTH_BAR, SPRITE, STATUSES } from '../data.js';
import { effectRowHeight } from './EffectRow.jsx';
import { t } from '../translate.js';
import { maxHp } from '../game/fighter.js';
import FighterSprite from './FighterSprite.jsx';
import Inventory from './Inventory.jsx';
import MetricDisplay from './MetricDisplay.jsx';
import StatusCounter from './StatusCounter.jsx';

// A fighter's card (name, health, inventory) with its sprite standing on top:
// the sprite's body is bottom-anchored to the card's top edge and drawn behind
// the card, which overlaps it by SPRITE.cardOverlapPx. Works for battle state fighters and
// for the run's fighters in the edit phase (they have no hp: the bars are hidden
// and the fighter's max HP, which changes with its equipment, shows instead).
// flip: mirror the sprite to face left (fighters on the right in battle).
export default function FighterCard({ fighter, area, animMs, flip = false }) {
  const showHealth = fighter.hp !== undefined;

  return (
    <div data-fighter={fighter.id} className={`flex flex-col items-center ${fighter.alive === false ? 'opacity-40' : ''}`}>
      <div className="relative z-0">
        <FighterSprite fighter={fighter} flip={flip} />
      </div>

      <div
        className="relative z-10 flex flex-col items-center gap-2 p-4 rounded-panel border-stroke border-dusk bg-blush"
        style={{ marginTop: -SPRITE.cardOverlapPx }}
      >
        <div className="flex items-center gap-3">
          <h2 className="text-xl">{t(`fighter.${fighter.template}`)}</h2>
          {!showHealth && <MetricDisplay k="metricHp" tip="metricTip.fighterHp" vars={{ n: maxHp(fighter) }} />}
        </div>

        {showHealth && (
          <div className="w-full flex flex-col items-center gap-2">
            {/* The health bar (mint), vertically centered behind the health
                metric, which sits in the middle of it */}
            <div className="relative w-full flex items-center justify-center" style={{ height: effectRowHeight() }}>
              <div
                className="absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-full bg-haze overflow-hidden"
                style={{ height: effectRowHeight() * HEALTH_BAR.heightRatio }}
              >
                <div className="h-full bg-mint" style={{ width: `${(fighter.hp / fighter.maxHp) * 100}%` }} />
              </div>
              <span className="relative">
                <MetricDisplay k="metricHealth" vars={{ current: fighter.hp, max: fighter.maxHp }} />
              </span>
            </div>
            {/* Status counters below, in a row that is always one counter tall,
                so one appearing never moves anything vertically. */}
            <div className="flex flex-nowrap items-center justify-center gap-2" style={{ minHeight: effectRowHeight() }}>
              {/* In STATUSES order */}
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
          maxEquipment={fighter.maxEquipment}
          nodes={fighter.nodes}
          animMs={animMs}
        />
      </div>
    </div>
  );
}
