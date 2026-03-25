<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useFriendsStore } from '../stores/friends'
import { useTeamsStore } from '../stores/teams'
import { useBattlesStore } from '../stores/battles'
import api from '../api/client'

const route = useRoute()
const friendsStore = useFriendsStore()
const teamsStore = useTeamsStore()
const battlesStore = useBattlesStore()

const selectedOpponent = ref<number | null>(null)
const selectedOpponentName = ref('')
const selectedMyTeam = ref<number | null>(null)
const selectedOpponentTeam = ref<number | null>(null)
const opponentTeams = ref<any[]>([])
const battleResult = ref<any>(null)
const loading = ref(false)
const error = ref('')

onMounted(async () => {
  await Promise.all([
    friendsStore.fetchFriends(),
    teamsStore.fetchTeams(),
    battlesStore.fetchBattles()
  ])

  // Pre-select opponent from query params
  if (route.query.opponent) {
    selectedOpponent.value = Number(route.query.opponent)
    selectedOpponentName.value = route.query.name as string || ''
    await loadOpponentTeams()
  }
})

async function loadOpponentTeams() {
  if (!selectedOpponent.value) return
  try {
    console.log('[Battle] Cargando equipos del oponente:', selectedOpponent.value)
    const response = await api.get(`/teams/friend/${selectedOpponent.value}`)
    opponentTeams.value = response.data.teams
    selectedOpponentTeam.value = null
    console.log('[Battle] Equipos cargados:', opponentTeams.value.length)
  } catch (err: any) {
    error.value = err.response?.data?.error || 'No se pudieron cargar los equipos'
    opponentTeams.value = []
  }
}



async function startBattle() {
  if (!selectedOpponent.value || !selectedMyTeam.value || !selectedOpponentTeam.value) return
  loading.value = true
  error.value = ''
  battleResult.value = null

  try {
    const result = await battlesStore.startBattle(
      selectedOpponent.value,
      selectedMyTeam.value,
      selectedOpponentTeam.value
    )
    battleResult.value = result
    await battlesStore.fetchBattles()
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Battle failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title"><i class="fas fa-bolt" style="margin-right:8px"></i>Arena de Batalla</h1>
      <p class="page-subtitle">Desafía a tus amigos a épicas batallas Pokémon</p>
    </div>

    <!-- Battle setup -->
    <div class="battle-setup glass">
      <h3><i class="fas fa-gamepad"></i> Iniciar una Batalla</h3>

      <div class="setup-grid">
        <!-- Select opponent -->
        <div class="setup-step">
          <label>1. Elige Oponente</label>
          <div v-if="friendsStore.friends.length === 0" class="setup-empty">
            <p>¡Primero necesitas amigos!</p>
            <router-link to="/friends" class="btn btn-sm btn-secondary">Añadir Amigos</router-link>
          </div>
          <select v-else v-model="selectedOpponent" @change="loadOpponentTeams" class="select">
            <option :value="null" disabled>Selecciona un amigo...</option>
            <option v-for="f in friendsStore.friends" :key="f.id" :value="f.id">{{ f.username }}</option>
          </select>
        </div>

        <!-- Select opponent team -->
        <div class="setup-step">
          <label>2. Equipo del Oponente</label>
          <div v-if="selectedOpponent === null" class="setup-empty">
            <p>Selecciona un oponente primero</p>
          </div>
          <div v-else-if="opponentTeams.length === 0" class="setup-empty">
            <p>Tu oponente no tiene equipos</p>
          </div>
          <select v-else v-model="selectedOpponentTeam" class="select">
            <option :value="null" disabled>Selecciona equipo del oponente...</option>
            <option v-for="t in opponentTeams" :key="t.id" :value="t.id">
              {{ t.name }} ({{ t.members.length }} Pokémon)
            </option>
          </select>
        </div>

        <!-- Select your team -->
        <div class="setup-step">
          <label>3. Tu Equipo</label>
          <div v-if="teamsStore.teams.length === 0" class="setup-empty">
            <p>¡Crea un equipo primero!</p>
            <router-link to="/teams" class="btn btn-sm btn-secondary">Crear Equipo</router-link>
          </div>
          <select v-else v-model="selectedMyTeam" class="select">
            <option :value="null" disabled>Selecciona tu equipo...</option>
            <option v-for="t in teamsStore.teams" :key="t.id" :value="t.id">
              {{ t.name }} ({{ t.members.length }} Pokémon)
            </option>
          </select>
        </div>
      </div>

      <div v-if="error" class="alert alert-error" style="margin-top:16px">{{ error }}</div>

      <button
        class="btn btn-primary btn-lg battle-btn"
        @click="startBattle"
        :disabled="!selectedOpponent || !selectedMyTeam || !selectedOpponentTeam || loading"
      >
        <i class="fas fa-bolt"></i>
        {{ loading ? 'Batallando...' : '¡Iniciar Batalla!' }}
      </button>
    </div>

    <!-- Battle result -->
    <div v-if="battleResult" class="battle-result glass animate-slide-up">
      <div class="result-header" :class="battleResult.winner === 'challenger' ? 'won' : 'lost'">
        <i :class="battleResult.winner === 'challenger' ? 'fas fa-trophy' : 'fas fa-skull-crossbones'"></i>
        <h2>{{ battleResult.winner === 'challenger' ? '¡Victoria!' : '¡Derrota!' }}</h2>
      </div>

      <div class="battle-log">
        <div v-for="(entry, i) in battleResult.log" :key="i" class="log-entry" :class="`log-${entry.type}`">
          <template v-if="entry.type === 'battle_start' || entry.type === 'battle_end'">
            <p class="log-announcement">{{ entry.message }}</p>
          </template>
          <template v-else-if="entry.type === 'attack'">
            <p>
              <strong class="attacker">{{ entry.attacker }}</strong> used
              <span class="move-name">{{ entry.move }}</span> on
              <strong>{{ entry.defender }}</strong>
              for <span class="damage">{{ entry.damage }}</span> damage!
              <span v-if="entry.effectiveness === 'super_effective'" class="eff super">¡Súper efectivo!</span>
              <span v-else-if="entry.effectiveness === 'not_effective'" class="eff weak">No muy efectivo...</span>
              <span v-else-if="entry.effectiveness === 'immune'" class="eff immune">¡Sin efecto!</span>
            </p>
            <div class="hp-bar-mini">
              <div class="hp-fill" :style="{ width: Math.max(0, (entry.defenderHp / entry.defenderMaxHp) * 100) + '%' }"></div>
            </div>
          </template>
          <template v-else-if="entry.type === 'faint'">
            <p class="log-faint"><strong>{{ entry.pokemon }}</strong> se debilitó! 💀</p>
          </template>
          <template v-else-if="entry.type === 'switch'">
            <p class="log-switch">¡Ve, <strong>{{ entry.pokemon }}</strong>! ⚡</p>
          </template>
        </div>
      </div>
    </div>

    <!-- Battle history -->
    <div class="section" v-if="battlesStore.battles.length > 0">
      <h2 class="section-title"><i class="fas fa-history"></i> Historial de Batallas</h2>
      <div class="history-list">
        <router-link
          v-for="b in battlesStore.battles"
          :key="b.id"
          :to="`/battle/${b.id}`"
          class="history-item glass"
        >
          <div class="history-info">
            <span class="history-players">
              {{ b.challenger_name }} vs {{ b.opponent_name }}
            </span>
            <span class="history-teams">
              {{ b.challenger_team_name || 'Team' }} vs {{ b.opponent_team_name || 'Team' }}
            </span>
          </div>
          <div class="history-result">
            <span class="winner-badge">🏆 {{ b.winner_name }}</span>
            <span class="history-date">{{ new Date(b.created_at).toLocaleDateString() }}</span>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.battle-setup {
  padding: 24px;
  background: var(--bg-card);
  border: var(--border-width) solid var(--border-glass);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  margin-bottom: 32px;
}
.battle-setup h3 {
  font-size: 18px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.setup-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.setup-step label {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-secondary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.setup-empty {
  padding: 20px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}

.battle-btn {
  margin-top: 20px;
  width: 100%;
  font-size: 18px;
  padding: 16px;
}

.battle-result {
  padding: 24px;
  background: var(--bg-card);
  border: var(--border-width) solid var(--border-glass);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  margin-bottom: 32px;
}

.result-header {
  text-align: center;
  padding: 20px;
  border-radius: var(--radius-md);
  margin-bottom: 20px;
}
.result-header.won {
  background: rgba(245, 158, 11, 0.15);
}
.result-header.lost {
  background: rgba(239, 68, 68, 0.15);
}
.result-header i { font-size: 36px; margin-bottom: 8px; display: block; }
.result-header.won i { color: var(--accent-gold); }
.result-header.lost i { color: var(--accent-primary); }
.result-header h2 { font-size: 24px; }

.battle-log {
  max-height: 400px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.log-entry {
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-size: 13px;
}
.log-entry p { margin: 0; }

.log-battle_start, .log-battle_end {
  background: rgba(139, 92, 246, 0.1);
  text-align: center;
}
.log-announcement { font-weight: 700; color: var(--accent-purple); }

.log-attack { background: rgba(255,255,255,0.03); }
.attacker { text-transform: capitalize; }
.move-name { color: var(--accent-secondary); text-transform: capitalize; font-weight: 600; }
.damage { color: var(--accent-primary); font-weight: 700; }

.eff { font-size: 11px; font-weight: 700; margin-left: 4px; }
.eff.super { color: var(--accent-green); }
.eff.weak { color: var(--accent-gold); }
.eff.immune { color: var(--text-muted); }

.hp-bar-mini {
  height: 4px;
  background: rgba(255,255,255,0.1);
  border-radius: 2px;
  margin-top: 4px;
  overflow: hidden;
}
.hp-fill {
  height: 100%;
  background: var(--accent-green);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.log-faint {
  background: rgba(239, 68, 68, 0.1);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  text-transform: capitalize;
  color: var(--accent-primary);
}

.log-switch {
  background: rgba(59, 130, 246, 0.1);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  text-transform: capitalize;
  color: var(--accent-secondary);
}

.section { margin-top: 32px; }
.section-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.history-list { display: flex; flex-direction: column; gap: 10px; }

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--bg-card);
  border: var(--border-width) solid var(--border-glass);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  text-decoration: none;
  color: var(--text-primary);
  transition: var(--transition);
}
.history-item:hover { 
  transform: translateY(-4px) translateX(-4px); 
  box-shadow: var(--shadow-hover);
  border-color: var(--accent-secondary);
}

.history-players { font-weight: 600; font-size: 15px; }
.history-teams { display: block; font-size: 12px; color: var(--text-muted); margin-top: 2px; }

.history-result { text-align: right; }
.winner-badge { font-size: 14px; font-weight: 700; }
.history-date { display: block; font-size: 11px; color: var(--text-muted); margin-top: 2px; }

@media (max-width: 768px) {
  .setup-grid { grid-template-columns: 1fr; }
}
</style>
