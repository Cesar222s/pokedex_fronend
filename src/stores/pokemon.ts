import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../api/client'

export interface Pokemon {
  id: number
  name: string
  sprites: any
  types: string[]
}

export const usePokemonStore = defineStore('pokemon', () => {
  const pokemonList = ref<Pokemon[]>([])
  const totalCount = ref(0)
  const loading = ref(false)
  const offset = ref(0)
  const limit = ref(20)
  const filters = ref({
    name: '',
    type1: '',
    type2: '',
    region: ''
  })
  const types = ref<string[]>([])
  const regions = ref<string[]>([])

  async function fetchPokemon(append = false) {
    loading.value = true
    try {
      const params: any = {
        limit: limit.value,
        offset: offset.value
      }
      if (filters.value.name) params.name = filters.value.name
      if (filters.value.type1) params.type1 = filters.value.type1
      if (filters.value.type2) params.type2 = filters.value.type2
      if (filters.value.region) params.region = filters.value.region

      const res = await api.get('/pokemon', { params })
      const safeResults = Array.isArray(res.data?.results) ? res.data.results : []
      const safeCount = Number.isFinite(res.data?.count) ? res.data.count : safeResults.length
      if (append) {
        pokemonList.value = [...pokemonList.value, ...safeResults]
      } else {
        pokemonList.value = safeResults
      }
      totalCount.value = safeCount
    } catch (err) {
      console.error('Fetch pokemon error:', err)
      if (!append) {
        pokemonList.value = []
        totalCount.value = 0
      }
    } finally {
      loading.value = false
    }
  }

  async function fetchTypes() {
    try {
      const res = await api.get('/pokemon/types')
      types.value = Array.isArray(res.data?.types) ? res.data.types : []
    } catch { /* ignore */ }
  }

  async function fetchRegions() {
    try {
      const res = await api.get('/pokemon/regions')
      regions.value = Array.isArray(res.data?.regions) ? res.data.regions : []
    } catch { /* ignore */ }
  }

  function resetFilters() {
    filters.value = { name: '', type1: '', type2: '', region: '' }
    offset.value = 0
  }

  function loadMore() {
    offset.value += limit.value
    fetchPokemon(true)
  }

  return { pokemonList, totalCount, loading, offset, limit, filters, types, regions, fetchPokemon, fetchTypes, fetchRegions, resetFilters, loadMore }
})
