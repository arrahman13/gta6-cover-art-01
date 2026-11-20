# gta6-cover-art-01

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/arrahman13/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/arrahman13/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Leonida Cover Lab** — an offline web app that turns your photos and a caption into GTA-style cover art. Six layouts (a 3×3 cover grid with a title medallion and the lab's ghost mascot, quad poster, hero + trio, triptych, filmstrip with sprocket holes, and a full-bleed postcard with a procedural skyline-and-palms shore), five colour grades poured over every panel by gradient mapping (Leonida Sunset, Neon Nights, Golden Hour, Vice Duotone, Ink Mono), chunky sunset-filled display lettering with a neon script subtitle and a ribbon badge, print grain and vignette, and one-click PNG export in the sizes posts actually come in (1080 × 1080, 1080 × 1350, 1920 × 1080). Every panel takes its own photo with drag-to-position and zoom, or one photo can fill them all. It runs entirely from static files in a desktop browser — photos are read on your own machine and never uploaded. All art, lettering and code are original; the display fonts are Anton and Pacifico under the SIL Open Font License (bundled in `app/fonts/`), and the three sample photos were made for this entry.

Entered in the [make.fun bounty “Make GTA 6 Cover Art”](https://make.fun/bounty/gta6-cover-art-01).

## Run it

```sh
node serve.ts          # serves app/ at http://localhost:8080
```

Open http://localhost:8080 in a desktop browser, add photos, pick a layout and a grade, write your title, and export the PNG. No install, no build, no network.

To hand the entry in the way the grader does:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

That copies `app/` and `screenshots/` to `out/` and writes `out/dossier.json`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=pb4k2c9b&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
