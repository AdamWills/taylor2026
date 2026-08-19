# Site review, plus designs for the photo gallery and the facilitator sign-in

Date: 2026-08-19
Status: proposal — needs two decisions from the client (see "Decisions needed")

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

### Recommendation: Cloudflare Workers with static assets

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
- **The Sveltia CMS auth proxy is a Cloudflare Worker**, so the gallery's one
  piece of server-side glue lives on the same account as everything else.
- **It leaves room to grow.** KV, R2, and D1 are a binding away if the events
  calendar or article list later wants a real backend.

The trade-off is honest: it is one more account for the client's organisation to
own, and the Cloudflare dashboard is not a friendly place for a non-technical
person. The mitigation is that after setup they should never need to open it —
all their day-to-day work happens in the CMS (Part 3).

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

### Recommendation: Sveltia CMS writing to an Astro content collection

[Sveltia CMS](https://github.com/sveltia/sveltia-cms) is a git-based CMS: a
single JavaScript file served from `/admin` on the site itself. The client signs
in with GitHub, and their edits become ordinary commits, which trigger an
ordinary rebuild. No database, no third-party service holding the content, no
monthly bill, and if the CMS ever disappears the content is still just markdown
and JPEGs in the repo.

It is a drop-in successor to Decap CMS (formerly Netlify CMS), which is the
better-known option. Both are actively maintained — Decap last published July
2026, Sveltia is on 0.193.1 and published yesterday. Sveltia wins here on two
specific points that matter for this client:

- **It is mobile-friendly.** Decap has had an open issue about this since 2017.
  Given the phone-upload requirement above, this decides it.
- **Its media library handles bulk drag-and-drop upload properly**, which is the
  single interaction this client will perform most.

The one caveat: Sveltia is pre-1.0, so its API is not frozen. The risk is low
because its config format is Decap-compatible — if it ever stalls, swapping back
to Decap is a config-file change, not a migration.

### Shape of the implementation

**1. An Astro content collection** (`src/content.config.ts`), so the gallery is
data-driven rather than hand-built pages:

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

Using `image()` rather than raw string paths is what routes every uploaded photo
through Astro's asset pipeline. That gives responsive WebP for free — and, as
covered below, strips EXIF metadata as a side effect.

**2. A CMS config** at `public/admin/config.yml`, with per-album media folders so
each album's photos stay together:

```yaml
backend:
  name: github
  repo: adamwills/taylor2026
  branch: main

media_folder: src/assets/gallery
public_folder: /src/assets/gallery

collections:
  - name: albums
    label: Photo albums
    label_singular: Photo album
    folder: src/content/albums
    create: true
    slug: '{{year}}-{{month}}-{{slug}}'
    media_folder: '../../assets/gallery/{{slug}}'
    public_folder: '../../assets/gallery/{{slug}}'
    fields:
      - { name: title, label: 'Album title', widget: string }
      - { name: date, label: 'Date of the visit', widget: datetime, time_format: false }
      - { name: location, label: 'Where was it?', widget: string, required: false }
      - { name: description, label: 'A sentence about the day', widget: text, required: false }
      - name: consentOnFile
        label: 'I have photo consent on file for everyone pictured'
        widget: boolean
        default: false
      - { name: cover, label: 'Cover photo', widget: image }
      - name: photos
        label: Photos
        widget: list
        fields:
          - { name: src, label: Photo, widget: image }
          - { name: caption, label: Caption, widget: string, required: false }
```

The relative `media_folder` matters: it makes the stored path relative to the
markdown file, which is what Astro's `image()` resolver expects.

**3. Pages**: `/photos` renders the album grid (newest first), `/photos/[slug]`
renders one album with a lightbox. The lightbox should be a native `<dialog>`
plus a few lines of JS — no library, consistent with how the rest of this
codebase has been built.

**4. Auth glue**: Sveltia cannot complete GitHub's OAuth flow from the browser
alone, because that exchange needs a client secret that cannot live in
client-side code. The fix is
[`sveltia-cms-auth`](https://github.com/sveltia/sveltia-cms-auth), a small
Cloudflare Worker deployed from a template — roughly a ten-minute, one-time
setup, and it is deliberately not offered as a hosted service, so it must be
self-hosted. This is another reason the Cloudflare recommendation in Part 2
hangs together.

### The client's actual workflow

1. Go to `taylorstherights.ca/admin`, sign in with GitHub (one-time account
   setup; after that it is a saved login).
2. "Photo albums" → "New Photo album".
3. Type a title and date, drag in photos, tick the consent box.
4. Publish. The site rebuilds itself in about a minute.

The one piece of unavoidable friction is that each person who updates the site
needs a GitHub account with write access to the repo. That is a one-time
five-minute setup per person and they never see GitHub again afterwards. It is
worth doing this *with* them rather than emailing instructions.

### Safeguarding notes — please read this part

This is a gallery of photographs of young children, published by a sexual
assault centre. That changes the requirements in ways a normal photo gallery
does not have:

- **EXIF data must not ship.** Phone photos carry GPS coordinates. Publishing
  the exact location of a school alongside photographs of the children who
  attend it is a genuine safeguarding failure, not a theoretical one. Routing
  photos through Astro's image pipeline (the `image()` schema above) re-encodes
  them and drops metadata as a side effect — **but only for images under
  `src/assets/`**. Anything dropped into `public/` is served byte-for-byte,
  EXIF intact. The CMS config above deliberately writes to `src/assets/gallery`
  for exactly this reason, and that choice should not be casually reversed.
- **The `consentOnFile` checkbox is deliberate.** It is not a legal control —
  it is a prompt that puts the question in front of the person publishing, at
  the moment they publish. Consider having the build refuse to render an album
  where it is unticked, so it fails loudly rather than silently.
- **Consider whether some albums should be public at all.** Some may belong
  behind the same gate as the facilitator resources (Part 4), which is another
  argument for solving auth properly rather than superficially.
- **Decide about faces deliberately, not by default.** Many child-serving
  organisations publish only photos where children are not identifiable — from
  behind, at a distance, or focused on the activity. That is a policy call for
  SAC Brant, not a technical one, but the site should not quietly presume the
  permissive answer.

### A note on repo weight

Git-based CMS means photos live in the repo. Thirty photos per album at ~400KB
is ~12MB per album; ten albums is ~120MB, plus build time for image processing.
That is manageable but not free, and it only goes one direction.

Two mitigations, in order of preference:

1. Cap upload dimensions in the CMS config so 4000px phone originals are not
   what gets committed. 1600px is plenty for web display.
2. If the album ever grows past a few hundred photos, point the CMS media
   library at Cloudflare R2 or Cloudflare Images instead of the repo. The
   content collection keeps working; only the media backend changes.

Worth also deciding, separately, whether the existing 27MB of `docs/` source
imagery should stay in the repo or move to shared storage.

### Options considered and rejected

- **Pages CMS** — hosted, no OAuth proxy to run, genuinely nice. Rejected only
  because it is a single-maintainer hosted service and this site needs to
  outlive whoever built it; self-hosting the admin UI is the safer bet.
- **A headless CMS (Sanity, Contentful, Storyblok)** — better media handling,
  but adds a second account, a second thing to learn, and a free tier that can
  change. Disproportionate for a photo album.
- **Pulling from Instagram** — tempting, since the program already posts photos
  to `@taylorsrights` and it would mean zero new workflow. Rejected: the
  Instagram Basic Display API was retired, and the replacement needs a business
  account and a token that must be refreshed every 60 days. A non-technical
  client cannot maintain that, and the gallery would silently go blank when it
  lapsed.
- **A shared Google Drive folder synced at build time** — lowest possible
  friction for the client, since they already know Drive. Rejected as the
  primary: it needs service-account credentials, gives no control over captions
  or ordering, and fails in ways nobody would notice. Worth revisiting only if
  the GitHub-account requirement turns out to be a real blocker for the client.

---

## Part 4 — Password-protected facilitator resources

### The thing that makes this harder than it looks

The value of `/facilitators` is not the page. It is the PDFs — session guides,
program materials, refreshers. **Protecting the HTML page while the PDFs sit at
public URLs is security theatre.** Anyone with a link, or a search engine that
indexed one, gets the file regardless of what the page in front of it does. Any
solution that only gates the page is not a solution.

This immediately rules out the whole family of static-site password tricks:

- **A JavaScript password check is not protection.** The password is in the
  source; the content is in the source. It stops nobody who views source.
- **StatiCrypt-style AES encryption of the page** is meaningfully better — the
  attacker gets ciphertext — but it still leaves linked PDFs public, and the
  ciphertext can be brute-forced offline at leisure.

So the gate has to run somewhere that can decline to serve the bytes. Both
options below do that.

### Option A — Cloudflare Access (recommended)

Put an Access policy on `taylorstherights.ca/facilitators*`. Facilitators enter
their email, receive a one-time PIN, and are let through. Free for up to 50
users.

- **Zero application code.** No password form, no cookie signing, no rate
  limiting to get right — Cloudflare handles all of it at the edge, and the
  origin is never reached by an unauthenticated request.
- **Access can be revoked per person.** When a facilitator leaves, remove one
  email. Everyone else is unaffected.
- **There is an audit trail** of who accessed what, which for an organisation
  handling child protection materials is worth having.
- **It covers the PDFs automatically**, because the policy is on the path, not
  the page.

The client manages the facilitator list in the Cloudflare dashboard. That is the
main cost of this option — it is a developer-shaped UI. It is genuinely
manageable for adding and removing emails, and if facilitators mostly share a
domain, a single "anyone `@sacbrant.ca`" rule means the list rarely needs
touching at all.

### Option B — one shared password, checked at the edge

If the client's real requirement is "we hand out one password at the training
session," Option A is the wrong shape and this is the answer. About 80 lines in
the Worker that already serves the site:

1. Request to `/facilitators*` arrives. Check for a signed cookie. Valid →
   serve.
2. No cookie → serve a branded password form (styled like the rest of the site,
   not a browser dialog).
3. Correct password → set an HMAC-signed, `HttpOnly`, `Secure`, `SameSite=Lax`
   cookie with a 14-day expiry, and redirect.

The details that make this "secure. ish" rather than merely "a password box":

- The password lives in a Worker **secret**, never in the repo.
- Compare it with `crypto.subtle.timingSafeEqual`, not `===`, so response
  timing does not leak the password.
- The cookie carries an expiry and an HMAC over it, so it cannot be forged or
  extended by the client.
- Add a Cloudflare rate-limiting rule on `POST /facilitators` — roughly 5
  attempts per minute per IP — so the password cannot be brute-forced. Skipping
  this is what turns a decent design into a bad one.
- Serve the PDFs from under `/facilitators/` so the same gate covers them, and
  add `X-Robots-Tag: noindex` on everything behind it.

An optional extra worth about twenty more lines: keep the password hash in
Cloudflare KV and put a "change the password" form inside the protected area.
Then the client can rotate it themselves after a training cohort turns over,
without opening the Cloudflare dashboard or calling anyone.

### Which one

**Option A, unless the client specifically wants a shared password.**

A shared password has one property worth being explicit about with the client
before they choose it: it cannot be revoked from one person. When a facilitator
leaves — or the password reaches a group chat, which over a few years it will —
the only remedy is changing it for everyone and re-notifying every facilitator.
For an organisation whose protected materials are child sexual abuse prevention
curricula, per-person revocation is worth some setup friction.

Option A is also, unusually, both the more secure choice *and* the smaller build.
Option B exists because "simple" sometimes genuinely wins, and if the client
picks it after hearing the trade-off, it is a perfectly defensible answer —
implemented as above, it is stronger than most password-protected pages on the
web.

---

## Decisions needed

1. **Hosting** — is Cloudflare acceptable, and who owns the account? It should
   be SAC Brant's, not an individual's.
2. **Facilitator sign-in** — named people with emailed PINs (Option A), or one
   shared password (Option B)?

Everything else in this document can proceed once those two are settled.

## Suggested order of work

1. Hosting + deploy pipeline (unblocks everything else).
2. Open Graph metadata, `site` config, 404 page, `robots.txt` — small, and the
   sharing fix has outsized value given the Facebook and Instagram traffic.
3. Replace or gate the placeholder events data.
4. Gallery: content collection, `/photos` pages, CMS, auth proxy.
5. Facilitator gate.
