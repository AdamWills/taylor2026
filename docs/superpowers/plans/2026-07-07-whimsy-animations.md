# Whimsy & Motion System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a four-layer motion system (ambient hero float, springy hover interactions, one-time scroll reveals, and a once-per-session "Taylor peeks in" signature moment) to the taylorsrights.ca homepage.

**Architecture:** Pure CSS keyframes/transitions defined in `src/styles/global.css`, plus two small vanilla scripts: an IntersectionObserver in `BaseLayout.astro` that reveals `.reveal` elements once, and a scoped script in a new `TaylorPeek.astro` component that plays the peek animation once per session. All motion is `transform`/`opacity` only. A `js` class on `<html>` gates hidden states so no-JS visitors see everything.

**Tech Stack:** Astro 5, Tailwind CSS v4 (CSS-first config via `@theme`/`@utility`), vanilla JS. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-07-07-whimsy-animations-design.md`

## Global Constraints

- No new npm dependencies.
- All animation uses `transform` and `opacity` only — never layout properties.
- `prefers-reduced-motion: reduce` must disable the ambient float and the Taylor peek entirely, and make scroll reveals appear instantly.
- No-JS visitors must see all content (hidden states gated on `html.js`).
- Durations: interactions 150–250ms; scroll reveals ~600ms; ambient loop ~5s.
- Overshoot easing for interactive/entrance motion: `cubic-bezier(0.34, 1.56, 0.64, 1)`.
- Scroll reveals and the peek fire once (unobserve/disconnect after firing).
- Taylor peek is homepage-only, `aria-hidden="true"`, `pointer-events: none`, guarded by `sessionStorage` key `taylor-peeked`.
- This is a static site with no test runner: each task is verified with `npm run build` (must exit 0) plus a described manual check in the dev server (`npm run dev`, http://localhost:4321).

---

### Task 1: Motion foundation — CSS utilities, `js` class bootstrap, reveal observer

**Files:**
- Modify: `src/styles/global.css`
- Modify: `src/layouts/BaseLayout.astro`

**Interfaces:**
- Produces: CSS classes `.reveal` (+ `--reveal-delay` custom property), `.is-revealed`, `.float-gentle`, `.taylor-peek`, `.is-peeking`, and `@keyframes float-gentle` / `taylor-peek`. Later tasks only add these class names to markup.
- Produces: `html.js` class set before first paint; an IntersectionObserver that adds `.is-revealed` to every `.reveal` element on any page.

- [ ] **Step 1: Append motion CSS to `src/styles/global.css`**

Add this block at the end of the file (after the `display-tight` utility):

```css
/* Motion system — spec docs/superpowers/specs/2026-07-07-whimsy-animations-design.md */

/* Layer 1: ambient */
@keyframes float-gentle {
	0%,
	100% {
		transform: translateY(0);
	}
	50% {
		transform: translateY(-3px);
	}
}
.float-gentle {
	animation: float-gentle 5s ease-in-out infinite;
}

/* Layer 3: scroll reveals — hidden state only when JS is running.
   Reveals use an animation (not a transition) so they never touch the
   `transition` property — Tailwind hover transitions on the same element
   (e.g. teaching cards) keep working. `backwards` fill holds the hidden
   state through the stagger delay; after the animation ends the static
   opacity/transform rules below take over. */
.js .reveal {
	opacity: 0;
	transform: translateY(14px);
}
.js .reveal.is-revealed {
	opacity: 1;
	transform: none;
	animation: reveal-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) backwards;
	animation-delay: var(--reveal-delay, 0ms);
}
@keyframes reveal-in {
	from {
		opacity: 0;
		transform: translateY(14px);
	}
	to {
		opacity: 1;
		transform: none;
	}
}

/* Layer 4: Taylor peeks in */
.taylor-peek {
	position: fixed;
	right: clamp(1rem, 5vw, 3.5rem);
	bottom: 0;
	z-index: 40;
	width: 150px;
	pointer-events: none;
	transform: translateY(102%);
}
.taylor-peek.is-peeking {
	animation: taylor-peek 3.4s ease-in-out forwards;
}
@keyframes taylor-peek {
	0% {
		transform: translateY(102%) rotate(0deg);
	}
	12% {
		transform: translateY(38%) rotate(-2deg);
	}
	18% {
		transform: translateY(42%) rotate(0deg);
	}
	32% {
		transform: translateY(42%) rotate(-5deg);
	}
	46% {
		transform: translateY(42%) rotate(3deg);
	}
	58% {
		transform: translateY(42%) rotate(0deg);
	}
	86% {
		transform: translateY(42%) rotate(0deg);
	}
	100% {
		transform: translateY(102%) rotate(0deg);
	}
}

@media (prefers-reduced-motion: reduce) {
	.float-gentle {
		animation: none;
	}
	.js .reveal,
	.js .reveal.is-revealed {
		opacity: 1;
		transform: none;
		animation: none;
	}
	.taylor-peek {
		display: none;
	}
}
```

- [ ] **Step 2: Bootstrap the `js` class and reveal observer in `BaseLayout.astro`**

In `src/layouts/BaseLayout.astro`, add an inline script as the last element of `<head>` (after `<title>{title}</title>`). It must be `is:inline` so it runs before first paint — a bundled module script would run after render and cause a visible flash (content renders visible, then hides, then animates in):

```html
<script is:inline>
	document.documentElement.classList.add('js');
</script>
```

Then add the reveal observer script just before `</body>` (after `<slot />`). This is a normal Astro script (bundled, deferred):

```html
<script>
	const revealEls = document.querySelectorAll('.reveal');
	if ('IntersectionObserver' in window) {
		const io = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						entry.target.classList.add('is-revealed');
						io.unobserve(entry.target);
					}
				}
			},
			{ threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
		);
		revealEls.forEach((el) => io.observe(el));
	} else {
		revealEls.forEach((el) => el.classList.add('is-revealed'));
	}
</script>
```

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: exits 0, no warnings about the new CSS or scripts.

- [ ] **Step 4: Manual check**

Run `npm run dev`, open http://localhost:4321. Confirm in devtools that `<html>` has class `js` and the page looks identical to before (no element uses the new classes yet).

- [ ] **Step 5: Commit**

```bash
git add src/styles/global.css src/layouts/BaseLayout.astro
git commit -m "Motion foundation: reveal observer, ambient/peek keyframes, reduced-motion guards"
```

---

### Task 2: Layer 1 — ambient float on the hero illustration

**Files:**
- Modify: `src/components/home/Hero.astro`

**Interfaces:**
- Consumes: `.float-gentle` from Task 1.

- [ ] **Step 1: Add the float class to the hero image**

In `src/components/home/Hero.astro`, change the `<Image>` class:

```diff
-				class="mx-auto mt-9 w-full max-w-[880px]"
+				class="float-gentle mx-auto mt-9 w-full max-w-[880px]"
```

- [ ] **Step 2: Verify**

Run: `npm run build` — expected: exits 0.
In the dev server, watch the hero illustration for ~10 seconds: it should drift up and down ~3px, slowly enough that you only notice when looking for it. Toggle "Emulate CSS media feature prefers-reduced-motion" in devtools Rendering panel: the float must stop.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/Hero.astro
git commit -m "Hero illustration breathes: barely-perceptible ambient float"
```

---

### Task 3: Layer 2 — springy hover interactions

**Files:**
- Modify: `src/components/Button.astro`
- Modify: `src/components/home/Colouring.astro`
- Modify: `src/components/home/TeamTeaser.astro`
- Modify: `src/components/home/TeachingsBand.astro`
- Modify: `src/components/home/Audiences.astro`

**Interfaces:**
- Consumes: nothing from earlier tasks (Tailwind utilities only).
- Produces: nothing later tasks rely on. One shared motion voice: 200ms, `cubic-bezier(0.34, 1.56, 0.64, 1)` overshoot easing, transform-only.

- [ ] **Step 1: Buttons lift and tip on hover**

In `src/components/Button.astro`, change the base class string on the `<a>`:

```diff
-		class:list={[
-			'inline-block rounded-full px-6 py-3 text-[16px] font-extrabold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest',
+		class:list={[
+			'inline-block rounded-full px-6 py-3 text-[16px] font-extrabold transition-[color,background-color,translate,rotate] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5 hover:-rotate-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest',
			variants[variant],
			className,
		]}
```

(Tailwind v4 implements `translate-*`/`rotate-*` with the CSS `translate`/`rotate` properties, so they are transitioned by name and compose without clobbering each other.)

- [ ] **Step 2: Colouring sheets pick up like paper**

In `src/components/home/Colouring.astro`, change the `<Image>` class list:

```diff
-						class:list={['absolute w-[40%] max-w-64 border border-forest/10 bg-white shadow-lg', cls]}
+						class:list={[
+							'absolute w-[40%] max-w-64 border border-forest/10 bg-white shadow-lg transition-[translate,rotate,box-shadow] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:z-20 hover:-translate-y-1.5 hover:rotate-0 hover:shadow-xl',
+							cls,
+						]}
```

The resting tilts in the `sheets` array (`-rotate-[5deg]` etc.) are rotate utilities, so `hover:rotate-0` straightens each sheet on hover.

- [ ] **Step 3: Align team-photo hover with the shared motion voice**

In `src/components/home/TeamTeaser.astro`, in BOTH the `<Image>` class list and the fallback `<span>` class list, change:

```diff
-'... transition duration-200 ease-out group-hover:-translate-y-1 group-hover:rotate-0 group-hover:scale-110',
+'... transition duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-1 group-hover:rotate-0 group-hover:scale-110',
```

(Only `ease-out` changes to the arbitrary easing; everything else in those class strings stays.)

- [ ] **Step 4: Teaching cards and audience cards lift gently**

In `src/components/home/TeachingsBand.astro`, change the card `<li>`:

```diff
-					<li class="rounded-3xl bg-white p-4 pb-6 text-center">
+					<li class="rounded-3xl bg-white p-4 pb-6 text-center transition-[translate] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1">
```

In `src/components/home/Audiences.astro`, change both `<article>` elements:

```diff
-			<article class="flex flex-col items-start gap-4 rounded-3xl bg-sage-tile p-8">
+			<article class="flex flex-col items-start gap-4 rounded-3xl bg-sage-tile p-8 transition-[translate] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1">
```

```diff
-			<article class="flex flex-col items-start gap-4 rounded-3xl bg-plum-tint p-8">
+			<article class="flex flex-col items-start gap-4 rounded-3xl bg-plum-tint p-8 transition-[translate] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1">
```

- [ ] **Step 5: Verify**

Run: `npm run build` — expected: exits 0.
In the dev server, hover each element type and confirm: buttons lift 2px with a ~1° tip and a slight springy overshoot; colouring sheets straighten, lift, and come to the front; team photos behave as before but with a livelier settle; teaching and audience cards rise 4px. Nothing moves until hovered.

- [ ] **Step 6: Commit**

```bash
git add src/components/Button.astro src/components/home/Colouring.astro src/components/home/TeamTeaser.astro src/components/home/TeachingsBand.astro src/components/home/Audiences.astro
git commit -m "Rewarded interactions: springy transform-only hovers with one shared motion voice"
```

---

### Task 4: Layer 3 — scroll reveals on homepage sections

**Files:**
- Modify: `src/components/home/Intro.astro`
- Modify: `src/components/home/TeachingsBand.astro`
- Modify: `src/components/home/Audiences.astro`
- Modify: `src/components/home/Colouring.astro`
- Modify: `src/components/home/EventsList.astro`
- Modify: `src/components/home/TeamTeaser.astro`
- Modify: `src/components/home/GrantBand.astro`

**Interfaces:**
- Consumes: `.reveal` / `--reveal-delay` CSS and the BaseLayout observer from Task 1.
- Pattern: headings get `class="reveal"` with no delay; the elements after them stagger via `style="--reveal-delay: 80ms"`, `160ms`, etc. List items stagger by index: `style={`--reveal-delay: ${index * 80}ms`}`. The Hero deliberately gets NO reveal classes (it has ambient float and is above the fold).

- [ ] **Step 1: Intro**

In `src/components/home/Intro.astro`:

```diff
-			<h2 class="display-tight mx-auto max-w-[35ch] text-3xl text-balance lg:text-4xl">
+			<h2 class="reveal display-tight mx-auto max-w-[35ch] text-3xl text-balance lg:text-4xl">
```

```diff
-			<p class="mx-auto mt-5 max-w-[60ch] text-forest/80 text-pretty">
+			<p class="reveal mx-auto mt-5 max-w-[60ch] text-forest/80 text-pretty" style="--reveal-delay: 80ms">
```

```diff
-				{pillars.map(({ title, text }, index) => (
-					<li>
+				{pillars.map(({ title, text }, index) => (
+					<li class="reveal" style={`--reveal-delay: ${160 + index * 80}ms`}>
```

```diff
-			<p class="mx-auto mt-12 max-w-[60ch] text-[15px] text-forest/80">
+			<p class="reveal mx-auto mt-12 max-w-[60ch] text-[15px] text-forest/80" style="--reveal-delay: 160ms">
```

- [ ] **Step 2: TeachingsBand**

In `src/components/home/TeachingsBand.astro`:

```diff
-			<h2 class="display-tight text-center text-3xl text-milk lg:text-4xl">Taylor's Teachings</h2>
+			<h2 class="reveal display-tight text-center text-3xl text-milk lg:text-4xl">Taylor's Teachings</h2>
```

```diff
-			<p class="mx-auto mt-3 max-w-[60ch] text-center text-[16.5px] text-milk">
+			<p class="reveal mx-auto mt-3 max-w-[60ch] text-center text-[16.5px] text-milk" style="--reveal-delay: 80ms">
```

```diff
-				{featuredTeachings.map(({ title, image }) => (
-					<li class="rounded-3xl bg-white p-4 pb-6 text-center transition-[translate] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1">
+				{featuredTeachings.map(({ title, image }, index) => (
+					<li
+						class="reveal rounded-3xl bg-white p-4 pb-6 text-center transition-[translate] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1"
+						style={`--reveal-delay: ${160 + index * 80}ms`}
+					>
```

Note: the reveal is animation-based (Task 1) precisely so it composes with the hover utility on these cards — the reveal animates `opacity`/`transform` via `@keyframes` while the hover transitions the separate `translate` property; neither touches the other.

- [ ] **Step 3: Audiences**

In `src/components/home/Audiences.astro`, add to both articles (delays 0ms and 80ms):

```diff
-			<article class="flex flex-col items-start gap-4 rounded-3xl bg-sage-tile p-8 transition-[translate] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1">
+			<article class="reveal flex flex-col items-start gap-4 rounded-3xl bg-sage-tile p-8 transition-[translate] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1">
```

```diff
-			<article class="flex flex-col items-start gap-4 rounded-3xl bg-plum-tint p-8 transition-[translate] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1">
+			<article
+				class="reveal flex flex-col items-start gap-4 rounded-3xl bg-plum-tint p-8 transition-[translate] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1"
+				style="--reveal-delay: 80ms"
+			>
```

- [ ] **Step 4: Colouring**

In `src/components/home/Colouring.astro`, reveal the text column and the collage as two staggered blocks:

```diff
-			<div>
+			<div class="reveal">
```

```diff
-			<div class="relative h-72 sm:h-96" aria-hidden="true">
+			<div class="reveal relative h-72 sm:h-96" aria-hidden="true" style="--reveal-delay: 120ms">
```

- [ ] **Step 5: EventsList**

In `src/components/home/EventsList.astro`:

```diff
-			<h2 class="display-tight text-3xl lg:text-4xl">Come say hi to Taylor</h2>
+			<h2 class="reveal display-tight text-3xl lg:text-4xl">Come say hi to Taylor</h2>
```

```diff
-				{events.map(({ date, title, details }) => (
-					<li class="flex items-center gap-5 border-t-[1.5px] border-sage-tile py-4">
+				{events.map(({ date, title, details }, index) => (
+					<li
+						class="reveal flex items-center gap-5 border-t-[1.5px] border-sage-tile py-4"
+						style={`--reveal-delay: ${80 + index * 80}ms`}
+					>
```

- [ ] **Step 6: TeamTeaser and GrantBand**

In `src/components/home/TeamTeaser.astro`, reveal the section content as three blocks:

```diff
-			<h2 class="display-tight text-3xl text-milk lg:text-4xl">The people behind the turtle</h2>
+			<h2 class="reveal display-tight text-3xl text-milk lg:text-4xl">The people behind the turtle</h2>
```

```diff
-			<p class="mx-auto mt-3 max-w-[56ch] text-[16.5px] text-milk">
+			<p class="reveal mx-auto mt-3 max-w-[56ch] text-[16.5px] text-milk" style="--reveal-delay: 80ms">
```

```diff
-			<ul class="mx-auto mt-9 flex max-w-[680px] flex-wrap justify-center gap-x-4 gap-y-6" role="list">
+			<ul
+				class="reveal mx-auto mt-9 flex max-w-[680px] flex-wrap justify-center gap-x-4 gap-y-6"
+				role="list"
+				style="--reveal-delay: 160ms"
+			>
```

(The `<ul>` reveals as one block — per-face staggering across ~10 avatars would take too long.)

In `src/components/home/GrantBand.astro`:

```diff
-			<div class="mx-auto max-w-[52rem] rounded-3xl bg-sage-tile px-8 py-9 text-center">
+			<div class="reveal mx-auto max-w-[52rem] rounded-3xl bg-sage-tile px-8 py-9 text-center">
```

- [ ] **Step 7: Verify**

Run: `npm run build` — expected: exits 0.
In the dev server: reload at the top, scroll down slowly. Each section's heading fades up first, followed by its children ~80ms apart. Scroll back up and down again — nothing re-animates. Emulate `prefers-reduced-motion: reduce` and reload: everything is visible immediately with no fades. Disable JS (devtools command menu → "Disable JavaScript") and reload: all content visible.

- [ ] **Step 8: Commit**

```bash
git add src/components/home/
git commit -m "Scroll storytelling: sections fade up once with staggered children"
```

---

### Task 5: Layer 4 — Taylor peeks in

**Files:**
- Create: `src/components/home/TaylorPeek.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `.taylor-peek` / `.is-peeking` CSS and `@keyframes taylor-peek` from Task 1; asset `src/assets/IHaveTheRighToASafeBody.png` (standalone waving Taylor, transparent background).
- Produces: `<TaylorPeek />` component whose in-flow sentinel div marks the scroll trigger point.

- [ ] **Step 1: Create the component**

Create `src/components/home/TaylorPeek.astro`:

```astro
---
import { Image } from 'astro:assets';
import taylor from '../../assets/IHaveTheRighToASafeBody.png';
---

<div id="taylor-peek-sentinel"></div>
<div id="taylor-peek" class="taylor-peek" aria-hidden="true">
	<Image src={taylor} alt="" width={300} class="w-full" loading="lazy" />
</div>

<script>
	const peek = document.getElementById('taylor-peek');
	const sentinel = document.getElementById('taylor-peek-sentinel');
	const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	let alreadyPeeked = false;
	try {
		alreadyPeeked = sessionStorage.getItem('taylor-peeked') === '1';
	} catch {
		/* privacy modes that block storage: treat as not yet peeked */
	}

	if (peek && sentinel && !reduceMotion && !alreadyPeeked && 'IntersectionObserver' in window) {
		const io = new IntersectionObserver((entries) => {
			if (entries.some((entry) => entry.isIntersecting)) {
				io.disconnect();
				try {
					sessionStorage.setItem('taylor-peeked', '1');
				} catch {
					/* ignore */
				}
				peek.classList.add('is-peeking');
				peek.addEventListener('animationend', () => peek.remove());
			}
		});
		io.observe(sentinel);
	} else {
		peek?.remove();
	}
</script>
```

Notes for the implementer:
- The sentinel is an empty zero-height div in normal flow; the peek div is `position: fixed` (from `.taylor-peek`), so placement of the component in `index.astro` controls only the *trigger point*, not where Taylor appears (always bottom-right of the viewport).
- The image is Taylor waving; `.taylor-peek` at `width: 150px` with the keyframes' `translateY(42%)` hold shows his hat, face, and waving hand above the viewport edge.
- `animationend` removal keeps him out of the way permanently after the moment plays.

- [ ] **Step 2: Wire into the homepage at the two-thirds point**

In `src/pages/index.astro`, import and place the component between `<EventsList />` and `<TeamTeaser />` (roughly two-thirds down the page):

```diff
 import EventsList from '../components/home/EventsList.astro';
 import TeamTeaser from '../components/home/TeamTeaser.astro';
 import GrantBand from '../components/home/GrantBand.astro';
+import TaylorPeek from '../components/home/TaylorPeek.astro';
```

```diff
 			<EventsList />
+			<TaylorPeek />
 			<TeamTeaser />
```

- [ ] **Step 3: Verify**

Run: `npm run build` — expected: exits 0.
In the dev server (fresh tab or after `sessionStorage.removeItem('taylor-peeked')` in the console):
1. Scroll down past the events list → Taylor slides up from the bottom-right, wobbles a hello for ~2s, ducks back down, and the element is removed from the DOM.
2. Reload and scroll again → he does NOT reappear (sessionStorage guard).
3. `sessionStorage.removeItem('taylor-peeked')`, emulate `prefers-reduced-motion: reduce`, reload, scroll → nothing appears.
4. Confirm the peek div has `pointer-events: none` and `aria-hidden="true"` (inspect before triggering).

- [ ] **Step 4: Commit**

```bash
git add src/components/home/TaylorPeek.astro src/pages/index.astro
git commit -m "Signature moment: Taylor peeks in once per visit"
```

---

### Task 6: Full-system verification pass

**Files:** none (verification only).

- [ ] **Step 1: Build**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 2: Cross-cutting manual checks in the dev server**

1. **Full journey:** fresh session, load homepage, scroll top to bottom. Ambient float on hero, sections revealing once, Taylor peeking once. No horizontal scrollbar at 375px, 768px, 1440px widths (the fixed peek must not widen the page).
2. **Reduced motion:** emulate `prefers-reduced-motion: reduce`, clear sessionStorage, reload. No float, no peek, instant reveals, hovers still functional but calm.
3. **No JS:** disable JavaScript, reload. All content visible, no peek, no errors.
4. **Other pages:** open `/teachings` and `/team` — no console errors from the reveal observer (zero `.reveal` elements is fine), no Taylor.

- [ ] **Step 3: Fix anything found, then final commit if changes were made**

```bash
git add -A
git commit -m "Motion system: verification fixes"
```
