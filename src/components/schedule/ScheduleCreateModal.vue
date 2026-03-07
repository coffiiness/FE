<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

import { useOrganizationStore } from '@/stores/organization'
import { storeToRefs } from 'pinia'

const props = defineProps({
  isOpen: Boolean,
  initialDate: String,
  initialData: { type: Object, default: null },
  roomOptions: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'save'])

const orgStore = useOrganizationStore()
const { departments } = storeToRefs(orgStore)

const selectedDeptId = ref(null)
const currentDept = computed(() => departments.value.find(d => d.id === selectedDeptId.value))

const toggleDept = (deptId) => {
  selectedDeptId.value = selectedDeptId.value === deptId ? null : deptId
}

const toggleAttendee = (name) => {
  if (form.value.attendees.includes(name)) {
    form.value.attendees = form.value.attendees.filter(a => a !== name)
  } else {
    form.value.attendees.push(name)
  }
}

const selectAllTeam = (team) => {
  team.members.forEach(member => {
    if (!form.value.attendees.includes(member.name)) {
      form.value.attendees.push(member.name)
    }
  })
}

const form = ref({
  title: '',
  date: '',
  startTime: '13:00',
  endTime: '14:00',
  type: 'INTERVIEW',
  description: '',
  roomId: null,
  attendees: []
})

const attendeeInput = ref('')
const validationModalOpen = ref(false)
const validationMessage = ref('')

const scheduleTypes = [
  { value: 'MEETING', label: '회의', activeClass: 'bg-amber-50 border-amber-200 text-amber-600' },
  { value: 'BUSINESS', label: '외근/출장', activeClass: 'bg-emerald-50 border-emerald-200 text-emerald-600' },
  { value: 'VACATION', label: '휴가', activeClass: 'bg-rose-50 border-rose-200 text-rose-600' },
  { value: 'OTHERS', label: '기타', activeClass: 'bg-slate-100 border-slate-300 text-slate-700' }
]

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    if (props.initialData) {
      form.value = { ...props.initialData, roomId: props.initialData.roomId ?? null, attendees: props.initialData.attendees || [] }
    } else {
      form.value = {
        title: '',
        date: props.initialDate || new Date().toISOString().split('T')[0],
        startTime: '13:00',
        endTime: '14:00',
        type: 'MEETING',
        description: '',
        roomId: null,
        attendees: []
      }
    }
    attendeeInput.value = ''
    selectedDeptId.value = null
  }
})

const addAttendee = () => {
  const name = attendeeInput.value.trim()
  if (name && !form.value.attendees.includes(name)) { form.value.attendees.push(name) }
  attendeeInput.value = ''
}

const removeAttendee = (index) => { form.value.attendees.splice(index, 1) }

const openValidationModal = (message) => {
  validationMessage.value = message
  validationModalOpen.value = true
}

const save = () => {
  if (!form.value.title?.trim()) {
    openValidationModal('일정 제목을 입력해주세요.')
    return
  }

  if (!form.value.date) {
    openValidationModal('일정 날짜를 입력해주세요.')
    return
  }

  if (!form.value.startTime || !form.value.endTime) {
    openValidationModal('시작 시간과 종료 시간을 모두 입력해주세요.')
    return
  }

  if (form.value.startTime >= form.value.endTime) {
    openValidationModal('종료 시간은 시작 시간보다 늦어야 합니다.')
    return
  }

  const payload = { ...form.value }
  const rawRoomId = payload.roomId
  if (rawRoomId === null || rawRoomId === '' || rawRoomId === undefined) {
    payload.roomId = null
  } else {
    const parsedRoomId = Number(rawRoomId)
    payload.roomId = Number.isFinite(parsedRoomId) && parsedRoomId > 0 ? parsedRoomId : null
  }

  emit('save', payload)
}

const handleKeydown = (e) => { if (e.key === 'Escape' && props.isOpen) emit('close') }
onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <Transition name="fade">
    <div v-if="isOpen" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" @click="$emit('close')"></div>

      <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden transform transition-all scale-100 max-h-[90vh] flex flex-col">

        <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <h3 class="text-lg font-bold text-slate-800">
            {{ initialData ? '일정 수정' : '새 일정 생성' }}
          </h3>
          <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 transition-colors">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div class="p-6 space-y-6 overflow-y-auto custom-scrollbar">

          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">제목</label>
            <input v-model="form.title" type="text" placeholder="예: 2차 기술 면접"
                   class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-slate-700 font-bold placeholder-slate-400 transition-all text-base" autofocus> </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">일정 타입</label>
            <div class="grid grid-cols-4 gap-2">
              <button
                  v-for="item in scheduleTypes"
                  :key="item.value"
                  @click="form.type = item.value"
                  class="py-2.5 rounded-lg text-xs font-bold border transition-all shadow-sm hover:shadow-md"
                  :class="form.type === item.value
                  ? item.activeClass
                  : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'"
              >
                {{ item.label }}
              </button>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">날짜</label>
              <div class="relative">
                <input v-model="form.date" type="date" class="w-full pl-4 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none font-medium text-sm shadow-sm"> </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">시작 시간</label>
                <input v-model="form.startTime" type="time" class="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none text-sm font-medium text-center shadow-sm"> </div>
              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">종료 시간</label>
                <input v-model="form.endTime" type="time" class="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none text-sm font-medium text-center shadow-sm"> </div>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">회의실 선택</label>
            <select v-model="form.roomId" class="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none text-sm font-medium shadow-sm">
              <option :value="null">선택 안 함</option>
              <option v-for="room in roomOptions" :key="room.id" :value="room.id">
                {{ room.name }} ({{ room.location ?? room.floor ?? '-' }}층 / {{ room.capacity }}명)
              </option>
            </select>
            <p class="mt-1.5 text-[11px] text-slate-500">회의실을 선택해 일정을 생성하면 회의실 예약 캘린더에도 반영됩니다.</p>
          </div>

          <!-- 참석자 선택 -->
          <div>
            <label class="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">참석자 선택</label>
            
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 mb-3">
              <!-- 1. 부서 선택 -->
              <div class="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                <button 
                  v-for="dept in departments" 
                  :key="dept.id"
                  @click="toggleDept(dept.id)"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border shrink-0"
                  :class="selectedDeptId === dept.id ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'"
                >
                  {{ dept.name }}
                </button>
              </div>

              <!-- 2. 팀 및 멤버 목록 -->
              <div v-if="currentDept" class="space-y-3 animate-fade-in-up">
                <div v-for="team in currentDept.teams" :key="team.id">
                  <h4 class="text-[11px] font-bold text-slate-400 mb-2 flex items-center gap-2">
                    {{ team.name }}
                    <button @click="selectAllTeam(team)" class="text-[10px] text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded hover:bg-brand-100 transition-colors">전체 선택</button>
                  </h4>
                  <div class="grid grid-cols-2 gap-2">
                    <button 
                      v-for="member in team.members" 
                      :key="member.id"
                      @click="toggleAttendee(member.name)"
                      class="flex items-center gap-2 p-2 rounded-lg border text-left transition-all group"
                      :class="form.attendees.includes(member.name) ? 'bg-brand-50 border-brand-200 ring-1 ring-brand-200' : 'bg-white border-slate-200 hover:border-brand-200'"
                    >
                      <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                           :class="form.attendees.includes(member.name) ? 'bg-brand-200 text-brand-700' : 'bg-slate-100 text-slate-500'">
                        {{ member.name[0] }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-xs font-bold text-slate-700 truncate" :class="{'text-brand-700': form.attendees.includes(member.name)}">{{ member.name }}</p>
                        <p class="text-[10px] text-slate-400 truncate">{{ member.position }}</p>
                      </div>
                      <div v-if="form.attendees.includes(member.name)" class="text-brand-600">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
              
              <div v-else class="text-center py-6 text-slate-400 text-xs">
                부서를 선택하여 팀원을 추가하세요.
              </div>
            </div>

            <div class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 transition-all flex flex-wrap gap-2 items-center min-h-[50px] shadow-sm">
                <span v-for="(person, index) in form.attendees" :key="index"
                      class="bg-brand-50 text-brand-700 border border-brand-100 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-fade-in-up">
                  {{ person }}
                  <button @click="removeAttendee(index)" class="hover:text-brand-900 rounded-full hover:bg-brand-200 p-0.5 transition-colors">
                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </span>

              <input
                  v-model="attendeeInput"
                  @keydown.enter.prevent="addAttendee"
                  @keydown.backspace="attendeeInput === '' && form.attendees.pop()"
                  type="text"
                  placeholder="외부 이름 직접 입력"
                  class="flex-1 bg-transparent focus:outline-none text-sm text-slate-700 placeholder-slate-300 min-w-[80px] h-full py-1"
              >
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">메모 / 장소</label>
            <textarea v-model="form.description" rows="3" placeholder="장소나 상세 내용을 입력하세요."
                      class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm text-slate-700 resize-none shadow-inner"></textarea> </div>

        </div>

        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button @click="$emit('close')" class="px-5 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-200 hover:text-slate-700 rounded-lg transition-all">취소</button>
          <button @click="save" class="px-6 py-2.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-all transform active:scale-95"> {{ initialData ? '수정 완료' : '일정 생성' }}
          </button>
        </div>

      </div>
    </div>
  </Transition>

  <ConfirmModal
      :show="validationModalOpen"
      type="warning"
      title="입력 확인"
      :message="validationMessage"
      confirmText="확인"
      :showCancel="false"
      @confirm="validationModalOpen = false"
      @cancel="validationModalOpen = false"
  />
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in-up { animation: fadeInUp 0.2s ease-out forwards; }
</style>

