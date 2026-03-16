<script setup>
import { computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  open: { type: Boolean, required: true },
  booking: { type: Object, default: null },
  room: { type: Object, default: null }
})

const emit = defineEmits(['close', 'delete'])

const labels = {
  confirmed: '확정',
  pending: '대기',
  cancelled: '취소',
  datetime: '일시',
  room: '회의실',
  organizer: '주최자',
  interviewers: '면접관',
  applicants: '지원자',
  attendees: '참석자',
  description: '설명',
  delete: '삭제',
  close: '닫기',
  dot: '·',
  year: '년',
  month: '월',
  day: '일',
  people: '인',
  floor: '층'
}

const normalizeTitle = (value) => String(value || '').replace(/\s+/g, ' ').trim()

const displayTitle = computed(() => {
  const title = normalizeTitle(props.booking?.title)
  if (!title) return '회의실 예약 상세'

  const [first, ...rest] = title.split(' - ')
  const trailing = rest.join(' - ').trim()

  if (first && trailing && trailing.startsWith(first)) {
    const suffix = trailing.slice(first.length).replace(/^[·\-\s]+/, '').trim()
    return suffix ? `${first} · ${suffix}` : first
  }

  return title
})

const statusBadgeClass = computed(() => {
  if (props.booking?.status === 'confirmed') return 'drawer-badge-confirmed'
  if (props.booking?.status === 'pending') return 'drawer-badge-pending'
  return 'drawer-badge-cancelled'
})

const closeOnBackdrop = (event) => {
  if (event.target === event.currentTarget) emit('close')
}

const handleKeydown = (event) => {
  if (event.key === 'Escape' && props.open) emit('close')
}

const formatTime = (date) => {
  if (!date) return ''
  const value = date instanceof Date ? date : new Date(date)
  const h = `${value.getHours()}`.padStart(2, '0')
  const m = `${value.getMinutes()}`.padStart(2, '0')
  return `${h}:${m}`
}

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}${labels.year} ${d.getMonth() + 1}${labels.month} ${d.getDate()}${labels.day}`
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
    <div v-if="open" class="fixed inset-0 z-[80]" @click="closeOnBackdrop">
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
          v-if="open"
          class="drawer-panel absolute right-0 top-0 h-full w-full max-w-[460px] overflow-hidden"
        >
          <div class="drawer-surface flex h-full flex-col">
            <header class="drawer-header">
              <div class="min-w-0 flex-1 space-y-2">
                <span class="drawer-badge" :class="statusBadgeClass">
                  {{
                    booking?.status === 'confirmed'
                      ? labels.confirmed
                      : booking?.status === 'pending'
                        ? labels.pending
                        : labels.cancelled
                  }}
                </span>
                <div class="min-w-0">
                  <h3 class="break-words text-[1.35rem] font-black leading-tight text-slate-950">
                    {{ displayTitle }}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                class="drawer-close-button shrink-0"
                aria-label="닫기"
                @click="emit('close')"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </header>

            <div class="drawer-body custom-scrollbar flex-1 overflow-y-auto px-6 py-5">
              <section class="drawer-grid">
                <article class="drawer-detail-card">
                  <div class="drawer-detail-head">
                    <span class="drawer-detail-icon">
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    <span class="drawer-detail-label">{{ labels.datetime }}</span>
                  </div>
                  <p class="drawer-detail-value">
                    {{ formatDate(booking?.startTime) }} {{ labels.dot }} {{ formatTime(booking?.startTime) }} - {{ formatTime(booking?.endTime) }}
                  </p>
                </article>

                <article class="drawer-detail-card">
                  <div class="drawer-detail-head">
                    <span class="drawer-detail-icon drawer-detail-icon-accent">
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </span>
                    <span class="drawer-detail-label">{{ labels.room }}</span>
                  </div>
                  <p class="drawer-detail-value drawer-detail-value-accent">
                    {{ room?.name }} {{ labels.dot }} {{ room?.capacity }}{{ labels.people }} {{ labels.dot }} {{ room?.floor }}{{ labels.floor }}
                  </p>
                </article>

                <article class="drawer-detail-card">
                  <div class="drawer-detail-head">
                    <span class="drawer-detail-icon">
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </span>
                    <span class="drawer-detail-label">{{ labels.organizer }}</span>
                  </div>
                  <p class="drawer-detail-value">{{ booking?.organizer || '-' }}</p>
                </article>

                <article v-if="booking?.description" class="drawer-detail-card">
                  <div class="drawer-detail-head">
                    <span class="drawer-detail-icon">
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h10M7 16h6" />
                      </svg>
                    </span>
                    <span class="drawer-detail-label">{{ labels.description }}</span>
                  </div>
                  <p class="drawer-detail-value">{{ booking.description }}</p>
                </article>
              </section>

              <section class="mt-5 space-y-5">
                <article v-if="booking?.interviewers?.length" class="drawer-detail-card">
                  <div class="drawer-detail-head">
                    <span class="drawer-detail-icon">
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </span>
                    <span class="drawer-detail-label">{{ labels.interviewers }}</span>
                  </div>
                  <div class="mt-3 flex flex-wrap gap-2">
                    <span
                      v-for="(att, idx) in booking.interviewers"
                      :key="`interviewer-${idx}`"
                      class="drawer-chip drawer-chip-teal-soft"
                    >
                      {{ att }}
                    </span>
                  </div>
                </article>

                <article v-if="booking?.applicants?.length" class="drawer-detail-card">
                  <div class="drawer-detail-head">
                    <span class="drawer-detail-icon drawer-detail-icon-accent">
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A6 6 0 1118.879 17.8M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </span>
                    <span class="drawer-detail-label">{{ labels.applicants }}</span>
                  </div>
                  <div class="mt-3 flex flex-wrap gap-2">
                    <span
                      v-for="(att, idx) in booking.applicants"
                      :key="`applicant-${idx}`"
                      class="drawer-chip drawer-chip-violet"
                    >
                      {{ att }}
                    </span>
                  </div>
                </article>

                <article v-if="!booking?.interviewers?.length && !booking?.applicants?.length && booking?.attendees?.length" class="drawer-detail-card">
                  <div class="drawer-detail-head">
                    <span class="drawer-detail-icon">
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </span>
                    <span class="drawer-detail-label">{{ labels.attendees }}</span>
                  </div>
                  <div class="mt-3 flex flex-wrap gap-2">
                    <span
                      v-for="(att, idx) in booking.attendees"
                      :key="`attendee-${idx}`"
                      class="drawer-chip drawer-chip-default"
                    >
                      {{ att }}
                    </span>
                  </div>
                </article>
              </section>
            </div>

            <footer class="drawer-footer">
              <button
                v-if="!booking?.interviewScheduleId"
                type="button"
                class="drawer-secondary-button"
                @click="emit('delete', booking?.id)"
              >
                {{ labels.delete }}
              </button>
              <button type="button" class="drawer-primary-button" @click="emit('close')">
                {{ labels.close }}
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

.drawer-badge-confirmed {
  background: rgba(224, 231, 255, 0.96);
  color: rgb(67, 56, 202);
}

.drawer-badge-pending {
  background: rgba(254, 243, 199, 0.96);
  color: rgb(180, 83, 9);
}

.drawer-badge-cancelled {
  background: rgba(255, 228, 230, 0.96);
  color: rgb(225, 29, 72);
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

.drawer-chip-teal-soft {
  background: rgba(240, 253, 250, 0.98);
  color: rgb(15, 118, 110);
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

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 20px;
}

.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background-color: #94a3b8;
}
</style>
