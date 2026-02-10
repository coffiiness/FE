<script setup>
import { ref, computed } from 'vue'

// 검색 및 필터
const searchQuery = ref('')
const selectedJob = ref('')
const selectedStatus = ref('')

// 페이지네이션
const currentPage = ref(1)
const itemsPerPage = 5

// 더미 데이터
const applicants = ref([
  { id: 1, name: '박지원', email: 'parkjiwon@email.com', job: '백엔드 개발자', status: '1차 면접', nextSchedule: '2024.02.06 10:00', appliedDate: '2024.02.01' },
  { id: 2, name: '김철수', email: 'kimcs@email.com', job: '백엔드 개발자', status: '2차 면접', nextSchedule: '2024.02.07 14:00', appliedDate: '2024.01.28' },
  { id: 3, name: '이영희', email: 'leeyh@email.com', job: '프론트엔드 개발자', status: '서류 검토', nextSchedule: null, appliedDate: '2024.02.03' },
  { id: 4, name: '최민수', email: 'choi.ms@email.com', job: '백엔드 개발자', status: '처우 협의', nextSchedule: '2024.02.08 15:00', appliedDate: '2024.01.20' },
  { id: 5, name: '정수현', email: 'jung.sh@email.com', job: '백엔드 개발자', status: '불합격', nextSchedule: null, appliedDate: '2024.01.25' },
  { id: 6, name: '한소영', email: 'hansoy@email.com', job: '프론트엔드 개발자', status: '1차 면접', nextSchedule: '2024.02.09 11:00', appliedDate: '2024.02.02' },
  { id: 7, name: '오준석', email: 'ohjs@email.com', job: 'DevOps 엔지니어', status: '서류 검토', nextSchedule: null, appliedDate: '2024.02.04' },
  { id: 8, name: '윤지민', email: 'yoonjm@email.com', job: '백엔드 개발자', status: '합격', nextSchedule: null, appliedDate: '2024.01.15' },
])

const jobs = ['백엔드 개발자', '프론트엔드 개발자', 'DevOps 엔지니어']
const statuses = ['서류 검토', '1차 면접', '2차 면접', '처우 협의', '합격', '불합격']

// 필터링된 지원자 목록
const filteredApplicants = computed(() => {
  return applicants.value.filter(applicant => {
    const matchesSearch = !searchQuery.value ||
      applicant.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      applicant.email.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesJob = !selectedJob.value || applicant.job === selectedJob.value
    const matchesStatus = !selectedStatus.value || applicant.status === selectedStatus.value
    return matchesSearch && matchesJob && matchesStatus
  })
})

// 페이지네이션
const totalPages = computed(() => Math.ceil(filteredApplicants.value.length / itemsPerPage))
const paginatedApplicants = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredApplicants.value.slice(start, start + itemsPerPage)
})

const totalCount = computed(() => filteredApplicants.value.length)
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage + 1)
const endIndex = computed(() => Math.min(currentPage.value * itemsPerPage, totalCount.value))

// 상태별 배지 스타일
const getStatusStyle = (status) => {
  const styles = {
    '서류 검토': 'bg-teal-100 text-teal-700 border-teal-200',
    '1차 면접': 'bg-blue-100 text-blue-700 border-blue-200',
    '2차 면접': 'bg-blue-100 text-blue-700 border-blue-200',
    '처우 협의': 'bg-amber-100 text-amber-700 border-amber-200',
    '합격': 'bg-green-100 text-green-700 border-green-200',
    '불합격': 'bg-gray-100 text-gray-500 border-gray-200',
  }
  return styles[status] || 'bg-gray-100 text-gray-700 border-gray-200'
}

// 이니셜 추출
const getInitial = (name) => name.charAt(0)

// 페이지 변경
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// 페이지 번호 목록
const pageNumbers = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    if (current <= 3) {
      pages.push(1, 2, 3, '...', total)
    } else if (current >= total - 2) {
      pages.push(1, '...', total - 2, total - 1, total)
    } else {
      pages.push(1, '...', current, '...', total)
    }
  }
  return pages
})

// 엑셀 다운로드
const exportToExcel = () => {
  const params = new URLSearchParams()
  if (searchQuery.value) params.append('search', searchQuery.value)
  if (selectedJob.value) params.append('job', selectedJob.value)
  if (selectedStatus.value) params.append('status', selectedStatus.value)

  // 백엔드 API 호출하여 파일 다운로드
  const queryString = params.toString()
  window.location.href = `/api/applicants/export${queryString ? '?' + queryString : ''}`
}
</script>

<template>
  <div class="space-y-6">
    <!-- 헤더 -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h1 class="text-2xl font-bold text-gray-900">지원자 관리</h1>

      <!-- 필터 영역 -->
      <div class="flex flex-wrap items-center gap-3">
        <!-- 검색 -->
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="이름, 이메일 검색..."
            class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 w-64"
          />
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <!-- 공고 필터 -->
        <select
          v-model="selectedJob"
          class="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
        >
          <option value="">모든 공고</option>
          <option v-for="job in jobs" :key="job" :value="job">{{ job }}</option>
        </select>

        <!-- 상태 필터 -->
        <select
          v-model="selectedStatus"
          class="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
        >
          <option value="">모든 상태</option>
          <option v-for="status in statuses" :key="status" :value="status">{{ status }}</option>
        </select>

        <!-- 엑셀 다운로드 버튼 -->
        <button
          @click="exportToExcel"
          class="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          엑셀 다운로드
        </button>
      </div>
    </div>

    <!-- 테이블 -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="px-6 py-4 text-left text-sm font-semibold text-gray-600">지원자</th>
            <th class="px-6 py-4 text-left text-sm font-semibold text-gray-600">공고</th>
            <th class="px-6 py-4 text-left text-sm font-semibold text-gray-600">진행 상태</th>
            <th class="px-6 py-4 text-left text-sm font-semibold text-gray-600">다음 일정</th>
            <th class="px-6 py-4 text-left text-sm font-semibold text-gray-600">지원일</th>
            <th class="px-6 py-4 text-right text-sm font-semibold text-gray-600"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr
            v-for="applicant in paginatedApplicants"
            :key="applicant.id"
            class="hover:bg-gray-50 transition-colors"
          >
            <!-- 지원자 정보 -->
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                  {{ getInitial(applicant.name) }}
                </div>
                <div>
                  <p class="font-medium text-gray-900">{{ applicant.name }}</p>
                  <p class="text-sm text-gray-500">{{ applicant.email }}</p>
                </div>
              </div>
            </td>

            <!-- 공고 -->
            <td class="px-6 py-4 text-gray-700">{{ applicant.job }}</td>

            <!-- 진행 상태 -->
            <td class="px-6 py-4">
              <span
                :class="[getStatusStyle(applicant.status), 'px-3 py-1 rounded-full text-sm font-medium border']"
              >
                {{ applicant.status }}
              </span>
            </td>

            <!-- 다음 일정 -->
            <td class="px-6 py-4 text-gray-700">
              {{ applicant.nextSchedule || '-' }}
            </td>

            <!-- 지원일 -->
            <td class="px-6 py-4 text-gray-700">{{ applicant.appliedDate }}</td>

            <!-- 액션 -->
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-3">
                <button class="text-brand-600 hover:text-brand-700 text-sm font-medium">
                  이력서
                </button>
                <button class="text-brand-600 hover:text-brand-700 text-sm font-medium">
                  상세
                </button>
              </div>
            </td>
          </tr>

          <!-- 빈 상태 -->
          <tr v-if="paginatedApplicants.length === 0">
            <td colspan="6" class="px-6 py-12 text-center text-gray-500">
              검색 결과가 없습니다.
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 페이지네이션 -->
      <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
        <p class="text-sm text-gray-600">
          총 {{ totalCount }}명 중 {{ startIndex }}-{{ endIndex }}
        </p>

        <div class="flex items-center gap-1">
          <!-- 이전 -->
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <!-- 페이지 번호 -->
          <template v-for="(page, index) in pageNumbers" :key="index">
            <span v-if="page === '...'" class="px-2 text-gray-400">...</span>
            <button
              v-else
              @click="goToPage(page)"
              :class="[
                'w-9 h-9 rounded-lg text-sm font-medium transition-colors',
                currentPage === page
                  ? 'bg-brand-600 text-white'
                  : 'hover:bg-gray-200 text-gray-700'
              ]"
            >
              {{ page }}
            </button>
          </template>

          <!-- 다음 -->
          <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
