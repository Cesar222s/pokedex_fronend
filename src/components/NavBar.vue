<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const mobileOpen = ref(false)

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
  <nav class="navbar">
    <div class="nav-inner">
      <router-link to="/pokedex" class="nav-logo">
        <div class="pokeball-icon">
          <div class="pokeball-top"></div>
          <div class="pokeball-line"></div>
          <div class="pokeball-center"></div>
        </div>
        <span class="logo-text">Pokédex</span>
      </router-link>

      <button class="mobile-toggle" @click="mobileOpen = !mobileOpen">
        <i :class="mobileOpen ? 'fas fa-times' : 'fas fa-bars'"></i>
      </button>

      <div class="nav-links" :class="{ open: mobileOpen }">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-link"
          :class="{ active: route.path === item.path || route.path.startsWith(item.path + '/') }"
          @click="mobileOpen = false"
        >
          <i :class="item.icon"></i>
          <span>{{ item.label }}</span>
        </router-link>
      </div>

      <div class="nav-user">
        <span class="user-name">
          <i class="fas fa-user-circle"></i>
          {{ authStore.user?.username }}
        </span>
        <button class="btn btn-sm btn-danger" @click="logout">
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--bg-card);
  border-bottom: var(--border-width) solid var(--border-glass);
  box-shadow: 0 4px 0px rgba(30, 41, 59, 0.05);
}

.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  height: 64px;
  display: flex;
  align-items: center;
  gap: 32px;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  flex-shrink: 0;
}

.pokeball-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  position: relative;
  overflow: hidden;
  border: 2px solid #333;
}
.pokeball-top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: var(--accent-primary);
}
.pokeball-line {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 3px;
  background: #333;
  transform: translateY(-50%);
  z-index: 2;
}
.pokeball-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: white;
  border: 2px solid #333;
  z-index: 3;
}

.logo-text {
  font-size: 24px;
  font-weight: 900;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 700;
  font-size: 15px;
  transition: var(--transition);
  border: 2px solid transparent;
}
.nav-link:hover { 
  color: var(--text-primary); 
  background: var(--bg-secondary); 
  border-color: var(--border-glass);
  box-shadow: 2px 2px 0px var(--border-glass);
  transform: translate(-1px, -1px);
}
.nav-link.active {
  color: var(--text-primary);
  background: #fef08a; /* Soft bright yellow for active state */
  border-color: var(--border-glass);
  box-shadow: 2px 2px 0px var(--border-glass);
}
.nav-link i { font-size: 14px; }

.nav-user {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.user-name {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 700;
}

.mobile-toggle {
  display: none;
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 20px;
  cursor: pointer;
}

@media (max-width: 768px) {
  .mobile-toggle { display: block; }
  .nav-links {
    display: none;
    position: absolute;
    top: 64px;
    left: 0;
    right: 0;
    background: var(--bg-secondary);
    flex-direction: column;
    padding: 12px;
    border-bottom: 1px solid var(--border-glass);
  }
  .nav-links.open { display: flex; }
  .nav-user { margin-left: auto; }
  .user-name span { display: none; }
}
</style>
