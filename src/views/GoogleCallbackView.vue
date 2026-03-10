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

const toGoogleConnectErrorMessage = (error) => {
  const payload = error?.response?.data
  const status = error?.response?.status
  const customCode = payload?.error?.customCode || ''
  const rawMessage = payload?.error?.message || payload?.message || error?.message || ''
  const normalized = String(customCode || rawMessage)

  if (/GOOGLE_REAUTH_REQUIRED|invalid_grant|Malformed auth code/i.test(normalized)) {
    return '구글 인증 코드가 만료되었거나 이미 사용되었습니다. 연동을 다시 시도해 주세요.'
  }

  if (/Could not determine client ID from request/i.test(normalized)) {
    return '백엔드 Google OAuth 설정(client id/secret)을 확인해 주세요.'
  }

  if (/GOOGLE_WATCH_REGISTRATION_FAILED|push\.webhookUrlNotHttps|WebHook callback must be HTTPS/i.test(normalized)) {
    return '연동은 완료되었지만 실시간 동기화 채널 등록에 실패했습니다. 로컬 환경에서는 HTTPS 콜백 URL이 필요합니다.'
  }

  if (status === 401) {
    return '로그인 정보가 만료되었습니다. 다시 로그인 후 시도해 주세요.'
  }

  return '구글 캘린더 연동에 실패했습니다.'
}

const handleModalConfirm = () => {
  isSuccessModalOpen.value = false
  isErrorModalOpen.value = false
  router.push('/schedule')
}

onMounted(async () => {
  const code = route.query.code
  if (!code) {
    localStorage.removeItem('isGoogleCalendarConnected')
    localStorage.removeItem('googleCalendarEmail')
    errorMessage.value = '구글 로그인 코드가 없습니다.'
    isErrorModalOpen.value = true
    return
  }

  try {
    const response = await api.post('/calendars/google/connect', {
      authCode: code,
      redirectUri: `${window.location.origin}/auth/callback`
    })

    const connectedEmail = response.data?.data || '이메일 정보를 불러오지 못했습니다.'

    localStorage.setItem('isGoogleCalendarConnected', 'true')
    localStorage.setItem('googleCalendarEmail', connectedEmail)
    isSuccessModalOpen.value = true
  } catch (error) {
    localStorage.removeItem('isGoogleCalendarConnected')
    localStorage.removeItem('googleCalendarEmail')

    console.error('구글 캘린더 연동 실패:', error)
    errorMessage.value = toGoogleConnectErrorMessage(error)
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
        <p class="text-slate-500 mt-2">잠시만 기다려 주세요.</p>
      </div>
    </div>

    <ConfirmModal
      :show="isSuccessModalOpen"
      title="연동 완료"
      message="구글 캘린더 연동이 성공적으로 완료되었습니다."
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