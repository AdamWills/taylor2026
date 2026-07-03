# Taylor the Turtle — Site Redesign (Phase 1: Homepage) — Design Spec

**Date:** 2026-07-03
**Status:** Approved direction; Phase 1 scope
**Context:** The previous design (current `src/`) was rejected on all fronts: too generic, off-brand, wrong tone, and weak structure. This is a from-scratch redesign. Direction was validated interactively via mockups (Direction "A — Sunny Paper", softened, on a sage base).

## Goals

- A distinctive, on-brand site that feels like it came from the same designer as the program's social media materials — but calmer and web-native ("inspired by, but softer").
- **Warm-professional tone, adult-to-adult.** Visitors are Caring Adults (parents, educators, funders, facilitators). Charm comes from the illustrations, not from cutesy copy or UI.
- Avoid AI-design tells: no cream background, no generic template layout.
- Static Astro site. Anything needing a backend (facilitator login, events admin) is stubbed and deferred.

## Visual System

### Palette
| Token | Value | Use |
|---|---|---|
| `sage` | `#F0F4E8` | Page/tinted-section background ("paper") |
| `sage-tile` | `#E7EEDA` | Tiles/cards on white sections |
| `forest` | `#2E4A26` | Headings, body text, footer background |
| `green` | `#4a7c3f` | Primary buttons, full-bleed band sections |
| `mustard` | `#F0B843` | Squiggle accents, "Book a Visit" CTA |
| `ochre` | `#C77D2B` | Headline emphasis words |
| `purple` | `#6740A8` (bg `#EFE7F7`) | Facilitator/educator moments only |
| white | `#FFFFFF` | Cards on tinted sections; alternating sections |

- Tinted sections carry a faint green grid texture (44px, ~6% opacity green lines) — the "paper" motif.
- On-green text is near-white `#FAFAF2`, muted `#d7e6c8`. Contrast must pass WCAG AA everywhere (check the green bands especially).

### Type
- **Fraunces** (variable, self-hosted via `@fontsource-variable/fraunces`) — display. Weight ~900, tight letter-spacing (−0.015em) for h1/h2; also used for card headings and stat numerals at smaller sizes.
- **Nunito Sans** (variable, self-hosted) — body and UI. 400/700/800.

### Motifs
- Hand-drawn SVG squiggles: mustard underline beneath the emphasized headline phrase; occasional squiggle flourishes. Used sparingly.
- Pill-shaped buttons: solid green (primary), outlined green (secondary), solid mustard (Book a Visit).
- Large rounded cards (18–24px radius), tilted overlapping colouring sheets, circular headshots with pale borders.
- Explicitly out: stamp badges, rotated eyebrow elements, cream backgrounds, drop-shadow-heavy "floaty" cards.

## Homepage Structure (validated order)

1. **Hero** — sage paper. Header nav (logo left; Teachings, Colouring Pages, Our Story, Events, Team; mustard "Book a Visit" pill). Straight uppercase eyebrow ("Est. 2010 · Brantford, Brant County & Six Nations"), Fraunces h1 with ochre emphasis + mustard squiggle underline, subhead, two CTAs, full group illustration (`MyBodyBelongsToMe.png`) sitting on the section base.
2. **What is Taylor** — white. "A little turtle with a big message" + program story paragraph + three fact tiles (16 years, 8 partners, 10 teachings).
3. **Taylor's Teachings** — green band. Three teaching cards (white, illustration + Fraunces title), "See all 10 teachings →" link.
4. **Who it's for** — white. Two cards: parents & families (sage-tile), educators & facilitators (purple).
5. **Colouring pages** — sage paper. Copy left, three tilted colouring sheets right, "Browse colouring pages" CTA.
6. **Upcoming events** — white. Date-tile list rows (sample data, clearly marked in code), "See all events" CTA.
7. **Team teaser** — green band. Circular headshots + "+N more", "Meet the team" mustard CTA.
8. **Grant recognition** — white, quiet band. Ministry funding text verbatim from the content PDF.
9. **Footer** — forest green. Logo/blurb + Learn / About / Connect link columns, socials (Facebook, Instagram, SoundCloud), phone 519.751.1164 x 206.

## Architecture

- **Stack:** Astro (static output) + Tailwind CSS 4, tokens defined in `@theme` in `src/styles/global.css`. Fonts via Fontsource packages.
- **Fresh `src/` rebuild.** Before any deletion, commit the current working tree to git so the old design stays recoverable.
- **Components:** `BaseLayout.astro` (head, fonts, global styles, skip link), `Header.astro` (desktop nav + mobile disclosure menu), `Footer.astro`, `Button.astro`, `Squiggle.astro`, section components as needed. Keep components small and single-purpose.
- **Data files (`src/data/`):** typed modules for `teachings` (all 10, title/illustration/colouring PDF), `team` (bios from the content PDF), `events` (sample entries flagged `PLACEHOLDER`). Pages render from data so later CMS/WordPress migration is mechanical.
- **Assets:** illustrations and headshots in `src/assets/`, optimized through `astro:assets`. Colouring PDFs served as downloads.
- **Stub pages:** every nav/footer destination gets a minimal on-design stub (h1 + one-liner + "coming soon") so nothing 404s: teachings, colouring, our-story, events, team, photos, articles, facilitators.

## Facilitator Login

Static stub this phase: `/facilitators` explains what trained facilitators will find and marks sign-in as coming soon. Real auth requires a backend — candidate paths (WordPress, Cloudflare Access, small Workers app) deliberately deferred; nothing in this design constrains the choice.

## Out of Scope (Phase 1)

Full teachings/history/team/events/photos/articles pages (Phase 2, after homepage sign-off); real events data; SoundCloud embed placement beyond a footer link; authentication; CMS.

## Verification

- `astro build` completes clean.
- Visual pass in dev server at ~375px, ~768px, ~1280px.
- Accessibility: semantic landmarks, single h1, alt text on all artwork, keyboard-reachable mobile nav, AA contrast (esp. text on green bands and mustard buttons).
