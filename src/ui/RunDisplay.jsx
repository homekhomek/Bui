import { Fragment } from 'react';
import { ANIM, INVENTORY, RUN_DISPLAY, SPRITE, UI } from '../data.js';
import { runSteps } from '../game/run.js';
import { guiIcon } from './assets.js';
import { bobStyle } from './FloatingItem.jsx';
import { useTooltip } from './tooltip/Tooltip.jsx';

// Sizes are read at render time: they change with the UI scale (window height).
// Every icon and line tile is one node tile (70x70 in the art). Line tiles
// overlap the icons on each side by overlap() px (drawn under them).
const tile = () => INVENTORY.cellPx;
const overlap = () => (RUN_DISPLAY.lineOverlapArt / SPRITE.tileArt) * tile();

// Inner height: fits the current step at its bigger size, so the display
// never changes height.
const innerPx = () => tile() * RUN_DISPLAY.currentScale;

// The display's full height, for keeping the top of the page free under it.
export const runDisplaySpace = () => {
  const { topPx, paddingYPx, belowPx } = RUN_DISPLAY;
  return topPx + innerPx() + 2 * paddingYPx + 2 * UI.strokePx + belowPx;
};

function Tile({ src, style }) {
  return <img src={src} alt="" width={tile()} height={tile()} draggable={false} className="block shrink-0" style={style} />;
}

// A line tile between two steps, tucked under both.
function Line() {
  return <Tile src={guiIcon('line')} style={{ marginInline: -overlap() }} />;
}

// One step: its icon (complete art once in the past, future art otherwise).
// The current step is bigger and bobs.
function Step({ step }) {
  const tooltip = useTooltip('runStep', step);
  const current = step.state === 'current';
  const art = `${step.kind}_${step.state === 'complete' ? 'complete' : 'future'}`;
  return (
    <div {...tooltip} className="relative z-10 shrink-0 cursor-pointer" style={current ? bobStyle(0) : undefined}>
      <div style={current ? { scale: RUN_DISPLAY.currentScale } : undefined}>
        <Tile src={guiIcon(art)} />
      </div>
    </div>
  );
}

// The run at a glance: every battle and encounter in order, with a line tile
// exactly between each two. Pinned to the top of the screen, over the page,
// and always visible during a run. The strip is longer than the screen, so it
// slides to keep the current step (or, with none, the last) in the middle.
export default function RunDisplay({ run }) {
  const { slideMs, paddingXPx, paddingYPx, topPx, sidePx } = RUN_DISPLAY;
  const steps = runSteps(run);
  const found = steps.findIndex((s) => s.state === 'current');
  const focus = found >= 0 ? found : steps.length - 1;
  // Steps and lines alternate: each step plus the line after it takes two
  // tiles, less the line's overlap on both sides.
  const offset = focus * (2 * tile() - 2 * overlap()) + tile() / 2;

  return (
    <div
      className="fixed left-0 right-0 z-40 rounded-panel border-stroke border-dusk bg-blush overflow-hidden"
      style={{ top: topPx, marginInline: sidePx, padding: `${paddingYPx}px ${paddingXPx}px` }}
    >
      <div className="relative" style={{ height: innerPx() }}>
        <div
          className="absolute top-0 bottom-0 flex items-center"
          style={{
            left: '50%',
            transform: `translateX(${-offset}px)`,
            transition: `transform ${slideMs}ms ${ANIM.ease}`,
          }}
        >
          {steps.map((step, i) => (
            <Fragment key={`${step.kind}-${step.stage}-${step.index}`}>
              {i > 0 && <Line />}
              <Step step={step} />
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
