import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/pokedex'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/RegisterView.vue')
  },
  {
    path: '/pokedex',
    name: 'Pokedex',
    component: () => import('../views/PokedexView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/pokemon/:id',
    name: 'PokemonDetail',
    component: () => import('../views/PokemonDetailView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/favorites',
    name: 'Favorites',
    component: () => import('../views/FavoritesView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/teams',
    name: 'Teams',
    component: () => import('../views/TeamsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/friends',
    name: 'Friends',
    component: () => import('../views/FriendsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/battle',
    name: 'Battle',
    component: () => import('../views/BattleView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/battle/:id',
    name: 'BattleDetail',
    component: () => import('../views/BattleDetailView.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('pokedex_token')
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if ((to.path === '/login' || to.path === '/register') && token) {
    next('/pokedex')
  } else {
    next()
  }
})

export default router
