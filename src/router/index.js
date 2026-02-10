import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue') // 파일이 있어야 함
  },
  {
    path: '/signup',
    name: 'Signup',
    component: () => import('@/views/SignupView.vue') // 파일이 있어야 함
  },
  // Authenticated Routes
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'), // 파일이 있어야 함
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/DashboardView.vue') // 파일이 있어야 함
      },
      // 👇 아직 안 만든 페이지들은 일단 DashboardView나 ScheduleView로 연결
      {
        path: 'schedule',
        name: 'Schedule',
        component: () => import('@/views/DashboardView.vue') // 임시 연결
      },
      {
        path: 'recruitment',
        name: 'Recruitment',
        component: () => import('@/views/DashboardView.vue') // 임시 연결
      },
      {
        path: 'meeting-rooms',
        name: 'MeetingRooms',
        component: () => import('@/views/DashboardView.vue') // 임시 연결
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('@/views/DashboardView.vue') // 임시 연결
      },
      {
        path: 'team',
        name: 'Team',
        component: () => import('@/views/DashboardView.vue') // 임시 연결
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

  // 개발 중 편의를 위해 인증 체크 일단 통과 (나중에 주석 해제)
  if (to.meta.requiresAuth && !token) {
    next()
  } else if ((to.name === 'Login' || to.name === 'Signup') && token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router