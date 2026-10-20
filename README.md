# Jerserio · interactive 3D store

[**Try live demo →**](https://marzukulamin.github.io/jerserio/?demo=1) · [3D gallery](https://marzukulamin.github.io/jerserio/?view=preview)

A football jersey concept store built with React, TypeScript, Vite, Three.js, and React Three Fiber.

## What visitors can try

- Four jersey designs with interactive 3D views, pause, and keyboard-operable rotation controls.
- Search by design or team, browse collections, and read the brand story.
- Select a size and shipping country, add items, change quantities, remove items, and complete demo checkout.
- Save a demo display name. Cart and profile stay in the visitor's browser; no account is required.
- Responsive product forms, visible keyboard focus, labelled controls, modal focus handling, and reduced-motion support.

This is a portfolio demo. Checkout does not charge money, create real orders, or collect addresses. The public demo does not connect to Supabase. Existing SQL migrations remain reference material for a future authenticated backend; they are not needed to run this demo.

## Run locally

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. Add `?demo=1` to skip the intro or `?view=preview` to open the model gallery. Browser storage being blocked does not prevent shopping during the current page visit. The models are about 26 MB each, loaded on demand, so the first 3D view can take time on slow connections.

```sh
npm run typecheck
npm run lint
npm run build
```

## Deployment

GitHub Pages is deployed by `.github/workflows/deploy.yml` after pushes to `master` or `main`. It builds with `/jerserio/` as the base path and requires no environment secrets. Query-based routes work on refresh without server rewrites. Local and other hosting builds use `/` by default; an alternate host can pass Vite's `--base` option if needed.

## Add this to a portfolio

Use a normal external link, styled to match the portfolio:

```html
<a href="https://marzukulamin.github.io/jerserio/?demo=1"
   target="_blank" rel="noopener noreferrer"
   aria-label="Try the Jerserio live demo (opens in a new tab)">
  Try live demo ↗
</a>
```

Source link: `https://github.com/marzukulamin/jerserio`.

### Prompt for Codex in the portfolio project

> Update the Jerserio project card in this portfolio. Add a visible, keyboard-accessible “Try live demo” link to https://marzukulamin.github.io/jerserio/?demo=1 and a “Source code” link to https://github.com/marzukulamin/jerserio. Open external links in a new tab with rel="noopener noreferrer" and an accessible indication that a new tab opens. Match the portfolio's existing button styling, provide hover and focus states, and make the links work on mobile. Describe Jerserio as an interactive 3D jersey showroom with search, collections, a browser-local cart, and simulated checkout. Do not describe it as a real payment service. Keep all other project cards intact, test both links, and deploy the portfolio through its existing deployment process.
