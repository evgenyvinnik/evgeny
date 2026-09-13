/* The prototype is authored as an Artifact body: no doctype, no <head>.
   Served raw it would render in quirks mode, so the visual suite wraps it in
   the same skeleton the Artifact runtime supplies. Tests then measure what
   the published page actually renders. */
import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';

const SRC = new URL('../prototype/index.html', import.meta.url);
const OUT_DIR = new URL('../.testbuild/', import.meta.url);
const OUT = new URL('index.html', OUT_DIR);

const SKELETON = (body) => `<!doctype html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
:root{color-scheme:light}
body{margin:0;font:14px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;background:#faf9f7}
img{max-width:100%}
[hidden]{display:none!important}
</style>
</head><body>
${body}
</body></html>
`;

await mkdir(OUT_DIR, { recursive: true });
await writeFile(OUT, SKELETON(await readFile(SRC, 'utf8')));
// real wallpapers, where supplied, are part of what the page renders
await cp(new URL('../prototype/wallpapers/', import.meta.url), new URL('wallpapers/', OUT_DIR),
  { recursive: true }).catch(() => {});
console.log('wrapped prototype/index.html -> .testbuild/index.html');
