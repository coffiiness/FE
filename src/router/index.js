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
    path: '/workspace',
    name: 'Workspace',
    component: () => import('@/views/WorkspaceView.vue')
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
        path: 'notification',
        name: 'Notification',
        component: () => import('@/views/NotificationView.vue'),
        meta: { title: '알림 센터' }
      },
      {
        path: 'schedule',
        name: 'Schedule',
        component: () => import('@/views/MyScheduleView.vue'),
        meta: { title: '내 일정 캘린더' }
      },

      // --- 채용 관리 ---
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
        path: 'recruitment/jobs/:id/edit',
        name: 'RecruitmentEdit',
        component: () => import('@/views/RecruitmentEditView.vue')
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
        path: 'recruitments/:recruitmentId/schedule/create',
        name: 'InterviewScheduleCreate',
        component: () => import('@/views/interview/InterviewScheduleCreateView.vue'),
        meta: { requiresAuth: true }
      },

      // --- 회의실 관리 ---
      {
        path: 'meeting-rooms',
        name: 'MeetingRooms',
        component: () => import('@/views/MeetingRoomsView.vue'),
        redirect: '/meeting-rooms/timeline',
        children: [
          {
            path: 'timeline',
            name: 'MeetingRoomsTimeline',
            component: () => import('@/views/meeting-rooms/TimelineView.vue'),
            meta: { title: '회의실 타임라인' }
          },
          {
            path: 'list',
            name: 'MeetingRoomsList',
            component: () => import('@/views/meeting-rooms/ListView.vue'),
            meta: { title: '회의실 목록' }
          },
          {
            path: 'calendar',
            name: 'MeetingRoomsCalendar',
            component: () => import('@/views/meeting-rooms/CalendarView.vue'),
            meta: { title: '회의실 캘린더' }
          },
          {
            path: 'manage',
            name: 'MeetingRoomsManage',
            component: () => import('@/views/meeting-rooms/ManageView.vue'),
            meta: { title: '회의실 관리' }
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
        component: () => import('@/views/TeamManagementView.vue'),
        meta: { title: '팀 멤버 관리' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Auth Guard (팀원 최신 로직 적용)
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('accessToken')

  if (to.meta.requiresAuth && !token) {
    // 개발 편의상 통과 (나중에 next('/login')으로 변경 권장)
    next()
  }
  else if ((to.name === 'Login' || to.name === 'Signup') && token) {
    next('/dashboard')
  }
  else {
    next()
  }
})

export default router