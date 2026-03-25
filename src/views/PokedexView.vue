<script setup lang="ts">
import { onMounted, watch, ref } from 'vue'
import { usePokemonStore } from '../stores/pokemon'
import { useFavoritesStore } from '../stores/favorites'
import PokemonCard from '../components/PokemonCard.vue'

const pokemonStore = usePokemonStore()
const favoritesStore = useFavoritesStore()
const searchDebounce = ref<any>(null)

onMounted(async () => {
  await Promise.all([
    pokemonStore.fetchTypes(),
    pokemonStore.fetchRegions(),
    favoritesStore.fetchFavorites()
  ])
  pokemonStore.fetchPokemon()
})

function applyFilters() {
  pokemonStore.offset = 0
  pokemonStore.fetchPokemon()
}

function clearFilters() {
  pokemonStore.resetFilters()
  pokemonStore.fetchPokemon()
}

function onNameInput() {
  clearTimeout(searchDebounce.value)
  searchDebounce.value = setTimeout(() => {
    if (pokemonStore.filters.name.length >= 3 || pokemonStore.filters.name.length === 0) {
      applyFilters()
    }
  }, 500)
}

const hasMore = ref(true)
watch(() => pokemonStore.pokemonList.length, (len) => {
  hasMore.value = len < pokemonStore.totalCount
})
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">Pokédex</h1>
      <p class="page-subtitle">Explora y descubre Pokémon de todas las regiones</p>
    </div>

    <div class="pokedex-layout">
      <!-- Filters sidebar -->
      <aside class="filters-panel glass">
        <h3 class="filters-title"><i class="fas fa-filter"></i> Filtros</h3>
        
        <div class="filter-group">
          <label>Buscar por Nombre</label>
          <input v-model="pokemonStore.filters.name" @input="onNameInput" class="input" placeholder="ej. Pikachu" />
        </div>

        <div class="filter-group">
          <label>Tipo 1</label>
          <select v-model="pokemonStore.filters.type1" @change="applyFilters" class="select">
            <option value="">Todos los Tipos</option>
            <option v-for="t in pokemonStore.types" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Tipo 2</label>
          <select v-model="pokemonStore.filters.type2" @change="applyFilters" class="select">
            <option value="">Todos los Tipos</option>
            <option v-for="t in pokemonStore.types" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Región</label>
          <select v-model="pokemonStore.filters.region" @change="applyFilters" class="select">
            <option value="">Todas las Regiones</option>
            <option v-for="r in pokemonStore.regions" :key="r" :value="r">{{ r }}</option>
          </select>
        </div>

        <button class="btn btn-secondary" style="width:100%" @click="clearFilters">
          <i class="fas fa-times"></i> Limpiar Filtros
        </button>
      </aside>

      <!-- Pokemon grid -->
      <main class="pokedex-main">
        <div v-if="pokemonStore.loading && pokemonStore.pokemonList.length === 0" class="spinner"></div>
        
        <div v-else-if="pokemonStore.pokemonList.length === 0" class="empty-state">
          <i class="fas fa-search"></i>
          <h3>No se encontraron Pokémon</h3>
          <p>Intenta ajustar tus filtros</p>
        </div>

        <div v-else>
          <div class="pokemon-grid">
            <PokemonCard
              v-for="pokemon in pokemonStore.pokemonList"
              :key="pokemon.id"
              :pokemon="pokemon"
              class="animate-slide-up"
            />
          </div>

          <div class="load-more" v-if="hasMore">
            <button
              class="btn btn-primary btn-lg"
              @click="pokemonStore.loadMore()"
              :disabled="pokemonStore.loading"
            >
              <i class="fas fa-chevron-down"></i>
              {{ pokemonStore.loading ? 'Cargando...' : 'Cargar Más' }}
            </button>
          </div>
        </div>

        <div class="results-count" v-if="pokemonStore.totalCount > 0">
          Mostrando {{ pokemonStore.pokemonList.length }} de {{ pokemonStore.totalCount }}
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.pokedex-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 24px;
  align-items: start;
}

.filters-panel {
  padding: 24px;
  position: sticky;
  top: 100px;
  background: var(--bg-card);
  border: var(--border-width) solid var(--border-glass);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.filters-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary);
}

.filter-group {
  margin-bottom: 16px;
}
.filter-group label {
  display: block;
  font-size: 13px;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.load-more {
  display: flex;
  justify-content: center;
  padding: 32px 0;
}

.results-count {
  text-align: center;
  padding: 16px;
  color: var(--text-muted);
  font-size: 13px;
}

@media (max-width: 768px) {
  .pokedex-layout {
    grid-template-columns: 1fr;
  }
  .filters-panel {
    position: static;
  }
}
</style>
