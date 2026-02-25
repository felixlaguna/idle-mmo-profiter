---
id: imp-jug7
status: open
deps: []
links: []
created: 2026-02-25T18:27:55Z
type: epic
priority: 2
assignee: Félix Laguna Teno
tags: [frontend, idlemmo, greenfield]
---
# IdleMMO Profit Calculator - Full Project

Frontend-only web app showing most profitable actions in IdleMMO based on market prices. API key in local storage, manual value editing, default JSON data, charts, mobile-friendly + desktop.


## Notes

**2026-02-25T18:35:34Z**

## Planning Complete - Detailed Analysis

### Source Data Analysis (Idlemmo.xlsx)

The Excel has 4 sheets with the following data:

**Market Sheet (346 rows, 4 data sections in columns A-R):**
- Col B-C: 11 materials (monster drops used in potion crafting) with market prices
- Col F-G: 6 potions with market sell prices
- Col J-K: 7 resources (coal, fish, ores) with market prices
- Col N-Q+R: 345 recipes with names, prices, drop chances, and rarity multipliers
  - Drop chances are either static (e.g., 0.05) or computed formulas (e.g., =0.2*0.25, =R39/100)
  - Column R contains rarity scaling factors for dungeon-specific drops

**Dungeon Sheet (19 rows + MF config):**
- 18 dungeons from Millstone Mines to Nexus
- Each dungeon has: name, offset (row pointer into Market recipes), run cost, time (seconds), number of drops (7-26)
- Complex MAP/LAMBDA formula computes expected value per drop using Market sheet references
- MF config at rows 23-27: Streak=10, Dung=13, Item=3, Bonus=10 (total=36)
- Profit formula: SUM(all drop expected values) - run_cost
- Profit/h formula: profit / (time / 3600)

**Potions Sheet (9 rows):**
- 6 active potions (Wraithbane, Thunderfury, Gourmet, Dungeon Master, Frenzy, Cosmic)
- 3 placeholder potions (Elixir of Life, Potion of the Gods, Eternal Feast Tonic - no data yet)
- Each potion: craft time (~818-1091s), material quantities, vial cost (200-500), current sell price
- Benefit = sell_price - (total_cost * 1.12)

**Profit Sheet (13 rows):**
- Resources with vendor vs market comparison
- Multi-step chains: raw fish -> cooked, ore -> bar
- Full chain calculations including gathering time
- Winner formula: picks the best overall activity

### API Analysis (idle-mmo-docs.html)

**Base URL:** https://api.idle-mmo.com/v1
**Auth:** Bearer token
**Rate Limit:** 20 req/min (shared across all API keys per user) -- VERY LOW, must be careful
**Rate Limit Headers:** X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset

**Relevant Endpoints for this app:**
1. GET /v1/auth/check - validate API key, get scopes and rate limit
2. GET /v1/item/search - paginated item search (20 per page, ~18 pages for all items = 18 requests!)
3. GET /v1/item/{id}/inspect - item details including recipes and vendor price
4. GET /v1/item/{id}/market-history - price history (listings or orders)

**Rate Limiting Strategy (CRITICAL):**
- Full item catalog fetch would need ~18 search pages + potentially 345 inspect calls = 363 requests
- At 20 req/min, this would take ~18 minutes just for initial data load
- Strategy: ship with defaults.json, only fetch market-history for specific items when user requests
- Cache aggressively: item search/inspect = 24h TTL, market-history = 1h TTL
- Never auto-fetch everything; let user trigger selective updates

### Epics Created (7 epics, 25 tasks)

1. **imp-dv3t** - Project Scaffolding & Core Data Model (3 tasks)
2. **imp-7w43** - API Integration Layer (4 tasks) -- depends on Epic 1
3. **imp-64ql** - Local Storage Persistence & Manual Data Entry (4 tasks) -- depends on Epic 1
4. **imp-90r5** - Profit Calculation Engine (4 tasks) -- depends on Epic 1
5. **imp-5r5u** - UI Dashboard & Data Tables (6 tasks) -- depends on Epics 3 & 4
6. **imp-vj8g** - Charts & Visualizations (4 tasks) -- depends on Epic 5
7. **imp-d3kp** - Mobile Responsiveness & Polish (4 tasks) -- depends on Epics 5 & 6

### Dependency Graph
```
Epic 1 (Scaffolding)
  |---> Epic 2 (API Client)
  |---> Epic 3 (localStorage)  --+
  |---> Epic 4 (Calc Engine)   --+--> Epic 5 (UI) --> Epic 6 (Charts) --> Epic 7 (Polish)
```
Epics 2, 3, 4 can be worked in parallel after Epic 1 is done.

### Risks and Considerations

1. **API Rate Limiting (HIGH):** 20 req/min is extremely low. The app MUST work fully without API. Ship with complete default data.
2. **No API Key Until Code Review:** User explicitly said they will not provide API key until they review the project. Default data mode must be first-class.
3. **Excel Formula Complexity:** The dungeon sheet uses Google Sheets MAP/LAMBDA functions that reference across sheets. These need careful manual translation to JS.
4. **345 Recipes:** Large dataset. The default JSON must be carefully extracted with all computed values pre-baked.
5. **Market Tax:** 12% tax is applied to market sales. This is configurable but hardcoded in Excel formulas.

### Tech Stack Decision

Recommending Vite + vanilla TypeScript (no React/Vue):
- This is a calculator/dashboard, not a complex interactive app
- No routing needed (single page)
- Lightweight: faster load, smaller bundle
- Direct DOM manipulation is fine for tables and inline editing
- Chart.js for charts (lazy-loaded)
- No CSS framework needed - custom dark theme CSS

Ready for user approval.

**2026-02-25T18:42:03Z**

User approved plan with 7 epics. Tech stack: Vite + Vue 3 + TypeScript. Proceeding with all epics.
