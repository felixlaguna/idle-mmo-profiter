---
id: imp-iolq
status: closed
deps: [imp-jyg0]
links: []
created: 2026-02-25T18:33:29Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-90r5
---
# Implement potion crafting profit calculator

Create src/calc/potions.ts:

Port the Potions sheet logic from the Excel:

For each potion (6 currently, extensible):
1. Calculate total material cost:
   - Mat 1: quantity * material_price (looked up from Market sheet col C)
   - Mat 2: quantity * material_price (looked up from Market sheet col C)
   - Vial cost: fixed per potion (200 or 500 gold)
   - Total cost = mat1_cost + mat2_cost + vial_cost
2. Minimum sell price = total_cost + (total_cost * 0.12) [12% market tax]
3. Current market sell price from Market sheet col G
4. Benefit = current_price - min_sell_price
5. Benefit/h = benefit / (craft_time / 3600)

Potion data from Excel:
- Wraithbane: 1090.9s, 15x Moose Antler + 20x Minotaur Hide + 500 vial
- Thunderfury: 1090.9s, 25x Orb of Elemental + 20x Elk Antler + 500 vial
- Gourmet: 1090.9s, 15x Enigmatic Stone + 12x Lions Teeth + 500 vial
- Dungeon Master: 818.2s, 11x Wolf Pelt + 0 mat2 + 200 vial
- Frenzy: 1090.9s, 14x Goblin Totem + 60x Harpy Wing + 500 vial
- Cosmic: 1090.9s, 40x Mystic Ore + 12x Air Elemental + 500 vial

Function: calculatePotionProfits(potions, materialPrices, potionPrices, taxRate, priceOverrides) -> PotionProfitResult[]
Each result: { name, craftTime, materials: [{name, qty, unitCost, totalCost}], vialCost, totalCost, minSellPrice, currentPrice, benefit, benefitPerHour }

## Acceptance Criteria

All 6 potions return correct profit values matching the Excel computed values


## Notes

**2026-02-28T23:39:01Z**

Verified: Fully implemented in src/calculators/craftableCalculator.ts with material costs, vials, tax, dual profitability. Closing.
