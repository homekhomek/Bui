// A run: one seeded playthrough. Pure functions, no React.
//
// RUN.enemyCount battles; every RUN.bossEvery-th is against a boss. Between two
// battles come RUN.encountersBetween encounters, each a choice between
// RUN.encounterChoices encounters (see encounters.js).
//
// Run: { seed, enemies, stage, loadout, encounter, battle, over }
//   seed       every random thing in the run is derived from it (see random.js)
//   enemies    the ENEMIES ids fought, in order (rolled at the start)
//   stage      index of the next (or current) battle
//   loadout    the player's team (see edit.js)
//   encounter  { index, options, picked, used } while choosing / doing an
//              encounter; null = ready to fight
//   battle     { seed, enemy, team } while fighting, else null
//   over       null, 'won' or 'lost'
//
// Random rolls are derived per purpose (enemies, encounter choices, encounter
// actions, battles), so a seed replays the same run.

import { ENCOUNTERS, ENEMIES, FIGHTER_TEMPLATES, RUN } from '../data.js';
import { clearEncounterItems, clearFloating, createLoadout, returnSlot, slotNode } from './edit.js';
import { canUseEncounter, encounterType, rollEncounterChoice } from './encounters.js';
import { createRng, deriveSeed } from './random.js';

// Fighter template ids -> team format ({ template, equipment, nodes }).
export const templateTeam = (ids) =>
  ids.map((id) => {
    const { equipment, nodes } = structuredClone(FIGHTER_TEMPLATES[id]);
    return { template: id, equipment, nodes };
  });

// Battle i (0-based) is a boss battle every RUN.bossEvery battles.
export const isBossStage = (i) => (i + 1) % RUN.bossEvery === 0;

function rollEnemies(seed) {
  const rng = createRng(deriveSeed(seed, 'enemies'));
  const all = Object.values(ENEMIES);
  return Array.from({ length: RUN.enemyCount }, (_, i) => {
    if (i === 0) return RUN.firstEnemy;
    const fitting = all.filter((e) => Boolean(e.boss) === isBossStage(i));
    return rng.pick(fitting.length ? fitting : all).id;
  });
}

const newEncounter = (run, stage, index) => ({
  index,
  options: rollEncounterChoice(run.seed, stage, index, index === 0 && isBossStage(stage - 1)),
  picked: null,
  used: false,
});

export function createRun(seed) {
  return {
    seed,
    enemies: rollEnemies(seed),
    stage: 0,
    loadout: createLoadout(templateTeam(RUN.startingTeam)),
    encounter: null, // the first battle comes right away
    battle: null,
    over: null,
  };
}

// Fight this stage's enemy. Anything floating is lost.
export function startBattle(run) {
  return {
    ...run,
    loadout: clearFloating(run.loadout),
    battle: {
      seed: deriveSeed(run.seed, 'battle', run.stage),
      enemy: run.enemies[run.stage],
      team: templateTeam(ENEMIES[run.enemies[run.stage]].fighters),
    },
  };
}

// After a battle: lost = the run is over; won the last = the run is won;
// otherwise on to the encounters before the next battle.
export function finishBattle(run, winner) {
  const done = { ...run, battle: null };
  if (winner !== 'player') return { ...done, over: 'lost' };
  if (run.stage + 1 >= run.enemies.length) return { ...done, over: 'won' };
  const stage = run.stage + 1;
  return { ...done, stage, encounter: RUN.encountersBetween > 0 ? newEncounter(run, stage, 0) : null };
}

// Pick one of the offered encounters. Instant ones act right away.
export function pickEncounter(run, id) {
  const picked = { ...run, encounter: { ...run.encounter, picked: id } };
  return encounterType(id).instant ? useEncounter(picked) : picked;
}

// The picked encounter's action (once).
export function useEncounter(run) {
  const { encounter } = run;
  const node = slotNode(run.loadout);
  if (!encounter?.picked || encounter.used || !canUseEncounter(encounter.picked, run.loadout, node)) return run;
  const rng = createRng(deriveSeed(run.seed, 'encounter', run.stage, encounter.index, 'use'));
  const loadout = encounterType(encounter.picked).use(run.loadout, ENCOUNTERS[encounter.picked].params, rng, node);
  return { ...run, loadout, encounter: { ...encounter, used: true } };
}

// Done with this encounter (used or not): the slotted node goes back, untaken
// loot and choices go away, then the next choice, or ready to fight.
export function finishEncounter(run) {
  const loadout = returnSlot(clearEncounterItems(run.loadout));
  const index = run.encounter.index + 1;
  return {
    ...run,
    loadout,
    encounter: index < RUN.encountersBetween ? newEncounter(run, run.stage, index) : null,
  };
}
