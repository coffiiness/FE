<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 폼 데이터 (필요에 따라 API로 전송할 값들)
const teamName = ref('')
const contact = ref('')
const employeeCount = ref('1-10명')
const role = ref('인사 담당자')

const loading = ref(false)

const handleStart = async () => {
  loading.value = true

  // await api.createWorkspace({ name: teamName.value, ... })

  setTimeout(() => {
    loading.value = false

    // [핵심] 대시보드 페이지로 이동
    router.push({ name: 'Dashboard' })
  }, 1000)
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans selection:bg-brand-400/30">
    <div class="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-400/20 rounded-full blur-[120px]" />

    <div class="relative w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all">

      <div class="flex items-center justify-between mb-8">
        <button @click="router.back()" class="flex items-center text-slate-400 hover:text-brand-600 transition-colors group">
          <span class="text-sm font-medium"> < 뒤로 가기</span>
        </button>
        <div class="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-[11px] text-white font-bold shadow-lg">김</div>
      </div>

      <div class="text-center mb-10">
        <h1 class="text-2xl font-bold text-slate-900 mb-2 tracking-tight">
          팀의 워크스페이스를<br />만들어 볼까요?
        </h1>
        <div class="h-1.5 w-10 bg-brand-500 mx-auto rounded-full" />
      </div>

      <form @submit.prevent="handleStart" class="space-y-6">

        <div class="space-y-2">
          <label class="text-sm font-semibold text-slate-700 ml-1">회사명 또는 팀명</label>
          <input
              v-model="teamName"
              type="text"
              required
              placeholder="예: Calfit 디자인팀"
              class="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
          />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-semibold text-slate-700 ml-1">담당자 연락처</label>
          <input
              v-model="contact"
              type="text"
              placeholder="010-0000-0000"
              class="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-semibold text-slate-700 ml-1">직원 수</label>
            <select v-model="employeeCount" class="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:border-brand-500 cursor-pointer">
              <option>1-10명</option>
              <option>11-50명</option>
              <option>50명 이상</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-semibold text-slate-700 ml-1">현재 역할</label>
            <select v-model="role" class="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:border-brand-500 cursor-pointer">
              <option>인사 담당자</option>
              <option>면접관</option>
              <option>대표</option>
            </select>
          </div>
        </div>

        <button
            type="submit"
            :disabled="loading"
            class="w-full mt-4 bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-600/20 transition-all active:scale-[0.98]"
        >
          <span v-if="loading">생성 중...</span>
          <span v-else>Calfit 시작하기</span>
        </button>
      </form>
    </div>
  </div>
</template>