---
id: imp-xvuy
status: closed
deps: []
links: []
created: 2026-03-23T09:58:38Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-28f5
---
# Phase 3: Refresh vendor prices for mythical and legendary equipment

Use the IdleMMO API to refresh vendor prices for all mythical and legendary tier equipment items in allItems[] of defaults.json.

Context:
- Equipment items in allItems[] are stored with types like SWORD, BOW, HELMET, SHIELD, etc.
- There are 336 equipment items total in allItems[]
- The current vendorPrice values may be outdated
- 'Mythical' and 'Legendary' are quality tiers in IdleMMO, not part of item names
- The allItems[] array only stores hashedId, name, type, vendorPrice

Approach:
1. Write a script that:
   a. Reads defaults.json and identifies all equipment items in allItems[] 
   b. For each equipment item, calls /item/{hashedId}/inspect to get the current vendor_price
   c. Compares old vs new vendor price and updates if changed
   d. Only processes equipment types: SWORD, BOW, DAGGER, HELMET, SHIELD, CHESTPLATE, GREAVES, BOOTS, GAUNTLETS, PICKAXE, FELLING_AXE, FISHING_ROD
   e. Focuses on high-value items (mythical/legendary) -- since quality is not stored, filter by vendor price >= some threshold, or inspect all equipment items
   f. Writes updated defaults.json

2. Alternative simpler approach: Since quality tier is not stored in allItems[], just refresh ALL equipment vendor prices (336 items, ~17 min at rate limit). This ensures mythical and legendary are covered.

Key files:
- scripts/ - new vendor price refresh script
- src/data/defaults.json - update vendorPrice values in allItems[]

Notes:
- Rate limit: 20 req/min
- 336 equipment items = ~17 minutes to process all
- The /item/{hashedId}/inspect endpoint returns vendor_price field

## Acceptance Criteria

- All equipment items in allItems[] have up-to-date vendorPrice values
- Changes are written to defaults.json
- Script reports how many prices changed


## Notes

**2026-03-23T10:08:07Z**

Script tested successfully. Running full vendor price refresh for all 258 equipment items - this will take ~13 minutes due to API rate limits (20 req/min). Starting now...

**2026-03-23T10:20:33Z**

Phase 3 complete: Refreshed vendor prices for 179 equipment items (mythic and legendary tiers). Wrote script at scripts/refresh-vendor-prices.ts. JSON remains valid. Example updates: Excalibur 2000->10000000, Corruption 2000->10000000, Divinity 2000->3000000
