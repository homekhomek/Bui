// Entity explorer: find and pick one entry of a kind (nodes, equipment, ...)
// among possibly hundreds. Search (every word must match name, id, color or
// kind-specific text), filters (status, color, kind tag), sort, and keyboard
// browsing with the up / down arrows.

import { useEffect, useMemo, useRef, useState } from 'react';
import { ADMIN } from '../data.js';
import SymbolText from '../ui/SymbolText.jsx';
import { useTooltip } from '../ui/tooltip/Tooltip.jsx';
import { Button, EquipmentThumb, NodeThumb, inputClass } from './controls.jsx';
import { PALETTE, RARITY_IDS, isModified, normalizeShape } from './entities.js';
import { t } from '../translate.js';
import { SpriteThumb } from './TemplateEditor.jsx';
import { EncounterThumb } from './EncounterEditor.jsx';
import { a } from './strings.js';

const BLANK = { query: '', sort: 'order', desc: false, status: 'all', color: '', tag: '', rarity: '' };

// Strings compare alphabetically, numbers numerically, invalid numbers last.
function compare(p, q) {
  if (typeof p === 'string') return p.localeCompare(q);
  return Number.isNaN(p) - Number.isNaN(q) || p - q || 0;
}

export function Thumb({ kind, draft, size }) {
  if (kind.id === 'templates') return <SpriteThumb sprite={draft.sprite} size={size} />;
  if (kind.id === 'encounters') return <EncounterThumb draft={draft} size={size} />;
  return kind.id === 'nodes' ? (
    <NodeThumb shape={normalizeShape(draft.shape)} color={draft.color} size={size} />
  ) : (
    <EquipmentThumb color={draft.color} icon={draft.icon} size={size} />
  );
}

function Row({ kind, draft, selected, error, onSelect, ctx }) {
  const tooltip = useTooltip('text', { text: a('modified') });
  return (
    <button
      data-key={draft.key}
      tabIndex={-1}
      onClick={() => onSelect(draft.key)}
      className={`w-full flex items-center gap-3 px-2 py-1 text-left border-stroke rounded-tile ${
        selected ? 'bg-mist' : 'hover:bg-haze'
      } ${selected || error ? 'border-dusk' : 'border-transparent'} ${error ? 'border-dashed' : ''}`}
    >
      <Thumb kind={kind} draft={draft} />
      <div className="flex-1 min-w-0 flex flex-col">
        <span className="truncate">
          {draft.name || '?'}
          {isModified(kind, draft, ctx) && <span {...tooltip}> *</span>}
        </span>
        <span className="truncate text-slate">{draft.id || '?'}</span>
      </div>
      <div className="flex flex-col items-end text-slate">
        {kind.stats(draft, ctx).map((s) => (
          <span key={s.k} className="inline-flex items-center whitespace-nowrap leading-none">
            <SymbolText k={s.k} vars={s.vars} trim />
          </span>
        ))}
      </div>
    </button>
  );
}

export default function EntityExplorer({ kind, drafts, selectedKey, onSelect, onNew, errorKeys, ctx }) {
  const [view, setView] = useState(BLANK);
  const set = (patch) => setView((v) => ({ ...v, ...patch }));
  const listRef = useRef(null);
  const filtered = JSON.stringify(view) !== JSON.stringify(BLANK);

  const shown = useMemo(() => {
    const words = view.query.toLowerCase().split(/\s+/).filter(Boolean);
    const tag = kind.tags.find((x) => x.id === view.tag);
    const list = drafts
      .map((d, i) => ({ d, i }))
      .filter(({ d }) => {
        const hay = `${d.id} ${d.name} ${d.color ?? ''} ${d.rarity ? t(`rarity.${d.rarity}`) : ''} ${kind.searchText(d)}`.toLowerCase();
        if (!words.every((w) => hay.includes(w))) return false;
        if (tag && !tag.test(d)) return false;
        if (view.color && d.color !== view.color) return false;
        if (view.rarity && d.rarity !== view.rarity) return false;
        if (view.status === 'changed') return isModified(kind, d, ctx);
        if (view.status === 'errors') return errorKeys.has(d.key);
        return true;
      });
    if (view.sort !== 'order') {
      const value =
        view.sort === 'name' ? (d) => d.name.toLowerCase() : view.sort === 'id' ? (d) => d.id : kind.sorts[view.sort].value;
      list.sort((x, y) => compare(value(x.d, ctx), value(y.d, ctx)) || x.i - y.i);
    }
    if (view.desc) list.reverse();
    return list.map((x) => x.d);
  }, [drafts, view, kind, errorKeys, ctx]);

  // Keep the selected row in view (arrow keys, or selected elsewhere).
  useEffect(() => {
    listRef.current?.querySelector(`[data-key="${CSS.escape(selectedKey ?? '')}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [selectedKey, shown]);

  const onKeyDown = (e) => {
    if (e.target.tagName === 'SELECT' || !shown.length) return;
    const i = shown.findIndex((d) => d.key === selectedKey);
    const go = { ArrowDown: i + 1, ArrowUp: i < 0 ? 0 : i - 1, Home: 0, End: shown.length - 1 }[e.key];
    if (go === undefined || (e.target.tagName === 'INPUT' && (e.key === 'Home' || e.key === 'End'))) return;
    e.preventDefault();
    onSelect(shown[Math.max(0, Math.min(shown.length - 1, go))].key);
  };

  const selectClass = `${inputClass} min-w-0`;

  return (
    <div className="flex flex-col gap-2 text-left shrink-0" style={{ width: ADMIN.explorerWidthPx }} onKeyDown={onKeyDown}>
      <div className="flex gap-2">
        <input
          className={`${inputClass} flex-1 min-w-0`}
          type="search"
          placeholder={a('search')}
          value={view.query}
          onChange={(e) => set({ query: e.target.value })}
        />
        <Button primary onClick={onNew}>
          {a('new')}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select className={selectClass} value={view.sort} onChange={(e) => set({ sort: e.target.value })}>
          <option value="order">{a('sortOrder')}</option>
          <option value="name">{a('sortName')}</option>
          <option value="id">{a('sortId')}</option>
          {Object.entries(kind.sorts).map(([id, s]) => (
            <option key={id} value={id}>
              {a(s.label)}
            </option>
          ))}
        </select>
        <select className={selectClass} value={view.desc ? 'desc' : 'asc'} onChange={(e) => set({ desc: e.target.value === 'desc' })}>
          <option value="asc">{a('ascending')}</option>
          <option value="desc">{a('descending')}</option>
        </select>
        <select className={selectClass} value={view.status} onChange={(e) => set({ status: e.target.value })}>
          <option value="all">{a('statusAll')}</option>
          <option value="changed">{a('statusChanged')}</option>
          <option value="errors">{a('statusErrors')}</option>
        </select>
        {kind.hasColor !== false && (
          <select className={selectClass} value={view.color} onChange={(e) => set({ color: e.target.value })}>
            <option value="">{a('anyColor')}</option>
            {PALETTE.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
        {kind.sorts.rarity && (
          <select className={selectClass} value={view.rarity} onChange={(e) => set({ rarity: e.target.value })}>
            <option value="">{a('anyRarity')}</option>
            {RARITY_IDS.map((id) => (
              <option key={id} value={id}>
                {t(`rarity.${id}`)}
              </option>
            ))}
          </select>
        )}
        {kind.tags.length > 0 && (
          <select className={selectClass} value={view.tag} onChange={(e) => set({ tag: e.target.value })}>
            <option value="">{a(kind.tagLabel)}</option>
            {kind.tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.label()}
              </option>
            ))}
          </select>
        )}
        <Button onClick={() => setView(BLANK)} disabled={!filtered}>
          {a('clearFilters')}
        </Button>
      </div>

      <div className="flex justify-between text-slate">
        <span>{a('showing', { n: shown.length, total: drafts.length })}</span>
        <span>{a('listHint')}</span>
      </div>

      <div
        ref={listRef}
        tabIndex={0}
        className="flex flex-col gap-1 p-1 overflow-y-auto rounded-panel border-stroke border-dusk bg-blush"
        style={{ height: ADMIN.explorerHeightPx }}
      >
        {shown.map((d) => (
          <Row
            key={d.key}
            kind={kind}
            draft={d}
            selected={d.key === selectedKey}
            error={errorKeys.has(d.key)}
            onSelect={onSelect}
            ctx={ctx}
          />
        ))}
        {!shown.length && <span className="p-2 text-slate">{a('noMatches')}</span>}
      </div>
    </div>
  );
}
