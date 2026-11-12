// Small building blocks shared by the admin screens.

import { useMemo, useState } from 'react';
import { ADMIN, RARITIES, UI } from '../data.js';
import { nodeOutlinePath } from '../ui/nodeOutline.js';
import { SymbolIcon } from '../ui/SymbolText.jsx';
import { useTooltip } from '../ui/tooltip/Tooltip.jsx';
import { equipmentIcon } from '../ui/assets.js';
import { t } from '../translate.js';
import { PALETTE, RARITY_IDS, download } from './entities.js';
import { ART_FOLDERS, ART_NAME, createArt } from './save.js';
import { a } from './strings.js';

export const inputClass = 'rounded-tile border-stroke border-dusk bg-white px-2 select-text';

// Admin text with {charge}-style symbols drawn as icons.
export function Label({ k, vars }) {
  return a(k, vars)
    .split(/\{(\w+)\}/)
    .map((part, i) => (i % 2 ? <SymbolIcon key={i} name={part} /> : part));
}

export function Button({ primary, className = '', ...props }) {
  return (
    <button
      className={`px-4 py-1 rounded-tile disabled:opacity-40 ${primary ? 'bg-rose hover:bg-dusty' : 'bg-haze hover:bg-mist'} ${className}`}
      {...props}
    />
  );
}

// An art template for this entry: Create writes it into the project as
// public/assets/<folder>/<name>.svg (never over an existing file) and calls
// onCreated(name) so the entry can use it; open that file in Boxy SVG, draw,
// and save, and the game shows the art live. Download is the fallback.
// build() returns the template's text.
export function ArtFile({ folder, name, build, onCreated, disabled = false }) {
  const [status, setStatus] = useState(null); // { ok, text }
  const valid = ART_NAME.test(name ?? '');
  const create = async () => {
    try {
      await createArt(folder, name, build());
      setStatus({ ok: true, text: a('artCreated', { file: `${ART_FOLDERS[folder]}/${name}.svg` }) });
      onCreated(name);
    } catch (e) {
      setStatus({ ok: false, text: a('artFailed', { error: e.message }) });
    }
  };
  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex flex-wrap gap-2">
        <Button primary disabled={disabled || !valid} onClick={create}>
          {a('artCreate', { file: `${name || '?'}.svg` })}
        </Button>
        <Button disabled={disabled} onClick={() => download(`${name || folder}-template.svg`, build(), 'image/svg+xml')}>
          {a('artTemplate')}
        </Button>
      </div>
      {status && <span className={status.ok ? 'text-slate select-text' : 'text-plum select-text'}>{status.text}</span>}
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1 text-left">
      <span className="text-slate">{label}</span>
      {children}
    </div>
  );
}

export function TextInput({ value, onChange, className = 'w-48', ...props }) {
  return <input className={`${inputClass} ${className}`} value={value} onChange={(e) => onChange(e.target.value)} {...props} />;
}

export function NumberInput({ value, onChange, className = 'w-28', ...props }) {
  return <TextInput type="number" value={value} onChange={onChange} className={className} {...props} />;
}

function Swatch({ name, selected, onClick }) {
  const tooltip = useTooltip('text', { text: name });
  return (
    <button
      {...tooltip}
      onClick={onClick}
      className={`rounded-tile border-stroke ${selected ? 'border-dusk' : 'border-transparent'}`}
      style={{ width: ADMIN.swatchPx, height: ADMIN.swatchPx, backgroundColor: `var(--color-${name})` }}
    />
  );
}

export function ColorPicker({ value, onChange }) {
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${ADMIN.swatchColumns}, ${ADMIN.swatchPx}px)` }}>
      {PALETTE.map((c) => (
        <Swatch key={c} name={c} selected={value === c} onClick={() => onChange(c)} />
      ))}
    </div>
  );
}

// Pick a rarity (RARITIES), each shown in its badge color.
export function RarityPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {RARITY_IDS.map((id) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`px-3 py-1 rounded-tile border-stroke ${value === id ? 'border-dusk' : 'border-transparent'}`}
          style={{ backgroundColor: `var(--color-${RARITIES[id].color})` }}
        >
          {t(`rarity.${id}`)}
        </button>
      ))}
    </div>
  );
}

// A node's shape drawn small, as one outline, centered in a thumbPx square.
export function NodeThumb({ shape, color, size = ADMIN.thumbPx }) {
  const cols = 1 + Math.max(0, ...shape.map(([x]) => x));
  const rows = 1 + Math.max(0, ...shape.map(([, y]) => y));
  const cell = (size - UI.strokePx) / Math.max(cols, rows, ADMIN.thumbMinTiles);
  const path = useMemo(
    () => (shape.length ? nodeOutlinePath(shape, { cellPx: cell, gapPx: 0, radiusPx: cell / 4 }) : ''),
    [shape, cell]
  );
  return (
    <svg width={size} height={size} className="block shrink-0">
      <g transform={`translate(${(size - cols * cell) / 2} ${(size - rows * cell) / 2})`}>
        <path d={path} fill={`var(--color-${color})`} stroke="var(--color-dusk)" strokeWidth={UI.strokePx} strokeLinejoin="round" />
      </g>
    </svg>
  );
}

// A piece of equipment drawn small.
export function EquipmentThumb({ color, icon, size = ADMIN.thumbPx }) {
  return (
    <div
      className="shrink-0 rounded-tile border-stroke border-dusk"
      style={{ width: size, height: size, backgroundColor: `var(--color-${color})` }}
    >
      {icon && <img src={equipmentIcon(icon)} alt="" draggable={false} className="block w-full h-full" />}
    </div>
  );
}
