<script setup>
import { reactive, watch, ref, computed, onMounted } from 'vue'
import { memberApi } from '@/api/member'
import { groupApi } from '@/api/group'

const props = defineProps({
  open: { type: Boolean, required: true },
  room: { type: Object, default: null },
  selectedDate: { type: Date, default: null },
  selectedHour: { type: Number, default: null },
  selectedEndHour: { type: Number, default: null }
})

const emit = defineEmits(['close', 'confirm'])
const members = ref([])
const groups = ref([])
const isMembersLoading = ref(false)
const memberSearchQuery = ref('')
const selectedGroupId = ref(null)
const selectedParticipants = ref([])
const attendeeInput = ref('')
const formError = ref('')
const submitError = ref('')
const organizerUserId = ref(null)
const organizerName = computed(() => getCurrentUserName() || '미지정')

const parseDateOnly = (value) => {
  const [year, month, day] = String(value || '').split('-').map(Number)
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return new Date(value)
  }
  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

const isPastDateTime = (dateValue, timeValue) => {
  if (!dateValue || !timeValue) return false
  const [hour, minute] = String(timeValue).split(':').map(Number)
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return false
  const target = parseDateOnly(dateValue)
  target.setHours(hour, minute, 0, 0)
  return target < new Date()
}

const getInitialBookingHour = (baseDate, selectedHour) => {
  if (selectedHour !== null && selectedHour !== undefined) {
    return Math.max(8, Math.min(20, selectedHour))
  }

  const now = new Date()
  const sameDay =
    baseDate.getFullYear() === now.getFullYear() &&
    baseDate.getMonth() === now.getMonth() &&
    baseDate.getDate() === now.getDate()

  if (!sameDay) {
    return 9
  }

  const nextHour = now.getMinutes() > 0 || now.getSeconds() > 0 ? now.getHours() + 1 : now.getHours()
  return Math.max(9, Math.min(20, nextHour))
}

const getInitialBookingEndHour = (startHour, selectedEndHour) => {
  if (selectedEndHour !== null && selectedEndHour !== undefined) {
    return Math.max(startHour + 1, Math.min(21, selectedEndHour))
  }

  return Math.min(startHour + 1, 21)
}

const groupedMembers = computed(() => {
  const query = memberSearchQuery.value.trim().toLowerCase()
  const normalizedMembers = members.value
    .map((member) => ({
      ...member,
      groupName: String(member?.group || '').trim() || '미분류',
      position: member?.memberType === 'HR' ? '인사담당자' : '면접관'
    }))
    .filter((member) => {
      if (!query) return true
      const text = `${member.name || ''} ${member.position || ''} ${member.groupName || ''}`.toLowerCase()
      return text.includes(query)
    })

  const groupOrder = groups.value.map((group) => group.name)
  const groupedMap = new Map()

  normalizedMembers.forEach((member) => {
    if (!groupedMap.has(member.groupName)) {
      groupedMap.set(member.groupName, [])
    }
    groupedMap.get(member.groupName).push(member)
  })

  const orderedGroupNames = [
    ...groupOrder.filter((name) => groupedMap.has(name)),
    ...Array.from(groupedMap.keys()).filter((name) => !groupOrder.includes(name))
  ]

  return orderedGroupNames.map((groupName, index) => ({
    id: groups.value.find((group) => group.name === groupName)?.id ?? `group-${index}`,
    name: groupName,
    color: groups.value.find((group) => group.name === groupName)?.color ?? '#94a3b8',
    members: groupedMap.get(groupName) ?? []
  }))
})

const currentGroup = computed(
  () => groupedMembers.value.find((group) => String(group.id) === String(selectedGroupId.value)) ?? null
)

const toggleGroup = (groupId) => {
  selectedGroupId.value = String(selectedGroupId.value) === String(groupId) ? null : String(groupId)
}

const getMemberUserId = (member) => {
  const rawId = Number(member?.userId ?? member?.id)
  return Number.isFinite(rawId) && rawId > 0 ? rawId : null
}

const isSelectedMember = (userId) =>
  selectedParticipants.value.some((participant) => participant.userId === userId)

const toggleAttendee = (member) => {
  const targetUserId = getMemberUserId(member)
  if (targetUserId && targetUserId === organizerUserId.value) {
    return
  }
  if (isSelectedMember(targetUserId)) {
    selectedParticipants.value = selectedParticipants.value.filter(
      (participant) => participant.userId !== targetUserId
    )
  } else {
    selectedParticipants.value.push({ userId: targetUserId, name: member.name })
  }
}

const selectAllGroup = (group) => {
  group.members.forEach((member) => {
    const targetUserId = getMemberUserId(member)
    if (targetUserId && targetUserId === organizerUserId.value) {
      return
    }
    if (!isSelectedMember(targetUserId)) {
      selectedParticipants.value.push({ userId: targetUserId, name: member.name })
    }
  })
}

const addAttendee = () => {
  const name = attendeeInput.value.trim()
  if (name && !selectedParticipants.value.some((participant) => participant.name === name)) {
    selectedParticipants.value.push({ userId: null, name })
  }
  attendeeInput.value = ''
}

const removeAttendee = (index) => {
  selectedParticipants.value.splice(index, 1)
}

const state = reactive({
  title: '',
  description: '',
  date: '',
  startTime: '09:00',
  endTime: '10:00',
  organizer: ''
})

const meridiemOptions = ['AM', 'PM']
const hour12Options = Array.from({ length: 12 }, (_, index) => index + 1)

const to24Hour = (hour12, meridiem) => {
  const normalized = Number(hour12) % 12
  if (meridiem === 'AM') return normalized
  return normalized + 12
}

const to12HourParts = (hour24) => {
  const period = hour24 < 12 ? 'AM' : 'PM'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  return { period, hour12 }
}

const startMeridiem = ref('AM')
const startHour12 = ref(9)
const endMeridiem = ref('AM')
const endHour12 = ref(10)

const getCurrentUserName = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    return user?.name || user?.nickname || ''
  } catch {
    return ''
  }
}

const getCurrentUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    const userId = Number(user?.id)
    return Number.isFinite(userId) && userId > 0 ? userId : null
  } catch {
    return null
  }
}

const loadMembers = async () => {
  isMembersLoading.value = true
  try {
    const [memberResponse, groupResponse] = await Promise.all([
      memberApi.getMembers(),
      groupApi.getGroups()
    ])
    members.value = Array.isArray(memberResponse?.data?.data) ? memberResponse.data.data : []
    groups.value = Array.isArray(groupResponse?.data?.data) ? groupResponse.data.data : []
  } catch {
    members.value = []
    groups.value = []
  } finally {
    isMembersLoading.value = false
  }
}

onMounted(() => {
  loadMembers()
})

watch(
  () => props.open,
  (open) => {
    if (!open) return
    const baseDate = props.selectedDate || new Date()
    const defaultHour = getInitialBookingHour(baseDate, props.selectedHour)
    const defaultEndHour = getInitialBookingEndHour(defaultHour, props.selectedEndHour)
    state.date = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}-${String(baseDate.getDate()).padStart(2, '0')}`
    state.startTime = `${String(defaultHour).padStart(2, '0')}:00`
    state.endTime = `${String(defaultEndHour).padStart(2, '0')}:00`
    const startParts = to12HourParts(defaultHour)
    const endParts = to12HourParts(defaultEndHour)
    startMeridiem.value = startParts.period
    startHour12.value = startParts.hour12
    endMeridiem.value = endParts.period
    endHour12.value = endParts.hour12
    organizerUserId.value = getCurrentUserId()
    state.organizer = organizerName.value
    selectedParticipants.value = []
    submitError.value =
      props.selectedHour !== null && isPastDateTime(state.date, state.startTime)
        ? '이미 지난 시간은 예약할 수 없습니다. 현재 이후 시간으로 다시 선택해 주세요.'
        : ''
    memberSearchQuery.value = ''
    selectedGroupId.value = null
    attendeeInput.value = ''
    formError.value = ''
  }
)

watch(
  () => state.startTime,
  (nextStart) => {
    const startHour = Number(nextStart.split(':')[0])
    const endHour = Number(state.endTime.split(':')[0])
    if (!Number.isFinite(startHour) || !Number.isFinite(endHour)) return
    if (endHour <= startHour) {
      const nextEndHour = Math.min(startHour + 1, 23)
      state.endTime = `${String(nextEndHour).padStart(2, '0')}:00`
    }
    const startParts = to12HourParts(startHour)
    startMeridiem.value = startParts.period
    startHour12.value = startParts.hour12
    const endParts = to12HourParts(Number(state.endTime.split(':')[0]))
    endMeridiem.value = endParts.period
    endHour12.value = endParts.hour12
  }
)

watch([startMeridiem, startHour12], ([period, hour]) => {
  const hour24 = to24Hour(hour, period)
  const next = `${String(hour24).padStart(2, '0')}:00`
  if (state.startTime !== next) state.startTime = next
})

watch([endMeridiem, endHour12], ([period, hour]) => {
  const hour24 = to24Hour(hour, period)
  const next = `${String(hour24).padStart(2, '0')}:00`
  if (state.endTime !== next) state.endTime = next
})

const handleSubmit = () => {
  formError.value = ''
  submitError.value = ''
  if (!props.room) {
    formError.value = '회의실 정보를 확인해주세요.'
    return
  }
  if (!String(state.title || '').trim()) {
    formError.value = '회의 제목을 입력해주세요.'
    return
  }
  if (!state.date) {
    formError.value = '날짜를 선택해주세요.'
    return
  }
  const [startHour, startMinute] = state.startTime.split(':').map(Number)
  const [endHour, endMinute] = state.endTime.split(':').map(Number)
  const base = parseDateOnly(state.date)
  const startDateTime = new Date(base)
  startDateTime.setHours(startHour, startMinute, 0, 0)
  const endDateTime = new Date(base)
  endDateTime.setHours(endHour, endMinute, 0, 0)
  if (!(startDateTime < endDateTime)) {
    formError.value = '종료 시간은 시작 시간보다 늦어야 합니다.'
    return
  }

  if (startDateTime >= endDateTime) {
    formError.value = '종료 시간은 시작 시간보다 늦어야 합니다.'
    return
  }

  if (startHour < 8 || startHour > 20 || endHour < 8 || endHour > 21) {
    formError.value = '예약 시간은 08:00~21:00 범위에서 입력해 주세요.'
    return
  }

  const now = new Date()
  if (startDateTime < now) {
    formError.value = '지난 시간으로는 예약할 수 없습니다. 현재 이후 시간으로 선택해 주세요.'
    return
  }

  const attendeesList = selectedParticipants.value
    .filter((participant) => participant.userId !== organizerUserId.value)
    .map((participant) => participant.name)
  const participantUserIds = selectedParticipants.value
    .map((participant) => participant.userId)
    .filter((userId) => Number.isFinite(userId) && userId !== organizerUserId.value)
  const fixedOrganizerName = organizerName.value

  emit('confirm', {
    roomId: props.room.id,
    title: state.title.trim(),
    description: state.description,
    startTime: startDateTime,
    endTime: endDateTime,
    organizer: fixedOrganizerName,
    attendees: attendeesList,
    participantUserIds,
    status: 'confirmed'
  })

  state.title = ''
  state.description = ''
  state.organizer = ''
  selectedParticipants.value = []
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/34 p-4 backdrop-blur-[2px] sm:p-6"
  >
    <div class="flex max-h-[84vh] w-full max-w-[780px] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
      <div class="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 sm:px-7">
        <div class="space-y-2">
          <h3 class="text-[1.45rem] font-black tracking-[-0.03em] text-slate-950">회의실 예약</h3>
          <div
            class="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.12),transparent_45%),linear-gradient(180deg,rgba(251,253,253,0.98),rgba(247,250,252,0.98))] px-4 py-3"
          >
            <span
              class="h-3 w-3 rounded-full"
              :style="{ backgroundColor: room?.color || '#94a3b8' }"
            ></span>
            <div>
              <p class="text-sm font-black text-slate-950">{{ room?.name }}</p>
              <p class="mt-0.5 text-sm font-semibold text-slate-500">
                {{ room?.capacity }}인 · {{ room?.floor }}층
              </p>
            </div>
          </div>
        </div>
        <button
          class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
          @click="emit('close')"
          aria-label="닫기"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="space-y-5 overflow-y-auto px-6 py-5 text-slate-900 sm:px-7">
        <p v-if="submitError" class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600">
          {{ submitError }}
        </p>

        <div class="space-y-2">
          <label class="text-sm font-black text-slate-900">회의 제목 *</label>
          <input
            v-model="state.title"
            class="booking-field"
            placeholder="회의 제목을 입력하세요"
          />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-black text-slate-900">회의 설명</label>
          <textarea
            v-model="state.description"
            class="booking-field min-h-[120px] resize-none py-3"
            rows="4"
            placeholder="필요한 메모가 있으면 입력하세요"
          ></textarea>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-black text-slate-900">날짜</label>
            <input v-model="state.date" type="date" class="booking-field" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-black text-slate-900">시작 시간</label>
            <div class="flex gap-2">
              <select v-model="startMeridiem" class="booking-select w-24 text-xs">
                <option v-for="period in meridiemOptions" :key="period" :value="period">{{ period }}</option>
              </select>
              <select v-model="startHour12" class="booking-select min-w-[5.5rem] flex-1">
                <option v-for="hour in hour12Options" :key="`start-${hour}`" :value="hour">{{ hour }}</option>
              </select>
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-black text-slate-900">종료 시간</label>
            <div class="flex gap-2">
              <select v-model="endMeridiem" class="booking-select w-24 text-xs">
                <option v-for="period in meridiemOptions" :key="`end-${period}`" :value="period">{{ period }}</option>
              </select>
              <select v-model="endHour12" class="booking-select min-w-[5.5rem] flex-1">
                <option v-for="hour in hour12Options" :key="`end-${hour}`" :value="hour">{{ hour }}</option>
              </select>
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-black text-slate-900">주최자 *</label>
          <input
            v-model="state.organizer"
            class="booking-field"
            readonly
          />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-black text-slate-900">참석자</label>

          <div class="mb-3 space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <input
              v-model="memberSearchQuery"
              type="text"
              placeholder="실제 멤버 이름으로 검색"
              class="booking-field bg-white"
            />

            <div v-if="isMembersLoading" class="text-center py-6 text-slate-400 text-xs">
              멤버 목록을 불러오는 중입니다.
            </div>

            <div v-else-if="groupedMembers.length" class="space-y-4 animate-fade-in-up">
              <div class="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                <button
                  v-for="group in groupedMembers"
                  :key="group.id"
                  @click="toggleGroup(group.id)"
                  class="shrink-0 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-bold transition-all"
                  :class="String(selectedGroupId) === String(group.id) ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'"
                >
                  {{ group.name }}
                </button>
              </div>

              <div v-if="currentGroup" class="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                <div class="mb-3">
                  <div class="text-[11px] font-bold text-slate-500 mb-2 flex items-center gap-2">
                    {{ currentGroup.name }}
                    <button
                      @click="selectAllGroup(currentGroup)"
                      class="text-[10px] text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded hover:bg-brand-100 transition-colors"
                    >
                      전체 선택
                    </button>
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <button
                      v-for="member in currentGroup.members"
                      :key="getMemberUserId(member) ?? member.id ?? member.name"
                      @click="toggleAttendee(member)"
                      class="group flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all"
                      :class="getMemberUserId(member) === organizerUserId
                        ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                        : isSelectedMember(getMemberUserId(member))
                          ? 'bg-brand-50 border-brand-200 ring-1 ring-brand-200'
                          : 'bg-white border-slate-200 hover:border-brand-200'"
                      :disabled="getMemberUserId(member) === organizerUserId"
                    >
                      <div
                        class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                        :class="getMemberUserId(member) === organizerUserId
                          ? 'bg-slate-200 text-slate-500'
                          : isSelectedMember(getMemberUserId(member))
                            ? 'bg-brand-200 text-brand-700'
                            : 'bg-slate-100 text-slate-500'"
                      >
                        {{ member.name?.[0] || '?' }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <p
                          class="text-xs font-bold text-slate-700 truncate"
                          :class="{ 'text-brand-700': isSelectedMember(getMemberUserId(member)) && getMemberUserId(member) !== organizerUserId }"
                        >
                          {{ member.name }}
                        </p>
                        <p class="text-[10px] text-slate-400 truncate">{{ getMemberUserId(member) === organizerUserId ? '주최자 본인' : member.position }}</p>
                      </div>
                      <div v-if="isSelectedMember(getMemberUserId(member)) && getMemberUserId(member) !== organizerUserId" class="text-brand-600">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <div v-else class="text-center py-6 text-slate-400 text-xs">
                그룹을 선택하여 멤버를 추가하세요.
              </div>
            </div>

            <div v-else class="text-center py-6 text-slate-400 text-xs">
              선택 가능한 멤버가 없습니다.
            </div>
          </div>

          <div class="flex min-h-[52px] w-full flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition-all focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
                <span v-for="(person, index) in selectedParticipants" :key="`${person.userId || 'external'}-${person.name}-${index}`"
                      class="animate-fade-in-up flex items-center gap-1.5 rounded-lg border border-brand-100 bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
                  {{ person.name }}
                  <button @click="removeAttendee(index)" class="hover:text-brand-900 rounded-full hover:bg-brand-200 p-0.5 transition-colors">
                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </span>

            <input
                v-model="attendeeInput"
                @keydown.enter.prevent="addAttendee"
                @keydown.backspace="attendeeInput === '' && selectedParticipants.pop()"
                type="text"
                placeholder="외부 이름 직접 입력"
                class="flex-1 bg-transparent focus:outline-none text-sm text-slate-700 placeholder-slate-300 min-w-[80px] h-full py-1"
            >
          </div>
        </div>
      </div>
      <p v-if="formError" class="px-6 pt-3 text-sm font-semibold text-rose-600 sm:px-7">
        {{ formError }}
      </p>
      <div class="flex justify-end gap-2 border-t border-slate-200 bg-white px-6 py-4 sm:px-7">
        <button class="inline-flex items-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-extrabold text-slate-700 transition-colors hover:bg-slate-50" @click="emit('close')">취소</button>
        <button class="inline-flex items-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm shadow-brand-200 transition-colors hover:bg-brand-700" @click="handleSubmit">예약 확정</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.booking-field {
  width: 100%;
  border-radius: 0.95rem;
  border: 1px solid rgb(226, 232, 240);
  background: rgb(248, 250, 252);
  padding: 0.72rem 0.9rem;
  color: rgb(15, 23, 42);
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
}

.booking-select {
  min-width: 0;
  border-radius: 0.95rem;
  border: 1px solid rgb(226, 232, 240);
  background: rgb(248, 250, 252);
  padding: 0.72rem 0.9rem;
  color: rgb(15, 23, 42);
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
}

.booking-field::placeholder {
  color: rgb(148, 163, 184);
}

.booking-field[readonly] {
  color: rgb(71, 85, 105);
  cursor: default;
}

.booking-field:focus,
.booking-select:focus {
  outline: none;
  border-color: rgb(20, 184, 166);
  box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.12);
  background: rgb(255, 255, 255);
}

.custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
.custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: #94a3b8; }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in-up { animation: fadeInUp 0.2s ease-out forwards; }
</style>

