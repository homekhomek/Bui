// Saving the admin's exports straight into src/, through the dev server
// (vite-admin-save.js). Dev only, like the rest of the admin.

export const SAVE_URL = '/__admin/save';

// The files the dev server may write, by name: the admin sends their new text.
export const SAVE_FILES = { data: 'src/data.js', translate: 'src/translate.js' };

// files = { data: text, translate: text }. Throws if the server refuses.
export async function saveFiles(files) {
  const res = await fetch(SAVE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(files),
  });
  if (!res.ok) throw new Error(await res.text());
}
