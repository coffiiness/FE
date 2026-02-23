<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { workspaceApi } from '@/api/workspace'

const router = useRouter()

const teamName = ref('')
const contact = ref('')
const employeeCount = ref('1 ~ 10명')
const role = ref('인사 담당자')

const error = ref('')
const loading = ref(false)

const handleStart = async () => {
  error.value = ''
  loading.value = true

  try {
    await workspaceApi.createWorkspace({
      name: teamName.value,
      contactPhone: contact.value,
      employeeScale: employeeCount.value
    })
    router.push({ name: 'Dashboard' })
  } catch (e) {
    error.value = e.response?.data?.error?.message || '워크스페이스 생성에 실패했습니다.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen bg-white">
    <!-- Left Section: Stylish Background & Branding -->
    <div class="hidden lg:flex lg:w-1/2 bg-slate-900 relative justify-center items-center overflow-hidden">
        <!-- Background Pattern/Gradient -->
        <div class="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-brand-950 opacity-90 z-0"></div>
        <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-0"></div>
        
        <!-- Decorative Shapes -->
        <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>

        <!-- Content -->
        <div class="relative z-10 text-center px-10">
            <h1 class="text-5xl font-extrabold text-white mb-6 tracking-tight leading-tight">
                Build Your <br/> <span class="text-brand-400">Workspace.</span>
            </h1>
            <p class="text-lg text-slate-300 max-w-md mx-auto leading-relaxed">
                팀원들과 함께할 공간을 만들고, <br>더 효율적인 채용 프로세스를 경험하세요.
            </p>
            
            <!-- Illustration Placeholder -->
            <div class="mt-12 flex justify-center">
                 <div class="relative w-48 h-48">
                    <div class="absolute inset-0 bg-brand-500 rounded-xl rotate-3 opacity-20"></div>
                    <div class="absolute inset-0 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl shadow-2xl flex items-center justify-center">
                        <span class="text-6xl">🏢</span>
                    </div>
                    <!-- Orbiting elements -->
                    <div class="absolute -top-4 -right-4 w-14 h-14 bg-white/10 backdrop-blur-md rounded-lg rotate-12 flex items-center justify-center border border-white/10 shadow-lg animate-bounce delay-100">
                         <span class="text-2xl">👥</span>
                    </div>
                     <div class="absolute -bottom-4 -left-4 w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 shadow-lg animate-bounce delay-300">
                         <span class="text-2xl">⚙️</span>
                    </div>
                 </div>
            </div>
        </div>
    </div>

    <!-- Right Section: Workspace Form -->
    <div class="flex flex-1 flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 bg-white relative">
      
      <!-- Back Button -->
      <button @click="router.back()" class="absolute top-8 left-8 text-slate-400 hover:text-brand-600 transition-colors flex items-center gap-1 group">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span class="text-sm font-medium">뒤로 가기</span>
      </button>

      <div class="mx-auto w-full max-w-md">
        
        <div class="mb-10">
           <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-100 text-brand-600 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
           </div>
           <h2 class="text-3xl font-bold tracking-tight text-slate-900">
             워크스페이스 생성
           </h2>
           <p class="mt-2 text-sm text-slate-500">
             팀 정보를 입력하고 바로 시작해보세요.
           </p>
        </div>

        <form @submit.prevent="handleStart" class="space-y-6">
          
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">워크스페이스 이름</label>
            <input
                v-model="teamName"
                type="text"
                required
                placeholder="예: Calfit 디자인팀"
                class="block w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 placeholder-slate-400 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-brand-500 sm:text-sm transition-all"
            />
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">담당자 연락처</label>
            <input
                v-model="contact"
                type="text"
                placeholder="010-0000-0000"
                class="block w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 placeholder-slate-400 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-brand-500 sm:text-sm transition-all"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
             <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1">직원 수</label>
                <div class="relative">
                    <select v-model="employeeCount" class="block w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-brand-500 sm:text-sm transition-all cursor-pointer">
                      <option>1 ~ 10명</option>
                      <option>11 ~ 50명</option>
                      <option>51 ~ 300명</option>
                      <option>301 ~ 1,000명</option>
                      <option>1,000명 이상</option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
             </div>

             <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1">나의 역할</label>
                <div class="relative">
                    <select v-model="role" class="block w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-brand-500 sm:text-sm transition-all cursor-pointer">
                      <option>인사 담당자</option>
                      <option>면접관</option>
                      <option>대표</option>
                    </select>
                     <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
             </div>
          </div>

          <div v-if="error" class="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-md border border-red-100">
            {{ error }}
          </div>

          <div class="pt-4">
            <button
              type="submit"
              :disabled="loading"
              class="flex w-full justify-center rounded-lg border border-transparent bg-brand-600 py-3.5 px-4 text-sm font-bold text-white shadow-lg hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
            >
               <span v-if="loading" class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  워크스페이스 생성 중...
                </span>
                <span v-else>CalFit 시작하기</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  </div>
</template>