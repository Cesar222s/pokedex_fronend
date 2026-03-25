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

  async function fetchBattle(id: string) {
    loading.value = true
    try {
      const res = await api.get(`/battles/${id}/status`)
      currentBattle.value = res.data
      return res.data
    } catch (err) {
      console.error('Fetch battle error:', err)
    } finally {
      loading.value = false
    }
  }

  async function startBattle(opponentId: string, challengerTeamId: string, opponentTeamId: string) {
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

  async function declineBattle(id: string) {
    loading.value = true
    try {
      await api.delete(`/battles/${id}`)
      battles.value = battles.value.filter(b => b.id !== id)
    } catch (err: any) {
      console.error('Decline battle error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function acceptBattle(battleId: string, teamId: string) {
    loading.value = true
    try {
      const res = await api.post(`/battles/${battleId}/accept`, { team_id: teamId })
      currentBattle.value = res.data
      return res.data
    } catch (err: any) {
      console.error('Accept battle error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return { battles, currentBattle, loading, fetchBattles, fetchBattle, startBattle, declineBattle, acceptBattle }
})
