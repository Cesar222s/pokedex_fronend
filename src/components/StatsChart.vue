<script setup lang="ts">
const props = defineProps<{
  stats: { name: string; base_stat: number }[]
}>()

function statColor(name: string): string {
  const colors: Record<string, string> = {
    hp: '#ef4444',
    attack: '#f97316',
    defense: '#eab308',
    'special-attack': '#3b82f6',
    'special-defense': '#22c55e',
    speed: '#ec4899'
  }
  return colors[name] || '#94a3b8'
}

function statLabel(name: string): string {
  const labels: Record<string, string> = {
    hp: 'PS',
    attack: 'ATQ',
    defense: 'DEF',
    'special-attack': 'AT.ESP',
    'special-defense': 'DF.ESP',
    speed: 'VEL'
  }
  return labels[name] || name.toUpperCase()
}
</script>

<template>
  <div class="stats-chart">
    <div v-for="stat in stats" :key="stat.name" class="stat-row">
      <span class="stat-label">{{ statLabel(stat.name) }}</span>
      <div class="stat-bar-bg">
        <div
          class="stat-bar-fill"
          :style="{
            width: Math.min(100, (stat.base_stat / 255) * 100) + '%',
            backgroundColor: statColor(stat.name)
          }"
        >
        </div>
      </div>
      <span class="stat-value">{{ stat.base_stat }}</span>
    </div>
  </div>
</template>

<style scoped>
.stats-chart {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-label {
  width: 60px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
  text-align: right;
}

.stat-bar-bg {
  flex: 1;
  height: 12px;
  background: var(--bg-secondary);
  border: var(--border-width) solid var(--border-glass);
  border-radius: 6px;
  overflow: hidden;
}

.stat-bar-fill {
  height: 100%;
  border-radius: 4px;
  border-right: var(--border-width) solid var(--border-glass);
  transition: width 1s cubic-bezier(0.25, 1, 0.5, 1);
}

.stat-value {
  width: 35px;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}
</style>
