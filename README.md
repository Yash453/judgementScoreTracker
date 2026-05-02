# Judgement Score Tracker

A web-based score tracker for **Judgement** (a.k.a. Kachi Fuali / Kachufull) — the Indian trick-taking card game where each player bids how many tricks they'll win each round.

## Rules baked in

- **Players:** 2 – 7
- **Default round structure:** `floor(52 / players)` cards down to 1, then back up
  (e.g. 5 players → 10 → 1 → 10, **19 rounds**)
- **Trump rotation:** ♠ Spades → ♦ Diamonds → ♣ Clubs → ♥ Hearts (cycles)
- **Dealer:** rotates by one seat each round; bidding starts to the left, dealer bids last
- **Bid constraint:** dealer cannot bid such that total bids = cards dealt
- **Scoring:** hit your bid → `10 + bid` points · miss → `0`

## Features

- Player setup with seating order, drag/reorder, optional config overrides
- Round-by-round flow: bid phase → tricks phase → score → next round
- Live validation (dealer-bid constraint, trick totals)
- Per-round score breakdown table
- Game state persisted to `localStorage` — refresh-safe
- Completed-game history with full round-by-round detail

## Develop

```bash
npm install
npm run dev          # http://localhost:5173
npm run test         # vitest
npm run build        # type-check + production build to ./dist
npm run preview      # preview the production build
```

## Deploy

A GitHub Actions workflow (`.github/workflows/pages.yml`) builds and deploys
to GitHub Pages on every push to `main`. To turn it on:

1. **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Merge to `main` (or use *Actions → Deploy to GitHub Pages → Run workflow*).
3. Site will be live at `https://<owner>.github.io/<repo>/`.

The workflow exports `BASE_PATH=/<repo>/` to Vite so all asset URLs resolve
correctly under the repo subpath. Routing uses `HashRouter`, so deep links
work without a SPA-fallback `404.html`.

## Stack

React 18 · Vite · TypeScript · Tailwind CSS · Zustand (with `persist`) · Vitest + Testing Library
