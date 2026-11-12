// The particle system: one full-screen canvas (ParticleLayer.jsx) that draws
// every live particle each frame. Anything can start a burst with
// emitParticles(effect, options): effects are defined in PARTICLES.effects
// (data.js). The loop only runs while particles are alive.
//
// Sprites (public/assets/gui/particles) fill with currentColor where their
// color goes and keep their own border; each is drawn once per color and size
// into an offscreen canvas, then copied with drawImage, which keeps hundreds
// of particles cheap. Image flashes draw a
// picture (e.g. a node's art) as it is.

import { INVENTORY, PARTICLES, SPRITE, uiScale } from '../../data.js';
import { guiIcon } from '../assets.js';

let canvas = null;
let ctx = null;
let frame = 0;
let last = 0;
const live = [];

// ---------------------------------------------------------------------------
// Sprites
// ---------------------------------------------------------------------------

// Each sprite's SVG text (fetched once), so it can be drawn in any color: the
// art fills with currentColor where the color goes (its border keeps its own).
const sources = {};
for (const name of PARTICLES.sprites) {
  fetch(guiIcon(`particles/${name}`))
    .then((res) => res.text())
    .then((text) => (sources[name] = text));
}

// A sprite's SVG with currentColor set to `color`, as a loading image.
function coloredImage(name, color) {
  const svg = sources[name].replace('<svg ', `<svg color="${color}" `);
  return Object.assign(new Image(), { src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` });
}

// A sprite's on-screen size at scale 1 (art units -> px, like node art).
const spritePx = () => (PARTICLES.sizeArt * INVENTORY.cellPx) / SPRITE.tileArt;

// Palette name -> its color (from the CSS variables in index.css).
const colors = new Map();
export function paletteColor(name) {
  if (!colors.has(name)) {
    colors.set(name, getComputedStyle(document.documentElement).getPropertyValue(`--color-${name}`).trim());
  }
  return colors.get(name);
}

// One sprite in one color, rendered once at the device's pixel size into an
// offscreen canvas. Null until it's ready (the first frames of a new color).
const tinted = new Map(); // key -> { img, canvas }
function tintedSprite(name, color, px) {
  if (!sources[name]) return null;
  const size = Math.ceil(px * window.devicePixelRatio);
  const key = `${name}|${color}|${size}`;
  let entry = tinted.get(key);
  if (!entry) tinted.set(key, (entry = { img: coloredImage(name, color), canvas: null }));
  if (!entry.canvas && entry.img.complete && entry.img.naturalWidth) {
    entry.canvas = Object.assign(document.createElement('canvas'), { width: size, height: size });
    entry.canvas.getContext('2d').drawImage(entry.img, 0, 0, size, size);
  }
  return entry.canvas;
}

// Pictures for image flashes, by URL (loaded on first use).
const pictures = new Map();
function picture(src) {
  if (!pictures.has(src)) pictures.set(src, Object.assign(new Image(), { src }));
  return pictures.get(src);
}

// ---------------------------------------------------------------------------
// Emitting
// ---------------------------------------------------------------------------

const rand = ([min, max]) => min + Math.random() * (max - min);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

// Start a burst of PARTICLES.effects[effect].
//   at         { x, y } where it is (viewport px)
//   direction  particle bursts: the angle (radians) they fly around (default up)
//   image      image flashes: { src, width, height } the picture and its
//              size in px at scale 1
//   timeScale  speeds time up (battle playback speed)
// Particle visuals are cosmetic: they use Math.random, not the seeded rng.
export function emitParticles(effect, { at, direction = -Math.PI / 2, image, timeScale = 1 } = {}) {
  const fx = PARTICLES.effects[effect];
  if (!canvas || !at) return;
  if (fx.image) {
    if (!image) return;
    live.push({
      picture: picture(image.src),
      width: image.width,
      height: image.height,
      x: at.x,
      y: at.y,
      age: 0,
      life: fx.lifeMs,
      rot: ((Math.random() * 2 - 1) * fx.rotateDeg * Math.PI) / 180,
      spin: 0,
      grow: fx.scale,
      from: at.y,
      rise: (fx.risePx ?? 0) * uiScale(),
      scale: fx.scale[0],
      fadeFrom: fx.fadeFrom,
      alpha: 1,
      timeScale,
    });
  } else {
    // Particle burst: random sprites, all in one color, flying out from `at`.
    const tint = paletteColor(fx.color);
    const s = uiScale();
    for (let i = 0; i < fx.count; i++) {
      const angle = direction + ((Math.random() - 0.5) * fx.spreadDeg * Math.PI) / 180;
      const speed = rand(fx.speed) * s;
      live.push({
        sprite: pick(PARTICLES.sprites),
        color: tint,
        x: at.x,
        y: at.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: fx.gravity * s,
        drag: fx.drag,
        age: 0,
        life: rand(fx.lifeMs),
        rot: Math.random() * Math.PI * 2,
        spin: ((Math.random() * 2 - 1) * fx.spin * Math.PI) / 180,
        scale: rand(fx.scale),
        fadeFrom: fx.fadeFrom,
        alpha: 1,
        timeScale,
      });
    }
  }
  if (live.length > PARTICLES.maxAlive) live.splice(0, live.length - PARTICLES.maxAlive);
  if (!frame) {
    last = performance.now();
    frame = requestAnimationFrame(tick);
  }
}

// ---------------------------------------------------------------------------
// The loop
// ---------------------------------------------------------------------------

const ease = (t) => 1 - (1 - t) ** 3;
const fade = (t, from) => (t < from ? 1 : Math.max(0, 1 - (t - from) / (1 - from)));

function update(p, dtMs) {
  const dt = dtMs * p.timeScale;
  p.age += dt;
  p.rot += (p.spin * dt) / 1000;
  const t = p.age / p.life;
  if (p.picture) {
    // Image flash: grows quickly (easing out) while it fades.
    p.scale = p.grow[0] + (p.grow[1] - p.grow[0]) * ease(Math.min(1, t));
    p.y = p.from - p.rise * ease(Math.min(1, t));
    p.alpha = fade(t, p.fadeFrom);
  } else {
    const sec = dt / 1000;
    p.vy += p.gravity * sec;
    const keep = Math.pow(1 - p.drag, sec);
    p.vx *= keep;
    p.vy *= keep;
    p.x += p.vx * sec;
    p.y += p.vy * sec;
    p.alpha = fade(t, p.fadeFrom);
  }
  return p.age < p.life;
}

function tick(now) {
  const dt = Math.min(now - last, 50); // a hidden tab doesn't jump particles ahead
  last = now;
  const dpr = window.devicePixelRatio;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const base = spritePx();
  for (let i = live.length - 1; i >= 0; i--) {
    const p = live[i];
    if (!update(p, dt)) {
      live.splice(i, 1);
      continue;
    }
    if (p.alpha <= 0) continue;
    let img, w, h;
    if (p.picture) {
      if (!p.picture.complete || !p.picture.naturalWidth) continue;
      [img, w, h] = [p.picture, p.width * p.scale, p.height * p.scale];
    } else {
      w = h = base * p.scale;
      img = tintedSprite(p.sprite, p.color, base); // rendered once at scale 1
      if (!img) continue;
    }
    ctx.globalAlpha = p.alpha;
    ctx.setTransform(dpr, 0, 0, dpr, p.x * dpr, p.y * dpr);
    ctx.rotate(p.rot);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
  }
  ctx.globalAlpha = 1;
  frame = live.length ? requestAnimationFrame(tick) : 0;
  if (!frame) ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ---------------------------------------------------------------------------
// The canvas (ParticleLayer.jsx attaches it)
// ---------------------------------------------------------------------------

export function attachCanvas(el) {
  canvas = el;
  ctx = el?.getContext('2d') ?? null;
  if (el) fitCanvas();
}

export function fitCanvas() {
  if (!canvas) return;
  const dpr = window.devicePixelRatio;
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
}

// Remove every particle (e.g. a battle restarted or skipped).
export function clearParticles() {
  live.length = 0;
}

// The center of an element, in viewport px.
export function centerOf(el) {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}
