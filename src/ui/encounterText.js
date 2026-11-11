// Encounter text: name, description (with its params filled in) and action.
// Text lives in translate.js as 'encounter.<id>', 'encounterTip.<id>' and
// 'encounterAction.<id>'; a description shows a param as {param}.

import { ENCOUNTERS } from '../data.js';
import { t } from '../translate.js';
import { ENCOUNTER_TYPES } from '../game/encounters.js';

// One param as words: numbers as they are, rarities by name, effects as
// e.g. "Attack 3 (+2 per level)".
function paramText(kind, value) {
  if (kind === 'rarity') return t(`rarity.${value}`);
  if (kind === 'effect') {
    const name = t(`effect.${value.keyword}`);
    return value.upgradeDelta
      ? t('paramEffectDelta', { name, value: value.value, delta: value.upgradeDelta })
      : t('paramEffect', { name, value: value.value });
  }
  return String(value);
}

// The description with params filled in. Symbols ({charge}, {hp}) are left
// for SymbolText. entry / template override data.js and translate.js (admin).
export function encounterDescription(id, entry = ENCOUNTERS[id], template = t(`encounterTip.${id}`)) {
  const specs = ENCOUNTER_TYPES[entry.type]?.params ?? {};
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in (entry.params ?? {}) ? paramText(specs[k]?.kind, entry.params[k]) : m));
}

export const encounterName = (id) => t(`encounter.${id}`);
export const encounterAction = (id) => t(`encounterAction.${id}`);
