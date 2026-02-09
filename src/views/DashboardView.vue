<script setup>
import { ref } from 'vue'

const todaySchedule = ref([
  {
    id: 1,
    title: '직무 화상 인터뷰',
    position: '퍼포먼스 마케터 채용 모집',
    candidate: '최나루 지원자',
    time: '오전 09:00 - 오전 10:00',
    interviewers: ['박', '이', '김'],
    remainingMembers: 5,
    status: 'scheduled',
    color: 'bg-orange-400'
  },
  {
    id: 2,
    title: '컬쳐핏 인터뷰',
    position: 'FE 주니어 채용 모집',
    candidate: '김유리 지원자',
    time: '오후 01:00 - 오후 02:00',
    interviewers: ['이', '박', '정'],
    remainingMembers: 3,
    status: 'scheduled',
    color: 'bg-brand-500' // Changed to brand color
  },
  {
    id: 3,
    title: '컬쳐핏 인터뷰',
    position: 'FE 주니어 채용 모집',
    candidate: '박상혁 지원자',
    time: '오후 03:00 - 오후 04:00',
    interviewers: ['최', '박', '민'],
    remainingMembers: 4,
    status: 'scheduled',
    color: 'bg-purple-500'
  }
])

const announcements = ref([
  { id: 1, title: '프로덕트 디자이너 면접 평가표 작성 안내', date: '2025. 11. 15.', isNew: true },
  { id: 2, title: '프로덕트 디자이너 면접 평가표 작성 기준', date: '2025. 11. 16.', isNew: false },
  { id: 3, title: '면접 질문 샘플 목록', date: '2025. 11. 18.', isNew: false },
  { id: 4, title: '면접관 역할 안내', date: '2025. 11. 19.', isNew: false },
  { id: 5, title: '피드백 제출 방법 안내', date: '2025. 11. 20.', isNew: false },
])

const notifications = ref([
  { id: 1, type: 'calendar', title: '인터뷰 일정이 확정되었습니다', desc: '직무 화상 인터뷰 - 최나루 지원자 (09:00~10:00)', time: '3분 전', read: false },
  { id: 2, type: 'check', title: '평가표가 제출되었습니다', desc: '그래픽 디자이너 컬쳐핏 평가 - 김나인 지원자', time: '15분 전', read: false },
  { id: 3, type: 'bell', title: '새로운 공지사항이 등록되었습니다', desc: '프로덕트 디자이너 면접 평가표 작성 안내', time: '1시간 전', read: true },
  { id: 4, type: 'user-add', title: '추천 지원자가 등록되었습니다', desc: 'UX 디자이너 - 이민수 지원자가 추천되었습니다', time: '2시간 전', read: true },
])

// Mock Calendar Data
const currentMonth = '2025년 11월'
const calendarDays = [
  { day: 14, label: '일' }, { day: 15, label: '월' }, { day: 16, label: '화' },
  { day: 17, label: '수', active: true }, { day: 18, label: '목' }, { day: 19, label: '금' }, { day: 20, label: '토' }
]
</script>

<template>
  <div class="space-y-6">
    <!-- Top Stats / Greeting -->
    <div class="flex items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div>
        <h2 class="text-2xl font-bold text-slate-800 flex items-center">
          안녕하세요, 김철수 님
          <span class="ml-3 text-xs font-medium text-brand-700 bg-brand-50 px-2 py-1 rounded-full border border-brand-200">관리자</span>
        </h2>
        <div class="mt-2 flex items-center space-x-6 text-sm text-slate-500">
          <span class="flex items-center">
            <span class="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
            방금 전 업데이트
          </span>
        </div>
      </div>
      <div class="flex space-x-8">
        <div class="text-right">
          <p class="text-xs text-slate-400 font-medium tracking-wide uppercase">오늘의 일정</p>
          <p class="text-2xl font-bold text-brand-600">{{ todaySchedule.length }}<span class="text-base font-normal text-slate-400 ml-1">개</span></p>
        </div>
        <div class="text-right">
          <p class="text-xs text-slate-400 font-medium tracking-wide uppercase">평가</p>
          <p class="text-2xl font-bold text-slate-700">12<span class="text-base font-normal text-slate-400 ml-1">개</span></p>
        </div>
        <div class="text-right">
          <p class="text-xs text-slate-400 font-medium tracking-wide uppercase">자동화 액션 승인</p>
          <p class="text-2xl font-bold text-slate-700">2<span class="text-base font-normal text-slate-400 ml-1">개</span></p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left Column: Schedule -->
      <div class="lg:col-span-1 space-y-6">
        <!-- Calendar & Schedule Card -->
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full flex flex-col">
          <div class="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
            <h3 class="text-lg font-bold text-slate-800">내 일정</h3>
            <span class="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">정렬: 빠른 순</span>
          </div>

          <!-- Mini Calendar Strip -->
          <div class="mb-6">
             <div class="flex justify-between items-center mb-4">
               <span class="font-bold text-slate-800 text-lg">{{ currentMonth }}</span>
               <div class="flex space-x-1">
                 <button class="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors">
                   <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                 </button>
                 <button class="px-2 py-1 text-xs font-bold text-brand-600 bg-brand-50 rounded hover:bg-brand-100 transition-colors">오늘</button>
                 <button class="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors">
                   <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                 </button>
               </div>
             </div>
             <div class="grid grid-cols-7 gap-1 text-center">
                <div v-for="day in calendarDays" :key="day.day" 
                     :class="['py-2 rounded-lg cursor-pointer flex flex-col items-center justify-center transition-all', day.active ? 'bg-brand-500 text-white shadow-md shadow-brand-200' : 'text-slate-500 hover:bg-slate-50']">
                  <span class="text-[10px] mb-1 opacity-80 uppercase tracking-wider">{{ day.label }}</span>
                  <span class="font-bold font-mono">{{ day.day }}</span>
                </div>
             </div>
          </div>

          <!-- Schedule List -->
          <div class="space-y-3 flex-1">
             <div class="flex justify-between items-end mb-3">
               <span class="text-sm font-bold text-slate-400">9월 17일 수요일</span>
               <span class="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-1 rounded-full">{{ todaySchedule.length }}개의 일정</span>
             </div>
             
             <div v-for="schedule in todaySchedule" :key="schedule.id" class="group relative bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:border-brand-200">
                <div class="absolute left-0 top-3 bottom-3 w-1 rounded-r-lg" :class="schedule.color.replace('bg-', 'bg-')"></div> <!-- Use dynamic color as is -->
                <div class="pl-3">
                  <p class="text-xs text-slate-400 font-medium mb-1 flex items-center">
                    <svg class="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {{ schedule.time }}
                  </p>
                  <h4 class="text-base font-bold text-slate-800 group-hover:text-brand-700 transition-colors">{{ schedule.title }}</h4>
                  <div class="mt-2 flex items-center text-xs text-slate-500">
                    <span class="truncate bg-slate-50 px-1.5 py-0.5 rounded text-slate-600">{{ schedule.position }}</span>
                  </div>
                  <div class="mt-3 flex items-center justify-between border-t border-slate-50 pt-2">
                     <span class="flex items-center text-xs text-slate-600">
                       <span class="w-1.5 h-1.5 rounded-full bg-slate-300 mr-1.5"></span>
                       {{ schedule.candidate }}
                     </span>
                     <!-- Avatars -->
                     <div class="flex -space-x-1.5">
                        <div v-for="(initial, idx) in schedule.interviewers" :key="idx" 
                             class="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-sm"
                             :class="{'z-10': idx===0, 'z-0': idx>0}">
                          {{ initial }}
                        </div>
                        <div v-if="schedule.remainingMembers" class="w-6 h-6 rounded-full bg-slate-800 border-2 border-white flex items-center justify-center text-[10px] text-white z-20 shadow-sm">
                          +{{ schedule.remainingMembers }}
                        </div>
                     </div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Announcements & Notifications -->
      <div class="lg:col-span-2 space-y-6">
        
        <!-- Announcements -->
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div class="flex items-center justify-between mb-4">
             <h3 class="text-lg font-bold text-slate-800">사내 공지사항</h3>
             <div class="flex items-center space-x-2">
               <span class="text-slate-400 text-xs font-mono">&lt; 1 / 10 &gt;</span>
               <button class="bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-brand-600 transition-colors shadow-sm flex items-center">
                 <svg class="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                 공지사항 만들기
               </button>
             </div>
          </div>
          <ul class="divide-y divide-slate-100">
            <li v-for="announcement in announcements" :key="announcement.id" class="py-3 flex items-center justify-between hover:bg-brand-50/30 px-3 rounded-lg -mx-3 transition-colors cursor-pointer group">
               <div class="flex items-center">
                 <span class="text-sm text-slate-700 font-medium group-hover:text-brand-700 transition-colors">{{ announcement.title }}</span>
                 <span v-if="announcement.isNew" class="ml-2 text-[10px] font-bold text-white bg-brand-500 px-1.5 py-0.5 rounded shadow-sm shadow-brand-200">NEW</span>
               </div>
               <span class="text-xs text-slate-400 font-mono group-hover:text-brand-400 transition-colors">{{ announcement.date }}</span>
            </li>
          </ul>
        </div>

        <!-- Notifications -->
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div class="flex items-center justify-between mb-6">
             <div>
               <h3 class="text-lg font-bold text-slate-800">최근 수신 알림</h3>
               <div class="flex space-x-4 mt-2 border-b border-slate-100">
                 <button class="text-sm font-bold text-brand-600 border-b-2 border-brand-500 pb-2">전체 알림</button>
                 <button class="text-sm font-medium text-slate-400 pb-2 hover:text-slate-600 transition-colors">읽지 않은 알림</button>
               </div>
             </div>
             <span class="text-xs text-slate-400">정렬: 발송일자 최신순</span>
          </div>

          <div class="space-y-5">
             <div v-for="noti in notifications" :key="noti.id" class="flex items-start group">
                <div class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-4 transition-colors duration-300"
                     :class="{'bg-brand-50 text-brand-600 group-hover:bg-brand-100': noti.type === 'calendar', 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100': noti.type === 'check', 'bg-orange-50 text-orange-600 group-hover:bg-orange-100': noti.type === 'bell', 'bg-purple-50 text-purple-600 group-hover:bg-purple-100': noti.type === 'user-add'}">
                   <!-- Logic for icons -->
                   <svg v-if="noti.type === 'calendar'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                   <svg v-else-if="noti.type === 'check'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                   <svg v-else-if="noti.type === 'bell'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                   <svg v-else-if="noti.type === 'user-add'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
                </div>
                <div class="flex-1">
                   <div class="flex justify-between">
                     <h4 class="text-sm font-bold text-slate-800 group-hover:text-brand-700 transition-colors">
                       {{ noti.title }}
                       <span v-if="!noti.read" class="ml-1 inline-block w-1.5 h-1.5 bg-brand-500 rounded-full align-middle animate-pulse"></span>
                     </h4>
                     <span class="text-xs text-slate-400">{{ noti.time }}</span>
                   </div>
                   <p class="text-sm text-slate-500 mt-0.5">{{ noti.desc }}</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
