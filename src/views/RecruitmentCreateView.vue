<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)

// --- 1. 기본 정보 데이터 ---
const form = ref({
  title: '',
  targetCount: 1,
  startDate: '',
  endDate: '',
  applicationTemplateId: '',
  contents: ''
})

// --- 2. 채용 프로세스 데이터 ---
const processes = ref([
  { stageName: '서류 전형', stageType: 'DOCUMENT' },
  { stageName: '실무 면접', stageType: 'INTERVIEW' },
  { stageName: '최종 합격', stageType: 'PASS' }
])

const stageTypes = [
  { label: '서류 심사', value: 'DOCUMENT' },
  { label: '면접', value: 'INTERVIEW' },
  { label: '과제/테스트', value: 'TEST' },
  { label: '최종 합격', value: 'PASS' },
]

const templates = ref([
  { id: 1, name: '기본 개발직군 지원서' },
  { id: 2, name: '디자인 포트폴리오 포함 지원서' },
  { id: 3, name: '경력직 공통 지원서' },
])

// --- Helper Functions ---

const addStage = () => {
  const insertIndex = Math.max(0, processes.value.length - 1)
  const newStage = { stageName: '새 단계', stageType: 'INTERVIEW' }
  processes.value.splice(insertIndex, 0, newStage)
}

const removeStage = (index) => {
  if (processes.value.length <= 2) {
    alert('최소 2개 이상의 단계가 필요합니다.')
    return
  }
  processes.value.splice(index, 1)
}

// --- Drag and Drop Logic (Enhanced) ---
const dragIndex = ref(null)      // 현재 드래그 중인 아이템의 인덱스
const dragOverIndex = ref(null)  // 드래그한 아이템이 올라가 있는 위치의 인덱스

const onDragStart = (index) => {
  dragIndex.value = index
}

// 드래그한 아이템이 다른 아이템 위로 들어왔을 때
const onDragEnter = (index) => {
  // 자기 자신이 아닐 때만 타겟 인덱스 업데이트
  if (index !== dragIndex.value) {
    dragOverIndex.value = index
  }
}

const onDrop = (dropIndex) => {
  const draggedItem = processes.value[dragIndex.value]
  processes.value.splice(dragIndex.value, 1)
  processes.value.splice(dropIndex, 0, draggedItem)

  // 상태 초기화
  dragIndex.value = null
  dragOverIndex.value = null
}

// 드래그가 끝났을 때 (취소되거나 드롭되었을 때) 초기화
const onDragEnd = () => {
  dragIndex.value = null
  dragOverIndex.value = null
}

const handleSubmit = async () => {
  if (!form.value.title || !form.value.startDate || !form.value.endDate) {
    alert('필수 정보를 모두 입력해주세요.')
    return
  }

  loading.value = true

  try {
    const payload = {
      ...form.value,
      processes: processes.value.map((p, index) => ({
        stageName: p.stageName,
        stageType: p.stageType,
        stageStep: index + 1
      }))
    }

    console.log('생성 요청 데이터:', payload)

    setTimeout(() => {
      alert('공고가 성공적으로 등록되었습니다.')
      router.push('/recruitment/home')
    }, 1000)

  } catch (e) {
    alert('오류가 발생했습니다.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="w-full space-y-6 animate-fade-in-up">

    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
      <div>
        <h2 class="text-2xl font-display font-bold text-slate-900">새 채용 공고 만들기</h2>
        <p class="text-slate-500 mt-1">기본 정보와 채용 단계를 설정하여 새로운 인재를 찾아보세요.</p>
      </div>
      <div class="flex gap-3">
        <button @click="router.back()" class="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">
          취소
        </button>
        <button @click="handleSubmit"
                :disabled="loading"
          <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          공고 게시하기
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8">

      <div class="lg:col-span-2 xl:col-span-3 space-y-6">

        <div class="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h3 class="text-lg font-bold text-slate-800 mb-6 flex items-center">
            <span class="w-1.5 h-6 bg-brand-500 mr-2 rounded-full"></span>
            기본 정보
          </h3>

          <div class="space-y-6">
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">공고 제목 <span class="text-rose-500">*</span></label>
              <input v-model="form.title" type="text" placeholder="예) 2026년 상반기 백엔드 개발자 채용"
                     class="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all shadow-sm">
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">채용 목표 인원</label>
                <div class="relative">
                  <input v-model="form.targetCount" type="number" min="1"
                         class="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all pr-12 shadow-sm">
                  <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">명</span>
                </div>
              </div>

              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">지원서 양식 선택</label>
                <div class="relative">
                  <select v-model="form.applicationTemplateId"
                          class="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all appearance-none cursor-pointer shadow-sm">
                    <option value="" disabled selected>템플릿을 선택하세요</option>
                    <option v-for="t in templates" :key="t.id" :value="t.id">{{ t.name }}</option>
                  </select>
                  <svg class="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">시작일시 <span class="text-rose-500">*</span></label>
                <input v-model="form.startDate" type="datetime-local"
                       class="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all shadow-sm">
              </div>
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">마감일시 <span class="text-rose-500">*</span></label>
                <input v-model="form.endDate" type="datetime-local"
                       class="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all shadow-sm">
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h3 class="text-lg font-bold text-slate-800 mb-6 flex items-center">
            <span class="w-1.5 h-6 bg-brand-500 mr-2 rounded-full"></span>
            상세 내용
          </h3>
          <textarea v-model="form.contents" rows="12" placeholder="채용 공고에 표시될 상세 내용을 입력하세요..."
                    class="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all resize-none shadow-sm"></textarea>
        </div>

      </div>

      <div class="lg:col-span-1 xl:col-span-1">
        <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm sticky top-6">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-lg font-bold text-slate-800 flex items-center">
              <span class="w-1.5 h-6 bg-brand-500 mr-2 rounded-full"></span>
              채용 단계 설정
            </h3>
            <button @click="addStage" class="text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg border border-brand-200 transition-colors">
              + 단계 추가
            </button>
          </div>

          <div class="space-y-4 relative">
            <div class="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-200 -z-10"></div>

            <div
              v-for="(stage, idx) in processes"
              :key="idx"
              class="relative pl-0 group cursor-move"
              draggable="true"
              @dragstart="onDragStart(idx)"
              @dragenter="onDragEnter(idx)"
              @dragend="onDragEnd"
              @dragover.prevent
              @drop="onDrop(idx)"
            >
              <div
                class="flex items-start gap-3 bg-white border rounded-xl p-3 shadow-sm transition-all duration-200"
                :class="{
                  'opacity-40 scale-95 border-dashed border-slate-300': dragIndex === idx, // 드래그 중인 아이템 스타일
                  'border-2 border-brand-500 bg-brand-50 scale-105 shadow-md z-10': dragOverIndex === idx && dragIndex !== idx, // 드롭 대상(가까워질 때) 스타일
                  'border-slate-200 hover:border-brand-300 hover:shadow-md': dragIndex !== idx && dragOverIndex !== idx // 평상시 스타일
                }"
              >
                <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 z-10 transition-colors shadow-sm mt-1"
                     :class="{
                        'bg-brand-500 text-white border-brand-500': dragOverIndex === idx && dragIndex !== idx,
                        'bg-white text-brand-600 border-brand-500': stage.stageType === 'PASS' && dragOverIndex !== idx,
                        'bg-white text-slate-500 border-slate-300 group-hover:border-brand-400 group-hover:text-brand-500': stage.stageType !== 'PASS' && dragOverIndex !== idx
                     }">
                  {{ idx + 1 }}
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex justify-between items-start mb-2">
                    <div class="relative">
                      <select v-model="stage.stageType"
                              class="text-xs font-bold pl-2 pr-6 py-1.5 rounded bg-slate-50 border border-slate-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 appearance-none cursor-pointer text-slate-700 w-full transition-colors"
                              :class="{'bg-white': dragOverIndex === idx && dragIndex !== idx}">
                        <option v-for="type in stageTypes" :key="type.value" :value="type.value">
                          {{ type.label }}
                        </option>
                      </select>
                      <svg class="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    <button v-if="processes.length > 2" @click.stop="removeStage(idx)" class="text-slate-300 hover:text-rose-500 transition-colors p-1 ml-1 cursor-pointer">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>

                  <input v-model="stage.stageName" type="text" placeholder="단계명 입력"
                         class="w-full border rounded px-2 py-1.5 text-sm text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-brand-500 transition-colors"
                         :class="dragOverIndex === idx && dragIndex !== idx ? 'bg-white border-brand-200' : 'bg-white border-slate-200'">
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6 p-4 bg-brand-50 rounded-xl border border-brand-100 text-xs text-brand-800 leading-relaxed">
            <p class="font-bold mb-1 flex items-center">
              <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              도움말
            </p>
            카드를 클릭하고 드래그하여 순서를 변경할 수 있습니다.
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out forwards;
}
</style>