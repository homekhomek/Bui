// Admin dashboard: browse, edit and create game data (nodes, equipment,
// fighter templates, encounters), then
// save data.js / translate.js into src/ (through the dev server) or download
// them. Dev only: App.jsx only loads this in
// `npm run dev`, at #admin. It is not part of player builds.
//
// Edits are drafts (see entities.js), kept in localStorage so a reload or hot
// update doesn't lose them. Nothing changes in the game until they're saved
// (or the downloaded files replace the ones in src/).

import { useEffect, useMemo, useState } from 'react';
import { ADMIN } from '../data.js';
import { Button, Field, TextInput } from './controls.jsx';
import EntityExplorer, { Thumb } from './EntityExplorer.jsx';
import NodeEditor from './NodeEditor.jsx';
import EquipmentEditor from './EquipmentEditor.jsx';
import TemplateEditor from './TemplateEditor.jsx';
import EncounterEditor from './EncounterEditor.jsx';
import {
  KINDS,
  buildDataJs,
  buildTranslateJs,
  download,
  draftsFromData,
  isAllUnchanged,
  newKey,
  uniqueId,
  validateAll,
} from './entities.js';
import { a } from './strings.js';
import { saveFiles } from './save.js';

const STORAGE_KEY = 'bui.admin.drafts';
const EDITORS = { nodes: NodeEditor, equipment: EquipmentEditor, templates: TemplateEditor, encounters: EncounterEditor };

function loadDrafts() {
  const fresh = draftsFromData();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    // Kinds added since the drafts were saved start from data.js, and fields
    // added since (e.g. rarity) come from the entry's data.js version, or a new
    // entry's defaults.
    if (saved) {
      return Object.fromEntries(
        Object.values(KINDS).map((kind) => {
          if (!Array.isArray(saved[kind.id])) return [kind.id, fresh[kind.id]];
          const defaults = kind.newDraft([], fresh);
          return [
            kind.id,
            saved[kind.id].map((d) => ({ ...defaults, ...(fresh[kind.id].find((f) => f.id === d.id) ?? {}), ...d })),
          ];
        })
      );
    }
  } catch {
    // no saved drafts
  }
  return fresh;
}

export default function AdminScreen() {
  const [drafts, setDrafts] = useState(loadDrafts);
  const [tab, setTab] = useState('nodes');
  const [selected, setSelected] = useState({}); // kind -> draft key
  const [resetArmed, setResetArmed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved | failed
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
    } catch {
      // storage unavailable: drafts just won't survive a reload
    }
  }, [drafts]);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), ADMIN.flashMs);
    return () => clearTimeout(id);
  }, [copied]);

  useEffect(() => {
    if (saveState !== 'saved') return;
    const id = setTimeout(() => setSaveState('idle'), ADMIN.flashMs);
    return () => clearTimeout(id);
  }, [saveState]);

  const errors = useMemo(() => validateAll(drafts), [drafts]);
  const errorKeys = useMemo(
    () => Object.fromEntries(Object.keys(KINDS).map((k) => [k, new Set(errors.filter((e) => e.kind === k).map((e) => e.key))])),
    [errors]
  );
  const unchanged = isAllUnchanged(drafts);

  const kind = KINDS[tab];
  const list = drafts[tab];
  const draft = list.find((d) => d.key === selected[tab]) ?? list[0];
  const select = (key) => setSelected((s) => ({ ...s, [tab]: key }));
  const setList = (fn) => setDrafts((ds) => ({ ...ds, [tab]: fn(ds[tab]) }));
  const update = (fn) => setList((l) => l.map((d) => (d.key === draft.key ? { ...d, ...fn(d) } : d)));

  const add = (d) => {
    setList((l) => [...l, d]);
    select(d.key);
  };
  const duplicate = () => add({ ...structuredClone(draft), key: newKey(), id: uniqueId(draft.id, list) });
  const remove = () => {
    const i = list.indexOf(draft);
    const rest = list.filter((d) => d !== draft);
    setList(() => rest);
    select(rest[Math.min(i, rest.length - 1)]?.key);
  };

  const reset = () => {
    if (!resetArmed) return setResetArmed(true);
    setDrafts(draftsFromData());
    setSelected({});
    setResetArmed(false);
  };

  const copyData = async () => {
    await navigator.clipboard.writeText(await buildDataJs(drafts));
    setCopied(true);
  };
  // Exports are formatted with Prettier, which is async.
  // Save writes both files into src/; the game hot-reloads with them.
  const save = async () => {
    setSaveState('saving');
    try {
      const [data, translate] = await Promise.all([buildDataJs(drafts), buildTranslateJs(drafts)]);
      await saveFiles({ data, translate });
      setSaveState('saved');
    } catch (e) {
      setSaveError(String(e?.message ?? e));
      setSaveState('failed');
    }
  };
  const exportFile = async (fileName, build) => download(fileName, await build(drafts));

  const Editor = EDITORS[tab];

  return (
    <div className="w-full flex flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-1">
        <h1 className="text-4xl">{a('title')}</h1>
        <p className="text-slate">{a('subtitle')}</p>
        <a href="#" className="underline">
          {a('back')}
        </a>
      </div>

      {/* Export */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex flex-wrap justify-center gap-2">
          <Button primary disabled={errors.length > 0 || saveState === 'saving'} onClick={save}>
            {a(saveState === 'saving' ? 'saving' : saveState === 'saved' ? 'saved' : 'save')}
          </Button>
          <Button disabled={errors.length > 0} onClick={() => exportFile('data.js', buildDataJs)}>
            {a('downloadData')}
          </Button>
          <Button disabled={errors.length > 0} onClick={() => exportFile('translate.js', buildTranslateJs)}>
            {a('downloadTranslate')}
          </Button>
          <Button disabled={errors.length > 0} onClick={copyData}>
            {copied ? a('copied') : a('copyData')}
          </Button>
          <Button onClick={reset} onPointerLeave={() => setResetArmed(false)} disabled={unchanged}>
            {resetArmed ? a('resetConfirm') : a('reset')}
          </Button>
        </div>
        <span className="text-slate">
          {unchanged ? a('upToDate') : a('unexported')} · {a('exportHint')}
        </span>
        {saveState === 'failed' && (
          <span className="rounded-panel border-stroke border-dashed border-dusk bg-peach px-4 py-2 select-text">
            {a('saveFailed', { error: saveError })}
          </span>
        )}
        {errors.length > 0 && (
          <div className="flex flex-col items-center rounded-panel border-stroke border-dashed border-dusk bg-peach px-4 py-2">
            <span>{a('errorsTitle')}</span>
            {errors.map((e, i) => (
              <button
                key={i}
                className="hover:underline"
                onClick={() => {
                  if (!KINDS[e.kind]) return; // e.g. fighter templates: no tab yet
                  setTab(e.kind);
                  if (e.key) setSelected((s) => ({ ...s, [e.kind]: e.key }));
                }}
              >
                {e.text}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Kind tabs */}
      <div className="flex flex-wrap justify-center gap-2">
        {Object.values(KINDS).map((k) => (
          <button
            key={k.id}
            onClick={() => setTab(k.id)}
            className={`px-6 py-1 rounded-tile border-stroke ${tab === k.id ? 'bg-mist' : 'bg-haze hover:bg-mist'} ${
              tab === k.id || errorKeys[k.id].size ? 'border-dusk' : 'border-transparent'
            } ${errorKeys[k.id].size ? 'border-dashed' : ''}`}
          >
            {a(k.tab, { n: drafts[k.id].length })}
          </button>
        ))}
      </div>

      <div className="w-full flex flex-wrap justify-center items-start gap-8">
        {/* One explorer per kind, kept mounted so search / filters survive tab switches */}
        {Object.values(KINDS).map((k) => (
          <div key={k.id} hidden={k.id !== tab}>
            <EntityExplorer
              kind={k}
              drafts={drafts[k.id]}
              selectedKey={(drafts[k.id].find((d) => d.key === selected[k.id]) ?? drafts[k.id][0])?.key}
              onSelect={(key) => setSelected((s) => ({ ...s, [k.id]: key }))}
              onNew={() => add(k.newDraft(drafts[k.id], drafts))}
              ctx={drafts}
              errorKeys={errorKeys[k.id]}
            />
          </div>
        ))}

        {draft && (
          <div className="flex-1 flex flex-col gap-6 text-left" style={{ minWidth: ADMIN.explorerWidthPx }}>
            <div className="flex flex-wrap items-end gap-4">
              <Thumb kind={kind} draft={draft} size={ADMIN.thumbPx * 2} />
              <Field label={a('fieldName')}>
                <TextInput value={draft.name} onChange={(name) => update(() => ({ name }))} />
              </Field>
              <Field label={a('fieldId')}>
                <TextInput value={draft.id} onChange={(id) => update(() => ({ id }))} />
              </Field>
              <Button onClick={duplicate}>{a('duplicate')}</Button>
              <Button onClick={remove} disabled={list.length <= 1}>
                {a('delete')}
              </Button>
            </div>
            {/* key: per-draft preview state (level, fill) resets when switching */}
            <Editor key={draft.key} draft={draft} update={update} ctx={drafts} />
          </div>
        )}
      </div>
    </div>
  );
}
