<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const sidebarOpen = ref(true)
const openMenus = ref(['채용 관리'])

const toggleSubMenu = (name) => {
  openMenus.value.includes(name)
      ? openMenus.value = openMenus.value.filter(i => i !== name)
      : openMenus.value.push(name)
}

const navigation = [
  { name: '홈', href: '/dashboard' },
  { name: '내 일정', href: '/schedule' },
  {
    name: '채용 관리',
    children: [
      { name: '채용 홈', href: '/recruitment/home' },
      { name: '지원자 관리', href: '/recruitment/applicants' },
      { name: '지원서 템플릿', href: '/recruitment/templates' }
    ]
  },
  { name: '회의실', href: '/meeting-rooms' },
  { name: '리포트', href: '/reports' },
  { name: '팀 관리', href: '/team' }
]

const isActive = (item) =>
    item.children
        ? item.children.some(c => route.path.startsWith(c.href))
        : route.path.startsWith(item.href)

const isChildActive = (href) => route.path.startsWith(href)

const currentPageTitle = computed(() => {
  for (const item of navigation) {
    if (item.children) {
      const child = item.children.find(c => route.path.startsWith(c.href))
      if (child) return child.name
    }
    if (item.href && route.path.startsWith(item.href)) return item.name
  }
  return '대시보드'
})
</script>

<template>
  <div class="flex h-screen bg-slate-50 font-sans">
    <!-- Sidebar -->
    <aside :class="['bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white transition-all duration-300 flex flex-col shadow-xl', sidebarOpen ? 'w-64' : 'w-20']">

      <div class="flex items-center justify-center h-20 border-b border-slate-700/50">
        <h1 v-if="sidebarOpen" class="text-2xl font-bold">
          <span class="text-brand-400 mr-1">Cal</span>Fit
        </h1>
        <span v-else class="text-2xl font-bold text-brand-400">C</span>
      </div>

      <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <div v-for="item in navigation" :key="item.name">

          <!-- 일반 메뉴 -->
          <router-link
              v-if="!item.children"
              :to="item.href"
              class="flex items-center px-4 py-3 rounded-xl transition-all"
              :class="isActive(item)
              ? 'bg-brand-600/20 text-brand-300'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'"
          >
            <span v-if="sidebarOpen">{{ item.name }}</span>
          </router-link>

          <!-- 하위 메뉴 -->
          <div v-else>
            <button
                @click="toggleSubMenu(item.name)"
                class="w-full flex items-center px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white"
                :class="isActive(item) ? 'text-brand-300' : ''"
            >
              <span v-if="sidebarOpen" class="flex-1 text-left">{{ item.name }}</span>
            </button>

            <div v-if="sidebarOpen && openMenus.includes(item.name)" class="mt-1 space-y-1">
              <router-link
                  v-for="child in item.children"
                  :key="child.name"
                  :to="child.href"
                  class="block pl-10 pr-4 py-2 text-sm rounded-lg transition-colors"
                  :class="isChildActive(child.href)
                  ? 'text-brand-400 bg-slate-800/50'
                  : 'text-slate-500 hover:text-white hover:bg-slate-800/30'"
              >
                {{ child.name }}
              </router-link>
            </div>
          </div>

        </div>
      </nav>

      <div class="border-t border-slate-700/50 p-4">
        <div class="flex items-center">
          <div class="h-10 w-10 bg-brand-500 rounded-full flex items-center justify-center text-white font-bold">
            K
          </div>
          <div v-if="sidebarOpen" class="ml-3">
            <p class="text-sm font-medium">김철수</p>
            <p class="text-xs text-brand-200">채용담당자</p>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main -->
    <main class="flex-1 overflow-auto bg-slate-50">
      <header class="bg-white border-b h-16 flex items-center px-8 shadow-sm">
        <h2 class="text-xl font-bold text-gray-800">
          {{ currentPageTitle }}
        </h2>
      </header>

      <div class="p-8">
        <router-view />
      </div>
    </main>
  </div>
</template>
