import { computed, ref } from 'vue'
import { memberApi } from '@/api/member'
import { useModal } from '@/composables/useModal'

const DEFAULT_MESSAGE = '인사담당자만 사용할 수 있는 기능입니다.'
const DEFAULT_LOOKUP_ERROR = '권한 정보를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.'

export function useHrAccessGuard() {
  const memberType = ref('')
  const loading = ref(false)
  const loaded = ref(false)
  const { modal, openModal, onModalConfirm, onModalCancel } = useModal()

  const isHrMember = computed(() => memberType.value === 'HR')

  const showForbiddenModal = (message = DEFAULT_MESSAGE) => {
    openModal({
      title: '권한 없음',
      message,
      type: 'warning',
      confirmText: '확인'
    })
  }

  const showLookupErrorModal = (message = DEFAULT_LOOKUP_ERROR) => {
    openModal({
      title: '권한 확인 실패',
      message,
      type: 'warning',
      confirmText: '확인'
    })
  }

  const loadMemberType = async ({ force = false } = {}) => {
    if (loaded.value && !force) return memberType.value

    loading.value = true
    try {
      const response = await memberApi.getMyMember()
      memberType.value = response?.data?.data?.memberType || ''
      loaded.value = true
      return memberType.value
    } finally {
      loading.value = false
    }
  }

  const ensureHrAccess = async (message = DEFAULT_MESSAGE) => {
    try {
      const type = await loadMemberType()
      if (type === 'HR') {
        return true
      }
      showForbiddenModal(message)
      return false
    } catch (error) {
      console.error('HR 권한 확인 실패:', error)
      showLookupErrorModal()
      return false
    }
  }

  return {
    memberType,
    loading,
    isHrMember,
    modal,
    loadMemberType,
    ensureHrAccess,
    showForbiddenModal,
    showLookupErrorModal,
    onModalConfirm,
    onModalCancel
  }
}
