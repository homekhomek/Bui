# Bui

> **Note to LLMs / AI agents:** Read this file before making any changes to the project, and keep it up to date. This README is **high-level documentation only** — no implementation details, code walkthroughs, or changelogs.

## What it is

Bui is an autobattler web game being made for a game jam.

## Game structure

Two phases:

- **Explore / edit** — the player is walked through choices (in the style of The Bazaar) that grant equipment, banners and other items, then arranges their fighters' inventories (in the style of Backpack Battles: the inventory is the only storage). New nodes are offered floating above the fighter; a node that gets dropped onto moves to the nearest free spot in the inventory, or floats to the fighter's right if there is none. Equipment is offered and dragged the same way: dropping it on a fighter's own column reorders it; new equipment is inserted if there's a free slot, otherwise it replaces that slot's piece. Nodes follow their row's equipment, and any that no longer fit get displaced by the same rule. Anything still floating is destroyed when the next battle starts.
- **Battle** — fully automatic. A battle is simulated headlessly and instantly as a queue of actions, in continuous time (equipment charges nodes at a rate per second; nodes fire at the exact moment they fill); a separate **visual queue** plays those actions back, so battles can be shown at any speed, paused, restarted or skipped.

## Core concepts

- **Fighter** — a unit that holds equipment and nodes. Has a max equipment count (at most 6).
- **Equipment** — square items stacked vertically down the left side of a fighter's inventory. Each has node slots (at most 8): tiles extending to its right. Together these rows form the inventory grid.
- **Node** — a tetris-like piece placed in the inventory grid. While editing, nodes can be placed anywhere they fit; once a battle starts they have left gravity. In battle, equipment charges any node touching it; a fully charged node runs its effects in order, then teleports to the right side and falls back into the queue.
- **Effect** — something a node does, written as a keyword and usually a number (Attack 7, Shield 3). Effects may have an upgrade delta.
- **Upgrading** — dropping a node onto another of the same type and level (if any of its effects has an upgrade delta) consumes the dropped node and raises the other's level; each level adds the upgrade delta to those effects.

## Code layout

- `src/game/` — game rules and the headless battle engine (no React).
- `src/ui/` — React screens and components.
- `public/assets/` — art (SVG), one folder per kind (`effects`, `equipment`, ...). Data entries refer to their art by file name.

## Stack

- React (JavaScript, no TypeScript)
- Tailwind CSS
- Vite

## Project rules

- **`src/data.js`** — all numbers and game data (stats, costs, timings, sizes, unit definitions, etc.). Do not hardcode numeric values or game data elsewhere.
- **`src/translate.js`** — all player-facing strings. Do not hardcode user-visible text in components; add a key and use `t('key')`.
- **Symbols** — charge is never written as a word; strings use `{charge}` (and `{slot}`), drawn as icons. Single stats (charge needed, slots, charge per second) are shown in a **metric display**: a small bordered, padded inline box.
- **Colors** — everything uses only the [Saccharide palette](https://lospec.com/palette-list/saccharide), defined in `src/index.css`. Tailwind's default colors are disabled; never add colors outside the palette.
- **Fonts** — Waloh is the main font (`font-body`), Marker2 is the heading font (`font-heading`). Font files and licenses live in `public/fonts`.
- **Text sizes** — only `text-base` through `text-8xl` exist; their values come from `src/data.js`. Tailwind's default sizes are disabled.
- **Stroke width** — one standard stroke width (2px, `STROKE_PX` in `src/data.js`) for every border, outline and SVG stroke. Use the `border-stroke` class, never `border-2`, `border-4`, etc. The only exceptions are equipment's heavy double border and the upgrade highlight.
- **No shadows** — never use shadows of any kind (box-shadow, text-shadow, drop-shadow filters, etc.). Tailwind's shadow utilities are disabled. Use borders or outlines for emphasis.
- **Layout** — everything is centered on the screen.
- **Tooltips** — one app-wide tooltip system (`src/ui/tooltip`). Anything viewable (nodes, equipment, ...) should have a tooltip; add new tooltip types there rather than using `title` attributes. Tooltips open instantly to the right of the hovered thing and fade out quickly.
- **Interaction** — anything selectable or hoverable shows the pointer cursor. Text selection is off by default (dragging is a core interaction); opt in with `select-text` where needed.
- **Working with an LLM** — before making changes, make sure the dev server (`npm run dev`) is running, and start it in the background if it isn't, so the developer can watch changes live. Tell the developer the local URL.

## Running

```
npm install
npm run dev
```

Build for release with `npm run build`.
