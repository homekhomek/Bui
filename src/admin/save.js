// Saving the admin's exports straight into the project, through the dev server
// (vite-admin-save.js). Dev only, like the rest of the admin.

export const SAVE_URL = '/__admin/save';
export const ART_URL = '/__admin/art';

// The files the dev server may write, by name: the admin sends their new text.
export const SAVE_FILES = { data: 'src/data.js', translate: 'src/translate.js' };

// The art folders the dev server may create new files in (art templates).
export const ART_FOLDERS = { nodes: 'public/assets/nodes', equipment: 'public/assets/equipment', fighters: 'public/assets/fighters' };

// An art file's name: letters, digits, - and _ (it becomes an id in data.js).
export const ART_NAME = /^[A-Za-z0-9_-]+$/;

async function post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
}

// files = { data: text, translate: text }. Throws if the server refuses.
export const saveFiles = (files) => post(SAVE_URL, files);

// Create public/assets/<folder>/<name>.svg with text (an art template).
// Never overwrites: throws if the file already exists (it may hold art).
export const createArt = (folder, name, text) => post(ART_URL, { folder, name, text });
