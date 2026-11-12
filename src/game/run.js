// A run: one seeded playthrough. Pure functions, no React.
//
// RUN.enemyCount battles; every RUN.bossEvery-th is against a boss. Before the
// first battle come RUN.encountersBefore encounters, and between two battles
// RUN.encountersBetween, each a choice between RUN.encounterChoices encounters
// (see encounters.js).
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

import { ENCOUNTERS, ENEMIES, RUN } from '../data.js';
import { clearEncounterItems, clearFloating, createLoadout, returnSlot, slotNode } from './edit.js';
import { canUseEncounter, encounterType, rollEncounterChoice } from './encounters.js';
import { createFighter } from './fighter.js';
import { createRng, deriveSeed } from './random.js';

// Fighter template ids -> a team: a fresh copy of each (see createFighter).
export const templateTeam = (ids) => ids.map(createFighter);

// Battle i (0-based) is a boss battle every RUN.bossEvery battles.
export const isBossStage = (i) => (i + 1) % RUN.bossEvery === 0;

// How many encounters come before battle `stage`.
export const encountersBefore = (stage) => (stage === 0 ? RUN.encountersBefore : RUN.encountersBetween);

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
  options: rollEncounterChoice(run.seed, stage, index, index === 0 && stage > 0 && isBossStage(stage - 1)),
  picked: null,
  used: false,
});

export function createRun(seed) {
  const run = {
    seed,
    enemies: rollEnemies(seed),
    stage: 0,
    loadout: createLoadout(templateTeam(RUN.startingTeam)),
    encounter: null,
    battle: null,
    over: null,
  };
  return { ...run, encounter: encountersBefore(0) > 0 ? newEncounter(run, 0, 0) : null };
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
  return { ...done, stage, encounter: encountersBefore(stage) > 0 ? newEncounter(run, stage, 0) : null };
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
    encounter: index < encountersBefore(run.stage) ? newEncounter(run, run.stage, index) : null,
  };
}

// Encounters move on by themselves once their action is done: right after
// it, or for an instant encounter (one that hands out things to take) once
// everything it offered has been taken. Continue is only needed to move on
// without taking everything.
export function settleEncounter(run) {
  const enc = run.encounter;
  if (!enc?.picked || !enc.used) return run;
  if ((encounterType(enc.picked).toTake?.(run.loadout) ?? 0) > 0) return run;
  return finishEncounter(run);
}

// The run as a line of steps, in order: the encounters before a battle, then
// the battle, and so on. Each step: { kind: 'battle' | 'encounter', stage, index,
// boss, enemy (battles: its ENEMIES id), state }. stage = the battle's index, or for an encounter the battle it
// comes before; index = the encounter's index among those. state: 'complete'
// (in the past), 'current' (happening now, or up next) or 'future'.
export function runSteps(run) {
  const steps = [];
  const enc = run.encounter;
  const stateOf = (order) => (order < 0 ? 'complete' : order === 0 ? 'current' : 'future');
  run.enemies.forEach((_, stage) => {
    for (let index = 0; index < encountersBefore(stage); index++) {
      // Encounters of the current stage: done once there is no encounter left.
      const order = stage !== run.stage ? stage - run.stage : enc ? index - enc.index : -1;
      steps.push({ kind: 'encounter', stage, index, boss: false, state: run.over === 'won' ? 'complete' : stateOf(order) });
    }
    // This stage's battle is current once its encounters are done.
    const order = stage !== run.stage ? stage - run.stage : enc ? 1 : 0;
    steps.push({ kind: 'battle', stage, index: 0, boss: isBossStage(stage), enemy: run.enemies[stage], state: run.over === 'won' ? 'complete' : stateOf(order) });
  });
  return steps;
}
