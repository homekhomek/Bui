// Admin editor for one encounter: its texts, rarity, type and params, with a
// live preview of its card. What a type DOES is code (src/game/encounters.js).

import { ADMIN, KEYWORDS, RARITIES } from '../data.js';
import { t } from '../translate.js';
import { ENCOUNTER_TYPES } from '../game/encounters.js';
import { EncounterCard } from '../ui/Encounter.jsx';
import { encounterDescription } from '../ui/encounterText.js';
import { Field, NumberInput, RarityPicker, TextInput, inputClass } from './controls.jsx';
import { KINDS, defaultParams } from './entities.js';
import { a } from './strings.js';

// An encounter in the explorer: a square in its rarity's color, with its initial.
export function EncounterThumb({ draft, size = ADMIN.thumbPx }) {
  return (
    <div
      className="shrink-0 flex items-center justify-center rounded border-stroke border-dusk font-heading"
      style={{ width: size, height: size, backgroundColor: `var(--color-${RARITIES[draft.rarity]?.color ?? 'haze'})` }}
    >
      {(draft.name || '?')[0]}
    </div>
  );
}

function ParamEditor({ name, spec, value, onChange }) {
  if (spec.kind === 'rarity') {
    return (
      <Field label={name}>
        <RarityPicker value={value} onChange={onChange} />
      </Field>
    );
  }
  if (spec.kind === 'effect') {
    return (
      <Field label={name}>
        <div className="flex flex-wrap items-end gap-2">
          <select className={inputClass} value={value.keyword} onChange={(e) => onChange({ ...value, keyword: e.target.value })}>
            {Object.keys(KEYWORDS).map((k) => (
              <option key={k} value={k}>
                {t(`effect.${k}`)}
              </option>
            ))}
          </select>
          <Field label={a('effectValue')}>
            <NumberInput className="w-24" value={value.value} onChange={(v) => onChange({ ...value, value: v })} />
          </Field>
          <Field label={a('effectDelta')}>
            <NumberInput className="w-24" value={value.upgradeDelta} onChange={(v) => onChange({ ...value, upgradeDelta: v })} />
          </Field>
        </div>
      </Field>
    );
  }
  return (
    <Field label={name}>
      <NumberInput min={spec.min} value={value} onChange={onChange} />
    </Field>
  );
}

// update(fn): fn(draft) returns the fields to change.
export default function EncounterEditor({ draft, update }) {
  const entry = KINDS.encounters.toEntry(draft);
  const specs = ENCOUNTER_TYPES[draft.type]?.params ?? {};
  const setParam = (k, v) => update((d) => ({ params: { ...d.params, [k]: v } }));

  return (
    <div className="flex flex-wrap items-start gap-8">
      <div className="flex flex-col gap-4">
        <Field label={a('fieldDescription')}>
          <textarea
            className={`${inputClass} w-full`}
            rows={3}
            value={draft.description}
            onChange={(e) => update(() => ({ description: e.target.value }))}
          />
        </Field>
        <Field label={a('fieldAction')}>
          <TextInput value={draft.action} onChange={(action) => update(() => ({ action }))} />
        </Field>
        <Field label={a('fieldRarity')}>
          <RarityPicker value={draft.rarity} onChange={(rarity) => update(() => ({ rarity }))} />
        </Field>
        <Field label={a('fieldType')}>
          <select
            className={inputClass}
            value={draft.type}
            onChange={(e) => update(() => ({ type: e.target.value, params: defaultParams(e.target.value) }))}
          >
            {!ENCOUNTER_TYPES[draft.type] && <option value={draft.type}>{draft.type}</option>}
            {Object.keys(ENCOUNTER_TYPES).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </Field>
        <Field label={a('fieldParams')}>
          <div className="flex flex-col gap-3">
            {Object.entries(specs).map(([k, spec]) => (
              <ParamEditor key={k} name={k} spec={spec} value={draft.params?.[k] ?? ''} onChange={(v) => setParam(k, v)} />
            ))}
            {!Object.keys(specs).length && <span className="text-slate">{a('noParams')}</span>}
          </div>
        </Field>
      </div>

      <Field label={a('preview')}>
        <EncounterCard
          id={draft.id}
          entry={entry}
          name={draft.name}
          description={encounterDescription(draft.id, entry, draft.description)}
        />
      </Field>
    </div>
  );
}
