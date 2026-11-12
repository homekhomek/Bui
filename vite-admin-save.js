// Dev-server plugin: lets the admin dashboard save its data.js / translate.js
// exports straight into src/. Only runs under `npm run dev` (apply: 'serve'),
// never in builds. It writes only the files named in SAVE_FILES.

import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { SAVE_FILES, SAVE_URL } from './src/admin/save.js';

const readBody = (req) =>
  new Promise((ok, fail) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => ok(body));
    req.on('error', fail);
  });

export default function adminSave() {
  return {
    name: 'bui-admin-save',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(SAVE_URL, async (req, res) => {
        const reply = (status, text) => {
          res.statusCode = status;
          res.end(text);
        };
        // JSON only: a plain cross-site form post can't send this type.
        if (req.method !== 'POST' || !req.headers['content-type']?.startsWith('application/json')) {
          return reply(405, 'POST JSON only');
        }
        try {
          const files = JSON.parse(await readBody(req));
          const names = Object.keys(files);
          if (names.length === 0 || names.some((n) => !SAVE_FILES[n] || typeof files[n] !== 'string')) {
            return reply(400, `Expected text for: ${Object.keys(SAVE_FILES).join(', ')}`);
          }
          const root = server.config.root;
          await Promise.all(names.map((n) => writeFile(resolve(root, SAVE_FILES[n]), files[n])));
          reply(200, 'saved');
        } catch (e) {
          reply(500, String(e?.message ?? e));
        }
      });
    },
  };
}
