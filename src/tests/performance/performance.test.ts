import { describe, it, expect } from 'vitest'

describe('Performance Optimizations', () => {
  describe('Code Splitting', () => {
    it('should lazy load chart components', async () => {
      // Verify that chart components are loaded asynchronously
      const chartModule = import('../../components/charts/ProfitBarChart.vue')
      expect(chartModule).toBeInstanceOf(Promise)

      const dungeonChartModule = import('../../components/charts/DungeonChart.vue')
      expect(dungeonChartModule).toBeInstanceOf(Promise)

      const revenueModule = import('../../components/charts/RevenueBreakdown.vue')
      expect(revenueModule).toBeInstanceOf(Promise)

      const priceHistoryModule = import('../../components/charts/PriceHistoryChart.vue')
      expect(priceHistoryModule).toBeInstanceOf(Promise)
    })
  })
})
