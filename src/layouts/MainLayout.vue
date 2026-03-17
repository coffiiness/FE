<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NotificationDropdown from '@/components/NotificationDropdown.vue'
import NotificationToast from '@/components/NotificationToast.vue'
import { useNotificationStore } from '@/stores/notification'
import { storeToRefs } from 'pinia'
import { useAuth } from '@/composables/useAuth'
import { useHrAccessGuard } from '@/composables/useHrAccessGuard'
import { workspaceApi } from '@/api/workspace'

const route = useRoute()
const router = useRouter()
const sidebarOpen = ref(true)
const openMenus = ref(['채용 관리', '회의실'])
const sidebarQuery = ref('')
const sidebarSearchInput = ref(null)

const { user, logout } = useAuth()
const {
  memberType,
  loadMemberType
} = useHrAccessGuard()

const workspaceName = ref(user.value?.workspace?.name || '')
const userName = computed(() => user.value?.name || '사용자')
const userInitial = computed(() => userName.value.charAt(0))
const userRoleLabel = computed(() => {
  if (memberType.value === 'HR') return '인사담당자'
  if (memberType.value === 'INTERVIEWER') return '면접관'
  return '멤버'
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalSidebarSearchShortcut)
})
const workspaceLabel = computed(() => workspaceName.value || '워크스페이스')

onMounted(async () => {
  try {
    await loadMemberType()
  } catch (e) {
    // 멤버 정보 조회 실패 시 기본값 유지
  }

  try {
    const response = await workspaceApi.getMyWorkspace()
    const currentWorkspace = response?.data?.data
    workspaceName.value =
      currentWorkspace?.name || workspaceName.value
  } catch (e) {
    // 워크스페이스 정보 조회 실패 시 기본값 유지
  }

  try {
    await notificationStore.initialize()
  } catch (error) {
    console.error('알림 초기화 실패:', error)
  }
  window.addEventListener('keydown', handleGlobalSidebarSearchShortcut)
})

const isNotificationOpen = ref(false)
const notificationStore = useNotificationStore()
const { unreadCount, realtimeToast } = storeToRefs(notificationStore)

const openRealtimeToastTarget = async (target) => {
  notificationStore.dismissRealtimeToast()
  await router.push(target)
}

const toggleNotification = async () => {
  isNotificationOpen.value = !isNotificationOpen.value
  notificationStore.setDropdownOpen(isNotificationOpen.value)

  if (isNotificationOpen.value) {
    try {
      await Promise.all([
        notificationStore.fetchUnreadCount(),
        notificationStore.fetchDropdownNotifications()
      ])
    } catch (error) {
      console.error('알림 드롭다운 조회 실패:', error)
    }
  }
}

const isEditableTarget = (target) => {
  if (!(target instanceof HTMLElement)) return false
  const tagName = target.tagName
  return (
    target.isContentEditable ||
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT'
  )
}

const focusSidebarSearch = async () => {
  if (!sidebarOpen.value) {
    sidebarOpen.value = true
    await nextTick()
  }

  const input = sidebarSearchInput.value
  if (!input) return
  input.focus()
  input.select()
}

const handleGlobalSidebarSearchShortcut = async (event) => {
  if (event.defaultPrevented) return
  if (event.isComposing) return
  if (event.ctrlKey || event.metaKey || event.altKey) return

  if (event.key === 'Escape') {
    const input = sidebarSearchInput.value
    if (document.activeElement === input) {
      sidebarQuery.value = ''
      input.blur()
    }
    return
  }

  if (event.key.toLowerCase() !== 'f') return
  if (isEditableTarget(event.target)) return

  event.preventDefault()
  await focusSidebarSearch()
}

const toggleSubMenu = (item) => {
  if (!sidebarOpen.value) {
    sidebarOpen.value = true
    if (!openMenus.value.includes(item.name)) openMenus.value.push(item.name)
    if (item.children?.[0]?.href) {
      router.push(item.children[0].href)
    }
    return
  }
  openMenus.value.includes(item.name)
      ? openMenus.value = openMenus.value.filter(i => i !== item.name)
      : openMenus.value.push(item.name)
}

const navigation = [
  { section: 'GENERAL' },
  { name: '홈', href: '/dashboard', icon: 'home' },
  { name: '내 일정', href: '/schedule', icon: 'calendar' },
  { name: '알림', href: '/notifications', icon: 'bell' },
  { section: 'RECRUITMENT' },
  {
    name: '채용 관리',
    icon: 'users',
    children: [
      { name: '채용 홈', href: '/recruitment/home' },
      { name: '지원자 관리', href: '/recruitment/applicants' },
      { name: '지원서 템플릿', href: '/recruitment/templates' }
    ]
  },

  { section: 'FACILITY' },
  {
    name: '회의실',
    icon: 'office',
    children: [
      { name: '회의실 스케줄', href: '/meeting-rooms/calendar' },
      { name: '회의실 예약', href: '/meeting-rooms/list' },
      { name: '회의실 관리', href: '/meeting-rooms/manage' }
    ]
  },

  { section: 'SYSTEM' },
  { name: '리포트', href: '/reports', icon: 'chart-bar' },
  { name: '팀 관리', href: '/team', icon: 'user-group' },
  { name: '요금제', href: '/billing', icon: 'credit-card' }
]

const availableNavigation = computed(() =>
  navigation
    .map((item) => {
      if (!item.children) {
        if (
          memberType.value !== 'HR' &&
          (item.href === '/reports' || item.href === '/billing')
        ) {
          return null
        }
        return item
      }

      if (item.name === '회의실') {
        const children = item.children.filter((child) => {
          if (memberType.value === 'HR') return true
          return child.href !== '/meeting-rooms/manage'
        })

        return { ...item, children }
      }

      return item
    })
    .filter(Boolean)
)

const filteredNavigation = computed(() => {
  const query = sidebarQuery.value.trim().toLowerCase()
  if (!query) {
    return availableNavigation.value
  }

  const results = []
  let pendingSection = null

  for (const item of availableNavigation.value) {
    if (item.section) {
      pendingSection = item
      continue
    }

    if (!item.children) {
      if (item.name.toLowerCase().includes(query)) {
        if (pendingSection) {
          results.push(pendingSection)
          pendingSection = null
        }
        results.push(item)
      }
      continue
    }

    const matchedChildren = item.children.filter((child) =>
      child.name.toLowerCase().includes(query)
    )

    if (item.name.toLowerCase().includes(query) || matchedChildren.length > 0) {
      if (pendingSection) {
        results.push(pendingSection)
        pendingSection = null
      }
      results.push({
        ...item,
        children: matchedChildren.length > 0 ? matchedChildren : item.children
      })
    }
  }

  return results
})

const isActive = (item) =>
    item.children
        ? item.children.some(c => route.path.startsWith(c.href))
        : route.path === item.href

const isChildActive = (href) => route.path === href

const currentTitle = computed(() => {
  if (route.meta?.title) return route.meta.title
  for (const item of availableNavigation.value) {
    if (item.children) {
      const child = item.children.find(c => route.path === c.href)
      if (child) return child.name
    }
    if (item.href && route.path === item.href) return item.name
  }
  return '대시보드'
})

const currentMonth = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}년 ${now.getMonth() + 1}월`
})

const showGlobalMonthPill = computed(() =>
  route.path !== '/schedule' && route.path !== '/dashboard'
)

watch(
    () => route.path,
    (path) => {
      if (path.startsWith('/recruitment/')) {
        if (!openMenus.value.includes('채용 관리')) openMenus.value.push('채용 관리')
      }
      if (path.startsWith('/meeting-rooms/')) {
        if (!openMenus.value.includes('회의실')) openMenus.value.push('회의실')
      }
    }
)
</script>

<template>
  <div class="flex h-screen bg-slate-50 font-sans overflow-hidden">
    <aside
        :class="[
        'bg-brand-900 border-r border-brand-950 text-slate-100 transition-all duration-300 flex flex-col z-50 shrink-0',
        sidebarOpen ? 'w-64' : 'w-[4.5rem]'
      ]"
    >
      <div class="relative border-b border-white/10 shrink-0" :class="sidebarOpen ? 'px-4 pt-4 pb-3' : 'px-3 pt-4 pb-3'">
        <button
          @click="sidebarOpen = !sidebarOpen"
          class="absolute -right-3 top-6 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-800"
          :aria-label="sidebarOpen ? '사이드바 닫기' : '사이드바 열기'"
        >
          <svg
            class="h-4 w-4 transition-transform duration-200"
            :class="sidebarOpen ? '' : 'rotate-180'"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div class="flex min-w-0" :class="sidebarOpen ? 'items-center gap-3' : 'justify-center'">
          <div
            class="rounded-2xl border border-white/15 bg-white/10 flex items-center justify-center text-white font-semibold shrink-0"
            :class="sidebarOpen ? 'h-11 w-11 text-sm' : 'h-12 w-12 text-base shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'"
          >
            {{ userInitial }}
          </div>
          <div v-if="sidebarOpen" class="min-w-0 flex-1">
            <div class="flex items-center gap-2 min-w-0">
              <div class="group relative min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-white">{{ workspaceLabel }}</p>
                <div class="pointer-events-none absolute left-0 top-full z-20 mt-2 w-max max-w-56 rounded-lg border border-white/10 bg-slate-950/95 px-3 py-2 text-xs font-medium leading-5 text-white opacity-0 shadow-lg shadow-slate-950/20 transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
                  {{ workspaceLabel }}
                </div>
              </div>
              <span class="shrink-0 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-brand-100">
                {{ userRoleLabel }}
              </span>
            </div>
            <div class="group relative mt-1">
              <p class="truncate text-[12px] text-slate-300/90">{{ userName }}</p>
              <div class="pointer-events-none absolute left-0 top-full z-20 mt-2 w-max max-w-56 rounded-lg border border-white/10 bg-slate-950/95 px-3 py-2 text-xs font-medium leading-5 text-white opacity-0 shadow-lg shadow-slate-950/20 transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
                {{ userName }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="sidebarOpen" class="mt-4 relative">
          <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-100/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
          </svg>
          <input
            ref="sidebarSearchInput"
            v-model="sidebarQuery"
            type="text"
            placeholder="메뉴 찾기"
            class="w-full rounded-xl border border-white/10 bg-white/10 py-2.5 pl-10 pr-12 text-sm text-white placeholder:text-slate-300 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-300/20"
          />
          <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-white/10 bg-white/10 px-2 py-0.5 text-[11px] font-medium text-brand-100">F</span>
        </div>
      </div>

      <nav class="flex-1 px-3 pt-3 pb-3 space-y-1.5 overflow-y-auto custom-scrollbar">
        <template v-for="(item, index) in filteredNavigation" :key="item.section || item.name">
          <template v-if="item.section">
            <div
                v-if="index !== 0"
                class="px-2 py-2"
                :class="{ 'hidden': !sidebarOpen }"
            >
              <div class="border-t border-white/10"></div>
            </div>
          </template>

          <router-link
              v-else-if="!item.children"
              :to="item.href"
              class="group relative flex items-center rounded-xl border transition-colors duration-150"
              :title="sidebarOpen ? undefined : item.name"
              :class="[
                sidebarOpen ? 'gap-3 px-3 py-2.5' : 'justify-center px-0 py-3',
                isActive(item) ? 'bg-white/12 border-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]' : 'border-transparent text-slate-300/80 hover:bg-white/8 hover:border-white/10 hover:text-white'
              ]"
          >
            <svg v-if="item.icon === 'home'" class="w-5 h-5 shrink-0" :class="isActive(item) ? 'text-brand-100' : 'text-white/60 group-hover:text-white'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>

            <svg v-else-if="item.icon === 'calendar'" class="w-5 h-5 shrink-0" :class="isActive(item) ? 'text-brand-100' : 'text-white/60 group-hover:text-white'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>

            <svg v-else-if="item.icon === 'bell'" class="w-5 h-5 shrink-0" :class="isActive(item) ? 'text-brand-100' : 'text-white/60 group-hover:text-white'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>

            <svg v-else-if="item.icon === 'chart-bar'" class="w-5 h-5 shrink-0" :class="isActive(item) ? 'text-brand-100' : 'text-white/60 group-hover:text-white'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <svg v-else-if="item.icon === 'user-group'" class="w-5 h-5 shrink-0" :class="isActive(item) ? 'text-brand-100' : 'text-white/60 group-hover:text-white'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <svg v-else-if="item.icon === 'credit-card'" class="w-5 h-5 shrink-0" :class="isActive(item) ? 'text-brand-100' : 'text-white/60 group-hover:text-white'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>

            <span v-if="sidebarOpen" class="text-[15px] font-medium whitespace-nowrap" :class="isActive(item) ? 'text-white' : 'text-slate-300/80 group-hover:text-white'">{{ item.name }}</span>
          </router-link>

          <div v-else class="space-y-1">
            <button
                @click="toggleSubMenu(item)"
                class="group flex w-full items-center rounded-xl border transition-colors duration-150"
                :title="sidebarOpen ? undefined : item.name"
                :class="[
                  sidebarOpen ? 'gap-3 px-3 py-2.5' : 'justify-center px-0 py-3',
                  isActive(item) ? 'bg-white/12 border-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]' : 'border-transparent text-slate-300/80 hover:bg-white/8 hover:border-white/10 hover:text-white'
                ]"
            >
              <svg v-if="item.icon === 'users'" class="w-5 h-5 shrink-0" :class="isActive(item) ? 'text-brand-100' : 'text-white/60 group-hover:text-white'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <svg v-else-if="item.icon === 'office'" class="w-5 h-5 shrink-0" :class="isActive(item) ? 'text-brand-100' : 'text-white/60 group-hover:text-white'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>

              <span v-if="sidebarOpen" class="text-[15px] font-medium whitespace-nowrap flex-1 text-left" :class="isActive(item) ? 'text-white' : 'text-slate-300/80 group-hover:text-white'">{{ item.name }}</span>
              <svg
                v-if="sidebarOpen"
                class="w-4 h-4 transition-transform duration-200"
                :class="[
                  isActive(item) ? 'text-brand-100' : 'text-white/50',
                  (openMenus.includes(item.name) || sidebarQuery.trim()) ? 'rotate-180' : ''
                ]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div v-if="sidebarOpen && (openMenus.includes(item.name) || sidebarQuery.trim())" class="pl-11 space-y-1.5 pt-1">
              <router-link
                  v-for="child in item.children"
                  :key="child.href"
                  :to="child.href"
                  class="block px-3 py-2 rounded-lg text-[13px] transition-colors duration-150 border"
                  :class="isChildActive(child.href) ? 'text-white bg-white/12 border-white/10 font-semibold' : 'text-slate-400/90 border-transparent hover:text-white hover:bg-white/8 hover:border-white/10'"
              >
                {{ child.name }}
              </router-link>
            </div>
          </div>
        </template>

        <div
          v-if="sidebarOpen && filteredNavigation.filter((item) => !item.section).length === 0"
          class="px-3 py-10 text-center text-sm text-slate-300"
        >
          일치하는 메뉴가 없습니다.
        </div>
      </nav>
    </aside>

    <main class="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden">
      <header class="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 sticky top-0 z-50 shrink-0">

        <div class="flex items-center gap-4">
          <h2 class="text-lg font-bold text-slate-800 tracking-tight">{{ currentTitle }}</h2>
        </div>

        <div class="flex items-center space-x-3">
          <div
            v-if="showGlobalMonthPill"
            class="hidden sm:flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-600"
          >
            <svg class="w-4 h-4 mr-1.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {{ currentMonth }}
          </div>

          <button
              type="button"
              @click="logout"
              class="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            로그아웃
          </button>

          <div class="relative flex items-center">
            <button
                @click="toggleNotification"
                class="relative p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors focus:outline-none"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span
                v-if="unreadCount > 0"
                class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-brand-500 text-white text-[10px] leading-[18px] rounded-full border-2 border-white text-center font-bold"
              >
                {{ unreadCount > 99 ? '99+' : unreadCount }}
              </span>
            </button>

            <NotificationDropdown
                v-if="isNotificationOpen"
                @close="isNotificationOpen = false"
            />
          </div>
        </div>
      </header>

      <div class="flex-1 overflow-auto custom-scrollbar">
        <div class="p-8 max-w-[1600px] mx-auto">
          <router-view />
        </div>
      </div>

      <div
        v-if="realtimeToast && route.path !== '/notifications'"
        class="pointer-events-none fixed right-8 top-20 z-[70]"
      >
        <NotificationToast
          :item="realtimeToast"
          @close="notificationStore.dismissRealtimeToast()"
          @open="openRealtimeToastTarget"
        />
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Hide scrollbar for Chrome, Safari and Opera */
.custom-scrollbar::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.custom-scrollbar {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
</style>
