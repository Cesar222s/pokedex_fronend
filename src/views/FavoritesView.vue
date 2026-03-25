<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useFavoritesStore } from '../stores/favorites'
import api from '../api/client'

const favoritesStore = useFavoritesStore()
const pokemonData = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  await favoritesStore.fetchFavorites()
  await loadPokemonData()
})

async function loadPokemonData() {
  loading.value = true
  try {
    const data = await Promise.all(
      favoritesStore.favorites.map(async (fav: any) => {
        const res = await api.get(`/pokemon/${fav.pokemon_id}`)
        return {
          ...res.data,
          types: res.data.types.map((t: any) => t.name)
        }
      })
    )
    pokemonData.value = data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function removeFavorite(pokemonId: number) {
  await favoritesStore.toggleFavorite(pokemonId)
  pokemonData.value = pokemonData.value.filter(p => p.id !== pokemonId)
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title"><i class="fas fa-heart" style="margin-right:8px"></i>Favoritos</h1>
      <p class="page-subtitle">Tu colección de Pokémon favoritos</p>
    </div>

    <div v-if="loading" class="spinner"></div>

    <div v-else-if="pokemonData.length === 0" class="empty-state">
      <i class="far fa-heart"></i>
      <h3>Aún no tienes favoritos</h3>
      <p>¡Empieza a explorar la Pokédex y añade Pokémon a tus favoritos!</p>
      <router-link to="/pokedex" class="btn btn-primary" style="margin-top:16px">
        <i class="fas fa-search"></i> Explorar Pokédex
      </router-link>
    </div>

    <div v-else class="favorites-grid">
      <div v-for="poke in pokemonData" :key="poke.id" class="fav-card glass animate-slide-up">
        <router-link :to="`/pokemon/${poke.id}`" class="fav-link">
          <img
            :src="poke.sprites?.other?.['official-artwork']?.front_default || poke.sprites?.front_default"
            :alt="poke.name"
            class="fav-sprite"
          />
          <div class="fav-info">
            <span class="fav-id">#{{ String(poke.id).padStart(3, '0') }}</span>
            <h3>{{ poke.name }}</h3>
            <div class="fav-types">
              <span v-for="t in poke.types" :key="t" class="type-badge" :class="`type-${t}`">{{ t }}</span>
            </div>
          </div>
        </router-link>
        <button class="fav-remove" @click="removeFavorite(poke.id)" title="Quitar de favoritos">
          <i class="fas fa-heart-broken"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.fav-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: var(--bg-card);
  border: var(--border-width) solid var(--border-glass);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  transition: var(--transition);
}
.fav-card:hover { 
  transform: translateY(-4px) translateX(-4px); 
  box-shadow: var(--shadow-hover); 
  border-color: var(--accent-secondary);
}

.fav-link {
  display: flex;
  align-items: center;
  gap: 16px;
  text-decoration: none;
  color: var(--text-primary);
  flex: 1;
}

.fav-sprite {
  width: 72px;
  height: 72px;
  object-fit: contain;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.15));
}

.fav-info { flex: 1; }
.fav-id { font-size: 11px; color: var(--text-muted); font-weight: 700; }
.fav-info h3 { text-transform: capitalize; font-size: 16px; margin: 2px 0 6px; }
.fav-types { display: flex; gap: 4px; }

.fav-remove {
  background: white;
  border: 2px solid var(--border-glass);
  border-radius: 50%;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 16px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition);
  box-shadow: 2px 2px 0px var(--border-glass);
}
.fav-remove:hover { 
  color: var(--accent-primary); 
  transform: translate(-2px, -2px); 
  box-shadow: 4px 4px 0px var(--border-glass);
}
</style>
