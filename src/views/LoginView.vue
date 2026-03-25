<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')

async function handleLogin() {
  const success = await authStore.login(email.value, password.value)
  if (success) {
    router.push('/pokedex')
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-bg">
      <div class="pokeball-bg"></div>
    </div>
    <div class="auth-card">
      <div class="auth-header">
        <div class="auth-pokeball">
          <div class="pokeball-top"></div>
          <div class="pokeball-line"></div>
          <div class="pokeball-center"></div>
        </div>
        <h1>Bienvenido</h1>
        <p>Inicia sesión en tu cuenta Pokédex</p>
      </div>

      <div v-if="authStore.error" class="alert alert-error">
        {{ authStore.error }}
      </div>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label>Correo electrónico</label>
          <input v-model="email" type="email" class="input" placeholder="ash@pokemon.com" required />
        </div>
        <div class="form-group">
          <label>Contraseña</label>
          <input v-model="password" type="password" class="input" placeholder="••••••••" required />
        </div>
        <button type="submit" class="btn btn-primary btn-lg" :disabled="authStore.loading" style="width:100%">
          <i class="fas fa-sign-in-alt"></i>
          {{ authStore.loading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
        </button>
      </form>

      <p class="auth-footer">
        ¿No tienes cuenta?
        <router-link to="/register">Crear una</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 20px;
}

.auth-bg {
  position: fixed;
  inset: 0;
  overflow: hidden;
  z-index: 0;
}

.pokeball-bg {
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--gradient-pokeball);
  opacity: 0.12;
  animation: float 6s ease-in-out infinite;
}

.auth-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  padding: 48px 40px;
  background: var(--bg-card);
  border: var(--border-width) solid var(--border-glass);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  animation: slideUp 0.5s ease-out;
}

.auth-header {
  text-align: center;
  margin-bottom: 32px;
}

.auth-pokeball {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  position: relative;
  overflow: hidden;
  border: 3px solid #444;
  margin: 0 auto 16px;
  animation: pulse-glow 2s infinite;
}
.auth-pokeball .pokeball-top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: var(--accent-primary);
}
.auth-pokeball .pokeball-line {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 4px;
  background: #444;
  transform: translateY(-50%);
  z-index: 2;
}
.auth-pokeball .pokeball-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  border: 3px solid #444;
  z-index: 3;
}

.auth-header h1 {
  font-size: 28px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-gold));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.auth-header p {
  color: var(--text-secondary);
  font-size: 14px;
  margin-top: 4px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-group label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.auth-footer {
  text-align: center;
  margin-top: 24px;
  color: var(--text-muted);
  font-size: 14px;
}
.auth-footer a {
  color: var(--accent-primary);
  text-decoration: none;
  font-weight: 600;
}
.auth-footer a:hover {
  text-decoration: underline;
}
</style>
