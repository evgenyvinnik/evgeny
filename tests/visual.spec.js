const { test, expect } = require('@playwright/test');

/* ---------------------------------------------------------------------------
   Visual suite for evgeny.fyi.

   The page's whole premise is that nine interfaces stay recognisable and
   stay in agreement with each other, which is exactly the kind of thing that
   silently rots. Two layers of coverage:

   - Invariants, asserted on the DOM. Cheap, readable failures, no baselines.
   - Screenshots, one per era plus the routes. Baselines live in
     tests/__screenshots__ and are reviewed by eye when they change.
--------------------------------------------------------------------------- */

/** Land on a year and wait for the page to settle there. */
async function gotoYear(page, year) {
  const res = await page.evaluate((y) => window.BOOT.gotoYear(y), year);
  await page.waitForTimeout(700);              // let the cross-fades finish
  return res;
}

async function open(page) {
  await page.goto('/index.html');
  await page.waitForFunction(() => window.BOOT && window.BOOT.laidOut && window.BOOT.wallpapersSettled,
    null, { timeout: 15_000 });
  await page.waitForTimeout(200);
}

/** The middle of an era, where its own content and wallpaper both dominate. */
const midOf = (e) => Math.floor((e.from + e.to) / 2) + 0.5;

const ERAS = [
  { id: 'mono',   from: 1986, to: 1990 },
  { id: 'dos',    from: 1991, to: 1994 },
  { id: 'w95',    from: 1995, to: 1998 },
  { id: 'w98',    from: 1999, to: 2000 },
  { id: 'xp',     from: 2001, to: 2006 },
  { id: 'aero',   from: 2007, to: 2011 },
  { id: 'ubuntu', from: 2012, to: 2015 },
  { id: 'macos',  from: 2016, to: 2024 },
  { id: 'glass',  from: 2025, to: 2026 },
];

test.describe('invariants', () => {
  test('the era table in the page matches the era table in the suite', async ({ page }) => {
    await open(page);
    const inPage = await page.evaluate(() =>
      window.BOOT.eras.map((e) => ({ id: e.id, from: e.from, to: e.to })));
    expect(inPage).toEqual(ERAS);
  });

  test('eras tile the whole span with no gap and no overlap', async ({ page }) => {
    await open(page);
    const eras = await page.evaluate(() => window.BOOT.eras);
    expect(eras[0].from).toBe(1986);
    expect(eras[eras.length - 1].to).toBe(2026);
    for (let i = 1; i < eras.length; i++) {
      expect(eras[i].from).toBe(eras[i - 1].to + 1);
    }
  });

  test('the wallpaper layers are stacked newest to oldest', async ({ page }) => {
    await open(page);
    const stacked = await page.evaluate(() =>
      [...document.querySelectorAll('#desktops .bd')].map((b) => b.dataset.era));
    expect(stacked).toEqual(ERAS.map((e) => e.id).reverse());
  });

  test('the desktop shells cover every era exactly once', async ({ page }) => {
    await open(page);
    const shells = await page.evaluate(() =>
      [...document.querySelectorAll('#shells .sh')].map((b) => b.dataset.era).sort());
    expect(shells).toEqual(ERAS.map((e) => e.id).sort());
  });

  /* This is the invariant the design rests on, and the one that broke twice
     while building: the year in the header, the wallpaper and the window
     chrome on screen all have to belong to the same era. */
  test('header year, wallpaper and window chrome agree in every era', async ({ page }) => {
    await open(page);
    for (const era of ERAS) {
      const state = await page.evaluate((y) => {
        window.BOOT.gotoYear(y);
        const focus = window.scrollY + window.innerHeight * 0.42;
        const chromes = [...document.querySelectorAll('.win')]
          .filter((w) => {
            const r = w.getBoundingClientRect();
            return focus >= r.top + window.scrollY && focus <= r.bottom + window.scrollY;
          })
          .map((w) => w.dataset.chrome);
        const lit = [...document.querySelectorAll('#desktops .bd')]
          .filter((b) => parseFloat(b.style.opacity || '0') > 0.5)
          .map((b) => b.dataset.era);
        return {
          era: document.documentElement.dataset.era,
          shown: Number(document.getElementById('yrOut').textContent),
          chromes,
          topWallpaper: lit[lit.length - 1],
        };
      }, midOf(era));

      expect(state.era, `data-era at ${midOf(era)}`).toBe(era.id);
      expect(state.shown, `header year at ${midOf(era)}`).toBeGreaterThanOrEqual(era.from);
      expect(state.shown, `header year at ${midOf(era)}`).toBeLessThanOrEqual(era.to);
      expect(state.topWallpaper, `wallpaper at ${midOf(era)}`).toBe(era.id);
      for (const c of state.chromes) {
        expect(c, `window chrome at ${midOf(era)}`).toBe(era.id);
      }
    }
  });

  test('the pixel-to-year map is monotonic and covers the document', async ({ page }) => {
    await open(page);
    expect(await page.evaluate(() => document.documentElement.scrollHeight))
      .toBeGreaterThan(3000);

    // walking down the page must never move forward in time. The height is
    // re-read each step because layout settles as fonts land.
    const seq = [];
    for (let i = 0; i <= 24; i++) {
      seq.push(await page.evaluate(async (frac) => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo(0, Math.round(max * frac));
        // the readout is written on an animation frame, so wait for one
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        return Number(document.getElementById('yrOut').textContent);
      }, i / 24));
    }
    for (let i = 1; i < seq.length; i++) {
      expect(seq[i], `year at step ${i} of the descent`).toBeLessThanOrEqual(seq[i - 1]);
    }
    expect(seq[0], 'the top of the page is the present').toBe(2026);
    expect(seq[seq.length - 1], 'the bottom of the page is 1986').toBe(1986);
  });

  test('nothing overflows sideways in any era', async ({ page }) => {
    await open(page);
    for (const era of ERAS) {
      await gotoYear(page, midOf(era));
      const over = await page.evaluate(() =>
        document.documentElement.scrollWidth - window.innerWidth);
      expect(over, `horizontal overflow in ${era.id}`).toBeLessThanOrEqual(1);
    }
  });

  test('every entry renders a titled window with a blurb', async ({ page }) => {
    await open(page);
    const audit = await page.evaluate(() => {
      const wins = [...document.querySelectorAll('.win:not(.hero):not(.coda)')];
      return {
        count: wins.length,
        missingTitle: wins.filter((w) => !w.querySelector('h3')?.textContent.trim()).length,
        missingBlurb: wins.filter((w) => !w.querySelector('.blurb')?.textContent.trim()).length,
        untagged: wins.filter((w) => !w.querySelector('.tags b')).length,
      };
    });
    expect(audit.count).toBeGreaterThanOrEqual(40);
    expect(audit.missingTitle).toBe(0);
    expect(audit.missingBlurb).toBe(0);
    expect(audit.untagged).toBe(0);
  });

  /* The bug this catches: anything inside a window that forgets to set a
     colour inherits --fg, which is tuned for chrome over the bare wallpaper.
     In the XP era that is white, and the address bar's field is also white. */
  test('no text inside a window is unreadable against its own background',
    async ({ page }) => {
    await open(page);
    const offenders = await page.evaluate(() => {
      const lum = (c) => {
        const [r, g, b] = c.map((v) => {
          const s = v / 255;
          return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const rgba = (str) => {
        const m = /rgba?\(([^)]+)\)/.exec(str || '');
        if (!m) return null;
        const p = m[1].split(',').map((n) => parseFloat(n));
        return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
      };
      const parse = (str) => { const c = rgba(str); return c && c[3] >= 0.6 ? c.slice(0, 3) : null; };
      const ratio = (a, b) => {
        const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
        return (x + 0.05) / (y + 0.05);
      };
      const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

      /* The effective background of a pane of glass is every translucent
         layer above it composited over whatever is behind. A gradient stops
         the walk and returns nothing to judge: a Luna caption is white on
         blue, and the solid colour underneath says nothing about that. */
      const bgOf = (el, wallpaper) => {
        const chain = [];
        for (let n = el; n; n = n.parentElement) {
          const st = getComputedStyle(n);
          if (/gradient/.test(st.backgroundImage)) return null;
          chain.push(rgba(st.backgroundColor));
          if (n === document.body) break;
        }
        // the wallpaper is a fixed full-bleed layer, not an ancestor
        let base = wallpaper;
        for (let i = chain.length - 1; i >= 0; i--) {
          const c = chain[i];
          if (!c || c[3] === 0) continue;
          base = [0, 1, 2].map((k) => c[k] * c[3] + base[k] * (1 - c[3]));
        }
        return base;
      };
      const swatch = Object.fromEntries(window.BOOT.eras.map((e) => [e.id, hex(e.sw)]));
      const bad = [];
      document.querySelectorAll('.win *').forEach((el) => {
        const own = [...el.childNodes].some((n) =>
          n.nodeType === 3 && n.textContent.trim().length > 1);
        if (!own) return;
        // an unfocused caption is dimmed on purpose, exactly as the real OS dimmed it
        if (el.closest('.win:not([data-active]) .bar, .win:not([data-active]) .tvtitle, ' +
          '.win:not([data-active]) .tvr, .win:not([data-active]) .tvclose, ' +
          '.win:not([data-active]) .tvpos')) return;
        const st = getComputedStyle(el);
        if (st.visibility === 'hidden' || st.display === 'none') return;
        if (!el.getClientRects().length) return;
        const era = el.closest('.win').dataset.chrome;
        const fg = parse(st.color), bg = bgOf(el, swatch[era] || [8, 8, 16]);
        if (!fg || !bg) return;
        const r = ratio(fg, bg);
        if (r < 2.5) {
          bad.push({
            era,
            where: el.className || el.tagName.toLowerCase(),
            text: el.textContent.trim().slice(0, 28),
            ratio: Math.round(r * 100) / 100,
          });
        }
      });
      // one row per distinct era + place, so the report stays readable
      const seen = new Set();
      return bad.filter((o) => {
        const k = o.era + '/' + o.where;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    });
    expect(offenders, 'text that cannot be read on its own background').toEqual([]);
  });

  /* A desktop has one focused window. Every era draws the rest inactive, so
     if focus drifts from the reading line the page misreports what you are
     looking at in all nine interfaces at once. */
  test('exactly one window is focused, and nothing is nearer the reading line',
    async ({ page }) => {
    await open(page);
    for (const era of ERAS) {
      const s = await page.evaluate((y) => {
        window.BOOT.gotoYear(y);
        const focus = window.scrollY + window.innerHeight * 0.42;
        const gap = (w) => {
          const r = w.getBoundingClientRect();
          return Math.max(0, r.top + window.scrollY - focus, focus - (r.bottom + window.scrollY));
        };
        const act = [...document.querySelectorAll('.win[data-active]')];
        const d = act.length ? gap(act[0]) : Infinity;
        const nearer = [...document.querySelectorAll('.win')]
          .filter((w) => w !== act[0] && w.getClientRects().length && gap(w) < d).length;
        return { count: act.length, nearer, chrome: act[0] && act[0].dataset.chrome };
      }, midOf(era));
      expect(s.count, `focused windows in ${era.id}`).toBe(1);
      expect(s.nearer, `windows nearer the line than the focused one in ${era.id}`).toBe(0);
      expect(s.chrome, `focused window era at ${midOf(era)}`).toBe(era.id);
    }
  });

  test('the taskbar names the focused window', async ({ page }) => {
    await open(page);
    for (const id of ['w95', 'w98', 'xp']) {
      const era = ERAS.find((e) => e.id === id);
      const s = await page.evaluate(({ y, id }) => {
        window.BOOT.gotoYear(y);
        const act = document.querySelector('.win[data-active]');
        return {
          caption: act.dataset.caption,
          task: document.querySelector('.sh-' + id + ' [data-task] span').textContent,
        };
      }, { y: midOf(era), id });
      expect(s.caption.length, `caption in ${id}`).toBeGreaterThan(2);
      expect(s.task, `taskbar button in ${id}`).toBe(s.caption);
    }
  });

  test('desktop icons appear only in their own era', async ({ page }) => {
    await open(page);
    const withIcons = ['w95', 'w98', 'xp', 'aero', 'macos'];
    for (const era of ERAS) {
      const lit = await page.evaluate((y) => {
        window.BOOT.gotoYear(y);
        return [...document.querySelectorAll('#icons .ic')]
          .filter((i) => parseFloat(i.style.opacity || '0') > 0.5)
          .map((i) => i.dataset.era);
      }, midOf(era));
      expect(lit, `desktop icons lit in ${era.id}`).toEqual(withIcons.includes(era.id) ? [era.id] : []);
    }
  });

  test('Liquid Glass keeps its interior clearer than its rim', async ({ page }) => {
    await open(page);
    // the lens model, asserted: the edge zone must blur more than the body
    const filters = await page.evaluate(() => {
      const el = document.querySelector('.win[data-chrome="glass"] .frame');
      const read = (pseudo) => getComputedStyle(el, pseudo).backdropFilter;
      const px = (s) => { const m = /blur\(([\d.]+)px\)/.exec(s || ''); return m ? +m[1] : null; };
      return { body: px(read(null)), rim: px(read('::before')) };
    });
    expect(filters.body).not.toBeNull();
    expect(filters.rim).not.toBeNull();
    expect(filters.rim).toBeGreaterThan(filters.body);
  });
});

test.describe('window controls', () => {
  test('close hides the entry and the restore control brings it back', async ({ page }) => {
    await open(page);
    const before = await page.evaluate(() =>
      document.querySelectorAll('.win[data-i]:not([data-state])').length);

    const closed = await page.evaluate(() => window.BOOT.act(2003.5, 'close'));
    expect(closed.state).toBe('closed');
    expect(closed.h, 'a closed window occupies no height').toBe(0);
    expect(await page.evaluate(() => window.BOOT.hidden())).toBe(1);
    await expect(page.locator('#restore')).toBeVisible();
    await expect(page.locator('#restore')).toHaveText(/Restore 1 window/);

    await page.locator('#restore').click();
    await expect(page.locator('#restore')).toBeHidden();
    expect(await page.evaluate(() =>
      document.querySelectorAll('.win[data-i]:not([data-state])').length)).toBe(before);
  });

  test('minimise folds the window to its caption and keeps it operable', async ({ page }) => {
    await open(page);
    const tall = await page.evaluate(() => window.BOOT.act(1996.5, null));
    const folded = await page.evaluate(() => window.BOOT.act(1996.5, 'min'));
    expect(folded.state).toBe('min');
    expect(folded.h, 'folded is shorter than open').toBeLessThan(tall.h * 0.5);
    expect(folded.h, 'the caption survives').toBeGreaterThan(10);

    // the caption is the restore target, as it is in a real window manager
    const restored = await page.evaluate(() => {
      const w = document.querySelector('.win[data-state="min"]');
      w.querySelector('.bar').click();
      return { state: w.dataset.state || null, h: w.offsetHeight };
    });
    expect(restored.state).toBeNull();
    expect(restored.h).toBeGreaterThan(folded.h * 2);
  });

  test('maximise fills the viewport and scrolls its body', async ({ page }) => {
    await open(page);
    const maxed = await page.evaluate(() => {
      window.BOOT.act(2025.9, 'max');                 // an entry with a long body
      const w = document.querySelector('.win[data-state="max"]');
      const b = w.querySelector('.body');
      return {
        fills: w.getBoundingClientRect().height >= window.innerHeight - 1,
        fixed: getComputedStyle(w).position,
        overflow: getComputedStyle(b).overflowY,
        bodyCapped: getComputedStyle(b).maxHeight,
        covers: b.getBoundingClientRect().height > window.innerHeight * 0.4,
      };
    });
    expect(maxed.fixed).toBe('fixed');
    expect(maxed.fills, 'a maximised window fills the viewport').toBe(true);
    expect(maxed.overflow, 'the body is a scroll container').toBe('auto');
    expect(maxed.bodyCapped, 'the cap lifts when maximised').toBe('none');
    expect(maxed.covers, 'the body takes the space it was given').toBe(true);

    await page.keyboard.press('Escape');
    expect(await page.evaluate(() =>
      document.querySelectorAll('.win[data-state="max"]').length)).toBe(0);
  });

  test('long entries scroll inside their own window', async ({ page }) => {
    await open(page);
    const audit = await page.evaluate(() => {
      const longs = [...document.querySelectorAll('.win[data-long]')];
      return {
        count: longs.length,
        scrolling: longs.filter((w) => {
          const b = w.querySelector('.body');
          return b.scrollHeight > b.clientHeight + 4;
        }).length,
      };
    });
    expect(audit.count).toBeGreaterThanOrEqual(4);
    expect(audit.scrolling, 'every long entry actually overflows its body').toBe(audit.count);
  });

  test('every caption button is focusable and named', async ({ page }) => {
    await open(page);
    const audit = await page.evaluate(() => {
      const btns = [...document.querySelectorAll('.win [data-act]')];
      const wins = [...document.querySelectorAll('.win')];
      return {
        windows: wins.length,
        count: btns.length,
        unnamed: btns.filter((b) => !b.getAttribute('aria-label')).length,
        unfocusable: btns.filter((b) => b.getAttribute('tabindex') !== '0').length,
        notButtons: btns.filter((b) => b.getAttribute('role') !== 'button').length,
        acts: [...new Set(btns.map((b) => b.dataset.act))].sort(),
        // every window, in every era, has to be closeable and zoomable
        noClose: wins.filter((w) => !w.querySelector('[data-act="close"]'))
          .map((w) => w.dataset.chrome),
        noMax: wins.filter((w) => !w.querySelector('[data-act="max"]'))
          .map((w) => w.dataset.chrome),
      };
    });
    expect(audit.count).toBeGreaterThanOrEqual(audit.windows * 2);
    expect(audit.unnamed).toBe(0);
    expect(audit.unfocusable).toBe(0);
    expect(audit.notButtons).toBe(0);
    expect(audit.acts).toEqual(['close', 'max', 'min']);
    expect(audit.noClose, 'eras whose close button does nothing').toEqual([]);
    expect(audit.noMax, 'eras whose maximise button does nothing').toEqual([]);
  });

  test('the keyboard operates the caption buttons', async ({ page }) => {
    await open(page);
    const state = await page.evaluate(() => {
      const btn = document.querySelector('.win[data-i] [data-act="min"]');
      const w = btn.closest('.win');
      btn.focus();
      btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      return w.dataset.state || null;
    });
    expect(state).toBe('min');
  });
});

test.describe('screenshots', () => {
  test('the page at rest', async ({ page }) => {
    await open(page);
    await expect(page).toHaveScreenshot('top.png');
  });

  for (const era of ERAS) {
    test(`era · ${era.id} (${era.from}–${era.to})`, async ({ page }) => {
      await open(page);
      await gotoYear(page, midOf(era));
      await expect(page).toHaveScreenshot(`era-${era.id}.png`);
    });
  }

  test('the bottom of the descent', async ({ page }) => {
    await open(page);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(700);
    await expect(page).toHaveScreenshot('bottom.png');
  });

  test('a minimised window', async ({ page }) => {
    await open(page);
    await gotoYear(page, 1996.5);
    await page.evaluate(() => window.BOOT.act(1996.5, 'min'));
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('state-minimised.png');
  });

  test('a maximised window', async ({ page }) => {
    await open(page);
    await gotoYear(page, 2003.5);
    await page.evaluate(() => window.BOOT.act(2003.5, 'max'));
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('state-maximised.png');
  });

  test('route · projects', async ({ page }) => {
    await open(page);
    await page.evaluate(() => window.BOOT.goto('projects'));
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('projects.png');
  });

  test('route · links', async ({ page }) => {
    await open(page);
    await page.evaluate(() => window.BOOT.goto('links'));
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('links.png');
  });
});
