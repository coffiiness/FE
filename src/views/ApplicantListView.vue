<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { recruitmentApi } from '@/api/recruitment'
import { applicationBoardApi } from '@/api/applicationBoard'

const router = useRouter()

const searchQuery = ref('')
const selectedJob = ref('')
const selectedStatus = ref('')

const applicants = ref([])
const loading = ref(false)
const loadError = ref('')
const isExporting = ref(false)

const defaultStatuses = ['서류 검토', '1차 면접', '2차 면접', '처우 협의', '합격', '불합격']

const statusLabelMap = {
  DOCUMENT_REVIEW: '서류 검토',
  FIRST_INTERVIEW: '1차 면접',
  SECOND_INTERVIEW: '2차 면접',
  OFFER_NEGOTIATION: '처우 협의',
  HIRED: '합격',
  PASSED: '합격',
  REJECTED: '불합격',
  FAILED: '불합격'
}

const normalizeStatus = (status) => {
  if (!status) return '서류 검토'
  return statusLabelMap[status] || status
}

const formatDate = (value) => {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

const formatDateTime = (value) => {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  const base = formatDate(date)
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${base} ${hour}:${minute}`
}

const toDisplayApplicant = (item, index) => {
  const detailId = item?.applicationId ?? item?.applicantId ?? item?.id ?? `applicant-${index}`
  const id = item?.id ?? detailId
  const name = item?.name ?? item?.applicantName ?? '-'
  const email = item?.email ?? item?.applicantEmail ?? '-'
  const job = item?.recruitmentTitle ?? item?.jobTitle ?? item?.job ?? '-'
  const status = normalizeStatus(item?.status ?? item?.applicationStatus ?? item?.progressStatus)
  const nextSchedule = formatDateTime(item?.nextSchedule ?? item?.nextInterviewAt ?? item?.nextScheduleAt)
  const appliedDate = formatDate(item?.appliedAt ?? item?.appliedDate ?? item?.createdAt)

  return {
    id,
    detailId,
    name,
    email,
    job,
    status,
    nextSchedule,
    appliedDate
  }
}

const getListErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error?.message ||
    '지원자 목록을 불러오지 못했습니다.'
  )
}

const loadApplicants = async () => {
  loading.value = true
  loadError.value = ''

  try {
    const recruitmentsResponse = await recruitmentApi.getRecruitments()
    const recruitmentPayload = recruitmentsResponse?.data?.data
    const recruitmentList = Array.isArray(recruitmentPayload) ? recruitmentPayload : []

    if (!recruitmentList.length) {
      applicants.value = []
      return
    }

    const boardResults = await Promise.all(
      recruitmentList.map(async (recruitment) => {
        try {
          const response = await applicationBoardApi.getBoard(recruitment.id)
          const payload = applicationBoardApi.extractResponseData(response)
          const columns = Array.isArray(payload?.columns) ? payload.columns : []
          return { recruitment, columns }
        } catch (error) {
          console.error(`지원자 보드 조회 실패: recruitmentId=${recruitment.id}`, error)
          return { recruitment, columns: [] }
        }
      })
    )

    const flattened = []
    boardResults.forEach(({ recruitment, columns }) => {
      columns.forEach((column) => {
        const applications = Array.isArray(column?.applications) ? column.applications : []
        applications.forEach((application) => {
          flattened.push({
            id: application?.applicationId ?? application?.id,
            applicationId: application?.applicationId ?? application?.id,
            applicantId: application?.applicantId,
            name: application?.name ?? application?.applicantName ?? '-',
            email: application?.email ?? application?.applicantEmail ?? '-',
            recruitmentTitle: recruitment?.title ?? '-',
            status: column?.name ?? application?.status ?? application?.applicationStatus ?? '',
            createdAt: application?.createdAt ?? application?.appliedAt ?? null,
            nextScheduleAt: application?.nextScheduleAt ?? application?.nextInterviewAt ?? null
          })
        })
      })
    })

    if (flattened.length === 0) {
      const fallbackResponse = await applicationBoardApi.getApplications({ all: true })
      const payload = applicationBoardApi.extractResponseData(fallbackResponse)
      const list = Array.isArray(payload) ? payload : Array.isArray(payload?.content) ? payload.content : []
      const recruitmentTitleMap = new Map(
        recruitmentList.map((recruitment) => [Number(recruitment.id), recruitment.title || '-'])
      )

      applicants.value = list.map((item, index) =>
        toDisplayApplicant(
          {
            ...item,
            id: item?.applicationId ?? item?.id,
            recruitmentTitle: recruitmentTitleMap.get(Number(item?.recruitmentId)) || '-'
          },
          index
        )
      )
      return
    }

    applicants.value = flattened.map(toDisplayApplicant)
  } catch (error) {
    applicants.value = []
    loadError.value = getListErrorMessage(error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadApplicants()
})

const jobs = computed(() => {
  return [...new Set(applicants.value.map((applicant) => applicant.job).filter((job) => job && job !== '-'))]
})

const statuses = computed(() => {
  return [...new Set([...defaultStatuses, ...applicants.value.map((applicant) => applicant.status).filter(Boolean)])]
})

const filteredApplicants = computed(() => {
  return applicants.value.filter((applicant) => {
    const keyword = searchQuery.value.trim().toLowerCase()
    const name = (applicant.name || '').toLowerCase()
    const email = (applicant.email || '').toLowerCase()

    const matchesSearch = !keyword || name.includes(keyword) || email.includes(keyword)
    const matchesJob = !selectedJob.value || applicant.job === selectedJob.value
    const matchesStatus = !selectedStatus.value || applicant.status === selectedStatus.value

    return matchesSearch && matchesJob && matchesStatus
  })
})

const totalCount = computed(() => filteredApplicants.value.length)
const startIndex = computed(() => (totalCount.value === 0 ? 0 : 1))
const endIndex = computed(() => totalCount.value)

const getStatusStyle = (status) => {
  const styles = {
    '서류 검토': 'bg-teal-100 text-teal-700 border-teal-200',
    '1차 면접': 'bg-blue-100 text-blue-700 border-blue-200',
    '2차 면접': 'bg-blue-100 text-blue-700 border-blue-200',
    '처우 협의': 'bg-amber-100 text-amber-700 border-amber-200',
    합격: 'bg-green-100 text-green-700 border-green-200',
    불합격: 'bg-gray-100 text-gray-500 border-gray-200'
  }
  return styles[status] || 'bg-gray-100 text-gray-700 border-gray-200'
}

const getInitial = (name) => (name ? name.charAt(0) : '-')

const goToDetail = (detailId) => {
  router.push(`/recruitment/applicants/${detailId}`)
}

const buildExportParams = () => {
  const params = {}
  const search = searchQuery.value.trim()

  if (search) params.search = search
  if (selectedJob.value) params.job = selectedJob.value
  if (selectedStatus.value) params.status = selectedStatus.value

  return params
}

const getDefaultExportFilename = () => {
  const today = new Date().toISOString().split('T')[0]
  return `applicants_${today}.xlsx`
}

const getFilenameFromContentDisposition = (contentDisposition) => {
  if (!contentDisposition) return null

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].replace(/\"/g, '').trim())
    } catch {
      return utf8Match[1].replace(/\"/g, '').trim()
    }
  }

  const asciiMatch = contentDisposition.match(/filename=\"?([^\";]+)\"?/i)
  if (asciiMatch?.[1]) {
    return asciiMatch[1].trim()
  }

  return null
}

const triggerDownload = (blob, filename) => {
  const blobUrl = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = blobUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.URL.revokeObjectURL(blobUrl)
}

const getExportErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error?.message ||
    '엑셀 파일 다운로드에 실패했습니다.'
  )
}

const exportToExcel = async () => {
  if (isExporting.value) return

  isExporting.value = true

  try {
    const response = await applicantApi.exportApplicantsWithFallback(buildExportParams())
    const contentType = response?.headers?.['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    const blob = response?.data instanceof Blob
      ? response.data
      : new Blob([response?.data], { type: contentType })

    const filename = getFilenameFromContentDisposition(response?.headers?.['content-disposition']) || getDefaultExportFilename()
    triggerDownload(blob, filename)
  } catch (error) {
    alert(getExportErrorMessage(error))
  } finally {
    isExporting.value = false
  }
}

const emptyMessage = computed(() => {
  if (loading.value) return '지원자 목록을 불러오는 중입니다.'
  if (loadError.value) return loadError.value
  return '검색 결과가 없습니다.'
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div class="flex flex-wrap items-center gap-3">
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

        <select
          v-model="selectedJob"
          class="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
        >
          <option value="">모든 공고</option>
          <option v-for="job in jobs" :key="job" :value="job">{{ job }}</option>
        </select>

        <select
          v-model="selectedStatus"
          class="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
        >
          <option value="">모든 상태</option>
          <option v-for="status in statuses" :key="status" :value="status">{{ status }}</option>
        </select>
      </div>

      <button
        @click="exportToExcel"
        :disabled="isExporting || loading"
        class="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors sm:ml-auto disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        엑셀 다운로드
      </button>
    </div>

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
            v-for="applicant in filteredApplicants"
            :key="applicant.id"
            class="hover:bg-gray-50 transition-colors"
          >
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                  {{ getInitial(applicant.name) }}
                </div>
                <div>
                  <button
                    @click="goToDetail(applicant.detailId)"
                    class="font-medium text-gray-900 hover:text-brand-600 transition-colors text-left"
                  >
                    {{ applicant.name }}
                  </button>
                  <p class="text-sm text-gray-500">{{ applicant.email }}</p>
                </div>
              </div>
            </td>

            <td class="px-6 py-4 text-gray-700">{{ applicant.job }}</td>

            <td class="px-6 py-4">
              <span
                :class="[getStatusStyle(applicant.status), 'px-3 py-1 rounded-full text-sm font-medium border']"
              >
                {{ applicant.status }}
              </span>
            </td>

            <td class="px-6 py-4 text-gray-700">
              {{ applicant.nextSchedule || '-' }}
            </td>

            <td class="px-6 py-4 text-gray-700">{{ applicant.appliedDate }}</td>

            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-3">
                <button
                  @click="goToDetail(applicant.detailId)"
                  class="text-brand-600 hover:text-brand-700 text-sm font-medium"
                >
                  상세
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="filteredApplicants.length === 0">
            <td colspan="6" class="px-6 py-12 text-center text-gray-500">
              {{ emptyMessage }}
            </td>
          </tr>
        </tbody>
      </table>

      <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
        <p class="text-sm text-gray-600">
          총 {{ totalCount }}명 중 {{ startIndex }}-{{ endIndex }}
        </p>
      </div>
    </div>
  </div>
</template>
