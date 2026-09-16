# Wallpapers

Every era has a drawn wallpaper built into the page. A file in this folder,
under the name the page probes for, replaces that era's drawing on load. No
code change, no build step.

```
mono.jpg  dos.png  win95.png  win98.png  bliss.jpg
win7.jpg  ubuntu.jpg  win10.jpg  macos.jpg  glass.jpg
```

## What is here

| File | Era | Source | Size |
|---|---|---|---|
| `bliss.jpg` | Windows XP | `bliss_uncropped_8k.png` on Internet Archive, a 7680×6214 scan uploaded in 2024 by an archive user | 2560×2071, about 1.1 MB |
| `win7.jpg` | Windows 7 | *Harmony*, `img0.jpg` on Internet Archive (`harmony-wallpaper`), byte-identical (MD5 `da288dce…`) to the copy in a second, independent upload (`ms-windows-7-wallpapers`); kept at its native size | 1920×1200, about 628 KB |
| `win10.jpg` | Windows 10 | *Hero*, `Web/4K/Wallpaper/Windows/img0_2560x1600.jpg` from "Windows 10 1507 Original wallpapers" on Internet Archive (`img103_202407`), copied from an installed Windows 10 1507. The original dark version, default from 1507 to 1809; the lighter one in most other uploads is the 1903 replacement | 2560×1600, about 311 KB |
| `ubuntu.jpg` | Ubuntu | `warty-final-ubuntu.png` from `ubuntu-wallpapers_14.04.0.1.orig.tar.gz` on archive.ubuntu.com, SHA-256 checked against the package's `.dsc` | 2560×1600, about 206 KB |
| `macos.jpg` | macOS | `Sonoma.heic` from `/System/Library/Desktop Pictures` on the owner's Mac | 2560×2560, about 326 KB |
| `glass.jpg` | Liquid Glass | a still from `Tahoe Day.mov` in the same system folder, taken with Quick Look | 2560×1440, about 643 KB |

## Rights

| File | Owner | Terms |
|---|---|---|
| `bliss.jpg` | Microsoft, which bought all rights to Charles O'Rear's 1996 photograph in 2000 | used by the site owner's choice, for a personal site |
| `win7.jpg` | Microsoft; artwork by Chuck Anderson and Erik Attkisson | used by the site owner's choice, for a personal site |
| `win10.jpg` | Microsoft | used by the site owner's choice, for a personal site |
| `ubuntu.jpg` | Kenneth Wimer and Otto Greenslade | CC BY-SA 3.0; the required credit is on the Links page |
| `macos.jpg`, `glass.jpg` | Apple | used by the site owner's choice, for a personal site |

## Eras without a file

Windows 95 and 98 had no default wallpaper, only a flat teal `#008080`
desktop, and MS-DOS and the monochrome years had none at all. The page draws
those exactly, so there is nothing to replace. Windows 7 and Windows 10 still
carry their drawings, an aurora and a shaft of light on navy, as fallbacks if
`win7.jpg` or `win10.jpg` is removed.

## Adding another

Keep files at 2560px wide. The layer is `background-size: cover` behind the
whole viewport, so wider only adds weight and narrower goes soft on large
displays.

```bash
sips -s format jpeg -s formatOptions 82 --resampleWidth 2560 source.png --out win7.jpg
```

The test harness copies this folder next to the page and waits for every
probe to settle, so screenshot baselines always show whatever is here. Run
`npm run test:visual:update` after adding a file.
