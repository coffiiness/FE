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
          component: () => import('@/views/NotificationView.vue'), // 파일명 확인!
          meta: { title: '알림 센터' }
        },
        {
          path: 'schedule',
          name: 'Schedule',
          component: () => import('@/views/MyScheduleView.vue'),
          meta: { title: '내 일정 캘린더' }
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
        },
      ]
    }
  ]

  const router = createRouter({
    history: createWebHistory(),
    routes
  })

  router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('accessToken')

    // 1. 인증이 필요한 페이지인데 토큰이 없는 경우
    if (to.meta.requiresAuth && !token) {
      // 개발 중이라도 로그인을 봐야 한다면: next('/login')
      // 무조건 통과시키려면: next()
      next()
    }
    // 2. 이미 로그인했는데 로그인/회원가입 페이지로 가려는 경우
    else if ((to.name === 'Login' || to.name === 'Signup') && token) {
      next('/dashboard') // 다시 대시보드로 보내기 (주석 해제 추천)
    }
    else {
      next()
    }
  })

  export default router
