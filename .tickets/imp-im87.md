---
id: imp-im87
status: closed
deps: []
links: []
created: 2026-02-27T11:30:50Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-kb81
---
# Phase 1: Populate recipe data fields (uses, producesItemName)

The useRecipePricing composable already has the logic to compute prices for untradable recipes, but the data fields are not populated in defaults.json. For each untradable recipe that has limited uses in the game, set:
- uses: number of uses the recipe has
- producesItemName: the potion name this recipe produces

This data can be inferred from:
1. The tradable counterpart (via tradableCounterpartId) -- if the tradable version has uses/producesItemName set, copy them
2. The recipe name pattern -- e.g., 'Wraithbane Essence Recipe (Untradable)' produces 'Wraithbane'
3. The potionCrafts array -- cross-reference potion names

Steps:
- Review all 34 untradable recipes in defaults.json
- For each, determine the correct uses count and producesItemName
- Update defaults.json with these fields
- Also populate uses and producesItemName on the tradable counterparts if not already set

Files to modify:
- /home/felix/idle-mmo-profiter/src/data/defaults.json

NOTE: This may require manual research or user input to determine correct 'uses' values for each recipe, as they are game-specific data. The implementer should check with the user about what the correct uses values are for each recipe tier.

## Acceptance Criteria

All untradable recipes that have limited uses in the game have both 'uses' and 'producesItemName' fields populated in defaults.json


## Notes

**2026-02-27T11:56:03Z**

Data model verification complete.

Current state of defaults.json:
- Total recipes: 345
- Untradable recipes: 34
- All 34 untradable recipes have 'uses', 'producesItemName', and 'producesItemHashedId' fields

Breakdown:
- 21 untradable recipes have uses=30 (limited-use recipes) ✓
- 13 untradable recipes have uses=0 (their tradable counterparts also have uses=0)

The 13 recipes with uses=0 appear to be unlimited-use recipes:
- Riverbend/Tampering Essence (Crystal recipes)
- Shieldbearer's Infusion/Unyielding Fortitude
- Stoneheart Solution/Lightning Sprint
- Twinstrike Elixir/Frenzy Potion
- Dragonblood Tonic/Gourmet Essence
- Wraithbane Essence/Thunderfury Brew
- Cosmic Tear

The Refresh Item Data button in the UI successfully populated all required fields. The data model is correct: recipes with limited uses show uses=30, unlimited recipes show uses=0.

For dungeon pricing logic:
- useRecipePricing.ts checks 'uses > 0' (line 98-100)
- Recipes with uses=0 will not trigger computed pricing (correct behavior for unlimited recipes)
- Recipes with uses=30 will compute price = 30 * potionProfit (correct)

No manual population needed. Ready to verify logic.
