# Wallpapers

Every era has a drawn wallpaper built into the page. A file in this folder,
under the name the page probes for, replaces that era's drawing on load. No
code change, no build step.

```
mono.jpg  dos.png  win95.png  win98.png  bliss.jpg
win7.jpg  ubuntu.jpg  macos.jpg  glass.jpg
```

## What is here

| File | Source | Size |
|---|---|---|
| `bliss.jpg` | Downscaled from `bliss_uncropped_8k.png` on Internet Archive (item `bliss_uncropped_8k`), a 7680×6214 scan uploaded in 2024 by an archive user | 2560×2071 JPEG, quality 82, about 1.1 MB |

Bliss is Charles O'Rear's 1996 photograph, and Microsoft bought all rights to
it in 2000. It is used here by the site owner's choice, for a personal site.

2560px wide is the size to keep: the layer is `background-size: cover` behind
the whole viewport, so wider only adds weight, and narrower goes soft on large
displays.

## Adding another

Windows 95 and 98 and MS-DOS shipped flat colours, so their drawings are
already exact. The eras with the most to gain from a real image are Windows 7,
Ubuntu and macOS. Resize to 2560px wide before dropping it in:

```bash
sips -s format jpeg -s formatOptions 82 --resampleWidth 2560 source.png --out win7.jpg
```

The test harness copies this folder next to the page and waits for every
probe to settle, so screenshot baselines always show whatever is here. Run
`npm run test:visual:update` after adding a file.
