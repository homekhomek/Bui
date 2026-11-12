import { useId, useLayoutEffect, useMemo, useRef } from 'react';
import { ANIM, EDIT, EQUIPMENT, INVENTORY, NODES, SELECT, STROKE_PX } from '../data.js';
import { nodeOutlinePath } from './nodeOutline.js';
import { useEdit, useSlide } from './editContext.js';
import { useSelectable, useTooltip } from './tooltip/Tooltip.jsx';
import { equipmentIcon, nodeIcon } from './assets.js';

const { cellPx, gapPx, tileRadiusPx: radius, equipmentBorderPx, unchargedOpacity } = INVENTORY;
const { pipRadiusPx, pipGapPx, pipInsetPx } = INVENTORY;
export const STEP = cellPx + gapPx;
const color = (name) => `var(--color-${name})`;
const cell = { width: cellPx, height: cellPx };

// Inline style for the selection border's shrink-on animation.
const selectAnim = {
  '--select-from': SELECT.fromScale,
  animation: `select-in ${SELECT.animMs}ms ${ANIM.ease}`,
};

// A node drawn as one SVG shape: a single continuous outline, gaps between its
// own tiles filled in. Only the shape itself is hoverable, not its bounding box.
// charge defaults to full (no wash-out), as in the edit phase.
// Upgraded nodes show one pip per level; the node pops when its level rises.
// tooltip=false keeps it clickable without a tooltip (admin: unsaved nodes).
// extra: effects this one node has gained (shown in its tooltip).
// boosts: what it has built up this battle (keyword -> amount, in its tooltip).
export function NodeShape({ def, level = 1, extra, boosts, uid, charge = def.maxCharge, highlight = false, interactive = true, tooltip: showTooltip = true, onPointerDown }) {
  const id = `node-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const svgRef = useRef(null);
  const lastLevel = useRef(level);
  const outline = useMemo(() => nodeOutlinePath(def.shape, { cellPx, gapPx, radiusPx: radius }), [def]);
  const cols = 1 + Math.max(...def.shape.map(([dx]) => dx));
  const rows = 1 + Math.max(...def.shape.map(([, dy]) => dy));
  const width = cols * STEP - gapPx;
  const height = rows * STEP - gapPx;
  const unchargedPx = height * (1 - charge / def.maxCharge);
  const [px, py] = def.shape[0];
  const tooltip = useTooltip('node', { def: def.id, level, extra, boosts });
  const sel = useSelectable('node', { def: def.id, level, extra, boosts });
  const selectable = interactive && showTooltip;

  useLayoutEffect(() => {
    if (level > lastLevel.current) {
      svgRef.current?.animate(
        [{ scale: 1 }, { scale: EDIT.popScale }, { scale: 1 }],
        { duration: EDIT.popMs, easing: 'ease-out' }
      );
    }
    lastLevel.current = level;
  }, [level]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="block overflow-visible"
    >
      <defs>
        <clipPath id={id}>
          <path d={outline} fillRule="evenodd" />
        </clipPath>
      </defs>
      {/* Upgrade target: solid outline outside the border (the fill covers its inner half) */}
      {highlight && (
        <path
          d={outline}
          fillRule="evenodd"
          fill="none"
          stroke={color('mint')}
          strokeWidth={EDIT.upgradeOutlinePx * 2}
          strokeLinejoin="round"
        />
      )}
      <g clipPath={`url(#${id})`}>
        <path d={outline} fillRule="evenodd" fill={color(def.color)} />
        {/* Art: drawn on the node's template, so it covers exactly its bounding box */}
        {def.icon && <image href={nodeIcon(def.icon)} x={0} y={0} width={width} height={height} preserveAspectRatio="none" />}
        {/* Uncharged part is washed out; the node fills upward as charge builds */}
        <rect x={0} y={0} width={width} height={unchargedPx} fill={color('white')} opacity={unchargedOpacity} />
        {/* Border: stroke is centered on the path, the clip keeps the inner half */}
        <path d={outline} fillRule="evenodd" fill="none" stroke={color('dusk')} strokeWidth={STROKE_PX * 2} />
      </g>
      {/* Level pips in the first tile (none at level 1) */}
      {level > 1 &&
        Array.from({ length: level }, (_, i) => (
          <circle
            key={i}
            cx={px * STEP + pipInsetPx + pipRadiusPx + i * (pipRadiusPx * 2 + pipGapPx)}
            cy={py * STEP + pipInsetPx + pipRadiusPx}
            r={pipRadiusPx}
            fill={color('white')}
            stroke={color('dusk')}
            strokeWidth={STROKE_PX}
          />
        ))}
      {/* Selection border, over the node's own */}
      {selectable && sel.selected && (
        <path
          d={outline}
          fillRule="evenodd"
          fill="none"
          stroke={color('dusk')}
          strokeWidth={SELECT.borderPx}
          strokeLinejoin="round"
          pointerEvents="none"
          style={{ ...selectAnim, transformBox: 'fill-box', transformOrigin: 'center' }}
        />
      )}
      <path
        ref={sel.ref}
        d={outline}
        fillRule="evenodd"
        fill="transparent"
        className="cursor-pointer"
        pointerEvents={interactive ? 'fill' : 'none'}
        style={{ touchAction: 'none' }}
        data-uid={uid}
        onPointerDown={onPointerDown}
        onClick={selectable ? sel.select : undefined}
        {...(selectable ? tooltip : {})}
      />
    </svg>
  );
}

// A node placed in a grid. In the edit phase it is draggable and slides into
// place; in battle it slides with a plain CSS transition.
function GridNode({ node, area, colOffset, animMs }) {
  const edit = useEdit();
  const slideRef = useSlide(node.uid);
  const dragging = edit?.dragUid === node.uid;

  // Battle: a used node jumps (unanimated) past the right edge, then slides in.
  useLayoutEffect(() => {
    const el = slideRef.current;
    if (edit || !node.spawns || !el) return;
    el.style.transition = 'none';
    el.style.left = `${(node.spawnX + colOffset) * STEP}px`;
    el.getBoundingClientRect(); // commit the jump before animating
    el.style.transition = `left ${animMs}ms ${ANIM.ease}`;
    el.style.left = `${(node.x + colOffset) * STEP}px`;
  }, [node.spawns]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={slideRef}
      className="absolute pointer-events-none"
      style={{
        left: (node.x + colOffset) * STEP,
        top: node.y * STEP,
        transition: edit ? undefined : `left ${animMs}ms ${ANIM.ease}`,
        opacity: dragging ? EDIT.ghostOpacity : 1,
      }}
    >
      <NodeShape
        def={NODES[node.def]}
        level={node.level}
        extra={node.extra}
        boosts={node.boosts}
        uid={node.uid}
        charge={node.charge}
        highlight={edit?.hover?.upgrade === node.uid || edit?.hover?.applyTo === node.uid}
        onPointerDown={edit ? (e) => edit.startDrag(e, node, area, slideRef.current) : undefined}
      />
    </div>
  );
}

// A grid of node tiles: row y is widths[y] tiles long, starting colOffset
// columns in (to leave room for the equipment column). `children` render
// underneath, e.g. equipment.
export function NodeGrid({ area, widths, rows = widths.length, colOffset = 0, nodes, animMs = 0, children }) {
  const edit = useEdit();
  const cols = colOffset + Math.max(0, ...widths);
  const preview = edit?.hover?.cells && edit.hover.area === area ? edit.hover : null;

  return (
    <div
      ref={edit ? (el) => el && edit.registerArea(area, el, colOffset) : undefined}
      className={`relative ${edit ? '' : 'overflow-hidden' /* battle rows run past the edge */}`}
      style={{ width: cols * STEP - gapPx, height: rows * STEP - gapPx }}
    >
      {children}
      {widths.map((w, y) =>
        Array.from({ length: w }, (_, x) => (
          <div
            key={`${x},${y}`}
            className="absolute rounded bg-haze"
            style={{ ...cell, left: (x + colOffset) * STEP, top: y * STEP }}
          />
        ))
      )}
      {nodes.map((n) => (
        <GridNode key={n.uid} node={n} area={area} colOffset={colOffset} animMs={animMs} />
      ))}
      {/* Drop preview: mint = free spot, peach = will bump a node */}
      {preview?.cells.map(([x, y]) => (
        <div
          key={`p${x},${y}`}
          className="absolute rounded border-stroke border-dashed border-dusk pointer-events-none"
          style={{
            ...cell,
            left: (x + colOffset) * STEP,
            top: y * STEP,
            backgroundColor: color(preview.bumping ? 'peach' : 'mint'),
            opacity: EDIT.previewOpacity,
          }}
        />
      ))}
    </div>
  );
}

// One piece of equipment (heavy double border). Used in the inventory column,
// floating in the ether, and as the piece being dragged.
// data overrides the data.js entry (admin previews of unsaved equipment).
export function EquipmentPiece({ def, data = EQUIPMENT[def], highlight = false, interactive = true, onPointerDown }) {
  const tooltip = useTooltip('equipment', { id: def });
  const sel = useSelectable('equipment', { id: def });
  return (
    <div
      ref={sel.ref}
      {...(interactive ? tooltip : {})}
      onClick={interactive ? sel.select : undefined}
      className={`relative rounded-lg border-double border-dusk ${interactive ? 'cursor-pointer' : 'pointer-events-none'}`}
      style={{
        ...cell,
        borderWidth: equipmentBorderPx,
        backgroundColor: color(data.color),
        touchAction: 'none',
        outline: highlight ? `${EDIT.upgradeOutlinePx}px solid ${color('mint')}` : undefined,
      }}
      onPointerDown={onPointerDown}
    >
      {data.icon && (
        <img
          src={equipmentIcon(data.icon)}
          alt=""
          draggable={false}
          className="block w-full h-full pointer-events-none"
        />
      )}
      {/* Selection border, over the piece's own (outer edge to outer edge) */}
      {interactive && sel.selected && (
        <div
          className="absolute rounded-lg border-dusk pointer-events-none"
          style={{ inset: -equipmentBorderPx, borderWidth: SELECT.borderPx, ...selectAnim }}
        />
      )}
    </div>
  );
}

// Equipment in the inventory column. In the edit phase it is draggable
// (reorder, move between fighters, or drag out) and slides into place.
function EquipmentTile({ item, area, y }) {
  const edit = useEdit();
  const slideRef = useSlide(item.uid);
  return (
    <div
      ref={slideRef}
      className="absolute"
      style={{ left: 0, top: y * STEP, opacity: edit?.dragUid === item.uid ? EDIT.ghostOpacity : 1 }}
    >
      <EquipmentPiece
        def={item.def}
        onPointerDown={edit ? (e) => edit.startDrag(e, item, area, slideRef.current, 'equipment') : undefined}
      />
    </div>
  );
}

function EmptySlot({ y }) {
  const tooltip = useTooltip('emptySlot', {});
  return (
    <div
      {...tooltip}
      className="absolute rounded-lg border-stroke border-dashed border-lilac cursor-pointer"
      style={{ ...cell, left: 0, top: y * STEP }}
    />
  );
}

// A fighter's inventory: equipment column on the left, node rows to the right.
// equipment: [{ uid, def }] in the edit phase, or plain ids in battle.
export default function Inventory({ area, equipment, maxEquipment, nodes, animMs = 0 }) {
  const edit = useEdit();
  const items = equipment.map((e, i) => (typeof e === 'string' ? { uid: `${area}:${i}`, def: e } : e));
  const widths = items.map((e) => EQUIPMENT[e.def].nodeSlots);
  const preview = edit?.hover && edit.hover.equipArea === area ? edit.hover : null;

  return (
    <NodeGrid area={area} widths={widths} rows={maxEquipment} colOffset={1} nodes={nodes} animMs={animMs}>
      {Array.from({ length: maxEquipment }, (_, y) => (
        <EmptySlot key={y} y={y} />
      ))}
      {items.map((e, y) => (
        <EquipmentTile key={e.uid} item={e} area={area} y={y} />
      ))}
      {/* Equipment drop preview: mint = lands here, peach = replaces what's here */}
      {preview && (
        <div
          className="absolute z-10 rounded-lg border-stroke border-dashed border-dusk pointer-events-none"
          style={{
            ...cell,
            left: 0,
            top: preview.slot * STEP,
            backgroundColor: color(preview.replacing ? 'peach' : 'mint'),
            opacity: EDIT.previewOpacity,
          }}
        />
      )}
    </NodeGrid>
  );
}
