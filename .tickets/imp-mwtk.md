---
id: imp-mwtk
status: closed
deps: []
links: []
created: 2026-02-26T22:14:10Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-a363
---
# Phase 1: Data model & recipe-potion linking

Extend the data model to support recipe-potion relationships and untradable recipe pricing.

## Files to modify:
- /home/felix/idle-mmo-profiter/src/types/index.ts
- /home/felix/idle-mmo-profiter/src/data/defaults.json
- /home/felix/idle-mmo-profiter/src/api/services.ts

## Tasks:
1. Add new fields to Recipe interface in types/index.ts:
   - 'uses: number' -- how many times the recipe can be used (number of crafts)
   - 'producesItemName?: string' -- the name of the potion/item this recipe produces
   - 'producesItemHashedId?: string' -- hashedId of the produced potion (for API lookups)
   - 'tradableCounterpartId?: string' -- ID of the tradable version of this recipe (for untradable recipes)
   - 'isUntradable?: boolean' -- flag derived from name containing '(Untradable)' or price=0

2. Add new fields to PotionCraft interface in types/index.ts:
   - 'recipeId?: string' -- reference to the recipe that produces this potion
   - 'untradableRecipeId?: string' -- reference to the untradable version of the recipe
   - 'recipeName?: string' -- name of the recipe (for display)
   - 'recipeUses?: number' -- number of uses of the recipe

3. Update defaults.json:
   - Add 'uses' field to all recipes (initially populated from known game data or set to a default)
   - Add recipe-potion linking data for existing 6 potionCrafts
   - Link untradable recipes to their tradable counterparts via tradableCounterpartId

4. Extend ItemDetails/ItemRecipe interfaces in services.ts if the API provides 'uses' or 'max_uses' info

## Acceptance Criteria

- Recipe type has uses, producesItemName, tradableCounterpartId fields
- PotionCraft type has recipeId, untradableRecipeId fields
- defaults.json updated with linking data
- TypeScript compiles without errors


## Notes

**2026-02-26T22:44:32Z**

Updated types in index.ts and services.ts:
- Recipe interface: added uses, producesItemName, producesItemHashedId, tradableCounterpartId, isUntradable
- PotionCraft interface: added recipeId, untradableRecipeId, recipeName, recipeUses
- ItemRecipe interface: added uses, max_uses fields for API response

**2026-02-26T22:46:05Z**

Completed Phase 1:
- Updated Recipe interface with: uses, producesItemName, producesItemHashedId, tradableCounterpartId, isUntradable
- Updated PotionCraft interface with: recipeId, untradableRecipeId, recipeName, recipeUses
- Updated ItemRecipe interface with: uses, max_uses
- Updated defaults.json with new fields for all 345 recipes
- All 34 untradable recipes now have isUntradable=true and tradableCounterpartId linking to their tradable versions
- All recipes now have uses=10 (default, can be updated via Phase 7 script)
- TypeScript compiles without errors
