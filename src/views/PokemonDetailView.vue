<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import api from '../api/client'
import { useFavoritesStore } from '../stores/favorites'
import StatsChart from '../components/StatsChart.vue'
import EvolutionChain from '../components/EvolutionChain.vue'

const route = useRoute()
const favoritesStore = useFavoritesStore()

const pokemon = ref<any>(null)
const species = ref<any>(null)
const evolution = ref<any[]>([])
const loading = ref(true)

const isFav = computed(() => pokemon.value ? favoritesStore.isFavorite(pokemon.value.id) : false)

const sprite = computed(() => {
  if (!pokemon.value) return ''
  const s = pokemon.value.sprites
  return s?.other?.['official-artwork']?.front_default || s?.front_default || ''
})

const primaryType = computed(() => pokemon.value?.types?.[0]?.name || 'normal')

onMounted(async () => {
  try {
    const id = route.params.id
    const [pokeRes, speciesRes, evoRes] = await Promise.all([
      api.get(`/pokemon/${id}`),
      api.get(`/pokemon/${id}/species`).catch(() => ({ data: null })),
      api.get(`/pokemon/${id}/evolution`).catch(() => ({ data: { chain: [] } }))
    ])
    pokemon.value = pokeRes.data
    species.value = speciesRes.data
    evolution.value = evoRes.data.chain
    favoritesStore.fetchFavorites()
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
})

function toggleFav() {
  if (pokemon.value) favoritesStore.toggleFavorite(pokemon.value.id)
}
</script>

<template>
  <div class="page">
    <div v-if="loading" class="spinner"></div>

    <div v-else-if="pokemon" class="detail-layout">
      <!-- Header -->
      <div class="detail-header" :class="`header-${primaryType}`">
        <router-link to="/pokedex" class="back-btn">
          <i class="fas fa-arrow-left"></i> Volver
        </router-link>

        <div class="header-content">
          <div class="header-info">
            <span class="poke-id">#{{ String(pokemon.id).padStart(3, '0') }}</span>
            <h1 class="poke-name">{{ pokemon.name }}</h1>
            <div class="poke-types">
              <span v-for="t in pokemon.types" :key="t.name" class="type-badge" :class="`type-${t.name}`">
                {{ t.name }}
              </span>
            </div>
            <p v-if="species?.genus" class="poke-genus">{{ species.genus }}</p>
          </div>

          <div class="header-sprite">
            <img :src="sprite" :alt="pokemon.name" />
          </div>
        </div>

        <button class="detail-fav-btn" :class="{ active: isFav }" @click="toggleFav">
          <i :class="isFav ? 'fas fa-heart' : 'far fa-heart'"></i>
          {{ isFav ? 'En Favoritos' : 'Añadir a Favoritos' }}
        </button>
      </div>

      <!-- Info grid -->
      <div class="detail-grid">
        <!-- About -->
        <section class="detail-section glass">
          <h2><i class="fas fa-info-circle"></i> Acerca de</h2>
          <div class="about-grid">
            <div class="about-item">
              <span class="about-label">Altura</span>
              <span class="about-value">{{ (pokemon.height / 10).toFixed(1) }} m</span>
            </div>
            <div class="about-item">
              <span class="about-label">Peso</span>
              <span class="about-value">{{ (pokemon.weight / 10).toFixed(1) }} kg</span>
            </div>
            <div class="about-item">
              <span class="about-label">XP Base</span>
              <span class="about-value">{{ pokemon.base_experience }}</span>
            </div>
            <div class="about-item" v-if="species?.habitat">
              <span class="about-label">Hábitat</span>
              <span class="about-value">{{ species.habitat }}</span>
            </div>
            <div class="about-item" v-if="species?.color">
              <span class="about-label">Color</span>
              <span class="about-value">{{ species.color }}</span>
            </div>
            <div class="about-item" v-if="species?.generation">
              <span class="about-label">Generación</span>
              <span class="about-value">{{ species.generation.replace('generation-', '').toUpperCase() }}</span>
            </div>
          </div>
          <p v-if="species?.flavor_text" class="flavor-text">{{ species.flavor_text }}</p>
          <div v-if="species?.is_legendary || species?.is_mythical" class="legend-badges">
            <span v-if="species.is_legendary" class="legend-badge legendary">
              <i class="fas fa-crown"></i> Legendario
            </span>
            <span v-if="species.is_mythical" class="legend-badge mythical">
              <i class="fas fa-star"></i> Mítico
            </span>
          </div>
        </section>

        <!-- Stats -->
        <section class="detail-section glass">
          <h2><i class="fas fa-chart-bar"></i> Estadísticas Base</h2>
          <StatsChart :stats="pokemon.stats" />
          <div class="stat-total">
            <span>Total</span>
            <strong>{{ pokemon.stats.reduce((sum: number, s: any) => sum + s.base_stat, 0) }}</strong>
          </div>
        </section>

        <!-- Abilities -->
        <section class="detail-section glass">
          <h2><i class="fas fa-magic"></i> Habilidades</h2>
          <div class="abilities-list">
            <div v-for="a in pokemon.abilities" :key="a.name" class="ability-item">
              <span class="ability-name">{{ a.name }}</span>
              <span v-if="a.is_hidden" class="ability-hidden">Oculta</span>
            </div>
          </div>
        </section>

        <!-- Moves -->
        <section class="detail-section glass">
          <h2><i class="fas fa-fist-raised"></i> Movimientos</h2>
          <div class="moves-grid">
            <span v-for="m in pokemon.moves" :key="m" class="move-chip">{{ m }}</span>
          </div>
        </section>
      </div>

      <!-- Evolution -->
      <section v-if="evolution.length > 1" class="detail-section glass evo-section">
        <h2><i class="fas fa-dna"></i> Cadena Evolutiva</h2>
        <EvolutionChain :chain="evolution" />
      </section>
    </div>
  </div>
</template>

<style scoped>
.detail-header {
  position: relative;
  padding: 32px;
  border-radius: var(--radius-xl);
  background: var(--bg-card);
  border: var(--border-width) solid var(--border-glass);
  box-shadow: var(--shadow-lg);
  margin-bottom: 24px;
  overflow: hidden;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 16px;
  transition: var(--transition);
}
.back-btn:hover { color: var(--text-primary); }

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.poke-id {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-muted);
}

.poke-name {
  font-size: 36px;
  font-weight: 800;
  text-transform: capitalize;
  margin: 4px 0 12px;
}

.poke-types {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.poke-genus {
  color: var(--text-secondary);
  font-style: italic;
  font-size: 14px;
}

.header-sprite {
  width: 200px;
  height: 200px;
  flex-shrink: 0;
  animation: float 3s ease-in-out infinite;
}
.header-sprite img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 8px 20px rgba(0,0,0,0.4));
}

.detail-fav-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 10px 24px;
  background: white;
  border: var(--border-width) solid var(--border-glass);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: 'Outfit', sans-serif;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition);
  box-shadow: 3px 3px 0px var(--border-glass);
}
.detail-fav-btn.active {
  color: var(--accent-primary);
  box-shadow: 4px 4px 0px var(--accent-primary);
  border-color: var(--accent-primary);
}
.detail-fav-btn:hover { 
  transform: translate(-2px, -2px);
  box-shadow: 5px 5px 0px var(--border-glass);
}
.detail-fav-btn.active:hover {
  box-shadow: 6px 6px 0px var(--accent-primary);
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.detail-section {
  padding: 24px;
  background: var(--bg-card);
  border: var(--border-width) solid var(--border-glass);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}
.detail-section h2 {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.detail-section h2 i { color: var(--accent-primary); }

.about-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.about-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.about-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  font-weight: 600;
}
.about-value {
  font-size: 15px;
  font-weight: 600;
  text-transform: capitalize;
}

.flavor-text {
  font-size: 15px;
  color: var(--text-primary);
  line-height: 1.6;
  font-weight: 500;
  border-top: var(--border-width) dashed var(--border-glass);
  padding-top: 16px;
  margin-top: 8px;
}

.legend-badges {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
.legend-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.legendary { background: rgba(245, 158, 11, 0.2); color: var(--accent-gold); }
.mythical { background: rgba(139, 92, 246, 0.2); color: var(--accent-purple); }

.stat-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 16px;
  border-top: var(--border-width) solid var(--border-glass);
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}
.stat-total strong { font-size: 20px; color: var(--text-primary); font-weight: 900; }

.abilities-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ability-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border: var(--border-width) solid var(--border-glass);
  border-radius: var(--radius-sm);
  box-shadow: 2px 2px 0px rgba(0,0,0,0.05);
}
.ability-name {
  text-transform: capitalize;
  font-weight: 700;
  font-size: 15px;
  color: var(--text-primary);
}
.ability-hidden {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 12px;
  background: #fdf4ff;
  border: 2px solid var(--accent-purple);
  color: var(--accent-purple);
  font-weight: 800;
  text-transform: uppercase;
}

.moves-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.move-chip {
  padding: 6px 12px;
  background: white;
  border: 2px solid var(--border-glass);
  border-radius: 20px;
  font-size: 13px;
  color: var(--text-primary);
  text-transform: capitalize;
  font-weight: 700;
  box-shadow: 2px 2px 0px rgba(0,0,0,0.1);
}

.evo-section {
  margin-bottom: 24px;
}

@media (max-width: 768px) {
  .detail-grid { grid-template-columns: 1fr; }
  .header-content { flex-direction: column-reverse; text-align: center; }
  .header-sprite { width: 150px; height: 150px; }
  .poke-name { font-size: 28px; }
  .poke-types { justify-content: center; }
}
</style>
