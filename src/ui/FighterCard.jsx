import { FIGHTERS } from '../data.js';
import { t } from '../translate.js';
import Inventory from './Inventory.jsx';

// A fighter's name, health and inventory. Works for battle state fighters and
// for edit-phase loadouts (pass hp/shield as undefined to hide the bars).
export default function FighterCard({ fighter, area, animMs }) {
  const def = FIGHTERS[fighter.def];
  const showHealth = fighter.hp !== undefined;

  return (
    <div
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-stroke bg-blush ${
        fighter.alive === false ? 'opacity-40' : ''
      }`}
      style={{ borderColor: `var(--color-${def.color})` }}
    >
      <h2 className="text-xl">{t(`fighter.${def.id}`)}</h2>

      {showHealth && (
        <div className="w-full flex flex-col items-center gap-1">
          <div className="w-full h-4 rounded-full bg-haze overflow-hidden">
            <div className="h-full bg-mint" style={{ width: `${(fighter.hp / fighter.maxHp) * 100}%` }} />
          </div>
          <div className="flex gap-4">
            <span>{t('hp', { hp: fighter.hp, max: fighter.maxHp })}</span>
            {fighter.shield > 0 && <span className="text-blue">{t('shield', { amount: fighter.shield })}</span>}
          </div>
        </div>
      )}

      <Inventory
        area={area}
        equipment={fighter.equipment}
        maxEquipment={def.maxEquipment}
        nodes={fighter.nodes}
        animMs={animMs}
      />
    </div>
  );
}
