import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { t } from './translate.js';
import { ADMIN, LAYOUT } from './data.js';
import { loadoutToTeam } from './game/edit.js';
import { createRun, finishBattle, finishEncounter, pickEncounter, startBattle, useEncounter } from './game/run.js';
import { randomSeed } from './game/random.js';
import ExploreScreen from './ui/ExploreScreen.jsx';
import BattleScreen from './ui/BattleScreen.jsx';
import { TooltipProvider } from './ui/tooltip/Tooltip.jsx';

// Admin dashboard: dev server only, at #admin. In player builds DEV is false,
// so this (and all of src/admin) is dropped from the bundle.
const AdminScreen = import.meta.env.DEV ? lazy(() => import('./admin/AdminScreen.jsx')) : null;
const isAdminHash = () => window.location.hash === '#admin';

function useAdminRoute() {
  const [admin, setAdmin] = useState(isAdminHash);
  useEffect(() => {
    if (!AdminScreen) return;
    const onHash = () => setAdmin(isAdminHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return Boolean(AdminScreen) && admin;
}

// A run's seed: ?seed=... in the URL replays that run, otherwise a fresh one.
const startSeed = () => new URLSearchParams(window.location.search).get('seed') || randomSeed();

// Phases: title -> explore (encounters, editing) <-> battle -> over (won or
// lost) -> title. No run = title; a finished run = over; a run with a battle =
// battle; otherwise explore.
export default function App() {
  const admin = useAdminRoute();
  const [run, setRun] = useState(null);
  const phase = !run ? 'title' : run.over ? 'over' : run.battle ? 'battle' : 'explore';
  const teams = useMemo(
    () => run?.battle && { player: loadoutToTeam(run.loadout), enemy: run.battle.team },
    [run?.battle] // eslint-disable-line react-hooks/exhaustive-deps -- the team is fixed once a battle starts
  );

  // The explore screen edits the run's loadout (value or updater).
  const setLoadout = (next) =>
    setRun((r) => ({ ...r, loadout: typeof next === 'function' ? next(r.loadout) : next }));

  const start = () => setRun(createRun(startSeed()));
  const fight = () => setRun((r) => startBattle(r));
  const afterBattle = (winner) => setRun((r) => finishBattle(r, winner));
  const pick = (id) => setRun((r) => pickEncounter(r, id));
  const use = () => setRun((r) => useEncounter(r));
  const finish = () => setRun((r) => finishEncounter(r));

  return (
    <TooltipProvider>
      <div className="min-h-full flex items-center justify-center bg-white text-dusk">
      <main
        className="w-full flex flex-col items-center justify-center gap-4 p-4 text-center"
        style={{ maxWidth: admin ? ADMIN.maxWidthPx : LAYOUT.maxWidth }}
      >
        {admin && (
          <Suspense fallback={null}>
            <AdminScreen />
          </Suspense>
        )}
        {!admin && phase === 'title' && (
          <>
            <h1 className="text-5xl">{t('title')}</h1>
            <p className="text-lg text-slate">{t('subtitle')}</p>
            <button onClick={start} className="px-6 py-2 rounded bg-rose hover:bg-dusty">
              {t('start')}
            </button>
          </>
        )}
        {!admin && phase === 'explore' && (
          <ExploreScreen run={run} setLoadout={setLoadout} onPick={pick} onUse={use} onFinish={finish} onFight={fight} />
        )}
        {!admin && phase === 'battle' && <BattleScreen teams={teams} seed={run.battle.seed} onBack={afterBattle} />}
        {!admin && phase === 'over' && (
          <>
            <h1 className="text-5xl">{t(run.over === 'won' ? 'runWon' : 'runLost')}</h1>
            <button onClick={() => setRun(null)} className="px-6 py-2 rounded bg-rose hover:bg-dusty">
              {t('toTitle')}
            </button>
          </>
        )}
        {!admin && run && <span className="text-slate select-text">{t('seed', { seed: run.seed })}</span>}
      </main>
    </div>
    </TooltipProvider>
  );
}
