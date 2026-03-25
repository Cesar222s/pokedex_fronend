import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../api/client'

export const useBattlesStore = defineStore('battles', () => {
  const battles = ref<any[]>([])
  const currentBattle = ref<any>(null)
  const loading = ref(false)

  async function fetchBattles() {
    loading.value = true
    try {
      const res = await api.get('/battles')
      battles.value = res.data.battles
    } catch (err) {
      console.error('Fetch battles error:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchBattle(id: number) {
    loading.value = true
    try {
      const res = await api.get(`/battles/${id}`)
      currentBattle.value = res.data.battle
      return res.data.battle
    } catch (err) {
      console.error('Fetch battle error:', err)
    } finally {
      loading.value = false
    }
  }

  async function startBattle(opponentId: number, challengerTeamId: number, opponentTeamId: number) {
    loading.value = true
    try {
      const res = await api.post('/battles', {
        opponent_id: opponentId,
        challenger_team_id: challengerTeamId,
        opponent_team_id: opponentTeamId
      })
      currentBattle.value = res.data
      return res.data
    } catch (err: any) {
      console.error('Start battle error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return { battles, currentBattle, loading, fetchBattles, fetchBattle, startBattle }
})
