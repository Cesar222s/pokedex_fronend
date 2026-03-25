<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTeamsStore } from '../stores/teams'
import api from '../api/client'

const teamsStore = useTeamsStore()
const newTeamName = ref('')
const showCreateForm = ref(false)
const addingTo = ref<number | null>(null)
const pokemonSearch = ref('')
const searchResults = ref<any[]>([])
const memberSprites = ref<Record<number, any>>({})

onMounted(async () => {
  await teamsStore.fetchTeams()
  await loadMemberSprites()
})

async function loadMemberSprites() {
  for (const team of teamsStore.teams) {
    for (const member of team.members) {
      if (!memberSprites.value[member.pokemon_id]) {
        try {
          const res = await api.get(`/pokemon/${member.pokemon_id}`)
          memberSprites.value[member.pokemon_id] = res.data
        } catch { /* ignore */ }
      }
    }
  }
}

async function createTeam() {
  if (!newTeamName.value.trim()) return
  await teamsStore.createTeam(newTeamName.value.trim())
  newTeamName.value = ''
  showCreateForm.value = false
}

async function searchPokemon() {
  if (!pokemonSearch.value.trim()) { searchResults.value = []; return }
  try {
    const res = await api.get('/pokemon', { params: { name: pokemonSearch.value.toLowerCase() } })
    searchResults.value = res.data.results
  } catch { searchResults.value = [] }
}

async function addToTeam(teamId: number, pokemonId: number) {
  try {
    await teamsStore.addMember(teamId, pokemonId)
    if (!memberSprites.value[pokemonId]) {
      const res = await api.get(`/pokemon/${pokemonId}`)
      memberSprites.value[pokemonId] = res.data
    }
    addingTo.value = null
    pokemonSearch.value = ''
    searchResults.value = []
  } catch (err: any) {
    alert(err.response?.data?.error || 'Failed to add')
  }
}

function getSprite(pokemonId: number) {
  const p = memberSprites.value[pokemonId]
  if (!p) return ''
  return p.sprites?.other?.['official-artwork']?.front_default || p.sprites?.front_default || ''
}

function getName(pokemonId: number) {
  return memberSprites.value[pokemonId]?.name || `#${pokemonId}`
}
</script>

<template>
  <div class="page">
    <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
      <div>
        <h1 class="page-title"><i class="fas fa-users" style="margin-right:8px"></i>Equipos</h1>
        <p class="page-subtitle">Crea y gestiona tus equipos Pokémon</p>
      </div>
      <button class="btn btn-primary" @click="showCreateForm = !showCreateForm">
        <i class="fas fa-plus"></i> Nuevo Equipo
      </button>
    </div>

    <!-- Create form -->
    <div v-if="showCreateForm" class="create-form glass animate-slide-up">
      <input v-model="newTeamName" class="input" placeholder="Nombre del equipo..." @keyup.enter="createTeam" />
      <button class="btn btn-success" @click="createTeam" :disabled="!newTeamName.trim()">Crear</button>
      <button class="btn btn-secondary" @click="showCreateForm = false">Cancelar</button>
    </div>

    <div v-if="teamsStore.loading" class="spinner"></div>

    <div v-else-if="teamsStore.teams.length === 0" class="empty-state">
      <i class="fas fa-users"></i>
      <h3>Aún no tienes equipos</h3>
      <p>¡Crea tu primer equipo para empezar a formar tu escuadrón ideal!</p>
    </div>

    <div v-else class="teams-list">
      <div v-for="team in teamsStore.teams" :key="team.id" class="team-card glass animate-slide-up">
        <div class="team-header">
          <h3>{{ team.name }}</h3>
          <div class="team-actions">
            <span class="member-count">{{ team.members.length }}/6</span>
            <button
              v-if="team.members.length < 6"
              class="btn btn-sm btn-secondary"
              @click="addingTo = addingTo === team.id ? null : team.id"
            >
              <i class="fas fa-plus"></i> Añadir
            </button>
            <button class="btn btn-sm btn-danger" @click="teamsStore.deleteTeam(team.id)">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>

        <!-- Add Pokemon -->
        <div v-if="addingTo === team.id" class="add-pokemon-section">
          <div class="search-row">
            <input v-model="pokemonSearch" class="input" placeholder="Buscar Pokémon por nombre..." @input="searchPokemon" />
          </div>
          <div v-if="searchResults.length" class="search-results">
            <div v-for="p in searchResults" :key="p.id" class="search-item" @click="addToTeam(team.id, p.id)">
              <img :src="p.sprites?.front_default" :alt="p.name" />
              <span>{{ p.name }}</span>
              <i class="fas fa-plus-circle"></i>
            </div>
          </div>
        </div>

        <!-- Members grid -->
        <div class="members-grid">
          <div v-for="slot in 6" :key="slot" class="member-slot">
            <template v-if="team.members.find((m: any) => m.slot === slot)">
              <div class="member-filled">
                <img :src="getSprite(team.members.find((m: any) => m.slot === slot).pokemon_id)" :alt="getName(team.members.find((m: any) => m.slot === slot).pokemon_id)" />
                <span class="member-name">{{ getName(team.members.find((m: any) => m.slot === slot).pokemon_id) }}</span>
                <button class="remove-member" @click="teamsStore.removeMember(team.id, team.members.find((m: any) => m.slot === slot).pokemon_id)">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </template>
            <template v-else>
              <div class="member-empty">
                <i class="fas fa-plus"></i>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.create-form {
  display: flex;
  gap: 12px;
  padding: 16px;
  margin-bottom: 24px;
  align-items: center;
}
.create-form .input { max-width: 300px; }

.teams-list { display: flex; flex-direction: column; gap: 20px; }

.team-card { 
  padding: 24px; 
  background: var(--bg-card);
  border: var(--border-width) solid var(--border-glass);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.team-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.team-header h3 { font-size: 18px; font-weight: 700; }

.team-actions { display: flex; align-items: center; gap: 8px; }
.member-count {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 600;
  padding: 6px 14px;
  background: var(--bg-secondary);
  border: 2px solid var(--border-glass);
  border-radius: 16px;
  box-shadow: 2px 2px 0px rgba(0,0,0,0.05);
}

.add-pokemon-section { margin-bottom: 16px; }
.search-row { margin-bottom: 8px; }
.search-results {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 200px;
  overflow-y: auto;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: 8px;
  border: var(--border-width) solid var(--border-glass);
  box-shadow: var(--shadow-lg);
}
.search-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: var(--radius-sm);
  text-transform: capitalize;
  font-size: 14px;
  transition: var(--transition);
}
.search-item:hover { background: var(--bg-primary); transform: translateX(2px); }
.search-item img { width: 36px; height: 36px; object-fit: contain; }
.search-item i { margin-left: auto; color: var(--accent-green); }

.members-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}

.member-slot {
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.member-filled {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--bg-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: var(--radius-md);
  border: 2px solid var(--border-glass);
  box-shadow: 2px 2px 0px rgba(0,0,0,0.05);
}
.member-filled img {
  width: 60%;
  height: 60%;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}
.member-name {
  font-size: 10px;
  text-transform: capitalize;
  font-weight: 600;
  margin-top: 4px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}
.remove-member {
  position: absolute;
  top: 4px;
  right: 4px;
  background: var(--accent-primary);
  border: 2px solid var(--border-glass);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: var(--transition);
}
.member-filled:hover .remove-member { opacity: 1; }

.member-empty {
  width: 100%;
  height: 100%;
  border: 2px dashed var(--text-muted);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 16px;
}

@media (max-width: 768px) {
  .members-grid { grid-template-columns: repeat(3, 1fr); }
}
</style>
