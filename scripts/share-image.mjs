/* Renders the share card and the home-screen icon into prototype/public/.

     npm run share-image

   Run it after changing the eras, the name or the current role. The build
   copies prototype/public/ to the site root, so what this writes is what a
   shared link unfurls into. The files are committed rather than rendered in
   CI because rendering needs a browser, and the deploy job has none.

   The card is drawn from owned material only: the header stripe's black, the
   era swatches the scrubber already uses, and type. A share card is copied
   onto every platform a link lands on, which is further than the wallpapers
   in this repository are meant to travel. */
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { loadEntries, summary, SITE } from './build.mjs';

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const OUT = path.join(ROOT, 'prototype', 'public');

// the eras come from the page itself, newest first, as the scrubber shows them
const page = await readFile(path.join(ROOT, 'prototype', 'index.html'), 'utf8');
const ERA = /\{id:'(\w+)',\s*os:'([^']+)'.*?sw:'(#[0-9A-Fa-f]{6})',\s*ink:'(#[0-9A-Fa-f]{6})'\}/g;
const eras = [...page.matchAll(ERA)].map(([, id, os, sw, ink]) => ({ id, os, sw, ink })).reverse();
if (eras.length !== 10) throw new Error(`expected ten eras in prototype/index.html, found ${eras.length}`);

const { entries, failures } = await loadEntries(path.join(ROOT, 'content', 'entries'));
if (failures.length) throw new Error('the entries do not validate; run npm run check');
const { role } = summary(entries);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const FONTS = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700' +
  '&family=IBM+Plex+Mono:wght@500;600&display=swap">';

const CARD = `<!doctype html><meta charset="utf-8">${FONTS}
<style>
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;overflow:hidden;display:flex;background:#000;color:#FFF;
  font-family:Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.text{flex:1;display:flex;flex-direction:column;justify-content:space-between;padding:60px 64px 58px 72px}
.nav{display:flex;gap:8px;font:500 15px/1 "IBM Plex Mono",monospace;letter-spacing:.12em;
  text-transform:uppercase;color:rgba(255,255,255,.55)}
.nav b{font-weight:500;padding:8px 12px;border-radius:5px}
.nav b:first-child{color:#FFF;background:rgba(255,255,255,.16)}
h1{font-weight:700;font-size:92px;line-height:.98;letter-spacing:-.04em}
.role{margin-top:20px;font-weight:500;font-size:34px;letter-spacing:-.015em;color:rgba(255,255,255,.8)}
.line{max-width:29ch;font-size:25px;line-height:1.42;color:rgba(255,255,255,.6)}
.eras{flex:0 0 324px;display:flex;flex-direction:column;border-left:1px solid rgba(255,255,255,.14)}
.eras i{flex:1;display:flex;align-items:center;padding:0 24px;font:600 15px/1 "IBM Plex Mono",monospace;
  font-style:normal;letter-spacing:.09em;text-transform:uppercase}
</style>
<div class="text">
  <div class="nav"><b>Timeline</b><b>Projects</b><b>Links</b></div>
  <div><h1>${esc(SITE.name)}</h1><p class="role">${esc(role)}</p></div>
  <p class="line">A timeline of computing that ages from Liquid Glass back to a DOS prompt as you scroll.</p>
</div>
<div class="eras">${eras.map((e) => `<i style="background:${e.sw};color:${e.ink}">${esc(e.os)}</i>`).join('')}</div>`;

// the initials over the same ten swatches; iOS rounds the corners itself
const ICON = `<!doctype html><meta charset="utf-8">${FONTS}
<style>
*{margin:0}
body{width:180px;height:180px;overflow:hidden;display:flex;flex-direction:column;background:#000}
b{flex:1;display:grid;place-items:center;color:#FFF;font:700 80px/1 Inter,system-ui,sans-serif;letter-spacing:-.05em}
div{display:flex;height:24px}
i{flex:1}
</style>
<b>EV</b><div>${eras.map((e) => `<i style="background:${e.sw}"></i>`).join('')}</div>`;

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
async function render(html, width, height, file) {
  const tab = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await tab.setContent(html, { waitUntil: 'networkidle' });
  await tab.evaluate(() => document.fonts.ready);
  await tab.screenshot({ path: path.join(OUT, file), type: 'png' });
  await tab.close();
  console.log(`wrote prototype/public/${file} (${width}x${height})`);
}
await render(CARD, SITE.image.width, SITE.image.height, SITE.image.file);
await render(ICON, 180, 180, 'apple-touch-icon.png');
await browser.close();
