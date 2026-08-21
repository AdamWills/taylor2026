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
| `npx astro check` | Typecheck                                    |

## Content editing (Sanity)

Copy `.env.example` to `.env` and set `PUBLIC_SANITY_PROJECT_ID` (from
[sanity.io/manage](https://www.sanity.io/manage)). Without it, builds still
succeed: the photo gallery renders an empty state and `/admin` cannot connect.

- Sanity Studio is embedded at `/admin` — editors sign in with their email.
- Album schema: `src/sanity/schemaTypes/album.ts`. Albums only appear on the
  site once the photo-consent box is ticked.
- One-time project setup: add the site origin (and `localhost:4321`) under
  API → CORS origins in the Sanity project, and a deploy-hook webhook so
  publishing triggers a rebuild.
- Weekly dataset backup: `.github/workflows/sanity-backup.yml` — needs the
  `SANITY_AUTH_TOKEN` secret and `SANITY_PROJECT_ID` repo variable.

Images must always be rendered through the URL builders in `src/lib/sanity.ts`
(never a bare asset URL): the transformation re-encode is what strips EXIF/GPS
metadata from published photos. See the safeguarding notes in the design doc.
