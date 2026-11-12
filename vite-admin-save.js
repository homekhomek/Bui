// Dev-server plugin: lets the admin dashboard save its data.js / translate.js
// exports straight into src/, and create new art files (from art templates)
// in public/assets/. Only runs under `npm run dev` (apply: 'serve'), never in
// builds. It writes only the files named in SAVE_FILES, and only creates new
// .svg files in ART_FOLDERS (never overwriting one).

import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ART_FOLDERS, ART_NAME, ART_URL, SAVE_FILES, SAVE_URL } from './src/admin/save.js';

const readBody = (req) =>
  new Promise((ok, fail) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => ok(body));
    req.on('error', fail);
  });

// A POST JSON endpoint: handle(body, root) returns the reply text, or throws
// { status, message }.
function endpoint(server, url, handle) {
  server.middlewares.use(url, async (req, res) => {
    const reply = (status, text) => {
      res.statusCode = status;
      res.end(text);
    };
    // JSON only: a plain cross-site form post can't send this type.
    if (req.method !== 'POST' || !req.headers['content-type']?.startsWith('application/json')) {
      return reply(405, 'POST JSON only');
    }
    try {
      reply(200, await handle(JSON.parse(await readBody(req)), server.config.root));
    } catch (e) {
      reply(e?.status ?? 500, String(e?.message ?? e));
    }
  });
}

const refuse = (status, message) => Object.assign(new Error(message), { status });

export default function adminSave() {
  return {
    name: 'bui-admin-save',
    apply: 'serve',
    configureServer(server) {
      endpoint(server, SAVE_URL, async (files, root) => {
        const names = Object.keys(files);
        if (names.length === 0 || names.some((n) => !SAVE_FILES[n] || typeof files[n] !== 'string')) {
          throw refuse(400, `Expected text for: ${Object.keys(SAVE_FILES).join(', ')}`);
        }
        await Promise.all(names.map((n) => writeFile(resolve(root, SAVE_FILES[n]), files[n])));
        return 'saved';
      });

      endpoint(server, ART_URL, async ({ folder, name, text }, root) => {
        if (!ART_FOLDERS[folder] || !ART_NAME.test(name ?? '') || typeof text !== 'string') {
          throw refuse(400, 'Expected { folder, name, text }');
        }
        const file = `${ART_FOLDERS[folder]}/${name}.svg`;
        try {
          // 'wx': fail if the file exists, so existing art is never overwritten.
          await writeFile(resolve(root, file), text, { flag: 'wx' });
        } catch (e) {
          if (e.code === 'EEXIST') throw refuse(409, `${file} already exists`);
          throw e;
        }
        return file;
      });
    },
  };
}
