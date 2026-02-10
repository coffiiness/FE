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

      {
        path: 'recruitment',
        redirect: '/recruitment/home'
      },
      // 2. 채용 홈 (대시보드)
      {
        path: 'recruitment/home',
        name: 'RecruitmentHome',
        component: () => import('@/views/RecruitmentView.vue')
      },
      // 3. 새 공고 만들기 (이제 작동합니다!)
      {
        path: 'recruitment/create',
        name: 'RecruitmentCreate',
        component: () => import('@/views/RecruitmentCreateView.vue')
      },
      {
        path: 'recruitment/jobs/:id',
        name: 'RecruitmentDetail',
        component: () => import('@/views/RecruitmentDetailView.vue')
      },
      // 4. 지원자 목록
      {
        path: 'recruitment/applicants',
        name: 'ApplicantList',
        component: () => import('@/views/ApplicantListView.vue')
      },
      // 5. 지원자 상세
      {
        path: 'recruitment/applicants/:id',
        name: 'ApplicantDetail',
        component: () => import('@/views/ApplicantDetailView.vue')
      },
      // 5. 지원서 템플릿 목록
      {
        path: 'recruitment/templates',
        name: 'ApplicationTemplateList',
        component: () => import('@/views/ApplicationTemplateListView.vue')
      },
      // 6. 지원서 템플릿 생성
      {
        path: 'recruitment/templates/create',
        name: 'ApplicationTemplateCreate',
        component: () => import('@/views/ApplicationTemplateCreateView.vue')
      },
      // 8. 지원서 템플릿 상세
      {
        path: 'recruitment/templates/:id',
        name: 'ApplicationTemplateDetail',
        component: () => import('@/views/ApplicationTemplateDetailView.vue')
      },
      // 9. 지원서 템플릿 수정
      {
        path: 'recruitment/templates/:id/edit',
        name: 'ApplicationTemplateEdit',
        component: () => import('@/views/ApplicationTemplateCreateView.vue')
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

// Auth Guard 로직
// router.beforeEach((to, from, next) => {
//   const token = localStorage.getItem('accessToken')
//   const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

//   if (requiresAuth && !token) {
//     next('/login')
//   } else if ((to.name === 'Login' || to.name === 'Signup') && token) {
//     next('/dashboard')
//   } else {
//     next()
//   }
// })

export default router