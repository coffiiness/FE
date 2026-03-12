<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const sidebarOpen = ref(true)

const { user, logout } = useAuth()
const userName = computed(() => user.value?.name || '관리자')
const userInitial = computed(() => userName.value.charAt(0))

const navigation = [
  { section: 'OVERVIEW' },
  { name: '대시보드', href: '/admin/dashboard', icon: 'dashboard' },

  { section: 'FI · 재무회계' },
  { name: '구독 관리', href: '/admin/subscriptions', icon: 'subscription' },
  { name: '매출 / 인보이스', href: '/admin/invoices', icon: 'invoice' },

  { section: 'CO · 관리회계' },
  { name: '비용 관리', href: '/admin/costs', icon: 'cost' },
  { name: '손익 리포트', href: '/admin/pnl', icon: 'pnl' }
]

const isActive = (href) => route.path === href

const currentTitle = computed(() => {
  const item = navigation.find(n => n.href && route.path.startsWith(n.href))
  return item?.name ?? '대시보드'
})

const currentMonth = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}년 ${now.getMonth() + 1}월`
})
</script>

<template>
  <div class="flex h-screen bg-slate-50 font-sans">
    <!-- Sidebar -->
    <aside
      :class="[
        'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white transition-all duration-300 flex flex-col shadow-xl z-20',
        sidebarOpen ? 'w-60' : 'w-20'
      ]"
    >
      <!-- Brand -->
      <div class="flex items-center h-20 px-5 border-b border-slate-700/50">
        <div class="h-9 w-9 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0">
          C
        </div>
        <div v-if="sidebarOpen" class="ml-3">
          <h1 class="text-lg font-bold tracking-tight text-white leading-tight">Coffiness</h1>
          <p class="text-[11px] text-slate-400 leading-tight">Admin Console</p>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <template v-for="item in navigation" :key="item.section || item.name">
          <!-- Section label -->
          <p
            v-if="item.section"
            class="px-3 pt-4 pb-1 text-[10px] font-semibold tracking-widest text-slate-500 uppercase"
            :class="{ 'hidden': !sidebarOpen }"
          >
            {{ item.section }}
          </p>

          <!-- Nav item -->
          <router-link
            v-else
            :to="item.href"
            class="flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group relative"
            :class="
              isActive(item.href)
                ? 'bg-brand-500/20 text-brand-300'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            "
          >
            <div
              v-if="isActive(item.href)"
              class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-brand-400 rounded-r"
            />

            <!-- Icons -->
            <svg
              v-if="item.icon === 'dashboard'"
              class="w-5 h-5 shrink-0"
              :class="isActive(item.href) ? 'text-brand-400' : 'text-slate-400 group-hover:text-white'"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>

            <svg
              v-else-if="item.icon === 'subscription'"
              class="w-5 h-5 shrink-0"
              :class="isActive(item.href) ? 'text-brand-400' : 'text-slate-400 group-hover:text-white'"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>

            <svg
              v-else-if="item.icon === 'invoice'"
              class="w-5 h-5 shrink-0"
              :class="isActive(item.href) ? 'text-brand-400' : 'text-slate-400 group-hover:text-white'"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>

            <svg
              v-else-if="item.icon === 'cost'"
              class="w-5 h-5 shrink-0"
              :class="isActive(item.href) ? 'text-brand-400' : 'text-slate-400 group-hover:text-white'"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>

            <svg
              v-else-if="item.icon === 'pnl'"
              class="w-5 h-5 shrink-0"
              :class="isActive(item.href) ? 'text-brand-400' : 'text-slate-400 group-hover:text-white'"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>

            <span v-if="sidebarOpen" class="ml-3 text-sm font-medium whitespace-nowrap">{{ item.name }}</span>
          </router-link>
        </template>
      </nav>

      <!-- User -->
      <div class="border-t border-slate-700/50 p-4 bg-slate-900/50">
        <div class="flex items-center">
          <div class="h-9 w-9 bg-brand-600 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
            {{ userInitial }}
          </div>
          <div v-if="sidebarOpen" class="ml-3">
            <p class="text-sm font-medium text-white">{{ userName }}</p>
            <p class="text-xs text-slate-400">시스템 관리자</p>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main -->
    <main class="flex-1 overflow-auto bg-slate-50">
      <header class="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
        <h2 class="text-xl font-bold text-gray-800">{{ currentTitle }}</h2>
        <div class="flex items-center space-x-3">
          <span class="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600">
            <svg class="w-4 h-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {{ currentMonth }}
          </span>

          <button
            type="button"
            @click="logout"
            class="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </header>

      <div class="p-8">
        <router-view />
      </div>
    </main>
  </div>
</template>
