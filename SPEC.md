# evgeny.fyi — Specification

A personal site that is one continuous timeline, read newest first. The
interface ages backwards as you scroll: Liquid Glass gives way to macOS,
to Ubuntu, to Windows 7 Aero, to XP, to Windows 98 and 95, to MS-DOS, to
an amber monochrome prompt. Branches peel off the main line for school,
university, each job and each side project.

Working prototype: `prototype/index.html` (single file, no build step).

---

## 1. Concept

The page is a commit log of a life, ordered the way `git log` orders
commits: newest at the top. The vertical spine is `main`. Every school,
job and side project is a branch that diverges downward, runs for its
real duration, and converges again at the point it started. Each entry
arrives rendered in the window chrome of its own year, so 1997 is a
Windows 95 dialog and 2024 is a translucent glass card.

Three things must always agree: the year in the header, the wallpaper
behind the page, and the window chrome of the entry on screen. Two rules
enforce this.

- **Chrome comes from the encounter year**, not the start year. Scrolling
  down, you meet a 2019–2023 job at 2023, so it wears the 2023 interface
  and states its full range in the title bar. Using the start year put a
  Windows XP window at 2009.
- **Pixel-to-year mapping comes from an anchor table** built at layout
  time, never from a formula. Collision nudging and gap compression both
  move entries off their nominal position, and a formula drifts.

### Non-goals

- Not a nostalgia museum. Era fidelity serves the biography.
- Not scroll-jacked. Native scrolling only, at native speed.
- No horizontal scrolling, ever.

---

## 2. Era map

Ten eras, because the recognisable differences are finer than the
seven-step version suggested. Windows 95's flat navy caption and
Windows 98's gradient are a real, legible distinction, and the amber
monochrome years are nothing like the Turbo Vision blue that followed.

| Years | Era | Wallpaper | Window furniture | Caption face |
|---|---|---|---|---|
| 1986–1990 | Monochrome CRT | black, amber scanlines | double-line box, notched 8.3 filename in inverse video, block cursor | VT323 |
| 1991–1994 | MS-DOS | `#0000AA` with shade dither | Turbo Pascal 7: one menu bar and status line, close box, window number, zoom box, cursor position | VT323 |
| 1995–1998 | Windows 95 | teal `#008080` | WordPad: toolbar, format bar, ruler, Times document, "For Help, press F1" | Tahoma stack |
| 1999–2000 | Windows 98 | teal `#008080`, as in 95 | Explorer web view, coolbar with greyscale icons, address bar | Tahoma stack |
| 2001–2006 | Windows XP | Bliss photograph, SVG drawing as fallback | Luna caption, task pane on its blue ground, drawn caption glyphs | Trebuchet MS |
| 2007–2011 | Windows 7 | dark blue with light streaks | glass frame, opaque content, breadcrumb bar | Segoe UI stack |
| 2012–2015 | Ubuntu | 14.04 default, `warty-final-ubuntu` | Ambiance 14.04 values: 28px caption, buttons and title on the left, dark Nautilus toolbar of linked buttons, Humanity sidebar, no status bar, Unity panel | Ubuntu |
| 2016–2020 | Windows 10 | drawn light shaft on navy; `win10.jpg` takes over if supplied | File Explorer: 46px hairline caption buttons, collapsed ribbon with a blue File tab, breadcrumb bar, Quick access pane, dark taskbar | Segoe UI stack |
| 2021–2024 | macOS | Sonoma | full-height sidebar, traffic lights over it, unified toolbar, frosted Dock | Inter as SF stand-in |
| 2025–2026 | Liquid Glass | Tahoe Day still | transparent menu bar, white window with a floating glass sidebar carrying the lights, toolbar capsules, clear glass Dock, desktop widgets | Inter |

Era boundaries are content decisions, not release dates. They mark when
*Evgeny* moved to that interface, so they should shift once real
biography replaces the placeholders. The one boundary that is a fact
rather than a choice is the last: Liquid Glass shipped in 2025, so the
macOS era runs to 2024 and glass owns only the top of the page.

### Liquid Glass is the navigation layer, not the window

Two passes got this wrong in different ways. The first built frosted
glass, which blurs its whole surface. The second built a proper lens but
made every window out of it. macOS Tahoe does neither: the window stays a
white page, and the glass is reserved for what floats over content. The
sidebar is a separate pane of light glass inset 8px inside the window,
its corners concentric with the window's 26px ones, with the traffic
lights at its top left. Toolbar buttons sit in capsules with no toolbar
strip behind them. The menu bar has no material at all, and the Dock is
nearly clear. Reference: Apple's Newsroom screenshots of Tahoe.

The light material still keeps the lens relationship between body and
rim, and a test asserts it on the sidebar:

| Layer | Job |
|---|---|
| Body | 80 to 70% white, `blur(20px) saturate(150%)` |
| Edge zone | An 8px ring at `blur(30px)`, masked with the padding-box trick so the inner edge stays rounded |
| Specular | A 1px white hairline, brightest where the light lands |

The white around the sidebar is the sidebar's own spread shadow rather
than a window background, so nothing opaque sits under the glass and it
samples the desktop. Where a window scrolls under the menu bar, the bar
applies Tahoe's scroll edge effect: a blur that fades out below it.

### Desktop furniture

Each era also carries its own shell, cross-faded on the same clock as
the wallpaper and purely decorative. This is where most of the
recognition happens, more than the windows do.

Monochrome gets a DOS status line. MS-DOS gets the Turbo Pascal
status line, with the site's top bar as its menu bar. Windows 95 and 98 get the taskbar, Start button and
tray clock, with Quick Launch added in 98. XP gets the blue taskbar and
the green Start button. Windows 7 gets the glass taskbar and the Start
orb. Ubuntu gets the Unity launcher, on the left where it belongs.
macOS gets the frosted Dock. Tahoe gets its nearly clear glass Dock with
the same drawn app icons, and calendar and weather widgets on the desktop.

The site's own top bar persists in every era but takes on that era's
treatment: beveled grey in the Windows 9x years, the Luna gradient in
XP, Ambiance's Unity panel in Ubuntu, and in Tahoe a menu bar with no
material of its own.

### Focus

A desktop has exactly one focused window, and every era said so
differently. Here the focused window is the one at the reading line, or
the maximised one, and every other window is drawn unfocused in its
era's own way:

| Era | Unfocused |
|---|---|
| Text mode | single-line box instead of double, title out of inverse video |
| Windows 95 and 98 | caption turns grey, flat or graded |
| Windows XP | washed-out Luna caption, desaturated buttons |
| Windows 7 | close button stops being red, reflection dims |
| Ubuntu | title dims, close turns grey like the other buttons, shadow shrinks |
| macOS and Tahoe | traffic lights turn grey |

The Windows taskbars name the focused window on their pressed button,
and the Restore control is drawn as a push button of the era it appears
in. Inactive captions are excluded from the contrast test on purpose,
because the real systems dimmed them below it.

### Desktop icons

Windows kept its icons down the left of the desktop and macOS put the
disk on the right, so both sit in the gutters behind the windows and
fade on the era clock: My Computer, Network Neighborhood, Recycle Bin
and My Briefcase for 95; My Documents and The Internet join them in 98;
Luna and Aero versions after that; Macintosh HD for macOS; widgets in Tahoe. All drawn as
inline SVG, and hidden below 1240px where the gutter disappears.

### Wallpapers

Every era has a drawn wallpaper, and four also have the real one layered
over it. Windows 95 and 98 had no default wallpaper, only a flat teal
desktop, and MS-DOS had none, so those drawings already are the originals.
Windows 7 keeps its drawn aurora of four rotated ellipses.

The first version used `feGaussianBlur` for the clouds and the aurora.
It looked correct and cost up to 25 seconds per screenshot, because the
filter re-rasterised a full-bleed fixed layer. Radial-gradient falloff
looks the same and costs nothing. That one change took the visual suite
from eleven minutes to three.

Four real files are included. Bliss for XP is downscaled from an 8K scan
on Internet Archive. Ubuntu's is the 14.04 default from Ubuntu's own
package archive, checksum-verified and licensed CC BY-SA 3.0, with the
required credit on the Links page. macOS uses Sonoma and Liquid Glass a
still from Tahoe Day, both taken from the owner's Mac. All are 2560px
JPEGs of 200 KB to 1.1 MB. Sources and rights are in
`prototype/wallpapers/README.md`. The test harness copies that folder
next to the page and waits for every probe to land or miss before it
captures, so baselines never catch an era halfway between drawing and
photo.

### Font licensing

MS Sans Serif, Tahoma and Segoe UI are not redistributable, and neither
is San Francisco. The prototype uses system stacks that degrade
sensibly, VT323 for both text-mode eras, Trebuchet MS for XP captions
because that is genuinely what XP used, Ubuntu from Google Fonts, and
Inter standing in for SF. `98.css` and `XP.css` are MIT-licensed and are
good references for bevel geometry.

---

## 3. Window controls

The caption buttons operate. A window that looks like a window and does
nothing when you click its close box is worse than no window at all.

| Control | Behaviour |
|---|---|
| Close | Hides the entry for the session. The branch and its node stay, so the timeline still reads. |
| Minimise | Folds the window to its caption. Clicking the caption unfolds it, as a real window manager does. |
| Maximise | Lifts the window out of the timeline to fill the viewport, with its body scrolling inside. Escape restores it. |
| Restore | A control appears in the top bar as soon as anything is hidden, and brings everything back. |

Entries with a long body scroll inside their own window, capped at 296px
with a soft bottom fade so the cut reads as *more below* rather than as
clipping. The scrollbars are period-correct: a sunken dithered trough in
the Windows 9x eras, a rounded blue thumb in XP, Ubuntu's thin overlay
line, orange only in the focused window, and block characters in the two text-mode eras.

Three things this cost, all of them found by the test suite rather than
by looking:

- macOS keeps its traffic lights in the sidebar, not in the caption, so
  the wiring pass walked past them and seven windows had dead buttons.
- A maximised window carried `z-index: 70` inside `main`'s own stacking
  context at `z-index: 10`, so the year scrubber painted over it.
- Anything inside a window that forgot to set a colour inherited `--fg`,
  the token tuned for chrome over the bare wallpaper. In the XP era that
  is white, and the address bar's field is also white.

The buttons keep each era's exact pixel geometry, so they are `<b>`
elements given a button role, a tab index, an accessible name and
keyboard handling rather than being swapped for `<button>`. In the Astro
build, where the markup is authored per era anyway, they become real
buttons.

---

## 4. Routes

| Path | Contents |
|---|---|
| `/` | The timeline, newest first. Deep-linkable by year via `/#1998`. |
| `/projects` | Every side project, newest first. |
| `/projects/<slug>` | One project: write-up, screenshots, links, the timeline entry it came from. |
| `/links` | Social and contact links. One canonical list. |
| `/cv` | Résumé, derived from the same data as the work branch. |
| `/404` | Terminal-era "bad command or file name". |

Every project page is a real static file, not a client-side route. That
keeps deep links, link previews and search indexing working, which a
hash router on GitHub Pages does not. The prototype uses hash routes as
a stand-in, driven directly on click so the nav works in sandboxes that
refuse hash navigation.

---

## 5. Data model

One source of truth: `content/entries/`, one Markdown file per entry. The
timeline, the projects page and any later page are all views over it.
[CONTENT.md](CONTENT.md) is the author's guide; this section is the
contract behind it.

```markdown
---
title: Weather app          # required, text
lane: side                  # required: life | education | work | side
kind: project               # required, a short label
start: 2026-03              # required, YYYY or YYYY-MM, 1986 to 2026
end: present                # optional, YYYY, YYYY-MM or present
org: Personal               # optional, the line under the title
tags: [swift, weatherkit]   # required, at least one
link: https://example.com   # optional, shown on the project card
---

First paragraph: the summary on the timeline.

Later paragraphs: the long text, scrolled or maximised.
```

`scripts/build.mjs` reads every file, validates it, sorts the entries by
start date and writes them as JSON into the `#entries-data` block of
`prototype/index.html`. The page reads that block at load. Nothing is
fetched at runtime, so the page stays a single file.

Validation is strict on purpose, because the build is the only reviewer an
entry added from GitHub's web editor gets. An unknown field, a date outside
the timeline, tags that aren't a list, or a bracketed title YAML reads as a
list all stop the build. The error names the file and the fix, and every
problem is reported at once. A failed build never deploys, so the live site
keeps its last good version.

Lanes are fixed tracks in the graph at increasing x offsets. Lane
identity is carried by horizontal position, not by colour, because no
colour survives all ten wallpapers legibly.

### What I need from you to replace the placeholders

The prototype carries forty-two entries, which is roughly the right
density. Each one is a file with square-bracket placeholders to replace:
the real name of the school, company or project, your role, the dates,
two or three sentences, and a few tags. For projects, also a `link`.

---

## 6. Timeline mechanics

- **Layout** is time-proportional at 122px per year on desktop, but with
  forty-two entries the content is denser than the time axis, so
  collisions dominate and total scroll lands near 12,500px.
- **Collision** pushes an entry down until it clears the one above by
  30px. The graph node stays at the true year and the branch bridges the
  offset.
- **Dead years compress.** Any gap wider than 300px collapses, so the
  sparse late eighties do not become an empty amber corridor.
- **The commit graph** is one generated SVG: the spine, a curve
  diverging from it at the entry's node, a vertical run down the lane
  for the duration, and a curve converging back at the start year. Open
  branches diverge and never converge.
- **Re-layout holds the year, not the pixel.** Fonts loading and window
  resizing both change every offset, so the page re-anchors to the year
  the reader was looking at rather than sliding under them.
- **The scrubber** is a fixed right-hand rail with one band per era,
  sized to its span, newest at the top. Click a band to jump.

---

## 7. Stack

**Astro**, static output, React only where it earns its place.

- Content collections with a Zod schema give the entry model above
  compile-time validation, so a malformed date fails the build.
- One static file per project page, via `getStaticPaths`.
- The scroll engine is a single client island. Every other page ships
  zero JavaScript.
- `astro build` to `dist/`, deployed by GitHub Actions.

The alternatives and why not: Next.js static export carries a framework
the site never uses; a Vite single-page app needs the `404.html`
redirect hack and gives up per-project metadata; plain HTML means
maintaining the same entry in four places.

```
src/
  content/timeline/*.md      one file per entry, frontmatter = Entry
  content/config.ts          the Zod schema
  eras/                      one CSS module per era: window + shell
  components/                Window, EraShell, CommitGraph, YearRuler, Wallpapers
  pages/                     index, projects/index, projects/[slug], links, cv, 404
public/
  CNAME                      contains: evgeny.fyi
```

---

## 8. Hosting

GitHub Pages, built and deployed by `.github/workflows/pages.yml`.

**Now.** Every pull request and every push to `main` runs the DOM invariants
and window-control tests on Linux. A push to `main` that passes then runs
`npm run build`, which validates the Markdown entries, compiles them into the
page, wraps it in a full HTML skeleton and copies
the wallpapers into `dist/`, and publishes that folder. The site lives at
`https://evgenyvinnik.github.io/evgeny/`. All paths in the page are relative,
so it works under that subpath unchanged.

The screenshot tests stay local. Their baselines are rendered on macOS, and
Linux has none of the system fonts the Windows eras use, so every capture
would differ.

**Later, for evgeny.fyi.**

1. Add `CNAME` containing `evgeny.fyi` to the published folder, so each
   deploy keeps the domain.
2. Point the apex A and AAAA records at GitHub's Pages addresses and add a
   `CNAME` record for `www` to `evgenyvinnik.github.io`. Take the current IPs
   from GitHub's Pages documentation; they have changed before.
3. Set the custom domain in the repository's Pages settings, then enable
   **Enforce HTTPS** once the certificate is issued.

---

## 9. Quality bars

**Performance.** Nine wallpaper layers plus nine shells plus
`backdrop-filter` on the glass, Aero and macOS windows is the main risk.
Two mitigations are in already: no SVG filters anywhere, and wallpaper
layers below a fully opaque one are dropped out of the composite rather
than left alive at `opacity: 0`. Budget: under 200KB of JavaScript,
Largest Contentful Paint under 1.5s on a cold cache, and a sustained
60fps scroll on a four-year-old laptop. The per-era capture costs in
section 10 are the current honest picture: glass and macOS are roughly
ten times more expensive than the Windows 9x eras.

**Accessibility.** Contrast is checked per era against that era's own
wallpaper, not once globally. The graph and the era rules float over
bare wallpaper with no panel behind them, so they take a dedicated
per-era wire colour rather than the era's text colour. Black-on-teal in
the Windows 95 years was the first thing that broke.
`prefers-reduced-motion` disables the cursor blink and collapses
cross-fades. The timeline is a list of articles in the accessibility
tree, newest first, independent of the visual graph. Era is never the
only carrier of meaning; every entry states its year in text.

**Motion sickness.** Cross-fades are opacity only. Nothing parallaxes
and nothing translates on scroll.

**Search.** Per-page title, description and Open Graph image. JSON-LD
`Person` on the home page and `CreativeWork` on each project. One
`sitemap.xml` generated from the content collection.

---

## 10. Tests

Playwright, two projects, seventy-six tests. `npm run test:visual` runs
them; `npm run test:visual:update` accepts new baselines after a
deliberate change.

The prototype is authored as an Artifact body, with no doctype and no
`<head>`. Served raw it would render in quirks mode, so `tests/wrap.mjs`
wraps it in the same skeleton the Artifact runtime supplies before the
server sees it. The suite therefore measures what the published page
actually renders, not a quirks-mode approximation.

### Two layers

**Screenshots**, one per era plus the routes, the two window states, the
page at rest and the bottom of the descent. Sixteen per project,
reviewed by eye when they change. Baselines live in
`tests/__screenshots__/<project>/`.

**Invariants**, asserted on the DOM. These are the ones that earn their
keep, because they fail with a readable message instead of a diff image:

- The era table in the page matches the era table in the suite, and the
  eras tile 1986 to 2026 with no gap and no overlap.
- The wallpaper layers are stacked newest to oldest, and the shells
  cover every era exactly once. A hand edit reordered two layers and
  shifted every era; this caught it.
- The header year, the wallpaper and the window chrome on screen all
  belong to the same era, at the middle of all nine eras.
- Walking down the page never moves forward in time, the top is 2026 and
  the bottom is 1986.
- Nothing overflows sideways in any era.
- Every entry renders a titled window with a blurb and tags.
- Every window is closeable and zoomable, and every caption button is
  focusable and has an accessible name.
- No text inside a window is unreadable against its own background. This
  one composites every translucent layer over the era's wallpaper,
  because the effective background of a pane of glass is not the colour
  of its nearest solid ancestor.
- The Liquid Glass rim blurs more than its body.
- Exactly one window is focused in every era, no other window sits nearer
  the reading line, and it belongs to that era.
- The Windows 95, 98 and XP taskbars name the focused window.
- Desktop icons light up in their own era and nowhere else.
- Every Markdown file in `content/entries/` renders exactly one window.
- The committed entries pass `npm run check`, and a deliberately broken
  entry stops the build with the messages an author needs to fix it.

### Things the suite taught us

Both of these were invisible to the eye and obvious to the tests.

| Finding | Fix |
|---|---|
| The year readout is written on an animation frame, so reading it straight after `scrollTo` samples the previous position | Wait a frame in the test |
| `feGaussianBlur` on a full-bleed fixed layer cost up to 25s a capture | Radial-gradient falloff instead |

### Capture cost per era

Measured at 1280x900. The figures are why the screenshot timeout is 25
seconds rather than the default five, and they are a reasonable proxy
for what a phone will struggle with.

| Era | Capture |
|---|---|
| MS-DOS, Windows 98 | under 200ms |
| Windows 95, XP, Ubuntu | 200 to 500ms |
| Monochrome, Windows 7 | 500 to 900ms |
| Liquid Glass, macOS | 900 to 1800ms |

---

## 11. Open decisions

1. **Twelve thousand pixels.** Reading top to bottom is about sixteen
   screens. The scrubber makes it navigable, but is the full descent the
   experience you want, or should the timeline default to the last decade
   and load the rest on demand?
2. **Mobile.** A phone cannot show four branch lanes, a side pane and a
   640px window together. The prototype hides the scrubber, the task
   panes and the Unity launcher below 900px, which is a compromise rather
   than a design.
3. **Authenticity ceiling.** The prototype draws real bevels, real
   taskbars and real dock geometry. The next increments are bitmap-exact
   fonts, window shadows per era, and hover states on the caption
   buttons. Each one costs maintenance in nine places.
4. **Do the personal entries stay?** Two entries are marked
   `[Personal milestone]`. A biography is better for them and a portfolio
   is often not. Your call.
