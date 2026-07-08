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

## Amendment (2026-07-08) — 3D pushable buttons

Buttons upgrade from the Layer-2 lift-and-tilt hover to a three-layer "pushable"
construction (technique after Josh Comeau's 3D button article, re-implemented in
our own Tailwind idiom): a blurred shadow span, a darker edge span, and a raised
front face. The front rests 4px up, rises to 6px on hover with a springy
overshoot, presses down to 2px in ~34ms on `:active`, and releases back over
600ms. All four variants get the treatment, including secondary (milk front,
pine border and edge). Edge colours: primary→forest, secondary→pine,
mustard→ochre, plum→darker plum. Movement replaces the previous hover colour
change; the hover tilt is removed (a tilting pushable object breaks the
physical metaphor). Focus states remain `focus-visible`-only.

## Amendment (2026-07-08) — peek frequency and size

The peek now plays once per page load instead of once per session: the
sessionStorage guard confused even the site owner ("why did he stop?"), and the
audience (parents with small children) rewards repetition — a kid who wants to
see the turtle again can reload the page. The observer still disconnects after
one fire per load, so scrolling up and down cannot replay him. Taylor is also
doubled in size (150px → 300px wide); the percent-based keyframes scale with
the element, so proportions are unchanged.

## Amendment (2026-07-08) — hero cast rebuild

The hero's flat group PNG is replaced by `HeroCast.astro`: seven individually
positioned character layers (trimmed assets in `src/assets/cast/`) on a
2.03:1 stage. Three behaviours, all CSS-only:

- **Curtain call:** each friend pops into place on load (scale 0.6 → overshoot
  → settle), staggered 100ms apart.
- **Skate-in:** Taylor enters last from off-screen left on his skateboard
  (1.3s decelerating ease, small brake-tilt before settling front-centre).
- **Life:** each character idles on its own duration and phase (4.4–6.1s) so
  the group never bobs in sync, and hops with a slight tilt when hovered.

Entrance animates the outer slot, idle/hop animate the inner img, so the two
transforms never conflict. Reduced motion disables all cast animation (static
group, fully visible). The container carries `role="img"` with a scene
description; individual images are decorative (`alt=""`). The old
`float-gentle` hero treatment is retired.

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
