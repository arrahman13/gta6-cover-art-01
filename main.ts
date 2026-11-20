// Leonida Cover Lab — the hand-in program (Node 22, standard library only).
//
// The entry is the app in app/: plain static files a desktop browser runs
// offline. This program hands it in the way the grader expects — it copies
// app/ and screenshots/ from beside this file into the output directory
// (MAKEFUN_OUTPUT_DIR, or /output where that is not set) and writes
// dossier.json there with the vendored make.fun library, under the
// scorer's own caps, so an entry the scorer would refuse is refused here
// first, loudly, instead of at grading time.
//
// Run it the way the grader does:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the app itself with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = dirname(fileURLToPath(import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const appDir = join(here, 'app');
const shotsDir = join(here, 'screenshots');
if (!existsSync(join(appDir, 'index.html'))) {
  throw new Error('app/index.html is missing: the app must live in app/ beside main.ts');
}
const shotFiles = existsSync(shotsDir)
  ? readdirSync(shotsDir).filter((name) => statSync(join(shotsDir, name)).isFile())
  : [];
if (shotFiles.length < 3 || shotFiles.length > 4) {
  throw new Error(`screenshots/ must hold 3 or 4 renders of the app, found ${shotFiles.length}`);
}

mkdirSync(out, { recursive: true });
cpSync(appDir, join(out, 'app'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// The caps are the gate's (reference/gate.json): dossier text at most
// 160 KiB, at most 4 screenshots of at most 256 KiB each, app/ at most
// 993 files and 48 MiB in all, no app path over 1000 bytes.
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);
