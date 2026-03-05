/**
 * Tests for fishing bait costs and gather mode time calculations
 *
 * Issue 1: Fishing requires bait (vendor cost)
 * Issue 2: The 3 profit modes should show DIFFERENT values
 */

import { describe, it, expect } from 'vitest'
import { useDataProvider } from '../../composables/useDataProvider'

describe('Fishing Bait Costs and Gather Mode Times', () => {
  describe('Issue 1: Fishing bait costs in resourceGathering', () => {
    it('should have bait costs for all fish', () => {
      const { resourceGathering } = useDataProvider()

      // Cheap Bait (2g): Cod, Salmon, Tuna
      const cod = resourceGathering.value.find((r) => r.name === 'Cod')
      expect(cod?.baseCost).toBe(2)

      const salmon = resourceGathering.value.find((r) => r.name === 'Salmon')
      expect(salmon?.baseCost).toBe(2)

      const tuna = resourceGathering.value.find((r) => r.name === 'Tuna')
      expect(tuna?.baseCost).toBe(2)

      // Tarnished Bait (4g): Trout, Perch
      const trout = resourceGathering.value.find((r) => r.name === 'Trout')
      expect(trout?.baseCost).toBe(4)

      const perch = resourceGathering.value.find((r) => r.name === 'Perch')
      expect(perch?.baseCost).toBe(4)

      // Gleaming Bait (7g): Herring, Sardines
      const herring = resourceGathering.value.find((r) => r.name === 'Herring')
      expect(herring?.baseCost).toBe(7)

      const sardines = resourceGathering.value.find((r) => r.name === 'Sardines')
      expect(sardines?.baseCost).toBe(7)

      // Elemental Bait (12g): Lobster, Crab
      const lobster = resourceGathering.value.find((r) => r.name === 'Lobster')
      expect(lobster?.baseCost).toBe(12)

      const crab = resourceGathering.value.find((r) => r.name === 'Crab')
      expect(crab?.baseCost).toBe(12)

      // Eldritch Bait (16g): Turtle, Stingray
      const turtle = resourceGathering.value.find((r) => r.name === 'Turtle')
      expect(turtle?.baseCost).toBe(16)

      const stingray = resourceGathering.value.find((r) => r.name === 'Stingray')
      expect(stingray?.baseCost).toBe(16)

      // Arcane Bait (25g): Lantern Fish, Great White Shark
      const lanternFish = resourceGathering.value.find((r) => r.name === 'Lantern Fish')
      expect(lanternFish?.baseCost).toBe(25)

      const greatWhiteShark = resourceGathering.value.find((r) => r.name === 'Great White Shark')
      expect(greatWhiteShark?.baseCost).toBe(25)
    })

    it('should have zero bait costs for ores and logs', () => {
      const { resourceGathering } = useDataProvider()

      const coal = resourceGathering.value.find((r) => r.name === 'Coal')
      expect(coal?.baseCost).toBe(0)

      const ironOre = resourceGathering.value.find((r) => r.name === 'Iron Ore')
      expect(ironOre?.baseCost).toBe(0)

      const oakLog = resourceGathering.value.find((r) => r.name === 'Oak Log')
      expect(oakLog?.baseCost).toBe(0)
    })
  })

  describe('Issue 2: Three profit modes with different times and costs', () => {
    it('should generate 3 modes per recipe with different times and costs', () => {
      const { resourceGathering } = useDataProvider()

      // Find Cooked Great White Shark entries
      const buyAll = resourceGathering.value.find((r) => r.name === 'Cooked Great White Shark')
      const gather = resourceGathering.value.find((r) => r.name === 'Cooked Great White Shark (gather)')
      const gatherAll = resourceGathering.value.find((r) => r.name === 'Cooked Great White Shark (gather all)')

      expect(buyAll).toBeDefined()
      expect(gather).toBeDefined()
      expect(gatherAll).toBeDefined()
    })

    it('Buy All mode: should only include craft time, no gather times', () => {
      const { resourceGathering, resourceRecipes } = useDataProvider()

      const recipe = resourceRecipes.value.find((r) => r.name === 'Cooked Great White Shark')
      const buyAll = resourceGathering.value.find((r) => r.name === 'Cooked Great White Shark')

      expect(recipe).toBeDefined()
      expect(buyAll).toBeDefined()

      // Time should be craft time only (50s for Cooked Great White Shark)
      expect(buyAll!.timeSeconds).toBe(recipe!.timeSeconds)

      // Cost should be market price of all materials
      // Great White Shark (54.8g) + Coal (5.7g) = 60.5g
      expect(buyAll!.cost).toBeGreaterThan(0)
      expect(buyAll!.baseCost).toBeGreaterThan(0)
    })

    it('Gather Except Coal mode: should include gather time for fish + craft time', () => {
      const { resourceGathering, resourceRecipes } = useDataProvider()

      const recipe = resourceRecipes.value.find((r) => r.name === 'Cooked Great White Shark')
      const gather = resourceGathering.value.find((r) => r.name === 'Cooked Great White Shark (gather)')
      const sharkGather = resourceGathering.value.find((r) => r.name === 'Great White Shark')

      expect(recipe).toBeDefined()
      expect(gather).toBeDefined()
      expect(sharkGather).toBeDefined()

      // Time should be craft time + shark gather time (50s + 40.9s = 90.9s)
      const expectedTime = recipe!.timeSeconds + sharkGather!.timeSeconds
      expect(gather!.timeSeconds).toBeCloseTo(expectedTime, 1)

      // Cost should be coal market price + bait cost for shark
      // Coal (5.7g) + Arcane Bait (25g) = 30.7g
      expect(gather!.cost).toBeGreaterThan(20) // Should be around 30.7g
    })

    it('Gather All mode: should include all gather times + craft time', () => {
      const { resourceGathering, resourceRecipes } = useDataProvider()

      const recipe = resourceRecipes.value.find((r) => r.name === 'Cooked Great White Shark')
      const gatherAll = resourceGathering.value.find((r) => r.name === 'Cooked Great White Shark (gather all)')
      const sharkGather = resourceGathering.value.find((r) => r.name === 'Great White Shark')
      const coalGather = resourceGathering.value.find((r) => r.name === 'Coal')

      expect(recipe).toBeDefined()
      expect(gatherAll).toBeDefined()
      expect(sharkGather).toBeDefined()
      expect(coalGather).toBeDefined()

      // Time should be craft time + shark gather time + coal gather time
      // (50s + 40.9s + 10.9s = 101.8s)
      const expectedTime = recipe!.timeSeconds + sharkGather!.timeSeconds + coalGather!.timeSeconds
      expect(gatherAll!.timeSeconds).toBeCloseTo(expectedTime, 1)

      // Cost should only be bait cost for shark (25g for Arcane Bait)
      // Coal has no baseCost (0g)
      expect(gatherAll!.cost).toBe(25)
      expect(gatherAll!.baseCost).toBe(25)
    })

    it('Three modes should have DIFFERENT times and costs', () => {
      const { resourceGathering } = useDataProvider()

      const buyAll = resourceGathering.value.find((r) => r.name === 'Cooked Great White Shark')
      const gather = resourceGathering.value.find((r) => r.name === 'Cooked Great White Shark (gather)')
      const gatherAll = resourceGathering.value.find((r) => r.name === 'Cooked Great White Shark (gather all)')

      // Times should be different
      expect(buyAll!.timeSeconds).not.toBe(gather!.timeSeconds)
      expect(buyAll!.timeSeconds).not.toBe(gatherAll!.timeSeconds)
      expect(gather!.timeSeconds).not.toBe(gatherAll!.timeSeconds)

      // Costs should be different
      expect(buyAll!.cost).not.toBe(gather!.cost)
      expect(buyAll!.cost).not.toBe(gatherAll!.cost)
      expect(gather!.cost).not.toBe(gatherAll!.cost)

      // Buy All should be fastest
      expect(buyAll!.timeSeconds).toBeLessThan(gather!.timeSeconds)
      expect(buyAll!.timeSeconds).toBeLessThan(gatherAll!.timeSeconds)

      // Buy All should be most expensive
      expect(buyAll!.cost).toBeGreaterThan(gather!.cost)
      expect(buyAll!.cost).toBeGreaterThan(gatherAll!.cost)
    })

    it('Smelting recipes: Gather All should have zero cost', () => {
      const { resourceGathering } = useDataProvider()

      // Tin Bar = Tin Ore + Coal (both have baseCost 0)
      const gatherAll = resourceGathering.value.find((r) => r.name === 'Tin Bar (gather all)')

      expect(gatherAll).toBeDefined()
      expect(gatherAll!.cost).toBe(0)
      expect(gatherAll!.baseCost).toBe(0)
    })

    it('Cooked Cod: should use Cheap Bait (2g)', () => {
      const { resourceGathering } = useDataProvider()

      const gatherAll = resourceGathering.value.find((r) => r.name === 'Cooked Cod (gather all)')

      expect(gatherAll).toBeDefined()
      // Cod uses Cheap Bait (2g), Coal has baseCost 0
      expect(gatherAll!.cost).toBe(2)
      expect(gatherAll!.baseCost).toBe(2)
    })

    it('Items/h should be different for each mode (based on different times)', () => {
      const { resourceGathering } = useDataProvider()

      const buyAll = resourceGathering.value.find((r) => r.name === 'Cooked Great White Shark')
      const gather = resourceGathering.value.find((r) => r.name === 'Cooked Great White Shark (gather)')
      const gatherAll = resourceGathering.value.find((r) => r.name === 'Cooked Great White Shark (gather all)')

      // Items/h = 3600 / timeSeconds
      const buyAllItemsPerHour = 3600 / buyAll!.timeSeconds
      const gatherItemsPerHour = 3600 / gather!.timeSeconds
      const gatherAllItemsPerHour = 3600 / gatherAll!.timeSeconds

      // All should be different
      expect(buyAllItemsPerHour).not.toBe(gatherItemsPerHour)
      expect(buyAllItemsPerHour).not.toBe(gatherAllItemsPerHour)
      expect(gatherItemsPerHour).not.toBe(gatherAllItemsPerHour)

      // Buy All should have highest items/h (shortest time)
      expect(buyAllItemsPerHour).toBeGreaterThan(gatherItemsPerHour)
      expect(buyAllItemsPerHour).toBeGreaterThan(gatherAllItemsPerHour)
    })
  })
})
