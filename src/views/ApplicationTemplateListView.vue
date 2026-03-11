<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { useRecruitmentStore } from '@/stores/recruitment'
import { isTemplateInUse, normalizeTemplateStatus } from '@/utils/templateStatus'

const router = useRouter()
const recruitmentStore = useRecruitmentStore()

const searchQuery = ref('')
const showDeleteModal = ref(false)
const deleteTarget = ref(null)

const currentPage = ref(1)
const itemsPerPage = 5

const templates = computed(() => recruitmentStore.templates)

onMounted(async () => {
  try {
    await recruitmentStore.fetchApplicationTemplates()
  } catch (error) {
    console.error('템플릿 목록을 불러오지 못했습니다.', error)
  }
})

const filteredTemplates = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase()
  return templates.value.filter((template) => {
    const name = String(template.name || template.title || '').toLowerCase()
    return !keyword || name.includes(keyword)
  })
})

const totalPages = computed(() => Math.ceil(filteredTemplates.value.length / itemsPerPage) || 1)
const paginatedTemplates = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredTemplates.value.slice(start, start + itemsPerPage)
})

const totalCount = computed(() => filteredTemplates.value.length)
const startIndex = computed(() => (totalCount.value ? (currentPage.value - 1) * itemsPerPage + 1 : 0))
const endIndex = computed(() => Math.min(currentPage.value * itemsPerPage, totalCount.value))

const getStatusStyle = (status) => {
  return isTemplateInUse(status)
    ? 'bg-green-100 text-green-700 border-green-200'
    : 'bg-gray-100 text-gray-500 border-gray-200'
}

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) currentPage.value = page
}

const pageNumbers = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 5) {
    for (let i = 1; i <= total; i += 1) pages.push(i)
    return pages
  }

  if (current <= 3) return [1, 2, 3, '...', total]
  if (current >= total - 2) return [1, '...', total - 2, total - 1, total]
  return [1, '...', current, '...', total]
})

const goToCreate = () => router.push('/recruitment/templates/create')
const goToDetail = (templateId) => router.push(`/recruitment/templates/${templateId}`)
const goToEdit = (templateId) => router.push(`/recruitment/templates/${templateId}/edit`)

const openDeleteModal = (template) => {
  deleteTarget.value = template
  showDeleteModal.value = true
}

const handleDeleteConfirm = async () => {
  if (deleteTarget.value) {
    try {
      await recruitmentStore.deleteTemplate(deleteTarget.value.id)
    } catch (error) {
      console.error('템플릿 삭제에 실패했습니다.', error)
    }
  }
  showDeleteModal.value = false
  deleteTarget.value = null
}

const handleDeleteCancel = () => {
  showDeleteModal.value = false
  deleteTarget.value = null
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="템플릿명 검색..."
            class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 w-64"
          />
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <button
        @click="goToCreate"
        class="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium sm:ml-auto"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        템플릿 생성
      </button>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="px-6 py-4 text-left text-sm font-semibold text-gray-600">템플릿명</th>
            <th class="px-6 py-4 text-left text-sm font-semibold text-gray-600">생성일</th>
            <th class="px-6 py-4 text-left text-sm font-semibold text-gray-600">수정일</th>
            <th class="px-6 py-4 text-left text-sm font-semibold text-gray-600">상태</th>
            <th class="px-6 py-4 text-right text-sm font-semibold text-gray-600"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr
            v-for="template in paginatedTemplates"
            :key="template.id"
            class="hover:bg-gray-50 transition-colors"
          >
            <td class="px-6 py-4">
              <button
                @click="goToDetail(template.id)"
                class="font-medium text-gray-900 hover:text-brand-600 transition-colors text-left"
              >
                {{ template.name || template.title }}
              </button>
            </td>
            <td class="px-6 py-4 text-gray-700">{{ template.createdAt || '-' }}</td>
            <td class="px-6 py-4 text-gray-700">{{ template.updatedAt || '-' }}</td>
            <td class="px-6 py-4">
              <span :class="[getStatusStyle(template.status), 'px-3 py-1 rounded-full text-sm font-medium border']">
                {{ normalizeTemplateStatus(template.status) }}
              </span>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-3">
                <button @click="goToEdit(template.id)" class="text-brand-600 hover:text-brand-700 text-sm font-medium">
                  편집
                </button>
                <button @click="openDeleteModal(template)" class="text-red-500 hover:text-red-700 text-sm font-medium">
                  삭제
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="paginatedTemplates.length === 0">
            <td colspan="5" class="px-6 py-12 text-center text-gray-500">
              검색 결과가 없습니다.
            </td>
          </tr>
        </tbody>
      </table>

      <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
        <p class="text-sm text-gray-600">총 {{ totalCount }}개 중 {{ startIndex }}-{{ endIndex }}</p>

        <div class="flex items-center gap-1">
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <template v-for="(page, index) in pageNumbers" :key="index">
            <span v-if="page === '...'" class="px-2 text-gray-400">...</span>
            <button
              v-else
              @click="goToPage(page)"
              :class="[
                'w-9 h-9 rounded-lg text-sm font-medium transition-colors',
                currentPage === page ? 'bg-brand-600 text-white' : 'hover:bg-gray-200 text-gray-700'
              ]"
            >
              {{ page }}
            </button>
          </template>

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

    <ConfirmModal
      :show="showDeleteModal"
      title="템플릿 삭제"
      :message="`'${deleteTarget?.name || deleteTarget?.title}' 템플릿을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`"
      confirm-text="삭제"
      cancel-text="취소"
      type="danger"
      @confirm="handleDeleteConfirm"
      @cancel="handleDeleteCancel"
    />
  </div>
</template>
