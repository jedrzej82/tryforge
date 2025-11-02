import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import Home from '@/views/Home.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: {
      title: 'Home',
    },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/About.vue'),
    meta: {
      title: 'About',
    },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: {
      title: 'Dashboard',
      requiresAuth: false,
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/Home.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Navigation guards
router.beforeEach((to, _from, next) => {
  // Update document title
  if (to.meta.title) {
    document.title = `${to.meta.title} | Vue 3 App`
  }

  // Example: Check authentication
  // if (to.meta.requiresAuth && !isAuthenticated()) {
  //   next({ name: 'login' })
  // } else {
  //   next()
  // }

  next()
})

export default router
