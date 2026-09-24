# Taylor the Turtle

Website for the Taylor the Turtle children's rights program — a collaboration
led by the Sexual Assault Centre of Brant and Ganohkwasra Family Assault
Support Services.

Built with [Astro](https://astro.build) and Tailwind. Photo albums are authored
in [Sanity](https://www.sanity.io); the architecture and its reasoning live in
`docs/superpowers/specs/2026-08-19-gallery-and-auth-design.md`.

## Commands

| Command           | Action                                       |
| :---------------- | :------------------------------------------- |
| `npm install`     | Install dependencies                         |
| `npm run dev`     | Start local dev server at `localhost:4321`   |
| `npm run build`   | Build the production site to `./dist/`       |
| `npm run preview` | Preview the build locally before deploying   |
| `npm run typecheck` | Typecheck the site and the Worker          |
| `npm test`        | Facilitator gate tests (run `npm run build` first) |

## Content editing (Sanity)

The "Taylor the Turtle" project id (`aq8y8vyq`) is baked into the config — no
env setup is needed. `.env.example` shows the overrides for pointing a build at
a different project or dataset.

- Sanity Studio is embedded at `/admin` — editors sign in with their email.
- Album schema: `src/sanity/schemaTypes/album.ts`. Albums only appear on the
  site once the photo-consent box is ticked.
- One-time project setup: add the site origin (and `http://localhost:4321`)
  under API → CORS origins in the Sanity project, and a deploy-hook webhook so
  publishing triggers a rebuild.
- Weekly dataset backup: `.github/workflows/sanity-backup.yml` — needs the
  `SANITY_AUTH_TOKEN` secret (a Viewer token from API → Tokens).

Images must always be rendered through the URL builders in `src/lib/sanity.ts`
(never a bare asset URL): the transformation re-encode is what strips EXIF/GPS
metadata from published photos. See the safeguarding notes in the design doc.

## Facilitator gate

Everything under `/facilitators` is behind one shared password, checked by the
Worker in `src/worker.ts` (design: Part 4 of the spec above).

- **Protected files go in `public/facilitators/`**, never in Sanity: Sanity
  asset URLs are public and would bypass the gate.
- `wrangler.jsonc` must keep `run_worker_first` covering `/facilitators` and
  `/facilitators/*`. Without it the files are served without the Worker ever
  running. `npm test` fails if that happens, and runs in CI.
- Sign-in attempts are limited to 5 a minute per IP (the `SIGN_IN_LIMITER`
  binding).
- The password form is `src/pages/facilitator-sign-in.astro`; the Worker
  serves it in place of anything gated.

**Secrets** (production), set once and whenever the password changes:

```sh
npx wrangler secret put FACILITATOR_PASSWORD
npx wrangler secret put COOKIE_SECRET   # e.g. the output of: openssl rand -base64 32
```

Until both are set, nobody can sign in. Changing `FACILITATOR_PASSWORD` leaves
existing sessions (up to 14 days) signed in; also change `COOKIE_SECRET` to
sign everyone out.

**Local dev:** `npm run dev` does not run the Worker, so `/facilitators` is
open there. To try the gate, copy `.dev.vars.example` to `.dev.vars`, then
`npm run build && npx wrangler dev`.
