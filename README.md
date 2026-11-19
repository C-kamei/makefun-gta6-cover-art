# Vice Cover — GTA-style cover art maker

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/C-kamei/makefun-gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/C-kamei/makefun-gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Turn your own photos and a caption into a GTA-style poster: a multi-panel
layout with bold caption lettering and a Vice City sunset or neon colour
grade, exported as a PNG to share. Everything runs offline in the browser —
photos are read on your machine and never uploaded.

## How to use it

1. Open `app/index.html` in desktop Chrome (or serve `app/` with any static
   server, e.g. `node serve.ts` and open http://localhost:8080).
2. **Add photos** — pick up to 3 from your machine, drag & drop them onto the
   preview, or try the two built-in sample photos.
3. **Crop & position** — pick a photo tab, then zoom and pan it inside its
   panels. Choose which photo fills each panel, or fill all panels with one.
4. **Pick a layout** (Sunset, Neon strips, Boulevard) and a **colour grade**
   (Sunset, Neon, Noir), and set the grade strength.
5. **Write the caption** — a title and a subtitle, in Pop or Neon lettering.
6. **Export** — a PNG at 1080 × 1080, 1080 × 1350 or 1920 × 1080, or all three
   at once.

## Original art only

All art is drawn from scratch with the canvas 2D API: panel layouts, sunset
and neon gradients, the retro striped sun motif and the bold lettering are
original. No Rockstar Games logo, artwork, character or font is used, and the
app uses system fonts only — no font files are shipped. The two sample photos
under `app/samples/` were made with an image model for make.fun and are free
to use.

## Repository layout

- `app/` — the static web app (`index.html`, `style.css`, `src/cover.js` the
  render engine, `src/main.js` the editor, `src/shots.js` screenshot scenes).
- `screenshots/` — screenshots of the app and covers it exported.
- `main.ts` — hands `app/` and `screenshots/` in with a dossier (`buildDossier`
  from `vendor/makefun-app.ts`); run `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`.
- `serve.ts` — tiny static server for local testing.
