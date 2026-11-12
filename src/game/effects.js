// Node effects and levels. Pure functions, no React.
//
// Effect: { keyword, value, upgradeDelta? } (see NODES in data.js).

import { NODES } from '../data.js';

// An effect's number at a node level (levels start at 1), plus any boost the
// node has built up for its keyword this battle (boosts: keyword -> amount,
// see KEYWORDS.boosts).
export function effectValue(effect, level = 1, boosts) {
  return effect.value + (effect.upgradeDelta ?? 0) * (level - 1) + (boosts?.[effect.keyword] ?? 0);
}

// A node's effects: its type's (NODES), then any extra effects this one node
// has gained (node.extra, e.g. from an encounter).
export function nodeEffects(node) {
  return [...NODES[node.def].effects, ...(node.extra ?? [])];
}

// A node can be upgraded if any of its effects has an upgradeDelta.
export function isUpgradable(node) {
  return nodeEffects(node).some((e) => e.upgradeDelta);
}

const sameExtra = (a, b) => JSON.stringify(a.extra ?? []) === JSON.stringify(b.extra ?? []);

// Can node `a` be dropped onto node `b` to upgrade it? Same type, level and
// extra effects (so nothing gained on either is lost).
export function canUpgrade(a, b) {
  return a.uid !== b.uid && a.def === b.def && (a.level ?? 1) === (b.level ?? 1) && sameExtra(a, b) && isUpgradable(a);
}
