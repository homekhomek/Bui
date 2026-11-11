// Admin editor for one fighter template: sprite, base HP, max equipment,
// starting equipment (ordered) and starting nodes placed on its inventory grid.
// Equipment and nodes are referenced by draft key (see entities.js).

import { useState } from 'react';
import { ADMIN, EDIT, INVENTORY, LIMITS, SPRITE } from '../data.js';
import { EquipmentPiece, NodeShape, STEP } from '../ui/Inventory.jsx';
import FighterSprite from '../ui/FighterSprite.jsx';
import { fighterSprite } from '../ui/assets.js';
import { useTooltip } from '../ui/tooltip/Tooltip.jsx';
import { Button, Field, Label, NumberInput, inputClass } from './controls.jsx';
import {
  FIGHTER_SPRITES,
  KINDS,
  nodeLevel,
  num,
  resolve,
  templateHp,
  templateNodeCells,
  templateWidths,
} from './entities.js';
import { a } from './strings.js';

const cell = { width: INVENTORY.cellPx, height: INVENTORY.cellPx };

// A sprite file shown small: just its body square, like in game.
export function SpriteThumb({ sprite, size = ADMIN.thumbPx }) {
  const scale = size / SPRITE.bodyArt;
  return (
    <div className="relative shrink-0 overflow-hidden rounded border-stroke border-dusk bg-white" style={{ width: size, height: size }}>
      {sprite && (
        <img
          src={fighterSprite(sprite)}
          alt=""
          draggable={false}
          className="absolute max-w-none"
          width={SPRITE.sizeArt * scale}
          height={SPRITE.sizeArt * scale}
          style={{
            left: (-(SPRITE.sizeArt - SPRITE.bodyArt) / 2) * scale,
            top: -(SPRITE.sizeArt - SPRITE.bodyArt) * scale,
          }}
        />
      )}
    </div>
  );
}

function SpriteChoice({ sprite, selected, onClick }) {
  const tooltip = useTooltip('text', { text: `${sprite}.svg` });
  return (
    <button
      {...tooltip}
      onClick={onClick}
      className={`p-1 rounded-lg border-stroke ${selected ? 'border-dusk bg-mist' : 'border-transparent hover:bg-haze'}`}
    >
      <SpriteThumb sprite={sprite} />
    </button>
  );
}

// A node draft as drawable NODES data (safe even while its fields are invalid).
function nodeDef(nodeDraft) {
  const e = KINDS.nodes.toEntry(nodeDraft);
  return { ...e, maxCharge: e.maxCharge > 0 ? e.maxCharge : 1 };
}

function EquipmentRow({ ref_, index, count, options, onChange, move, remove }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-slate">{index + 1}.</span>
      <select className={inputClass} value={ref_} onChange={(e) => onChange(e.target.value)}>
        {!options.some((o) => o.key === ref_) && <option value={ref_}>{a('missingRef')}</option>}
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.name} ({o.id})
          </option>
        ))}
      </select>
      <Button onClick={() => move(-1)} disabled={index === 0}>
        {a('moveUp')}
      </Button>
      <Button onClick={() => move(1)} disabled={index === count - 1}>
        {a('moveDown')}
      </Button>
      <Button onClick={remove}>{a('remove')}</Button>
    </div>
  );
}

// update(fn): fn(draft) returns the fields to change. ctx: all drafts.
export default function TemplateEditor({ draft, update, ctx }) {
  const [brush, setBrush] = useState(ctx.nodes[0]?.key ?? '');
  const [brushLevel, setBrushLevel] = useState('1');
  const [hover, setHover] = useState(null); // { x, y } grid cell under the pointer

  const maxEquipment = Math.max(1, Math.min(LIMITS.maxEquipment, Math.floor(num(draft.maxEquipment)) || 1));
  const rows = Math.max(maxEquipment, draft.equipment.length);
  const widths = templateWidths(draft, ctx).map((w) => Math.min(w, LIMITS.maxNodeSlots));
  const cols = 1 + Math.max(0, ...widths);

  const setEquipment = (fn) => update((d) => ({ equipment: fn(d.equipment) }));

  // Placing the brush node at (x, y): it must fit, like in game.
  const brushDraft = resolve(ctx.nodes, brush);
  const taken = new Set(draft.nodes.flatMap((n) => templateNodeCells(n, ctx)).map(([x, y]) => `${x},${y}`));
  const brushCells = (x, y) => (brushDraft ? KINDS.nodes.toEntry(brushDraft).shape.map(([dx, dy]) => [x + dx, y + dy]) : []);
  const fitsAt = (x, y) => {
    const cells = brushCells(x, y);
    return cells.length > 0 && cells.every(([cx, cy]) => cy >= 0 && cy < widths.length && cx >= 0 && cx < widths[cy] && !taken.has(`${cx},${cy}`));
  };
  const level = Math.max(1, Math.floor(num(brushLevel)) || 1);
  const place = (x, y) => {
    if (!fitsAt(x, y)) return;
    update((d) => ({ nodes: [...d.nodes, { node: brush, x, y, level: level > 1 ? String(level) : '' }] }));
  };
  const removeNode = (i) => update((d) => ({ nodes: d.nodes.filter((_, j) => j !== i) }));

  return (
    <div className="flex flex-wrap items-start gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-4">
          <Field label={<Label k="fieldBaseHp" />}>
            <NumberInput value={draft.baseHp} onChange={(baseHp) => update(() => ({ baseHp }))} />
          </Field>
          <Field label={a('fieldMaxEquipment')}>
            <NumberInput
              min="1"
              max={LIMITS.maxEquipment}
              value={draft.maxEquipment}
              onChange={(maxEquipment) => update(() => ({ maxEquipment }))}
            />
          </Field>
        </div>

        <Field label={a('fieldSprite')}>
          <div className="flex flex-wrap gap-1">
            {FIGHTER_SPRITES.map((s) => (
              <SpriteChoice key={s} sprite={s} selected={draft.sprite === s} onClick={() => update(() => ({ sprite: s }))} />
            ))}
          </div>
        </Field>

        <Field label={a('fieldEquipment')}>
          <div className="flex flex-col gap-2">
            {draft.equipment.map((ref, i) => (
              <EquipmentRow
                key={i}
                ref_={ref}
                index={i}
                count={draft.equipment.length}
                options={ctx.equipment}
                onChange={(key) => setEquipment((es) => es.map((e, j) => (j === i ? key : e)))}
                move={(dir) =>
                  setEquipment((es) => {
                    const next = [...es];
                    [next[i], next[i + dir]] = [next[i + dir], next[i]];
                    return next;
                  })
                }
                remove={() => setEquipment((es) => es.filter((_, j) => j !== i))}
              />
            ))}
            <div>
              <Button
                disabled={!ctx.equipment.length || draft.equipment.length >= maxEquipment}
                onClick={() => setEquipment((es) => [...es, ctx.equipment[0].key])}
              >
                {a('addEquipment')}
              </Button>
            </div>
          </div>
        </Field>
      </div>

      <Field label={a('fieldInventory')}>
        <span className="text-slate" style={{ maxWidth: cols * STEP }}>
          {a('inventoryHint')}
        </span>
        <div className="flex flex-wrap items-end gap-2">
          <Field label={a('brushNode')}>
            <select className={inputClass} value={brush} onChange={(e) => setBrush(e.target.value)}>
              {ctx.nodes.map((n) => (
                <option key={n.key} value={n.key}>
                  {n.name} ({n.id})
                </option>
              ))}
            </select>
          </Field>
          <Field label={a('previewLevel')}>
            <NumberInput className="w-24" min="1" value={brushLevel} onChange={setBrushLevel} />
          </Field>
        </div>

        {/* The fighter's inventory, as in game: equipment column, then node rows */}
        <div
          className="relative"
          style={{ width: cols * STEP - INVENTORY.gapPx, height: rows * STEP - INVENTORY.gapPx }}
          onPointerLeave={() => setHover(null)}
        >
          {Array.from({ length: rows }, (_, y) => {
            const eq = resolve(ctx.equipment, draft.equipment[y]);
            return (
              <div key={`e${y}`} className="absolute" style={{ left: 0, top: y * STEP }}>
                {eq ? (
                  <EquipmentPiece def={eq.id} data={KINDS.equipment.toEntry(eq)} interactive={false} />
                ) : (
                  <div className="rounded-lg border-stroke border-dashed border-lilac" style={cell} />
                )}
              </div>
            );
          })}
          {widths.map((w, y) =>
            Array.from({ length: w }, (_, x) => (
              <div
                key={`${x},${y}`}
                className="absolute rounded bg-haze cursor-pointer"
                style={{ ...cell, left: (x + 1) * STEP, top: y * STEP }}
                onPointerEnter={() => setHover({ x, y })}
                onClick={() => place(x, y)}
              />
            ))
          )}
          {draft.nodes.map((n, i) => {
            const nd = resolve(ctx.nodes, n.node);
            if (!nd || !nd.shape.length) return null;
            return (
              <div key={i} className="absolute pointer-events-none" style={{ left: (n.x + 1) * STEP, top: n.y * STEP }}>
                <NodeShape def={nodeDef(nd)} level={nodeLevel(n) || 1} tooltip={false} onPointerDown={() => removeNode(i)} />
              </div>
            );
          })}
          {/* Where the brush node would go: mint = fits, peach = doesn't */}
          {hover &&
            brushCells(hover.x, hover.y).map(([x, y]) => (
              <div
                key={`p${x},${y}`}
                className="absolute rounded border-stroke border-dashed border-dusk pointer-events-none"
                style={{
                  ...cell,
                  left: (x + 1) * STEP,
                  top: y * STEP,
                  backgroundColor: `var(--color-${fitsAt(hover.x, hover.y) ? 'mint' : 'peach'})`,
                  opacity: EDIT.previewOpacity,
                }}
              />
            ))}
        </div>
      </Field>

      <Field label={a('preview')}>
        <div className="flex flex-col items-center gap-2" style={{ paddingTop: (SPRITE.sizeArt - SPRITE.bodyArt) * (INVENTORY.cellPx / SPRITE.tileArt) }}>
          {draft.sprite && <FighterSprite template={draft.id} sprite={draft.sprite} interactive={false} />}
          <span className="inline-flex items-center leading-none">
            <Label k="totalHp" vars={{ n: templateHp(draft, ctx) }} />
          </span>
        </div>
      </Field>
    </div>
  );
}
