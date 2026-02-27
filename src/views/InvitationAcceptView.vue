<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { invitationApi } from '@/api/invitation'

const route = useRoute()
const router = useRouter()

const token = route.params.token
const invitation = ref(null)
const isLoading = ref(true)
const isAccepting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const memberTypeLabels = { HR: '인사담당자', IVW: '면접관' }

const formatDate = (isoString) => {
  if (!isoString) return '-'
  return new Date(isoString).toLocaleString('ko-KR')
}

onMounted(async () => {
  try {
    const res = await invitationApi.getInvitation(token)
    invitation.value = res.data.data
  } catch (e) {
    errorMessage.value = e.response?.data?.error?.message || '유효하지 않거나 만료된 초대 링크입니다.'
  } finally {
    isLoading.value = false
  }
})

const handleAccept = async () => {
  isAccepting.value = true
  try {
    await invitationApi.acceptInvitation(token)
    successMessage.value = '초대를 수락했습니다. 로그인 후 워크스페이스를 이용하세요.'
    setTimeout(() => router.push('/login'), 2500)
  } catch (e) {
    errorMessage.value = e.response?.data?.error?.message || '초대 수락에 실패했습니다.'
  } finally {
    isAccepting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center px-4">
    <div class="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">

      <div v-if="isLoading" class="text-center py-8 text-slate-400">초대 정보를 불러오는 중...</div>

      <div v-else-if="successMessage" class="text-center py-8">
        <div class="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p class="text-slate-700 font-semibold">{{ successMessage }}</p>
        <p class="text-sm text-slate-400 mt-2">잠시 후 로그인 페이지로 이동합니다.</p>
      </div>

      <div v-else-if="errorMessage" class="text-center py-8">
        <div class="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <p class="text-slate-700 font-semibold">초대 링크 오류</p>
        <p class="text-sm text-slate-500 mt-2">{{ errorMessage }}</p>
        <button @click="router.push('/login')" class="mt-6 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-lg transition-colors">
          로그인 페이지로 이동
        </button>
      </div>

      <div v-else-if="invitation">
        <div class="text-center mb-8">
          <div class="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 class="text-xl font-bold text-slate-800">워크스페이스 초대</h1>
          <p class="text-sm text-slate-400 mt-1">아래 초대를 수락하면 워크스페이스 멤버가 됩니다.</p>
        </div>

        <div class="bg-slate-50 rounded-xl p-4 mb-6 space-y-3 text-sm">
          <div class="flex justify-between">
            <span class="text-slate-400 font-medium">초대 이메일</span>
            <span class="text-slate-700 font-semibold">{{ invitation.email }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400 font-medium">권한</span>
            <span class="text-slate-700 font-semibold">{{ memberTypeLabels[invitation.memberType] ?? invitation.memberType }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400 font-medium">만료 일시</span>
            <span class="text-slate-700 font-semibold">{{ formatDate(invitation.expiresAt) }}</span>
          </div>
        </div>

        <p class="text-xs text-slate-400 mb-6 text-center">
          초대를 수락하려면 해당 이메일로 가입된 Coffiness 계정이 필요합니다.
        </p>

        <div class="flex gap-3">
          <button @click="router.push('/login')" class="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold text-sm rounded-lg hover:bg-slate-50 transition-colors">
            취소
          </button>
          <button @click="handleAccept" :disabled="isAccepting" class="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white font-bold text-sm rounded-lg shadow-md shadow-teal-600/10 transition-colors">
            {{ isAccepting ? '처리 중...' : '초대 수락하기' }}
          </button>
        </div>
      </div>

    </div>
  </div>
</template>
