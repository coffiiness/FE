<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

const route = useRoute()
const router = useRouter()

const isSuccessModalOpen = ref(false)
const isErrorModalOpen = ref(false)
const errorMessage = ref('')

const handleModalConfirm = () => {
  isSuccessModalOpen.value = false
  isErrorModalOpen.value = false
  router.push('/schedule')
}

onMounted(async () => {
  const code = route.query.code
  if (!code) {
    errorMessage.value = '구글 로그인 코드가 없습니다.'
    isErrorModalOpen.value = true
    return
  }
  
  try {
    // 백엔드로 토큰 발급을 위한 인증 코드 전송
    const response = await api.post('/calendars/google/connect', {
      authCode: code,
      redirectUri: window.location.origin + '/auth/callback'
    })
    
    const connectedEmail = response.data?.data || '알 수 없는 계정'
    
    // 연동 성공 결과 저장
    localStorage.setItem('isGoogleCalendarConnected', 'true')
    localStorage.setItem('googleCalendarEmail', connectedEmail)
    isSuccessModalOpen.value = true
  } catch (error) {
    console.error('구글 캘린더 연동 실패:', error)
    errorMessage.value = error?.response?.data?.error?.message || '구글 캘린더 연동에 실패했습니다.'
    isErrorModalOpen.value = true
  }
})
</script>

<template>
  <div>
    <div class="min-h-screen flex items-center justify-center bg-slate-50">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-brand-500 border-t-transparent mb-4"></div>
        <h2 class="text-xl font-bold text-slate-800">구글 캘린더 연동 중...</h2>
        <p class="text-slate-500 mt-2">잠시만 기다려주세요.</p>
      </div>
    </div>
    
    <ConfirmModal 
      :show="isSuccessModalOpen" 
      title="연동 완료" 
      message="구글 캘린더 연동이 성공적으로 완료되었습니다!" 
      confirmText="내 일정 확인하기" 
      type="success" 
      :showCancel="false" 
      @confirm="handleModalConfirm" 
      @cancel="handleModalConfirm" 
    />
    
    <ConfirmModal 
      :show="isErrorModalOpen" 
      title="연동 실패" 
      :message="errorMessage" 
      confirmText="돌아가기" 
      type="danger" 
      :showCancel="false" 
      @confirm="handleModalConfirm" 
      @cancel="handleModalConfirm" 
    />
  </div>
</template>
