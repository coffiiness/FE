<script setup>
import { ref } from 'vue'

const todaySchedule = ref([
  {
    id: 1,
    title: '직무 화상 인터뷰',
    position: '퍼포먼스 마케터 채용 모집',
    candidate: '최나루 지원자',
    time: '09:00 - 10:00',
    interviewers: ['박', '이', '김'],
    remainingMembers: 5,
    status: 'scheduled',
    color: 'bg-orange-500' 
  },
  {
    id: 2,
    title: '컬쳐핏 인터뷰',
    position: 'FE 주니어 채용 모집',
    candidate: '김유리 지원자',
    time: '13:00 - 14:00',
    interviewers: ['이', '박', '정'],
    remainingMembers: 3,
    status: 'scheduled',
    color: 'bg-teal-500' 
  },
  {
    id: 3,
    title: '컬쳐핏 인터뷰',
    position: 'FE 주니어 채용 모집',
    candidate: '박상혁 지원자',
    time: '15:00 - 16:00',
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

const currentMonth = '2025년 11월'
const calendarDays = [
  { day: 14, label: '일' }, { day: 15, label: '월' }, { day: 16, label: '화' },
  { day: 17, label: '수', active: true }, { day: 18, label: '목' }, { day: 19, label: '금' }, { day: 20, label: '토' }
]
</script>

<template>
  <div class="space-y-6">
    <div class="bg-white border border-slate-200 p-8 rounded-2xl flex flex-col xl:flex-row items-center justify-between relative overflow-hidden shadow-sm">
      
      <div class="absolute -right-20 -top-20 w-64 h-64 bg-teal-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
      
      <div class="relative z-10 text-center md:text-left mb-6 xl:mb-0">
        <h2 class="text-3xl font-display font-bold text-slate-900 flex flex-col md:flex-row items-center justify-center md:justify-start tracking-tight">
          반갑습니다, 김철수 님
          <span class="mt-2 md:mt-0 md:ml-4 text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">관리자</span>
        </h2>
        <div class="mt-3 flex items-center justify-center md:justify-start space-x-6 text-sm text-slate-500">
          <span class="flex items-center">
            <span class="w-2 h-2 rounded-full bg-teal-500 mr-2 animate-pulse"></span>
            방금 전 업데이트
          </span>
        </div>
      </div>
      
      <div class="flex flex-wrap justify-center gap-12 relative z-10 w-full xl:w-auto">
        <div class="text-center xl:text-right min-w-[100px]">
          <p class="text-xs text-teal-600 font-bold tracking-widest uppercase mb-1">오늘의 일정</p>
          <p class="text-4xl font-display font-bold text-slate-900">{{ todaySchedule.length }}<span class="text-lg font-normal text-slate-400 ml-1">개</span></p>
        </div>
        <div class="text-center xl:text-right min-w-[100px]">
          <p class="text-xs text-slate-400 font-bold tracking-widest uppercase mb-1">평가 대기</p>
          <p class="text-4xl font-display font-bold text-slate-900">12<span class="text-lg font-normal text-slate-400 ml-1">개</span></p>
        </div>
        <div class="text-center xl:text-right min-w-[100px]">
          <p class="text-xs text-slate-400 font-bold tracking-widest uppercase mb-1">자동화 승인</p>
          <p class="text-4xl font-display font-bold text-slate-900">2<span class="text-lg font-normal text-slate-400 ml-1">개</span></p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-white border border-slate-200 rounded-xl p-6 h-full flex flex-col shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
            <h3 class="text-xl font-display font-bold text-slate-900">내 일정</h3>
            <span class="text-xs text-teal-700 bg-teal-50 px-2 py-1 rounded border border-teal-100 font-medium">Fast View</span>
          </div>

          <div class="mb-8">
             <div class="flex justify-between items-center mb-4">
               <span class="font-bold text-slate-800 text-lg tracking-wide">{{ currentMonth }}</span>
               <div class="flex space-x-1">
                 <button class="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors">
                   <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                 </button>
                 <button class="px-3 py-1 text-xs font-bold text-white bg-teal-500 rounded hover:bg-teal-600 transition-colors shadow-sm">오늘</button>
                 <button class="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors">
                   <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                 </button>
               </div>
             </div>
             <div class="grid grid-cols-7 gap-2 text-center">
                <div v-for="day in calendarDays" :key="day.day" 
                     :class="['py-3 rounded-lg cursor-pointer flex flex-col items-center justify-center transition-all duration-300 border', 
                              day.active ? 'bg-teal-50 border-teal-200 text-teal-700 shadow-sm' : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700']">
                  <span class="text-[10px] mb-1 opacity-60 uppercase tracking-widest font-semibold">{{ day.label }}</span>
                  <span class="font-bold font-mono text-lg">{{ day.day }}</span>
                </div>
             </div>
          </div>

          <div class="space-y-4 flex-1">
             <div class="flex justify-between items-end mb-2">
               <span class="text-sm font-bold text-slate-500">9월 17일 수요일</span>
               <span class="text-xs font-medium text-teal-600">{{ todaySchedule.length }}개의 일정</span>
             </div>
             
             <div v-for="schedule in todaySchedule" :key="schedule.id" 
                  class="group relative bg-white border border-slate-200 rounded-xl p-4 transition-all duration-300 hover:border-teal-400 hover:shadow-md">
                <div class="absolute left-0 top-3 bottom-3 w-1.5 rounded-r-lg" :class="schedule.color"></div>
                <div class="pl-4">
                  <p class="text-xs text-teal-600 font-bold mb-1 flex items-center">
                    <svg class="w-3 h-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {{ schedule.time }}
                  </p>
                  <h4 class="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors">{{ schedule.title }}</h4>
                  <div class="mt-2 flex items-center text-xs text-slate-500">
                    <span class="truncate bg-slate-100 px-2 py-1 rounded text-slate-600 font-medium">{{ schedule.position }}</span>
                  </div>
                  <div class="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                      <span class="flex items-center text-xs text-slate-600 font-medium">
                        <span class="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2"></span>
                        {{ schedule.candidate }}
                      </span>
                      <div class="flex -space-x-2">
                         <div v-for="(initial, idx) in schedule.interviewers" :key="idx" 
                              class="w-7 h-7 rounded-full bg-white border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-700 shadow-sm transition-transform group-hover:scale-110 z-10">
                           {{ initial }}
                         </div>
                         <div v-if="schedule.remainingMembers" class="w-7 h-7 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-[10px] text-slate-600 z-20 shadow-sm font-medium">
                           +{{ schedule.remainingMembers }}
                         </div>
                      </div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div class="lg:col-span-2 space-y-6">
        
        <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div class="flex items-center justify-between mb-6">
             <h3 class="text-xl font-display font-bold text-slate-900 flex items-center">
               <span class="w-1.5 h-6 bg-teal-500 mr-3 rounded-full"></span>
               사내 공지사항
             </h3>
             <div class="flex items-center space-x-3">
               <span class="text-slate-400 text-xs font-mono">&lt; 1 / 10 &gt;</span>
               <button class="bg-slate-900 text-white text-xs px-4 py-2 rounded-lg hover:bg-slate-800 transition-all flex items-center font-medium shadow-sm">
                 <svg class="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                 공지사항 만들기
               </button>
             </div>
          </div>
          <ul class="space-y-1">
            <li v-for="announcement in announcements" :key="announcement.id" class="p-3 flex items-center justify-between hover:bg-slate-50 rounded-lg transition-colors cursor-pointer group border border-transparent hover:border-slate-100">
               <div class="flex items-center">
                 <span class="text-sm text-slate-700 font-medium group-hover:text-teal-700 transition-colors">{{ announcement.title }}</span>
                 <span v-if="announcement.isNew" class="ml-3 text-[10px] font-bold text-white bg-teal-500 px-2 py-0.5 rounded-full shadow-sm">NEW</span>
               </div>
               <span class="text-xs text-slate-400 font-mono">{{ announcement.date }}</span>
            </li>
          </ul>
        </div>

        <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div class="flex items-center justify-between mb-6">
             <div>
               <h3 class="text-xl font-display font-bold text-slate-900 flex items-center">
                 <span class="w-1.5 h-6 bg-purple-500 mr-3 rounded-full"></span>
                 최근 수신 알림
               </h3>
               <div class="flex space-x-6 mt-4 border-b border-slate-100 pl-4">
                 <button class="text-sm font-bold text-slate-900 border-b-2 border-slate-900 pb-3">전체 알림</button>
                 <button class="text-sm font-medium text-slate-400 pb-3 hover:text-slate-600 transition-colors">읽지 않은 알림</button>
               </div>
             </div>
             <span class="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">정렬: 발송일자 최신순</span>
          </div>

          <div class="space-y-4">
             <div v-for="noti in notifications" :key="noti.id" class="flex items-start group p-3 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                <div class="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center mr-5 transition-all duration-300 shadow-sm border border-slate-200"
                     :class="{'bg-teal-50 text-teal-600': noti.type === 'calendar', 
                              'bg-emerald-50 text-emerald-600': noti.type === 'check', 
                              'bg-orange-50 text-orange-600': noti.type === 'bell', 
                              'bg-purple-50 text-purple-600': noti.type === 'user-add'}">
                   
                   <svg v-if="noti.type === 'calendar'" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                   <svg v-else-if="noti.type === 'check'" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                   <svg v-else-if="noti.type === 'bell'" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                   <svg v-else-if="noti.type === 'user-add'" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
                </div>
                <div class="flex-1 pt-1">
                   <div class="flex justify-between">
                     <h4 class="text-sm font-bold text-slate-800 group-hover:text-teal-700 transition-colors">
                       {{ noti.title }}
                       <span v-if="!noti.read" class="ml-2 inline-flex w-2 h-2 bg-teal-500 rounded-full align-middle animate-pulse"></span>
                     </h4>
                     <span class="text-xs text-slate-400 font-mono">{{ noti.time }}</span>
                   </div>
                   <p class="text-sm text-slate-500 mt-1">{{ noti.desc }}</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>