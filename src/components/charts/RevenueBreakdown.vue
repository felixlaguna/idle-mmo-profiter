<script setup lang="ts">
import { computed, ref, onMounted, watch, nextTick } from 'vue'
import { Chart } from 'chart.js'
import type { RankedActivity } from '../../calculators/profitRanker'

const props = defineProps<{
  activities: RankedActivity[]
}>()

const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

// Calculate totals by category
const categoryTotals = computed(() => {
  const totals = {
    dungeon: 0,
    dungeonCount: 0,
    craftable: 0,
    craftableCount: 0,
    resource: 0,
    resourceCount: 0,
  }

  props.activities.forEach((activity) => {
    if (activity.profitPerHour > 0) {
      if (activity.activityType === 'dungeon') {
        totals.dungeon += activity.profitPerHour
        totals.dungeonCount++
      } else if (activity.activityType === 'craftable') {
        totals.craftable += activity.profitPerHour
        totals.craftableCount++
      } else if (activity.activityType === 'resource') {
        totals.resource += activity.profitPerHour
        totals.resourceCount++
      }
    }
  })

  const grandTotal = totals.dungeon + totals.craftable + totals.resource

  return {
    ...totals,
    grandTotal,
    dungeonPercent: grandTotal > 0 ? (totals.dungeon / grandTotal) * 100 : 0,
    craftablePercent: grandTotal > 0 ? (totals.craftable / grandTotal) * 100 : 0,
    resourcePercent: grandTotal > 0 ? (totals.resource / grandTotal) * 100 : 0,
  }
})

// Get chart data
const chartData = computed(() => {
  const totals = categoryTotals.value

  return {
    labels: ['Dungeons', 'Craftables', 'Resources'],
    datasets: [
      {
        label: 'Total Profit/hr',
        data: [totals.dungeon, totals.craftable, totals.resource],
        backgroundColor: [
          'rgba(168, 85, 247, 0.7)', // Purple for dungeons
          'rgba(34, 197, 94, 0.7)', // Green for craftables
          'rgba(59, 130, 246, 0.7)', // Blue for resources
        ],
        borderColor: ['rgba(168, 85, 247, 1)', 'rgba(34, 197, 94, 1)', 'rgba(59, 130, 246, 1)'],
        borderWidth: 2,
      },
    ],
  }
})

const createChart = () => {
  if (!chartCanvas.value) return

  // Destroy existing chart
  if (chartInstance) {
    chartInstance.destroy()
  }

  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return

  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: chartData.value,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            color: '#e5e7eb',
            padding: 15,
            font: {
              size: 13,
            },
            generateLabels: function (chart) {
              const data = chart.data
              if (data.labels && data.datasets.length) {
                const totals = categoryTotals.value
                const backgrounds = data.datasets[0].backgroundColor as string[]
                const borders = data.datasets[0].borderColor as string[]
                return data.labels.map((label, i) => {
                  const value = data.datasets[0].data[i] as number
                  const percent =
                    i === 0
                      ? totals.dungeonPercent
                      : i === 1
                        ? totals.craftablePercent
                        : totals.resourcePercent
                  return {
                    text: `${label}: ${Math.round(value).toLocaleString()} (${percent.toFixed(1)}%)`,
                    fillStyle: backgrounds[i],
                    strokeStyle: borders[i],
                    lineWidth: 2,
                    hidden: false,
                    index: i,
                  }
                })
              }
              return []
            },
          },
        },
        tooltip: {
          backgroundColor: 'rgba(17, 23, 34, 0.95)',
          titleColor: '#e5e7eb',
          bodyColor: '#e5e7eb',
          borderColor: '#374151',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            label: function (context) {
              const value = context.parsed
              const totals = categoryTotals.value
              const percent =
                context.dataIndex === 0
                  ? totals.dungeonPercent
                  : context.dataIndex === 1
                    ? totals.craftablePercent
                    : totals.resourcePercent
              const count =
                context.dataIndex === 0
                  ? totals.dungeonCount
                  : context.dataIndex === 1
                    ? totals.craftableCount
                    : totals.resourceCount
              return [
                `Total: ${Math.round(value).toLocaleString()} gold/hr`,
                `Percentage: ${percent.toFixed(1)}%`,
                `Activities: ${count}`,
              ]
            },
          },
        },
      },
    },
  })
}

const updateChart = () => {
  if (!chartInstance) return

  chartInstance.data = chartData.value
  chartInstance.update()
}

// Initialize chart on mount
onMounted(() => {
  nextTick(() => {
    createChart()
  })
})

// Watch for data changes and update chart
watch(
  chartData,
  () => {
    updateChart()
  },
  { deep: true }
)
</script>

<template>
  <div class="revenue-breakdown">
    <div class="chart-header">
      <h3 class="chart-title">Revenue Breakdown by Type</h3>
    </div>
    <div class="chart-container">
      <canvas ref="chartCanvas"></canvas>
    </div>
    <div class="summary">
      <div class="summary-item">
        <span class="summary-label">Total Combined Profit/hr:</span>
        <span class="summary-value"
          >{{ Math.round(categoryTotals.grandTotal).toLocaleString() }} gold</span
        >
      </div>
    </div>
  </div>
</template>

<style scoped>
.revenue-breakdown {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.chart-header {
  margin-bottom: 1.5rem;
}

.chart-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.chart-container {
  position: relative;
  height: 350px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.summary {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.summary-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
}

.summary-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.summary-value {
  font-size: 1.125rem;
  color: var(--success);
  font-weight: 700;
}

@media (max-width: 767px) {
  .chart-container {
    height: 300px;
  }
}
</style>
