import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { EDIT, NODES, RUN } from '../data.js';
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
  applyEffect,
  overlapping,
  putInSlot,
  upgradeNode,
} from '../game/edit.js';
import { isBossStage } from '../game/run.js';
import { canUpgrade } from '../game/effects.js';
import { cellsAt } from '../game/inventory.js';
import { EditContext } from './editContext.js';
import { useTooltipControls } from './tooltip/Tooltip.jsx';
import { EquipmentPiece, NodeShape, STEP } from './Inventory.jsx';
import FighterCard from './FighterCard.jsx';
import FloatingItem from './FloatingItem.jsx';
import EffectRow from './EffectRow.jsx';
import { EncounterCard, EncounterPanel } from './Encounter.jsx';

// Explore / edit phase, between battles: encounters (pick one of the cards,
// then do it), and arranging the fighters' inventories. Things gained float
// above the fighter; bumped or removed nodes float to its right. With no
// encounter left, the next battle can start.
export default function ExploreScreen({ run, setLoadout, onPick, onUse, onFinish, onFight }) {
  const { loadout, encounter } = run;
  const rootRef = useRef(null);
  const slotRef = useRef(null); // the encounter's node slot, if it has one
  const floatRef = useRef(null);
  const areas = useRef(new Map()); // area -> { el, colOffset }
  const positions = useRef(new Map());
  const dropFrom = useRef(new Map());
  const dragInfo = useRef(null); // { uid, def, kind, grabX, grabY, startX, startY, x, y }
  const loadoutRef = useRef(loadout);
  loadoutRef.current = loadout;
  const tooltips = useTooltipControls();

  // A press on a piece: { uid, def, kind }. It only becomes a real drag
  // (dragActive) once the pointer travels EDIT.dragThresholdPx; released
  // before that, it's a click, which selects the piece instead.
  const [drag, setDrag] = useState(null);
  const [dragActive, setDragActive] = useState(false);
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
    // An effect goes onto whatever node is under the pointer.
    if (d.kind === 'effect') return under && findNode(loadoutRef.current, under) ? { applyTo: under } : null;
    if (under && under !== d.uid) {
      const a = findNode(loadoutRef.current, d.uid);
      const b = findNode(loadoutRef.current, under);
      if (a && b && canUpgrade(a, b)) return { upgrade: under };
    }
    // Pointer over the encounter's slot: put the node in it.
    const slot = slotRef.current;
    if (slot?.isConnected) {
      const r = slot.getBoundingClientRect();
      if (d.x >= r.left && d.x <= r.right && d.y >= r.top && d.y <= r.bottom) return { slot: true };
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
    dragInfo.current = {
      uid: item.uid,
      def: item.def,
      kind,
      grabX: e.clientX - r.left,
      grabY: e.clientY - r.top,
      startX: e.clientX,
      startY: e.clientY,
      x: e.clientX,
      y: e.clientY,
    };
    setDrag({ uid: item.uid, def: item.def, kind });
  };

  // The loadout after dropping the dragged thing on `target`.
  const applyDrop = (l, d, target) => {
    if (d.kind === 'effect') return (target && applyEffect(l, d.uid, target.applyTo)) ?? l;
    if (d.kind === 'equipment') {
      if (target?.none) return l;
      return target ? moveEquipment(l, d.uid, target.equipArea, target.slot) ?? l : dropEquipmentToFloat(l, d.uid);
    }
    if (target?.upgrade) return upgradeNode(l, d.uid, target.upgrade) ?? l;
    if (target?.slot) return putInSlot(l, d.uid);
    if (target) return moveNode(l, d.uid, target.area, target.x, target.y) ?? l;
    return dropToFloat(l, d.uid);
  };

  // The dragged copy appears once the drag is real: put it under the pointer.
  useLayoutEffect(() => {
    if (dragActive) placeFloat();
  }, [dragActive]); // eslint-disable-line react-hooks/exhaustive-deps

  // Follow the pointer while dragging; drop on release.
  useLayoutEffect(() => {
    if (!drag) return;
    let last = null;
    let active = false;

    const activate = () => {
      active = true;
      setDragActive(true);
      document.body.style.cursor = 'grabbing';
      tooltips?.setSuppressed(true); // no tooltips while dragging
    };

    const onMove = (e) => {
      const d = dragInfo.current;
      Object.assign(d, { x: e.clientX, y: e.clientY });
      if (!active) {
        if (Math.hypot(d.x - d.startX, d.y - d.startY) < EDIT.dragThresholdPx) return;
        activate();
      }
      placeFloat();
      const target = findTarget();
      const key =
        target && (target.upgrade ?? target.applyTo ?? (target.slot ? 'slot' : null) ?? (target.equipArea !== undefined ? `e${target.equipArea}:${target.slot}` : `${target.area}:${target.x},${target.y}`));
      if (key !== last) {
        last = key;
        setHover(target);
      }
    };

    const onUp = () => {
      const d = dragInfo.current;
      if (!active) {
        // Never left the threshold: a click (the piece's own click selects it).
        dragInfo.current = null;
        setDrag(null);
        return;
      }
      // A real drag ended: don't let its release also count as a click.
      const swallow = (ev) => ev.stopPropagation();
      window.addEventListener('click', swallow, { capture: true, once: true });
      window.addEventListener('pointerdown', () => window.removeEventListener('click', swallow, true), { capture: true, once: true });
      const target = findTarget();
      // Animate from where the piece was released.
      const f = floatRef.current.getBoundingClientRect();
      const root = rootRef.current.getBoundingClientRect();
      dropFrom.current.set(d.uid, { x: f.left - root.left, y: f.top - root.top });
      setLoadout(applyDrop(loadoutRef.current, d, target));
      dragInfo.current = null;
      setDrag(null);
      setDragActive(false);
      setHover(null);
    };

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
      dragUid: dragActive ? drag?.uid : undefined,
      hover,
      startDrag,
      registerArea: (area, el, colOffset) => areas.current.set(area, { el, colOffset }),
      registerSlot: (el) => {
        slotRef.current = el;
      },
    }),
    [drag, dragActive, hover] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const zone = (z) => loadout.floating.filter((n) => n.zone === z);

  return (
    <EditContext.Provider value={ctx}>
      <div ref={rootRef} className="flex flex-col items-center gap-6">
        <h1 className="text-4xl">{t(encounter ? 'encounterTitle' : 'exploreTitle')}</h1>
        <p className="text-slate">
          {t('battleProgress', { n: run.stage + 1, total: run.enemies.length })}
          {isBossStage(run.stage) && ` · ${t('bossBattle')}`}
          {encounter && ` · ${t('encounterProgress', { n: encounter.index + 1, total: RUN.encountersBetween })}`}
        </p>

        {/* The encounter: a choice of cards, or the one picked */}
        {encounter && !encounter.picked && (
          <>
            <p>{t('chooseEncounter')}</p>
            <div className="flex flex-wrap items-start justify-center gap-6">
              {encounter.options.map((id, i) => (
                <EncounterCard key={`${encounter.index}-${i}`} id={id} index={i} onPick={() => onPick(id)} />
              ))}
            </div>
          </>
        )}
        {encounter?.picked && <EncounterPanel encounter={encounter} loadout={loadout} onUse={onUse} onFinish={onFinish} />}
        {!encounter && <p>{t('exploreIntro')}</p>}

        {/* Things gained, floating above the fighter */}
        {zone('offer').length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-10" style={{ minHeight: STEP * 2 }}>
            {zone('offer').map((n, i) => (
              <FloatingItem key={n.uid} node={n} index={i} />
            ))}
          </div>
        )}

        {/* Fighters, with bumped / removed nodes floating off to the right.
            The overflow is positioned outside the flow so the fighter stays centered. */}
        <div className="relative flex flex-wrap justify-center gap-6">
          {loadout.fighters.map((f, i) => (
            <FighterCard
              key={i}
              area={i}
              fighter={{ id: i, def: f.template, maxEquipment: f.maxEquipment, equipment: f.equipment, nodes: f.nodes }}
            />
          ))}
          <div className="absolute left-full top-0 ml-10 flex flex-col items-start gap-6">
            {zone('overflow').map((n, i) => (
              <FloatingItem key={n.uid} node={n} index={i} />
            ))}
          </div>
        </div>

        {!encounter && (
          <button onClick={onFight} className="px-8 py-2 rounded-lg bg-rose hover:bg-dusty text-lg">
            {t('fight')}
          </button>
        )}
      </div>

      {/* The piece being dragged follows the pointer */}
      {drag && dragActive && (
        <div ref={floatRef} className="fixed left-0 top-0 z-20 pointer-events-none">
          {drag.kind === 'effect' ? (
            <EffectRow effect={loadout.floating.find((n) => n.uid === drag.uid)?.effect} />
          ) : drag.kind === 'equipment' ? (
            <EquipmentPiece def={drag.def} interactive={false} />
          ) : (
            <NodeShape def={NODES[drag.def]} level={findNode(loadout, drag.uid)?.level} extra={findNode(loadout, drag.uid)?.extra} interactive={false} />
          )}
        </div>
      )}
    </EditContext.Provider>
  );
}
