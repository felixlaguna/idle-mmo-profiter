---
id: imp-xw1f
status: open
deps: []
links: []
created: 2026-03-01T02:01:21Z
type: epic
priority: 2
assignee: Félix Laguna Teno
---
# Critical UI Review Round 2: Fix layout, hero, footer, settings, market, and alignment issues

Findings from Playwright screenshot review of both mobile (iPhone SE 375px) and desktop (1440px). 14 issues across critical/high/medium severity.


## Notes

**2026-03-01T02:05:06Z**

## Planning Complete — 2026-03-01

### Scouter Analysis

Examined the following files in detail:
- `src/App.vue` — Main app layout, hero section, tab navigation, settings button, header, footer mount
- `src/components/AppFooter.vue` — Footer component (IS imported and rendered)
- `src/components/MarketTable.vue` — Market table (does NOT use `mobile-card-layout` class)
- `src/components/ProfitRankingTable.vue` — Has filter-controls with 3 buttons
- `src/components/CraftableTable.vue` — Has sub-tab-navigation for Alchemy/Forging
- `src/components/ResourceTable.vue` — Uses `mobile-card-layout` correctly
- `src/style.css` — Global styles, CSS variables, `#app` containment

### Key Findings

1. **Footer rendering**: AppFooter IS in App.vue (line 525). The likely culprit is `contain: layout style paint` on `#app` in style.css, which prevents paint outside the container bounds. Combined with flexbox `min-height: 100vh`, the footer may be rendered but clipped.

2. **Hero always visible**: The `v-if="bestAction"` on line 311 has no tab condition. It renders on all 6 tabs.

3. **Settings button gated on static mode**: `v-if="!isStaticMode"` on line 279. If Playwright tested the static build, the button literally does not exist in the DOM.

4. **MarketTable is the outlier**: All other table components use the `mobile-card-layout` class. MarketTable uses its own `market-items-table` class without mobile card adaptation.

5. **Tab overflow is styled but subtle**: Mobile tabs have `overflow-x: auto` with a mask fade, but no explicit scroll indicator.

### Ticket Structure

4 task tickets created under this epic:

| ID | Title | Priority | Tags | Depends On |
|-----|-------|----------|------|------------|
| imp-wr99 | Fix invisible footer and hero section repeating | P0 Critical | ui, critical | — |
| imp-sfa7 | Fix mobile navigation (tabs, filters, settings) | P1 High | ui, mobile | — |
| imp-pup1 | Fix Market table layout and Craftable sub-tabs | P1 High | ui, layout | imp-wr99 |
| imp-x8fu | Fix orange artifact, text contrast, chart labels | P2 Medium | ui, polish | imp-wr99 |

### Dependency Graph

```
imp-wr99 (Critical: footer + hero)
├── imp-pup1 (Market table + sub-tabs)
└── imp-x8fu (Polish: artifact, contrast, charts)

imp-sfa7 (Mobile nav — independent, can start immediately)
```

imp-wr99 and imp-sfa7 can be worked in parallel.
imp-pup1 and imp-x8fu should wait until imp-wr99 is done (layout must be stable first).

### Risks

- **Footer fix**: Removing `contain: layout style paint` from `#app` may affect rendering performance. Test paint performance after removal.
- **Hero compact mode**: Needs new CSS + template; test that the compact bar renders correctly with long activity names (truncation needed).
- **Market card layout**: MarketTable has 4 separate `<table>` elements (materials, equipment, drops, craftables sections). Each needs `mobile-card-layout` + `data-label` attrs — significant template changes.
- **Chart font sizes**: Depends on whether charts use Chart.js responsive options or fixed sizes. May require per-chart investigation.
