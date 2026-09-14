# Adding entries

Everything on the timeline is one Markdown file in `content/entries/`: every
job, school, side project and life event. Add a file and it appears on the
site. Delete the file and it disappears. There is no database and no admin
page, because the repository is the CMS.

## Add an entry from the browser

1. Open the repository on GitHub and go to `content/entries/`.
2. Choose **Add file**, then **Create new file**.
3. Name it `YYYY-MM-short-name.md`, for example `2026-03-weather-app.md`.
4. Paste the template below and fill it in.
5. Commit to `main`, or open a pull request if you want the checks to run
   before it goes live.

Once the change is on `main`, the site at
https://evgenyvinnik.github.io/evgeny/ updates within a few minutes. The
**Actions** tab shows the run. If a check fails, the site keeps its previous
version, and the run log names the file and the field to fix.

## Add an entry on your computer

```bash
npm install
npm run dev
```

`npm run dev` builds the page and serves it at http://127.0.0.1:4173. It does
not watch for changes, so stop it with Ctrl+C and run it again after editing.

To validate every entry without building anything:

```bash
npm run check
```

## Template

```markdown
---
title: Weather app
lane: side
kind: project
start: 2026-03
tags: [swift, weatherkit]
link: https://github.com/evgenyvinnik/weather
---

One paragraph that sums it up. This is the text shown on the timeline.

Further paragraphs appear below it. The window scrolls to show them, and the
maximise button shows everything at once.
```

The block between the two `---` lines is the header. Everything after it is
the entry's text. Separate paragraphs with a blank line. The text is plain:
Markdown formatting such as `**bold**` or links shows up literally.

## Fields

| Field | Required | What to write | Example |
|---|---|---|---|
| `title` | yes | The name, shown in large type | `title: University` |
| `lane` | yes | `life`, `education`, `work` or `side` | `lane: work` |
| `kind` | yes | A short label, shown in the window and on project cards | `kind: position` |
| `start` | yes | When it began, from 1986 to 2026. The month is optional | `start: 2019-10` |
| `end` | no | When it ended: a year, a year and month, or `present`. Leave it out for a one-off event | `end: 2023` |
| `org` | no | The line under the title: company and role, school, or place | `org: Staff engineer` |
| `tags` | yes | A list in square brackets, with at least one tag | `tags: [go, kubernetes]` |
| `link` | no | A web address starting with `https://`, shown on the project's card | `link: https://example.com` |

## Lanes

| Lane | Use it for | Where it appears |
|---|---|---|
| `life` | moves, milestones, a first computer | the main line of the graph |
| `education` | schools, university, courses | its own branch |
| `work` | jobs and freelance work | its own branch |
| `side` | side projects, open source, writing | its own branch, and the Projects page |

A project is simply an entry with `lane: side`. Those are the only entries
listed on the Projects page.

## How the timeline places an entry

- **Position.** An entry sits at its most recent date: `end` if it has one,
  otherwise `start`. A job from 2019 to 2023 appears in 2023, and its branch
  runs back down to 2019.
- **Look.** The window takes the style of the era at that position. That same
  job appears as a macOS window. Change its end to 2020 and it becomes a
  Windows 10 window.
- **Order.** Dates decide the order, not file names. The `YYYY-MM-` prefix only
  keeps the folder tidy.

| Years | Era |
|---|---|
| 1986–1990 | Monochrome CRT |
| 1991–1994 | MS-DOS |
| 1995–1998 | Windows 95 |
| 1999–2000 | Windows 98 |
| 2001–2006 | Windows XP |
| 2007–2011 | Windows 7 |
| 2012–2015 | Ubuntu |
| 2016–2020 | Windows 10 |
| 2021–2024 | macOS |
| 2025–2026 | Liquid Glass |

## Mistakes the build catches

- **Text that starts with a square bracket.** `title: [Project]` is read as a
  list, not text. Wrap it in quotes: `title: "[Project]"`. Quote any value that
  starts with `[`, `{`, `*`, `&`, `!`, `%`, `@` or a backtick, or that contains
  a colon followed by a space.
- **Tags without brackets.** `tags: react, node` is one piece of text. Write
  `tags: [react, node]`.
- **Dates outside 1986 to 2026.** The timeline only covers those years, so an
  entry for 2027 needs the page's range extended first.
- **Misspelled fields.** An unknown field such as `tag:` stops the build rather
  than being quietly ignored.

A rejected build lists every problem at once, like this:

```
2 problems in the entries, so nothing was built:

  content/entries/2026-03-weather-app.md
    - "title" must be text. Text that starts with a square bracket needs quotes: title: "[Weather app]"
    - "lane" must be one of life, education, work, side (got "sides")

CONTENT.md describes every field.
```

## Editing and removing

To change an entry, edit its file. To remove one, delete its file. Both go
live the same way as a new entry.

## Not in Markdown yet

- The Links page, in the `LINKS` list inside `prototype/index.html`.
- The eras, their window styles and their wallpapers, also in
  `prototype/index.html`. To use a real wallpaper photo, see
  `prototype/wallpapers/README.md`.
