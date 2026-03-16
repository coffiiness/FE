<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { useRecruitmentStore } from '@/stores/recruitment'
import { isTemplateInUse, normalizeTemplateStatus } from '@/utils/templateStatus'
import { useHrAccessGuard } from '@/composables/useHrAccessGuard'

const router = useRouter()
const recruitmentStore = useRecruitmentStore()
const {
  modal,
  isHrMember,
  loadMemberType,
  onModalConfirm,
  onModalCancel
} = useHrAccessGuard()

const searchQuery = ref('')
const showDeleteModal = ref(false)
const deleteTarget = ref(null)

const currentPage = ref(1)
const itemsPerPage = 5

const templates = computed(() => recruitmentStore.templates)

onMounted(async () => {
  try {
    await loadMemberType()
    await recruitmentStore.fetchApplicationTemplates()
  } catch (error) {
    console.error('템플릿 목록을 불러오지 못했습니다.', error)
  }
})

const goToCreate = () => router.push('/recruitment/templates/create')

const goToDetail = (templateId) => router.push(`/recruitment/templates/${templateId}`)

const goToEdit = (templateId) => router.push(`/recruitment/templates/${templateId}/edit`)

const openDeleteModal = (template) => {
  deleteTarget.value = template
  showDeleteModal.value = true
}

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
  <div class="mx-auto max-w-[110rem] px-4 py-4 md:px-6 md:py-5">
    <section class="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div class="border-b border-slate-200 px-5 py-5 md:px-7 md:py-6">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div class="flex flex-wrap items-center gap-2">
            <div class="relative min-w-[18rem] flex-1 xl:w-[24rem] xl:flex-none">
              <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="템플릿명 검색"
                class="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <span class="inline-flex items-center rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
              전체 {{ templates.length }}개
            </span>
            <span class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
              현재 {{ totalCount }}개 표시
            </span>
          </div>

          <button
            v-if="isHrMember"
            @click="goToCreate"
            class="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white transition-colors hover:bg-brand-700"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            템플릿 생성
          </button>
        </div>
      </div>

      <div class="px-5 py-5 md:px-7 md:py-6">
        <div class="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
          <div class="overflow-x-auto">
            <table class="min-w-full table-fixed">
              <thead class="border-b border-slate-200 bg-slate-50/80">
                <tr class="text-left">
                  <th class="w-[34%] px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-slate-500">템플릿명</th>
                  <th class="w-[18%] px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-slate-500">생성일</th>
                  <th class="w-[18%] px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-slate-500">수정일</th>
                  <th class="w-[14%] px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-slate-500">상태</th>
                  <th class="w-[16%] px-6 py-4 text-right text-xs font-black uppercase tracking-[0.14em] text-slate-500"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="template in paginatedTemplates"
                  :key="template.id"
                  class="transition-colors hover:bg-slate-50/70"
                >
                  <td class="px-6 py-4">
                    <button
                      @click="goToDetail(template.id)"
                      class="text-left text-base font-extrabold tracking-[-0.02em] text-slate-900 transition-colors hover:text-brand-700"
                    >
                      {{ template.name || template.title }}
                    </button>
                  </td>
                  <td class="px-6 py-4 text-sm font-semibold text-slate-600">{{ template.createdAt || '-' }}</td>
                  <td class="px-6 py-4 text-sm font-semibold text-slate-600">{{ template.updatedAt || '-' }}</td>
                  <td class="px-6 py-4">
                    <span :class="[getStatusStyle(template.status), 'inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold']">
                      {{ normalizeTemplateStatus(template.status) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div v-if="isHrMember" class="flex items-center justify-end gap-2">
                      <button @click="goToEdit(template.id)" class="inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-bold text-brand-700 transition-colors hover:bg-brand-50 hover:text-brand-800">
                        편집
                      </button>
                      <button @click="openDeleteModal(template)" class="inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700">
                        삭제
                      </button>
                    </div>
                    <span v-else class="text-sm font-semibold text-slate-300">-</span>
                  </td>
                </tr>

                <tr v-if="paginatedTemplates.length === 0">
                  <td colspan="5" class="px-6 py-16 text-center text-sm font-bold text-slate-500">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-6 py-4">
            <p class="text-sm font-semibold text-slate-500">총 {{ totalCount }}개 중 {{ startIndex }}-{{ endIndex }}</p>

            <div class="flex items-center gap-1">
              <button
                @click="goToPage(currentPage - 1)"
                :disabled="currentPage === 1"
                class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <template v-for="(page, index) in pageNumbers" :key="index">
                <span v-if="page === '...'" class="px-2 text-slate-400">...</span>
                <button
                  v-else
                  @click="goToPage(page)"
                  :class="[
                    'flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold transition-colors',
                    currentPage === page ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-200'
                  ]"
                >
                  {{ page }}
                </button>
              </template>

              <button
                @click="goToPage(currentPage + 1)"
                :disabled="currentPage === totalPages"
                class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

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

    <ConfirmModal
      :show="modal.show"
      :title="modal.title"
      :message="modal.message"
      :type="modal.type"
      :show-cancel="modal.showCancel"
      :confirm-text="modal.confirmText"
      :cancel-text="modal.cancelText"
      @confirm="onModalConfirm"
      @cancel="onModalCancel"
    />
  </div>
</template>
