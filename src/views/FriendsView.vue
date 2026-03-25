<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useFriendsStore } from '../stores/friends'
import { useAuthStore } from '../stores/auth'

const friendsStore = useFriendsStore()
const authStore = useAuthStore()
const friendCode = ref('')
const successMsg = ref('')
const copied = ref(false)
let refreshInterval: number

async function loadFriendsData() {
  await authStore.fetchMe()
  await Promise.all([
    friendsStore.fetchFriends(),
    friendsStore.fetchPending()
  ])
}

onMounted(async () => {
  await loadFriendsData()
  
  // Refrescar datos cada 3 segundos mientras la página está activa
  refreshInterval = window.setInterval(async () => {
    console.log('[Friends] Refreshing pending requests...')
    await Promise.all([
      friendsStore.fetchFriends(),
      friendsStore.fetchPending()
    ])
  }, 3000)
})

onBeforeUnmount(() => {
  // Limpiar intervalo cuando se desmonta la página
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

async function addFriend() {
  friendsStore.error = null
  successMsg.value = ''
  try {
    const result = await friendsStore.addFriend(friendCode.value)
    successMsg.value = `Friend request sent to ${result.friend.username}!`
    friendCode.value = ''
  } catch { /* error handled in store */ }
}

function copyCode() {
  if (authStore.user?.friend_code) {
    navigator.clipboard.writeText(authStore.user.friend_code)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title"><i class="fas fa-user-friends" style="margin-right:8px"></i>Amigos</h1>
      <p class="page-subtitle">Conéctate con otros entrenadores y desáfialos a batallas</p>
    </div>

    <!-- Your friend code -->
    <div class="friend-code-section glass">
      <div class="code-info">
        <h3>Tu Código de Amigo</h3>
        <p>Comparte este código para que otros te añadan</p>
      </div>
      <div class="code-display">
        <span class="the-code">{{ authStore.user?.friend_code || '...' }}</span>
        <button class="btn btn-sm btn-secondary" @click="copyCode">
          <i :class="copied ? 'fas fa-check' : 'fas fa-copy'"></i>
          {{ copied ? '¡Copiado!' : 'Copiar' }}
        </button>
      </div>
    </div>

    <!-- Add friend -->
    <div class="add-friend-section glass">
      <h3><i class="fas fa-plus-circle"></i> Añadir un Amigo</h3>
      <div class="add-friend-form">
        <input v-model="friendCode" class="input" placeholder="Ingresa el código de amigo..." @keyup.enter="addFriend" />
        <button class="btn btn-primary" @click="addFriend" :disabled="!friendCode.trim()">
          <i class="fas fa-paper-plane"></i> Enviar Solicitud
        </button>
      </div>
      <div v-if="friendsStore.error" class="alert alert-error" style="margin-top:12px">{{ friendsStore.error }}</div>
      <div v-if="successMsg" class="alert alert-success" style="margin-top:12px">{{ successMsg }}</div>
    </div>

    <div v-if="friendsStore.pending.length > 0" class="section pending-requests-section">
      <h2 class="section-title">
        <i class="fas fa-clock"></i> Solicitudes Pendientes
        <span class="count-badge pulse">{{ friendsStore.pending.length }}</span>
      </h2>
      <div class="friends-list">
        <div v-for="req in friendsStore.pending" :key="req.id" class="friend-item glass">
          <div class="friend-info">
            <i class="fas fa-user-circle friend-avatar"></i>
            <div>
              <h4>{{ req.username }}</h4>
              <span class="friend-meta">{{ req.friend_code }}</span>
            </div>
          </div>
          <div class="friend-actions">
            <button class="btn btn-sm btn-success" @click="friendsStore.acceptFriend(req.id)">
              <i class="fas fa-check"></i> Aceptar
            </button>
            <button class="btn btn-sm btn-danger" @click="friendsStore.removeFriend(req.id)">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Friends list -->
    <div class="section">
      <h2 class="section-title">
        <i class="fas fa-users"></i> Mis Amigos
        <span class="count-badge">{{ friendsStore.friends.length }}</span>
      </h2>

      <div v-if="friendsStore.friends.length === 0" class="empty-state">
        <i class="fas fa-user-friends"></i>
        <h3>Aún no tienes amigos</h3>
        <p>¡Comparte tu código de amigo o ingresa el código de un amigo arriba!</p>
      </div>

      <div v-else class="friends-list">
        <div v-for="friend in friendsStore.friends" :key="friend.id" class="friend-item glass">
          <div class="friend-info">
            <i class="fas fa-user-circle friend-avatar"></i>
            <div>
              <h4>{{ friend.username }}</h4>
              <span class="friend-meta">Código: {{ friend.friend_code }}</span>
            </div>
          </div>
          <div class="friend-actions">
            <router-link :to="`/battle?opponent=${friend.id}&name=${friend.username}`" class="btn btn-sm btn-primary">
              <i class="fas fa-bolt"></i> Batalla
            </router-link>
            <button class="btn btn-sm btn-danger" @click="friendsStore.removeFriend(friend.friendship_id)">
              <i class="fas fa-user-minus"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.friend-code-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  background: var(--bg-card);
  border: var(--border-width) solid var(--border-glass);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  margin-bottom: 24px;
}
.code-info h3 { font-size: 16px; margin-bottom: 4px; }
.code-info p { font-size: 13px; color: var(--text-secondary); }
.code-display { display: flex; align-items: center; gap: 12px; }
.the-code {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 3px;
  color: var(--accent-gold);
  font-family: monospace;
}

.add-friend-section {
  padding: 24px;
  background: var(--bg-card);
  border: var(--border-width) solid var(--border-glass);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  margin-bottom: 32px;
}
.add-friend-section h3 {
  font-size: 16px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.add-friend-form {
  display: flex;
  gap: 12px;
}
.add-friend-form .input { max-width: 300px; }

.section { margin-bottom: 32px; }
.section-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.count-badge {
  background: var(--accent-primary);
  color: white;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
}

.count-badge.pulse {
  animation: pulse-red 2s infinite;
  box-shadow: 0 0 0 rgba(239, 68, 68, 0.4);
}

@keyframes pulse-red {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}

.pending-requests-section .friend-item {
  border-left: 4px solid var(--accent-primary);
  background: linear-gradient(90deg, rgba(239, 68, 68, 0.05) 0%, rgba(255, 255, 255, 0) 100%);
}

.friends-list { display: flex; flex-direction: column; gap: 10px; }

.friend-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--bg-card);
  border: var(--border-width) solid var(--border-glass);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  transition: var(--transition);
}
.friend-item:hover {
  transform: translateY(-4px) translateX(-4px);
  box-shadow: var(--shadow-hover);
}

.friend-info {
  display: flex;
  align-items: center;
  gap: 12px;
}
.friend-avatar { font-size: 32px; color: var(--text-muted); }
.friend-info h4 { font-size: 15px; font-weight: 600; }
.friend-meta { font-size: 12px; color: var(--text-muted); }

.friend-actions { display: flex; gap: 8px; }

@media (max-width: 768px) {
  .friend-code-section { flex-direction: column; gap: 16px; text-align: center; }
  .add-friend-form { flex-direction: column; }
  .add-friend-form .input { max-width: 100%; }
  .friend-item { flex-direction: column; gap: 12px; align-items: flex-start; }
}
</style>
