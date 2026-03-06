<script setup>
import { reactive, watch, ref, computed, onMounted, onUnmounted } from 'vue'
import { useScheduleStore } from '@/stores/schedule'
import { useOrganizationStore } from '@/stores/organization'
import { storeToRefs } from 'pinia'

const props = defineProps({
  open: { type: Boolean, required: true },
  room: { type: Object, default: null },
  selectedDate: { type: Date, default: null },
  selectedHour: { type: Number, default: null }
})

const emit = defineEmits(['close', 'confirm'])
const scheduleStore = useScheduleStore()
const orgStore = useOrganizationStore()
const { departments } = storeToRefs(orgStore)

const selectedDeptId = ref(null)
const currentDept = computed(() => departments.value.find(d => d.id === selectedDeptId.value))
const attendeeInput = ref('')

const toggleDept = (deptId) => {
  selectedDeptId.value = selectedDeptId.value === deptId ? null : deptId
}

const toggleAttendee = (name) => {
  if (state.attendees.includes(name)) {
    state.attendees = state.attendees.filter(a => a !== name)
  } else {
    state.attendees.push(name)
  }
}

const selectAllTeam = (team) => {
  team.members.forEach(member => {
    if (!state.attendees.includes(member.name)) {
      state.attendees.push(member.name)
    }
  })
}

const addAttendee = () => {
  const name = attendeeInput.value.trim()
  if (name && !state.attendees.includes(name)) { state.attendees.push(name) }
  attendeeInput.value = ''
}

const removeAttendee = (index) => { state.attendees.splice(index, 1) }

const state = reactive({
  title: '',
  description: '',
  date: '',
  startTime: '09:00',
  endTime: '10:00',
  organizer: '',
  attendees: []
})

const getCurrentUserName = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    return user?.name || user?.nickname || ''
  } catch {
    return ''
  }
}

watch(
  () => props.open,
  (open) => {
    if (!open) return
    const baseDate = props.selectedDate || new Date()
    const defaultHour = props.selectedHour ?? 9
    state.date = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}-${String(baseDate.getDate()).padStart(2, '0')}`
    state.startTime = `${String(defaultHour).padStart(2, '0')}:00`
    state.endTime = `${String(defaultHour + 1).padStart(2, '0')}:00`
    state.organizer = getCurrentUserName()
    state.attendees = [] // 초기화
    selectedDeptId.value = null
    attendeeInput.value = ''
  }
)

const handleSubmit = () => {
  if (!props.room || !state.title || !state.organizer) return
  const [startHour, startMinute] = state.startTime.split(':').map(Number)
  const [endHour, endMinute] = state.endTime.split(':').map(Number)
  const base = new Date(state.date)
  const startDateTime = new Date(base)
  startDateTime.setHours(startHour, startMinute, 0, 0)
  const endDateTime = new Date(base)
  endDateTime.setHours(endHour, endMinute, 0, 0)

  // 문자열로 변환하지 않고 배열 그대로 전송
  const attendeesList = [...state.attendees]

  emit('confirm', {
    roomId: props.room.id,
    title: state.title,
    description: state.description,
    startTime: startDateTime,
    endTime: endDateTime,
    organizer: state.organizer,
    attendees: attendeesList,
    status: 'confirmed'
  })

  // [연동] ScheduleStore에 일정 추가
  scheduleStore.addSchedule({
    title: `[회의실] ${state.title}`,
    date: state.date,
    startTime: state.startTime,
    endTime: state.endTime,
    type: 'MEETING',
    description: `장소: ${props.room.name}\n주최자: ${state.organizer}\n참석자: ${attendeesList.join(', ')}\n내용: ${state.description || '-'}`,
    roomId: props.room.id
  })

  state.title = ''
  state.description = ''
  state.organizer = ''
  state.attendees = []
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[78vh] overflow-hidden flex flex-col">
      <div class="px-6 py-5 border-b flex items-start justify-between">
        <div>
          <h3 class="text-lg font-semibold text-slate-900">회의실 예약</h3>
          <p class="text-xs text-slate-500 mt-1">예약 정보를 입력하세요</p>
        </div>
        <button class="text-slate-500 hover:text-slate-700" @click="emit('close')" aria-label="닫기">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="p-6 space-y-5 overflow-y-auto text-slate-900">
        <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center gap-3">
          <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: room?.color || '#94a3b8' }"></span>
          <div>
            <div class="font-semibold text-slate-900">{{ room?.name }}</div>
            <div class="text-sm text-slate-700 mt-0.5">{{ room?.capacity }}인 · {{ room?.floor }}층</div>
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-900">회의 제목 *</label>
          <input v-model="state.title" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500" placeholder="회의 제목을 입력하세요" />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-900">회의 설명</label>
          <textarea v-model="state.description" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 resize-none" rows="3"></textarea>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-900">날짜</label>
            <input v-model="state.date" type="date" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-900">시작 시간</label>
            <input v-model="state.startTime" type="time" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-900">종료 시간</label>
            <input v-model="state.endTime" type="time" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500" />
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-900">주최자 *</label>
          <input v-model="state.organizer" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500" placeholder="주최자 이름" />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-900">참석자</label>

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
                      :class="state.attendees.includes(member.name) ? 'bg-brand-50 border-brand-200 ring-1 ring-brand-200' : 'bg-white border-slate-200 hover:border-brand-200'"
                  >
                    <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                         :class="state.attendees.includes(member.name) ? 'bg-brand-200 text-brand-700' : 'bg-slate-100 text-slate-500'">
                      {{ member.name[0] }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-bold text-slate-700 truncate" :class="{'text-brand-700': state.attendees.includes(member.name)}">{{ member.name }}</p>
                      <p class="text-[10px] text-slate-400 truncate">{{ member.position }}</p>
                    </div>
                    <div v-if="state.attendees.includes(member.name)" class="text-brand-600">
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
                <span v-for="(person, index) in state.attendees" :key="index"
                      class="bg-brand-50 text-brand-700 border border-brand-100 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-fade-in-up">
                  {{ person }}
                  <button @click="removeAttendee(index)" class="hover:text-brand-900 rounded-full hover:bg-brand-200 p-0.5 transition-colors">
                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </span>

            <input
                v-model="attendeeInput"
                @keydown.enter.prevent="addAttendee"
                @keydown.backspace="attendeeInput === '' && state.attendees.pop()"
                type="text"
                placeholder="외부 이름 직접 입력"
                class="flex-1 bg-transparent focus:outline-none text-sm text-slate-700 placeholder-slate-300 min-w-[80px] h-full py-1"
            >
          </div>
        </div>
      </div>
      <div class="px-6 py-4 border-t flex justify-end gap-2 bg-white">
        <button class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors" @click="emit('close')">취소</button>
        <button class="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm shadow-brand-200" @click="handleSubmit">예약 확정</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
.custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: #94a3b8; }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in-up { animation: fadeInUp 0.2s ease-out forwards; }
</style>
