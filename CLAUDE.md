# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Viz-Matrix is a MITRE ATT&CK visibility coverage matrix. It maps log sourcetypes to ATT&CK techniques so defenders can see which techniques they have visibility into and where their blind spots are. Single-page Vue 3 application — no routing, no backend.

## Commands

```bash
npm run dev          # Vite dev server (port 5173)
npm run build        # vue-tsc -b && vite build (full type-check + bundle)
```

`npm run build` must pass before any work is considered done.

## Architecture

Single-page app with one main view (`AttackMatrix.vue`) composed of four components:

- **AttackMatrix** — orchestrates the full layout: sidebar, header with stats, matrix grid, and footer legend. Owns the `activeSourceIds` state that controls which sourcetypes are toggled on.
- **MatrixCell** — one cell per technique. Computes coverage count from active sources and renders a color from red (low) → yellow (mid) → green (high). Zero coverage = dark zinc.
- **SourcetypePanel** — sidebar with sourcetypes grouped by category (endpoint, network, identity, cloud, email, application). Toggle individual sources or entire categories.
- **CoverageStats** — header bar showing covered/blind/total counts and overall percentage.
- **TechniqueTooltip** — hover tooltip showing technique ID, name, coverage bar, and which sources cover it.

## Data Layer

All data is in `src/data/`:

- **mitreData.ts** — 14 tactics, each with an array of techniques (id + name). This is the grid structure.
- **sourcetypes.ts** — each sourcetype has an id, display name, category, color, and array of technique IDs it covers. Adding a new sourcetype means adding an entry here with the technique IDs it provides visibility into.

## Styling

Tailwind CSS v4 via `@tailwindcss/vite` plugin. Dark theme only (zinc-950 background). Fonts loaded from Google Fonts: Inter (body) and JetBrains Mono (data/code). Custom `.cell-hover` class in `style.css` handles the matrix cell scale-on-hover effect.
