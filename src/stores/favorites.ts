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
      const safeFavorites = Array.isArray(res.data?.favorites) ? res.data.favorites : []
      favorites.value = safeFavorites
      favoriteIds.value = new Set(safeFavorites.map((f: any) => f.pokemon_id))
    } catch (err) {
      console.error('Fetch favorites error:', err)
      favorites.value = []
      favoriteIds.value = new Set()
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
