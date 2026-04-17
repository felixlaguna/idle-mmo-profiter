---
id: imp-2fex
status: open
deps: []
links: []
created: 2026-03-09T08:06:20Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-m64w
---
# Phase 1: Add taxRate parameter to dungeonCalculator

## Summary
Apply the 12% market tax to TRADABLE dungeon recipe drop expected values.

## Changes Required

### src/calculators/dungeonCalculator.ts
1. Add `taxRate: number` parameter to `calculateDungeonProfits()` function signature (after `magicFind`)
2. In the drop EV calculation (line 76), apply tax ONLY to tradable drops:
   ```ts
   // For tradable drops: expected_value = price * (1 - taxRate) * chance * (1 + totalMF/100)
   // For untradable drops: expected_value = price * chance * (1 + totalMF/100)
   //   (untradable price already has tax baked in via useRecipePricing)
   const effectivePrice = recipe.isUntradable ? recipe.price : recipe.price * (1 - taxRate)
   const expectedValue = effectivePrice * recipe.chance * (1 + totalMF / 100)
   ```
3. Update the `DungeonDropResult.price` to still store the raw recipe market price (for display purposes). The tax is only applied for EV/profit calculation.
4. Update JSDoc comments to document the taxRate parameter and the tradable/untradable distinction.

### Key Design Decision
- Untradable recipes get their price computed by `useRecipePricing` as `uses * craftable_profit`, where craftable_profit already accounts for tax. Applying tax again would be double-counting.
- Tradable recipes have a raw market price that has NOT been tax-adjusted, so we must apply tax here.

## Files
- /home/felix/idle-mmo-profiter/src/calculators/dungeonCalculator.ts

## Acceptance Criteria

- calculateDungeonProfits accepts taxRate parameter
- Tradable drop EVs are reduced by taxRate
- Untradable drop EVs remain unchanged (no double-tax)
- DungeonDropResult.price still stores raw market price
- JSDoc updated

