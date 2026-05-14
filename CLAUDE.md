# CLAUDE.md — IdleMMO Profiter

## Wiki
- Entity: ~/wiki/entities/idle-mmo-profiter.md
- Concepts: ~/wiki/concepts/tools-and-versions.md

## Architecture
- Vue 3 (Composition API) + TypeScript + Vite 7
- Single-page app with tabbed interface (30+ components)
- Chart.js + vue-chartjs for visualizations
- Sharp (Node) + Canvas API for perceptual hashing (screenshot import)
- Three-tier data: user overrides (localStorage) → API cache → static defaults.json
- CSS variables for theming, mobile breakpoint at 767px

## Conventions
- **Build uses Docker** — never run `vite build` directly. Use `make build-app` or `make ci`
- Exact version pinning for all dependencies
- `defaults.json` is the master data file (891 items in `allItems`)
- Category-based arrays: materials, craftables, dungeons, resources, recipes, allItems
- API client: 20 req/min rate limit, exponential backoff, request dedup

## Commands
- `make up` — start dev server
- `make ci` — full CI pipeline (lint + typecheck + test + build)
- `make build-app` — production build via Docker
- `make lint` / `make typecheck` / `make test-run` — individual checks

## Key Files
- `src/App.vue` — Main app shell, tab navigation, global styles
- `src/data/defaults.json` — Master data (891 items, 27K+ lines)
- `src/composables/useScreenshotImport.ts` — Screenshot-based inventory import (dHash pipeline)
- `src/composables/useCharacterTracker.ts` — Inventory tracking, import integration point
- `src/components/CharacterTracker.vue` — Inventory UI with mobile card layout
- `src/style.css` — Global styles, animations, responsive overrides
