<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFriendsStore } from '../stores/friends'
import { useTeamsStore } from '../stores/teams'
import { useBattlesStore } from '../stores/battles'
import api from '../api/client'

const route = useRoute()
const router = useRouter()
const friendsStore = useFriendsStore()
const teamsStore = useTeamsStore()
const battlesStore = useBattlesStore()

// Setup mode refs
const selectedOpponent = ref<string | null>(null)
const selectedMyTeam = ref<string | null>(null)
const selectedOpponentTeam = ref<string | null>(null)
const opponentTeams = ref<any[]>([])
const loading = ref(false)
const setupError = ref('')

// Battle mode refs
const activeBattleId = ref<string | null>(null)
const battleState = ref<any>(null)
const battleLoading = ref(false)
const availableMoves = ref<any[]>([])
const selectedMoveIndex = ref<number | null>(null)
const battleLog = ref<string[]>([])
const pollingInterval = ref<any>(null)

const isInBattle = computed(() => {
  if (!activeBattleId.value || !battleState.value) return false
  return battleState.value.status === 'active' || battleState.value.status === 'waiting_for_opponent'
})
const isYourTurn = computed(() => battleState.value?.is_your_turn === true)

onMounted(async () => {
  await Promise.all([
    friendsStore.fetchFriends(),
    teamsStore.fetchTeams(),
    battlesStore.fetchBattles()
  ])

  if (route.params.id) {
    initializeBattle(route.params.id as string)
  }
})

watch(() => route.params.id, (newId) => {
  if (newId) {
    initializeBattle(newId as string)
  } else {
    stopPolling()
    activeBattleId.value = null
    battleState.value = null
  }
})

function stopPolling() {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value)
    pollingInterval.value = null
  }
}

async function initializeBattle(id: string) {
  stopPolling()
  activeBattleId.value = id
  acceptanceStep.value = 'invitation' // Reset acceptance step
  battleLog.value = []
  await startPolling()
}

onUnmounted(() => {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value)
  }
})

async function loadOpponentTeams() {
  if (!selectedOpponent.value) return
  try {
    const response = await api.get(`/teams/friend/${selectedOpponent.value}`)
    opponentTeams.value = response.data.teams
    selectedOpponentTeam.value = null
  } catch (err: any) {
    setupError.value = err.response?.data?.error || 'No se pudieron cargar los equipos'
  }
}

async function startNewBattle() {
  if (!selectedOpponent.value || !selectedMyTeam.value) return
  loading.value = true
  setupError.value = ''

  try {
    const response = await api.post('/battles', {
      opponent_id: selectedOpponent.value,
      challenger_team_id: selectedMyTeam.value
      // Note: opponent_team_id is now chosen by the opponent upon acceptance
    })
    
    activeBattleId.value = response.data.battle_id
    await startPolling()
  } catch (err: any) {
    setupError.value = err.response?.data?.error || 'No se pudo iniciar la batalla'
  } finally {
    loading.value = false
  }
}

async function startPolling() {
  await fetchBattleStatus()
  pollingInterval.value = setInterval(fetchBattleStatus, 2000)
}

async function fetchBattleStatus() {
  if (!activeBattleId.value) return
  try {
    const response = await api.get(`/battles/${activeBattleId.value}/status`)
    battleState.value = response.data
    
    // Cargar movimientos del Pokémon actual si es tu turno
    if (isYourTurn.value && availableMoves.value.length === 0) {
      await loadPokemonMoves()
    }
    
    if (response.data.status === 'finished') {
      clearInterval(pollingInterval.value)
      battleLog.value.push(`¡Batalla terminada! Ganador: ${response.data.winner_name}`)
    }
  } catch (err: any) {
    console.error('Error fetching battle status:', err)
  }
}

async function loadPokemonMoves() {
  try {
    const pokemon = battleState.value.your_pokemon
    const response = await api.get(`https://pokeapi.co/api/v2/pokemon/${pokemon.pokemon_id}`)
    
    // Limitar a los primeros 4 movimientos
    availableMoves.value = response.data.moves.slice(0, 4).map((m: any, idx: number) => ({
      index: idx,
      name: m.move.name,
      url: m.move.url
    }))
  } catch (err) {
    console.error('Error loading moves:', err)
    availableMoves.value = []
  }
}

const isShaking = ref(false)

async function executeMove(moveIndex: number) {
  if (!activeBattleId.value || !isYourTurn.value) return
  battleLoading.value = true
  selectedMoveIndex.value = moveIndex

  try {
    const response = await api.post(`/battles/${activeBattleId.value}/action`, {
      move_index: moveIndex
    })
    
    // Trigger shake animation
    isShaking.value = true
    setTimeout(() => isShaking.value = false, 500)

    battleLog.value.push(response.data.message)
    availableMoves.value = []
    selectedMoveIndex.value = null
    await fetchBattleStatus()
  } catch (err: any) {
    battleLog.value.push(`❌ Error: ${err.response?.data?.error || 'No se pudo ejecutar el movimiento'}`)
  } finally {
    battleLoading.value = false
  }
}

const acceptanceStep = ref<'invitation' | 'choosing_team'>('invitation')

async function handleAcceptClick() {
  acceptanceStep.value = 'choosing_team'
}

async function confirmAcceptance(teamId: string) {
  if (!activeBattleId.value) return
  loading.value = true
  try {
    await battlesStore.acceptBattle(activeBattleId.value, teamId)
    await fetchBattleStatus()
  } catch (err: any) {
    setupError.value = 'No se pudo aceptar la batalla'
  } finally {
    loading.value = false
  }
}

async function declineBattle() {
  if (!activeBattleId.value) return
  if (!confirm('¿Seguro que quieres rechazar esta batalla?')) return
  
  loading.value = true
  try {
    await battlesStore.declineBattle(activeBattleId.value)
    activeBattleId.value = null
    battleState.value = null
    router.push('/battle')
  } catch (err: any) {
    setupError.value = 'Error al rechazar la batalla'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title"><i class="fas fa-lightning-bolt" style="margin-right:8px"></i>Arena de Batalla</h1>
      <p class="page-subtitle">Batalla por turnos en tiempo real</p>
    </div>

    <!-- MODO: BATALLA ACTIVA -->
    <div v-if="isInBattle" class="battle-arena glass">
      <!-- Banner de Invitación (Para el Oponente) -->
      <div v-if="battleState?.status === 'waiting_for_opponent' && battleState?.you_are === 'opponent'" class="invitation-banner">
        <div class="invitation-content glass">
          <div v-if="acceptanceStep === 'invitation'">
            <i class="fas fa-handshake-angle"></i>
            <div class="invitation-text">
              <h3>¡HAS SIDO RETADO POR {{ battleState?.challenger_name }}!</h3>
              <p>¿Aceptas el desafío a una batalla 6v6?</p>
            </div>
            <div class="invitation-actions">
              <button class="btn btn-primary btn-lg" @click="handleAcceptClick">
                <i class="fas fa-check"></i> ¡ACEPTAR RETO!
              </button>
              <button class="btn btn-secondary" @click="declineBattle">
                <i class="fas fa-times"></i> Rechazar
              </button>
            </div>
          </div>

          <div v-else-if="acceptanceStep === 'choosing_team'" class="team-picker-step">
            <h3>Selecciona tu Equipo</h3>
            <p>Elige con quién vas a defender tu honor:</p>
            <div class="team-list-mini">
              <div 
                v-for="t in teamsStore.teams" 
                :key="t.id" 
                class="team-item-mini"
                @click="confirmAcceptance(t.id)"
              >
                <div class="team-info-mini">
                  <strong>{{ t.name }}</strong>
                  <span>{{ t.members.length }} Pokémon</span>
                </div>
                <i class="fas fa-chevron-right"></i>
              </div>
              <div v-if="teamsStore.teams.length === 0" class="empty-teams-mini">
                <p>No tienes equipos de 6. ¡Crea uno primero!</p>
                <router-link to="/teams" class="btn btn-sm btn-secondary">Ir a Equipos</router-link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="battle-title">
        <h2>{{ battleState?.challenger_name }} vs {{ battleState?.opponent_name }}</h2>
        <p class="turn-info">Turno {{ battleState?.turn }}</p>
      </div>

      <div class="battle-field">
        <!-- Tu Pokémon -->
        <div class="pokemon-side yours" :class="{ 'hit-shake': isShaking && !isYourTurn }">
          <div class="pokemon-card animate-float">
            <div class="pokemon-nameplate">
              <h3>{{ battleState?.your_pokemon?.pokemon_name }}</h3>
              <p class="pokemon-status" :class="battleState?.your_pokemon?.status">
                {{ battleState?.your_pokemon?.status === 'fainted' ? '💀 Desmayado' : '✨ Activo' }}
              </p>
            </div>
            <div class="hp-bar">
              <div class="hp-fill" :class="{ 
                'danger': (battleState?.your_pokemon?.hp / battleState?.your_pokemon?.max_hp) < 0.2,
                'warning': (battleState?.your_pokemon?.hp / battleState?.your_pokemon?.max_hp) < 0.5
              }" :style="{ 
                width: (battleState?.your_pokemon?.hp / battleState?.your_pokemon?.max_hp * 100) + '%'
              }"></div>
            </div>
            <p class="hp-text">{{ battleState?.your_pokemon?.hp }}/{{ battleState?.your_pokemon?.max_hp }} HP</p>
          </div>
        </div>

        <!-- Pokémon del Oponente -->
        <div class="pokemon-side opponent" :class="{ 'hit-shake': isShaking && isYourTurn }">
          <div class="pokemon-card animate-float" style="animation-delay: -1.5s">
            <div class="pokemon-nameplate">
              <h3>{{ battleState?.opponent_pokemon?.pokemon_name }}</h3>
              <p class="pokemon-status" :class="battleState?.opponent_pokemon?.status">
                {{ battleState?.opponent_pokemon?.status === 'fainted' ? '💀 Desmayado' : '✨ Activo' }}
              </p>
            </div>
            <div class="hp-bar">
              <div class="hp-fill" :class="{ 
                'danger': (battleState?.opponent_pokemon?.hp / battleState?.opponent_pokemon?.max_hp) < 0.2,
                'warning': (battleState?.opponent_pokemon?.hp / battleState?.opponent_pokemon?.max_hp) < 0.5
              }" :style="{ 
                width: (battleState?.opponent_pokemon?.hp / battleState?.opponent_pokemon?.max_hp * 100) + '%'
              }"></div>
            </div>
            <p class="hp-text">{{ battleState?.opponent_pokemon?.hp }}/{{ battleState?.opponent_pokemon?.max_hp }} HP</p>
          </div>
        </div>
      </div>

      <!-- Estado del Turno -->
      <div class="turn-status">
        <div v-if="isYourTurn" class="status-your-turn">
          <p><i class="fas fa-hourglass-end"></i> ¡Es tu turno! Selecciona un movimiento</p>
        </div>
        <div v-else class="status-opponent-turn">
          <p><i class="fas fa-spinner animate-spin"></i> Turno del oponente...</p>
        </div>
      </div>

      <!-- Movimientos Disponibles -->
      <div v-if="isYourTurn && availableMoves.length > 0" class="moves-selection">
        <h4>Elige tu Movimiento:</h4>
        <div class="moves-grid">
          <button
            v-for="(move, idx) in availableMoves"
            :key="idx"
            class="move-btn"
            @click="executeMove(move.index)"
            :disabled="battleLoading || selectedMoveIndex !== null"
          >
            <span class="move-name">{{ move.name }}</span>
            <span class="move-status" v-if="selectedMoveIndex === move.index && battleLoading">
              <i class="fas fa-spinner animate-spin"></i>
            </span>
          </button>
        </div>
      </div>

      <!-- Registro de Batalla -->
      <div class="battle-log">
        <h4>Registro:</h4>
        <div class="log-messages">
          <p v-for="(msg, i) in battleLog" :key="i" class="log-msg">{{ msg }}</p>
          <p v-if="battleLog.length === 0" class="log-empty">Aguardando acciones...</p>
        </div>
      </div>

      <!-- Resultado Final -->
      <div v-if="battleState?.status === 'finished'" class="battle-result">
        <div class="result-box">
          <i class="fas fa-trophy"></i>
          <h3>¡Batalla Terminada!</h3>
          <p class="winner-text">{{ battleState?.winner_name }} ¡Ha ganado!</p>
          <button class="btn btn-primary" @click="activeBattleId = null; router.push('/battle')">
            Volver al Lobby
          </button>
        </div>
      </div>
    </div>

    <!-- MODO: SELECCIÓN DE BATALLA -->
    <div v-else class="battle-setup glass">
      <h3><i class="fas fa-gamepad"></i> Iniciar Nueva Batalla</h3>

      <div class="setup-grid">
        <!-- Seleccionar Oponente -->
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

        <!-- Seleccionar Equipo del Oponente (OMITIDO EN EL NUEVO FLUJO) -->
        <div class="setup-step">
          <label>2. Próximo Paso</label>
          <div class="setup-empty">
            <p>Tu oponente elegirá su equipo al aceptar el reto.</p>
          </div>
        </div>

        <!-- Seleccionar Tu Equipo -->
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

      <div v-if="setupError" class="alert alert-error" style="margin-top:16px">{{ setupError }}</div>

      <button
        class="btn btn-primary btn-lg battle-btn"
        @click="startNewBattle"
        :disabled="!selectedOpponent || !selectedMyTeam || !selectedOpponentTeam || loading"
      >
        <i class="fas fa-lightning-bolt"></i>
        {{ loading ? 'Iniciando...' : '¡Iniciar Batalla en Vivo!' }}
      </button>
    </div>

    <!-- Historial de Batallas -->
    <div class="section" v-if="battlesStore.battles.length > 0">
      <h2 class="section-title"><i class="fas fa-history"></i> Historial de Batallas</h2>
      <div class="history-list">
        <router-link
          v-for="b in battlesStore.battles"
          :key="b.id"
          class="history-item glass"
          :to="`/battle/${b.id}`"
        >
          <div class="history-info">
            <span class="history-players">{{ b.challenger_name }} vs {{ b.opponent_name }}</span>
            <span class="history-teams">Estado: {{ b.status }}</span>
          </div>
          <div class="history-result">
            <span class="winner-badge" v-if="b.winner_name">🏆 {{ b.winner_name }}</span>
            <span class="history-date">{{ new Date(b.created_at).toLocaleDateString() }}</span>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.battle-arena {
  padding: 24px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  border: var(--border-width) solid var(--border-glass);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  margin-bottom: 32px;
  position: relative;
  overflow: hidden;
}

.invitation-banner {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
  animation: fadeIn 0.3s ease;
}

.invitation-content {
  text-align: center;
  padding: 40px;
  max-width: 500px;
}

.invitation-content i {
  font-size: 64px;
  color: var(--accent-secondary);
  margin-bottom: 24px;
}

.invitation-text h3 {
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 12px;
  color: #fff;
}

.invitation-text p {
  color: var(--text-secondary);
  margin-bottom: 32px;
}

.invitation-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.team-picker-step { width: 100%; }
.team-list-mini {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
  max-width: 100%;
}
.team-item-mini {
  background: rgba(255, 255, 255, 0.1);
  padding: 12px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-glass);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: var(--transition);
}
.team-item-mini:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateX(4px);
}
.team-info-mini { text-align: left; }
.team-info-mini strong { display: block; color: #fff; }
.team-info-mini span { font-size: 12px; color: var(--text-secondary); }
.empty-teams-mini { padding: 20px; color: var(--text-muted); }

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.battle-title {
  text-align: center;
  margin-bottom: 24px;
}

.battle-title h2 {
  font-size: 24px;
  margin-bottom: 8px;
}

.turn-info {
  color: var(--accent-secondary);
  font-size: 14px;
  font-weight: 600;
}

.battle-field {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-md);
}

.pokemon-side {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  min-height: 280px;
}

.pokemon-side.opponent {
  flex-direction: column-reverse;
  align-items: flex-start;
}

.pokemon-card {
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid var(--border-glass);
  border-radius: var(--radius-lg);
  padding: 16px;
  width: 100%;
  max-width: 280px;
}

.pokemon-nameplate {
  margin-bottom: 12px;
}

.pokemon-nameplate h3 {
  font-size: 18px;
  margin: 0 0 4px 0;
  text-transform: capitalize;
}

.pokemon-status {
  font-size: 12px;
  margin: 0;
  font-weight: 600;
}

.pokemon-status.normal {
  color: var(--accent-green);
}

.pokemon-status.fainted {
  color: var(--accent-primary);
}

.hp-bar {
  width: 100%;
  height: 24px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: var(--radius-sm);
  overflow: hidden;
  margin-bottom: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.hp-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981 0%, #06b6d4 100%);
  border-radius: var(--radius-sm);
  transition: width 0.3s ease;
}

.hp-text {
  font-size: 12px;
  font-weight: 600;
  margin: 0;
  color: var(--text-secondary);
}

.turn-status {
  padding: 12px 16px;
  border-radius: var(--radius-md);
  text-align: center;
  margin-bottom: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.status-your-turn {
  background: rgba(16, 185, 129, 0.15);
  color: var(--accent-green);
}

.status-opponent-turn {
  background: rgba(139, 92, 246, 0.15);
  color: var(--accent-purple);
}

.moves-selection {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-md);
  padding: 16px;
  margin-bottom: 16px;
}

.moves-selection h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
}

.moves-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.move-btn {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
  border: 2px solid var(--accent-secondary);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  color: var(--text-primary);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: capitalize;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.move-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%);
  transform: translateY(-2px);
  border-color: var(--accent-purple);
}

.move-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.move-name {
  flex: 1;
}

.move-status {
  color: var(--accent-gold);
}

.battle-log {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-md);
  padding: 16px;
  margin-bottom: 16px;
  max-height: 200px;
  overflow-y: auto;
}

.battle-log h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
}

.log-messages {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.log-msg {
  font-size: 13px;
  margin: 0;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.log-empty {
  color: var(--text-muted);
  font-style: italic;
  text-align: center;
}

.battle-result {
  background: rgba(245, 158, 11, 0.15);
  border: 2px solid var(--accent-gold);
  border-radius: var(--radius-lg);
  padding: 32px;
  text-align: center;
}

.result-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.result-box i {
  font-size: 48px;
  color: var(--accent-gold);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.result-box h3 {
  font-size: 28px;
  margin: 0;
}

.winner-text {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: var(--accent-gold);
}

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
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
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
  width: 100%;
  font-size: 16px;
  padding: 14px;
}

.section {
  margin-top: 32px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

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

.history-players {
  font-weight: 600;
  font-size: 15px;
}

.history-teams {
  display: block;
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

.history-result {
  text-align: right;
}

.winner-badge {
  font-size: 14px;
  font-weight: 700;
}

.history-date {
  display: block;
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

@media (max-width: 1024px) {
  .setup-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .setup-grid {
    grid-template-columns: 1fr;
  }
  
  .battle-field {
    grid-template-columns: 1fr;
  }
  
  .moves-grid {
    grid-template-columns: 1fr;
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
