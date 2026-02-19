<script setup>
import { ref, computed } from 'vue'

// 1. 상태 관리
const isInviteModalOpen = ref(false)
const isGroupModalOpen = ref(false)

// 메인 데이터
const searchQuery = ref('')
const activeFilterGroup = ref('All')

// 초대 모달 관련 상태
const inviteEmailInput = ref('')
const inviteRole = ref('Member')
const pendingInvites = ref([]) // 초대 대기 명단
const inviteLink = ref('https://app.nexus.ai/invitation-link?invitationLinkId=...')

// 그룹 생성 모달 관련 상태
const newGroupName = ref('')
const groupMemberSearchQuery = ref('')
const selectedMembersForNewGroup = ref([]) // 새 그룹에 포함될 멤버 ID들

const groups = ref([
  { id: 1, name: '디자인팀', color: 'bg-pink-100 text-pink-600' },
  { id: 2, name: '개발본부', color: 'bg-blue-100 text-blue-600' },
  { id: 3, name: '마케팅', color: 'bg-purple-100 text-purple-600' },
  { id: 4, name: '일반', color: 'bg-slate-100 text-slate-600' },
])

const members = ref([
  {
    id: 1, name: '박지원', email: 'jw.park@nexus.ai', role: 'Admin', status: 'Active', avatar: 'PJ', group: '디자인팀',
    lastActive: '2024-05-20', joinedWorkspace: '2023-11-12', joinedCoffiness: '2022-01-15'
  },
  {
    id: 2, name: '이민수', email: 'ms.lee@nexus.ai', role: 'Recruiter', status: 'Active', avatar: 'LM', group: '개발본부',
    lastActive: '2024-05-21', joinedWorkspace: '2024-01-05', joinedCoffiness: '2023-06-20'
  },
  {
    id: 3, name: '김소희', email: 'sh.kim@nexus.ai', role: 'Member', status: 'Pending', avatar: 'KS', group: '마케팅',
    lastActive: '-', joinedWorkspace: '2024-05-18', joinedCoffiness: '2024-05-18'
  },
  {
    id: 4, name: '정우진', email: 'wj.jung@nexus.ai', role: 'Viewer', status: 'Active', avatar: 'JW', group: '개발본부',
    lastActive: '2024-05-15', joinedWorkspace: '2023-12-01', joinedCoffiness: '2022-08-10'
  },
])

const roles = ['Admin', 'Recruiter', 'Member', 'Viewer']

const filteredMembers = computed(() => {
  return members.value.filter(member => {
    const matchesGroup = activeFilterGroup.value === 'All' || member.group === activeFilterGroup.value
    const matchesSearch = member.name.includes(searchQuery.value) || member.email.includes(searchQuery.value)
    return matchesGroup && matchesSearch
  })
})

// 그룹 모달 내 사용자 검색 필터
const filteredMembersForGroup = computed(() => {
  if (!groupMemberSearchQuery.value) return []
  return members.value.filter(m =>
      m.name.includes(groupMemberSearchQuery.value) || m.email.includes(groupMemberSearchQuery.value)
  )
})

const openInviteModal = () => { isInviteModalOpen.value = true }
const closeInviteModal = () => {
  isInviteModalOpen.value = false;
  pendingInvites.value = [];
  inviteEmailInput.value = ''
}

const openGroupModal = () => { isGroupModalOpen.value = true }
const closeGroupModal = () => {
  isGroupModalOpen.value = false;
  newGroupName.value = '';
  selectedMembersForNewGroup.value = []
  groupMemberSearchQuery.value = ''
}

// [초대 모달] 임시 목록에 추가
const addInviteToList = () => {
  if (!inviteEmailInput.value || !inviteEmailInput.value.includes('@')) {
    alert('유효한 이메일을 입력해주세요.');
    return;
  }
  // 중복 체크
  if (pendingInvites.value.some(p => p.email === inviteEmailInput.value)) {
    alert('이미 목록에 있는 이메일입니다.');
    return;
  }

  pendingInvites.value.push({
    email: inviteEmailInput.value,
    role: inviteRole.value
  })
  inviteEmailInput.value = '' // 입력창 초기화
}

// [초대 모달] 임시 목록에서 삭제
const removePendingInvite = (index) => {
  pendingInvites.value.splice(index, 1)
}

// [초대 모달] 최종 초대 전송
const confirmInvitations = () => {
  if (pendingInvites.value.length === 0) return;

  const today = new Date().toISOString().split('T')[0]

  pendingInvites.value.forEach(invite => {
    members.value.push({
      id: Date.now() + Math.random(),
      name: invite.email.split('@')[0],
      email: invite.email,
      role: invite.role,
      group: '일반', // 기본 그룹
      status: 'Pending',
      avatar: invite.email.substring(0, 2).toUpperCase(),
      lastActive: '-',
      joinedWorkspace: today,
      joinedCoffiness: today
    })
  })

  alert(`${pendingInvites.value.length}명을 초대했습니다.`);
  closeInviteModal();
}

const copyInviteLink = () => {
  navigator.clipboard.writeText(inviteLink.value)
  alert('초대 링크가 복사되었습니다.')
}

// [그룹 모달] 멤버 선택 토글
const toggleMemberForGroup = (member) => {
  const index = selectedMembersForNewGroup.value.findIndex(m => m.id === member.id)
  if (index === -1) {
    selectedMembersForNewGroup.value.push(member)
  } else {
    selectedMembersForNewGroup.value.splice(index, 1)
  }
}

// [그룹 모달] 그룹 생성 완료
const createGroup = () => {
  if (!newGroupName.value.trim()) {
    alert('그룹 이름을 입력해주세요.')
    return
  }

  const colors = ['bg-orange-100 text-orange-600', 'bg-emerald-100 text-emerald-600', 'bg-indigo-100 text-indigo-600', 'bg-rose-100 text-rose-600']
  const newGroupColor = colors[Math.floor(Math.random() * colors.length)]

  // 1. 그룹 추가
  groups.value.push({
    id: Date.now(),
    name: newGroupName.value,
    color: newGroupColor
  })

  // 2. 선택된 멤버들의 그룹 정보 업데이트 (선택 사항)
  selectedMembersForNewGroup.value.forEach(selectedMember => {
    const memberIndex = members.value.findIndex(m => m.id === selectedMember.id)
    if (memberIndex !== -1) {
      members.value[memberIndex].group = newGroupName.value
    }
  })

  alert(`'${newGroupName.value}' 그룹이 생성되었습니다.`);
  closeGroupModal();
}

const removeMember = (id) => {
  if(confirm('멤버를 삭제하시겠습니까?')) members.value = members.value.filter(m => m.id !== id)
}

// [Helper] 그룹 색상 찾기
const getGroupColor = (groupName) => {
  const group = groups.value.find(g => g.name === groupName)
  return group ? group.color : 'bg-slate-100 text-slate-600'
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 px-8 pt-2 pb-8 font-sans text-slate-700">
    <header class="flex justify-end items-end mb-8">
      <div class="flex gap-3">
        <button @click="openGroupModal" class="px-5 py-3 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl transition-all shadow-sm font-medium">+ 그룹 추가</button>
        <button @click="openInviteModal" class="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-lg shadow-teal-600/20 transition-all">멤버 초대</button>
      </div>
    </header>

    <div class="grid grid-cols-1 xl:grid-cols-4 gap-8">
      <div class="space-y-6">
        <div class="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest">그룹 필터</h3>
            <button @click="activeFilterGroup = 'All'" class="text-xs text-teal-600 font-bold hover:underline">초기화</button>
          </div>
          <div class="space-y-1">
            <div @click="activeFilterGroup = 'All'" :class="['flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all', activeFilterGroup === 'All' ? 'bg-teal-50 text-teal-700 font-bold' : 'hover:bg-slate-50']">
              <div class="w-2 h-2 rounded-full bg-slate-400"></div>
              <span class="text-sm">전체 보기</span>
            </div>
            <div v-for="group in groups" :key="group.id" @click="activeFilterGroup = group.name" :class="['flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all', activeFilterGroup === group.name ? 'bg-teal-50 text-teal-700 font-bold' : 'hover:bg-slate-50']">
              <div class="flex items-center gap-3">
                <div :class="['w-2 h-2 rounded-full', group.color.split(' ')[1].replace('text', 'bg')]"></div>
                <span class="text-sm">{{ group.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="xl:col-span-3 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div class="p-6 border-b border-slate-100">
          <input v-model="searchQuery" type="text" placeholder="검색..." class="bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-xl py-2 px-5 text-sm font-bold text-slate-900 outline-none w-full max-w-xs transition-colors" />
        </div>

        <table class="w-full text-left border-collapse">
          <thead>
          <tr class="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-50">
            <th class="px-6 py-5">사용자 정보</th>
            <th class="px-6 py-5">활동 및 합류 정보</th>
            <th class="px-6 py-5">그룹 / 권한</th>
            <th class="px-6 py-5 text-right">관리</th>
          </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
          <tr v-for="member in filteredMembers" :key="member.id" class="group hover:bg-slate-50/50 transition-all">
            <td class="px-6 py-5">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-teal-600 font-bold text-xs">{{ member.avatar }}</div>
                <div>
                  <p class="text-sm font-bold text-slate-900">{{ member.name }}</p>
                  <p class="text-[11px] text-slate-400">Coffiness 가입: {{ member.joinedCoffiness }}</p>
                </div>
              </div>
            </td>
            <td class="px-6 py-5">
              <div class="flex flex-col gap-1.5 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <span class="text-[10px] font-bold text-slate-400 w-16 uppercase">최근 접속</span>
                  <span class="text-xs font-medium text-slate-700">{{ member.lastActive }}</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-[10px] font-bold text-slate-400 w-16 uppercase">워크스페이스</span>
                  <span class="text-xs font-medium text-slate-700">{{ member.joinedWorkspace }}</span>
                </div>
              </div>
            </td>
            <td class="px-6 py-5">
              <div class="flex flex-col gap-2">
                <div class="relative w-fit group/select">
                  <select
                      v-model="member.group"
                      :class="[
                        'appearance-none pl-2 pr-6 py-0.5 rounded text-[10px] font-bold outline-none cursor-pointer transition-colors',
                        getGroupColor(member.group)
                      ]"
                  >
                    <option v-for="g in groups" :key="g.id" :value="g.name">
                      {{ g.name }}
                    </option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5">
                    <svg class="h-3 w-3 opacity-50 group-hover/select:opacity-100 transition-opacity" :class="getGroupColor(member.group).split(' ')[1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <div class="relative w-fit ml-1 group/role">
                  <select
                      v-model="member.role"
                      class="appearance-none pr-5 bg-transparent text-[11px] font-medium text-slate-500 outline-none cursor-pointer hover:text-teal-600 transition-colors"
                  >
                    <option v-for="role in roles" :key="role" :value="role">{{ role }}</option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                    <svg class="h-2.5 w-2.5 text-slate-400 group-hover/role:text-teal-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </td>
            <td class="px-6 py-5 text-right">
              <button @click="removeMember(member.id)" class="text-slate-300 hover:text-rose-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="isInviteModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="closeInviteModal"></div>
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 animate-modal-in flex flex-col">
            <div class="p-6 md:p-8">
              <h2 class="text-xl font-bold text-slate-800 mb-2">사용자 초대하기</h2>
              <p class="text-xs text-slate-400 mb-6">동료의 이메일을 입력하여 워크스페이스에 초대하세요.</p>
              <div class="flex gap-2 mb-6">
                <input v-model="inviteEmailInput" @keyup.enter="addInviteToList" type="text" placeholder="example@nexus.ai" class="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-teal-500 transition-colors" />
                <select v-model="inviteRole" class="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-teal-500">
                  <option v-for="role in roles" :key="role" :value="role">{{ role }}</option>
                </select>
                <button @click="addInviteToList" class="px-4 py-2 bg-slate-800 text-white text-sm font-bold rounded-lg hover:bg-slate-700 transition-colors">추가</button>
              </div>
              <div class="space-y-2 max-h-48 overflow-y-auto">
                <div v-if="pendingInvites.length === 0" class="text-center py-6 border-2 border-dashed border-slate-100 rounded-lg">
                  <p class="text-xs text-slate-400">아직 추가된 사용자가 없습니다.</p>
                </div>
                <div v-else v-for="(invite, idx) in pendingInvites" :key="idx" class="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-bold">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <div>
                      <p class="text-sm font-bold text-slate-700">{{ invite.email }}</p>
                      <p class="text-[10px] text-slate-400">{{ invite.role }} 권한</p>
                    </div>
                  </div>
                  <button @click="removePendingInvite(idx)" class="text-slate-300 hover:text-rose-500">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            </div>
            <div class="bg-slate-50/80 px-6 py-5 border-y border-slate-100">
              <h3 class="text-sm font-bold text-slate-800 mb-2">초대 링크</h3>
              <p class="text-xs text-slate-400 mb-3">링크를 통해 멤버 권한으로 즉시 초대됩니다.</p>
              <div class="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center justify-between shadow-sm">
                <span class="text-xs text-slate-500 truncate flex-1 mr-2">{{ inviteLink }}</span>
                <button @click="copyInviteLink" class="text-teal-600 hover:text-teal-700 flex-shrink-0 p-1 hover:bg-teal-50 rounded">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </button>
              </div>
            </div>
            <div class="p-6 pt-4 flex gap-3 justify-end">
              <button @click="closeInviteModal" class="px-5 py-2.5 text-slate-500 font-bold text-sm hover:bg-slate-100 rounded-lg transition-colors">취소</button>
              <button @click="confirmInvitations" class="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm rounded-lg shadow-md shadow-teal-600/10 transition-colors">초대하기</button>
            </div>
          </div>
        </div>
      </Transition>

      <Transition name="modal-fade">
        <div v-if="isGroupModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="closeGroupModal"></div>
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 animate-modal-in p-6 md:p-8">
            <h2 class="text-xl font-bold text-slate-800 mb-6">사용자 그룹 추가</h2>
            <div class="mb-6">
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">사용자 그룹명</label>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg">P</div>
                <input v-model="newGroupName" type="text" placeholder="예: 프로덕트 매니저 그룹" class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-teal-500 transition-colors" />
              </div>
            </div>
            <div class="mb-6">
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">그룹 사용자 추가</label>
              <div class="relative mb-3">
                <input v-model="groupMemberSearchQuery" type="text" placeholder="사용자를 검색해 추가해 주세요." class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-teal-500 transition-colors" />
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 absolute left-3.5 top-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <div class="border border-slate-100 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-50">
                <div v-for="member in selectedMembersForNewGroup" :key="'selected-' + member.id" class="p-3 flex items-center justify-between bg-teal-50/50">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">{{ member.avatar }}</div>
                    <div>
                      <span class="text-sm font-bold text-slate-800">{{ member.name }}</span>
                      <span class="ml-2 text-[10px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded">포함됨</span>
                      <p class="text-xs text-slate-400">{{ member.email }}</p>
                    </div>
                  </div>
                  <button @click="toggleMemberForGroup(member)" class="text-slate-400 hover:text-rose-500">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div v-if="groupMemberSearchQuery && filteredMembersForGroup.length > 0">
                  <div v-for="member in filteredMembersForGroup" :key="member.id"
                       v-show="!selectedMembersForNewGroup.find(m => m.id === member.id)"
                       @click="toggleMemberForGroup(member)"
                       class="p-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">{{ member.avatar }}</div>
                      <div>
                        <p class="text-sm font-bold text-slate-700">{{ member.name }}</p>
                        <p class="text-xs text-slate-400">{{ member.email }}</p>
                      </div>
                    </div>
                    <div class="text-teal-600 text-xs font-bold">+ 추가</div>
                  </div>
                </div>
                <div v-if="groupMemberSearchQuery && filteredMembersForGroup.length === 0" class="p-4 text-center text-xs text-slate-400">
                  검색 결과가 없습니다.
                </div>
              </div>
            </div>
            <div class="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-50">
              <button @click="closeGroupModal" class="px-5 py-2.5 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-lg transition-colors">취소</button>
              <button @click="createGroup" class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-lg shadow-lg shadow-slate-900/10 transition-colors">그룹 생성하기</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap');
.font-display { font-family: 'Outfit', sans-serif; }
.whitespace-nowrap { white-space: nowrap; }

/* Modal Animations */
.modal-fade-enter-active, .modal-fade-leave-active { transition: all 0.2s ease-out; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-to, .modal-fade-leave-from { opacity: 1; }

.animate-modal-in { animation: modalSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes modalSlideIn {
  from { opacity: 0; transform: translateY(20px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
