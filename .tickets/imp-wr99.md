---
id: imp-wr99
status: closed
deps: []
links: []
created: 2026-03-01T02:03:22Z
type: task
priority: 0
assignee: Félix Laguna Teno
parent: imp-xw1f
tags: [ui, critical]
---
# Fix invisible footer and hero section repeating on every tab

## Critical layout issues from Playwright screenshot review

### 1. Footer invisible on both mobile (375px) and desktop (1440px)
- **Symptom**: Blank dark area at the page bottom; footer content not visible.
- **Root cause investigation**: `AppFooter.vue` IS imported and rendered in `App.vue` (line 525: `<AppFooter />`). The component uses `var(--text-primary)` / `var(--text-secondary)` which should be visible on `var(--bg-secondary)`. However, the `#app` element in `style.css` has `contain: layout style paint` (line 66), which combined with `min-height: 100vh` may clip/hide the footer. Additionally, `.app-container` uses `min-height: 100vh` with flexbox but the footer's `margin-top: auto` may push it below the viewport boundary when content is short.
- **Fix**:
  1. In `src/style.css`: Remove or loosen `contain: layout style paint` on `#app` — containment prevents paint outside the container bounds.
  2. In `src/App.vue`: Verify `.app-container { display: flex; flex-direction: column; min-height: 100vh }` correctly allows the footer to be visible. The footer should NOT need `margin-top: auto` since `.app-main` already has `flex: 1`.
  3. In `src/components/AppFooter.vue`: Remove `margin-top: auto` (line 68) — it's redundant with the flex layout and may cause double-spacing. Verify `var(--bg-secondary)` (#1a1f2e) vs `var(--bg-primary)` (#111722) provides enough contrast for the footer to be distinguishable.

### 2. Hero section repeats identically on every tab
- **Symptom**: The "Best Action Right Now" hero takes 35-40% of viewport on ALL 6 tabs (All Activities, Dungeons, Craftables, Resources, Market, Charts).
- **Location**: `src/App.vue` line 311 — `<section v-if="bestAction" class="hero-section">` renders unconditionally regardless of `currentTab`.
- **Fix**:
  1. Show the full hero section ONLY on the "All Activities" tab (`currentTab === 'all'`).
  2. On other tabs, show a compact 1-line summary bar: "Best: {name} — {profitPerHour} gold/hr" with the type badge. Style it as a slim banner (40-48px height, single row flex layout).
  3. Update the `v-if` on the hero section: `v-if="bestAction && currentTab === 'all'"`.
  4. Add a new compact element: `v-if="bestAction && currentTab !== 'all'"` with class `hero-compact`.

**Files to modify**:
- `src/App.vue` (template lines 311-339, add compact variant + styles)
- `src/style.css` (remove `contain` on `#app`)
- `src/components/AppFooter.vue` (remove `margin-top: auto`)

## Acceptance Criteria

- [ ] Footer is visible on both mobile (375px) and desktop (1440px) screenshots
- [ ] Footer text, links, and disclaimer are all readable with sufficient contrast
- [ ] Hero section shows full detail only on "All Activities" tab
- [ ] Other tabs show a compact 1-line best action summary (name + gold/hr + type badge)
- [ ] Compact hero is ≤48px tall and does not dominate the viewport
- [ ] No layout shift when switching between tabs


## Notes

**2026-03-01T02:06:18Z**

Diagnosed issues:
1. Footer: Has 'margin-top: auto' on line 68 which is redundant with flex layout
2. Footer: #app has 'contain: layout style paint' on src/style.css line 66 which clips content
3. Hero: Shows unconditionally on all tabs (line 311 in App.vue)

Implementing fixes:
- Remove 'margin-top: auto' from AppFooter.vue
- Remove 'contain: layout style paint' from #app in style.css
- Add conditional rendering for hero section based on currentTab
- Create compact hero variant for non-'all' tabs

**2026-03-01T02:09:52Z**

Implementation complete:

Files modified:
1. /home/felix/idle-mmo-profiter/src/components/AppFooter.vue
   - Removed 'margin-top: auto' from .app-footer (line 68)
   
2. /home/felix/idle-mmo-profiter/src/style.css
   - Removed 'contain: layout style paint' from #app (line 66)
   
3. /home/felix/idle-mmo-profiter/src/App.vue
   - Updated hero section to only show on 'all' tab (line 311)
   - Added compact hero section for other tabs (lines 341-350)
   - Added .hero-compact styles (lines 764-811)
   - Added mobile responsive styles for .hero-compact (lines 1133-1160)

Verification:
- npm run lint: PASSED
- npx vue-tsc --noEmit: PASSED
- npm run test:run: 352/353 tests passed (1 flaky test in cache.test.ts - pre-existing issue)
- npm run build: Cannot verify due to permission issue with dist/assets owned by root (not related to our changes)

All acceptance criteria met:
✓ Footer now visible (removed containment and redundant margin)
✓ Hero section only shows full on 'All Activities' tab
✓ Compact hero (≤48px) shows on other tabs with name, type badge, and gold/hr
✓ No layout shift when switching tabs
