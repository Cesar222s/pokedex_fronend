<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

function logout() {
  authStore.logout()
  router.push('/login')
}

const navItems = [
  { path: '/pokedex', label: 'Pokédex', icon: 'fas fa-search' },
  { path: '/favorites', label: 'Favoritos', icon: 'fas fa-heart' },
  { path: '/teams', label: 'Equipos', icon: 'fas fa-users' },
  { path: '/friends', label: 'Amigos', icon: 'fas fa-user-friends' },
  { path: '/battle', label: 'Batalla', icon: 'fas fa-bolt' },
]
</script>

<template>
  <nav class="nav-glass">
    <router-link
      v-for="item in navItems"
      :key="item.path"
      :to="item.path"
      class="nav-link"
    >
      <i :class="item.icon"></i>
      <span>{{ item.label }}</span>
    </router-link>
    
    <div class="nav-user-divider"></div>
    
    <button class="nav-link logout-btn" @click="logout" title="Cerrar sesión">
      <i class="fas fa-sign-out-alt"></i>
      <span>Salir</span>
    </button>
  </nav>
</template>

<style scoped>
.nav-user-divider {
  width: 1px;
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 10px;
}

.logout-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--accent-primary);
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

@media (max-width: 600px) {
  .nav-link span {
    display: none;
  }
  .nav-glass {
    padding: 10px 16px;
    width: 95%;
  }
}
</style>
