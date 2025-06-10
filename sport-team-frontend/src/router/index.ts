import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/main'
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/main',
      name: 'main',
      component: () => import('@/views/MainView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/create-team',
      name: 'create-team',
      component: () => import('@/views/CreateTeamView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/my-teams',
      name: 'my-teams',
      component: () => import('@/views/MyTeamsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      redirect: '/main'
    }
  ]
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // 检查认证状态
  if (!authStore.isAuthenticated) {
    await authStore.checkAuth()
  }
  
  // 需要认证的页面
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    console.log('需要登录，跳转到登录页')
    next('/login')
    return
  }
  
  // 访客页面（已登录用户不能访问）
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    console.log('已登录，跳转到主页')
    next('/main')
    return
  }
  
  next()
})

export default router
