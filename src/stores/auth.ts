import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api/client'

interface User {
  id: number
  email: string
  username: string
  friend_code: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  function init() {
    const savedToken = localStorage.getItem('pokedex_token')
    const savedUser = localStorage.getItem('pokedex_user')
    if (savedToken && savedUser) {
      token.value = savedToken
      try { user.value = JSON.parse(savedUser) } catch { /* ignore */ }
    }
  }

  async function login(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const res = await api.post('/auth/login', { email, password })
      if (!res.data?.user || !res.data?.token) {
        error.value = 'No se pudo iniciar sesion. Verifica conexion y servidor.'
        return false
      }
      user.value = res.data.user
      token.value = res.data.token
      localStorage.setItem('pokedex_token', res.data.token)
      localStorage.setItem('pokedex_user', JSON.stringify(res.data.user))
      return true
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Login failed'
      return false
    } finally {
      loading.value = false
    }
  }

  async function register(email: string, password: string, username: string) {
    loading.value = true
    error.value = null
    try {
      const res = await api.post('/auth/register', { email, password, username })
      if (!res.data?.user || !res.data?.token) {
        error.value = 'No se pudo registrar. Revisa tu conexion e intenta de nuevo.'
        return false
      }
      user.value = res.data.user
      token.value = res.data.token
      localStorage.setItem('pokedex_token', res.data.token)
      localStorage.setItem('pokedex_user', JSON.stringify(res.data.user))
      return true
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Registration failed'
      return false
    } finally {
      loading.value = false
    }
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('pokedex_token')
    localStorage.removeItem('pokedex_user')
  }

  async function fetchMe() {
    try {
      const res = await api.get('/auth/me')
      user.value = res.data.user
      localStorage.setItem('pokedex_user', JSON.stringify(res.data.user))
    } catch { /* ignore */ }
  }

  return { user, token, loading, error, isAuthenticated, init, login, register, logout, fetchMe }
})
