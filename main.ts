// Leonida Trophy Guide — the entry program (Node 22, standard library only).
// The guide itself is plain static files under app/: index.html, its ES modules
// under app/js/, its stylesheet, and its data under app/data/. There is no
// build step and the app loads nothing over the network at run time.
//
// This program hands the guide in: it copies app/ and screenshots/ from beside
// this file into the output directory (/output in the grader, or
// $MAKEFUN_OUTPUT_DIR when that is set) and writes /output/dossier.json with
// buildDossier from the vendored make.fun library. vendor/makefun-frontend.ts
// must stay exactly as the kit shipped it — the scorer rebuilds the dossier
// with its own copy and compares the two byte for byte.
//
// Run it locally to check the entry:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The gate's own caps (from the kit's reference/gate.json): the dossier text
// is capped at 160 KiB, at most 4 screenshots of at most 256 KiB each, and
// app/ holds at most 993 files and directories totalling at most 48 MiB.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
console.log('Wrote entry to ' + out);
