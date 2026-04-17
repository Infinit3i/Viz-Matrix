# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Viz-Matrix is a cybersecurity visualization platform. Sibling project to [SIEMSEEK](https://github.com/Infinit3i/SIEMSEEK), sharing the same tech stack and design philosophy.

## Tech Stack

React 18, TypeScript 5, Vite (port 1420), Tailwind CSS 3, React Router DOM 6, Tauri 2 (Rust desktop shell). ES modules, npm.

## Commands

```bash
npm run dev          # Vite dev server
npm run build        # tsc -b && vite build (full validation)
npm run typecheck    # TypeScript only
npm run tauri:dev    # Tauri desktop dev
npm run tauri:build  # Desktop production build
```

`npm run build` is the gate — it must pass before any work is considered complete.

## Architecture

Follows the same structure as SIEMSEEK:

- `src/app/` — router (`router.tsx`) and navigation config (`navigation.ts`)
- `src/pages/` — one `{Feature}Page.tsx` per route
- `src/components/{feature}/` — feature-scoped UI components
- `src/components/layout/` — app shell and page layout
- `src/components/ui/` — shared presentational primitives
- `src/lib/` — feature logic and helpers
- `src/data/` — local content and datasets
- `src/styles/index.css` — theme tokens as CSS custom properties

## Styling

Tailwind utility classes only (no inline styles). Theme uses CSS custom properties for canvas/surface/border/text/accent/status colors with dark mode via `dark` class on root. Fonts: IBM Plex Sans (body), IBM Plex Mono (code).

## Conventions

- One component per file
- Pages named `{Feature}Page.tsx` in `src/pages/`
- Feature components in `src/components/{feature-name}/`
- UI must feel like a real security tool — structured layouts, clear hierarchy, no generic dashboard aesthetics
- Offline-capable: minimize external API reliance
- TypeScript strict mode, no `any` unless unavoidable
