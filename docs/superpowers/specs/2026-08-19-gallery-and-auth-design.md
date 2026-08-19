# Site review, plus designs for the photo gallery and the facilitator sign-in

Date: 2026-08-19
Status: accepted — hosting and auth model decided, see "Decisions made". Not yet built.

---

## Part 1 — Where the site stands

The homepage is finished and it is good work: a coherent visual system, a real
motion layer with `prefers-reduced-motion` honoured throughout, focus-visible
states on every interactive element, and images running through Astro's asset
pipeline. `npm run build` is clean and produces 10 pages in ~8s.

Everything behind the homepage is a stub. Nine of the ten routes render
`StubPage`:

| Route | State |
| --- | --- |
| `/` | Built |
| `/teachings` `/colouring` `/our-story` `/events` `/team` `/book-a-visit` `/photos` `/articles` `/facilitators` | "Coming soon" stub |

### Launch blockers

1. **Placeholder events are live on the homepage.** `src/data/events.ts` exports
   `PLACEHOLDER = true` and three invented events ("Brantford Farmers' Market",
   etc.) that render on the homepage today. Nothing consumes the
   `PLACEHOLDER` flag, so there is no guard stopping these from shipping.
2. **No deployment configuration exists.** No host is chosen, no adapter, no CI.
   This is the decision that unlocks both of the requests below — see Part 2.
3. **No social sharing metadata.** `BaseLayout` sets `<title>` and
   `description` only. The program pushes traffic through Facebook and
   Instagram, so every shared link currently renders as a bare grey box with no
   image, title card, or description. This is the highest-value small fix on the
   list.

### Smaller findings

- **No `site` in `astro.config.mjs`.** Required before sitemaps or absolute
  Open Graph URLs will work, so it blocks the fix above.
- **No 404 page.** Astro will serve the host's default; a `src/pages/404.astro`
  in the site's own styling is ~10 lines.
- **No `robots.txt` or `sitemap.xml`.** `@astrojs/sitemap` handles the latter
  once `site` is set.
- **Favicon set is thin** — `favicon.svg` and `.ico` only. No
  `apple-touch-icon`, no `theme-color`, so a phone home-screen bookmark gets a
  generic icon.
- **Team names on the homepage appear on hover only** (`TeamTeaser.astro`). The
  `alt` text carries name and role for screen readers, so this is not a
  blocker, but touch users cannot see any names. Worth revisiting when `/team`
  ships and the teaser has somewhere to point.
- **`docs/` holds 27MB of source imagery** committed to the repo (colouring book
  scans, social media screenshots, headshots at up to 3.7MB each). It is not
  hurting anything yet, but it is the same pressure the photo gallery will add,
  and it is worth deciding deliberately rather than by accident — see the note
  on repo weight in Part 3.

None of the above is hard. The two genuinely interesting problems are the ones
raised in the brief, and they share a single dependency.

---

## Part 2 — The decision underneath both requests: where this is hosted

Both requests are, underneath, the same question: *what can run on the server?*

- A gallery a non-technical person can update needs somewhere for their edits to
  land.
- A password-protected page needs something that can refuse to serve bytes to
  someone who has not authenticated. **A static host cannot do this.**

The site is currently a pure static Astro build with no adapter, which means
today the answer to both is "nothing can run."

### Decided: Cloudflare Workers with static assets

Deploy the Astro build to Cloudflare Workers static assets. This is what
Cloudflare now points new projects toward — Pages remains supported but is no
longer where their investment goes, and Workers unifies the static site and any
server-side logic into one deployment.

Why it fits this project specifically:

- **Free at this traffic level**, with no card required, and no per-seat pricing
  that bites a community non-profit later. Netlify and Vercel both put password
  protection behind paid plans (~$19–20/month/member), which is the wrong shape
  of cost for this client.
- **It solves the facilitator page with no extra platform.** The same Worker
  that serves the site can gate `/facilitators`. No second service to pay for,
  learn, or have go stale.
- **Cloudflare Access is available on the same account** if the client prefers
  named accounts over a shared password (Part 4, Option A) — free for up to 50
  users.
- **The gallery's upload endpoint is a Worker too** (Part 3), so the one piece
  of server-side glue the client-facing admin tool needs lives on the same
  account as everything else.
- **It leaves room to grow.** KV, R2, and D1 are a binding away if the events
  calendar or article list later wants a real backend.

The trade-off is honest: it is one more account for the client's organisation to
own, and the Cloudflare dashboard is not a friendly place for a non-technical
person. The mitigation is that after setup they should never need to open it —
all their day-to-day work happens on `/admin` (Part 3). The two dashboard tasks
that do remain, adding an admin user and rotating the facilitator password, are
both rare and both worth walking through with them once.

---

## Part 3 — Photo gallery the client can update

### What "easily update" has to mean here

The client is not going to edit YAML, and should never see a git diff. The
realistic bar is: they open one bookmarked URL, sign in, drag photos in, type a
title, click Save, and the site updates itself a minute later. Anything more
than that will be used once and then abandoned, and the album will go stale.

There is a second, less obvious requirement. Staff take these photos on their
phones at schools and community events. If uploading requires sitting down at a
desktop later, it will not happen. **Mobile upload is a real requirement, not a
nicety.**

### The constraint that decides this: no GitHub accounts

A git-based CMS like Sveltia or Decap requires every person who updates the
site to hold a GitHub account with write access to the repo. That was rejected,
and reasonably so — "create a GitHub account" is a hard stop for a lot of
community-org staff, and an account nobody remembers signing up for is an
account nobody can log into eighteen months later when the person who set it up
has moved on.

It is worth separating two things that got bundled together, though:

- **Whether the client ever sees GitHub.** They should not. This is the real
  requirement, and it is non-negotiable.
- **Whether git remains the place the content is stored.** This is a separate
  question, and the answer is less obvious.

Keeping git as the store buys three things that matter for this particular
site: every photo runs through Astro's image pipeline (which is what strips
EXIF — see the safeguarding notes below, where that is a safeguarding control
rather than an optimisation); the content is versioned and recoverable when
somebody deletes an album by accident; and it survives the Cloudflare account,
which for an organisation with staff turnover is worth more than it sounds.

So the design below keeps git as the store and removes GitHub from the client's
experience entirely — the Worker holds the credential, not the client.

### Decided: Cloudflare Access on `/admin`, with a purpose-built upload page

The shape:

1. `/admin` is protected by a Cloudflare Access policy. Staff enter their email,
   receive a one-time PIN, and are let in. Free up to 50 users; the admin group
   here is two or three people.
2. `/admin` is an upload page built for exactly one job: turn a set of photos
   from a school visit into an album.
3. On publish, the page posts to a Worker endpoint. **The Worker** commits the
   album to GitHub using a token held as a Worker secret. The client never has a
   GitHub account, never sees a commit, never knows git is involved.
4. The push triggers a rebuild. The album is live in a minute or two.

Access is enforced at Cloudflare's edge *before* the Worker runs, so an
unauthenticated request never reaches the upload endpoint. (Cloudflare also
shipped one-click Access-on-a-Worker on 2026-08-14, which protects an entire
Worker including its custom domains; a path-scoped Access application on
`/admin` is the right granularity here, since the rest of the site is public.)

### Why a custom page is affordable here

Building an upload UI is normally the reason to reach for an existing CMS, and
it should not be waved through as trivial — this is the part Sveltia was giving
us for free, and custom admin UIs are reliably 80% done in a day and then take
three more.

Two things make it a fair trade in this case:

- **The job is narrow.** Sveltia is a general-purpose CMS for arbitrary content
  models. This page creates albums of photos. One entity, four fields, a file
  picker. Most of a CMS's weight is generality this site will never use.
- **Resizing in the browser removes the whole server-side image problem.**
  Downscale to 1600px on a `<canvas>` and re-encode before upload — about thirty
  lines. That single step means uploads are fast on school wifi, the repo stays
  small, EXIF is gone before the bytes ever leave the device, and no
  image-processing service is needed anywhere in the stack.

### Scope for v1

Worth being deliberate, because this is where custom admin tools balloon:

- Create an album (title, date, location, description, consent checkbox)
- Add photos to a new or existing album, with captions
- Delete a photo; delete an album
- Reordering: **defer.** Sort by filename, which is capture order on every phone
  camera. Add drag-to-reorder only if the client actually asks.

Editing an album's text after publishing is worth having; anything beyond the
list above should wait until the client has used it for a few months and can say
what is actually missing.

### The commit endpoint

The Worker takes the uploaded files and metadata and writes one commit via
GitHub's Git Data API:

1. `POST /repos/{owner}/{repo}/git/blobs` per image (base64) → blob SHAs
2. `GET /git/ref/heads/main` → base commit SHA, then its tree SHA
3. `POST /git/trees` with `base_tree` plus the new blobs and the album markdown
4. `POST /git/commits`, then `PATCH /git/refs/heads/main`

One commit, one rebuild, and a half-failed upload cannot leave the repo in a
partial state — which the naive per-file Contents API approach does not give
you.

Two things to get right:

- **Verify the Access JWT inside the Worker** before accepting an upload. Access
  already gates the path at the edge, but the endpoint should not be reachable
  if that policy is ever misconfigured or removed. Read
  `Cf-Access-Jwt-Assertion` and verify it against the team's public keys. This
  is the same class of mistake as `run_worker_first` in Part 4: it fails open
  and silently.
- **Use a GitHub App installation token, not a fine-grained PAT.** Fine-grained
  PATs expire after at most a year, and the failure mode is uploads breaking
  silently, long after anyone remembers why. A GitHub App with `contents:write`
  on the one repo mints short-lived tokens on demand and does not expire.

The content collection and the page structure are unchanged from the git-based
approach — only the authoring surface differs:

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const albums = defineCollection({
  loader: glob({ base: './src/content/albums', pattern: '**/*.md' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.date(),
      location: z.string().optional(),
      description: z.string().optional(),
      consentOnFile: z.boolean().default(false),
      cover: image(),
      photos: z
        .array(z.object({ src: image(), caption: z.string().optional() }))
        .default([]),
    }),
});

export const collections = { albums };
```

`/photos` renders the album grid, `/photos/[slug]` renders one album with a
lightbox — a native `<dialog>` and a few lines of JS, no library, consistent
with the rest of this codebase.

### The client's actual workflow

1. Go to `taylorstherights.ca/admin`. Enter their work email, get a PIN, paste
   it in.
2. "New album" → title, date, drag photos in, tick the consent box.
3. Publish. The page confirms it will appear on the site shortly.

No accounts to create, no passwords to remember, no GitHub. Adding or removing
someone from the admin group is one line in a Cloudflare Access policy.

### Safeguarding notes — please read this part

This is a gallery of photographs of young children, published by a sexual
assault centre. That changes the requirements in ways a normal photo gallery
does not have:

- **EXIF data must not ship.** Phone photos carry GPS coordinates. Publishing
  the exact location of a school alongside photographs of the children who
  attend it is a genuine safeguarding failure, not a theoretical one. This
  design strips it twice: the browser-side canvas re-encode drops it before
  upload, and Astro's image pipeline drops it again at build. The belt-and-
  braces is deliberate — it is the one property of this system that must not
  quietly regress. **Note that the second layer only applies to images under
  `src/assets/`;** anything written to `public/` is served byte-for-byte, EXIF
  intact, so the upload endpoint must keep writing to `src/assets/gallery`.
- **The `consentOnFile` checkbox is deliberate.** It is not a legal control —
  it is a prompt that puts the question in front of the person publishing, at
  the moment they publish. Consider having the build refuse to render an album
  where it is unticked, so it fails loudly rather than silently.
- **Consider whether some albums should be public at all.** Some may belong
  behind the facilitator gate (Part 4).
- **Decide about faces deliberately, not by default.** Many child-serving
  organisations publish only photos where children are not identifiable — from
  behind, at a distance, or focused on the activity. That is a policy call for
  SAC Brant, not a technical one, but the site should not quietly presume the
  permissive answer.

### A note on repo weight

Photos live in the repo. At 1600px they land around 300–400KB each, so a
thirty-photo album is roughly 10MB and ten albums roughly 100MB, plus build time
for image processing. Manageable, but it only goes one direction.

The browser-side resize is the main mitigation and it is built in. If the album
ever grows past a few hundred photos, the escape hatch is to write the images to
Cloudflare R2 instead of the repo and serve them through Cloudflare Image
Transformations (5,000 unique transformations a month are free, which is ample
here). The content collection and pages keep working; only the storage target
changes. Set `metadata=none` explicitly on transformations if that day comes —
do not assume the default strips it.

Worth also deciding, separately, whether the existing 27MB of `docs/` source
imagery should stay in the repo.

### Options considered and rejected

- **Sveltia CMS with GitHub sign-in** — the original proposal. Rejected on the
  account requirement above. It remains the least-code path by a wide margin, and
  is worth reconsidering only if the custom upload page turns out to be a bigger
  build than expected.
- **Sveltia behind Access, with the Worker injecting a repo token into the
  page** — gets Sveltia's polished, mobile-friendly media library for perhaps
  twenty lines of Worker code instead of a custom build, with no GitHub account
  for the client. Rejected because it puts a repo-write token in the browser:
  the blast radius is limited (one public repo, recoverable via git) and Access
  gates who can get it, but "a write credential is sitting in the page" is a
  property that ages badly and that the next maintainer will not expect. Noted
  because it is a genuinely cheap fallback if the build estimate slips.
- **Uploading to R2 with a dynamically-rendered gallery** — no rebuild, instant
  publish, scales indefinitely. Rejected for v1 because it removes the two
  properties that make git worth keeping: automatic EXIF stripping via the
  image pipeline, and content that is versioned, recoverable, and portable off
  Cloudflare. It also needs an Astro SSR adapter and its own thumbnailing. This
  is the right answer at a few thousand photos, not at a few hundred.
- **A headless CMS (Sanity, Contentful, Storyblok)** — adds a second account, a
  second thing to learn, and a free tier that can change. Disproportionate for a
  photo album, and does not avoid a login.
- **Pulling from Instagram** — tempting, since the program already posts to
  `@taylorsrights` and it would mean zero new workflow. Rejected: the Instagram
  Basic Display API was retired, and the replacement needs a business account
  and a token refreshed every 60 days. A non-technical client cannot maintain
  that, and the gallery would silently go blank when it lapsed.
- **A shared Google Drive folder synced at build time** — lowest friction for
  the client, since they already know Drive. Rejected: it needs service-account
  credentials, gives no control over captions or ordering, and fails in ways
  nobody would notice.

---

## Part 4 — Password-protected facilitator resources

**Decided: one shared password, checked at the edge.** The trade-off in
"Revocation, stated plainly" below was raised and accepted.

### The thing that makes this harder than it looks

The value of `/facilitators` is not the page. It is the PDFs — session guides,
program materials, refreshers. **Protecting the HTML page while the PDFs sit at
public URLs is security theatre.** Anyone with a link, or a search engine that
indexed one, gets the file regardless of what the page in front of it does. Any
solution that only gates the page is not a solution.

This rules out the whole family of static-site password tricks:

- **A JavaScript password check is not protection.** The password is in the
  source; the content is in the source. It stops nobody who views source.
- **StatiCrypt-style AES encryption of the page** is meaningfully better — the
  attacker gets ciphertext — but it still leaves linked PDFs public, and the
  ciphertext can be brute-forced offline at leisure.

So the gate has to run somewhere that can decline to serve the bytes. The design
below does that, and covers the PDFs as well as the page.

### How it works

The Worker that already serves the site intercepts anything under
`/facilitators`:

1. Request arrives. Valid signed cookie present → serve the asset.
2. No cookie → serve a branded password form, styled like the rest of the site
   rather than a browser dialog.
3. Correct password submitted → set an HMAC-signed, `HttpOnly`, `Secure`,
   `SameSite=Lax` cookie with a 14-day expiry, then redirect.

### The one configuration detail that must not be got wrong

By default, Workers static assets are served **straight from the edge without
invoking the Worker at all**. If `/facilitators/index.html` exists as a static
asset and the Worker is not told to run first, the gate is simply bypassed and
the page is served to everyone — with no error, no warning, and nothing in the
logs to suggest anything is wrong.

`run_worker_first` is what prevents that. It accepts an array of route patterns,
and this is the documented use case for it:

```jsonc
// wrangler.jsonc
{
  "name": "taylor-the-turtle",
  "main": "src/worker.ts",
  "compatibility_date": "2026-08-01",
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS",
    "run_worker_first": ["/facilitators", "/facilitators/*"]
  }
}
```

**This needs a test that actually asserts it.** A fresh browser hitting
`/facilitators` and each PDF underneath it must get the password form, not the
content. It is the kind of thing that works when built, and then silently stops
working after an unrelated config change months later.

### The Worker

```ts
interface Env {
  ASSETS: Fetcher;
  FACILITATOR_PASSWORD: string; // wrangler secret put FACILITATOR_PASSWORD
  COOKIE_SECRET: string;        // wrangler secret put COOKIE_SECRET
}

const COOKIE_NAME = 'tt_fac';
const MAX_AGE = 60 * 60 * 24 * 14; // 14 days
const encoder = new TextEncoder();

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (!url.pathname.startsWith('/facilitators')) {
      return env.ASSETS.fetch(request);
    }

    if (request.method === 'POST') {
      const submitted = String((await request.formData()).get('password') ?? '');
      if (!(await passwordMatches(submitted, env.FACILITATOR_PASSWORD))) {
        return passwordForm(url.pathname, 'That password was not right.', 401);
      }
      const expiry = Math.floor(Date.now() / 1000) + MAX_AGE;
      const token = `${expiry}.${await sign(String(expiry), env.COOKIE_SECRET)}`;
      return new Response(null, {
        status: 303,
        headers: {
          Location: url.pathname,
          'Set-Cookie':
            `${COOKIE_NAME}=${token}; Path=/facilitators; Max-Age=${MAX_AGE};` +
            ` HttpOnly; Secure; SameSite=Lax`,
        },
      });
    }

    if (!(await hasValidCookie(request, env.COOKIE_SECRET))) {
      return passwordForm(url.pathname);
    }

    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    headers.set('X-Robots-Tag', 'noindex, nofollow');
    headers.set('Cache-Control', 'private, no-store');
    return new Response(response.body, { status: response.status, headers });
  },
};

async function hmacKey(secret: string) {
  return crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
}

async function sign(value: string, secret: string) {
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Hash both sides first, so the comparison runs over fixed-length buffers and
 *  cannot leak the length of the real password. */
async function passwordMatches(submitted: string, expected: string) {
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(submitted)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);
  return crypto.subtle.timingSafeEqual(a, b);
}

async function hasValidCookie(request: Request, secret: string) {
  const match = (request.headers.get('Cookie') ?? '')
    .match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  if (!match) return false;

  const [expiry, signature] = match[1].split('.');
  if (!expiry || !signature) return false;
  if (Number(expiry) < Math.floor(Date.now() / 1000)) return false;

  const expected = await sign(expiry, secret);
  // timingSafeEqual throws on a length mismatch, and a client controls this
  // value, so the length has to be checked first. The expected length is a
  // public constant, so checking it leaks nothing.
  if (signature.length !== expected.length) return false;
  return crypto.subtle.timingSafeEqual(
    encoder.encode(signature),
    encoder.encode(expected),
  );
}
```

`passwordForm(action, message?, status?)` is a small function returning an HTML
`Response` — one input, one button, the site's own colours and fonts. It should
say who to contact for the password (SAC Brant, 519.751.1164 x 206), because
the people hitting it will be facilitators who have mislaid it.

### What makes this "secure. ish" rather than just a password box

- The password lives in a Worker **secret**, never in the repo, and never
  reaches the browser.
- `crypto.subtle.timingSafeEqual` over hashed values, so neither the password
  nor its length leaks through response timing.
- The cookie carries its own expiry, HMAC-signed, so a client cannot forge one
  or extend its own session.
- **A Cloudflare rate-limiting rule on `POST /facilitators`** — roughly 5
  attempts per minute per IP. This is not optional. Without it, a shared
  password of the kind people actually choose is brute-forceable in an
  afternoon, and it is the difference between this design being sound and
  merely looking sound.
- PDFs live under `/facilitators/`, so the same gate covers them, and
  `X-Robots-Tag: noindex` keeps anything behind it out of search results.

### Choosing the password

Since a rate limit is the only thing standing between a shared password and a
determined attacker, the password itself has to carry weight. Four or five
random words is the right shape — easy to read aloud at a training session, easy
to type on a phone, and far beyond brute-forcing at five guesses a minute. Avoid
anything guessable from the program itself (`taylor2026`, `turtle`).

### Revocation, stated plainly

A shared password cannot be revoked from one person. When a facilitator leaves —
or the password reaches a group chat, which over a few years it will — the only
remedy is changing it for everyone and re-notifying every facilitator. This was
raised before the decision and accepted; it is recorded here so the next person
reading this file knows it was a choice rather than an oversight.

Two things follow from it:

- **Plan for rotation from the start.** Rotating should be a known, rehearsed
  step, not a scramble. Decide who owns it and roughly how often — after each
  training cohort is a natural rhythm.
- **The optional KV extra is worth revisiting.** Keeping the password hash in
  Cloudflare KV and putting a "change the password" form *inside* the protected
  area is about twenty more lines, and it is what turns rotation from "email the
  developer" into something the client does themselves in thirty seconds. Given
  that rotation is the one maintenance task this design guarantees, this is
  probably worth building rather than deferring.

If the shared password ever becomes unmanageable, Cloudflare Access (below) is
the migration path, and it does not require re-platforming — the hosting choice
in Part 2 already covers it.

### Considered and not chosen here: Cloudflare Access

Access *is* used on this site — it protects `/admin` (Part 3). It was considered
and set aside for `/facilitators` specifically. Worth recording, because it is
already set up and is the natural next step if the shared password stops working
out.

An Access policy on `taylorstherights.ca/facilitators*` would have facilitators
enter their email and receive a one-time PIN. Free for up to 50 users, no
application code at all, per-person revocation, an audit trail of who accessed
what, and it covers the PDFs automatically because the policy attaches to the
path rather than the page.

It was set aside because the client wants to hand out one password at a training
session, and Access is the wrong shape for that — it is per-person by design.
The cost of the decision is the revocation limitation above.

One note, since it slightly weakens the original rationale: because `/admin` now
uses Access anyway, "it avoids setting up Access" is no longer a benefit of the
shared password — the setup cost is already paid. What remains is the shape
argument, which still holds: a handful of named staff belong in Access, and a
rotating cohort of trained facilitators handed a password at a session does not.
The two gates protect different-sized groups and it is reasonable for them to
work differently.

---

## Decisions made

1. **Hosting — Cloudflare Workers with static assets.** Still to confirm: the
   account should be owned by SAC Brant as an organisation, not by an
   individual. This matters more than it sounds; it is the difference between
   the client being able to hand the site to someone else later and not.
2. **Facilitator sign-in — one shared password** (Part 4), with the revocation
   trade-off understood and accepted.
3. **Gallery authoring — a purpose-built `/admin` page behind Cloudflare
   Access** (Part 3), rather than a git-based CMS. No GitHub accounts for the
   client; the Worker holds the credential and git stays the store.

## Suggested order of work

1. Hosting + deploy pipeline (unblocks everything else).
2. Open Graph metadata, `site` config, 404 page, `robots.txt` — small, and the
   sharing fix has outsized value given the Facebook and Instagram traffic.
3. Replace or gate the placeholder events data.
4. Gallery: content collection, `/photos` pages, the `/admin` upload page and
   its commit endpoint, and the Access policy in front of it.
5. Facilitator gate, including the rate-limiting rule and a test that asserts an
   unauthenticated request really is refused.
