# Bui

> **Note to LLMs / AI agents:** Read this file before making any changes to the project, and keep it up to date. This README is **high-level documentation only** — no implementation details, code walkthroughs, or changelogs.

## What it is

Bui is an autobattler web game being made for a game jam.

## Stack

- React (JavaScript, no TypeScript)
- Tailwind CSS
- Vite

## Project rules

- **`src/data.js`** — all numbers and game data (stats, costs, timings, sizes, unit definitions, etc.). Do not hardcode numeric values or game data elsewhere.
- **`src/translate.js`** — all player-facing strings. Do not hardcode user-visible text in components; add a key and use `t('key')`.
- **Colors** — everything uses only the [Saccharide palette](https://lospec.com/palette-list/saccharide), defined in `src/index.css`. Tailwind's default colors are disabled; never add colors outside the palette.
- **Fonts** — Waloh is the main font (`font-body`), Marker2 is the heading font (`font-heading`). Font files and licenses live in `public/fonts`.
- **Text sizes** — only `text-base` through `text-8xl` exist; their values come from `src/data.js`. Tailwind's default sizes are disabled.
- **Layout** — everything is centered on the screen.
- **Working with an LLM** — before making changes, make sure the dev server (`npm run dev`) is running, and start it in the background if it isn't, so the developer can watch changes live. Tell the developer the local URL.

## Running

```
npm install
npm run dev
```

Build for release with `npm run build`.
