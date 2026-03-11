<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { memberApi } from '@/api/member'
import { groupApi } from '@/api/group'

const props = defineProps({
  isOpen: Boolean,
  initialDate: String,
  initialData: { type: Object, default: null },
  roomOptions: { type: Array, default: () => [] },
  existingSchedules: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'save'])
const members = ref([])
const groups = ref([])
const isMembersLoading = ref(false)
const memberSearchQuery = ref('')
const selectedGroupId = ref(null)

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
      const searchText = [member.name || '', member.groupName || '', member.position || ''].join(' ').toLowerCase()
      return searchText.includes(query)
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
    id: groups.value.find((group) => group.name === groupName)?.id ?? 'group-' + index,
    name: groupName,
    members: groupedMap.get(groupName) ?? []
  }))
})

const currentGroup = computed(
  () => groupedMembers.value.find((group) => String(group.id) === String(selectedGroupId.value)) ?? null
)

const form = ref({
  title: '',
  date: '',
  startTime: '13:00',
  endTime: '14:00',
  type: 'INTERVIEW',
  description: '',
  roomId: null,
  isAllDay: false,
  isBusy: true,
  attendees: [],
  attendeeIds: []
})

const lastTimedRange = ref({ startTime: '13:00', endTime: '14:00' })

const attendeeInput = ref('')
const validationModalOpen = ref(false)
const validationMessage = ref('')

const toggleGroup = (groupId) => {
  selectedGroupId.value = String(selectedGroupId.value) === String(groupId) ? null : String(groupId)
}

const getMemberUserId = (member) => {
  const rawId = Number(member?.userId ?? member?.id)
  return Number.isFinite(rawId) && rawId > 0 ? rawId : null
}

const getMemberName = (member) => String(member?.name ?? '').trim()

const isSelectedMember = (member) => {
  const userId = getMemberUserId(member)
  if (userId && form.value.attendeeIds.includes(userId)) {
    return true
  }

  const name = getMemberName(member)
  return !!name && form.value.attendees.includes(name)
}

const addMemberAttendee = (member) => {
  const name = getMemberName(member)
  const userId = getMemberUserId(member)

  if (name && !form.value.attendees.includes(name)) {
    form.value.attendees.push(name)
  }

  if (userId && !form.value.attendeeIds.includes(userId)) {
    form.value.attendeeIds.push(userId)
  }
}

const removeMemberAttendee = (member) => {
  const name = getMemberName(member)
  const userId = getMemberUserId(member)

  if (name) {
    form.value.attendees = form.value.attendees.filter((attendee) => attendee !== name)
  }

  if (userId) {
    form.value.attendeeIds = form.value.attendeeIds.filter((attendeeId) => attendeeId !== userId)
  }
}

const toggleAttendee = (member) => {
  if (isSelectedMember(member)) {
    removeMemberAttendee(member)
    return
  }

  addMemberAttendee(member)
}

const selectAllGroup = (group) => {
  group.members.forEach((member) => addMemberAttendee(member))
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

const scheduleTypes = [
  { value: 'MEETING', label: '회의', activeClass: 'bg-amber-50 border-amber-200 text-amber-600' },
  { value: 'BUSINESS', label: '외근/출장', activeClass: 'bg-emerald-50 border-emerald-200 text-emerald-600' },
  { value: 'VACATION', label: '휴가', activeClass: 'bg-rose-50 border-rose-200 text-rose-600' },
  { value: 'OTHERS', label: '기타', activeClass: 'bg-slate-100 border-slate-300 text-slate-700' }
]
const isMeetingType = computed(() => form.value.type === 'MEETING')

const toMinutes = (timeValue) => {
  if (!timeValue) return null
  const [hourText = '', minuteText = ''] = String(timeValue).split(':')
  const hour = Number(hourText)
  const minute = Number(minuteText)
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null
  return hour * 60 + minute
}

const normalizeTimeInput = (timeValue, fallback = '00:00') => {
  if (!timeValue) return fallback
  const [hour = '00', minute = '00'] = String(timeValue).split(':')
  return hour.padStart(2, '0') + ':' + minute.padStart(2, '0')
}

// 종일 일정 여부에 따라 충돌 계산용 시간을 정규화한다.
const getEffectiveTimeRange = (target) => {
  if (target?.isAllDay === true) {
    return { startMinutes: 0, endMinutes: 24 * 60 }
  }

  return {
    startMinutes: toMinutes(target?.startTime),
    endMinutes: toMinutes(target?.endTime)
  }
}

const roomSchedulesOnDate = computed(() => {
  const selectedRoomId = Number(form.value.roomId)
  if (!Number.isFinite(selectedRoomId) || !form.value.date) return []

  const editingScheduleId = Number(props.initialData?.id)

  return props.existingSchedules
    .filter((schedule) => {
      const scheduleRoomId = Number(schedule?.roomId)
      if (!Number.isFinite(scheduleRoomId) || scheduleRoomId !== selectedRoomId) return false
      if (schedule?.date !== form.value.date) return false
      if (Number.isFinite(editingScheduleId) && Number(schedule?.id) === editingScheduleId) {
        return false
      }
      return true
    })
    .map((schedule) => ({
      id: schedule.id,
      title: schedule.title || '제목 없음',
      startTime: normalizeTimeInput(schedule.startTime),
      endTime: normalizeTimeInput(schedule.endTime),
      isAllDay: schedule.isAllDay === true
    }))
    .sort((a, b) => (toMinutes(a.startTime) ?? 0) - (toMinutes(b.startTime) ?? 0))
})

const roomSchedulesWithOverlap = computed(() => {
  const { startMinutes, endMinutes } = getEffectiveTimeRange(form.value)
  const hasRange = Number.isFinite(startMinutes) && Number.isFinite(endMinutes) && startMinutes < endMinutes

  return roomSchedulesOnDate.value.map((schedule) => {
    if (!hasRange) {
      return { ...schedule, isOverlap: false }
    }

    const scheduleRange = getEffectiveTimeRange(schedule)
    const isOverlap =
      Number.isFinite(scheduleRange.startMinutes) &&
      Number.isFinite(scheduleRange.endMinutes) &&
      startMinutes < scheduleRange.endMinutes &&
      endMinutes > scheduleRange.startMinutes

    return { ...schedule, isOverlap }
  })
})

const overlappingRoomSchedules = computed(() =>
  roomSchedulesWithOverlap.value.filter((schedule) => schedule.isOverlap)
)

watch(
  () => props.isOpen,
  (newVal) => {
    if (!newVal) return

    if (props.initialData) {
      const initialStartTime = normalizeTimeInput(props.initialData.startTime, '13:00')
      const initialEndTime = normalizeTimeInput(props.initialData.endTime, '14:00')

      form.value = {
        ...props.initialData,
        date: props.initialData.date || props.initialDate || new Date().toISOString().split('T')[0],
        startTime: initialStartTime,
        endTime: initialEndTime,
        roomId: props.initialData.roomId ?? null,
        isAllDay: props.initialData.isAllDay === true,
        isBusy: props.initialData.isBusy !== false,
        attendees: Array.isArray(props.initialData.attendees) ? [...props.initialData.attendees] : [],
        attendeeIds: Array.isArray(props.initialData.attendeeIds)
          ? props.initialData.attendeeIds.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0)
          : []
      }

      lastTimedRange.value = {
        startTime: props.initialData.isAllDay === true ? '13:00' : initialStartTime,
        endTime: props.initialData.isAllDay === true ? '14:00' : initialEndTime
      }
    } else {
      form.value = {
        title: '',
        date: props.initialDate || new Date().toISOString().split('T')[0],
        startTime: '13:00',
        endTime: '14:00',
        type: 'MEETING',
        description: '',
        roomId: null,
        isAllDay: false,
        isBusy: true,
        attendees: [],
        attendeeIds: []
      }

      lastTimedRange.value = { startTime: '13:00', endTime: '14:00' }
    }

    attendeeInput.value = ''
    selectedGroupId.value = null
    memberSearchQuery.value = ''
  }
)

watch(
  () => form.value.isAllDay,
  (isAllDay, wasAllDay) => {
    if (!props.isOpen) return

    if (isAllDay) {
      if (!wasAllDay && form.value.startTime !== '00:00' && form.value.endTime !== '00:00') {
        lastTimedRange.value = {
          startTime: normalizeTimeInput(form.value.startTime, '13:00'),
          endTime: normalizeTimeInput(form.value.endTime, '14:00')
        }
      }
      form.value.startTime = '00:00'
      form.value.endTime = '00:00'
      return
    }

    if (wasAllDay) {
      form.value.startTime = lastTimedRange.value.startTime
      form.value.endTime = lastTimedRange.value.endTime
    }
  }
)

watch(
  () => [form.value.startTime, form.value.endTime, form.value.isAllDay],
  ([startTime, endTime, isAllDay]) => {
    if (isAllDay) return

    const normalizedStart = normalizeTimeInput(startTime, '13:00')
    const normalizedEnd = normalizeTimeInput(endTime, '14:00')

    if (normalizedStart === '00:00' && normalizedEnd === '00:00') {
      return
    }

    lastTimedRange.value = { startTime: normalizedStart, endTime: normalizedEnd }
  }
)

const addAttendee = () => {
  const name = attendeeInput.value.trim()
  if (name && !form.value.attendees.includes(name)) {
    form.value.attendees.push(name)
  }
  attendeeInput.value = ''
}

const removeAttendee = (index) => {
  const removed = form.value.attendees.splice(index, 1)
  const removedName = removed[0]
  if (!removedName) return

  const matchedUserIds = members.value
    .filter((member) => getMemberName(member) === removedName)
    .map((member) => getMemberUserId(member))
    .filter((id) => Number.isFinite(id) && id > 0)

  if (matchedUserIds.length === 0) return

  form.value.attendeeIds = form.value.attendeeIds.filter((attendeeId) => !matchedUserIds.includes(attendeeId))
}

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

  if (!form.value.isAllDay && (!form.value.startTime || !form.value.endTime)) {
    openValidationModal('시작 시간과 종료 시간을 모두 입력해주세요.')
    return
  }

  if (!form.value.isAllDay) {
    const startMinutes = toMinutes(form.value.startTime)
    const endMinutes = toMinutes(form.value.endTime)

    if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes) || startMinutes >= endMinutes) {
      openValidationModal('종료 시간은 시작 시간보다 늦어야 합니다.')
      return
    }
  }

  if (isMeetingType.value && overlappingRoomSchedules.value.length > 0) {
    openValidationModal('선택한 회의실은 해당 시간에 이미 예약이 있습니다. 시간 또는 회의실을 변경해주세요.')
    return
  }

  const payload = { ...form.value }
  if (!isMeetingType.value) {
    payload.roomId = null
  } else {
    const rawRoomId = payload.roomId
    if (rawRoomId === null || rawRoomId === '' || rawRoomId === undefined) {
      payload.roomId = null
    } else {
      const parsedRoomId = Number(rawRoomId)
      payload.roomId = Number.isFinite(parsedRoomId) && parsedRoomId > 0 ? parsedRoomId : null
    }
  }

  payload.attendeeIds = [...new Set((payload.attendeeIds || []).map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0))]
  emit('save', payload)
}

const handleKeydown = (e) => {
  if (e.key === 'Escape' && props.isOpen) emit('close')
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
onMounted(() => {
  loadMembers()
})
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
            <input
              v-model="form.title"
              type="text"
              placeholder="예: 2차 기술 면접"
              class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-slate-700 font-bold placeholder-slate-400 transition-all text-base"
              autofocus
            >
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">일정 타입</label>
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="item in scheduleTypes"
                :key="item.value"
                @click="form.type = item.value"
                class="py-2.5 rounded-lg text-xs font-bold border transition-all shadow-sm hover:shadow-md"
                :class="form.type === item.value ? item.activeClass : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'"
              >
                {{ item.label }}
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">일정 옵션</label>
            <div class="grid grid-cols-2 gap-3">
              <button
                @click="form.isAllDay = !form.isAllDay"
                class="flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-bold transition-all"
                :class="form.isAllDay ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'"
              >
                <span>종일</span>
                <span class="text-xs" :class="form.isAllDay ? 'text-brand-600' : 'text-slate-400'">{{ form.isAllDay ? '켜짐' : '꺼짐' }}</span>
              </button>
              <button
                @click="form.isBusy = !form.isBusy"
                class="flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-bold transition-all"
                :class="form.isBusy ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'"
              >
                <span>바쁨 표시</span>
                <span class="text-xs" :class="form.isBusy ? 'text-rose-600' : 'text-slate-400'">{{ form.isBusy ? '바쁨' : '한가함' }}</span>
              </button>
            </div>
            <p class="mt-2 text-[11px] text-slate-500">
              {{ form.isAllDay ? '종일 일정은 선택한 날짜 00:00부터 다음 날 00:00까지 저장됩니다.' : '시간이 지정된 일정으로 저장됩니다.' }}
            </p>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">날짜</label>
              <div class="relative">
                <input v-model="form.date" type="date" class="w-full pl-4 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none font-medium text-sm shadow-sm">
              </div>
            </div>

            <div v-if="form.isAllDay" class="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700">
              선택한 날짜 전체가 종일 일정으로 저장됩니다. 시간 입력은 자동으로 00:00부터 다음 날 00:00까지 처리됩니다.
            </div>

            <div v-else class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">시작 시간</label>
                <input v-model="form.startTime" type="time" class="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none text-sm font-medium text-center shadow-sm">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">종료 시간</label>
                <input v-model="form.endTime" type="time" class="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none text-sm font-medium text-center shadow-sm">
              </div>
            </div>
          </div>
          <div v-if="isMeetingType">
            <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">회의실 선택</label>
            <select v-model="form.roomId" class="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none text-sm font-medium shadow-sm">
              <option :value="null">선택 안 함</option>
              <option v-for="room in roomOptions" :key="room.id" :value="room.id">
                {{ room.name }} ({{ room.location ?? room.floor ?? '-' }}층 / {{ room.capacity }}명)
              </option>
            </select>
            <p class="mt-1.5 text-[11px] text-slate-500">회의실을 선택해 일정을 생성하면 회의실 예약 캘린더에도 반영됩니다.</p>

            <div v-if="form.roomId" class="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div class="mb-2 flex items-center justify-between">
                <p class="text-[11px] font-bold text-slate-600">선택 회의실 일정</p>
                <span class="text-[11px] text-slate-500">{{ form.date || '날짜 미선택' }}</span>
              </div>

              <p v-if="overlappingRoomSchedules.length > 0" class="mb-2 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-[11px] font-semibold text-rose-700">
                현재 입력 시간과 겹치는 예약이 {{ overlappingRoomSchedules.length }}건 있습니다.
              </p>

              <p v-if="roomSchedulesWithOverlap.length === 0" class="text-[11px] text-slate-500">
                해당 날짜에는 예약된 일정이 없습니다.
              </p>

              <div v-else class="max-h-40 space-y-1.5 overflow-y-auto pr-1 custom-scrollbar">
                <div
                  v-for="schedule in roomSchedulesWithOverlap"
                  :key="schedule.id"
                  class="rounded-lg border px-2.5 py-2 text-[11px]"
                  :class="schedule.isOverlap ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white'"
                >
                  <div class="flex items-center justify-between gap-2">
                    <span class="font-bold text-slate-700">{{ schedule.isAllDay ? '종일' : schedule.startTime + ' - ' + schedule.endTime }}</span>
                    <span v-if="schedule.isOverlap" class="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">겹침</span>
                  </div>
                  <p class="mt-1 truncate text-slate-600">{{ schedule.title }}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">참석자 선택</label>

            <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 mb-3">
              <input
                v-model="memberSearchQuery"
                type="text"
                placeholder="실제 멤버 이름으로 검색"
                class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              >

              <div v-if="isMembersLoading" class="text-center py-6 text-slate-400 text-xs">
                멤버 목록을 불러오는 중입니다.
              </div>

              <div v-else class="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                <button
                  v-for="group in groupedMembers"
                  :key="group.id"
                  @click="toggleGroup(group.id)"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border shrink-0"
                  :class="String(selectedGroupId) === String(group.id) ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'"
                >
                  {{ group.name }}
                </button>
              </div>

              <div v-if="currentGroup" class="space-y-3 animate-fade-in-up">
                <div>
                  <h4 class="text-[11px] font-bold text-slate-400 mb-2 flex items-center gap-2">
                    {{ currentGroup.name }}
                    <button @click="selectAllGroup(currentGroup)" class="text-[10px] text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded hover:bg-brand-100 transition-colors">전체 선택</button>
                  </h4>
                  <div class="grid grid-cols-2 gap-2">
                    <button
                      v-for="member in currentGroup.members"
                      :key="getMemberUserId(member) ?? member.id ?? member.name"
                      @click="toggleAttendee(member)"
                      class="flex items-center gap-2 p-2 rounded-lg border text-left transition-all group"
                      :class="isSelectedMember(member) ? 'bg-brand-50 border-brand-200 ring-1 ring-brand-200' : 'bg-white border-slate-200 hover:border-brand-200'"
                    >
                      <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                           :class="isSelectedMember(member) ? 'bg-brand-200 text-brand-700' : 'bg-slate-100 text-slate-500'">
                        {{ member.name[0] }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-xs font-bold text-slate-700 truncate" :class="{ 'text-brand-700': isSelectedMember(member) }">{{ member.name }}</p>
                        <p class="text-[10px] text-slate-400 truncate">{{ member.position }}</p>
                      </div>
                      <div v-if="isSelectedMember(member)" class="text-brand-600">
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
                @keydown.backspace="attendeeInput === '' && form.attendees.length > 0 && removeAttendee(form.attendees.length - 1)"
                type="text"
                placeholder="외부 이름 직접 입력"
                class="flex-1 bg-transparent focus:outline-none text-sm text-slate-700 placeholder-slate-300 min-w-[80px] h-full py-1"
              >
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">메모 / 장소</label>
            <textarea v-model="form.description" rows="3" placeholder="장소나 상세 내용을 입력하세요."
                      class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm text-slate-700 resize-none shadow-inner"></textarea>
          </div>
        </div>

        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button @click="$emit('close')" class="px-5 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-200 hover:text-slate-700 rounded-lg transition-all">취소</button>
          <button @click="save" class="px-6 py-2.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-all transform active:scale-95">
            {{ initialData ? '수정 완료' : '일정 생성' }}
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
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
.custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: #94a3b8; }
</style>
