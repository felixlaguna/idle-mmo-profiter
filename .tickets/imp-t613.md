---
id: imp-t613
status: done
deps: [imp-fe8p]
links: []
created: 2026-04-15T15:47:41Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-aon1
---
# Phase 5: Expand Market tab to show all tradable items

With the unified data model, update MarketTable.vue to show ALL tradable items -- not just the 19 in the old resources array. This is the primary user-visible benefit of the refactor.

## 5A. Current Market tab structure

MarketTable.vue has 4 collapsible sections:
1. Materials (99 items) - from materials array
2. Craftables (auto-generated from craftableRecipes at runtime) - from craftables array
3. Resources (19 items) - from resources array
4. Recipes (345 items) - from recipes array

## 5B. Problem

Items in resourceRecipes (e.g., Iron Bar, Tin Bar, Copper Bar, all cooked fish) are NOT in the resources array. So they do NOT appear in the Market tab despite being tradable items with market prices.

resourceGathering items (35 items, e.g., ores, raw fish, logs) are also NOT in resources unless they happen to overlap (only 7 do).

## 5C. Solution

With masterItems, every item has its marketPrice and vendorValue. The Market tab can now show all items grouped by their primary category. The sections could be:
1. Raw Materials (materials used in alchemy/forging)
2. Gathered Resources (ores, fish, logs -- from gathering)
3. Processed Resources (smelted bars, cooked fish, construction items -- from resourceRecipes)
4. Craftables (alchemy/forging outputs)
5. Recipes (dungeon drop recipes)

OR keep the existing 4 sections but populate them from masterItems using category filters.

## 5D. Approach: minimal component change

Since useDataProvider already produces the old array formats via adapters, the SIMPLEST approach is:
- Expand the resources computed property to include ALL items that have a marketPrice and are not already in materials/craftables/recipes
- This includes resourceRecipe outputs AND resourceGathering items

Alternatively, add a new 'Processed Resources' section between Resources and Recipes.

## 5E. Ensure market refresh works for new items

New items appearing in Market tab must have hashedId so they can be refreshed via API.

## Files to modify
- src/components/MarketTable.vue (2,969 lines)
- Possibly src/composables/useDataProvider.ts (if resources computed property needs expanding)

## Acceptance Criteria

1. All tradable items visible in Market tab
2. Iron Bar, Tin Bar, Cooked Fish etc. now appear
3. Prices editable inline
4. Market refresh works for new items
5. No visual regression on existing items

