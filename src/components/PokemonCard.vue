<script setup lang="ts">
import { computed } from 'vue'
import { useFavoritesStore } from '../stores/favorites'

const props = defineProps<{
  pokemon: {
    id: number
    name: string
    sprites: any
    types: string[]
  }
}>()

const favoritesStore = useFavoritesStore()
const isFav = computed(() => favoritesStore.isFavorite(props.pokemon.id))

function toggleFav(e: Event) {
  e.preventDefault()
  e.stopPropagation()
  favoritesStore.toggleFavorite(props.pokemon.id)
}

const sprite = computed(() => {
  const s = props.pokemon.sprites
  return s?.other?.['official-artwork']?.front_default || s?.front_default || ''
})

const primaryType = computed(() => props.pokemon.types[0] || 'normal')
</script>

<template>
  <router-link :to="`/pokemon/${pokemon.id}`" class="pokemon-card" :class="`card-${primaryType}`">
    <button class="fav-btn" :class="{ active: isFav }" @click="toggleFav" :title="isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'">
      <i :class="isFav ? 'fas fa-heart' : 'far fa-heart'"></i>
    </button>

    <div class="card-id">#{{ String(pokemon.id).padStart(3, '0') }}</div>
    
    <div class="card-sprite">
      <img :src="sprite" :alt="pokemon.name" loading="lazy" />
    </div>
    
    <h3 class="card-name">{{ pokemon.name }}</h3>
    
    <div class="card-types">
      <span v-for="t in pokemon.types" :key="t" class="type-badge" :class="`type-${t}`">
        {{ t }}
      </span>
    </div>
  </router-link>
</template>

<style scoped>
.pokemon-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px 20px;
  background: var(--bg-card);
  border: var(--border-width) solid var(--border-glass);
  border-radius: var(--radius-lg);
  text-decoration: none;
  color: var(--text-primary);
  transition: var(--transition);
  box-shadow: var(--shadow-lg);
  cursor: pointer;
  z-index: 1;
}

.pokemon-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: rgba(0,0,0,0.03);
  border-bottom: var(--border-width) solid var(--border-glass);
  z-index: -1;
  border-radius: calc(var(--radius-lg) - 2px) calc(var(--radius-lg) - 2px) 0 0;
}

.pokemon-card:hover {
  transform: translateY(-4px) translateX(-4px);
  box-shadow: var(--shadow-hover);
  border-color: var(--accent-secondary);
}

.pokemon-card:hover .card-sprite img {
  transform: scale(1.1);
}

.fav-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: white;
  border: 2px solid var(--border-glass);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
  color: var(--text-muted);
  transition: var(--transition);
  z-index: 2;
  box-shadow: 2px 2px 0px var(--border-glass);
}
.fav-btn:hover {
  box-shadow: 4px 4px 0px var(--border-glass);
  transform: translate(-2px, -2px);
}
.fav-btn.active {
  color: var(--accent-primary);
}

.card-id {
  position: absolute;
  top: 16px;
  left: 16px;
  font-size: 13px;
  font-weight: 800;
  color: var(--text-secondary);
}

.card-sprite {
  width: 140px;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  margin-top: 10px;
}
.card-sprite img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  filter: drop-shadow(0 8px 12px rgba(0,0,0,0.15));
}

.card-name {
  font-size: 18px;
  font-weight: 800;
  text-transform: capitalize;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.card-types {
  display: flex;
  gap: 6px;
}
</style>
