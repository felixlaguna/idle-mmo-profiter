---
id: imp-1bs4
status: closed
deps: [imp-xjsb]
links: []
created: 2026-02-25T22:18:18Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-6z9j
---
# Phase 2: Create MarketTable.vue component

## Overview
Create the main Market tab component that displays ALL items grouped by category, with inline-editable prices using the existing EditableValue.vue component.

## Files to Create
- /home/felix/idle-mmo-profiter/src/components/MarketTable.vue

## Component Design

### Data Source
- Call useDataProvider() (now singleton) to get: materials, potions, resources, recipes
- Also get: updateMaterialPrice, updatePotionPrice, updateResourcePrice, updateRecipe, hasOverride, clearCategoryOverrides, clearAllOverrides, getOverrideStats
- Get default data from defaults.json import for defaultValue props on EditableValue

### Layout: 4 Collapsible Sections
Each section has a header with item count and collapse toggle.

**1. Materials Section (11 items)**
Table columns: Name | Price (editable)
- Each row: item.name, EditableValue for item.price
- On edit: call updateMaterialPrice(item.id, newPrice)
- Default expanded

**2. Potions Section (6 items)**
Table columns: Name | Market Price (editable)
- Each row: item.name, EditableValue for item.price
- On edit: call updatePotionPrice(item.id, newPrice)
- Default expanded

**3. Resources Section (7 items)**
Table columns: Name | Market Price (editable)
- Each row: item.name, EditableValue for item.marketPrice
- On edit: call updateResourcePrice(item.id, newMarketPrice)
- Default expanded

**4. Recipes Section (345 items)**
Table columns: Name | Price (editable) | Drop Chance (editable)
- Each row: item.name, EditableValue for item.price, EditableValue for item.chance (suffix: %)
- On edit: call updateRecipe(item.id, { price: newPrice }) or updateRecipe(item.id, { chance: newChance })
- Default COLLAPSED (too many items)
- Search bar at top of section that filters by name (case-insensitive substring match)

### Search/Filter Bar
- Single search input at the TOP of the Market tab (above all sections)
- Filters across ALL categories simultaneously
- Shows matching count per section header, e.g. 'Materials (3/11)'
- If a section has 0 matches, still show header but collapse it
- Debounced input (200ms) for performance with 345 recipes

### Override Indicators
- Use hasOverride(category, id) to show which items have been modified
- EditableValue already handles the visual indicator (blue highlight) via modelValue \!== defaultValue
- Need to pass correct defaultValue from the original defaults.json (not the overridden computed value)

### Bulk Actions
- 'Reset All' button at top to call clearAllOverrides()
- Per-section 'Reset Section' button to call clearCategoryOverrides(category)
- Show override count from getOverrideStats() near the reset buttons, e.g. '3 overrides'

### Styling
- Match the existing dark theme (use CSS variables: --bg-secondary, --bg-tertiary, --border-color, --text-primary, --text-secondary, etc.)
- Table styling should match ResourceTable.vue / PotionTable.vue patterns
- Section headers with collapsible toggle similar to dungeon drop breakdown pattern
- Responsive: horizontal scroll on small screens

## Key Implementation Notes
- Import defaultData from '../data/defaults.json' to get original default values for EditableValue defaultValue prop
- The computed materials/potions/resources/recipes from useDataProvider already have overrides applied, so modelValue comes from there
- defaultValue must come from the raw defaultData import to show the 'overridden' indicator correctly

## Acceptance Criteria

MarketTable renders all 4 sections; items display correctly; EditableValue works for all editable fields; search filters across all categories; collapsible sections work; override indicators show correctly


## Notes

**2026-02-25T22:23:07Z**

Created MarketTable.vue component with all required features.

Features implemented:
- 4 collapsible sections (Materials, Potions, Resources, Recipes)
- Recipes section collapsed by default
- Search/filter bar with live results count
- All items editable inline using existing EditableValue component
- Reset buttons (per-section and global)
- Override indicators (count badges on sections and tab)
- Override count display in search bar
- Empty state when search has no results
- Dark theme matching app styling
- Sticky search bar
- Responsive design for mobile

The component uses the singleton dataProvider, so all edits will propagate reactively.

Verified: Build passes successfully.
