<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const sidebarOpen = ref(true)
// 초기값으로 열려있을 메뉴 설정
const openMenus = ref(['채용 관리', '회의실 관리'])

const toggleSubMenu = (name) => {
  if (!sidebarOpen.value) {
    sidebarOpen.value = true
    if (!openMenus.value.includes(name)) openMenus.value.push(name)
    return
  }
  openMenus.value.includes(name)
      ? openMenus.value = openMenus.value.filter(i => i !== name)
      : openMenus.value.push(name)
}

const navigation = [
  { name: '홈', href: '/dashboard', icon: 'home' },
  { name: '내 일정', href: '/schedule', icon: 'calendar' },
  {
    name: '채용 관리',
    icon: 'users',
    children: [
      { name: '채용 홈', href: '/recruitment/home' },
      { name: '지원자 관리', href: '/recruitment/applicants' },
      { name: '지원서 템플릿', href: '/recruitment/templates' }
    ]
  },
  {
    name: '회의실 관리',
    icon: 'office',
    children: [
      { name: '타임라인', href: '/meeting-rooms/timeline' },
      { name: '회의실 목록', href: '/meeting-rooms/list' },
      { name: '캘린더', href: '/meeting-rooms/calendar' },
      { name: '관리', href: '/meeting-rooms/manage' }
    ]
  },
  { name: '리포트', href: '/reports', icon: 'chart-bar' },
  { name: '팀 관리', href: '/team', icon: 'user-group' }
]

// 메뉴 활성화 여부 판단 (부모/자식 공통)
const isActive = (item) =>
    item.children
        ? item.children.some(c => route.path === c.href || route.path.startsWith(c.href + '/'))
        : route.path === item.href || route.path.startsWith(item.href + '/')

const isChildActive = (href) => route.path === href

// 헤더에 표시될 현재 페이지 제목
const currentTitle = computed(() => {
  if (route.meta?.title) return route.meta.title
  if (route.path === '/notifications') return '알림 센터'

  for (const item of navigation) {
    if (item.children) {
      const child = item.children.find(c => route.path.startsWith(c.href))
      if (child) return child.name
    }
    if (item.href && route.path.startsWith(item.href)) return item.name
  }
  return '대시보드'
})

// 경로 변경 시 해당 메뉴 자동 열기
watch(
    () => route.path,
    (path) => {
      if (path.startsWith('/recruitment/')) {
        if (!openMenus.value.includes('채용 관리')) openMenus.value.push('채용 관리')
      }
      if (path.startsWith('/meeting-rooms/')) {
        if (!openMenus.value.includes('회의실 관리')) openMenus.value.push('회의실 관리')
      }
    },
    { immediate: true }
)
</script>

<template>
  <div class="flex h-screen bg-slate-50 font-sans text-slate-900">
    <aside
        :class="[
        'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white transition-all duration-300 flex flex-col shadow-xl z-20',
        sidebarOpen ? 'w-64' : 'w-20'
      ]"
    >
      <div class="flex items-center justify-center h-20 border-b border-slate-700/50 overflow-hidden">
        <h1 v-if="sidebarOpen" class="text-2xl font-bold tracking-tight text-white flex items-center whitespace-nowrap">
          <span class="text-brand-400 mr-1">Cal</span>Fit
        </h1>
        <span v-else class="text-2xl font-bold text-brand-400">C</span>
      </div>

      <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
        <template v-for="item in navigation" :key="item.name">
          <router-link
              v-if="!item.children"
              :to="item.href"
              :title="!sidebarOpen ? item.name : ''"
              class="flex items-center px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden"
              :class="isActive(item) ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'"
          >
            <div v-if="isActive(item)" class="absolute left-0 top-0 bottom-0 w-1 bg-brand-500 rounded-l"></div>

            <component
                :is="item.icon === 'home' ? 'HomeIcon' : item.icon === 'calendar' ? 'CalendarIcon' : 'ChartBarIcon'"
                class="w-6 h-6 mr-3"
            />
            <svg v-if="item.icon === 'home'" class="w-6 h-6 mr-3 shrink-0" :class="isActive(item) ? 'text-brand-400' : 'group-hover:text-white'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <svg v-else-if="item.icon === 'calendar'" class="w-6 h-6 mr-3 shrink-0" :class="isActive(item) ? 'text-brand-400' : 'group-hover:text-white'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <svg v-else-if="item.icon === 'chart-bar'" class="w-6 h-6 mr-3 shrink-0" :class="isActive(item) ? 'text-brand-400' : 'group-hover:text-white'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <svg v-else-if="item.icon === 'user-group'" class="w-6 h-6 mr-3 shrink-0" :class="isActive(item) ? 'text-brand-400' : 'group-hover:text-white'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>

            <span v-if="sidebarOpen" class="font-medium whitespace-nowrap">{{ item.name }}</span>
          </router-link>

          <div v-else class="space-y-1">
            <button
                @click="toggleSubMenu(item.name)"
                :title="!sidebarOpen ? item.name : ''"
                class="flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200 group text-slate-300 hover:bg-slate-800 hover:text-white"
                :class="isActive(item) ? 'text-brand-300 bg-slate-800/30' : ''"
            >
              <svg v-if="item.icon === 'users'" class="w-6 h-6 mr-3 shrink-0" :class="isActive(item) || openMenus.includes(item.name) ? 'text-brand-400' : 'group-hover:text-white'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <svg v-else-if="item.icon === 'office'" class="w-6 h-6 mr-3 shrink-0" :class="isActive(item) || openMenus.includes(item.name) ? 'text-brand-400' : 'group-hover:text-white'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>

              <span v-if="sidebarOpen" class="font-medium whitespace-nowrap flex-1 text-left">{{ item.name }}</span>
              <svg v-if="sidebarOpen" class="w-4 h-4 transition-transform duration-200" :class="openMenus.includes(item.name) ? 'rotate-180' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div v-if="sidebarOpen && openMenus.includes(item.name)" class="pl-12 pr-2 space-y-1">
              <router-link
                  v-for="child in item.children"
                  :key="child.href"
                  :to="child.href"
                  class="block px-3 py-2 rounded-lg text-sm transition-colors"
                  :class="isChildActive(child.href) ? 'text-brand-400 bg-slate-800/50 font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800/30'"
              >
                {{ child.name }}
              </router-link>
            </div>
          </div>
        </template>
      </nav>

      <div class="border-t border-slate-700/50 p-4 bg-slate-900/50">
        <div class="flex items-center">
          <div class="h-10 w-10 bg-gradient-to-br from-brand-400 to-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-slate-700 shrink-0">
            K
          </div>
          <div v-if="sidebarOpen" class="ml-3 overflow-hidden">
            <p class="text-sm font-medium text-white truncate">김천수</p>
            <p class="text-xs text-brand-200 truncate">채용담당자</p>
          </div>
        </div>
      </div>
    </aside>

    <main class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <header class="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm shrink-0">
        <div class="flex items-center">
          <button
              @click="sidebarOpen = !sidebarOpen"
              class="mr-4 p-2 text-gray-400 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Toggle Sidebar"
          >
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h2 class="text-xl font-bold text-gray-800 truncate">{{ currentTitle }}</h2>
        </div>

        <div class="flex items-center space-x-3">
          <router-link
              to="/notifications"
              title="알림 센터"
              class="text-gray-500 hover:text-brand-600 transition-colors p-2 rounded-full hover:bg-slate-100 relative"
          >
            <span class="sr-only">알림</span>
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span class="absolute top-2 right-2 flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
          </router-link>

          <div class="h-6 w-px bg-gray-200 mx-2"></div>

          <button class="text-gray-500 hover:text-brand-600 p-2 rounded-full hover:bg-slate-100">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      <div class="flex-1 overflow-auto p-8 custom-scrollbar">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* 페이지 전환 애니메이션 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 커스텀 스크롤바 (선택 사항) */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.2);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.4);
}
</style>