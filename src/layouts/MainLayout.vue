<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const sidebarOpen = ref(true)
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
  { section: 'GENERAL' },
  { name: '홈', href: '/dashboard', icon: 'home' },
  { name: '내 일정', href: '/schedule', icon: 'calendar' },

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
    name: '회의실 관리',
    icon: 'office',
    children: [
      { name: '타임라인', href: '/meeting-rooms/timeline' },
      { name: '회의실 목록', href: '/meeting-rooms/list' },
      { name: '캘린더', href: '/meeting-rooms/calendar' },
      { name: '관리', href: '/meeting-rooms/manage' }
    ]
  },

  { section: 'SYSTEM' },
  { name: '리포트', href: '/reports', icon: 'chart-bar' },
  { name: '팀 관리', href: '/team', icon: 'user-group' },
  { name: '요금제', href: '/billing', icon: 'credit-card' }
]

const isActive = (item) =>
    item.children
        ? item.children.some(c => route.path.startsWith(c.href))
        : route.path === item.href

const isChildActive = (href) => route.path === href

const currentTitle = computed(() => {
  if (route.meta?.title) return route.meta.title
  for (const item of navigation) {
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

watch(
    () => route.path,
    (path) => {
      if (path.startsWith('/recruitment/')) {
        if (!openMenus.value.includes('채용 관리')) openMenus.value.push('채용 관리')
      }
      if (path.startsWith('/meeting-rooms/')) {
        if (!openMenus.value.includes('회의실 관리')) openMenus.value.push('회의실 관리')
      }
    }
)
</script>

<template>
  <div class="flex h-screen bg-slate-50 font-sans overflow-hidden">
    <aside
        :class="[
        'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white transition-all duration-300 flex flex-col shadow-xl z-20',
        sidebarOpen ? 'w-64' : 'w-20'
      ]"
    >
      <div class="flex items-center h-20 px-6 border-b border-slate-700/50 shrink-0">
        <div class="h-9 w-9 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg shadow-brand-500/20">
          C
        </div>
        <div v-if="sidebarOpen" class="ml-3 transition-opacity duration-300">
          <h1 class="text-lg font-bold tracking-tight text-white leading-tight">CalFit</h1>
          <p class="text-[10px] text-brand-400 font-bold uppercase tracking-wider">Management</p>
        </div>
      </div>

      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        <template v-for="item in navigation" :key="item.section || item.name">
          <p
              v-if="item.section"
              class="px-3 pt-5 pb-2 text-[10px] font-bold tracking-widest text-slate-500 uppercase"
              :class="{ 'hidden': !sidebarOpen }"
          >
            {{ item.section }}
          </p>

          <router-link
              v-else-if="!item.children"
              :to="item.href"
              class="flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group relative"
              :class="isActive(item) ? 'bg-brand-500/20 text-brand-300' : 'text-slate-300 hover:bg-slate-800 hover:text-white'"
          >
            <div v-if="isActive(item)" class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-brand-400 rounded-r"></div>

            <component :is="item.icon" class="w-5 h-5 shrink-0" :class="isActive(item) ? 'text-brand-400' : 'text-slate-400 group-hover:text-white'" />

            <svg v-if="item.icon === 'home'" class="w-5 h-5 shrink-0" :class="isActive(item) ? 'text-brand-400' : 'text-slate-400 group-hover:text-white'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <svg v-else-if="item.icon === 'calendar'" class="w-5 h-5 shrink-0" :class="isActive(item) ? 'text-brand-400' : 'text-slate-400 group-hover:text-white'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <svg v-else-if="item.icon === 'chart-bar'" class="w-5 h-5 shrink-0" :class="isActive(item) ? 'text-brand-400' : 'text-slate-400 group-hover:text-white'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <svg v-else-if="item.icon === 'user-group'" class="w-5 h-5 shrink-0" :class="isActive(item) ? 'text-brand-400' : 'text-slate-400 group-hover:text-white'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <svg v-else-if="item.icon === 'credit-card'" class="w-5 h-5 shrink-0" :class="isActive(item) ? 'text-brand-400' : 'text-slate-400 group-hover:text-white'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>

            <span v-if="sidebarOpen" class="ml-3 text-sm font-medium whitespace-nowrap">{{ item.name }}</span>
          </router-link>

          <div v-else class="space-y-1">
            <button
                @click="toggleSubMenu(item.name)"
                class="flex items-center w-full px-3 py-2.5 rounded-lg transition-all duration-200 group text-slate-300 hover:bg-slate-800 hover:text-white"
                :class="isActive(item) ? 'text-brand-300' : ''"
            >
              <svg v-if="item.icon === 'users'" class="w-5 h-5 shrink-0" :class="openMenus.includes(item.name) ? 'text-brand-400' : 'text-slate-400 group-hover:text-white'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <svg v-else-if="item.icon === 'office'" class="w-5 h-5 shrink-0" :class="openMenus.includes(item.name) ? 'text-brand-400' : 'text-slate-400 group-hover:text-white'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>

              <span v-if="sidebarOpen" class="ml-3 text-sm font-medium whitespace-nowrap flex-1 text-left">{{ item.name }}</span>
              <svg v-if="sidebarOpen" class="w-4 h-4 transition-transform duration-200" :class="openMenus.includes(item.name) ? 'rotate-180' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div v-if="sidebarOpen && openMenus.includes(item.name)" class="pl-10 space-y-1">
              <router-link
                  v-for="child in item.children"
                  :key="child.href"
                  :to="child.href"
                  class="block px-3 py-2 rounded-lg text-sm transition-all duration-200"
                  :class="isChildActive(child.href) ? 'text-brand-300 bg-slate-800/60' : 'text-slate-400 hover:text-white hover:bg-slate-800/30'"
              >
                {{ child.name }}
              </router-link>
            </div>
          </div>
        </template>
      </nav>

      <div class="border-t border-slate-700/50 p-4 bg-slate-900/50">
        <div class="flex items-center">
          <div class="h-9 w-9 bg-brand-600 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ring-2 ring-slate-800">
            K
          </div>
          <div v-if="sidebarOpen" class="ml-3 transition-opacity duration-300">
            <p class="text-sm font-medium text-white">김천수</p>
            <p class="text-[11px] text-slate-400 font-medium">채용담당자</p>
          </div>
        </div>
      </div>
    </aside>

    <main class="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden">
      <header class="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 sticky top-0 z-10 shrink-0">
        <div class="flex items-center gap-4">
          <button @click="sidebarOpen = !sidebarOpen" class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
          <h2 class="text-lg font-bold text-slate-800 tracking-tight">{{ currentTitle }}</h2>
        </div>

        <div class="flex items-center space-x-3">
          <div class="hidden sm:flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
            <svg class="w-4 h-4 mr-1.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {{ currentMonth }}
          </div>

          <button class="relative p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full border-2 border-white"></span>
          </button>
        </div>
      </header>

      <div class="flex-1 overflow-auto custom-scrollbar">
        <div class="p-8 max-w-[1600px] mx-auto">
          <router-view />
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Sidebar item active effect */
.router-link-active {
  color: #5eead4 !important; /* brand-300 */
}
</style>