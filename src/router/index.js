import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/careers/:companySlug',
    name: 'CompanyCareers',
    component: () => import('@/views/CareersListView.vue')
  },
  {
    path: '/careers/:companySlug/:jobId/apply',
    name: 'Apply',
    component: () => import('@/views/CareersApplyView.vue')
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

      // 👇 [수정됨] 채용 관리 라우팅 구조 변경
      {
        path: 'recruitment',
        // 1. 부모 메뉴 클릭 시 '채용 홈'으로 리다이렉트
        redirect: '/recruitment/home',
        children: [
          {
            // 2. '채용 홈' 메뉴가 실제 대시보드(RecruitmentView)를 보여줌
            path: 'home',
            name: 'RecruitmentHome',
            component: () => import('@/views/RecruitmentView.vue')
          },
          {
            path: 'applicants',
            name: 'ApplicantList',
            component: () => import('@/views/ApplicantListView.vue')
          },
          {
            path: 'templates',
            name: 'ApplicationTemplateList',
            component: () => import('@/views/ApplicationTemplateListView.vue')
          },
          {
            path: 'templates/create',
            name: 'ApplicationTemplateCreate',
            component: () => import('@/views/ApplicationTemplateCreateView.vue')
          }
        ]
      },

      // 👇 기타 메뉴들
      {
        path: 'schedule',
        name: 'Schedule',
        component: () => import('@/views/DashboardView.vue')
      },
      {
        path: 'meeting-rooms',
        name: 'MeetingRooms',
        component: () => import('@/views/DashboardView.vue')
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('@/views/DashboardView.vue')
      },
      {
        path: 'team',
        name: 'Team',
        component: () => import('@/views/DashboardView.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// ... (Auth Guard 로직은 그대로 유지)

export default router