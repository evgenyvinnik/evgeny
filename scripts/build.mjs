/* Builds evgeny.fyi from its sources.

     prototype/index.html    the page, with an empty entries-data block
     content/entries/*.md    one Markdown file per timeline entry (CONTENT.md)
     prototype/wallpapers/   photographs, copied next to the page
     prototype/public/       the share card and icons (npm run share-image),
                             copied to the site root beside robots.txt and
                             sitemap.xml, which the build writes itself

   node scripts/build.mjs [outDir]         the full page. dist for GitHub Pages,
                                           .testbuild (the default) for tests
   node scripts/build.mjs --body <outDir>  the page body only, for publishing
                                           as a Claude Artifact
   node scripts/build.mjs --check          validate the entries, write nothing
   --content <dir>                         read entries from another folder */
import { readFile, writeFile, mkdir, cp, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse as parseYaml } from 'yaml';

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
export const FIRST_YEAR = 1986;
export const LAST_YEAR = 2026;
export const LANES = ['life', 'education', 'work', 'side'];
const REQUIRED = ['title', 'lane', 'kind', 'start', 'tags'];
const OPTIONAL = ['end', 'org', 'link'];
const FIELDS = [...REQUIRED, ...OPTIONAL];

const show = (p) => (p.startsWith(ROOT + path.sep) ? path.relative(ROOT, p) : p);
const isText = (v) => (typeof v === 'string' ? v.trim() !== '' : typeof v === 'number');
const present = (v) => v !== undefined && v !== null && v !== '';

/* The Artifact runtime supplies this skeleton around a published page. The
   build supplies the same one, so Pages and the tests render what the
   Artifact renders instead of a quirks-mode approximation. The deployed page
   adds what an Artifact cannot carry: a language, and the head tags that
   search engines and link previews read. */
const SKELETON = (body, head = '') => `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
${head}<style>
:root{color-scheme:light}
body{margin:0;font:14px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;background:#faf9f7}
img{max-width:100%}
[hidden]{display:none!important}
</style>
</head><body>
${body}
</body></html>
`;

/* Where the site is served. Canonical links, share cards and the sitemap all
   need absolute addresses. When evgeny.fyi goes live, change the default
   here, or set SITE_URL for a single build. */
export const SITE_URL = (process.env.SITE_URL || 'https://evgenyvinnik.github.io/evgeny/').replace(/\/?$/, '/');
export const SITE = {
  name: 'Evgeny Vinnik',
  role: 'Software engineer',                     // the GitHub profile's own words
  profiles: ['https://github.com/evgenyvinnik', 'https://www.linkedin.com/in/evgenyvinnik/'],
  image: { file: 'og.png', width: 1200, height: 630 },
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const isPlaceholder = (s) => /\[/.test(s || '');
const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);

/** The facts every summary of the site is built from, with placeholders left
    out: nothing a crawler or a share card shows should be in brackets. */
export function summary(entries) {
  const current = entries.find((e) => e.lane === 'work' && e.end === LAST_YEAR && !isPlaceholder(e.title));
  const schools = entries.filter((e) => e.lane === 'education' && e.kind === 'university' && !isPlaceholder(e.title));
  const role = SITE.role + (current ? ' at ' + current.title : '');
  const description = `${SITE.name}, ${lowerFirst(role)}. A timeline of projects, study and work ` +
    'that ages from macOS Liquid Glass back to a DOS prompt as you scroll.';
  return { current, schools, role, description };
}

/** The head of the deployed page: its name, its description, its canonical
    address, the share card, and a schema.org Person for search engines. */
function headFor(title, entries) {
  const { current, schools, role, description } = summary(entries);
  const image = SITE_URL + SITE.image.file;
  const alt = `${SITE.name}, ${lowerFirst(role)}. Ten interface eras, from Liquid Glass back to a monochrome CRT.`;
  const person = {
    '@context': 'https://schema.org', '@type': 'Person', name: SITE.name, url: SITE_URL, jobTitle: SITE.role,
    ...(current && { worksFor: { '@type': 'Organization', name: current.title } }),
    ...(schools.length && { alumniOf: schools.map((u) => ({ '@type': 'CollegeOrUniversity', name: u.title })) }),
    sameAs: SITE.profiles,
  };
  return [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}">`,
    `<link rel="canonical" href="${esc(SITE_URL)}">`,
    '<meta name="theme-color" content="#000000">',
    '<link rel="icon" href="favicon.svg" type="image/svg+xml">',
    '<link rel="apple-touch-icon" href="apple-touch-icon.png">',
    '<meta property="og:type" content="website">',
    `<meta property="og:site_name" content="${esc(SITE.name)}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:url" content="${esc(SITE_URL)}">`,
    `<meta property="og:image" content="${esc(image)}">`,
    `<meta property="og:image:width" content="${SITE.image.width}">`,
    `<meta property="og:image:height" content="${SITE.image.height}">`,
    `<meta property="og:image:alt" content="${esc(alt)}">`,
    '<meta property="og:locale" content="en_US">',
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(description)}">`,
    `<meta name="twitter:image" content="${esc(image)}">`,
    `<meta name="twitter:image:alt" content="${esc(alt)}">`,
    `<script type="application/ld+json">${JSON.stringify(person).replace(/</g, '\\u003c')}</script>`,
  ].join('\n') + '\n';
}

/* What a crawler or a link scraper that runs no JavaScript sees: the same
   facts as the timeline as plain HTML, every project linked. The timeline is
   drawn by script, so without this the page would read as empty. */
function noscriptFor(entries) {
  const { description } = summary(entries);
  const real = entries.filter((e) => !isPlaceholder(e.title)).slice().reverse();
  const span = (e) => e.end === undefined || e.end === e.y ? String(e.y)
    : e.y + '–' + (e.end === LAST_YEAR ? 'present' : e.end);
  const list = (heading, items) => items.length ? `<h2>${heading}</h2>\n<ul>\n${items.join('\n')}\n</ul>\n` : '';
  const projects = real.filter((e) => e.lane === 'side').map((e) =>
    `<li>${e.link ? `<a href="${esc(e.link)}">${esc(e.title)}</a>` : esc(e.title)} (${e.y}). ${esc(e.blurb)}</li>`);
  const study = real.filter((e) => e.lane === 'education').map((e) =>
    `<li>${esc(e.title)}, ${span(e)}${e.org && !isPlaceholder(e.org) ? '. ' + esc(e.org) : ''}</li>`);
  // a work entry's dates can be placeholders even when its employer is real
  const work = real.filter((e) => e.lane === 'work').map((e) =>
    `<li>${esc(e.title)}${e.end === LAST_YEAR ? ', current' : ''}</li>`);
  const elsewhere = SITE.profiles.map((u) =>
    `<li><a href="${esc(u)}">${esc(u.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, ''))}</a></li>`);
  return '<noscript><style>.nojs{max-width:62ch;margin:0 auto;padding:40px 20px;color:#111;background:#fff;' +
    'font:16px/1.55 system-ui,sans-serif}.nojs a{color:#0645ad}</style>\n<div class="nojs">\n' +
    `<h1>${esc(SITE.name)}</h1>\n<p>${esc(description)}</p>\n` +
    list('Projects', projects) + list('Education', study) + list('Work', work) + list('Elsewhere', elsewhere) +
    '</div>\n</noscript>\n';
}

/* The page keeps its <title> in its body, where an Artifact needs it. A real
   document wants it in the head, beside the share tags. */
function documentFor(page, entries) {
  const TITLE = /<title>([\s\S]*?)<\/title>\s*/;
  const title = (TITLE.exec(page) || [])[1]?.trim() || SITE.name;
  return SKELETON(noscriptFor(entries) + page.replace(TITLE, ''), headFor(title, entries));
}

/* The timeline's routes are hash fragments, so the site is one address. */
function sitemap() {
  const day = new Date().toISOString().slice(0, 10);
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    `  <url><loc>${esc(SITE_URL)}</loc><lastmod>${day}</lastmod></url>\n</urlset>\n`;
}

/** "2018-06", "2018" or 2018 becomes { y, m }, with m counted from zero. */
function yearMonth(value, field, problems) {
  const text = String(value).trim();
  const match = /^(\d{4})(?:-(\d{1,2}))?$/.exec(text);
  if (!match) {
    problems.push(`"${field}" must be a year or a year and month, like 2018 or 2018-06 (got "${text}")`);
    return null;
  }
  const y = Number(match[1]);
  const month = match[2] ? Number(match[2]) : 1;
  if (month < 1 || month > 12) {
    problems.push(`"${field}" month must be between 01 and 12 (got "${text}")`);
    return null;
  }
  if (y < FIRST_YEAR || y > LAST_YEAR) {
    problems.push(`"${field}" must fall between ${FIRST_YEAR} and ${LAST_YEAR}, the years the timeline covers (got ${y})`);
    return null;
  }
  return { y, m: month - 1 };
}

/** Parses one entry file into the shape the page reads. */
export function parseEntry(fileName, source) {
  const problems = [];
  const slug = fileName.replace(/\.md$/, '');
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    problems.push('the file name may only use lowercase letters, digits and hyphens, like 2018-06-my-project.md');
  }

  const split = /^﻿?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n([\s\S]*))?$/.exec(source);
  if (!split) {
    problems.push('the file must start with a header between two --- lines; copy the example in CONTENT.md');
    return { entry: null, problems };
  }
  let head;
  try {
    head = parseYaml(split[1]);
  } catch (err) {
    problems.push(`the header could not be read: ${String(err.message).split('\n')[0]}`);
    return { entry: null, problems };
  }
  if (!head || typeof head !== 'object' || Array.isArray(head)) {
    problems.push('the header must be a list of "field: value" lines');
    return { entry: null, problems };
  }

  for (const key of Object.keys(head)) {
    if (!FIELDS.includes(key)) problems.push(`"${key}" is not a field. The fields are ${FIELDS.join(', ')}`);
  }
  for (const key of REQUIRED) {
    if (!present(head[key])) problems.push(`"${key}" is required`);
  }

  const text = (field) => {
    const v = head[field];
    if (!present(v)) return undefined;
    if (isText(v)) return String(v).trim();
    // YAML reads `title: [Project]` as a list, the commonest mistake by far
    const hint = Array.isArray(v) ? `. Text that starts with a square bracket needs quotes: ${field}: "[${v.join(', ')}]"` : '';
    problems.push(`"${field}" must be text${hint}`);
    return undefined;
  };
  const title = text('title');
  const kind = text('kind');
  const org = text('org');

  if (present(head.lane) && !LANES.includes(head.lane)) {
    problems.push(`"lane" must be one of ${LANES.join(', ')} (got "${head.lane}")`);
  }

  const start = present(head.start) ? yearMonth(head.start, 'start', problems) : null;

  let end;
  if (present(head.end)) {
    if (String(head.end).trim().toLowerCase() === 'present') end = LAST_YEAR;
    else end = yearMonth(head.end, 'end', problems)?.y;
    if (start && end !== undefined && end < start.y) {
      problems.push(`"end" (${end}) comes before "start" (${start.y})`);
    }
  }

  let tags;
  if (present(head.tags)) {
    if (!Array.isArray(head.tags)) problems.push(`"tags" must be a list, like tags: [react, node] (got "${head.tags}")`);
    else if (!head.tags.length) problems.push('"tags" needs at least one tag');
    else if (!head.tags.every(isText)) problems.push('"tags" may only contain text, like tags: [react, node]');
    else tags = head.tags.map((t) => String(t).trim());
  }

  let link;
  if (present(head.link)) {
    if (typeof head.link !== 'string' || !/^https?:\/\/\S+$/.test(head.link.trim())) {
      problems.push(`"link" must be a full web address starting with https:// (got "${head.link}")`);
    } else {
      link = head.link.trim();
    }
  }

  const paragraphs = (split[2] || '')
    .split(/\r?\n[ \t]*\r?\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  if (!paragraphs.length) {
    problems.push('there must be at least one paragraph of text under the header. The first paragraph is the summary shown on the timeline');
  }

  if (problems.length) return { entry: null, problems };
  const entry = { slug, lane: head.lane, kind, y: start.y, m: start.m, title, org: org || '', blurb: paragraphs[0], tags };
  if (end !== undefined) entry.end = end;
  if (paragraphs.length > 1) entry.long = paragraphs.slice(1);
  if (link) entry.link = link;
  return { entry, problems };
}

/** Reads and validates every entry in a folder, oldest first. */
export async function loadEntries(dir) {
  let names;
  try {
    names = await readdir(dir);
  } catch {
    return { entries: [], failures: [{ file: show(dir), problems: ['this folder does not exist'] }] };
  }
  const files = names.filter((n) => n.endsWith('.md') && n !== 'README.md' && !n.startsWith('_')).sort();
  const entries = [];
  const failures = [];
  for (const name of files) {
    const file = path.join(dir, name);
    const { entry, problems } = parseEntry(name, await readFile(file, 'utf8'));
    if (problems.length) failures.push({ file: show(file), problems });
    else entries.push(entry);
  }
  if (!files.length) failures.push({ file: show(dir), problems: ['there are no entries here; add at least one .md file'] });
  entries.sort((a, b) => a.y - b.y || a.m - b.m || a.slug.localeCompare(b.slug));
  return { entries, failures };
}

function report(failures) {
  const count = failures.reduce((n, f) => n + f.problems.length, 0);
  const lines = [`${count} ${count === 1 ? 'problem' : 'problems'} in the entries, so nothing was built:`, ''];
  for (const f of failures) {
    lines.push(`  ${f.file}`);
    for (const p of f.problems) lines.push(`    - ${p}`);
    lines.push('');
  }
  lines.push('CONTENT.md describes every field.');
  console.error(lines.join('\n'));
}

async function main(argv) {
  const opts = { body: false, check: false, content: path.join(ROOT, 'content', 'entries'), out: '.testbuild' };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--body') opts.body = true;
    else if (arg === '--check') opts.check = true;
    else if (arg === '--content') opts.content = path.resolve(argv[++i] ?? '');
    else if (arg.startsWith('--')) {
      console.error(`unknown option ${arg}`);
      return 2;
    } else opts.out = arg;
  }

  const { entries, failures } = await loadEntries(opts.content);
  if (failures.length) {
    report(failures);
    return 1;
  }
  if (opts.check) {
    console.log(`${entries.length} entries are valid`);
    return 0;
  }

  const html = await readFile(path.join(ROOT, 'prototype', 'index.html'), 'utf8');
  const block = /(<script type="application\/json" id="entries-data">)[\s\S]*?(<\/script>)/;
  if (!block.test(html)) {
    console.error('prototype/index.html has no entries-data block to fill');
    return 1;
  }
  // < stops any "</script>" inside an entry from closing the block early
  const json = JSON.stringify(entries).replace(/</g, '\\u003c');
  const page = html.replace(block, (_, open, close) => open + json + close);

  const outDir = path.resolve(ROOT, opts.out);
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, 'index.html'), opts.body ? page : documentFor(page, entries));
  await cp(path.join(ROOT, 'prototype', 'wallpapers'), path.join(outDir, 'wallpapers'), { recursive: true }).catch(() => {});
  if (!opts.body) {
    // the share card and the icons, and what crawlers look for beside the page
    await cp(path.join(ROOT, 'prototype', 'public'), outDir, { recursive: true }).catch(() => {});
    await writeFile(path.join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}sitemap.xml\n`);
    await writeFile(path.join(outDir, 'sitemap.xml'), sitemap());
  }
  console.log(`built ${entries.length} entries into ${show(path.join(outDir, 'index.html'))}`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.exitCode = await main(process.argv.slice(2));
}
