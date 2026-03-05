import { describe, it, expect } from 'vitest'
import { calculateResourceProfits } from '../../calculators/resourceCalculator'
import type { ResourceGather, ResourceSkill } from '../../types'

describe('resourceCalculator', () => {
  describe('calculateResourceProfits', () => {
    it('should calculate material costs correctly for resource recipes (buy all mode)', () => {
      // Test data simulating "Cooked Stingray" recipe with correct material costs
      // Recipe: 1 Stingray (35.8g) + 1 Coal (5.7g) = 41.5g total material cost
      const cookedStingrayBuyAll: ResourceGather = {
        name: 'Cooked Stingray',
        timeSeconds: 36.4,
        baseCost: 41.5, // buyAllCost: sum of material prices
        vendorValue: 55,
        marketPrice: 67.2,
        cost: 41.5,
      }

      const results = calculateResourceProfits([cookedStingrayBuyAll], 0.12)

      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('Cooked Stingray')

      // Market profit = (67.2 * (1 - 0.12)) - 41.5 = 59.136 - 41.5 = 17.636
      // Market profit/h = 17.636 / (36.4 / 3600) = 1744.06...
      expect(results[0].marketProfit).toBeCloseTo(17.636, 2)
      expect(results[0].marketProfitPerHour).toBeCloseTo(1744.06, 0)

      // Vendor profit = 55 - 41.5 = 13.5
      // Vendor profit/h = 13.5 / (36.4 / 3600) = 1335.16...
      expect(results[0].vendorProfit).toBeCloseTo(13.5, 2)
      expect(results[0].vendorProfitPerHour).toBeCloseTo(1335.16, 0)

      // Best method should be market
      expect(results[0].bestMethod).toBe('market')
      expect(results[0].bestProfit).toBeCloseTo(17.636, 2)
    })

    it('should calculate coal cost correctly for gather-except-coal mode', () => {
      // Test data simulating "Cooked Stingray (gather)" with coal cost only
      // Recipe: gather 1 Stingray (16g bait) + buy 1 Coal (5.7g) = 21.7g total cost
      const cookedStingrayGather: ResourceGather = {
        name: 'Cooked Stingray (gather)',
        timeSeconds: 125.1, // 36.4s craft + 88.7s gather Stingray
        baseCost: 21.7, // bait cost (16g) + coal cost (5.7g)
        vendorValue: 55,
        marketPrice: 67.2,
        cost: 21.7,
      }

      const results = calculateResourceProfits([cookedStingrayGather], 0.12)

      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('Cooked Stingray (gather)')

      // Market profit = (67.2 * (1 - 0.12)) - 21.7 = 59.136 - 21.7 = 37.436
      // Market profit/h = 37.436 / (125.1 / 3600) = 1077.34...
      expect(results[0].marketProfit).toBeCloseTo(37.436, 2)
      expect(results[0].marketProfitPerHour).toBeCloseTo(1077.34, 0)
    })

    it('should calculate profits without efficiency modifier', () => {
      const resources: ResourceGather[] = [
        {
          name: 'Coal',
          timeSeconds: 8.3,
          baseCost: 0,
          vendorValue: 1,
          marketPrice: 5.7,
          cost: 0,
        },
      ]

      const results = calculateResourceProfits(resources, 0.12)

      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('Coal')
      expect(results[0].timeSeconds).toBe(8.3)
      expect(results[0].vendorValue).toBe(1)
      expect(results[0].marketPrice).toBe(5.7)

      // Market profit = (5.7 * (1 - 0.12)) - 0 = 5.016
      // Market profit/h = 5.016 / (8.3 / 3600) = 2175.61...
      expect(results[0].marketProfit).toBeCloseTo(5.016, 2)
      expect(results[0].marketProfitPerHour).toBeCloseTo(2175.61, 0)

      // Vendor profit = 1 - 0 = 1
      // Vendor profit/h = 1 / (8.3 / 3600) = 433.73...
      expect(results[0].vendorProfit).toBe(1)
      expect(results[0].vendorProfitPerHour).toBeCloseTo(433.73, 1)

      // Best method should be market
      expect(results[0].bestMethod).toBe('market')
      expect(results[0].bestProfit).toBeCloseTo(5.016, 2)
      expect(results[0].bestProfitPerHour).toBeCloseTo(2175.61, 0)
    })

    it('should apply efficiency modifier to craft time', () => {
      const resources: ResourceGather[] = [
        {
          name: 'Coal',
          timeSeconds: 10,
          baseCost: 0,
          vendorValue: 100,
          marketPrice: 100,
          cost: 0,
        },
      ]

      const skillMap = new Map<string, ResourceSkill>([['Coal', 'mining']])

      // Efficiency modifier: 5% efficiency
      // Final Time = Base Time / ((Efficiency% + 100) / 100)
      // Final Time = 10 / ((5 + 100) / 100) = 10 / 1.05 = 9.52s
      const efficiencyModifier = (baseTime: number, skill: ResourceSkill) => {
        if (skill === 'mining') {
          return baseTime / 1.05 // 5% efficiency
        }
        return baseTime
      }

      const results = calculateResourceProfits(resources, 0, skillMap, efficiencyModifier)

      expect(results).toHaveLength(1)
      expect(results[0].timeSeconds).toBeCloseTo(9.52, 2)

      // With 9.52s time (actually 9.523809... = 10/1.05):
      // Profit/h = 100 / (9.523809.../3600) = 37,800
      // Without efficiency (10s): 100 / (10 / 3600) = 36,000
      expect(results[0].vendorProfitPerHour).toBeCloseTo(37800, 0)
    })

    it('should not apply efficiency when skill is not in skillMap', () => {
      const resources: ResourceGather[] = [
        {
          name: 'Coal',
          timeSeconds: 10,
          baseCost: 0,
          vendorValue: 100,
          marketPrice: 100,
          cost: 0,
        },
      ]

      const skillMap = new Map<string, ResourceSkill>([['Iron Ore', 'mining']])

      const efficiencyModifier = (baseTime: number, skill: ResourceSkill) => {
        if (skill === 'mining') {
          return baseTime / 1.05 // 5% efficiency
        }
        return baseTime
      }

      const results = calculateResourceProfits(resources, 0, skillMap, efficiencyModifier)

      expect(results).toHaveLength(1)
      // Time should remain unchanged because Coal is not in skillMap
      expect(results[0].timeSeconds).toBe(10)
    })

    it('should handle multiple resources with different efficiencies', () => {
      const resources: ResourceGather[] = [
        {
          name: 'Coal',
          timeSeconds: 10,
          baseCost: 0,
          vendorValue: 100,
          marketPrice: 100,
          cost: 0,
        },
        {
          name: 'Iron Bar',
          timeSeconds: 20,
          baseCost: 0,
          vendorValue: 200,
          marketPrice: 200,
          cost: 0,
        },
        {
          name: 'Cooked Fish',
          timeSeconds: 15,
          baseCost: 0,
          vendorValue: 150,
          marketPrice: 150,
          cost: 0,
        },
      ]

      const skillMap = new Map<string, ResourceSkill>([
        ['Coal', 'mining'],
        ['Iron Bar', 'smelting'],
        ['Cooked Fish', 'cooking'],
      ])

      // Different efficiency for each skill
      const efficiencyModifier = (baseTime: number, skill: ResourceSkill) => {
        if (skill === 'mining') {
          return baseTime / 1.05 // 5% mining efficiency
        } else if (skill === 'smelting') {
          return baseTime / 1.10 // 10% smelting efficiency
        } else if (skill === 'cooking') {
          return baseTime / 1.15 // 15% cooking efficiency
        }
        return baseTime
      }

      const results = calculateResourceProfits(resources, 0, skillMap, efficiencyModifier)

      expect(results).toHaveLength(3)

      // Coal: 10 / 1.05 = 9.52s
      const coal = results.find((r) => r.name === 'Coal')
      expect(coal?.timeSeconds).toBeCloseTo(9.52, 2)

      // Iron Bar: 20 / 1.10 = 18.18s
      const iron = results.find((r) => r.name === 'Iron Bar')
      expect(iron?.timeSeconds).toBeCloseTo(18.18, 2)

      // Cooked Fish: 15 / 1.15 = 13.04s
      const fish = results.find((r) => r.name === 'Cooked Fish')
      expect(fish?.timeSeconds).toBeCloseTo(13.04, 2)
    })

    it('should sort results by best profit per hour descending', () => {
      const resources: ResourceGather[] = [
        {
          name: 'Low Profit',
          timeSeconds: 10,
          baseCost: 0,
          vendorValue: 10,
          marketPrice: 10,
          cost: 0,
        },
        {
          name: 'High Profit',
          timeSeconds: 10,
          baseCost: 0,
          vendorValue: 100,
          marketPrice: 100,
          cost: 0,
        },
        {
          name: 'Medium Profit',
          timeSeconds: 10,
          baseCost: 0,
          vendorValue: 50,
          marketPrice: 50,
          cost: 0,
        },
      ]

      const results = calculateResourceProfits(resources, 0)

      expect(results).toHaveLength(3)
      expect(results[0].name).toBe('High Profit')
      expect(results[1].name).toBe('Medium Profit')
      expect(results[2].name).toBe('Low Profit')
    })

    it('should work with efficiency but no skillMap', () => {
      const resources: ResourceGather[] = [
        {
          name: 'Coal',
          timeSeconds: 10,
          baseCost: 0,
          vendorValue: 100,
          marketPrice: 100,
          cost: 0,
        },
      ]

      const efficiencyModifier = (baseTime: number) => {
        return baseTime / 1.05
      }

      // No skillMap provided
      const results = calculateResourceProfits(resources, 0, undefined, efficiencyModifier)

      expect(results).toHaveLength(1)
      // Time should remain unchanged because skillMap is undefined
      expect(results[0].timeSeconds).toBe(10)
    })

    it('should work with skillMap but no efficiency modifier', () => {
      const resources: ResourceGather[] = [
        {
          name: 'Coal',
          timeSeconds: 10,
          baseCost: 0,
          vendorValue: 100,
          marketPrice: 100,
          cost: 0,
        },
      ]

      const skillMap = new Map<string, ResourceSkill>([['Coal', 'mining']])

      // No efficiency modifier provided
      const results = calculateResourceProfits(resources, 0, skillMap, undefined)

      expect(results).toHaveLength(1)
      // Time should remain unchanged because efficiencyModifier is undefined
      expect(results[0].timeSeconds).toBe(10)
    })
  })
})
