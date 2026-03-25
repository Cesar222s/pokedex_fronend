<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useBattlesStore } from '../stores/battles'

const route = useRoute()
const battlesStore = useBattlesStore()
const loading = ref(true)

onMounted(async () => {
  await battlesStore.fetchBattle(Number(route.params.id))
  loading.value = false
})
</script>

<template>
  <div class="page">
    <div class="page-header">
      <router-link to="/battle" class="back-link">
        <i class="fas fa-arrow-left"></i> Volver a la Arena
      </router-link>
      <h1 class="page-title">Detalles de Batalla</h1>
    </div>

    <div v-if="loading" class="spinner"></div>

    <div v-else-if="battlesStore.currentBattle" class="battle-detail">
      <div class="matchup">
        <div class="fighter">
          <h3>{{ battlesStore.currentBattle.challenger_name }}</h3>
          <span class="team-name">{{ battlesStore.currentBattle.challenger_team_name || 'Team' }}</span>
        </div>
        <div class="vs">VS</div>
        <div class="fighter">
          <h3>{{ battlesStore.currentBattle.opponent_name }}</h3>
          <span class="team-name">{{ battlesStore.currentBattle.opponent_team_name || 'Team' }}</span>
        </div>
      </div>

      <div class="winner-banner" :class="battlesStore.currentBattle.winner_name ? 'has-winner' : ''">
        <i class="fas fa-trophy"></i>
        <span>Ganador: <strong>{{ battlesStore.currentBattle.winner_name }}</strong></span>
      </div>

      <div class="log-section">
        <h2><i class="fas fa-scroll"></i> Registro de Batalla</h2>
        <div class="battle-log">
          <div v-for="(entry, i) in battlesStore.currentBattle.log" :key="i" class="log-entry" :class="`log-${entry.type}`">
            <template v-if="entry.type === 'battle_start' || entry.type === 'battle_end'">
              <p class="log-announcement">{{ entry.message }}</p>
            </template>
            <template v-else-if="entry.type === 'attack'">
              <p>
                <strong>{{ entry.attacker }}</strong> used
                <span class="move-name">{{ entry.move }}</span>
                → <span class="damage">{{ entry.damage }} dmg</span>
                <span v-if="entry.effectiveness === 'super_effective'" class="eff super">¡Súper efectivo!</span>
                <span v-else-if="entry.effectiveness === 'not_effective'" class="eff weak">No muy efectivo</span>
                <span v-else-if="entry.effectiveness === 'immune'" class="eff immune">¡Sin efecto!</span>
              </p>
            </template>
            <template v-else-if="entry.type === 'faint'">
              <p class="faint-msg">💀 ¡{{ entry.pokemon }} se debilitó!</p>
            </template>
            <template v-else-if="entry.type === 'switch'">
              <p class="switch-msg">⚡ ¡Ve, {{ entry.pokemon }}!</p>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
  margin-bottom: 12px;
  transition: var(--transition);
}
.back-link:hover { color: var(--text-primary); }

.matchup {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  padding: 32px;
  background: var(--bg-card);
  border: var(--border-width) solid var(--border-glass);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  margin-bottom: 24px;
  text-align: center;
}
.fighter h3 { font-size: 20px; font-weight: 700; }
.team-name { font-size: 13px; color: var(--text-muted); }
.vs {
  font-size: 28px;
  font-weight: 800;
  color: var(--accent-primary);
}

.winner-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  background: var(--bg-card);
  border: var(--border-width) solid var(--border-glass);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  margin-bottom: 24px;
  font-size: 18px;
}
.winner-banner i { color: var(--accent-gold); font-size: 24px; }
.winner-banner strong { color: var(--accent-gold); }

.log-section { 
  padding: 24px;
  background: var(--bg-card);
  border: var(--border-width) solid var(--border-glass);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}
.log-section h2 {
  font-size: 18px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.log-section h2 i { color: var(--accent-primary); }

.battle-log {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 500px;
  overflow-y: auto;
}

.log-entry {
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  text-transform: capitalize;
}
.log-entry p { margin: 0; }

.log-battle_start, .log-battle_end {
  background: #f3e8ff;
  border: 1px solid var(--accent-purple);
  text-align: center;
}
.log-announcement { font-weight: 700; color: var(--accent-purple); }
.log-attack { background: var(--bg-secondary); border: 1px solid var(--border-glass); }
.move-name { color: var(--accent-secondary); font-weight: 600; }
.damage { color: var(--accent-primary); font-weight: 700; }
.eff { font-size: 11px; font-weight: 700; margin-left: 4px; }
.eff.super { color: var(--accent-green); }
.eff.weak { color: var(--accent-gold); }
.eff.immune { color: var(--text-muted); }
.faint-msg { color: var(--accent-primary); font-weight: 600; }
.switch-msg { color: var(--accent-secondary); font-weight: 600; }
</style>
