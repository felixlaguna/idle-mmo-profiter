---
id: imp-o9wf
status: open
deps: [imp-jyg0]
links: []
created: 2026-02-25T18:33:29Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-90r5
---
# Implement resource gathering profit calculator

Create src/calc/resources.ts:

Port the Profit sheet logic from the Excel:

For each resource/activity:
1. Vendor profit:
   - Vendor benefit = vendor_value - cost
   - Vendor benefit/h = vendor_benefit / (time_seconds / 3600)
2. Market profit:
   - Market value after tax = market_price - (market_price * 0.12)
   - Market benefit = market_value_after_tax - cost
   - Market benefit/h = market_benefit / (time_seconds / 3600)
3. Best option = MAX(vendor/h, market/h)
4. Recommendation = vendor/h > market/h ? 'Vendor' : 'Market'

Resource data from Excel:
- Coal: 8.3s, cost 0, vendor 1, market 6
- Stingray: 28.6s, cost 16, vendor 26, market 38
- Cooked Stingray: 33.3s, cost = stingray_market + coal_market, vendor 65, market 67
- Cooked Stingray full: time = cook + fish, cost = fish_cost + coal_market
- White Shark: 32.1s, cost 25, vendor 41, market 56
- Cooked White Shark: 45.8s, cost = shark_market + coal_market, vendor 92, market 105
- Cooked White Shark full: time = cook + catch, cost = catch_cost + coal_market
- Cooked White Shark full + coal: time = coal + catch + cook, cost = catch_cost
- Mystic Ore: 37.9s, cost 0, vendor 20, market 24
- Mystic Bar: 50s, cost = ore_market + coal_market, vendor 59, market 67
- Mystic Bar full: time = smelt + mine, cost = mine_cost + coal_market
- Mystic Bar full + coal: time = coal + mine + smelt, cost 0

Function: calculateResourceProfits(resources, marketPrices, taxRate, priceOverrides) -> ResourceProfitResult[]

## Acceptance Criteria

All resource chains return correct profit values matching the Excel computed values

