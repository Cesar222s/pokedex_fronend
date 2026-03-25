<script setup lang="ts">
defineProps<{
  chain: {
    species_id: number
    name: string
    sprite: string | null
    min_level: number | null
    trigger: string | null
    item: string | null
  }[]
}>()
</script>

<template>
  <div class="evolution-chain">
    <div v-for="(evo, index) in chain" :key="evo.species_id" class="evo-step">
      <router-link :to="`/pokemon/${evo.species_id}`" class="evo-pokemon">
        <div class="evo-sprite-wrap">
          <img v-if="evo.sprite" :src="evo.sprite" :alt="evo.name" />
          <div v-else class="evo-placeholder"><i class="fas fa-question"></i></div>
        </div>
        <span class="evo-name">{{ evo.name }}</span>
      </router-link>
      
      <div v-if="index < chain.length - 1" class="evo-arrow">
        <i class="fas fa-chevron-right"></i>
        <span v-if="chain[index + 1]?.min_level" class="evo-info">
          Lv. {{ chain[index + 1].min_level }}
        </span>
        <span v-else-if="chain[index + 1]?.item" class="evo-info">
          {{ chain[index + 1].item }}
        </span>
        <span v-else-if="chain[index + 1]?.trigger" class="evo-info">
          {{ chain[index + 1].trigger }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.evolution-chain {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
}

.evo-step {
  display: flex;
  align-items: center;
  gap: 8px;
}

.evo-pokemon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--bg-card);
  border: var(--border-width) solid var(--border-glass);
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--text-primary);
  transition: var(--transition);
  box-shadow: 2px 2px 0px var(--border-glass);
}
.evo-pokemon:hover {
  transform: translateY(-2px) translateX(-2px);
  box-shadow: 4px 4px 0px var(--border-glass);
  border-color: var(--accent-secondary);
}

.evo-sprite-wrap {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.evo-sprite-wrap img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.15));
}

.evo-placeholder {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--bg-secondary);
  border: var(--border-width) dashed var(--border-glass);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 24px;
}

.evo-name {
  font-size: 13px;
  font-weight: 600;
  text-transform: capitalize;
}

.evo-arrow {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: var(--text-muted);
  font-size: 16px;
}

.evo-info {
  font-size: 10px;
  font-weight: 600;
  color: var(--accent-gold);
  text-transform: capitalize;
}
</style>
