# Whimsy & Motion Design — taylorsrights.ca

**Date:** 2026-07-07
**Status:** Approved pending user review
**Builds on:** 2026-07-03-homepage-redesign-design.md

## Goal

Add playfulness to the site through animation while preserving the calm, storybook
integrity of the existing design. Whimsy is dosed in four layers, from
barely-perceptible to once-per-visit memorable. Motion supports the brand (gentle,
warm, hand-made) — it never competes with content.

## Approach

Pure CSS keyframes/transitions plus one small inline vanilla script (no libraries,
no framework JS):

- CSS animations and transitions defined in `src/styles/global.css` as utilities.
- A single `<script>` (in `BaseLayout.astro`) providing:
  - an `IntersectionObserver` that adds a `.is-revealed` class for scroll entrances;
  - the trigger + `sessionStorage` guard for the Taylor peek moment.
- All motion is `transform`/`opacity` only (compositor-friendly, no layout thrash).
- `prefers-reduced-motion: reduce` disables ambient loops and the peek entirely,
  and makes scroll reveals appear instantly (no fade, no rise).

## Motion principles

- **Durations:** interactions 150–250ms; scroll reveals 500–700ms; ambient loops 4–6s.
- **Easing:** entrances use a gentle overshoot curve (`cubic-bezier(0.34, 1.56, 0.64, 1)`
  or similar) to fake springiness; ambient uses `ease-in-out`.
- **Distances:** small. Reveals rise ≤14px; hover lifts ≤2px; ambient float ≤3px.
- **Frequency:** scroll reveals fire once (unobserve after reveal); the peek fires
  once per browser session.

## Layer 1 — Ambient life

The hero illustration (`MyBodyBelongsToMe.png` in `Hero.astro`) floats vertically
~3px on a slow ~5s `ease-in-out` infinite loop. Barely perceptible: the page feels
alive, not animated. No other element animates continuously.

## Layer 2 — Rewarded interactions

Still until touched; each response is quick, springy, transform-only:

- **Buttons (`Button.astro`):** on hover, lift 2px and tip ~1° with slight overshoot.
- **Colouring sheet collage (`Colouring.astro`):** sheets already sit at resting
  tilts; on hover a sheet straightens toward 0°, lifts, and gains a slightly
  deeper shadow — like paper being picked up.
- **Team teaser photos (`TeamTeaser.astro`):** a tiny happy tilt (~2°) + scale on hover.
- **Teaching/audience cards:** existing hover treatments gain the same lift-with-
  overshoot timing so the whole site shares one motion voice.

## Layer 3 — Scroll storytelling

Homepage sections ease in as they enter the viewport, like pages turning:

- Marked elements get `.reveal` (initial: opacity 0, translateY 14px).
- IntersectionObserver (threshold ~0.15) adds `.is-revealed` → transition to
  opacity 1, translateY 0 over ~600ms.
- Within a section, direct children stagger ~80ms apart (CSS sibling delays or
  a `--reveal-index` custom property).
- Each element reveals once; the observer unobserves after revealing.
- Content is never hidden from users without JS: the initial hidden state is
  applied via a class the script adds at startup (or `.reveal` styles are gated
  on `html.js`), so no-JS visitors see everything.

## Layer 4 — Signature: Taylor peeks in

Once per session, when the visitor scrolls ~two-thirds down the homepage, Taylor
peeks up from the bottom-right edge of the viewport, waves hello, and ducks back:

- **Asset:** crop of Taylor's head + waving hand from
  `IHaveTheRighToASafeBody.png` (standalone, transparent background).
- **Behaviour:** slides up (~450ms overshoot ease), holds ~2s with a gentle wave
  wobble, slides back down (~350ms ease-in). Total ≈ 3s.
- **Trigger:** sentinel element / scroll position observed near the bottom third
  of the page. Guarded by `sessionStorage` key (`taylor-peeked`) so it happens
  once per visit.
- **Accessibility:** container is `aria-hidden="true"`, `pointer-events: none`,
  `position: fixed`, and never overlaps interactive elements' hit areas. Entirely
  disabled under `prefers-reduced-motion: reduce`.
- Homepage only.

## Error handling / graceful degradation

- No JS → no hidden content, no peek; site fully usable.
- Reduced motion → instant reveals, no loops, no peek.
- Old browsers without IntersectionObserver → script exits early; content visible.

## Testing

- Manual: verify each layer on desktop + mobile viewport; verify reveals fire once;
  verify peek fires once per session (clear `sessionStorage` to retest).
- Toggle `prefers-reduced-motion` in DevTools → no ambient loop, no peek,
  instant reveals.
- Disable JS → all content visible.
- `npm run build` passes.
