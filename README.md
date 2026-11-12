# Bui

> **Note to LLMs / AI agents:** Read this file before making any changes to the project, and keep it up to date. This README is **high-level documentation only** — no implementation details, code walkthroughs, or changelogs.

## What it is

Bui is an autobattler web game being made for a game jam.

## Game structure

Two phases:

- **Explore / edit** — between battles the player goes through **encounters** (in the style of The Bazaar): each is a choice between floating encounter cards; the picked one is then interacted with. Encounters that give things show them right away, with how many are left to take; whatever isn't taken is lost when the encounter ends. Others act through a button, some after a node is dragged into them (e.g. to upgrade it). Meanwhile the player arranges their fighters' inventories (in the style of Backpack Battles: the inventory is the only storage). Things gained float above the fighter; a node that gets dropped onto moves to the nearest free spot in the inventory, or floats to the fighter's right if there is none. Equipment is offered and dragged the same way: dropping it on a fighter's own column reorders it; new equipment is inserted if there's a free slot, otherwise it replaces that slot's piece. Nodes follow their row's equipment, and any that no longer fit get displaced by the same rule. Anything still floating is destroyed when the next battle starts.
- **Battle** — fully automatic. A battle is simulated headlessly and instantly as a queue of actions, in continuous time (equipment charges nodes at a rate per second; nodes fire at the exact moment they fill); a separate **visual queue** plays those actions back, so battles can be shown at any speed, paused, restarted or skipped.

## Core concepts

- **Fighter** — a unit that holds equipment and nodes. Every fighter comes from a **fighter template** (there is no separate fighter list): its sprite, base HP, max equipment count (at most 6), and starting equipment and nodes. Templates are the building blocks for starting builds and enemies. Max HP is the base HP plus the HP of each equipped piece. During a run a fighter's max equipment can grow.
- **Sprite** — each fighter's art: a 350×350 SVG on which a node tile is 70×70, scaled so its tiles match the inventory's. The body fills the bottom-middle 210×210; the rest is room for overflow details. Sprites face right; fighters on the right side of a battle are mirrored to face left.
- **Enemy** — a team made of fighter templates that a battle is fought against. Some are **bosses**.
- **Run** — one playthrough: 9 battles, where every 3rd (3, 6, 9) is against a boss. Between two battles come 2 encounters. Losing a battle ends the run; winning the last wins it. Every run has a **seed**, and all of its randomness (enemies, encounter choices, loot, battles) is derived from it, so a seed replays the same run. `?seed=...` in the URL starts a run with that seed.
- **Encounter** — a choice between two encounter cards, then the picked one is done. Encounters have rarities (rarer = offered less often); the first encounter after a boss always offers a rare one. Each encounter is data (text, rarity, params) on top of an **encounter type** in code (`src/game/encounters.js`), so new encounters that work like existing ones are just data; new kinds of encounter are a new type.
- **Effect** — something a node does, written as a keyword and usually a number (Attack 7, Shield 3). Effects may have an upgrade delta. Some effects boost another keyword on the same node for the rest of the battle (Strengthen adds to its Attacks). A single node can gain extra effects on top of its type's (e.g. from an encounter).
- **Status counter** — stacks a fighter carries during a battle (battle only; everyone starts each battle with none), shown as the status's icon with its count. Effects can grant them. The first is **shield**: each counter blocks 1 damage and is used up doing so.
- **Rarity** — every node, piece of equipment and encounter is common, uncommon or rare. Random picks roll a rarity by weight first (rarer = less often), then something of that rarity.
- **Upgrading** — dropping a node onto another of the same type and level (if any of its effects has an upgrade delta) consumes the dropped node and raises the other's level; each level adds the upgrade delta to those effects.

## Code layout

- `src/game/` — game rules and the headless battle engine (no React).
- `src/ui/` — React screens and components.
- `src/admin/` — the admin dashboard (dev tool, see below).
- `public/assets/` — art (SVG), one folder per kind (`effects`, `equipment`, ...). Data entries refer to their art by file name.

## Admin dashboard

A developer-only dashboard at `#admin` on the dev server (e.g. `http://localhost:5173/#admin`). It is never part of player builds. It edits and creates game data — currently nodes (shapes up to 8×8), equipment, fighter templates (starting equipment and nodes placed on the inventory grid) and encounters (text, rarity, type and params; what a type does stays in code) — with live previews. **Save** writes updated `src/data.js` and `src/translate.js` (for names) straight into the project through the dev server, and the game hot-reloads; both files can also be downloaded instead. For drawing node art, the node editor exports an SVG template of the node at art scale (70×70 tiles, the in-game gap scaled to match), with the band the in-game border covers marked (art stays inside it) and squares on the tiles in its bounding box that it doesn't use. Each kind of data has an explorer (search, filters, sorting, keyboard browsing) built to stay usable with hundreds of entries; new kinds are added in `src/admin/entities.js`. Admin-only text lives in `src/admin/strings.js`, not `translate.js`.

## Stack

- React (JavaScript, no TypeScript)
- Tailwind CSS
- Vite

## Project rules

- **`src/data.js`** — all numbers and game data (stats, costs, timings, sizes, unit definitions, etc.). Do not hardcode numeric values or game data elsewhere.
- **Formatting** — the project is formatted with Prettier (defaults). The admin dashboard's exports of `data.js` and `translate.js` are Prettier-formatted to match.
- **`src/translate.js`** — all player-facing strings. Do not hardcode user-visible text in components; add a key and use `t('key')`.
- **Symbols** — charge and HP are never written as words; strings use `{charge}`, `{hp}` (and `{slot}`), drawn as icons. Single stats (charge needed, slots, charge per second) are shown in a **metric display**: a small bordered, padded inline box.
- **Colors** — everything uses only the [Saccharide palette](https://lospec.com/palette-list/saccharide), defined in `src/index.css`. Tailwind's default colors are disabled; never add colors outside the palette.
- **Fonts** — Waloh is the main font (`font-body`), Marker2 is the heading font (`font-heading`). Font files and licenses live in `public/fonts`.
- **Text sizes** — only `text-base` through `text-8xl` exist; their values come from `src/data.js`. Tailwind's default sizes are disabled.
- **Stroke width** — one standard stroke width (3px, `STROKE_PX` in `src/data.js`) for every border, outline and SVG stroke. Use the `border-stroke` class, never `border-2`, `border-4`, etc. The only exceptions are equipment's heavy double border, the upgrade highlight and the selection border.
- **No shadows** — never use shadows of any kind (box-shadow, text-shadow, drop-shadow filters, etc.). Tailwind's shadow utilities are disabled. Use borders or outlines for emphasis.
- **Layout** — everything is centered on the screen.
- **Tooltips** — one app-wide tooltip system (`src/ui/tooltip`). Anything viewable (nodes, equipment, ...) should have a tooltip; add new tooltip types there rather than using `title` attributes. Tooltips open instantly to the right of the hovered thing and fade out quickly. Clicking a node or piece of equipment (in explore and battle) **selects** it: a border snaps onto it and its tooltip stays pinned open, where its effects and metrics can be hovered for more detail. Pressing anywhere else unselects. Anything shown inside a tooltip that could use explaining (effects, metrics) should get its own tooltip; rarity badges are the exception and have none. These explanations are number-agnostic: they say what the stat does, not its current value.
- **Randomness** — never use `Math.random()`. All randomness goes through `src/game/random.js`: derive a seed from the run seed (or a battle's seed) for the purpose, and draw from a generator made from it.
- **Interaction** — anything selectable or hoverable shows the pointer cursor. Text selection is off by default (dragging is a core interaction); opt in with `select-text` where needed.
- **Working with an LLM** — before making changes, make sure the dev server (`npm run dev`) is running, and start it in the background if it isn't, so the developer can watch changes live. Tell the developer the local URL.

## Running

```
npm install
npm run dev
```

Build for release with `npm run build`.
