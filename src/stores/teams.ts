import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../api/client'

export const useTeamsStore = defineStore('teams', () => {
  const teams = ref<any[]>([])
  const loading = ref(false)

  async function fetchTeams() {
    loading.value = true
    try {
      const res = await api.get('/teams')
      teams.value = res.data.teams
    } catch (err) {
      console.error('Fetch teams error:', err)
    } finally {
      loading.value = false
    }
  }

  async function createTeam(name: string) {
    try {
      const res = await api.post('/teams', { name })
      teams.value.unshift({ ...res.data, members: [] })
      return res.data
    } catch (err) {
      console.error('Create team error:', err)
      throw err
    }
  }

  async function deleteTeam(teamId: number) {
    try {
      await api.delete(`/teams/${teamId}`)
      teams.value = teams.value.filter(t => t.id !== teamId)
    } catch (err) {
      console.error('Delete team error:', err)
    }
  }

  async function addMember(teamId: number, pokemonId: number) {
    try {
      const res = await api.post(`/teams/${teamId}/members`, { pokemon_id: pokemonId })
      const team = teams.value.find(t => t.id === teamId)
      if (team) {
        team.members.push(res.data)
      }
      return res.data
    } catch (err: any) {
      console.error('Add member error:', err)
      throw err
    }
  }

  async function removeMember(teamId: number, pokemonId: number) {
    try {
      await api.delete(`/teams/${teamId}/members/${pokemonId}`)
      const team = teams.value.find(t => t.id === teamId)
      if (team) {
        team.members = team.members.filter((m: any) => m.pokemon_id !== pokemonId)
      }
    } catch (err) {
      console.error('Remove member error:', err)
    }
  }

  return { teams, loading, fetchTeams, createTeam, deleteTeam, addMember, removeMember }
})
