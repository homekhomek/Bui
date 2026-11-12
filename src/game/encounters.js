// Encounter types: the code behind ENCOUNTERS in data.js. Pure, no React.
//
// An encounter (data.js) = { id, type, rarity, params }. Its type (here) says:
//   params     what each param is, for the admin editor and defaults:
//              { kind: 'number', min, default } | { kind: 'rarity', default }
//              | { kind: 'effect', default }
//   instant    the action happens as soon as the encounter is picked (no
//              button): it puts things in the encounter for the player to take
//   toTake(loadout)  for instant types: how many things are left to take;
//              once none are left, the encounter ends by itself
//   hint       for instant types: a translate key shown instead of "Take N Things"
//   needsNode  the player drags a node into the encounter's slot first
//   canUse(loadout, params, node)        can the action be taken now?
//   use(loadout, params, rng, node)      the action: returns the new loadout
// node = the slotted node, if the type needs one. rng = seeded (see run.js).
//
// To add an encounter that works like an existing one, add data (and text);
// to add a new kind of encounter, add a type here.

import { ENCOUNTERS, EQUIPMENT, LIMITS, NODES, RUN } from '../data.js';
import { isUpgradable } from './effects.js';
import { addFloating, floatingEffect, floatingEquipment, floatingNode, pickByRarity, updateNode } from './edit.js';
import { createRng, deriveSeed } from './random.js';

const times = (n, fn) => Array.from({ length: n }, (_, i) => fn(i));
const inZone = (loadout, zone) => loadout.floating.filter((n) => n.zone === zone).length;

export const ENCOUNTER_TYPES = {
  // Gain `count` random nodes (rolled by rarity).
  lootNodes: {
    params: { count: { kind: 'number', min: 1, default: 3 } },
    instant: true,
    toTake: (loadout) => inZone(loadout, 'loot'),
    use: (loadout, p, rng) => addFloating(loadout, times(p.count, () => floatingNode(pickByRarity(rng, NODES), 'loot'))),
  },

  // Gain `count` random pieces of equipment (rolled by rarity).
  lootEquipment: {
    params: { count: { kind: 'number', min: 1, default: 1 } },
    instant: true,
    toTake: (loadout) => inZone(loadout, 'loot'),
    use: (loadout, p, rng) =>
      addFloating(loadout, times(p.count, () => floatingEquipment(pickByRarity(rng, EQUIPMENT), 'loot'))),
  },

  // Take one of `options` pieces of equipment (each rolled by rarity; all
  // different when there are enough).
  pickEquipment: {
    params: { options: { kind: 'number', min: 2, default: 2 } },
    instant: true,
    toTake: (loadout) => (inZone(loadout, 'choice') ? 1 : 0),
    use: (loadout, p, rng) => {
      const picks = [];
      for (let i = 0; i < p.options; i++) {
        const left = Object.values(EQUIPMENT).filter((e) => !picks.includes(e.id));
        picks.push(pickByRarity(rng, left.length ? left : EQUIPMENT));
      }
      return addFloating(loadout, picks.map((def) => floatingEquipment(def, 'choice')));
    },
  },

  // Take one of `options` nodes of rarity `nodeRarity` (all different when
  // there are enough of that rarity).
  pickNode: {
    params: {
      options: { kind: 'number', min: 2, default: 2 },
      nodeRarity: { kind: 'rarity', default: 'uncommon' },
    },
    instant: true,
    toTake: (loadout) => (inZone(loadout, 'choice') ? 1 : 0),
    use: (loadout, p, rng) => {
      const ofRarity = Object.values(NODES).filter((n) => n.rarity === p.nodeRarity);
      const pool = rng.shuffle(ofRarity.length ? ofRarity : Object.values(NODES));
      return addFloating(loadout, times(p.options, (i) => floatingNode(pool[i % pool.length].id, 'choice')));
    },
  },

  // The slotted node goes up `levels` levels.
  upgradeNode: {
    params: { levels: { kind: 'number', min: 1, default: 1 } },
    needsNode: true,
    canUse: (loadout, p, node) => Boolean(node) && isUpgradable(node),
    use: (loadout, p, rng, node) => updateNode(loadout, node.uid, (n) => ({ level: (n.level ?? 1) + p.levels })),
  },

  // `effect` floats in the encounter; dragging it onto a node gives the node
  // that effect (it scales with the node's level like the node's own).
  addEffect: {
    params: { effect: { kind: 'effect', default: { keyword: 'attack', value: 3, upgradeDelta: 2 } } },
    instant: true,
    hint: 'dragEffectHint',
    toTake: (loadout) => inZone(loadout, 'loot'),
    use: (loadout, p) => addFloating(loadout, [floatingEffect({ ...p.effect }, 'loot')]),
  },

  // The first fighter (that has room to grow) can hold `amount` more equipment.
  maxEquipment: {
    params: { amount: { kind: 'number', min: 1, default: 1 } },
    canUse: (loadout) => loadout.fighters.some((f) => f.maxEquipment < LIMITS.maxEquipment),
    use: (loadout, p) => {
      const i = loadout.fighters.findIndex((f) => f.maxEquipment < LIMITS.maxEquipment);
      return {
        ...loadout,
        fighters: loadout.fighters.map((f, j) =>
          j === i ? { ...f, maxEquipment: Math.min(LIMITS.maxEquipment, f.maxEquipment + p.amount) } : f
        ),
      };
    },
  },
};

export const encounterType = (id) => ENCOUNTER_TYPES[ENCOUNTERS[id].type];

export const canUseEncounter = (id, loadout, node) =>
  encounterType(id).canUse?.(loadout, ENCOUNTERS[id].params, node) ?? true;

// The encounters offered as one choice. afterBoss: one of them is guaranteed
// to be of RUN.afterBossRarity. Options are all different when possible.
export function rollEncounterChoice(seed, stage, index, afterBoss) {
  const rng = createRng(deriveSeed(seed, 'encounter', stage, index));
  const all = Object.values(ENCOUNTERS);
  const picks = [];
  for (let i = 0; i < RUN.encounterChoices; i++) {
    const left = all.filter((e) => !picks.includes(e.id));
    const pool = left.length ? left : all;
    const guaranteed = pool.filter((e) => e.rarity === RUN.afterBossRarity);
    picks.push(afterBoss && i === 0 && guaranteed.length ? rng.pick(guaranteed).id : pickByRarity(rng, pool));
  }
  return rng.shuffle(picks);
}
