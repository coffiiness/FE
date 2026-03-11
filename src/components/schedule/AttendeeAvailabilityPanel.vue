<script setup>
import { computed, ref, watch } from 'vue'
import { useScheduleStore } from '@/stores/schedule'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  date: { type: String, default: '' },
  attendeeIds: { type: Array, default: () => [] },
  isAllDay: { type: Boolean, default: false },
  startTime: { type: String, default: '' },
  endTime: { type: String, default: '' }
})

const scheduleStore = useScheduleStore()
const attendeeAvailabilities = ref([])
const isLoading = ref(false)
const hasLoadError = ref(false)
let requestSequence = 0

const toMinutes = (timeValue) => {
  if (!timeValue) return null
  const [hourText = '', minuteText = ''] = String(timeValue).split(':')
  const hour = Number(hourText)
  const minute = Number(minuteText)
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null
  return hour * 60 + minute
}

const normalizedAttendeeIds = computed(() =>
  [...new Set(
    (props.attendeeIds || [])
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0)
  )]
)

const normalizedAttendeeKey = computed(() => normalizedAttendeeIds.value.join(','))
const shouldShow = computed(() => props.isOpen && !!props.date && normalizedAttendeeIds.value.length > 0)

const getEffectiveTimeRange = () => {
  if (props.isAllDay) {
    return { startMinutes: 0, endMinutes: 24 * 60 }
  }

  return {
    startMinutes: toMinutes(props.startTime),
    endMinutes: toMinutes(props.endTime)
  }
}

const getDatePart = (dateTimeValue) => String(dateTimeValue || '').split('T')[0] || ''
const getTimePart = (dateTimeValue) => {
  const [, timePart = ''] = String(dateTimeValue || '').split('T')
  return timePart.slice(0, 5)
}

const getScheduleRange = (schedule) => {
  if (schedule.isAllDay) {
    return { startMinutes: 0, endMinutes: 24 * 60 }
  }

  const startDatePart = getDatePart(schedule.startDateTime)
  const endDatePart = getDatePart(schedule.endDateTime)

  const startMinutes =
    startDatePart && startDatePart < props.date
      ? 0
      : toMinutes(getTimePart(schedule.startDateTime))

  const endMinutes =
    endDatePart && endDatePart > props.date
      ? 24 * 60
      : toMinutes(getTimePart(schedule.endDateTime))

  return {
    startMinutes: Number.isFinite(startMinutes) ? startMinutes : 0,
    endMinutes: Number.isFinite(endMinutes) ? endMinutes : 24 * 60
  }
}

const formatTimeLabel = (schedule) => {
  if (schedule.isAllDay) {
    return '종일'
  }

  const startTime = getTimePart(schedule.startDateTime) || '00:00'
  const endTime = getTimePart(schedule.endDateTime) || '00:00'
  return `${startTime} - ${endTime}`
}

const attendeeCards = computed(() => {
  const { startMinutes, endMinutes } = getEffectiveTimeRange()
  const hasRange = Number.isFinite(startMinutes) && Number.isFinite(endMinutes) && startMinutes < endMinutes

  return attendeeAvailabilities.value.map((attendee) => ({
    ...attendee,
    busySchedules: attendee.busySchedules.map((schedule) => {
      const scheduleRange = getScheduleRange(schedule)
      const isOverlap =
        props.isAllDay || (
          hasRange &&
          startMinutes < scheduleRange.endMinutes &&
          endMinutes > scheduleRange.startMinutes
        )

      return {
        ...schedule,
        timeLabel: formatTimeLabel(schedule),
        isOverlap
      }
    })
  }))
})

const overlappingBusyScheduleCount = computed(() =>
  attendeeCards.value.reduce(
    (count, attendee) => count + attendee.busySchedules.filter((schedule) => schedule.isOverlap).length,
    0
  )
)

const loadAvailability = async () => {
  if (!shouldShow.value) {
    attendeeAvailabilities.value = []
    hasLoadError.value = false
    isLoading.value = false
    requestSequence += 1
    return
  }

  const currentRequest = ++requestSequence
  isLoading.value = true
  hasLoadError.value = false

  try {
    const data = await scheduleStore.getAttendeeAvailability(props.date, normalizedAttendeeIds.value)
    if (currentRequest !== requestSequence) return
    attendeeAvailabilities.value = data
  } catch (error) {
    if (currentRequest !== requestSequence) return
    attendeeAvailabilities.value = []
    hasLoadError.value = true
    console.error('참석자 일정 현황 조회 실패:', error)
  } finally {
    if (currentRequest === requestSequence) {
      isLoading.value = false
    }
  }
}

watch(
  [() => props.isOpen, () => props.date, () => normalizedAttendeeKey.value],
  () => {
    loadAvailability()
  },
  { immediate: true }
)
</script>

<template>
  <div v-if="shouldShow" class="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
    <div class="flex items-center justify-between gap-3">
      <div>
        <p class="text-[11px] font-bold text-slate-600">선택 참석자 일정 현황</p>
        <p class="mt-1 text-[11px] text-slate-500">{{ date }}</p>
      </div>
      <span class="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500">
        {{ normalizedAttendeeIds.length }}명
      </span>
    </div>

    <p
      v-if="!isLoading && overlappingBusyScheduleCount > 0"
      class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-700"
    >
      현재 입력 시간과 겹치는 참석자 일정이 {{ overlappingBusyScheduleCount }}건 있습니다.
    </p>

    <p v-if="isLoading" class="text-[11px] text-slate-500">
      참석자 일정 현황을 불러오는 중입니다.
    </p>

    <p
      v-else-if="hasLoadError"
      class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700"
    >
      참석자 일정 현황을 불러오지 못했습니다.
    </p>

    <div v-else class="space-y-3">
      <div
        v-for="attendee in attendeeCards"
        :key="attendee.attendeeId"
        class="rounded-xl border border-slate-200 bg-white p-3"
      >
        <div class="mb-2 flex items-center justify-between gap-3">
          <h4 class="text-sm font-bold text-slate-700">{{ attendee.attendeeName }}</h4>
          <span class="text-[10px] font-bold text-slate-400">{{ attendee.busySchedules.length }}건</span>
        </div>

        <p v-if="attendee.busySchedules.length === 0" class="text-[11px] text-slate-500">
          등록된 바쁜 일정이 없습니다.
        </p>

        <div v-else class="space-y-1.5">
          <div
            v-for="schedule in attendee.busySchedules"
            :key="schedule.scheduleId"
            class="rounded-lg border px-2.5 py-2 text-[11px]"
            :class="schedule.isOverlap ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="font-bold text-slate-700">{{ schedule.timeLabel }}</span>
              <span
                v-if="schedule.isOverlap"
                class="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700"
              >
                겹침
              </span>
            </div>
            <p class="mt-1 truncate text-slate-600">{{ schedule.title }}</p>
          </div>
        </div>
      </div>

      <p
        v-if="attendeeCards.length > 0 && attendeeCards.every((attendee) => attendee.busySchedules.length === 0)"
        class="text-[11px] text-slate-500"
      >
        선택한 참석자에게 등록된 바쁜 일정이 없습니다.
      </p>
    </div>
  </div>
</template>