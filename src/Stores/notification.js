import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useNotificationStore = defineStore('notification', () => {
    const notifications = ref([
        {
            id: 1,
            type: 'request',
            title: '면접 일정 확인 요청',
            content: '2024.02.07 (수) 13:00 - 14:30 기술 면접에 참여 요청이 있습니다.',
            dateRaw: '2024-02-07',
            month: 'Feb',
            day: '07',
            applicant: '박지원',
            location: '5층 대회의실 A',
            requester: '김인사',
            timeAgo: '10분 전'
        },
        {
            id: 2,
            type: 'request',
            title: '면접 일정 확인 요청',
            content: '2024.02.08 (목) 10:00 - 11:00 1차 면접에 참여 요청이 있습니다.',
            dateRaw: '2024-02-08',
            month: 'Feb',
            day: '08',
            applicant: '이영희',
            location: '온라인 (Zoom)',
            requester: '김인사',
            timeAgo: '1시간 전'
        },
        {
            id: 3,
            type: 'alert',
            status: 'success',
            title: '일정이 수락되었습니다',
            content: '이팀장님이 2024.02.06 (화) 10:00 면접 일정을 수락했습니다.',
            timeAgo: '어제'
        }
    ])

    const requestCount = computed(() => {
        return notifications.value.filter(n => n.type === 'request').length
    })

    const removeNotification = (id) => {
        notifications.value = notifications.value.filter(n => n.id !== id)
    }

    return { notifications, requestCount, removeNotification }
})