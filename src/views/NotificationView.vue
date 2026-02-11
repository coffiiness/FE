<script setup>
/**
 * 알림 페이지 스크립트
 * 추후 백엔드 API 연결 시 여기서 데이터를 fetch 합니다.
 */
import { ref } from 'vue'

const notificationCount = ref(3)
</script>

<template>
  <div class="max-w-4xl mx-auto p-6 bg-white min-h-screen">
    <h1 class="text-2xl font-bold mb-6 text-slate-900">알림</h1>

    <div class="flex border-b border-gray-200 mb-6">
      <button class="px-6 py-3 border-b-2 border-blue-600 text-blue-600 font-medium">
        일정 요청
        <span class="ml-1 px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs">
          {{ notificationCount }}
        </span>
      </button>
      <button class="px-6 py-3 text-gray-500 hover:text-gray-700">전체 알림</button>
    </div>

    <div class="space-y-4">
      <div class="p-5 bg-blue-50 border border-blue-100 rounded-xl flex justify-between items-start">
        <div class="flex gap-4">
          <div class="p-2 bg-white rounded-lg shadow-sm w-12 h-12 flex items-center justify-center text-red-500 font-bold text-xs border">
            JUL<br>17
          </div>
          <div>
            <h3 class="font-bold text-gray-900">면접 일정 확인 요청</h3>
            <p class="text-sm text-gray-600 mt-1">2024.02.07 (수) 13:00 - 14:30 기술 면접에 참여 요청이 있습니다.</p>
            <p class="text-sm text-gray-500">지원자: 박지원 · 장소: 5층 대회의실 A</p>
            <div class="flex items-center mt-2 text-xs text-gray-400">
              <span>요청자: 김인사</span><span class="mx-2">·</span><span>10분 전</span>
            </div>
          </div>
        </div>
        <div class="flex gap-2">
          <button class="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">거절</button>
          <button class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">수락</button>
        </div>
      </div>

      <div class="p-5 border border-gray-100 rounded-xl flex gap-4">
        <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 shrink-0">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <div>
          <h3 class="font-bold text-gray-900">일정이 수락되었습니다</h3>
          <p class="text-sm text-gray-600 mt-1">이팀장님이 <span class="font-semibold">2024.02.06 (화) 10:00</span> 면접 일정을 수락했습니다.</p>
          <div class="flex items-center mt-2 text-xs text-gray-400">
            <span>어제</span><span class="mx-2">·</span><button class="text-blue-600 hover:underline">일정 보기</button>
          </div>
        </div>
      </div>

      <div class="p-5 border border-gray-100 rounded-xl flex gap-4">
        <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 shrink-0">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </div>
        <div>
          <h3 class="font-bold text-gray-900">일정이 거절되었습니다</h3>
          <p class="text-sm text-gray-600 mt-1">박시니어님이 면접 일정을 거절했습니다.</p>
          <p class="text-xs text-gray-500 mt-1 italic">사유: 다른 미팅이 있습니다.</p>
          <div class="flex items-center mt-2 text-xs text-gray-400">
            <span>어제</span><span class="mx-2">·</span><button class="text-blue-600 hover:underline">다시 요청하기</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>