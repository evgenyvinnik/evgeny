---
title: evgeny.fyi
lane: side
kind: this site
start: 2025-11
org: This page
tags: [astro, github pages]
---

A biography that wears the interface of every year it describes. Forty years
of design history compiled to one static site.

Ten interface eras, each with its own wallpaper, window furniture and
desktop shell, cross-faded against scroll position. The caption buttons
work: close hides an entry, minimise folds it to its title bar, maximise
lifts it out of the timeline.

The hard part was not the chrome. It was keeping three things in agreement
at every scroll position: the year in the header, the wallpaper behind the
page, and the era of the window you are looking at. Layout compresses empty
years and pushes colliding entries down, so the map between pixels and years
is a table built at layout time rather than a formula.

There is a Playwright suite behind it. One screenshot per era, plus
invariants that assert the three things still agree and that walking down
the page never moves forward in time.
