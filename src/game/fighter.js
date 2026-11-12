// Fighters. Pure functions, no React.

import { EQUIPMENT, FIGHTER_TEMPLATES } from '../data.js';

// A fighter of its own: a deep copy of a FIGHTER_TEMPLATES entry, so a run can
// change anything about it (equipment slots, base HP, sprite, ...) without
// touching data.js or other fighters made from the same template.
// { template, sprite, baseHp, maxEquipment, equipment: [ids], nodes: [entries] }
// template = the template's id (names it, via t(`fighter.<template>`)).
export function createFighter(templateId) {
  const { id, ...fighter } = structuredClone(FIGHTER_TEMPLATES[templateId]);
  return { template: id, ...fighter };
}

// An equipment entry's EQUIPMENT id: entries are plain ids (teams, battle) or
// { uid, def } items (the edit phase).
export const equipmentId = (e) => (typeof e === 'string' ? e : e.def);

// Max HP = the fighter's base HP + the hp of each equipped piece.
export function maxHp(fighter, equipment = fighter.equipment) {
  return equipment.reduce((sum, e) => sum + EQUIPMENT[equipmentId(e)].hp, fighter.baseHp);
}
