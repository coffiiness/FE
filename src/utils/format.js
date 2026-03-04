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
 * 이름에서 아바타용 이니셜 추출 (앞 2글자).
 * @param {string|null|undefined} name
 * @returns {string}
 *
 * @example
 * getInitials('홍길동')  // '홍길'
 * getInitials('Kim')    // 'Ki'
 * getInitials(null)     // '?'
 */
export const getInitials = (name) => {
  if (!name) return '?'
  return name.length >= 2 ? name.substring(0, 2) : name
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
  return error?.response?.data?.error?.message || fallback
}
