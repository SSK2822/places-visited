# ❤️ Places Visited

Welcome to our running list of food spots, sweet treats, coffee runs, random cravings, and occasional "how did we find this place" moments.

Now a proper web app built with **React + Vite**, styled as an editorial ledger with the
**Classical** design system, and deployed to GitHub Pages.

Live site: [https://ssk2822.github.io/places-visited/](https://ssk2822.github.io/places-visited/)

## What this app does

1. Tracks places with YK and Ac ratings from `-3` to `+3`, in quarter steps
2. Calculates an overall score automatically, and ranks the ledger by it
3. Splits the list into **Ranked** (scored) and **To rate** (been there, verdict pending)
4. Supports search and cuisine chips
5. Adds Google Maps quick links for each place
6. Includes a "Surprise us" slot machine for indecisive food nights
7. Lets you add and edit entries directly in the browser
8. Works on desktop and mobile

## Tech stack

- [Vite](https://vitejs.dev/) — dev server and build tool
- [React 18](https://react.dev/) — UI components
- Classical design system — a vendored token sheet (`src/styles/classical.css`);
  no UI framework, every colour/font/space comes from its `var(--*)` tokens
- GitHub Actions + GitHub Pages — CI and hosting

## Project structure

```text
index.html                  Vite entry page
public/places.json          The data (seed / legacy-mode store)
src/
  main.jsx                  App bootstrap (imports the two stylesheets)
  App.jsx                   State, filtering, and browse/detail/add routing
  components/
    Masthead.jsx            Kicker, title, ornament rule, Account link
    StatsLedger.jsx         The four ruled stat columns
    LedgerControls.jsx      Search, cuisine chips, actions, Ranked/To-rate
    LedgerList.jsx          The ranked + pending ledger rows
    PlaceDetail.jsx         One place: scores and "Table talk"
    PlaceForm.jsx           Add/edit form
    RatingDial.jsx          The drag/keyboard -3..+3 rating dial
    SurpriseOverlay.jsx     The "Surprise us" slot machine
    CountUp.jsx             A score that counts up once revealed
    Dialog.jsx              Modal built on the system's .dialog
    Toast.jsx               Bottom status message
    AccountModal.jsx        Google sign-in / backup / seed
    SettingsModal.jsx       GitHub sync settings
    DirtyBar.jsx            "Unpublished changes" bottom bar
  hooks/useInView.js        Staggered scroll reveal
  lib/
    constants.js            Cuisine list, defaults, storage keys
    utils.js                Rating math, formatting, slugs
    cloud.js                Firestore + Google auth
    github.js               Publish places.json via the GitHub API
  styles/
    classical.css           Vendored design-system tokens + components
    app.css                 App styling, built from those tokens
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

The app has two sync modes, chosen automatically by `src/lib/firebase-config.js`:

### Cloud mode (Firebase) — recommended

When `firebaseConfig` is filled in, the app reads and writes a Firestore
database with live sync. Anyone can browse; editing requires signing in with
a Google account listed in `EDITORS` (and in `firestore.rules`).
No tokens, works great on mobile.

One-time setup:

1. Create a free project at [console.firebase.google.com](https://console.firebase.google.com)
2. Create a **Firestore Database** (production mode)
3. Enable **Authentication → Sign-in method → Google**
4. Add the Pages domain under **Authentication → Settings → Authorized domains**
5. Register a **Web app** and paste its config into `src/lib/firebase-config.js`
6. Paste `firestore.rules` (with your two emails) into **Firestore → Rules**
7. Sign in on the site and use **Account → Import places from places.json** to seed the data

### Legacy mode (GitHub token)

When `firebaseConfig` is `null`, edits are saved in your browser and can be
published by committing `public/places.json` through the GitHub API — click
`Account`, save a fine-grained token (`Contents: Read and write`), then
`Publish to GitHub`. Or click `Export JSON` and update the file manually.

## Backups and restore

Firestore on the **Spark (free) plan has no point-in-time recovery and no
scheduled backups**, so if the database is overwritten there is nothing on
Google's side to roll back to. The repo is the safety net instead.

### Automatic backups (the recovery log)

`.github/workflows/backup.yml` snapshots the live database into
`backups/places.latest.json` every 6 hours (and on demand via **Actions → Backup
Firestore → Run workflow**), committing only when something changed. Git history
is therefore the log:

```bash
git log -p backups/places.latest.json     # every rating and place that came or went
```

Any past version can be restored (see below). The script is read-only and
refuses to write a snapshot if the collection comes back empty — an empty read is
far more likely to be a broken listener than a genuinely empty database, and
committing it would overwrite a good backup with a useless one.

One-time setup — the workflow needs admin credentials, which bypass the security
rules, so they live in a GitHub secret and never in the browser:

1. Firebase console → **Project settings → Service accounts → Generate new private key**
2. GitHub → **Settings → Secrets and variables → Actions → New repository secret**
3. Name it `FIREBASE_SERVICE_ACCOUNT`, paste the whole JSON file as the value

Keep that key out of the repo — anything holding it can read and write the
database.

### Restoring

**Account → Restore from a backup**, signed in as an editor. Pick any backup
file: `backups/places.latest.json`, a `Download backup` export, or an old
snapshot pulled out of git history.

It shows what it would change before writing anything, and it **only fills
blanks** — it never overwrites a field that already holds a value. So an old
export can't undo newer edits, and running the same restore twice does nothing
the second time. It reads both the current schema and the pre-Firestore exports
(whose shared `notes` field is attributed to Yash's comment).

That is deliberately the opposite of **Import places from places.json**, which
writes whole documents from a seed file with no ratings in it. The import is for
a first-time, empty database only; it re-checks the server and refuses if the
collection is not empty. If you ever see an empty ledger, **do not import** —
reach for a restore.

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
