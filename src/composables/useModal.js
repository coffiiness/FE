import { ref } from 'vue'

/**
 * ConfirmModal과 연동되는 알림/확인 모달 상태 관리 composable.
 *
 * 사용법:
 *   const { modal, openModal, onModalConfirm, onModalCancel } = useModal()
 *
 *   // 단순 알림
 *   openModal({ title: '완료', message: '저장되었습니다.', type: 'success' })
 *
 *   // 확인/취소가 있는 위험 동작
 *   openModal({
 *     title: '삭제 확인',
 *     message: '정말 삭제하시겠습니까?',
 *     type: 'danger',
 *     showCancel: true,
 *     confirmText: '삭제하기',
 *     onConfirm: async () => { await api.delete(...) },
 *   })
 *
 * 템플릿 연결:
 *   <ConfirmModal
 *     :show="modal.show"
 *     :title="modal.title"
 *     :message="modal.message"
 *     :type="modal.type"
 *     :show-cancel="modal.showCancel"
 *     :confirm-text="modal.confirmText"
 *     :cancel-text="modal.cancelText"
 *     @confirm="onModalConfirm"
 *     @cancel="onModalCancel"
 *   />
 */
export function useModal() {
  const modal = ref({
    show: false,
    title: '',
    message: '',
    type: 'info',         // 'info' | 'success' | 'warning' | 'danger'
    showCancel: false,
    confirmText: '확인',
    cancelText: '취소',
    onConfirm: () => {},
  })

  /**
   * 모달 열기
   * @param {{ title: string, message: string, type?: string, showCancel?: boolean,
   *           confirmText?: string, cancelText?: string, onConfirm?: Function }} opts
   */
  const openModal = (opts) => {
    modal.value = {
      show: true,
      showCancel: false,
      confirmText: '확인',
      cancelText: '취소',
      onConfirm: () => {},
      ...opts,
    }
  }

  const onModalConfirm = () => {
    modal.value.onConfirm()
    modal.value.show = false
  }

  const onModalCancel = () => {
    modal.value.show = false
  }

  return { modal, openModal, onModalConfirm, onModalCancel }
}
