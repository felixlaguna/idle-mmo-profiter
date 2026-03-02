---
id: imp-8q9d
status: closed
deps: []
links: []
created: 2026-03-02T08:13:27Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-ivrt
---
# Add saleMethod field to RankedActivity and populate for resources

## What
Add an optional 'saleMethod' field to the RankedActivity interface in profitRanker.ts, typed as SaleMethod ('vendor' | 'market') from resourceCalculator.ts. Populate it only for resource activities during ranking.

## Files to modify
- /home/felix/idle-mmo-profiter/src/calculators/profitRanker.ts
  - Import SaleMethod from resourceCalculator
  - Add 'saleMethod?: SaleMethod' to RankedActivity interface
  - In rankAllActivities(), when adding resource results, set saleMethod: resource.bestMethod

## Implementation details
In profitRanker.ts, the resource section (lines 62-71) currently creates entries without saleMethod. Add the field:

```typescript
// Add resource results
resourceResults.forEach((resource) => {
  allActivities.push({
    activityType: 'resource',
    name: resource.name,
    profitPerHour: resource.bestProfitPerHour,
    profitPerAction: resource.bestProfit,
    timePerAction: resource.timeSeconds,
    cost: resource.cost,
    details: \`Best: \${resource.bestMethod}, \${Math.round(resource.timeSeconds)} sec\`,
    saleMethod: resource.bestMethod,  // <-- NEW
  })
})
```

## Acceptance Criteria

- RankedActivity interface has optional saleMethod field
- Resource activities have saleMethod populated with 'vendor' or 'market'
- Dungeon and craftable activities have saleMethod as undefined
- No type errors, existing tests pass

