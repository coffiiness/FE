import { ref } from 'vue'
import { announcementBoardApi } from '@/api/announcementBoard'

export function useAnnouncementNotificationModal() {
  const showAnnouncementModal = ref(false)
  const isAnnouncementLoading = ref(false)
  const announcementError = ref('')
  const announcementDetail = ref(null)

  const closeAnnouncementModal = () => {
    showAnnouncementModal.value = false
    isAnnouncementLoading.value = false
    announcementError.value = ''
    announcementDetail.value = null
  }

  const openAnnouncementModal = async (notification) => {
    announcementDetail.value = null
    announcementError.value = ''
    isAnnouncementLoading.value = true
    showAnnouncementModal.value = true

    const targetId = Number(notification?.targetId)
    if (!Number.isFinite(targetId)) {
      isAnnouncementLoading.value = false
      announcementError.value = '공지사항 상세 정보를 찾을 수 없습니다.'
      return
    }

    try {
      const response = await announcementBoardApi.detail(targetId)
      const data = response?.data?.data

      if (data?.id) {
        announcementDetail.value = {
          id: data.id,
          title: data.title,
          content: data.content,
          pinned: Boolean(data.pinned),
          createdAt: data.createdAt || null
        }
      } else {
        announcementError.value = '공지사항 상세 정보를 불러오지 못했습니다.'
      }
    } catch (error) {
      console.error('공지사항 상세 조회 실패:', error)
      announcementError.value = '공지사항 상세 정보를 불러오지 못했습니다.'
    } finally {
      isAnnouncementLoading.value = false
    }
  }

  return {
    showAnnouncementModal,
    isAnnouncementLoading,
    announcementError,
    announcementDetail,
    openAnnouncementModal,
    closeAnnouncementModal
  }
}
