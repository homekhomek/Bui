// Headless battle simulation. Pure JS, no React, runs instantly.
//
// Continuous time, in seconds. Equipment charges touching nodes at a rate
// (charge per second), so every node's charge is a straight line over time:
//   charge(time) = node.charge + node.rate * (time - node.chargeT)
// The simulation jumps straight from one node firing to the next, computing
// the exact moment each one fills. No ticks.
//
// runBattle(teams) returns { initial, events, winner, duration }. Every change
// is an event applied through applyEvent(). The simulation uses the same
// reducer as the visual queue, so playback always matches the result.
//
// Event types (all carry t = time in seconds):
//   charge  { fighter, node, charge, rate }    from t, charge grows at rate
//   trigger { fighter, node }                  node full: charge resets to 0
//   move    { fighter, node, x, spawn? }       node slid left; spawn = used node
//                                              re-entering from the right
//   damage  { source, target, hp, shield }     hp / shield actually lost
//   shield  { target, amount }
//   heal    { target, amount }                 hp actually restored
//   defeat  { fighter }
//   end     { winner }                         'player' | 'enemy' | 'draw'

import { BATTLE, EQUIPMENT, FIGHTERS, NODES } from '../data.js';
import { effectValue } from './effects.js';
import { settle, spawnX, touchingRows, unboundedWidths } from './inventory.js';

const EPSILON = 1e-9; // nodes filling within this many seconds fire together

export function createBattleState(teams) {
  const fighters = [];
  for (const team of ['player', 'enemy']) {
    teams[team].forEach((loadout, i) => {
      const def = FIGHTERS[loadout.fighter];
      const id = `${team}-${i}`;
      fighters.push({
        id,
        def: def.id,
        team,
        hp: def.maxHp,
        maxHp: def.maxHp,
        shield: 0,
        alive: true,
        equipment: loadout.equipment.slice(0, def.maxEquipment),
        nodes: loadout.nodes.map((n, j) => ({
          uid: `${id}-n${j}`,
          def: n.node,
          level: n.level ?? 1,
          x: n.x,
          y: n.y,
          charge: 0,
          rate: 0,
          chargeT: 0,
        })),
      });
    });
  }
  return { time: 0, fighters, winner: null };
}

// A node's charge at any moment (for smooth display and the simulation).
export function chargeAt(node, time) {
  return Math.min(NODES[node.def].maxCharge, node.charge + node.rate * Math.max(0, time - node.chargeT));
}

const fighterById = (state, id) => state.fighters.find((f) => f.id === id);
const nodeByUid = (fighter, uid) => fighter.nodes.find((n) => n.uid === uid);

// Reducer. Mutates state in place (callers clone first if they need to).
export function applyEvent(state, e) {
  state.time = e.t;
  switch (e.type) {
    case 'charge': {
      const n = nodeByUid(fighterById(state, e.fighter), e.node);
      Object.assign(n, { charge: e.charge, rate: e.rate, chargeT: e.t });
      break;
    }
    case 'trigger': {
      const n = nodeByUid(fighterById(state, e.fighter), e.node);
      Object.assign(n, { charge: 0, chargeT: e.t });
      break;
    }
    case 'move': {
      const n = nodeByUid(fighterById(state, e.fighter), e.node);
      n.x = e.x;
      if (e.spawn) {
        n.spawns = (n.spawns ?? 0) + 1; // lets the UI restart the slide-in
        n.spawnX = e.x;
      }
      break;
    }
    case 'damage': {
      const f = fighterById(state, e.target);
      f.shield -= e.shield;
      f.hp -= e.hp;
      break;
    }
    case 'shield':
      fighterById(state, e.target).shield += e.amount;
      break;
    case 'heal':
      fighterById(state, e.target).hp += e.amount;
      break;
    case 'defeat':
      fighterById(state, e.fighter).alive = false;
      break;
    case 'end':
      state.winner = e.winner;
      break;
  }
}

export function runBattle(teams) {
  const initial = createBattleState(teams);
  const state = structuredClone(initial);
  const events = [];
  const emit = (e) => {
    e.t = state.time;
    events.push(e);
    applyEvent(state, e);
  };

  // Charge per second a node gets from the equipment it touches.
  const rateOf = (f, n) => touchingRows(n).reduce((sum, y) => sum + EQUIPMENT[f.equipment[y]].chargeRate, 0);

  // After nodes move, re-check which ones touch equipment and update rates.
  const updateRates = (f) => {
    for (const n of f.nodes) {
      const rate = f.alive ? rateOf(f, n) : 0;
      if (rate !== n.rate) emit({ type: 'charge', fighter: f.id, node: n.uid, charge: chargeAt(n, state.time), rate });
    }
  };

  // Apply left gravity to a fighter's nodes, emitting a move per changed node.
  const settleFighter = (f) => {
    for (const { uid, x } of settle(unboundedWidths(f.equipment), structuredClone(f.nodes))) {
      emit({ type: 'move', fighter: f.id, node: uid, x });
    }
  };

  const checkWinner = () => {
    const playerAlive = state.fighters.some((f) => f.team === 'player' && f.alive);
    const enemyAlive = state.fighters.some((f) => f.team === 'enemy' && f.alive);
    if (!playerAlive || !enemyAlive) {
      emit({ type: 'end', winner: playerAlive ? 'player' : enemyAlive ? 'enemy' : 'draw' });
    }
  };

  // Run one node effect. Keywords: attack, shield, heal.
  const resolveEffect = (f, effect, level) => {
    const value = effectValue(effect, level);
    if (effect.keyword === 'attack') {
      const target = state.fighters.find((o) => o.team !== f.team && o.alive);
      if (!target) return;
      const shield = Math.min(target.shield, value);
      const hp = Math.min(target.hp, value - shield);
      emit({ type: 'damage', source: f.id, target: target.id, hp, shield });
      if (target.hp <= 0) {
        emit({ type: 'defeat', fighter: target.id });
        updateRates(target); // a defeated fighter stops charging
        checkWinner();
      }
    } else if (effect.keyword === 'shield') {
      emit({ type: 'shield', target: f.id, amount: value });
    } else if (effect.keyword === 'heal') {
      const amount = Math.min(value, f.maxHp - f.hp);
      if (amount > 0) emit({ type: 'heal', target: f.id, amount });
    }
  };

  // When a charging node will be full (Infinity if it isn't charging).
  const fullAt = (n) =>
    n.rate > 0 ? n.chargeT + (NODES[n.def].maxCharge - n.charge) / n.rate : Infinity;

  // Starting positions settle under gravity, then charging begins.
  for (const f of state.fighters) {
    settleFighter(f);
    updateRates(f);
  }

  while (!state.winner) {
    // Jump to the next moment any node fills up.
    let next = Infinity;
    for (const f of state.fighters) if (f.alive) for (const n of f.nodes) next = Math.min(next, fullAt(n));
    if (next > BATTLE.maxSeconds) {
      state.time = BATTLE.maxSeconds;
      emit({ type: 'end', winner: 'draw' });
      break;
    }
    state.time = next;

    // Fire every node full at this moment: player side first, top to bottom.
    // Each then re-enters from the right and falls left to the back of the
    // queue (battle rows have no right edge).
    for (const f of state.fighters) {
      const ready = f.nodes
        .filter((n) => fullAt(n) <= next + EPSILON)
        .sort((a, b) => a.y - b.y || a.x - b.x);
      for (const n of ready) {
        if (!f.alive || state.winner) break;
        emit({ type: 'trigger', fighter: f.id, node: n.uid });
        for (const effect of NODES[n.def].effects) {
          if (state.winner) break;
          resolveEffect(f, effect, n.level);
        }
        emit({ type: 'move', fighter: f.id, node: n.uid, x: spawnX(f.equipment, f.nodes, n), spawn: true });
        settleFighter(f);
        updateRates(f);
      }
      if (state.winner) break;
    }
  }

  return { initial, events, winner: state.winner, duration: state.time };
}
