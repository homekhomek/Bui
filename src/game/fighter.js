// Fighter stats. Pure functions, no React.

import { EQUIPMENT, FIGHTER_TEMPLATES } from '../data.js';

// Max HP = the fighter's base HP + the hp of each equipped piece.
// template: a FIGHTER_TEMPLATES id. equipment: equipment ids, or { def } items
// as in the edit phase.
export function maxHp(template, equipment) {
  const def = FIGHTER_TEMPLATES[template];
  return equipment.reduce((sum, e) => sum + EQUIPMENT[typeof e === 'string' ? e : e.def].hp, def.baseHp);
}
