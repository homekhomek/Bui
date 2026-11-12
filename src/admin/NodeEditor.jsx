// Admin editor for one node draft: fields, effects, shape, live preview.

import { useState } from 'react';
import { KEYWORDS, LIMITS, TOOLTIP } from '../data.js';
import { t } from '../translate.js';
import { NodeShape } from '../ui/Inventory.jsx';
import { NodeTooltip } from '../ui/tooltip/tooltipTypes.jsx';
import ShapeEditor from './ShapeEditor.jsx';
import { ArtFile, Button, ColorPicker, Field, Label, NumberInput, RarityPicker, inputClass } from './controls.jsx';
import { KINDS, NODE_ICONS } from './entities.js';
import { nodeArtTemplate } from './artTemplates.js';
import { a } from './strings.js';

function EffectEditor({ effect, index, count, update, move, remove }) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <Field label={`${index + 1}.`}>
        <select className={inputClass} value={effect.keyword} onChange={(e) => update({ keyword: e.target.value })}>
          {Object.keys(KEYWORDS).map((k) => (
            <option key={k} value={k}>
              {t(`effect.${k}`)}
            </option>
          ))}
        </select>
      </Field>
      <Field label={a('effectValue')}>
        <NumberInput className="w-24" value={effect.value} onChange={(value) => update({ value })} />
      </Field>
      <Field label={a('effectDelta')}>
        <NumberInput className="w-24" value={effect.upgradeDelta} onChange={(upgradeDelta) => update({ upgradeDelta })} />
      </Field>
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

// update(fn): fn(draft) returns the fields to change.
export default function NodeEditor({ draft, update }) {
  const [level, setLevel] = useState('1');
  const [fill, setFill] = useState(1); // preview charge, 0..1
  const setEffects = (fn) => update((d) => ({ effects: fn(d.effects) }));

  const node = KINDS.nodes.toEntry(draft);
  const preview = { ...node, maxCharge: node.maxCharge > 0 ? node.maxCharge : 1 };
  const previewLevel = Math.max(1, Math.floor(Number(level)) || 1);

  return (
    <div className="flex flex-wrap items-start gap-8">
      <div className="flex flex-col gap-4">
        <Field label={<Label k="fieldCharge" />}>
          <NumberInput min="1" value={draft.maxCharge} onChange={(maxCharge) => update(() => ({ maxCharge }))} />
        </Field>

        <Field label={a('fieldRarity')}>
          <RarityPicker value={draft.rarity} onChange={(rarity) => update(() => ({ rarity }))} />
        </Field>

        <Field label={a('fieldColor')}>
          <ColorPicker value={draft.color} onChange={(color) => update(() => ({ color }))} />
        </Field>

        <Field label={a('fieldNodeIcon')}>
          <select className={inputClass} value={draft.icon ?? ''} onChange={(e) => update(() => ({ icon: e.target.value }))}>
            <option value="">{a('iconNone')}</option>
            {NODE_ICONS.map((icon) => (
              <option key={icon} value={icon}>
                {icon}.svg
              </option>
            ))}
          </select>
        </Field>

        <Field label={a('fieldEffects')}>
          <div className="flex flex-col gap-3">
            {draft.effects.map((e, i) => (
              <EffectEditor
                key={i}
                effect={e}
                index={i}
                count={draft.effects.length}
                update={(patch) => setEffects((es) => es.map((x, j) => (j === i ? { ...x, ...patch } : x)))}
                move={(dir) =>
                  setEffects((es) => {
                    const next = [...es];
                    [next[i], next[i + dir]] = [next[i + dir], next[i]];
                    return next;
                  })
                }
                remove={() => setEffects((es) => es.filter((_, j) => j !== i))}
              />
            ))}
            <div>
              <Button onClick={() => setEffects((es) => [...es, { keyword: Object.keys(KEYWORDS)[0], value: '1', upgradeDelta: '' }])}>
                {a('addEffect')}
              </Button>
            </div>
          </div>
        </Field>
      </div>

      <Field label={a('fieldShape')}>
        <span className="text-slate">{a('shapeHint', { n: LIMITS.maxNodeSize })}</span>
        <ShapeEditor shape={draft.shape} color={draft.color} setShape={(fn) => update((d) => ({ shape: fn(d.shape) }))} />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => update(() => ({ shape: [] }))}>{a('clearShape')}</Button>
        </div>
      </Field>

      <Field label={a('fieldArt')}>
        <ArtFile
          folder="nodes"
          name={draft.id}
          build={() => nodeArtTemplate(node)}
          disabled={!node.shape.length}
          onCreated={(icon) => update(() => ({ icon }))}
        />
      </Field>

      <Field label={a('preview')}>
        <div className="flex flex-wrap items-end gap-4">
          <Field label={a('previewLevel')}>
            <NumberInput className="w-24" min="1" value={level} onChange={setLevel} />
          </Field>
          <Field label={a('previewCharge')}>
            <input type="range" min="0" max="1" step="any" value={fill} onChange={(e) => setFill(Number(e.target.value))} />
          </Field>
        </div>
        {node.shape.length ? (
          <NodeShape def={preview} level={previewLevel} charge={preview.maxCharge * fill} interactive={false} />
        ) : (
          <span className="text-slate">{a('noTiles')}</span>
        )}
        <span className="text-slate">{a('tooltipPreview')}</span>
        <div className="rounded-panel border-stroke border-dusk bg-blush px-4 py-2" style={{ maxWidth: TOOLTIP.maxWidthPx }}>
          <NodeTooltip def={node.id} node={preview} name={draft.name} level={previewLevel} />
        </div>
      </Field>
    </div>
  );
}
