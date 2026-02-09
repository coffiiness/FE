import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue')
  },
  {
    path: '/signup',
    name: 'Signup',
    component: () => import('@/views/SignupView.vue')
  },
  // Authenticated Routes
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/DashboardView.vue')
      },
      {
        path: 'schedule',
        name: 'Schedule',
        component: () => import('@/views/VoteListView.vue') // Temporary placeholder
      },
      {
        path: 'recruitment',
        name: 'Recruitment',
        component: () => import('@/views/VoteListView.vue') // Temporary placeholder
      },
      {
        path: 'meeting-rooms',
        name: 'MeetingRooms',
        component: () => import('@/views/VoteListView.vue') // Temporary placeholder
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('@/views/VoteListView.vue') // Temporary placeholder
      },
      {
        path: 'team',
        name: 'Team',
        component: () => import('@/views/VoteListView.vue') // Temporary placeholder
      },
      // Previous Vote routes mapped to sub-paths if needed, or repurposed
      {
        path: 'votes',
        name: 'VoteList',
        component: () => import('@/views/VoteListView.vue')
      },
      {
        path: 'votes/create',
        name: 'VoteCreate',
        component: () => import('@/views/VoteCreateView.vue')
      },
      {
        path: 'votes/:id',
        name: 'VoteDetail',
        component: () => import('@/views/VoteDetailView.vue')
      },
      {
        path: 'votes/:id/result',
        name: 'VoteResult',
        component: () => import('@/views/VoteResultView.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('accessToken')

  // Temorarily allow access for development
  if (to.meta.requiresAuth && !token) {
    // next('/login')
    next() // Bypass auth check
  } else if ((to.name === 'Login' || to.name === 'Signup') && token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
