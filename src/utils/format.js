/**
 * 공통 포맷/유틸리티 함수 모음
 */

/**
 * ISO 날짜 문자열에서 날짜 부분(YYYY-MM-DD)만 반환.
 * @param {string|null|undefined} isoString
 * @returns {string} 'YYYY-MM-DD' 또는 '-'
 *
 * @example
 * formatDate('2025-03-15T09:00:00')  // '2025-03-15'
 * formatDate(null)                    // '-'
 */
export const formatDate = (isoString) => {
  if (!isoString) return '-'
  return isoString.split('T')[0]
}

/**
 * 이름에서 아바타용 이니셜 추출 (첫 1글자).
 * @param {string|null|undefined} name
 * @returns {string}
 *
 * @example
 * getInitials('진희헌')  // '진'
 * getInitials('gwano')  // 'G'
 * getInitials(null)     // '?'
 */
export const getInitials = (name) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

/**
 * Axios 에러 객체에서 BE API 에러 메시지를 추출.
 * BE 응답 형식: { result: 'ERROR', error: { code: '...', message: '...' } }
 *
 * @param {Error} error    - Axios 에러 객체
 * @param {string} fallback - 메시지를 추출할 수 없을 때 사용할 기본 문자열
 * @returns {string}
 *
 * @example
 * getApiError(e, '저장에 실패했습니다.')
 */
export const getApiError = (error, fallback = '오류가 발생했습니다.') => {
  const payload = error?.response?.data?.error
  const messages = {
    WORKSPACE_ALREADY_JOINED: '이미 이 워크스페이스에 가입되어 있습니다.',
    ACTIVE_WORKSPACE_EXISTS: '이미 워크스페이스에 소속되어 있습니다. 기존 소속 해제 후 가입해 주세요.',
    MULTIPLE_ACTIVE_MEMBERSHIPS: '활성 소속 정보가 중복되어 있습니다. 관리자에게 문의해 주세요.',
    TENANT_MISMATCH: '현재 소속과 요청한 워크스페이스가 다릅니다. 화면을 새로고침해 주세요.',
    ACTIVE_MEMBERSHIP_REQUIRED: '워크스페이스를 생성하거나 초대를 수락해 주세요.',
    INVITATION_UNAVAILABLE: '만료되었거나 이미 처리된 초대입니다.',
    GOOGLE_OAUTH_STATE_INVALID: '인증 요청이 만료되었거나 계정/워크스페이스가 변경되었습니다. 연동을 다시 시작해 주세요.'
  }
  return messages[payload?.customCode] || (typeof payload?.data === 'string' ? payload.data : payload?.data?.message)
    || payload?.message || error?.message || fallback
}
