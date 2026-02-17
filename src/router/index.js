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
  {
    path: '/signup-success',
    name: 'SignupSuccess',
    component: () => import('@/views/SignupSuccessView.vue')
  },
  {
    path: '/workspace/create',
    name: 'WorkspaceCreate',
    component: () => import('@/views/WorkspaceView.vue')
  },
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
        component: () => import('@/views/MyScheduleView.vue')
      },
      {
        path: 'notifications',
        name: 'Notifications',
        component: () => import('@/views/NotificationView.vue')
      },
      {
        path: 'recruitment',
        redirect: '/recruitment/home'
      },

      {
        path: 'recruitment/home',
        name: 'RecruitmentHome',
        component: () => import('@/views/RecruitmentView.vue')
      },

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

      {
        path: 'recruitment/applicants',
        name: 'ApplicantList',
        component: () => import('@/views/ApplicantListView.vue')
      },

      {
        path: 'recruitment/applicants/:id',
        name: 'ApplicantDetail',
        component: () => import('@/views/ApplicantDetailView.vue')
      },
      {
            path: 'recruitment/jobs/:id/edit',
            name: 'RecruitmentEdit',
            component: () => import('@/views/RecruitmentEditView.vue')
      },
      {
        path: 'recruitment/templates',
        name: 'ApplicationTemplateList',
        component: () => import('@/views/ApplicationTemplateListView.vue')
      },

      {
        path: 'recruitment/templates/create',
        name: 'ApplicationTemplateCreate',
        component: () => import('@/views/ApplicationTemplateCreateView.vue')
      },

      {
        path: 'recruitment/templates/:id',
        name: 'ApplicationTemplateDetail',
        component: () => import('@/views/ApplicationTemplateDetailView.vue')
      },
      {
        path: 'recruitment/templates/:id/edit',
        name: 'ApplicationTemplateEdit',
        component: () => import('@/views/ApplicationTemplateCreateView.vue')
      },
      {
        path: 'billing',
        name: 'Billing',
        component: () => import('@/views/billing/BillingView.vue'),
        meta: { title: '요금제' }
      },
      {
        path: 'meeting-rooms',
        name: 'MeetingRooms',
        component: () => import('@/views/MeetingRoomsView.vue'),
        redirect: '/meeting-rooms/calendar',

        children: [

          {
            path: 'list',
            name: 'MeetingRoomsList',
            component: () => import('@/views/meeting-rooms/ListView.vue')
          },

          {
            path: 'calendar',
            name: 'MeetingRoomsCalendar',
            component: () => import('@/views/meeting-rooms/CalendarView.vue')
          },

          {
            path: 'manage',
            name: 'MeetingRoomsManage',
            component: () => import('@/views/meeting-rooms/ManageView.vue')
          }

        ]
      },

      {
        path: 'reports',
        name: 'Reports',
        component: () => import('@/views/DashboardView.vue')
      },

      {
        path: 'team',
        name: 'Team',
        component: () => import('@/views/TeamManagementView.vue')
      },

      {
        path: 'recruitment/interview/select',
        name: 'InterviewSelect',
        component: () =>
            import('@/views/interview/InterviewSelectView.vue'),
        meta: { requiresAuth: true }
      },

        {
            path: 'recruitment/interview/schedule',
            name: 'InterviewScheduleCreate',
            component: () =>
                import('@/views/interview/InterviewScheduleCreateView.vue'),
            meta: { requiresAuth: true }
        }
    ]
  },

  // ── Admin Console ──
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    redirect: '/admin/dashboard',

    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/AdminDashboardView.vue'),
        meta: { title: '대시보드' }
      },
      {
        path: 'subscriptions',
        name: 'AdminSubscriptions',
        component: () => import('@/views/admin/AdminSubscriptionView.vue'),
        meta: { title: '구독 관리' }
      },
      {
        path: 'invoices',
        name: 'AdminInvoices',
        component: () => import('@/views/admin/AdminInvoiceView.vue'),
        meta: { title: '매출 / 인보이스' }
      },
      {
        path: 'costs',
        name: 'AdminCosts',
        component: () => import('@/views/admin/AdminCostView.vue'),
        meta: { title: '비용 관리' }
      },
      {
        path: 'pnl',
        name: 'AdminPnl',
        component: () => import('@/views/admin/AdminPnlView.vue'),
        meta: { title: '손익 리포트' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// router.beforeEach((to, from, next) => {
//
//   const token = localStorage.getItem('accessToken')
//
//   if (to.meta.requiresAuth && !token) {
//     next('login')
//   }
//
//   else if (
//     (to.name === 'Login' || to.name === 'Signup') &&
//     token
//   ) {
//     next('/dashboard')
//   }
//
//   else {
//     next()
//   }
//
// })

export default router
