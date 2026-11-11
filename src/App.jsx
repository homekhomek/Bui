import { useMemo, useState } from 'react';
import { t } from './translate.js';
import { DEMO_TEAMS, LAYOUT } from './data.js';
import { clearFloating, createLoadout, loadoutToTeam, rollOffer } from './game/edit.js';
import ExploreScreen from './ui/ExploreScreen.jsx';
import BattleScreen from './ui/BattleScreen.jsx';
import { TooltipProvider } from './ui/tooltip/Tooltip.jsx';

// Phases: title -> explore (edit) <-> battle
export default function App() {
  const [phase, setPhase] = useState('title');
  const [loadout, setLoadout] = useState(() => createLoadout(DEMO_TEAMS.player));
  const teams = useMemo(() => ({ player: loadoutToTeam(loadout), enemy: DEMO_TEAMS.enemy }), [loadout]);

  // Each explore visit offers fresh random nodes.
  const explore = () => {
    setLoadout((l) => rollOffer(l));
    setPhase('explore');
  };

  // Starting a battle destroys anything still floating.
  const fight = () => {
    setLoadout((l) => clearFloating(l));
    setPhase('battle');
  };

  return (
    <TooltipProvider>
      <div className="min-h-full flex items-center justify-center bg-white text-dusk">
      <main
        className="w-full flex flex-col items-center justify-center gap-4 p-4 text-center"
        style={{ maxWidth: LAYOUT.maxWidth }}
      >
        {phase === 'title' && (
          <>
            <h1 className="text-5xl">{t('title')}</h1>
            <p className="text-lg text-slate">{t('subtitle')}</p>
            <button onClick={explore} className="px-6 py-2 rounded bg-rose hover:bg-dusty">
              {t('start')}
            </button>
          </>
        )}
        {phase === 'explore' && <ExploreScreen loadout={loadout} setLoadout={setLoadout} onFight={fight} />}
        {phase === 'battle' && <BattleScreen teams={teams} onBack={explore} />}
      </main>
    </div>
    </TooltipProvider>
  );
}
