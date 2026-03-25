import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../api/client'

export const useFavoritesStore = defineStore('favorites', () => {
  const favorites = ref<any[]>([])
  const favoriteIds = ref<Set<number>>(new Set())
  const loading = ref(false)

  async function fetchFavorites() {
    loading.value = true
    try {
      const res = await api.get('/favorites')
      favorites.value = res.data.favorites
      favoriteIds.value = new Set(res.data.favorites.map((f: any) => f.pokemon_id))
    } catch (err) {
      console.error('Fetch favorites error:', err)
    } finally {
      loading.value = false
    }
  }

  async function toggleFavorite(pokemonId: number) {
    try {
      if (favoriteIds.value.has(pokemonId)) {
        await api.delete(`/favorites/${pokemonId}`)
        favoriteIds.value.delete(pokemonId)
        favorites.value = favorites.value.filter(f => f.pokemon_id !== pokemonId)
      } else {
        await api.post('/favorites', { pokemon_id: pokemonId })
        favoriteIds.value.add(pokemonId)
        favorites.value.push({ pokemon_id: pokemonId })
      }
      // Trigger reactivity
      favoriteIds.value = new Set(favoriteIds.value)
    } catch (err) {
      console.error('Toggle favorite error:', err)
    }
  }

  function isFavorite(pokemonId: number): boolean {
    return favoriteIds.value.has(pokemonId)
  }

  return { favorites, favoriteIds, loading, fetchFavorites, toggleFavorite, isFavorite }
})
