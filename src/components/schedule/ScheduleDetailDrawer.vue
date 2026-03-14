<script setup>
import { computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  isOpen: Boolean,
  event: Object,
  showActions: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['close', 'edit', 'delete'])

const typeLabel = computed(() => {
  const labels = {
    INTERVIEW: '면접',
    MEETING: '회의',
    BUSINESS: '외근/출장',
    VACATION: '휴가',
    OTHERS: '기타'
  }

  return labels[props.event?.type] || props.event?.type || '일정'
})

const badgeClass = computed(() => {
  const type = props.event?.type

  if (type === 'INTERVIEW') return 'drawer-badge drawer-badge-interview'
  if (type === 'VACATION') return 'drawer-badge drawer-badge-vacation'
  if (type === 'BUSINESS') return 'drawer-badge drawer-badge-business'
  if (type === 'MEETING') return 'drawer-badge drawer-badge-meeting'
  return 'drawer-badge drawer-badge-default'
})

const canShowActions = computed(() => {
  return props.showActions && !props.event?.interviewScheduleId
})

const detailSections = computed(() => {
  return [
    {
      label: '일시',
      value: `${props.event?.date || '-'} · ${props.event?.isAllDay ? '종일' : props.event?.time || '-'}`,
      icon: 'time'
    },
    {
      label: '장소',
      value: props.event?.room
        ? `${props.event.room.name} (${props.event.room.floor}층)`
        : props.event?.location || '지정된 장소 없음',
      icon: 'location',
      accent: true
    },
    {
      label: '메모',
      value: props.event?.description || '상세 내용이 없습니다.',
      icon: 'note'
    },
    {
      label: '생성자',
      value: props.event?.ownerName || '생성자 정보 없음',
      icon: 'owner'
    }
  ]
})

const attendeeLabels = computed(() => {
  const attendees = Array.isArray(props.event?.attendees) ? props.event.attendees.filter(Boolean) : []
  if (!attendees.length) return ['참석자가 없습니다.']
  return attendees
})

const closeOnBackdrop = (e) => {
  if (e.target === e.currentTarget) emit('close')
}

const handleKeydown = (e) => {
  if (e.key === 'Escape' && props.isOpen) emit('close')
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="isOpen" class="fixed inset-0 z-[80]" @click="closeOnBackdrop">
      <div class="absolute inset-0 bg-slate-950/28 backdrop-blur-[2px]"></div>

      <Transition
        enter-active-class="transition duration-220 ease-out"
        enter-from-class="translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transition duration-180 ease-in"
        leave-from-class="translate-x-0"
        leave-to-class="translate-x-full"
      >
        <aside
          v-if="isOpen"
          class="drawer-panel absolute right-0 top-0 h-full w-full max-w-[460px] overflow-hidden"
        >
          <div class="drawer-surface flex h-full flex-col">
            <header class="drawer-header">
              <div class="space-y-3">
                <span :class="badgeClass">{{ typeLabel }}</span>
                <div>
                  <h3 class="text-[1.35rem] font-black leading-tight text-slate-950">
                    {{ event?.title || '일정 상세' }}
                  </h3>
                  <p class="mt-2 text-sm leading-6 text-slate-500">
                    목록 흐름을 벗어나지 않고 필요한 일정 정보만 빠르게 확인할 수 있어요.
                  </p>
                </div>
              </div>

              <button
                type="button"
                class="drawer-close-button"
                @click="$emit('close')"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </header>

            <div class="drawer-body custom-scrollbar flex-1 overflow-y-auto px-6 py-5">
              <section class="drawer-grid">
                <article
                  v-for="section in detailSections"
                  :key="section.label"
                  class="drawer-detail-card"
                >
                  <div class="drawer-detail-head">
                    <span class="drawer-detail-icon" :class="{ 'drawer-detail-icon-accent': section.accent }">
                      <svg v-if="section.icon === 'time'" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <svg v-else-if="section.icon === 'location'" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <svg v-else-if="section.icon === 'owner'" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A6 6 0 1118.879 17.8M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <svg v-else class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h6m-6 4h10" />
                      </svg>
                    </span>
                    <span class="drawer-detail-label">{{ section.label }}</span>
                  </div>
                  <p class="drawer-detail-value" :class="{ 'drawer-detail-value-accent': section.accent }">
                    {{ section.value }}
                  </p>
                </article>
              </section>

              <section class="mt-5 space-y-5">
                <article class="drawer-detail-card">
                  <div class="drawer-detail-head">
                    <span class="drawer-detail-icon">
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6l4 2" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12a7 7 0 1014 0 7 7 0 00-14 0z" />
                      </svg>
                    </span>
                    <span class="drawer-detail-label">상태</span>
                  </div>
                  <div class="mt-3 flex flex-wrap gap-2">
                    <span class="drawer-chip" :class="event?.isAllDay ? 'drawer-chip-teal' : 'drawer-chip-default'">
                      {{ event?.isAllDay ? '종일 일정' : '시간 지정 일정' }}
                    </span>
                    <span class="drawer-chip" :class="event?.isBusy === false ? 'drawer-chip-emerald' : 'drawer-chip-rose'">
                      {{ event?.isBusy === false ? '한가함' : '바쁨' }}
                    </span>
                  </div>
                </article>

                <article class="drawer-detail-card">
                  <div class="drawer-detail-head">
                    <span class="drawer-detail-icon">
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-1a4 4 0 00-5.356-3.773M9 20H4v-1a4 4 0 015.356-3.773M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </span>
                    <span class="drawer-detail-label">참석자</span>
                  </div>
                  <div class="mt-3 flex flex-wrap gap-2">
                    <span
                      v-for="attendee in attendeeLabels"
                      :key="attendee"
                      class="drawer-chip"
                      :class="attendee === '참석자가 없습니다.' ? 'drawer-chip-default' : 'drawer-chip-teal-soft'"
                    >
                      {{ attendee }}
                    </span>
                  </div>
                </article>

                <article v-if="event?.applicantName" class="drawer-detail-card">
                  <div class="drawer-detail-head">
                    <span class="drawer-detail-icon drawer-detail-icon-accent">
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A6 6 0 1118.879 17.8M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </span>
                    <span class="drawer-detail-label">지원자</span>
                  </div>
                  <div class="mt-3">
                    <span class="drawer-chip drawer-chip-violet">{{ event.applicantName }}</span>
                  </div>
                </article>
              </section>
            </div>

            <footer v-if="canShowActions" class="drawer-footer">
              <button
                type="button"
                class="drawer-secondary-button"
                @click="$emit('delete', event.id)"
              >
                삭제
              </button>
              <button
                type="button"
                class="drawer-primary-button"
                @click="$emit('edit', event)"
              >
                수정하기
              </button>
            </footer>
          </div>
        </aside>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
.drawer-panel {
  pointer-events: auto;
}

.drawer-surface {
  height: 100%;
  border-left: 1px solid rgba(226, 232, 240, 0.8);
  background:
    radial-gradient(circle at top right, rgba(20, 184, 166, 0.14), transparent 28%),
    linear-gradient(180deg, rgba(251, 253, 253, 0.99), rgba(245, 248, 249, 0.98));
  box-shadow: -18px 0 48px rgba(15, 23, 42, 0.16);
}

.drawer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid rgba(226, 232, 240, 0.82);
  padding: 1.5rem;
}

.drawer-close-button {
  display: inline-flex;
  height: 2.5rem;
  width: 2.5rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: 1px solid rgba(226, 232, 240, 0.92);
  background: rgba(255, 255, 255, 0.92);
  color: rgb(100, 116, 139);
  transition: all 0.18s ease;
}

.drawer-close-button:hover {
  color: rgb(15, 23, 42);
  border-color: rgba(148, 163, 184, 0.9);
}

.drawer-grid {
  display: grid;
  gap: 0.85rem;
}

.drawer-detail-card {
  border: 1px solid rgba(226, 232, 240, 0.86);
  border-radius: 1.15rem;
  background: rgba(255, 255, 255, 0.9);
  padding: 0.95rem 1rem;
}

.drawer-detail-head {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.drawer-detail-icon {
  display: inline-flex;
  height: 2rem;
  width: 2rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: rgba(241, 245, 249, 0.95);
  color: rgb(71, 85, 105);
}

.drawer-detail-icon-accent {
  background: rgba(223, 247, 241, 0.96);
  color: rgb(15, 118, 110);
}

.drawer-detail-label {
  font-size: 0.74rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgb(100, 116, 139);
}

.drawer-detail-value {
  margin-top: 0.8rem;
  font-size: 0.94rem;
  line-height: 1.6;
  color: rgb(30, 41, 59);
  white-space: pre-wrap;
}

.drawer-detail-value-accent {
  color: rgb(15, 118, 110);
  font-weight: 800;
}

.drawer-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  padding: 0.42rem 0.8rem;
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.drawer-badge-interview {
  background: rgba(224, 231, 255, 0.96);
  color: rgb(67, 56, 202);
}

.drawer-badge-meeting {
  background: rgba(254, 243, 199, 0.96);
  color: rgb(180, 83, 9);
}

.drawer-badge-business {
  background: rgba(209, 250, 229, 0.96);
  color: rgb(5, 150, 105);
}

.drawer-badge-vacation {
  background: rgba(255, 228, 230, 0.96);
  color: rgb(225, 29, 72);
}

.drawer-badge-default {
  background: rgba(241, 245, 249, 0.96);
  color: rgb(71, 85, 105);
}

.drawer-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  padding: 0.4rem 0.75rem;
  font-size: 0.74rem;
  font-weight: 700;
}

.drawer-chip-default {
  background: rgba(241, 245, 249, 0.96);
  color: rgb(71, 85, 105);
}

.drawer-chip-teal {
  background: rgba(223, 247, 241, 0.96);
  color: rgb(15, 118, 110);
}

.drawer-chip-teal-soft {
  background: rgba(240, 253, 250, 0.98);
  color: rgb(15, 118, 110);
}

.drawer-chip-emerald {
  background: rgba(220, 252, 231, 0.96);
  color: rgb(22, 101, 52);
}

.drawer-chip-rose {
  background: rgba(255, 228, 230, 0.96);
  color: rgb(190, 24, 93);
}

.drawer-chip-violet {
  background: rgba(245, 243, 255, 0.98);
  color: rgb(109, 40, 217);
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  border-top: 1px solid rgba(226, 232, 240, 0.82);
  background: rgba(255, 255, 255, 0.92);
  padding: 1rem 1.5rem 1.25rem;
}

.drawer-secondary-button,
.drawer-primary-button {
  border-radius: 9999px;
  padding: 0.75rem 1.1rem;
  font-size: 0.84rem;
  font-weight: 900;
  transition: all 0.18s ease;
}

.drawer-secondary-button {
  color: rgb(225, 29, 72);
}

.drawer-secondary-button:hover {
  background: rgba(255, 241, 242, 0.95);
}

.drawer-primary-button {
  background: linear-gradient(135deg, rgb(15, 118, 110), rgb(20, 184, 166));
  color: white;
  box-shadow: 0 12px 24px rgba(15, 118, 110, 0.2);
}

.drawer-primary-button:hover {
  filter: saturate(1.04);
}

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
.custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: #94a3b8; }
</style>
