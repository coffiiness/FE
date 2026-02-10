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
        redirect: '/recruitment/home',
        children: [
          {
            path: 'home',
            name: 'RecruitmentHome',
            component: () => import('@/views/RecruitmentView.vue')
          },
          {
            path: 'create',
            name: 'RecruitmentCreate',
            component: () => import('@/views/RecruitmentCreateView.vue')
          },
          {
            path: 'jobs/:id',
            name: 'RecruitmentDetail',
            component: () => import('@/views/RecruitmentDetailView.vue')
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