import { useMemo } from 'react';
import { PLAYBACK } from '../data.js';
import { t } from '../translate.js';
import { chargeAt, runBattle } from '../game/battle.js';
import { useVisualQueue } from '../game/visualQueue.js';
import FighterCard from './FighterCard.jsx';

const RESULT = { player: 'victory', enemy: 'defeat', draw: 'draw' };

function Button({ active, ...props }) {
  return (
    <button
      className={`px-4 py-1 rounded-lg ${active ? 'bg-mint' : 'bg-haze hover:bg-mist'}`}
      {...props}
    />
  );
}

// Battle phase. The whole battle is simulated instantly up front; the visual
// queue then plays it back at whatever speed the player picks.
// seed: the battle's own seed (derived from the run seed), for random effects.
export default function BattleScreen({ teams, seed, onBack }) {
  const battle = useMemo(() => runBattle(teams, seed), [teams, seed]);
  const vq = useVisualQueue(battle);
  const animMs = PLAYBACK.moveAnimMs / vq.speed;
  // Charge is drawn at the exact playback time, so it fills smoothly.
  const side = (team) =>
    vq.state.fighters
      .filter((f) => f.team === team)
      .map((f) => ({ ...f, nodes: f.nodes.map((n) => ({ ...n, charge: chargeAt(n, vq.time) })) }));

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-wrap items-center justify-center gap-6">
        <div className="flex flex-col gap-4">
          {side('player').map((f) => (
            <FighterCard key={f.id} fighter={f} animMs={animMs} />
          ))}
        </div>
        <span className="font-heading text-2xl">{t('vs')}</span>
        <div className="flex flex-col gap-4">
          {/* Enemies stand on the right, facing left toward the player */}
          {side('enemy').map((f) => (
            <FighterCard key={f.id} fighter={f} animMs={animMs} flip />
          ))}
        </div>
      </div>

      {vq.state.winner && <h2 className="text-4xl">{t(RESULT[vq.state.winner])}</h2>}

      <div className="flex flex-wrap justify-center gap-2">
        {vq.playing ? (
          <Button onClick={vq.pause}>{t('pause')}</Button>
        ) : (
          <Button onClick={vq.play}>{t('play')}</Button>
        )}
        <Button onClick={vq.restart}>{t('restart')}</Button>
        <Button onClick={vq.skip} disabled={vq.done}>
          {t('skip')}
        </Button>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {PLAYBACK.speeds.map((n) => (
          <Button key={n} active={vq.speed === n} onClick={() => vq.setSpeed(n)}>
            {t('speed', { n })}
          </Button>
        ))}
      </div>

      {/* The result is already decided, so the player can move on any time */}
      <button onClick={() => onBack(battle.winner)} className="px-8 py-2 rounded-lg bg-rose hover:bg-dusty">
        {t('continue')}
      </button>
    </div>
  );
}
