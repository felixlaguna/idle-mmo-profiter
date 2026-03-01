import { describe, it, expect } from 'vitest'

describe('Performance Optimizations', () => {
  describe('Code Splitting', () => {
    it('should lazy load chart components', async () => {
      // Verify that chart components can be loaded asynchronously
      // and properly resolve without errors
      const chartModule = await import('../../components/charts/ProfitBarChart.vue')
      expect(chartModule).toBeDefined()
      expect(chartModule.default).toBeDefined()

      const dungeonChartModule = await import('../../components/charts/DungeonChart.vue')
      expect(dungeonChartModule).toBeDefined()
      expect(dungeonChartModule.default).toBeDefined()

      const revenueModule = await import('../../components/charts/RevenueBreakdown.vue')
      expect(revenueModule).toBeDefined()
      expect(revenueModule.default).toBeDefined()

      const priceHistoryModule = await import('../../components/charts/PriceHistoryChart.vue')
      expect(priceHistoryModule).toBeDefined()
      expect(priceHistoryModule.default).toBeDefined()
    })
  })
})
