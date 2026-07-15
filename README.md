# ❤️ Places Visited

Welcome to our running list of food spots, sweet treats, coffee runs, random cravings, and occasional "how did we find this place" moments.

Now a proper web app built with **React + Vite + Bootstrap 5**, deployed to GitHub Pages.

Live site: [https://ssk2822.github.io/places-visited/](https://ssk2822.github.io/places-visited/)

## What this app does

1. Tracks places with YK and Ac ratings from `-3` to `+3`
2. Calculates an overall score automatically
3. Supports search, cuisine chips, city filter, rating filter, and sorting
4. Adds Google Maps quick links for each place
5. Includes a random picker for indecisive food nights
6. Lets you add and edit entries directly in the browser
7. Works on desktop and mobile

## Tech stack

- [Vite](https://vitejs.dev/) — dev server and build tool
- [React 18](https://react.dev/) — UI components
- [Bootstrap 5](https://getbootstrap.com/) + [react-bootstrap](https://react-bootstrap.netlify.app/) — styling and modals
- GitHub Actions + GitHub Pages — CI and hosting

## Project structure

```text
index.html                  Vite entry page
public/places.json          The data (committed to the repo)
src/
  main.jsx                  App bootstrap (imports Bootstrap + theme)
  App.jsx                   State, filtering, and layout
  components/
    AppNavbar.jsx           Title + Surprise / Settings / Add buttons
    StatsBar.jsx            The four stat tiles
    FilterBar.jsx           Search, selects, cuisine chips
    PlaceCard.jsx           One place card with rating pills
    EditPlaceModal.jsx      Add/edit form with rating sliders
    SettingsModal.jsx       GitHub sync settings
    DirtyBar.jsx            "Unpublished changes" bottom bar
  lib/
    constants.js            Cuisine list, defaults, storage keys
    utils.js                Rating math, formatting, slugs
    github.js               Publish places.json via the GitHub API
  styles/theme.css          Custom dark theme on top of Bootstrap
```

## Local development

```bash
npm install
npm run dev
```

Then open the URL Vite prints (it serves under `/places-visited/`).

Other commands:

```bash
npm run build     # production build into dist/
npm run preview   # serve the production build locally
```

## Deploying to GitHub Pages

Push to `main` and GitHub Actions builds the app and deploys `dist/` to Pages
(`.github/workflows/deploy.yml`). In GitHub, **Settings > Pages > Source** must be set to
**GitHub Actions**.

## Editing data from the site

When you edit or add places, changes are first saved in your browser as local unpublished changes.

To publish from the site:

1. Create a fine-grained GitHub token with repo access (`Contents: Read and write`)
2. Click `⚙️` in the app and save owner, repo, branch, and token
3. Click `Publish to GitHub`

Publishing commits `public/places.json`, which triggers the deploy workflow and refreshes the site.

If you do not want to use a token, click `Export JSON` and update `public/places.json` manually in GitHub.

## Data format

`public/places.json` uses this shape:

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

## Tiny FAQ

Q: Why does the root URL show something else?

A: This is a project site, so use `/places-visited/` in the URL.

Q: Why is dinner planning still hard?

A: The random button is trying its best.
