---
id: imp-2tmn
status: closed
deps: [imp-1bs4]
links: []
created: 2026-02-25T22:18:30Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-6z9j
---
# Phase 3: Integrate Market tab into App.vue

## Overview
Add the Market tab to the main App.vue tab navigation so users can switch to it and edit item prices.

## Files to Modify
- /home/felix/idle-mmo-profiter/src/App.vue

## Changes Required

### 1. Update Tab Type (line 27)
Change:
```typescript
type Tab = 'all' | 'dungeons' | 'potions' | 'resources' | 'charts'
```
To:
```typescript
type Tab = 'all' | 'dungeons' | 'potions' | 'resources' | 'charts' | 'market'
```

### 2. Import MarketTable Component
Add import near the other table imports (around line 13):
```typescript
import MarketTable from './components/MarketTable.vue'
```

### 3. Add Tab Button (after Charts tab button, around line 291)
Add a new tab button in the nav element following the exact same pattern as existing tabs:
```html
<button
  class="tab-button"
  :class="{ active: currentTab === 'market' }"
  role="tab"
  :aria-selected="currentTab === 'market'"
  :tabindex="currentTab === 'market' ? 0 : -1"
  @click="currentTab = 'market'"
>
  Market
</button>
```

### 4. Add Tab Content (after Charts section content, around line 344)
Add the Market tab content panel:
```html
<div v-if="currentTab === 'market'">
  <MarketTable />
</div>
```

### 5. No Props Needed
Since useDataProvider is now a singleton (Phase 1), MarketTable calls useDataProvider() internally and shares the same reactive state with App.vue. No props or events need to be wired.

## Verification
- The Market tab button appears in the navigation bar
- Clicking it shows the MarketTable component
- Editing a price in the Market tab causes profit recalculations in other tabs (verify by switching back to All Activities or Dungeons tab)
- The tab follows the same accessibility patterns (role, aria-selected, tabindex)

## Acceptance Criteria

Market tab button appears in nav; clicking it renders MarketTable; edits propagate to other tabs reactively; accessibility attributes match existing tabs


## Notes

**2026-02-25T22:23:55Z**

Integrated Market tab into App.vue.

Changes:
- Added MarketTable component import
- Updated Tab type to include 'market'
- Added Market tab button in navigation (positioned between Resources and Charts)
- Added Market tab content panel that renders MarketTable component
- No props needed because dataProvider is now a singleton

Verified: Build passes successfully with 77 modules (increased from 74).
