// Visual queue: plays a finished battle's events back over time.
// The battle is already decided; this only controls how it is shown.
// Supports play/pause, speed changes, restart and skip to end.
// onEvent(event, state) is called for each event as playback reaches it (for
// effects like particles), but not for events skipped past.

import { useCallback, useEffect, useRef, useState } from 'react';
import { PLAYBACK } from '../data.js';
import { applyEvent } from './battle.js';

const fresh = (battle) => ({ battle, state: structuredClone(battle.initial), index: 0, clock: 0 });

export function useVisualQueue(battle, { onEvent } = {}) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const [speed, setSpeed] = useState(PLAYBACK.defaultSpeed);
  const [playing, setPlaying] = useState(true);
  const [, setFrame] = useState(0);
  const q = useRef(null);
  if (!q.current || q.current.battle !== battle) q.current = fresh(battle);

  // Apply every event up to `clock` (battle seconds). Returns true when finished.
  // live: playing normally (not skipping), so events get their effects.
  const advanceTo = useCallback((clock, live = false) => {
    const cur = q.current;
    const { events } = cur.battle;
    cur.clock = clock;
    while (cur.index < events.length && events[cur.index].t <= clock) {
      applyEvent(cur.state, events[cur.index]);
      if (live) onEventRef.current?.(events[cur.index], cur.state);
      cur.index += 1;
    }
    setFrame((f) => f + 1);
    return cur.index >= events.length;
  }, []);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    let raf;
    const step = (now) => {
      const seconds = ((now - last) / 1000) * speed;
      last = now;
      if (advanceTo(q.current.clock + seconds, true)) setPlaying(false);
      else raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, advanceTo]);

  const restart = () => {
    q.current = fresh(battle);
    setFrame((f) => f + 1);
    setPlaying(true);
  };
  const done = q.current.index >= battle.events.length;

  return {
    state: q.current.state,
    time: Math.min(q.current.clock, battle.duration), // for smooth in-between values
    speed,
    setSpeed,
    playing,
    done,
    play: () => (done ? restart() : setPlaying(true)),
    pause: () => setPlaying(false),
    restart,
    skip: () => {
      setPlaying(false);
      advanceTo(Infinity);
    },
  };
}
