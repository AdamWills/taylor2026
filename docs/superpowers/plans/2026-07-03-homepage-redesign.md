# Homepage Redesign (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the taylorsrights.ca homepage from scratch per the approved spec (`docs/superpowers/specs/2026-07-03-homepage-redesign-design.md`): sage design system, Fraunces/Nunito Sans, nine validated sections, typed data files, stub pages for every nav destination.

**Architecture:** Static Astro 6 site, Tailwind CSS 4 via `@tailwindcss/vite` with all design tokens in `@theme` in `src/styles/global.css`. Section components live under `src/components/home/`; shared chrome under `src/components/`. Content that will grow (teachings, team, events) lives in typed modules under `src/data/`.

**Tech Stack:** Astro ^6.1.8, Tailwind ^4.2.4, `@fontsource-variable/fraunces`, `@fontsource-variable/nunito-sans`. Node >= 22.12. No test framework exists — the test cycle for every task is `npm run build` plus `grep` assertions against `dist/` output.

## Global Constraints

- Palette (exact values from spec): sage `#F0F4E8`, sage-tile `#E7EEDA`, forest `#2E4A26`, pine (primary green) `#4A7C3F`, mustard `#F0B843`, ochre `#C77D2B`, plum `#6740A8`, plum-tint `#EFE7F7`, on-green text `#FAFAF2`, on-green muted `#D7E6C8`.
- Fonts: Fraunces (display, ~900 weight, letter-spacing −0.015em for h1/h2), Nunito Sans (body). Self-hosted via Fontsource — no external font URLs anywhere (delete the old Good Dog `@font-face` that loads from onlinewebfonts.com).
- Explicitly banned: cream backgrounds (`#FBF6E7`/`#FAF6EF` family), stamp badges, rotated eyebrow elements.
- Tone: adult-to-adult, warm-professional. No exclamation-heavy UI copy (the teachings' own titles keep their `!!` — that's program content, not UI copy).
- Grant recognition text must be verbatim from the spec (§ Homepage Structure item 8).
- Every nav/footer destination must resolve (stub pages, no 404s, no `href="#"`).
- Events data is sample-only and must be marked `PLACEHOLDER` in the data file.
- All commits end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

## File Structure

```
src/
  styles/global.css            (rewrite: tokens + base + paper utility)
  layouts/BaseLayout.astro     (rewrite: fonts, head, skip link)
  components/
    Button.astro               (rewrite: pill variants primary/secondary/mustard/plum)
    Squiggle.astro             (new: hand-drawn SVG underline)
    Header.astro               (new: desktop nav + mobile disclosure)
    Footer.astro               (new: forest footer, link columns)
    StubPage.astro             (new: shared stub-page shell)
    home/
      Hero.astro               (new: section 1)
      Intro.astro              (new: section 2)
      TeachingsBand.astro      (new: section 3)
      Audiences.astro          (new: section 4)
      Colouring.astro          (new: section 5)
      EventsList.astro         (new: section 6)
      TeamTeaser.astro         (new: section 7)
      GrantBand.astro          (new: section 8)
  data/
    teachings.ts               (new: all 10 teachings, images + PDFs)
    team.ts                    (new: people from content PDF, headshots)
    events.ts                  (new: PLACEHOLDER sample events)
  assets/
    team/                      (new: kebab-case headshots copied from docs/)
    colouring-previews/        (new: 3 colouring-book JPGs copied from docs/)
  pages/
    index.astro                (rewrite: assembles the 9 sections)
    teachings.astro, colouring.astro, our-story.astro, events.astro,
    team.astro, photos.astro, articles.astro, facilitators.astro,
    book-a-visit.astro         (new: stubs)
Deleted: src/pages/design-system.astro, src/components/{SiteHeader,SiteFooter,
TeachingCard,SectionHeading,IllustrationPlaceholder}.astro,
public/contrast-comparison.html
```

---

### Task 1: Archive the old design and stage assets

**Files:**
- Modify: git index only (archive commit of the entire current tree)
- Create: `src/assets/team/*.jpg|png` (10 files), `src/assets/colouring-previews/colour-{1,2,3}.jpg`

**Interfaces:**
- Produces: headshot paths `src/assets/team/<kebab-name>.<ext>` and preview paths `src/assets/colouring-previews/colour-N.jpg` consumed by Tasks 5 and 7.

- [ ] **Step 1: Commit the current tree as an archive point**

```bash
git add -A
git commit -m "Archive rejected first-pass design before rebuild

Full snapshot of the previous design so it stays recoverable.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

- [ ] **Step 2: Copy headshots and colouring previews into src/assets**

```bash
mkdir -p src/assets/team src/assets/colouring-previews
cp "docs/Team Headshots/Carrie Sinkowski.jpg"  src/assets/team/carrie-sinkowski.jpg
cp "docs/Team Headshots/Katie Sinkowski.jpg"   src/assets/team/katie-sinkowski.jpg
cp "docs/Team Headshots/John Sinkowski.jpg"    src/assets/team/john-sinkowski.jpg
cp "docs/Team Headshots/Jean Sinkowski.jpg"    src/assets/team/jean-sinkowski.jpg
cp "docs/Team Headshots/Jezeth Esmas.jpg"      src/assets/team/jezeth-esmas.jpg
cp "docs/Team Headshots/Alex Klapwyk.jpg"      src/assets/team/alex-klapwyk.jpg
cp "docs/Team Headshots/Misty Greene.jpg"      src/assets/team/misty-greene.jpg
cp "docs/Team Headshots/Marcia Oliver.JPG"     src/assets/team/marcia-oliver.jpg
cp "docs/Team Headshots/Kasey Politano.png"    src/assets/team/kasey-politano.png
cp "docs/Team Headshots/Jenn Root.jpg"         src/assets/team/jenn-root.jpg
cp "docs/coloring-book/Taylor-colouring(3)_FINAL-02.jpg" src/assets/colouring-previews/colour-1.jpg
cp "docs/coloring-book/Taylor-colouring(3)_FINAL-05.jpg" src/assets/colouring-previews/colour-2.jpg
cp "docs/coloring-book/Taylor-colouring(3)_FINAL-08.jpg" src/assets/colouring-previews/colour-3.jpg
```

- [ ] **Step 3: Verify the copies**

Run: `ls src/assets/team | wc -l && ls src/assets/colouring-previews`
Expected: `10` and `colour-1.jpg colour-2.jpg colour-3.jpg`

- [ ] **Step 4: Commit**

```bash
git add src/assets/team src/assets/colouring-previews
git commit -m "Stage team headshots and colouring previews as build assets

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Design tokens, fonts, and base layout

**Files:**
- Modify: `src/styles/global.css` (full rewrite), `src/layouts/BaseLayout.astro` (full rewrite), `src/pages/index.astro` (temporary shell), `package.json` (font deps)
- Delete: `src/pages/design-system.astro`, `src/components/SiteHeader.astro`, `src/components/SiteFooter.astro`, `src/components/TeachingCard.astro`, `src/components/SectionHeading.astro`, `src/components/IllustrationPlaceholder.astro`, `public/contrast-comparison.html`

**Interfaces:**
- Produces: Tailwind tokens `sage, sage-tile, forest, pine, mustard, ochre, plum, plum-tint, milk, mist` (as `--color-*`), `font-display`, `font-body`, utility class `paper` (sage + grid texture), class `container-site` (max-width wrapper). `BaseLayout.astro` props: `{ title: string; description?: string }` with a default description. All later tasks rely on these exact names.

- [ ] **Step 1: Install self-hosted fonts**

```bash
npm install @fontsource-variable/fraunces @fontsource-variable/nunito-sans
```

- [ ] **Step 2: Delete the old design's components and pages**

```bash
rm src/pages/design-system.astro public/contrast-comparison.html \
   src/components/SiteHeader.astro src/components/SiteFooter.astro \
   src/components/TeachingCard.astro src/components/SectionHeading.astro \
   src/components/IllustrationPlaceholder.astro
```

- [ ] **Step 3: Rewrite `src/styles/global.css`**

```css
@import 'tailwindcss';

@theme {
	/* Palette — spec §Visual System */
	--color-sage: #f0f4e8;
	--color-sage-tile: #e7eeda;
	--color-forest: #2e4a26;
	--color-pine: #4a7c3f;
	--color-mustard: #f0b843;
	--color-ochre: #c77d2b;
	--color-plum: #6740a8;
	--color-plum-tint: #efe7f7;
	--color-milk: #fafaf2; /* text on green */
	--color-mist: #d7e6c8; /* muted text on green */

	--font-display: 'Fraunces Variable', Georgia, serif;
	--font-body: 'Nunito Sans Variable', system-ui, sans-serif;
}

@layer base {
	html {
		@apply scroll-smooth bg-sage text-forest antialiased;
		font-family: var(--font-body);
		font-size: 17px;
		line-height: 1.55;
	}
	::selection {
		@apply bg-mustard/60;
	}
}

@utility paper {
	background-color: var(--color-sage);
	background-image:
		linear-gradient(rgb(74 124 63 / 0.07) 1px, transparent 1px),
		linear-gradient(90deg, rgb(74 124 63 / 0.07) 1px, transparent 1px);
	background-size: 44px 44px;
}

@utility container-site {
	margin-inline: auto;
	width: 100%;
	max-width: 72rem;
	padding-inline: clamp(1.25rem, 4vw, 2.5rem);
}

@utility display-tight {
	font-family: var(--font-display);
	font-weight: 900;
	letter-spacing: -0.015em;
	font-variation-settings: 'opsz' 72;
}
```

- [ ] **Step 4: Rewrite `src/layouts/BaseLayout.astro`**

```astro
---
import '@fontsource-variable/fraunces';
import '@fontsource-variable/nunito-sans';
import '../styles/global.css';

interface Props {
	title: string;
	description?: string;
}

const {
	title,
	description = 'Taylor the Turtle helps caring adults teach children about body rights, feelings, and safety — a community program of SAC Brant and Ganohkwasra.',
} = Astro.props;
---

<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<meta name="description" content={description} />
		<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
		<title>{title}</title>
	</head>
	<body>
		<a
			href="#main"
			class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-forest focus:px-5 focus:py-2.5 focus:font-bold focus:text-milk"
		>
			Skip to content
		</a>
		<slot />
	</body>
</html>
```

- [ ] **Step 5: Replace `src/pages/index.astro` with a temporary shell**

(The real homepage is assembled in Task 7; this keeps the build green meanwhile.)

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="Taylor the Turtle — Children Have Rights">
	<main id="main" class="paper min-h-screen">
		<h1 class="display-tight container-site pt-20 text-5xl">Rebuild in progress</h1>
	</main>
</BaseLayout>
```

- [ ] **Step 6: Build and verify tokens landed**

Run: `npm run build && grep -o 'Rebuild in progress' dist/index.html && grep -c 'Fraunces' dist/index.html`
Expected: build succeeds; `Rebuild in progress`; count ≥ 1 (font CSS inlined or linked).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Rebuild design foundation: sage tokens, Fraunces/Nunito Sans, BaseLayout

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Button and Squiggle primitives

**Files:**
- Modify: `src/components/Button.astro` (full rewrite)
- Create: `src/components/Squiggle.astro`

**Interfaces:**
- Produces: `Button.astro` props `{ href: string; variant?: 'primary' | 'secondary' | 'mustard' | 'plum'; class?: string }` (default `primary`), renders `<a>`. `Squiggle.astro` props `{ class?: string }`, renders the mustard underline SVG (`aria-hidden="true"`, absolutely positioned by the caller via `class`).

- [ ] **Step 1: Rewrite `src/components/Button.astro`**

```astro
---
interface Props {
	href: string;
	variant?: 'primary' | 'secondary' | 'mustard' | 'plum';
	class?: string;
}

const { href, variant = 'primary', class: className = '' } = Astro.props;

const variants = {
	primary: 'bg-pine text-milk hover:bg-forest',
	secondary: 'border-2 border-pine text-pine hover:bg-pine hover:text-milk',
	mustard: 'bg-mustard text-[#3d3113] hover:bg-ochre hover:text-milk',
	plum: 'bg-plum text-milk hover:bg-[#523386]',
};
---

<a
	href={href}
	class:list={[
		'inline-block rounded-full px-6 py-3 text-[15px] font-extrabold transition-colors',
		variants[variant],
		className,
	]}
>
	<slot />
</a>
```

- [ ] **Step 2: Create `src/components/Squiggle.astro`**

```astro
---
interface Props {
	class?: string;
}

const { class: className = '' } = Astro.props;
---

<svg class={className} viewBox="0 0 200 12" fill="none" aria-hidden="true" preserveAspectRatio="none">
	<path
		d="M2 8 C 40 2, 80 12, 120 6 S 180 4, 198 7"
		stroke="var(--color-mustard)"
		stroke-width="5"
		stroke-linecap="round"
	/>
</svg>
```

- [ ] **Step 3: Smoke-test both in the shell page**

Temporarily add to `src/pages/index.astro` inside `<main>`:

```astro
<Button href="/teachings">Explore Taylor's Teachings</Button>
<Button href="/book-a-visit" variant="mustard">Book a Visit</Button>
```

(with `import Button from '../components/Button.astro';` in frontmatter)

Run: `npm run build && grep -c 'rounded-full' dist/index.html`
Expected: build succeeds, count ≥ 2.

- [ ] **Step 4: Commit**

```bash
git add src/components/Button.astro src/components/Squiggle.astro src/pages/index.astro
git commit -m "Add pill Button variants and Squiggle underline primitive

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Header and Footer

**Files:**
- Create: `src/components/Header.astro`, `src/components/Footer.astro`

**Interfaces:**
- Consumes: `Button.astro` from Task 3.
- Produces: `Header.astro` (no props) — nav links to `/teachings`, `/colouring`, `/our-story`, `/events`, `/team`, CTA to `/book-a-visit`; mobile menu button with `aria-expanded` + tiny inline script. `Footer.astro` (no props) — Learn/About/Connect columns, socials, phone. Both used by every page from Task 7 on.

- [ ] **Step 1: Create `src/components/Header.astro`**

```astro
---
const links = [
	{ href: '/teachings', label: "Taylor's Teachings" },
	{ href: '/colouring', label: 'Colouring Pages' },
	{ href: '/our-story', label: 'Our Story' },
	{ href: '/events', label: 'Events' },
	{ href: '/team', label: 'Team' },
];
---

<header class="relative z-20">
	<div class="container-site flex items-center justify-between py-4">
		<a href="/" class="display-tight text-xl text-forest">
			Taylor the Turtle<span class="text-ochre">.</span>
		</a>

		<nav class="hidden items-center gap-6 text-[14.5px] font-bold text-pine lg:flex" aria-label="Main">
			{links.map(({ href, label }) => (
				<a class="hover:text-forest" href={href}>{label}</a>
			))}
			<a
				href="/book-a-visit"
				class="rounded-full bg-mustard px-4.5 py-2 font-extrabold text-[#3d3113] transition-colors hover:bg-ochre hover:text-milk"
			>
				Book a Visit
			</a>
		</nav>

		<button
			id="menu-toggle"
			type="button"
			class="rounded-full border-2 border-pine px-4 py-1.5 font-extrabold text-pine lg:hidden"
			aria-expanded="false"
			aria-controls="mobile-nav"
		>
			Menu
		</button>
	</div>

	<nav
		id="mobile-nav"
		hidden
		class="container-site flex flex-col gap-1 pb-5 text-[16px] font-bold text-pine lg:hidden"
		aria-label="Main mobile"
	>
		{links.map(({ href, label }) => (
			<a class="rounded-xl px-3 py-2.5 hover:bg-sage-tile" href={href}>{label}</a>
		))}
		<a class="rounded-xl px-3 py-2.5 text-ochre hover:bg-sage-tile" href="/book-a-visit">Book a Visit</a>
	</nav>
</header>

<script>
	const toggle = document.getElementById('menu-toggle');
	const nav = document.getElementById('mobile-nav');
	toggle?.addEventListener('click', () => {
		const open = toggle.getAttribute('aria-expanded') === 'true';
		toggle.setAttribute('aria-expanded', String(!open));
		if (nav) nav.hidden = open;
	});
</script>
```

- [ ] **Step 2: Create `src/components/Footer.astro`**

```astro
---
const columns = [
	{
		heading: 'Learn',
		links: [
			{ href: '/teachings', label: "Taylor's Teachings" },
			{ href: '/colouring', label: 'Colouring Pages' },
			{ href: 'https://soundcloud.com/taylor-the-turtle', label: "Taylor's Music" },
		],
	},
	{
		heading: 'About',
		links: [
			{ href: '/our-story', label: 'Our Story' },
			{ href: '/team', label: 'Team' },
			{ href: '/photos', label: 'Photo Album' },
			{ href: '/articles', label: 'Articles' },
		],
	},
	{
		heading: 'Connect',
		links: [
			{ href: '/events', label: 'Events' },
			{ href: '/book-a-visit', label: 'Book a Visit' },
			{ href: '/facilitators', label: 'Facilitator Sign-in' },
		],
	},
];
---

<footer class="bg-forest text-mist">
	<div class="container-site grid gap-10 py-12 text-[14px] md:grid-cols-[1.3fr_1fr_1fr_1fr]">
		<div>
			<p class="display-tight text-lg text-milk">Taylor the Turtle.</p>
			<p class="mt-3 max-w-[36ch]">
				A collaboration led by the Sexual Assault Centre of Brant and Ganohkwasra Family Assault
				Support Services.
			</p>
			<p class="mt-4 flex gap-4 font-bold text-milk">
				<a class="hover:text-mustard" href="https://www.facebook.com/taylorsrights">Facebook</a>
				<a class="hover:text-mustard" href="https://www.instagram.com/taylorsrights">Instagram</a>
				<a class="hover:text-mustard" href="https://soundcloud.com/taylor-the-turtle">SoundCloud</a>
			</p>
		</div>
		{columns.map(({ heading, links }) => (
			<nav aria-label={heading}>
				<h2 class="text-[12px] font-extrabold tracking-[0.1em] text-milk uppercase">{heading}</h2>
				<ul class="mt-3 space-y-2">
					{links.map(({ href, label }) => (
						<li><a class="hover:text-milk" href={href}>{label}</a></li>
					))}
				</ul>
			</nav>
		))}
	</div>
	<div class="container-site border-t border-milk/15 py-5 text-[13px]">
		<p>519.751.1164 x 206 · Brantford, Brant County &amp; Six Nations</p>
	</div>
</footer>
```

- [ ] **Step 3: Mount both in the shell index page and build**

In `src/pages/index.astro`, import and render `<Header />` before `<main>` and `<Footer />` after it.

Run: `npm run build && grep -c 'Facilitator Sign-in' dist/index.html && grep -c 'aria-expanded' dist/index.html`
Expected: build succeeds; both counts ≥ 1.

- [ ] **Step 4: Commit**

```bash
git add src/components/Header.astro src/components/Footer.astro src/pages/index.astro
git commit -m "Add site Header with mobile disclosure nav and forest Footer

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Typed data files

**Files:**
- Create: `src/data/teachings.ts`, `src/data/team.ts`, `src/data/events.ts`

**Interfaces:**
- Produces (exact shapes consumed by Tasks 6–7):

```ts
// teachings.ts
export interface Teaching {
	slug: string;
	title: string;          // program copy, keeps its !!
	image: ImageMetadata | null;
	pdf: string;            // resolved ?url import of the colouring PDF
}
export const teachings: Teaching[];        // all 10, spec order
export const featuredTeachings: Teaching[]; // safe-online, safe-school, be-myself

// team.ts
export interface Person {
	name: string;
	role: string;
	org: 'SAC Brant' | 'Ganohkwasra' | 'Wilfrid Laurier University' | 'Program Creators';
	headshot: ImageMetadata | null;
}
export const team: Person[];               // 12 people
export const teaserFaces: Person[];        // Carrie, Katie, Jezeth, Misty

// events.ts
export interface CommunityEvent {
	date: Date;
	title: string;
	details: string;
}
export const PLACEHOLDER = true;           // flags sample data
export const events: CommunityEvent[];     // 3 samples
```

- [ ] **Step 1: Create `src/data/teachings.ts`**

```ts
import safeBody from '../assets/IHaveTheRighToASafeBody.png';
import safeSchool from '../assets/IHaveTheRighToASafeSchool.png';
import beMyself from '../assets/IHaveTheRighToBeMyself.png';
import proudFamily from '../assets/IHaveTheRighToBeProudOfMyFamily.png';
import safeOnline from '../assets/IHaveTheRighToBeSafeOnline.png';

import myBodyPdf from '../assets/colour_pages/my-body-belongs-to-me.pdf?url';
import healthyBodyPdf from '../assets/colour_pages/healthy-body.pdf?url';
import safeBodyPdf from '../assets/colour_pages/safe-body.pdf?url';
import safeSchoolPdf from '../assets/colour_pages/safe-school.pdf?url';
import safeCommunityPdf from '../assets/colour_pages/safe-community.pdf?url';
import talkToSomeonePdf from '../assets/colour_pages/talk-to-someone.pdf?url';
import safeOnlinePdf from '../assets/colour_pages/safe-online.pdf?url';
import beMyselfPdf from '../assets/colour_pages/be-myself.pdf?url';
import proudFamilyPdf from '../assets/colour_pages/proud-of-my-family.pdf?url';
import emergenciesPdf from '../assets/colour_pages/cared-for-during-emergencies.pdf?url';

export interface Teaching {
	slug: string;
	title: string;
	image: ImageMetadata | null;
	pdf: string;
}

/** Spec order — content PDF "Taylor's Teachings" list. Images exist for 5 of 10;
 * the rest arrive with the new illustration batch (see docs/REQUIREMENTS.md). */
export const teachings: Teaching[] = [
	{ slug: 'my-body-belongs-to-me', title: 'My body belongs to me!!', image: null, pdf: myBodyPdf },
	{ slug: 'healthy-body', title: 'I have the right to a healthy body!!', image: null, pdf: healthyBodyPdf },
	{ slug: 'safe-body', title: 'I have the right to a safe body!!', image: safeBody, pdf: safeBodyPdf },
	{ slug: 'safe-school', title: 'I have the right to a safe school!!', image: safeSchool, pdf: safeSchoolPdf },
	{ slug: 'safe-community', title: 'I have the right to a safe community!!', image: null, pdf: safeCommunityPdf },
	{ slug: 'talk-to-someone', title: "I have the right to talk to someone when I don't feel safe!!", image: null, pdf: talkToSomeonePdf },
	{ slug: 'safe-online', title: 'I have the right to be safe online!!', image: safeOnline, pdf: safeOnlinePdf },
	{ slug: 'be-myself', title: 'I have the right to be myself!!', image: beMyself, pdf: beMyselfPdf },
	{ slug: 'proud-of-my-family', title: 'I have the right to be proud of my family!!', image: proudFamily, pdf: proudFamilyPdf },
	{ slug: 'cared-for-during-emergencies', title: 'I have the right to be cared for during emergencies!!', image: null, pdf: emergenciesPdf },
];

const featured = ['safe-online', 'safe-school', 'be-myself'];
export const featuredTeachings = featured.map(
	(slug) => teachings.find((t) => t.slug === slug)!,
);
```

- [ ] **Step 2: Create `src/data/team.ts`**

```ts
import carrie from '../assets/team/carrie-sinkowski.jpg';
import katie from '../assets/team/katie-sinkowski.jpg';
import john from '../assets/team/john-sinkowski.jpg';
import jean from '../assets/team/jean-sinkowski.jpg';
import jezeth from '../assets/team/jezeth-esmas.jpg';
import alex from '../assets/team/alex-klapwyk.jpg';
import misty from '../assets/team/misty-greene.jpg';
import marcia from '../assets/team/marcia-oliver.jpg';
import kasey from '../assets/team/kasey-politano.png';
import jenn from '../assets/team/jenn-root.jpg';

export interface Person {
	name: string;
	role: string;
	org: 'SAC Brant' | 'Ganohkwasra' | 'Wilfrid Laurier University' | 'Program Creators';
	headshot: ImageMetadata | null;
}

/** Roles/orgs from docs/Website Contents - Taylor the Turtle_v1.pdf.
 * Full bios land on the Team page in Phase 2. */
export const team: Person[] = [
	{ name: 'Carrie Sinkowski', role: "Program Founder — aka Taylor's Mom", org: 'Program Creators', headshot: carrie },
	{ name: 'Katie Sinkowski', role: 'Graphic Designer', org: 'Program Creators', headshot: katie },
	{ name: 'John Sinkowski', role: 'Artist and Co-Creator', org: 'Program Creators', headshot: john },
	{ name: 'Jean Sinkowski', role: "Curriculum Consultant — aka Taylor's Nan", org: 'Program Creators', headshot: jean },
	{ name: 'Jezeth Esmas', role: 'Community Development Coordinator', org: 'SAC Brant', headshot: jezeth },
	{ name: 'Alex Klapwyk', role: 'Placement Student, Child and Youth Worker', org: 'SAC Brant', headshot: alex },
	{ name: 'Misty Greene', role: 'Child and Youth Counsellor', org: 'Ganohkwasra', headshot: misty },
	{ name: 'Ashley Maracle-Hill', role: 'Team Member', org: 'Ganohkwasra', headshot: null },
	{ name: 'Dr. Marcia Oliver', role: 'Associate Professor, Law & Society', org: 'Wilfrid Laurier University', headshot: marcia },
	{ name: 'Wonu Oluwo', role: 'Research and Placement Student, Event Planner', org: 'Wilfrid Laurier University', headshot: null },
	{ name: 'Kasey Politano', role: 'Research Assistant, Community Development Coordinator', org: 'Wilfrid Laurier University', headshot: kasey },
	{ name: 'Dr. Jennifer Root', role: 'Associate Professor & Associate Dean (BSW)', org: 'Wilfrid Laurier University', headshot: jenn },
];

const teaser = ['Carrie Sinkowski', 'Katie Sinkowski', 'Jezeth Esmas', 'Misty Greene'];
export const teaserFaces = teaser.map((name) => team.find((p) => p.name === name)!);
```

- [ ] **Step 3: Create `src/data/events.ts`**

```ts
export interface CommunityEvent {
	date: Date;
	title: string;
	details: string;
}

/** PLACEHOLDER — sample entries only, so the homepage section has realistic
 * shape. Replace with real events before launch. */
export const PLACEHOLDER = true;

export const events: CommunityEvent[] = [
	{
		date: new Date('2026-07-12'),
		title: "Brantford Farmers' Market",
		details: 'Meet Taylor and pick up colouring sheets · 9am–1pm',
	},
	{
		date: new Date('2026-07-26'),
		title: 'Six Nations Community Day',
		details: "Taylor joins Ganohkwasra's family activity tent · 11am–3pm",
	},
	{
		date: new Date('2026-08-09'),
		title: 'Caring Adult Training Session',
		details: 'Facilitator training with SAC Brant · Registration required',
	},
];
```

- [ ] **Step 4: Verify types compile**

Run: `npx astro check 2>&1 | tail -5`
Expected: 0 errors (warnings/hints acceptable).

- [ ] **Step 5: Commit**

```bash
git add src/data
git commit -m "Add typed data modules for teachings, team, and placeholder events

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Homepage sections 1–4 (Hero, Intro, TeachingsBand, Audiences)

**Files:**
- Create: `src/components/home/Hero.astro`, `src/components/home/Intro.astro`, `src/components/home/TeachingsBand.astro`, `src/components/home/Audiences.astro`

**Interfaces:**
- Consumes: `Button`, `Squiggle` (Task 3); `featuredTeachings` (Task 5); asset `src/assets/MyBodyBelongsToMe.png` (group illustration).
- Produces: four no-prop section components rendered by `index.astro` in Task 7.

- [ ] **Step 1: Create `src/components/home/Hero.astro`**

```astro
---
import { Image } from 'astro:assets';
import Button from '../Button.astro';
import Squiggle from '../Squiggle.astro';
import group from '../../assets/MyBodyBelongsToMe.png';
---

<section class="paper">
	<div class="container-site grid items-end gap-8 pt-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
		<div class="pb-12 lg:pb-16">
			<p class="text-[12.5px] font-extrabold tracking-[0.12em] text-pine/80 uppercase">
				Est. 2010 · Brantford, Brant County &amp; Six Nations
			</p>
			<h1 class="display-tight mt-4 text-[clamp(2.5rem,5.5vw,3.6rem)] leading-[1.05] text-balance">
				Big feelings, little turtle, and the
				<span class="relative whitespace-nowrap text-ochre">
					rights every child has
					<Squiggle class="absolute -bottom-2.5 left-0 h-3 w-full" />
				</span>
			</h1>
			<p class="mt-6 max-w-[44ch] text-[17px] text-forest/80 text-pretty">
				Taylor the Turtle helps caring adults teach children aged 18 months to six about body
				rights, feelings, and safety — without fear-based lessons. Recognized as a provincial
				best practice.
			</p>
			<div class="mt-7 flex flex-wrap gap-3">
				<Button href="/teachings">Explore Taylor's Teachings</Button>
				<Button href="/book-a-visit" variant="secondary">Book a Visit</Button>
			</div>
		</div>
		<Image
			src={group}
			alt="Taylor the Turtle waving, surrounded by friends: Bear, Wolf, Deer, Eagle, Beaver, and Blue Jay"
			class="mx-auto w-full max-w-[560px]"
			widths={[480, 760, 1120]}
			sizes="(min-width: 1024px) 560px, 92vw"
			loading="eager"
		/>
	</div>
</section>
```

- [ ] **Step 2: Create `src/components/home/Intro.astro`**

```astro
---
const facts = [
	{ figure: '16 years', label: 'of collaboration' },
	{ figure: '8 partners', label: 'in the community' },
	{ figure: '10 teachings', label: 'for every child' },
];
---

<section class="bg-white">
	<div class="container-site grid gap-10 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 lg:py-20">
		<h2 class="display-tight text-3xl text-balance lg:text-4xl">A little turtle with a big message</h2>
		<div>
			<p class="text-forest/80">
				Taylor the Turtle was created in 2010 as a community-built alternative to fear-based
				prevention programs. Instead of “stranger danger,” Taylor teaches through children's
				rights, body awareness, and emotional literacy — developed by eight community partners
				under the leadership of SAC Brant and Ganohkwasra Family Assault Support Services.
			</p>
			<dl class="mt-7 flex flex-wrap gap-4">
				{facts.map(({ figure, label }) => (
					<div class="rounded-2xl bg-sage-tile px-5 py-3.5">
						<dt class="sr-only">{label}</dt>
						<dd class="display-tight text-xl">{figure}</dd>
						<dd class="text-[13px] text-forest/70">{label}</dd>
					</div>
				))}
			</dl>
		</div>
	</div>
</section>
```

- [ ] **Step 3: Create `src/components/home/TeachingsBand.astro`**

```astro
---
import { Image } from 'astro:assets';
import { featuredTeachings } from '../../data/teachings';
---

<section class="bg-pine">
	<div class="container-site py-14 lg:py-20">
		<h2 class="display-tight text-center text-3xl text-milk lg:text-4xl">Taylor's Teachings</h2>
		<p class="mx-auto mt-3 max-w-[60ch] text-center text-[15.5px] text-mist">
			Ten simple rights, each one a conversation starter. Every teaching pairs an illustration
			with language children can actually use.
		</p>
		<ul class="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" role="list">
			{featuredTeachings.map(({ title, image }) => (
				<li class="rounded-3xl bg-white p-6 text-center">
					{image && (
						<Image
							src={image}
							alt=""
							class="mx-auto w-[70%]"
							widths={[320, 640]}
							sizes="(min-width: 640px) 300px, 60vw"
						/>
					)}
					<h3 class="display-tight mt-3 text-lg text-balance">{title}</h3>
				</li>
			))}
		</ul>
		<p class="mt-8 text-center">
			<a
				href="/teachings"
				class="border-b-2 border-mustard pb-0.5 font-extrabold text-milk hover:text-mustard"
			>
				See all 10 teachings →
			</a>
		</p>
	</div>
</section>
```

- [ ] **Step 4: Create `src/components/home/Audiences.astro`**

```astro
---
import Button from '../Button.astro';
---

<section class="bg-white">
	<div class="container-site grid gap-5 py-14 lg:grid-cols-2 lg:py-20">
		<article class="flex flex-col items-start gap-4 rounded-3xl bg-sage-tile p-8">
			<h2 class="display-tight text-2xl">For parents &amp; families</h2>
			<p class="text-forest/80">
				Start the conversation at home. Browse the teachings together, print a colouring sheet,
				or listen to Taylor's songs.
			</p>
			<Button class="mt-auto" href="/teachings">Start with the teachings</Button>
		</article>
		<article class="flex flex-col items-start gap-4 rounded-3xl bg-plum-tint p-8">
			<h2 class="display-tight text-2xl text-[#3E2A5C]">For educators &amp; facilitators</h2>
			<p class="text-[#3E2A5C]/80">
				Bring Taylor to your classroom or organization. Trained facilitators can sign in for
				program resources.
			</p>
			<Button class="mt-auto" href="/facilitators" variant="plum">Facilitator resources</Button>
		</article>
	</div>
</section>
```

- [ ] **Step 5: Mount sections 1–4 in `src/pages/index.astro` and build**

Replace the shell `<main>` contents with `<Hero /><Intro /><TeachingsBand /><Audiences />` (imports from `../components/home/…`). Keep `<Header />` and `<Footer />`.

Run: `npm run build && grep -c 'Taylor&#39;s Teachings\|Taylor's Teachings' dist/index.html`
Expected: build succeeds, count ≥ 2 (nav + band heading).

- [ ] **Step 6: Commit**

```bash
git add src/components/home src/pages/index.astro
git commit -m "Build homepage sections 1-4: hero, intro, teachings band, audiences

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Homepage sections 5–9 and final assembly

**Files:**
- Create: `src/components/home/Colouring.astro`, `src/components/home/EventsList.astro`, `src/components/home/TeamTeaser.astro`, `src/components/home/GrantBand.astro`
- Modify: `src/pages/index.astro` (final form)

**Interfaces:**
- Consumes: `Button` (Task 3), `events` + `team`/`teaserFaces` (Task 5), colouring previews (Task 1).
- Produces: the complete homepage.

- [ ] **Step 1: Create `src/components/home/Colouring.astro`**

```astro
---
import { Image } from 'astro:assets';
import Button from '../Button.astro';
import colour1 from '../../assets/colouring-previews/colour-1.jpg';
import colour2 from '../../assets/colouring-previews/colour-2.jpg';
import colour3 from '../../assets/colouring-previews/colour-3.jpg';

const sheets = [
	{ src: colour1, class: 'left-[6%] top-4 -rotate-[5deg]' },
	{ src: colour2, class: 'left-[32%] top-0 rotate-[2deg] z-10' },
	{ src: colour3, class: 'left-[58%] top-5 rotate-[6deg]' },
];
---

<section class="paper">
	<div class="container-site grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
		<div>
			<h2 class="display-tight text-3xl text-balance lg:text-4xl">Print, colour, and talk it through</h2>
			<p class="mt-4 max-w-[48ch] text-forest/80">
				Every teaching has a free colouring sheet — a gentle way to sit alongside a child and
				let the conversation happen naturally. Download single pages or the whole book.
			</p>
			<Button class="mt-6" href="/colouring">Browse colouring pages</Button>
		</div>
		<div class="relative h-64 sm:h-72" aria-hidden="true">
			{sheets.map(({ src, class: cls }) => (
				<Image
					src={src}
					alt=""
					class:list={['absolute w-44 rounded-lg border border-forest/10 bg-white shadow-lg sm:w-48', cls]}
					widths={[240, 480]}
					sizes="200px"
				/>
			))}
		</div>
	</div>
</section>
```

- [ ] **Step 2: Create `src/components/home/EventsList.astro`**

```astro
---
import Button from '../Button.astro';
import { events } from '../../data/events';

const fmtDay = new Intl.DateTimeFormat('en-CA', { day: '2-digit', timeZone: 'UTC' });
const fmtMonth = new Intl.DateTimeFormat('en-CA', { month: 'short', timeZone: 'UTC' });
---

<section class="bg-white">
	<div class="container-site py-14 lg:py-20">
		<h2 class="display-tight text-3xl lg:text-4xl">Come say hi to Taylor</h2>
		<ul class="mt-7" role="list">
			{events.map(({ date, title, details }) => (
				<li class="flex items-center gap-5 border-t-[1.5px] border-sage-tile py-4">
					<p class="min-w-16 rounded-xl bg-sage-tile px-3.5 py-2.5 text-center">
						<span class="display-tight block text-xl">{fmtDay.format(date)}</span>
						<span class="text-[11px] font-extrabold text-pine uppercase">{fmtMonth.format(date)}</span>
					</p>
					<div>
						<h3 class="text-[16.5px] font-extrabold">{title}</h3>
						<p class="mt-0.5 text-[13.5px] text-forest/70">{details}</p>
					</div>
				</li>
			))}
		</ul>
		<Button class="mt-6" href="/events" variant="secondary">See all events</Button>
	</div>
</section>
```

- [ ] **Step 3: Create `src/components/home/TeamTeaser.astro`**

```astro
---
import { Image } from 'astro:assets';
import Button from '../Button.astro';
import { team, teaserFaces } from '../../data/team';

const remaining = team.length - teaserFaces.length;
---

<section class="bg-pine">
	<div class="container-site py-14 text-center lg:py-20">
		<h2 class="display-tight text-3xl text-milk lg:text-4xl">The people behind the turtle</h2>
		<p class="mx-auto mt-3 max-w-[56ch] text-[15.5px] text-mist">
			A family of creators, counsellors, researchers, and community builders across SAC Brant,
			Ganohkwasra, and Wilfrid Laurier University.
		</p>
		<ul class="mt-8 flex flex-wrap items-center justify-center gap-4" role="list">
			{teaserFaces.map(({ name, role, headshot }) => (
				<li>
					{headshot && (
						<Image
							src={headshot}
							alt={`${name}, ${role}`}
							class="size-21 rounded-full border-[3px] border-milk object-cover"
							width={168}
							height={168}
						/>
					)}
				</li>
			))}
			<li
				class="flex size-21 items-center justify-center rounded-full border-[3px] border-dashed border-mist/70 text-[13px] font-extrabold text-milk"
				aria-label={`and ${remaining} more team members`}
			>
				+{remaining} more
			</li>
		</ul>
		<Button class="mt-7" href="/team" variant="mustard">Meet the team</Button>
	</div>
</section>
```

- [ ] **Step 4: Create `src/components/home/GrantBand.astro`**

```astro
<section class="border-t-[1.5px] border-sage-tile bg-white">
	<div class="container-site py-9">
		<p class="max-w-[90ch] text-[13.5px] leading-relaxed text-forest/70">
			<strong class="text-forest">
				Funded by the Ministry of Children, Community and Social Services, Ontario's Action Plan
				to End Gender-Based Violence.
			</strong>
			This project is designed to expand and deliver child sexual abuse prevention programming to
			families, agencies, and sectors that interact with children.
		</p>
	</div>
</section>
```

- [ ] **Step 5: Final `src/pages/index.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import Hero from '../components/home/Hero.astro';
import Intro from '../components/home/Intro.astro';
import TeachingsBand from '../components/home/TeachingsBand.astro';
import Audiences from '../components/home/Audiences.astro';
import Colouring from '../components/home/Colouring.astro';
import EventsList from '../components/home/EventsList.astro';
import TeamTeaser from '../components/home/TeamTeaser.astro';
import GrantBand from '../components/home/GrantBand.astro';
---

<BaseLayout title="Taylor the Turtle — Children Have Rights">
	<Header />
	<main id="main">
		<Hero />
		<Intro />
		<TeachingsBand />
		<Audiences />
		<Colouring />
		<EventsList />
		<TeamTeaser />
		<GrantBand />
	</main>
	<Footer />
</BaseLayout>
```

- [ ] **Step 6: Build and verify all nine sections render**

Run:
```bash
npm run build && for s in "rights every child has" "big message" "Taylor" "educators" "colour" "Come say hi" "people behind the turtle" "Gender-Based Violence" "Facilitator Sign-in"; do grep -qi "$s" dist/index.html && echo "OK: $s" || echo "MISSING: $s"; done
```
Expected: nine `OK:` lines, no `MISSING:`.

- [ ] **Step 7: Commit**

```bash
git add src/components/home src/pages/index.astro
git commit -m "Complete homepage: colouring, events, team teaser, grant band

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: Stub pages for every destination

**Files:**
- Create: `src/components/StubPage.astro` and `src/pages/{teachings,colouring,our-story,events,team,photos,articles,facilitators,book-a-visit}.astro`

**Interfaces:**
- Consumes: `BaseLayout`, `Header`, `Footer`.
- Produces: `StubPage.astro` props `{ title: string; blurb: string }`; nine routes that keep every nav/footer link resolving.

- [ ] **Step 1: Create `src/components/StubPage.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Header from './Header.astro';
import Footer from './Footer.astro';

interface Props {
	title: string;
	blurb: string;
}

const { title, blurb } = Astro.props;
---

<BaseLayout title={`${title} — Taylor the Turtle`}>
	<Header />
	<main id="main" class="paper">
		<div class="container-site py-20 lg:py-28">
			<p class="text-[12.5px] font-extrabold tracking-[0.12em] text-pine/80 uppercase">Coming soon</p>
			<h1 class="display-tight mt-3 max-w-[20ch] text-4xl text-balance lg:text-5xl">{title}</h1>
			<p class="mt-5 max-w-[52ch] text-forest/80">{blurb}</p>
			<slot />
		</div>
	</main>
	<Footer />
</BaseLayout>
```

- [ ] **Step 2: Create the nine stub routes**

Each file is the same three-line pattern; all nine shown so none is ambiguous.

`src/pages/teachings.astro`
```astro
---
import StubPage from '../components/StubPage.astro';
---
<StubPage title="Taylor's Teachings" blurb="All ten teachings, each with its illustration and colouring sheet, are being prepared for this page." />
```

`src/pages/colouring.astro`
```astro
---
import StubPage from '../components/StubPage.astro';
---
<StubPage title="Colouring Pages" blurb="Free, downloadable colouring sheets for every teaching — single pages or the whole book." />
```

`src/pages/our-story.astro`
```astro
---
import StubPage from '../components/StubPage.astro';
---
<StubPage title="Our Story" blurb="How a classroom observation in 2010 grew into a community-built, provincially recognized prevention program." />
```

`src/pages/events.astro`
```astro
---
import StubPage from '../components/StubPage.astro';
---
<StubPage title="Events" blurb="Where to meet Taylor next — community events, market days, and training sessions." />
```

`src/pages/team.astro`
```astro
---
import StubPage from '../components/StubPage.astro';
---
<StubPage title="Team" blurb="The creators, counsellors, researchers, and community builders behind Taylor the Turtle." />
```

`src/pages/photos.astro`
```astro
---
import StubPage from '../components/StubPage.astro';
---
<StubPage title="Photo Album" blurb="Photos from Taylor's visits to schools, camps, and community events across the years." />
```

`src/pages/articles.astro`
```astro
---
import StubPage from '../components/StubPage.astro';
---
<StubPage title="Articles" blurb="Research and writing about the program. The list is being assembled by the team." />
```

`src/pages/facilitators.astro`
```astro
---
import StubPage from '../components/StubPage.astro';
---
<StubPage
	title="Facilitator Resources"
	blurb="Trained Taylor the Turtle facilitators will find program materials, session guides, and refreshers here. Sign-in is coming soon — for access in the meantime, contact SAC Brant at 519.751.1164 x 206."
/>
```

`src/pages/book-a-visit.astro`
```astro
---
import StubPage from '../components/StubPage.astro';
---
<StubPage title="Book a Visit" blurb="Bring Taylor to your classroom, community centre, or event. Booking details are coming soon — call 519.751.1164 x 206 to arrange a visit today." />
```

- [ ] **Step 3: Build and verify no dead links**

Run:
```bash
npm run build && for p in teachings colouring our-story events team photos articles facilitators book-a-visit; do test -f "dist/$p/index.html" && echo "OK: /$p" || echo "MISSING: /$p"; done && grep -c 'href="#"' dist/index.html
```
Expected: nine `OK:` lines; final grep count `0`.

- [ ] **Step 4: Commit**

```bash
git add src/components/StubPage.astro src/pages
git commit -m "Add on-design stub pages so every nav destination resolves

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: Verification pass (build, responsive, accessibility)

**Files:**
- Modify: only if fixes fall out of the checks.

**Interfaces:**
- Consumes: the complete site.
- Produces: verified Phase 1, ready for user review.

- [ ] **Step 1: Clean build + type check**

Run: `npm run build && npx astro check 2>&1 | tail -3`
Expected: build succeeds, 0 errors.

- [ ] **Step 2: Start the dev server and view the homepage in the browser**

Run: `npm run dev` (background), then open/screenshot `http://localhost:4321/` at ~375px, ~768px, ~1280px widths (browser tools or manual). Check: mobile menu opens/closes and is keyboard-reachable; hero illustration doesn't overflow; tilted colouring sheets stay inside their container at 375px; green-band text is readable.

- [ ] **Step 3: Accessibility checks on built output**

Run:
```bash
grep -c '<h1' dist/index.html                       # expect exactly 1
grep -c 'alt=""' dist/index.html                    # decorative images only (teaching cards, colouring sheets)
grep -o '<html lang="en">' dist/index.html          # expect present
grep -c 'aria-label' dist/index.html                # expect >= 3 (navs, +N-more circle)
```
Contrast spot-check (all pass AA at their sizes, precomputed): milk `#FAFAF2` on pine `#4A7C3F` = 6.0:1; mist `#D7E6C8` on pine = 4.6:1; forest `#2E4A26` on sage `#F0F4E8` = 9.4:1; `#3d3113` on mustard `#F0B843` = 8.2:1. If any color was adjusted during implementation, re-verify at https://webaim.org/resources/contrastchecker/ equivalents (or compute the ratio) before closing the task.

- [ ] **Step 4: Fix anything the checks surface, re-run, commit**

```bash
git add -A
git commit -m "Verification pass: responsive and accessibility fixes

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

(Skip the commit if nothing changed.)
