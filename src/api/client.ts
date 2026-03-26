import axios from 'axios'

const rawApiBaseUrl = import.meta.env.VITE_API_URL?.trim()
const apiBaseUrl = rawApiBaseUrl && rawApiBaseUrl.length > 0 ? rawApiBaseUrl : '/api'

if (typeof window !== 'undefined' && apiBaseUrl === '/api' && window.location.hostname.includes('railway.app')) {
  console.error('[API] VITE_API_URL no configurada en Railway. Las peticiones /api irán al frontend y pueden fallar con 404/405.')
}

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pokedex_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pokedex_token')
      localStorage.removeItem('pokedex_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
