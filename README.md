# ❤️ Places Visited

A simple static site tracking every place YK & Ac have visited — with ratings, cuisine tags, filters, and in-browser editing. No build step, no framework: just `index.html` + `places.json`.

**Live:** https://ssk2822.github.io/places-visited/

## Features

Search, cuisine chips, city and rating filters, sorting, YK / Ac / Overall ratings on a −3…+3 scale (Overall = average of YK & Ac), notes, Google Maps links, a 🎲 random picker, and an Add/Edit form. Works on desktop and mobile.

## Publish to GitHub Pages

```bash
cd places-visited
git remote add origin https://github.com/ssk2822/places-visited.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Source: GitHub Actions** and save. This repo includes a workflow that deploys the site on every push to `main`.

The site appears at `https://ssk2822.github.io/places-visited/` after a minute.

## Editing from the site

Add/Edit changes are saved in your browser first (an "Unpublished changes" bar appears). To push them back to the repo directly from the site:

1. Create a **fine-grained personal access token** at github.com → Settings → Developer settings → Fine-grained tokens, scoped to this repo with **Contents: Read and write**.
2. On the site, tap **⚙️**, paste the token, save.
3. Tap **Publish to GitHub** — it commits `places.json` and Pages redeploys automatically.

No token? Use **Export JSON** and paste the file into GitHub's web editor instead.

## Data format

`places.json` → `{ "places": [{ "id", "name", "cuisine", "city", "yk", "ac", "notes" }] }` — `yk`/`ac` are integers −3…3 or `null` (unrated).

## Local preview

`fetch()` needs http, so: `python3 -m http.server` in this folder, then open http://localhost:8000.
