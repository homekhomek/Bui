// Node effects and levels. Pure functions, no React.
//
// Effect: { keyword, value, upgradeDelta? } (see NODES in data.js).

import { NODES } from '../data.js';

// An effect's number at a node level (levels start at 1).
export function effectValue(effect, level = 1) {
  return effect.value + (effect.upgradeDelta ?? 0) * (level - 1);
}

// A node type can be upgraded if any of its effects has an upgradeDelta.
export function isUpgradable(def) {
  return NODES[def].effects.some((e) => e.upgradeDelta);
}

// Can node `a` be dropped onto node `b` to upgrade it?
export function canUpgrade(a, b) {
  return a.uid !== b.uid && a.def === b.def && (a.level ?? 1) === (b.level ?? 1) && isUpgradable(a.def);
}
