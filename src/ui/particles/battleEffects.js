// What battle events look like, beyond the state they change: particles,
// hit-shake and hit-flash. BattleScreen calls playBattleEvent for each event
// as playback reaches it (not for events skipped past).
//
// Elements are found by data attributes: data-uid on a node, data-fighter on a
// fighter, and in its sprite data-fighter-body (the body square),
// data-fighter-art (the art, shaken) and data-fighter-flash (the flash).

import { HIT, KEYWORDS, NODES, UI } from '../../data.js';
import { effectIcon, nodeIcon } from '../assets.js';
import { nodeEffects } from '../../game/effects.js';
import { centerOf, emitParticles } from './particles.js';

const fighterPart = (id, part) => document.querySelector(`[data-fighter="${id}"] [data-fighter-${part}]`);

// Fighter `id` is hit: its sprite shakes sideways (settling down) and a
// sprite-shaped flash appears and quickly fades (the Web Animations API, so
// React state is untouched). timeScale speeds both up with playback.
export function hitFighter(id, timeScale = 1) {
  const art = fighterPart(id, 'art');
  if (art) {
    const { shakePx, shakeMs, shakes } = HIT;
    const frames = [{ transform: 'translateX(0)' }];
    for (let i = 0; i < shakes; i++) {
      frames.push({ transform: `translateX(${shakePx * (1 - i / shakes) * (i % 2 ? -1 : 1)}px)` });
    }
    frames.push({ transform: 'translateX(0)' });
    art.animate(frames, { duration: shakeMs / timeScale, easing: 'ease-out' });
  }
  fighterPart(id, 'flash')?.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration: HIT.flashMs / timeScale,
    easing: 'ease-out',
  });
}

// Image-flash effect `effect` of node `uid`'s art (at the node's size on
// screen) on fighter `fighterId`'s body. Nodes without art show nothing.
function nodeImage(effect, uid, fighterId, state, timeScale) {
  const at = centerOf(fighterPart(fighterId, 'body'));
  const node = state.fighters.flatMap((f) => f.nodes).find((n) => n.uid === uid);
  const def = NODES[node?.def];
  const rect = document.querySelector(`[data-uid="${uid}"]`)?.getBoundingClientRect();
  if (!at || !def?.icon || !rect) return;
  emitParticles(effect, { at, image: { src: nodeIcon(def.icon), width: rect.width, height: rect.height }, timeScale });
}

// event: a battle event (see game/battle.js). state: the battle state it was
// applied to (to look up the node that caused it).
export function playBattleEvent(event, state, timeScale) {
  switch (event.type) {
    // A node's attack hit an opponent: the node's art flashes on it (random
    // rotation, quickly growing and fading), bits fly off it, and it shakes
    // and flashes.
    case 'damage': {
      if (!event.node) return;
      nodeImage('attackFlash', event.node, event.target, state, timeScale);
      const at = centerOf(fighterPart(event.target, 'body'));
      // Away from the attacker: player fighters stand left, enemies right.
      const away = event.target.startsWith('enemy') ? 0 : Math.PI;
      if (at) emitParticles('attackHit', { at, direction: away, timeScale });
      hitFighter(event.target, timeScale);
      return;
    }
    // A node's effect on its own fighter (shield, heal, strengthen, ...): the
    // node's art rises off that fighter. A boost to every node (strengthen
    // all) shows once, for the node that caused it.
    case 'status':
    case 'heal':
      if (event.node && event.amount > 0) nodeImage('selfRise', event.node, event.target, state, timeScale);
      return;
    // Strengthen / strengthen all: the effect's icon flashes on every node it
    // strengthens that has an effect of the boosted keyword (attack); for the
    // rest the boost changes nothing yet, so nothing shows.
    case 'boost': {
      if (event.node === event.by) nodeImage('selfRise', event.by, event.fighter, state, timeScale);
      const node = state.fighters.flatMap((f) => f.nodes).find((n) => n.uid === event.node);
      if (!node || !nodeEffects(node).some((e) => e.keyword === event.keyword)) return;
      const at = centerOf(document.querySelector(`[data-uid="${event.node}"]`));
      const icon = KEYWORDS[event.effect]?.icon;
      if (at && icon) {
        emitParticles('boostFlash', { at, image: { src: effectIcon(icon), width: UI.iconPx, height: UI.iconPx }, timeScale });
      }
      return;
    }
  }
}
