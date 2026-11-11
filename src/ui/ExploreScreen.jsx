import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { EDIT, EXPLORE, NODES } from '../data.js';
import { t } from '../translate.js';
import {
  areaWidths,
  dropEquipmentToFloat,
  dropToFloat,
  equipmentDrop,
  findNode,
  inBounds,
  maxEquipment,
  moveEquipment,
  moveNode,
  overlapping,
  upgradeNode,
} from '../game/edit.js';
import { canUpgrade } from '../game/effects.js';
import { cellsAt } from '../game/inventory.js';
import { EditContext, useEdit, useSlide } from './editContext.js';
import { useTooltipControls } from './tooltip/Tooltip.jsx';
import { EquipmentPiece, NodeShape, STEP } from './Inventory.jsx';
import FighterCard from './FighterCard.jsx';

// A node or piece of equipment floating in the ether: not in any grid,
// gently bobbing, draggable.
function FloatingItem({ node, index }) {
  const edit = useEdit();
  const slideRef = useSlide(node.uid);
  const dragging = edit.dragUid === node.uid;
  const isEquipment = node.kind === 'equipment';

  return (
    <div ref={slideRef} style={{ opacity: dragging ? EDIT.ghostOpacity : 1 }}>
      <div
        style={{
          '--bob': `${EXPLORE.bobPx}px`,
          // Offset each node's cycle so they don't bob in sync.
          animation: `bob ${EXPLORE.bobMs}ms ease-in-out ${(-index * EXPLORE.bobMs) / 3}ms infinite`,
        }}
      >
        {isEquipment ? (
          <EquipmentPiece
            def={node.def}
            onPointerDown={(e) => edit.startDrag(e, node, 'float', slideRef.current, 'equipment')}
          />
        ) : (
          <NodeShape
            def={NODES[node.def]}
            level={node.level}
            uid={node.uid}
            highlight={edit.hover?.upgrade === node.uid}
            onPointerDown={(e) => edit.startDrag(e, node, 'float', slideRef.current)}
          />
        )}
      </div>
    </div>
  );
}

// Explore / edit phase. Random nodes float above the fighter; drag them into
// the fighter's inventory. Bumped or removed nodes float to the fighter's right.
// Choices (equipment, banners, ...) will also live here.
export default function ExploreScreen({ loadout, setLoadout, onFight }) {
  const rootRef = useRef(null);
  const floatRef = useRef(null);
  const areas = useRef(new Map()); // area -> { el, colOffset }
  const positions = useRef(new Map());
  const dropFrom = useRef(new Map());
  const dragInfo = useRef(null); // { uid, def, kind, grabX, grabY, x, y }
  const loadoutRef = useRef(loadout);
  loadoutRef.current = loadout;
  const tooltips = useTooltipControls();

  const [drag, setDrag] = useState(null); // { uid, def, kind }
  // Node drags:      { upgrade } or { area, x, y, cells, bumping }
  // Equipment drags: { equipArea, slot, index, replacing }
  const [hover, setHover] = useState(null);

  // Equipment: the equipment-column slot the dragged piece would snap to.
  const findEquipmentTarget = () => {
    const d = dragInfo.current;
    const l = loadoutRef.current;
    for (const [area, { el }] of areas.current) {
      if (!el.isConnected) continue;
      const r = el.getBoundingClientRect();
      const col = Math.round((d.x - d.grabX - r.left) / STEP);
      const slot = Math.round((d.y - d.grabY - r.top) / STEP);
      if (col !== 0 || slot < 0 || slot >= maxEquipment(l, area)) continue;
      const drop = equipmentDrop(l, d.uid, area, slot);
      // Hovering its own slot: a valid spot that changes nothing.
      return drop ? { equipArea: area, slot: drop.index, ...drop } : { equipArea: area, slot, none: true };
    }
    return null;
  };

  // What a drop here would do. Pointer over a matching node = upgrade it.
  // Otherwise, the grid cell the dragged piece's top-left would snap to.
  const findTarget = () => {
    const d = dragInfo.current;
    if (d.kind === 'equipment') return findEquipmentTarget();
    const under = document.elementFromPoint(d.x, d.y)?.closest('[data-uid]')?.dataset.uid;
    if (under && under !== d.uid) {
      const a = findNode(loadoutRef.current, d.uid);
      const b = findNode(loadoutRef.current, under);
      if (a && b && canUpgrade(a, b)) return { upgrade: under };
    }
    const left = d.x - d.grabX;
    const top = d.y - d.grabY;
    for (const [area, { el, colOffset }] of areas.current) {
      if (!el.isConnected) continue;
      const r = el.getBoundingClientRect();
      const x = Math.round((left - r.left) / STEP) - colOffset;
      const y = Math.round((top - r.top) / STEP);
      if (!inBounds(areaWidths(loadoutRef.current, area), d.def, x, y)) continue;
      return {
        area,
        x,
        y,
        cells: cellsAt(d.def, x, y),
        bumping: overlapping(loadoutRef.current, area, d.uid, d.def, x, y).length > 0,
      };
    }
    return null;
  };

  const placeFloat = () => {
    const d = dragInfo.current;
    if (floatRef.current) floatRef.current.style.transform = `translate(${d.x - d.grabX}px, ${d.y - d.grabY}px)`;
  };

  const startDrag = (e, item, area, el, kind = 'node') => {
    if (e.button !== 0) return;
    e.preventDefault();
    const r = el.getBoundingClientRect();
    dragInfo.current = { uid: item.uid, def: item.def, kind, grabX: e.clientX - r.left, grabY: e.clientY - r.top, x: e.clientX, y: e.clientY };
    setDrag({ uid: item.uid, def: item.def, kind });
  };

  // The loadout after dropping the dragged thing on `target`.
  const applyDrop = (l, d, target) => {
    if (d.kind === 'equipment') {
      if (target?.none) return l;
      return target ? moveEquipment(l, d.uid, target.equipArea, target.slot) ?? l : dropEquipmentToFloat(l, d.uid);
    }
    if (target?.upgrade) return upgradeNode(l, d.uid, target.upgrade) ?? l;
    if (target) return moveNode(l, d.uid, target.area, target.x, target.y) ?? l;
    return dropToFloat(l, d.uid);
  };

  // Follow the pointer while dragging; drop on release.
  useLayoutEffect(() => {
    if (!drag) return;
    placeFloat();
    let last = null;

    const onMove = (e) => {
      Object.assign(dragInfo.current, { x: e.clientX, y: e.clientY });
      placeFloat();
      const target = findTarget();
      const key =
        target && (target.upgrade ?? (target.equipArea !== undefined ? `e${target.equipArea}:${target.slot}` : `${target.area}:${target.x},${target.y}`));
      if (key !== last) {
        last = key;
        setHover(target);
      }
    };

    const onUp = () => {
      const d = dragInfo.current;
      const target = findTarget();
      // Animate from where the piece was released.
      const f = floatRef.current.getBoundingClientRect();
      const root = rootRef.current.getBoundingClientRect();
      dropFrom.current.set(d.uid, { x: f.left - root.left, y: f.top - root.top });
      setLoadout(applyDrop(loadoutRef.current, d, target));
      dragInfo.current = null;
      setDrag(null);
      setHover(null);
    };

    document.body.style.cursor = 'grabbing';
    tooltips?.setSuppressed(true); // no tooltips while dragging
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      document.body.style.cursor = '';
      tooltips?.setSuppressed(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [drag]); // eslint-disable-line react-hooks/exhaustive-deps

  const ctx = useMemo(
    () => ({
      rootRef,
      positions: positions.current,
      dropFrom: dropFrom.current,
      dragUid: drag?.uid,
      hover,
      startDrag,
      registerArea: (area, el, colOffset) => areas.current.set(area, { el, colOffset }),
    }),
    [drag, hover] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const zone = (z) => loadout.floating.filter((n) => n.zone === z);

  return (
    <EditContext.Provider value={ctx}>
      <div ref={rootRef} className="flex flex-col items-center gap-6">
        <h1 className="text-4xl">{t('exploreTitle')}</h1>
        <p>{t('exploreIntro')}</p>

        {/* Random offer, floating above the fighter */}
        <div className="flex flex-wrap items-center justify-center gap-10" style={{ minHeight: STEP * 2 }}>
          {zone('offer').map((n, i) => (
            <FloatingItem key={n.uid} node={n} index={i} />
          ))}
        </div>

        {/* Fighters, with bumped / removed nodes floating off to the right.
            The overflow is positioned outside the flow so the fighter stays centered. */}
        <div className="relative flex flex-wrap justify-center gap-6">
          {loadout.fighters.map((f, i) => (
            <FighterCard
              key={i}
              area={i}
              fighter={{ id: i, def: f.fighter, equipment: f.equipment, nodes: f.nodes }}
            />
          ))}
          <div className="absolute left-full top-0 ml-10 flex flex-col items-start gap-6">
            {zone('overflow').map((n, i) => (
              <FloatingItem key={n.uid} node={n} index={i} />
            ))}
          </div>
        </div>

        <button onClick={onFight} className="px-8 py-2 rounded-lg bg-rose hover:bg-dusty text-lg">
          {t('fight')}
        </button>
      </div>

      {/* The piece being dragged follows the pointer */}
      {drag && (
        <div ref={floatRef} className="fixed left-0 top-0 z-20 pointer-events-none">
          {drag.kind === 'equipment' ? (
            <EquipmentPiece def={drag.def} interactive={false} />
          ) : (
            <NodeShape def={NODES[drag.def]} level={findNode(loadout, drag.uid)?.level} interactive={false} />
          )}
        </div>
      )}
    </EditContext.Provider>
  );
}
