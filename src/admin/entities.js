// Admin entity kinds (nodes, equipment, fighter templates, encounters): drafts,
// validation and export. Exports are formatted with Prettier (the project's
// formatter) so they match the hand-edited files exactly.
//
// A draft is the editable form of one data.js entry. Every draft has
//   { key, id, name }  plus its kind's own fields (most also have color).
// Number fields are kept as the strings typed into inputs; kind.toEntry(d, ctx)
// turns a draft into a real data.js entry. ctx = all current drafts
// ({ nodes, equipment, templates }), for kinds that refer to others: fighter
// templates refer to equipment and nodes by draft KEY, so renaming an id carries
// through to every template using it. Exports rewrite the real source
// files (read raw through Vite), replacing only each kind's block in data.js
// and its names in translate.js.
//
// To make another table editable, add a kind to KINDS.

import dataSource from '../data.js?raw';
import translateSource from '../translate.js?raw';
import cssSource from '../index.css?raw';
import * as prettier from 'prettier/standalone';
import * as prettierBabel from 'prettier/plugins/babel';
import * as prettierEstree from 'prettier/plugins/estree';
import { ADMIN, ENCOUNTERS, ENEMIES, EQUIPMENT, FIGHTER_TEMPLATES, KEYWORDS, LIMITS, NODES, RARITIES, RUN } from '../data.js';
import { ENCOUNTER_TYPES } from '../game/encounters.js';
import { cellSet, cellsFit, shapeCells } from '../game/inventory.js';
import { t } from '../translate.js';
import { a } from './strings.js';

// Saccharide palette color names, read from index.css (the one source of colors).
export const PALETTE = [...cssSource.matchAll(/--color-([a-z]+):\s*#/g)].map((m) => m[1]);
// name -> hex, for files exported outside the app (e.g. art templates).
export const PALETTE_HEX = Object.fromEntries([...cssSource.matchAll(/--color-([a-z]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]));

// Equipment art: the file names in public/assets/equipment.
const fileNames = (glob) =>
  Object.keys(glob)
    .map((path) => path.split('/').pop().replace(/\.svg$/, ''))
    .sort();
export const EQUIPMENT_ICONS = fileNames(import.meta.glob('/public/assets/equipment/*.svg'));
// Node art: the file names in public/assets/nodes.
export const NODE_ICONS = fileNames(import.meta.glob('/public/assets/nodes/*.svg'));
// Fighter sprites: the file names in public/assets/fighters.
export const FIGHTER_SPRITES = fileNames(import.meta.glob('/public/assets/fighters/*.svg'));

export const num = (s) => (String(s ?? '').trim() === '' ? NaN : Number(s));
export const str = (v) => (v === undefined ? '' : String(v));

let nextKey = 0;
export const newKey = () => `draft${Date.now()}-${nextKey++}`;

export function uniqueId(base, drafts) {
  let id = base;
  for (let i = 2; drafts.some((d) => d.id === id); i++) id = `${base}${i}`;
  return id;
}

// Shift a shape to the top-left corner; tiles ordered row by row.
export function normalizeShape(shape) {
  if (!shape.length) return [];
  const minX = Math.min(...shape.map(([x]) => x));
  const minY = Math.min(...shape.map(([, y]) => y));
  return shape.map(([x, y]) => [x - minX, y - minY]).sort((p, q) => p[1] - q[1] || p[0] - q[0]);
}

const quote = (s) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const literal = (v) => (typeof v === 'string' ? quote(v) : String(v));
const inlineObject = (o) => `{ ${Object.entries(o).map(([k, v]) => `${k}: ${literal(v)}`).join(', ')} }`;

// The draft a template reference points at: by key, else (for references
// loaded as ids) by id. undefined if it no longer exists.
// Rarity ids, most common first; new entries start as the first.
export const RARITY_IDS = Object.keys(RARITIES);
const rarityRank = (d) => (RARITY_IDS.includes(d.rarity) ? RARITY_IDS.indexOf(d.rarity) : NaN);
const checkRarity = (d, err) => RARITY_IDS.includes(d.rarity) || err('errRarity', { rarity: d.rarity || '?' });

export const resolve = (list, ref) => list.find((d) => d.key === ref) ?? list.find((d) => d.id === ref);

// ---------------------------------------------------------------------------
// Nodes
// ---------------------------------------------------------------------------

const nodes = {
  id: 'nodes',
  dataName: 'NODES',
  prefix: 'node',
  section: '// Nodes',
  data: NODES,
  tab: 'tabNodes',

  fromData: (n) => ({
    key: n.id,
    id: n.id,
    name: t(`node.${n.id}`),
    color: n.color,
    rarity: n.rarity,
    maxCharge: str(n.maxCharge),
    shape: n.shape.map(([x, y]) => [x, y]),
    icon: n.icon ?? '',
    effects: n.effects.map((e) => ({ keyword: e.keyword, value: str(e.value), upgradeDelta: str(e.upgradeDelta) })),
  }),

  newDraft: (drafts) => {
    const { newNode } = ADMIN;
    return {
      key: newKey(),
      id: uniqueId('node', drafts),
      name: a('newNodeName'),
      color: newNode.color,
      rarity: RARITY_IDS[0],
      maxCharge: str(newNode.maxCharge),
      shape: [[0, 0]],
      icon: '',
      effects: [{ keyword: newNode.effect.keyword, value: str(newNode.effect.value), upgradeDelta: str(newNode.effect.upgradeDelta) }],
    };
  },

  toEntry: (d) => ({
    id: d.id,
    shape: normalizeShape(d.shape),
    maxCharge: num(d.maxCharge),
    color: d.color,
    rarity: d.rarity,
    ...(d.icon ? { icon: d.icon } : {}),
    effects: d.effects.map((e) => {
      const out = { keyword: e.keyword, value: num(e.value) };
      if (str(e.upgradeDelta).trim() !== '') out.upgradeDelta = num(e.upgradeDelta);
      return out;
    }),
  }),

  // One NODES entry, in the same style as the hand-written ones.
  literal: (n) => {
    const shape = `[${n.shape.map(([x, y]) => `[${x}, ${y}]`).join(', ')}]`;
    const effects =
      n.effects.length <= 1
        ? `[${n.effects.map(inlineObject).join('')}]`
        : `[\n${n.effects.map((e) => `      ${inlineObject(e)},`).join('\n')}\n    ]`;
    return [
      `  ${n.id}: {`,
      `    id: ${quote(n.id)},`,
      `    shape: ${shape},`,
      `    maxCharge: ${n.maxCharge},`,
      `    color: ${quote(n.color)},`,
      `    rarity: ${quote(n.rarity)},`,
      ...(n.icon ? [`    icon: ${quote(n.icon)},`] : []),
      `    effects: ${effects},`,
      `  },`,
    ].join('\n');
  },

  validate: (d, err) => {
    const n = nodes.toEntry(d);
    checkRarity(d, err);
    if (!n.shape.length) err('errShape');
    if (!(n.maxCharge > 0)) err('errCharge');
    if (n.icon && !NODE_ICONS.includes(n.icon)) err('errNodeIcon', { icon: n.icon });
    n.effects.forEach((e, i) => {
      if (!Number.isFinite(e.value) || ('upgradeDelta' in e && !Number.isFinite(e.upgradeDelta))) err('errEffect', { n: i + 1 });
    });
  },

  // Explorer
  searchText: (d) => `${d.icon ?? ''} ${d.effects.map((e) => t(`effect.${e.keyword}`)).join(' ')}`,
  sorts: {
    rarity: { label: 'sortRarity', value: rarityRank },
    charge: { label: 'sortCharge', value: (d) => num(d.maxCharge) },
    tiles: { label: 'sortTiles', value: (d) => d.shape.length },
    effects: { label: 'sortEffects', value: (d) => d.effects.length },
  },
  tagLabel: 'anyEffect',
  tags: Object.keys(KEYWORDS).map((k) => ({
    id: k,
    label: () => t(`effect.${k}`),
    test: (d) => d.effects.some((e) => e.keyword === k),
  })),
  stats: (d) => [{ k: 'metricCharge', vars: { n: d.maxCharge } }],
};

// ---------------------------------------------------------------------------
// Equipment
// ---------------------------------------------------------------------------

const equipment = {
  id: 'equipment',
  dataName: 'EQUIPMENT',
  prefix: 'equipment',
  section: '// Equipment',
  data: EQUIPMENT,
  tab: 'tabEquipment',

  fromData: (e) => ({
    key: e.id,
    id: e.id,
    name: t(`equipment.${e.id}`),
    color: e.color,
    nodeSlots: str(e.nodeSlots),
    chargeRate: str(e.chargeRate),
    hp: str(e.hp),
    rarity: e.rarity,
    icon: e.icon ?? '',
  }),

  newDraft: (drafts) => {
    const { newEquipment: n } = ADMIN;
    return {
      key: newKey(),
      id: uniqueId('equipment', drafts),
      name: a('newEquipmentName'),
      color: n.color,
      nodeSlots: str(n.nodeSlots),
      chargeRate: str(n.chargeRate),
      hp: str(n.hp),
      rarity: RARITY_IDS[0],
      icon: '',
    };
  },

  toEntry: (d) => {
    const out = { id: d.id, nodeSlots: num(d.nodeSlots), chargeRate: num(d.chargeRate), hp: num(d.hp), color: d.color, rarity: d.rarity };
    if (d.icon) out.icon = d.icon;
    return out;
  },

  literal: (e) => `  ${e.id}: ${inlineObject(e)},`,

  validate: (d, err) => {
    const e = equipment.toEntry(d);
    checkRarity(d, err);
    if (!Number.isInteger(e.nodeSlots) || e.nodeSlots < 1 || e.nodeSlots > LIMITS.maxNodeSlots) {
      err('errSlots', { max: LIMITS.maxNodeSlots });
    }
    if (!(e.chargeRate >= 0)) err('errRate');
    if (!Number.isFinite(e.hp)) err('errHp');
    if (e.icon && !EQUIPMENT_ICONS.includes(e.icon)) err('errIcon', { icon: e.icon });
  },

  searchText: (d) => d.icon,
  sorts: {
    rarity: { label: 'sortRarity', value: rarityRank },
    slots: { label: 'sortSlots', value: (d) => num(d.nodeSlots) },
    rate: { label: 'sortRate', value: (d) => num(d.chargeRate) },
    hp: { label: 'sortHp', value: (d) => num(d.hp) },
  },
  tagLabel: 'anyArt',
  tags: [
    { id: 'art', label: () => a('tagHasArt'), test: (d) => Boolean(d.icon) },
    { id: 'noArt', label: () => a('tagNoArt'), test: (d) => !d.icon },
  ],
  stats: (d) => [
    { k: 'metricSlots', vars: { n: d.nodeSlots } },
    { k: 'metricChargeRate', vars: { n: d.chargeRate } },
    { k: 'metricHp', vars: { n: d.hp } },
  ],
};

// ---------------------------------------------------------------------------
// Fighter templates
// ---------------------------------------------------------------------------

// Template ids the game refers to (not editable here yet), which must keep existing.
const templateUsers = () => [
  ...RUN.startingTeam.map((id) => ({ id, user: 'RUN.startingTeam' })),
  ...Object.values(ENEMIES).flatMap((e) => e.fighters.map((id) => ({ id, user: `ENEMIES.${e.id}` }))),
];

// A starting node's level as a number ('' = the default, 1).
export const nodeLevel = (n) => (str(n.level).trim() === '' ? 1 : num(n.level));

// Cells a template's starting node covers, or [] if its node no longer exists.
export function templateNodeCells(n, ctx) {
  const nd = resolve(ctx.nodes, n.node);
  return nd ? shapeCells(normalizeShape(nd.shape), n.x, n.y) : [];
}

// Row widths of a template's inventory (0 for deleted equipment).
export const templateWidths = (d, ctx) =>
  d.equipment.map((ref) => {
    const e = resolve(ctx.equipment, ref);
    return e ? Math.max(0, Math.floor(num(e.nodeSlots)) || 0) : 0;
  });

// Max HP the fighter starts with: base HP + its equipment's hp (as game/fighter.js).
export function templateHp(d, ctx) {
  const max = Math.floor(num(d.maxEquipment)) || 0;
  return d.equipment
    .slice(0, max)
    .reduce((sum, ref) => sum + (num(resolve(ctx.equipment, ref)?.hp) || 0), num(d.baseHp) || 0);
}

const templates = {
  id: 'templates',
  dataName: 'FIGHTER_TEMPLATES',
  prefix: 'fighter',
  section: '// Fighters',
  data: FIGHTER_TEMPLATES,
  tab: 'tabTemplates',
  hasColor: false,

  fromData: (f) => ({
    key: f.id,
    id: f.id,
    name: t(`fighter.${f.id}`),
    sprite: f.sprite,
    baseHp: str(f.baseHp),
    maxEquipment: str(f.maxEquipment),
    equipment: [...f.equipment], // equipment draft keys (= ids for data.js entries)
    nodes: f.nodes.map((n) => ({ node: n.node, x: n.x, y: n.y, level: str(n.level) })), // node = node draft key
  }),

  newDraft: (drafts, ctx) => ({
    key: newKey(),
    id: uniqueId('fighter', drafts),
    name: a('newTemplateName'),
    sprite: FIGHTER_SPRITES[0] ?? '',
    baseHp: str(ADMIN.newTemplate.baseHp),
    maxEquipment: str(ADMIN.newTemplate.maxEquipment),
    equipment: ctx.equipment.length ? [ctx.equipment[0].key] : [],
    nodes: [],
  }),

  toEntry: (d, ctx) => ({
    id: d.id,
    sprite: d.sprite,
    baseHp: num(d.baseHp),
    maxEquipment: num(d.maxEquipment),
    equipment: d.equipment.map((ref) => resolve(ctx.equipment, ref)?.id ?? ref),
    nodes: d.nodes.map((n) => {
      const out = { node: resolve(ctx.nodes, n.node)?.id ?? n.node, x: n.x, y: n.y };
      if (str(n.level).trim() !== '') out.level = num(n.level);
      return out;
    }),
  }),

  literal: (f) => {
    const nodeList = f.nodes.length ? `[\n${f.nodes.map((n) => `      ${inlineObject(n)},`).join('\n')}\n    ]` : '[]';
    return [
      `  ${f.id}: {`,
      `    id: ${quote(f.id)},`,
      `    sprite: ${quote(f.sprite)},`,
      `    baseHp: ${f.baseHp},`,
      `    maxEquipment: ${f.maxEquipment},`,
      `    equipment: [${f.equipment.map(quote).join(', ')}],`,
      `    nodes: ${nodeList},`,
      `  },`,
    ].join('\n');
  },

  validate: (d, err, ctx) => {
    const f = templates.toEntry(d, ctx);
    if (!FIGHTER_SPRITES.includes(d.sprite)) err('errSprite', { sprite: d.sprite || '?' });
    if (!Number.isFinite(f.baseHp)) err('errBaseHp');
    const maxOk = Number.isInteger(f.maxEquipment) && f.maxEquipment >= 1 && f.maxEquipment <= LIMITS.maxEquipment;
    if (!maxOk) err('errMaxEquipment', { max: LIMITS.maxEquipment });
    if (!d.equipment.length) err('errNoEquipment');
    if (maxOk && d.equipment.length > f.maxEquipment) err('errTemplateEquipment', { max: f.maxEquipment });
    d.equipment.forEach((ref, i) => resolve(ctx.equipment, ref) || err('errRefEquipment', { n: i + 1 }));
    const widths = templateWidths(d, ctx);
    const taken = new Set();
    d.nodes.forEach((n, i) => {
      const nd = resolve(ctx.nodes, n.node);
      if (!nd) return err('errRefNode', { n: i + 1 });
      const level = nodeLevel(n);
      if (!Number.isInteger(level) || level < 1) err('errLevel', { n: i + 1 });
      const cells = templateNodeCells(n, ctx);
      if (!cellsFit(widths, cells, taken)) err('errTemplateNode', { node: nd.id, x: n.x, y: n.y });
      for (const k of cellSet(cells)) taken.add(k);
    });
  },

  usedBy: templateUsers,

  searchText: (d) => d.sprite,
  sorts: {
    hp: { label: 'sortTotalHp', value: (d, ctx) => templateHp(d, ctx) },
    maxEquipment: { label: 'sortMaxEquipment', value: (d) => num(d.maxEquipment) },
    nodes: { label: 'sortNodes', value: (d) => d.nodes.length },
  },
  tagLabel: 'anyRole',
  tags: [
    { id: 'start', label: () => a('tagStart'), test: (d) => RUN.startingTeam.includes(d.id) },
    { id: 'enemy', label: () => a('tagEnemy'), test: (d) => Object.values(ENEMIES).some((e) => e.fighters.includes(d.id)) },
  ],
  stats: (d, ctx) => [{ k: 'metricHp', vars: { n: templateHp(d, ctx) } }],
};

// ---------------------------------------------------------------------------
// Encounters (text, rarity, type and params; the type's code is in
// game/encounters.js and not editable here)
// ---------------------------------------------------------------------------

const paramSpecs = (type) => ENCOUNTER_TYPES[type]?.params ?? {};

const effectToDraft = (e) => ({ keyword: e.keyword, value: str(e.value), upgradeDelta: str(e.upgradeDelta) });
const effectToEntry = (e) => {
  const out = { keyword: e.keyword, value: num(e.value) };
  if (str(e.upgradeDelta).trim() !== '') out.upgradeDelta = num(e.upgradeDelta);
  return out;
};

// One param, data.js value <-> editable draft value (by its kind).
const paramToDraft = (spec, v) =>
  spec?.kind === 'number' ? str(v) : spec?.kind === 'effect' ? effectToDraft(v) : v;
const paramToEntry = (spec, v) =>
  spec?.kind === 'number' ? num(v) : spec?.kind === 'effect' ? effectToEntry(v) : v;

// A type's params at their defaults, as draft values.
export const defaultParams = (type) =>
  Object.fromEntries(Object.entries(paramSpecs(type)).map(([k, spec]) => [k, paramToDraft(spec, spec.default)]));

const objectLiteral = (o) =>
  `{ ${Object.entries(o)
    .map(([k, v]) => `${k}: ${v && typeof v === 'object' ? objectLiteral(v) : literal(v)}`)
    .join(', ')} }`;

const encounters = {
  id: 'encounters',
  dataName: 'ENCOUNTERS',
  section: '// Encounters',
  // Each encounter has three texts in translate.js.
  texts: [
    { field: 'name', prefix: 'encounter' },
    { field: 'description', prefix: 'encounterTip' },
    { field: 'action', prefix: 'encounterAction' },
  ],
  data: ENCOUNTERS,
  tab: 'tabEncounters',
  hasColor: false,

  fromData: (e) => ({
    key: e.id,
    id: e.id,
    name: t(`encounter.${e.id}`),
    description: t(`encounterTip.${e.id}`),
    action: t(`encounterAction.${e.id}`),
    rarity: e.rarity,
    type: e.type,
    params: Object.fromEntries(Object.entries(e.params ?? {}).map(([k, v]) => [k, paramToDraft(paramSpecs(e.type)[k], v)])),
  }),

  newDraft: (drafts) => {
    const type = Object.keys(ENCOUNTER_TYPES)[0];
    return {
      key: newKey(),
      id: uniqueId('encounter', drafts),
      name: a('newEncounterName'),
      description: '',
      action: a('newEncounterAction'),
      rarity: RARITY_IDS[0],
      type,
      params: defaultParams(type),
    };
  },

  toEntry: (d) => ({
    id: d.id,
    type: d.type,
    rarity: d.rarity,
    params: Object.fromEntries(Object.entries(d.params ?? {}).map(([k, v]) => [k, paramToEntry(paramSpecs(d.type)[k], v)])),
  }),

  literal: (e) =>
    [
      `  ${e.id}: {`,
      `    id: ${quote(e.id)},`,
      `    type: ${quote(e.type)},`,
      `    rarity: ${quote(e.rarity)},`,
      `    params: ${objectLiteral(e.params)},`,
      `  },`,
    ].join('\n'),

  validate: (d, err) => {
    checkRarity(d, err);
    if (!ENCOUNTER_TYPES[d.type]) return err('errType', { type: d.type || '?' });
    if (!d.description.trim()) err('errDescription');
    if (!d.action.trim()) err('errAction');
    for (const [k, spec] of Object.entries(paramSpecs(d.type))) {
      const v = paramToEntry(spec, d.params?.[k]);
      const ok =
        spec.kind === 'number'
          ? Number.isInteger(v) && v >= (spec.min ?? 0)
          : spec.kind === 'rarity'
            ? RARITY_IDS.includes(v)
            : KEYWORDS[v?.keyword] && Number.isFinite(v.value) && (!('upgradeDelta' in v) || Number.isFinite(v.upgradeDelta));
      if (!ok) err('errParam', { param: k });
    }
  },

  searchText: (d) => `${d.type} ${d.description}`,
  sorts: {
    rarity: { label: 'sortRarity', value: rarityRank },
    type: { label: 'sortType', value: (d) => d.type },
  },
  tagLabel: 'anyType',
  tags: Object.keys(ENCOUNTER_TYPES).map((type) => ({ id: type, label: () => type, test: (d) => d.type === type })),
  stats: (d) => [{ k: `rarity.${d.rarity}`, vars: {} }],
};

export const KINDS = { nodes, equipment, templates, encounters };

// ---------------------------------------------------------------------------
// All kinds together. drafts = { nodes: [draft], equipment: [draft] }
// ---------------------------------------------------------------------------

export function draftsFromData() {
  return Object.fromEntries(Object.values(KINDS).map((k) => [k.id, Object.values(k.data).map(k.fromData)]));
}

// A kind's texts in translate.js: { field, prefix } -> '<prefix>.<id>'. Most
// kinds have just a name.
export const textsOf = (kind) => kind.texts ?? [{ field: 'name', prefix: kind.prefix }];

// Does this draft differ from its entry in data.js / translate.js?
export function isModified(kind, d, ctx) {
  const orig = kind.data[d.id];
  if (!orig || d.key !== d.id) return true;
  const same = JSON.stringify(kind.toEntry(d, ctx)) === JSON.stringify(kind.toEntry(kind.fromData(orig), ctx));
  return !same || textsOf(kind).some(({ field, prefix }) => d[field] !== t(`${prefix}.${d.id}`));
}

export function isKindUnchanged(kind, list, ctx) {
  const ids = Object.keys(kind.data);
  return list.length === ids.length && list.every((d, i) => d.id === ids[i] && !isModified(kind, d, ctx));
}

export const isAllUnchanged = (drafts) => Object.values(KINDS).every((k) => isKindUnchanged(k, drafts[k.id], drafts));

// Problems that block export: [{ kind, key?, text }]
export function validateAll(drafts) {
  const errors = [];
  for (const kind of Object.values(KINDS)) {
    const seen = new Set();
    for (const d of drafts[kind.id]) {
      const err = (k, vars = {}) => errors.push({ kind: kind.id, key: d.key, text: a(k, { name: d.id || d.name || '?', ...vars }) });
      if (!/^[a-z][a-zA-Z0-9]*$/.test(d.id)) err('errId');
      else if (seen.has(d.id)) err('errDuplicate');
      seen.add(d.id);
      if (!d.name.trim()) err('errName');
      kind.validate(d, err, drafts);
    }
    for (const { id, user } of kind.usedBy?.() ?? []) {
      if (!seen.has(id)) errors.push({ kind: kind.id, text: a('errMissing', { name: id, user, table: kind.dataName }) });
    }
  }
  return errors;
}

const eolOf = (src) => (src.includes('\r\n') ? '\r\n' : '\n');

// Replace the object literal of `export const <name> = { ... };` in source.
function replaceObject(source, name, body) {
  const start = source.indexOf(`export const ${name} = {`);
  if (start < 0) throw new Error(`export const ${name} not found`);
  let i = source.indexOf('{', start);
  for (let depth = 0; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) break;
  }
  return source.slice(0, start) + `export const ${name} = ${body.replace(/\n/g, eolOf(source))}` + source.slice(i + 1);
}

// Format a source file the way the project does (Prettier defaults), keeping
// its line endings.
const format = (src, eol) =>
  prettier.format(src, { parser: 'babel', plugins: [prettierBabel, prettierEstree], endOfLine: eol === '\r\n' ? 'crlf' : 'lf' });

// data.js as it is now, with every kind's block replaced by its drafts.
// (Comments inside a replaced block are not kept.)
export function buildDataJs(drafts) {
  const src = Object.values(KINDS).reduce(
    (out, k) => replaceObject(out, k.dataName, `{\n${drafts[k.id].map((d) => k.literal(k.toEntry(d, drafts))).join('\n')}\n}`),
    dataSource
  );
  return format(src, eolOf(dataSource));
}

// translate.js as it is now, with every kind's texts replaced by its drafts'.
// Each kind's texts go right after its section comment (e.g. "// Nodes").
export function buildTranslateJs(drafts) {
  let lines = translateSource.split(/\r?\n/);
  for (const k of Object.values(KINDS)) {
    const texts = textsOf(k);
    const own = new RegExp(`^\\s*['"](${texts.map((x) => x.prefix).join('|')})\\.\\w+['"]:`);
    // Drop this kind's entries; Prettier puts a long one's value on the next
    // line (key line ends with ':'), so drop that line too.
    lines = lines.filter((l, i) => !own.test(l) && !(own.test(lines[i - 1] ?? '') && lines[i - 1].trimEnd().endsWith(':')));
    let at = lines.findIndex((l) => l.trim().startsWith(k.section));
    if (at < 0) throw new Error(`"${k.section}" section not found in translate.js`);
    while (lines[at + 1]?.trim().startsWith('//')) at++; // past the whole comment
    lines.splice(
      at + 1,
      0,
      ...drafts[k.id].flatMap((d) => texts.map(({ field, prefix }) => `    '${prefix}.${d.id}': ${quote(d[field].trim())},`))
    );
  }
  return format(lines.join('\n'), eolOf(translateSource));
}

export function download(fileName, text, type = 'text/javascript') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = Object.assign(document.createElement('a'), { href: url, download: fileName });
  link.click();
  URL.revokeObjectURL(url);
}
