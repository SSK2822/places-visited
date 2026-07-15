# ❤️ Places Visited

Welcome to our running list of food spots, sweet treats, coffee runs, random cravings, and occasional "how did we find this place" moments.

This is a lightweight static app powered by just:

1. `index.html`
2. `places.json`

No framework. No build step. No drama.

Live site: [https://ssk2822.github.io/places-visited/](https://ssk2822.github.io/places-visited/)

## What this app does

1. Tracks places with YK and Ac ratings from `-3` to `+3`
2. Calculates an overall score automatically
3. Supports search, cuisine chips, city filter, rating filter, and sorting
4. Adds Google Maps quick links for each place
5. Includes a random picker for indecisive food nights
6. Lets you add and edit entries directly in the browser
7. Works on desktop and mobile

## Deploying to GitHub Pages

This repo is configured to deploy using GitHub Actions.

1. Push changes to `main`
2. In GitHub, open **Settings > Pages**
3. Set **Source** to **GitHub Actions**
4. Wait about a minute and refresh the site

Workflow file:

1. `.github/workflows/blank.yml`

## Editing data from the site

When you edit or add places, changes are first saved in your browser as local unpublished changes.

To publish from the site:

1. Create a fine-grained GitHub token with repo access (`Contents: Read and write`)
2. Click `⚙️` in the app and save owner, repo, branch, and token
3. Click `Publish to GitHub`

If you do not want to use a token, click `Export JSON` and update `places.json` manually in GitHub.

## Data format

`places.json` uses this shape:

```json
{
  "updated": "2026-07-15",
  "places": [
    {
      "id": "unique-id",
      "name": "Place name",
      "cuisine": "Cuisine",
      "city": "City",
      "yk": 2,
      "ac": 1,
      "notes": "Optional notes"
    }
  ]
}
```

`yk` and `ac` can be `null` when not rated yet.

## Local preview

Because this app fetches `places.json`, run a small local server:

```bash
python3 -m http.server
```

Then open [http://localhost:8000](http://localhost:8000).

## Tiny FAQ

Q: Why does the root URL show something else?

A: This is a project site, so use `/places-visited/` in the URL.

Q: Why is dinner planning still hard?

A: The random button is trying its best.
