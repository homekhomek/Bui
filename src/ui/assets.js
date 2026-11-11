// URLs for art in public/assets. Goes through Vite's base URL so builds served
// from a subfolder (e.g. a jam page) still find their files.

const base = import.meta.env.BASE_URL;

export const effectIcon = (name) => `${base}assets/effects/${name}.svg`;
export const equipmentIcon = (name) => `${base}assets/equipment/${name}.svg`;
export const fighterSprite = (name) => `${base}assets/fighters/${name}.svg`;
