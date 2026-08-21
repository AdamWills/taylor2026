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
- **It keeps the site static.** The gallery is authored in Sanity (Part 3) and
  built into static pages, so the Worker's only job is the facilitator gate —
  no Astro SSR adapter, no runtime dependencies on the critical path.
- **It leaves room to grow.** KV, R2, and D1 are a binding away if the events
  calendar or article list later wants a real backend.

The trade-off is honest: it is one more account for the client's organisation to
own, and the Cloudflare dashboard is not a friendly place for a non-technical
person. The mitigation is that after setup they should almost never need to open
it — all their day-to-day work happens in Sanity Studio (Part 3). The one
dashboard task that remains, rotating the facilitator password, is rare and
worth walking through with them once.

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

### The constraint, and how it was resolved

**No editor should need a GitHub account.** That is firm, and it is what ruled
out every git-based CMS: Sveltia, Decap, and Pages CMS all require one per
editor. Decap with Netlify Git Gateway *was* the standard answer to exactly this
problem — editors sign in with an email and password, Git Gateway commits on
their behalf — but Git Gateway is deprecated and new configurations are not
recommended, so it is not a foundation to build on. DecapBridge solves it as a
third-party service the client could not replace. TinaCMS caps its free tier at
two users and then bills monthly, which is a bad failure mode for an
organisation with staff turnover: when the bill lapses, editing stops.

An earlier draft of this document responded to that by designing a custom
`/admin` upload page, backed by R2 and D1. **That was an overcorrection.** The
reasoning had been anchored on keeping content in git, and once the content
moved out of git — to R2 and D1 — the constraint that made a custom build
necessary had already dissolved. A hosted headless CMS satisfies "no GitHub
account" trivially, because editors simply log in with an email.

### Decided: Sanity

Content lives in Sanity's hosted Content Lake. Editors sign in with an email
address. There is no git in the content path and nothing custom to build.

What this replaces, relative to the previous design: the entire `/admin` upload
page, the R2 bucket, the D1 schema, the Worker upload endpoints, the client-side
resize, and the on-demand `/photos` routes. All of it. What remains is a schema
definition, a query, and two page templates.

**Sanity Studio is embedded at `/admin`** via the official `@sanity/astro`
integration, so the client has one bookmarkable URL on the site's own domain
rather than a separate `*.sanity.studio` address.

**The site goes back to being fully static.** Sanity serves images from its own
CDN, so Astro never processes them — the build does not slow down as the gallery
grows, which was the objection that pushed photos out of the repo in the first
place. A Sanity webhook triggers a redeploy on publish; the album is live in a
minute or two. **No Astro SSR adapter is needed anywhere**, including for the
facilitator gate in Part 4, which lives in the Worker's fetch handler rather
than in Astro.

### The schema

```ts
// sanity/schemaTypes/album.ts
export const album = {
  name: 'album',
  title: 'Photo album',
  type: 'document',
  fields: [
    { name: 'title', title: 'Album title', type: 'string', validation: (r) => r.required() },
    {
      name: 'slug',
      title: 'Web address',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (r) => r.required(),
    },
    { name: 'date', title: 'Date of the visit', type: 'date', validation: (r) => r.required() },
    { name: 'location', title: 'Where was it?', type: 'string' },
    { name: 'description', title: 'A sentence about the day', type: 'text', rows: 3 },
    {
      name: 'consentOnFile',
      title: 'I have photo consent on file for everyone pictured',
      type: 'boolean',
      initialValue: false,
      validation: (r) => r.required(),
    },
    {
      name: 'photos',
      title: 'Photos',
      type: 'array',
      of: [{
        type: 'image',
        options: { hotspot: true },
        fields: [{ name: 'caption', title: 'Caption', type: 'string' }],
      }],
    },
  ],
};
```

Sanity's image type gives drag-to-reorder, bulk upload, and hotspot cropping out
of the box — the three things that would have taken the longest to build by hand.

### Two roles, and what follows from it

The free plan offers only Administrator and Viewer. There is no Editor role, so
**every staff member who can add photos is also an Administrator** — able to
change project settings, manage other users, and delete the dataset.

For a team of two or three trusted staff this is workable, and it is the call
that has been made. Two things follow from it, and they compound with two other
free-plan limits:

- **History retention is capped on the free plan**, so "restore it from
  history" has a shorter window than one might assume.
- **Automated backups are an Enterprise feature.** On the free plan the
  supported route is a manual `sanity dataset export` via the CLI.

Together — anyone can delete, history is short, backups are not automatic —
these argue for one small piece of infrastructure that is worth building at the
same time as the gallery:

> **A scheduled `sanity dataset export`**, run by a GitHub Action on a weekly
> cron, writing the export to R2 or committing it to the repo. It is a handful
> of lines, it costs nothing, and it is the only thing standing between an
> accidental deletion and a permanently lost photo album.

This is the one place where dropping the custom build adds a responsibility
rather than removing one. It should not be deferred.

### Confirm at signup

The exact seat allowance on the free plan could not be pinned down from public
sources — figures ranged from two non-admin users to twenty. Worth confirming
before the client is set up, since the answer determines whether the whole team
can be given access or only a couple of named people.

### Safeguarding notes — please read this part

This is a gallery of photographs of young children, published by a sexual
assault centre. That changes the requirements in ways a normal photo gallery
does not have:

- **EXIF data must not ship.** Phone photos carry GPS coordinates. Publishing
  the exact location of a school alongside photographs of the children who
  attend it is a genuine safeguarding failure, not a theoretical one. With
  Sanity this needs deliberate handling, because it is no longer something the
  build does for us:
  - **Always emit transformed image URLs**, never a bare asset URL. Build them
    with `@sanity/image-url` and an explicit width. Transformations re-encode
    the image, which is what drops the metadata.
  - **Verify this rather than assume it.** Upload a real phone photo with
    location services on, fetch the transformed URL, and run `exiftool` on the
    result. This deserves a written check, because it is exactly the property
    that regresses quietly during an unrelated change.
  - **The original asset stays fetchable.** Sanity keeps the uploaded
    original and serves it from its CDN at an unguessable but public URL, with
    EXIF intact. Nothing on the site links to it, but "unguessable" is not
    "private". **Decision (2026-08-21): accepted.** If that ever changes, the
    remedy is stripping metadata in the browser before upload via a custom
    Studio input component.
- **The `consentOnFile` checkbox is deliberate.** It is not a legal control —
  it is a prompt that puts the question in front of the person publishing, at
  the moment they publish. The schema marks it required so an album cannot be
  saved without an explicit answer.
- **Consider whether some albums should be public at all.** Some may belong
  behind the facilitator gate (Part 4).
- **Decide about faces deliberately, not by default.** Many child-serving
  organisations publish only photos where children are not identifiable — from
  behind, at a distance, or focused on the activity.
  **Decision (2026-08-21): no restriction beyond the consent confirmation** —
  the `consentOnFile` checkbox is the control.

### The client's actual workflow

1. Go to `taylorstherights.ca/admin` and sign in with their work email.
2. "Photo album" → "Create new".
3. Title, date, drag photos in, tick the consent box.
4. Publish. The site rebuilds itself and the album appears in a minute or two.

No accounts to create beyond the Sanity invitation, no passwords beyond their
own, no GitHub, and nothing custom that only one person understands. Sanity
Studio works on a phone, which matters — staff take these photos at schools and
community events, and if uploading requires sitting down at a desktop later, it
will not happen.

### What this gives up

Honestly, so it is a choice rather than a discovery later:

- **Content lives in a third party's cloud.** Portability is via
  `sanity dataset export`, which is exactly why the scheduled export above is
  not optional.
- **A free tier can change.** Sanity could alter its limits. The export is the
  hedge here too; with it, moving to another CMS is a migration rather than a
  loss.
- **The client still cannot make structural changes.** They can add albums,
  events, and articles indefinitely, but a new *kind* of page or a layout change
  still needs a developer. This was the honest advantage Squarespace held, and
  it was weighed and set aside to keep the bespoke design.

### Options considered and rejected

- **Git-based CMSes (Sveltia, Decap, Pages CMS)** — all require a GitHub
  account per editor. Sveltia was the closest call: its R2 media support removed
  the repo-weight objection entirely, but not the account requirement, and the
  workarounds are worse than the problem (a shared account means a shared 2FA
  seed; injecting a repo token into the page puts a write credential in the
  browser).
- **Decap + Netlify Git Gateway** — the classic email/password answer to this
  exact problem. Git Gateway is deprecated.
- **TinaCMS** — two free users, then $29/month. A recurring bill that can lapse
  is a poor fit for a grant-funded programme.
- **A custom `/admin` page on R2 and D1** — the previous design in this
  document. It worked and cost nothing, but it is several hundred lines of
  bespoke CMS that only its author understands, to replicate what Sanity gives
  for free. Superseded.
- **Squarespace** — would let the client run the whole site themselves forever,
  including structural changes, with page passwords and galleries built in.
  Rejected because the bespoke design — the hero cast, the motion system, the
  Taylor identity — would be approximated at best in a template, and for a
  programme whose identity is an illustrated character that is a real loss. The
  nonprofit discount is 10% off the first payment only, so it is also ~$200–280
  a year indefinitely.
- **Webflow** — closer design fidelity and a genuinely good editor, with 50%
  off annual plans for nonprofits in year one. Still a full rebuild and an
  ongoing bill thereafter.
- **Pulling from Instagram** — the Instagram Basic Display API was retired, and
  the replacement needs a business account and a token refreshed every 60 days.
  The gallery would silently go blank when it lapsed.

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

### Considered and not chosen: Cloudflare Access

Worth recording, because it stays available on the same Cloudflare account and
is the natural next step if the shared password stops working out.

An Access policy on `taylorstherights.ca/facilitators*` would have facilitators
enter their email and receive a one-time PIN. Free for up to 50 users, no
application code at all, per-person revocation, an audit trail of who accessed
what, and it covers the PDFs automatically because the policy attaches to the
path rather than the page.

It was set aside because the client wants to hand out one password at a training
session, and Access is the wrong shape for that — it is per-person by design.
The cost of the decision is the revocation limitation above; the benefit is that
nothing has to be administered in the Cloudflare dashboard, and with the gallery
authored in Sanity there is now no other reason to set Access up at all.

---

## Decisions made

1. **Hosting — Cloudflare Workers with static assets.** Still to confirm: the
   account should be owned by SAC Brant as an organisation, not by an
   individual. This matters more than it sounds; it is the difference between
   the client being able to hand the site to someone else later and not.
2. **Facilitator sign-in — one shared password** (Part 4), with the revocation
   trade-off understood and accepted.
3. **Content authoring — Sanity** (Part 3), with Studio embedded at `/admin`.
   Editors sign in with an email, so no GitHub accounts and nothing custom to
   build. The site stays fully static, rebuilt by a Sanity webhook on publish.
   Accepted with it: the free plan's two roles, meaning every editor is an
   Administrator.

## Suggested order of work

1. Hosting + deploy pipeline (unblocks everything else).
2. Open Graph metadata, `site` config, 404 page, `robots.txt` — small, and the
   sharing fix has outsized value given the Facebook and Instagram traffic.
3. Replace or gate the placeholder events data.
4. Gallery: Sanity project and schema, Studio embedded at `/admin`, the
   `/photos` pages, and the publish webhook. Include the EXIF check on a
   transformed URL, and the scheduled `sanity dataset export` — that one is
   not optional, given two roles and capped history retention.
   **Built 2026-08-21** (schema, Studio at `/admin`, `/photos` pages, backup
   workflow); still needing a live Sanity project: the project id in `.env`,
   the publish webhook, the CORS origin for `/admin`, and the EXIF check,
   which needs a real uploaded photo. See README §Content editing.
5. Facilitator gate, including the rate-limiting rule and a test that asserts an
   unauthenticated request really is refused.
