---
id: imp-9e0m
status: closed
deps: [imp-z5uy]
links: []
created: 2026-03-04T19:33:50Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-xdt8
---
# Phase 4: Integrate CharacterTracker tab into App.vue

Wire the new CharacterTracker component into the existing tab navigation system in App.vue.

## Changes to src/App.vue

### 1. Update Tab type
- Add 'characters' to the Tab union type:
  `type Tab = 'all' | 'dungeons' | 'craftables' | 'resources' | 'market' | 'charts' | 'characters'`

### 2. Update tabs array
- Add 'characters' to the tabs array for keyboard navigation:
  `const tabs: Tab[] = ['all', 'dungeons', 'craftables', 'resources', 'market', 'charts', 'characters']`

### 3. Add lazy-loaded import
- Add defineAsyncComponent import for CharacterTracker:
  `const CharacterTracker = defineAsyncComponent(() => import('./components/CharacterTracker.vue'))`

### 4. Add tab button in template
- Add new tab button after Charts tab, following the exact same pattern:
  - tab-label-full: 'Characters'
  - tab-label-short: 'Chars'
  - No badge needed initially

### 5. Add tab content panel
- Add the CharacterTracker component in the tab-content section:
  `<div v-if="currentTab === 'characters'"><CharacterTracker /></div>`
- Wrap in ErrorBoundary and Suspense (same pattern as charts)
- Include skeleton loading fallback

## Notes
- The CharacterTracker component is self-contained; App.vue just mounts it
- No new props need to be passed down (composable handles data internally)
- Tab order: All | Dungeons | Craftables | Resources | Market | Charts | Characters

## Acceptance Criteria

New 'Characters' tab appears in navigation. Clicking it shows the CharacterTracker component. Tab keyboard navigation (arrow keys) includes the new tab. Lazy loading works correctly.


**2026-03-04T19:40:46Z**

App.vue integration complete:
- Tab type updated to include 'characters'
- tabs array updated with 'characters'
- CharacterTracker lazy-loaded with defineAsyncComponent
- Tab button added after Charts with labels 'Characters' / 'Chars'
- Tab content panel added with ErrorBoundary + Suspense + LoadingSpinner
- Tab order: All | Dungeons | Craftables | Resources | Market | Charts | Characters
