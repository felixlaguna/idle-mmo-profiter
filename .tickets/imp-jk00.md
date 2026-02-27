---
id: imp-jk00
status: open
deps: [imp-mwtk]
links: []
created: 2026-02-26T22:15:39Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-a363
---
# Phase 7: Script to populate recipe uses and potion links

Create or extend a script to populate recipe 'uses' count and potion linking data in defaults.json via the IdleMMO API.

## Context:
- The API inspectItem() endpoint returns ItemDetails with recipes[] array
- Each ItemRecipe has: recipe_id, recipe_hashed_id, name, tradeable, success_rate, crafting_time, ingredients[]
- We need to determine the 'uses' count for each recipe
- We need to link untradable recipes to their produced potions

## Files to modify:
- /home/felix/idle-mmo-profiter/scripts/populate-hashed-ids.ts -- Extend with recipe linking logic
  OR create a new script:
- /home/felix/idle-mmo-profiter/scripts/populate-recipe-links.ts

## Tasks:
1. For each recipe in defaults.json:
   a. Call inspectItem(recipe.hashedId) to get recipe details
   b. From the response, extract: uses count, produced item name, produced item hashedId
   c. If the recipe is untradable, find its tradable counterpart ID
   d. Write results back to defaults.json

2. For the produced potions:
   a. Call inspectItem(potion.hashedId) to get potion details
   b. Extract: vendor_price, market data, ingredients needed
   c. Create potionCraft entries for potions not already in potionCrafts

3. Handle the 'uses' field:
   - If the API provides this (check actual API response), use it
   - If not, this may need to be manually entered or scraped from game wiki
   - In that case, provide a mapping in the script that can be updated

4. Rate limit handling: respect 20 req/min limit with delays

## Note on API data:
- The ItemRecipe interface does NOT currently have a 'uses' or 'max_uses' field
- This information may need to come from inspecting the recipe item itself
- Or it may be a property not yet mapped in our type definitions
- The script should log what fields are available so we can discover the correct field

## Acceptance Criteria

- Script runs successfully with API key
- defaults.json updated with recipe uses, produced item links
- New potionCraft entries created for missing potions
- Script respects rate limits and handles errors gracefully


## Notes

**2026-02-27T11:24:50Z**

Partially addressed: populate-hashed-ids.ts extended to fetch recipe data. defaults.json cleaned of stale producesItemName fields. Remaining: full API population run.
