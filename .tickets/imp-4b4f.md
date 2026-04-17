---
id: imp-4b4f
status: closed
deps: [imp-ul7i]
links: []
created: 2026-03-23T09:58:25Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-28f5
---
# Phase 2: Fetch construction items from API and add to defaults.json

Use the IdleMMO API to discover construction skill items (materials, recipes, and craftable outputs) and add them to defaults.json as resourceRecipes and resourceGathering entries.

Approach:
1. Write a discovery script (or extend an existing one) that:
   a. Searches for items related to construction via the /item/search API
   b. Inspects each item via /item/{id}/inspect to find recipe details
   c. Identifies items whose recipe.skill === 'construction'
   d. For each construction recipe, collects: output item name, materials, craft time, vendor price, hashed IDs
   e. Fetches market prices for each output item

2. Add discovered items to defaults.json:
   - Add raw construction materials to resourceGathering[] (with skill: 'construction' if they are gatherable, or just as materials if they are only bought)
   - Add construction recipes to resourceRecipes[] with skill: 'construction'
   - Add any new materials to materials[] if they are not already there
   - Add any new resources to resources[] if they are not already there

3. The structure should follow existing patterns, e.g.:
   {
     name: 'Construction Output Item',
     timeSeconds: <from API>,
     skill: 'construction',
     materials: [{ name: 'Material Name', quantity: N }],
     currentPrice: <market price>,
     vendorValue: <from API>,
     hashedId: '<from API>'
   }

Key files:
- scripts/ - new or extended discovery script
- src/data/defaults.json - add construction entries

Notes:
- The existing discover-effects-and-skills.ts script pattern can be followed
- Rate limit: 20 req/min
- Run the script inside Docker container or with tsx locally

## Acceptance Criteria

- Construction recipes appear in resourceRecipes[] in defaults.json
- All construction materials have entries in the appropriate arrays
- Market prices and vendor values are populated
- HashedIds are populated for all new items


## Notes

**2026-03-23T10:06:50Z**

Phase 2 complete: Added construction items to defaults.json:
- resourceGathering: Clay, Sand, Limestone (3 items, skill=construction, 50s each)
- resourceRecipes: Weak Plank, Brick, Iron Fitting, Weak Beam, Glass, Robust Plank, Robust Beam, Strong Plank, Strong Beam (9 recipes, skill=construction)
- All hashedIds verified against API
- JSON validation passed
