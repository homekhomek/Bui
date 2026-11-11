// All randomness goes through here. Never use Math.random() anywhere else.
//
// Seeds are strings. A run gets one seed (randomSeed() is the ONLY place real
// entropy enters the game); everything random in that run comes from seeds
// derived from it by name:
//
//   const rng = createRng(deriveSeed(run.seed, 'offer', stage));
//   rng.pick(list)
//
// Deriving by name (rather than drawing from one shared stream) means each
// roll depends only on the run seed and what it is for, so the same seed always
// gives the same run, no matter how often a screen re-renders or in what order
// things are rolled. Derived seeds stay readable, e.g. "k3x9q2m1/battle/4".

import { RUN } from '../data.js';

const SEED_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

// A fresh random run seed. The one non-deterministic source in the game.
export function randomSeed() {
  const bytes = crypto.getRandomValues(new Uint8Array(RUN.seedLength));
  return Array.from(bytes, (b) => SEED_ALPHABET[b % SEED_ALPHABET.length]).join('');
}

// A child seed for one purpose, e.g. deriveSeed(runSeed, 'battle', 3).
export const deriveSeed = (seed, ...parts) => [seed, ...parts].join('/');

// cyrb128: hashes a string into four 32-bit words to seed sfc32.
// (The constants below are part of the algorithms, not game data.)
function cyrb128(str) {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0; i < str.length; i++) {
    const k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

// sfc32: small, fast, good-quality PRNG. Returns floats in [0, 1).
function sfc32(a, b, c, d) {
  return () => {
    a |= 0;
    b |= 0;
    c |= 0;
    d |= 0;
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

// A seeded random number generator. Same seed, same sequence.
export function createRng(seed) {
  const next = sfc32(...cyrb128(String(seed)));
  const rng = {
    seed,
    float: next, // [0, 1)
    int: (min, max) => min + Math.floor(next() * (max - min + 1)), // inclusive
    chance: (p) => next() < p,
    pick: (list) => list[Math.floor(next() * list.length)],
    pickKey: (obj) => rng.pick(Object.keys(obj)),
    // One item, each as likely as weightOf(item) relative to the rest.
    weighted: (list, weightOf) => {
      const total = list.reduce((sum, item) => sum + weightOf(item), 0);
      let roll = next() * total;
      for (const item of list) {
        roll -= weightOf(item);
        if (roll < 0) return item;
      }
      return list[list.length - 1];
    },
    shuffle: (list) => {
      const out = [...list];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
  };
  return rng;
}
