<script setup>
import { ref, computed, onMounted } from 'vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { memberApi } from '@/api/member'
import { groupApi } from '@/api/group'
import { invitationApi } from '@/api/invitation'
import { useModal } from '@/composables/useModal'
import { formatDate, getInitials, getApiError } from '@/utils/format'

// ── 공통 모달 ─────────────────────────────────────────────────────────────────
const { modal, openModal, onModalConfirm, onModalCancel } = useModal()

// ── 상태 관리 ─────────────────────────────────────────────────────────────────
const isInviteModalOpen = ref(false)
const isGroupModalOpen = ref(false)
const isLoading = ref(false)
const isCreatingGroup = ref(false)

const searchQuery = ref('')
const activeFilterGroup = ref('All')

// 초대 모달 상태
const inviteEmailInput = ref('')
const inviteMemberType = ref('HR')
const pendingInvites = ref([])
const isInviting = ref(false)

// 그룹 생성 모달 상태
const newGroupName = ref('')
const newGroupColor = ref('#14b8a6')

// MemberType 매핑
const memberTypeLabels = { HR: '인사담당자', IVW: '면접관' }
const memberTypes = ['HR', 'IVW']

// 데이터
const members = ref([])
const groups = ref([])  // { id, name, color, memberCount }

// ── 계산된 값 ─────────────────────────────────────────────────────────────────
const filteredMembers = computed(() => {
  return members.value.filter(member => {
    const matchesGroup = activeFilterGroup.value === 'All' || member.group === activeFilterGroup.value
    const matchesSearch = member.name.includes(searchQuery.value)
    return matchesGroup && matchesSearch
  })
})

// ── 헬퍼 ──────────────────────────────────────────────────────────────────────
// formatDate, getInitials, getApiError 는 @/utils/format에서 import됨

// 그룹 hex 색상 → 뱃지 스타일
const getGroupStyle = (groupName) => {
  const group = groups.value.find(g => g.name === groupName)
  if (!group) return {}
  return {
    backgroundColor: group.color + '1a',
    color: group.color,
    border: `1px solid ${group.color}55`,
  }
}

// 현재 멤버의 그룹 ID (select 기본값용)
const getCurrentGroupId = (member) => {
  const g = groups.value.find(g => g.name === member.group)
  return g ? String(g.id) : ''
}

// ── API 호출 ──────────────────────────────────────────────────────────────────
const loadMembers = async () => {
  isLoading.value = true
  try {
    const res = await memberApi.getMembers()
    members.value = res.data.data
  } catch (e) {
    openModal({
      title: '오류',
      message: getApiError(e, '멤버 목록을 불러오지 못했습니다.'),
      type: 'warning',
    })
  } finally {
    isLoading.value = false
  }
}

const loadGroups = async () => {
  try {
    const res = await groupApi.getGroups()
    groups.value = res.data.data
  } catch (e) {
    openModal({
      title: '오류',
      message: getApiError(e, '그룹 목록을 불러오지 못했습니다.'),
      type: 'warning',
    })
  }
}

onMounted(() => {
  loadMembers()
  loadGroups()
})

const handleMemberTypeChange = async (member, newType) => {
  const prevType = member.memberType
  member.memberType = newType
  try {
    await memberApi.updateMember(member.id, newType)
  } catch (e) {
    member.memberType = prevType
    openModal({
      title: '오류',
      message: getApiError(e, '권한 변경에 실패했습니다.'),
      type: 'warning',
    })
  }
}

const handleGroupChange = async (member, groupIdStr) => {
  const groupId = groupIdStr ? Number(groupIdStr) : null
  const prevGroup = member.group
  member.group = groups.value.find(g => g.id === groupId)?.name || null
  try {
    if (groupId) {
      await memberApi.assignGroup(member.id, groupId)
    } else {
      await memberApi.leaveGroup(member.id)
    }
  } catch (e) {
    member.group = prevGroup
    openModal({
      title: '오류',
      message: getApiError(e, '그룹 변경에 실패했습니다.'),
      type: 'warning',
    })
  }
}

const removeMember = (id) => {
  openModal({
    title: '멤버 삭제',
    message: '해당 멤버를 워크스페이스에서 삭제하시겠습니까?',
    type: 'danger',
    showCancel: true,
    confirmText: '삭제하기',
    onConfirm: async () => {
      try {
        await memberApi.removeMember(id)
        members.value = members.value.filter(m => m.id !== id)
      } catch (e) {
        openModal({
          title: '오류',
          message: getApiError(e, '멤버 삭제에 실패했습니다.'),
          type: 'warning',
        })
      }
    },
  })
}

// ── 초대 모달 ─────────────────────────────────────────────────────────────────
const openInviteModal = () => { isInviteModalOpen.value = true }
const closeInviteModal = () => {
  isInviteModalOpen.value = false
  pendingInvites.value = []
  inviteEmailInput.value = ''
  inviteMemberType.value = 'HR'
}

const addInviteToList = () => {
  if (!inviteEmailInput.value || !inviteEmailInput.value.includes('@')) {
    openModal({ title: '입력 오류', message: '유효한 이메일 주소를 입력해주세요.', type: 'warning' })
    return
  }
  if (pendingInvites.value.some(p => p.email === inviteEmailInput.value)) {
    openModal({ title: '중복 이메일', message: '이미 목록에 추가된 이메일입니다.', type: 'warning' })
    return
  }
  pendingInvites.value.push({ email: inviteEmailInput.value, memberType: inviteMemberType.value })
  inviteEmailInput.value = ''
}

const removePendingInvite = (index) => {
  pendingInvites.value.splice(index, 1)
}

const confirmInvitations = async () => {
  if (pendingInvites.value.length === 0) return

  const workspaceId = localStorage.getItem('workspaceId')
  if (!workspaceId) {
    openModal({ title: '오류', message: '워크스페이스 정보를 찾을 수 없습니다. 다시 로그인해주세요.', type: 'warning' })
    return
  }

  isInviting.value = true
  const errors = []
  const count = pendingInvites.value.length

  for (const invite of pendingInvites.value) {
    try {
      await invitationApi.createInvitation(workspaceId, {
        email: invite.email,
        memberType: invite.memberType,
      })
    } catch (e) {
      errors.push(`${invite.email}: ${getApiError(e, '실패')}`)
    }
  }

  isInviting.value = false
  closeInviteModal()

  if (errors.length > 0) {
    openModal({ title: '일부 실패', message: errors.join('\n'), type: 'warning' })
  } else {
    openModal({ title: '초대 완료', message: `${count}명에게 초대 이메일이 발송되었습니다.`, type: 'success' })
  }
}

// ── 그룹 모달 ─────────────────────────────────────────────────────────────────
const openGroupModal = () => { isGroupModalOpen.value = true }
const closeGroupModal = () => {
  isGroupModalOpen.value = false
  newGroupName.value = ''
  newGroupColor.value = '#14b8a6'
}

const createGroup = async () => {
  if (!newGroupName.value.trim()) {
    openModal({ title: '입력 오류', message: '그룹 이름을 입력해주세요.', type: 'warning' })
    return
  }
  isCreatingGroup.value = true
  try {
    const res = await groupApi.createGroup({ name: newGroupName.value.trim(), color: newGroupColor.value })
    groups.value.push(res.data.data)
    closeGroupModal()
  } catch (e) {
    openModal({
      title: '오류',
      message: getApiError(e, '그룹 생성에 실패했습니다.'),
      type: 'warning',
    })
  } finally {
    isCreatingGroup.value = false
  }
}

const deleteGroup = (group) => {
  openModal({
    title: '그룹 삭제',
    message: `"${group.name}" 그룹을 삭제하시겠습니까?\n소속 멤버의 그룹 정보가 초기화됩니다.`,
    type: 'danger',
    showCancel: true,
    confirmText: '삭제하기',
    onConfirm: async () => {
      try {
        await groupApi.deleteGroup(group.id)
        groups.value = groups.value.filter(g => g.id !== group.id)
        members.value.forEach(m => { if (m.group === group.name) m.group = null })
        if (activeFilterGroup.value === group.name) activeFilterGroup.value = 'All'
      } catch (e) {
        openModal({
          title: '오류',
          message: getApiError(e, '그룹 삭제에 실패했습니다.'),
          type: 'warning',
        })
      }
    },
  })
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
      <!-- 사이드바: 그룹 필터 -->
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
            <div
              v-for="group in groups"
              :key="group.id"
              @click="activeFilterGroup = group.name"
              :class="['flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all group/item', activeFilterGroup === group.name ? 'bg-teal-50 text-teal-700 font-bold' : 'hover:bg-slate-50']"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-2 h-2 rounded-full flex-shrink-0" :style="{ backgroundColor: group.color }"></div>
                <span class="text-sm truncate">{{ group.name }}</span>
                <span class="text-[10px] text-slate-400 flex-shrink-0">{{ group.memberCount }}</span>
              </div>
              <button
                @click.stop="deleteGroup(group)"
                class="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover/item:opacity-100 flex-shrink-0 ml-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 멤버 테이블 -->
      <div class="xl:col-span-3 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div class="p-6 border-b border-slate-100">
          <input v-model="searchQuery" type="text" placeholder="이름으로 검색..." class="bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-xl py-2 px-5 text-sm font-bold text-slate-900 outline-none w-full max-w-xs transition-colors" />
        </div>

        <div v-if="isLoading" class="py-16 flex items-center justify-center text-slate-400 text-sm">
          불러오는 중...
        </div>

        <table v-else class="w-full text-left border-collapse">
          <thead>
          <tr class="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-50">
            <th class="px-6 py-5">사용자 정보</th>
            <th class="px-6 py-5">활동 및 합류 정보</th>
            <th class="px-6 py-5">그룹 / 권한</th>
            <th class="px-6 py-5 text-right">관리</th>
          </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
          <tr v-if="filteredMembers.length === 0">
            <td colspan="4" class="px-6 py-12 text-center text-sm text-slate-400">멤버가 없습니다.</td>
          </tr>
          <tr v-for="member in filteredMembers" :key="member.id" class="group hover:bg-slate-50/50 transition-all">
            <td class="px-6 py-5">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-teal-600 font-bold text-xs">{{ getInitials(member.name) }}</div>
                <div>
                  <p class="text-sm font-bold text-slate-900">{{ member.name }}</p>
                  <p class="text-[11px] text-slate-400">합류: {{ formatDate(member.createdAt) }}</p>
                </div>
              </div>
            </td>
            <td class="px-6 py-5">
              <div class="flex flex-col gap-1.5 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <span class="text-[10px] font-bold text-slate-400 w-16 uppercase">최근 접속</span>
                  <span class="text-xs font-medium text-slate-700">{{ formatDate(member.recentAt) }}</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-[10px] font-bold text-slate-400 w-16 uppercase">워크스페이스</span>
                  <span class="text-xs font-medium text-slate-700">{{ formatDate(member.createdAt) }}</span>
                </div>
              </div>
            </td>
            <td class="px-6 py-5">
              <div class="flex flex-col gap-2.5">
                <!-- 그룹 선택 -->
                <div class="relative w-fit group/group">
                  <select
                    :value="getCurrentGroupId(member)"
                    @change="handleGroupChange(member, $event.target.value)"
                    class="appearance-none pl-3 pr-7 py-1.5 text-xs font-semibold rounded-lg outline-none cursor-pointer transition-all border"
                    :class="member.group
                      ? 'bg-white hover:shadow-sm'
                      : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-teal-400 hover:text-teal-600'"
                    :style="member.group ? { ...getGroupStyle(member.group), borderRadius: '0.5rem' } : {}"
                  >
                    <option value="">그룹 없음</option>
                    <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-1.5 flex items-center">
                    <svg class="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <!-- 권한 선택 -->
                <div class="relative w-fit group/role">
                  <select
                    :value="member.memberType"
                    @change="handleMemberTypeChange(member, $event.target.value)"
                    class="appearance-none pl-3 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 outline-none cursor-pointer hover:border-teal-400 hover:text-teal-600 transition-all"
                  >
                    <option v-for="mt in memberTypes" :key="mt" :value="mt">{{ memberTypeLabels[mt] }}</option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-1.5 flex items-center">
                    <svg class="h-3 w-3 text-slate-400 group-hover/role:text-teal-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      <!-- 초대 모달 -->
      <Transition name="modal-fade">
        <div v-if="isInviteModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="closeInviteModal"></div>
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 animate-modal-in flex flex-col">
            <div class="p-6 md:p-8">
              <h2 class="text-xl font-bold text-slate-800 mb-2">사용자 초대하기</h2>
              <p class="text-xs text-slate-400 mb-6">동료의 이메일을 입력하여 워크스페이스에 초대하세요.</p>
              <div class="flex gap-2 mb-6">
                <input v-model="inviteEmailInput" @keyup.enter="addInviteToList" type="text" placeholder="example@company.com" class="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-teal-500 transition-colors" />
                <select v-model="inviteMemberType" class="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-teal-500">
                  <option v-for="mt in memberTypes" :key="mt" :value="mt">{{ memberTypeLabels[mt] }}</option>
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
                      <p class="text-[10px] text-slate-400">{{ memberTypeLabels[invite.memberType] }} 권한</p>
                    </div>
                  </div>
                  <button @click="removePendingInvite(idx)" class="text-slate-300 hover:text-rose-500">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            </div>
            <div class="p-6 pt-4 flex gap-3 justify-end">
              <button @click="closeInviteModal" class="px-5 py-2.5 text-slate-500 font-bold text-sm hover:bg-slate-100 rounded-lg transition-colors">취소</button>
              <button @click="confirmInvitations" :disabled="isInviting" class="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white font-bold text-sm rounded-lg shadow-md shadow-teal-600/10 transition-colors">{{ isInviting ? '전송 중...' : '초대하기' }}</button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- 그룹 생성 모달 -->
      <Transition name="modal-fade">
        <div v-if="isGroupModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="closeGroupModal"></div>
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 animate-modal-in p-6 md:p-8">
            <h2 class="text-xl font-bold text-slate-800 mb-6">그룹 추가</h2>

            <div class="mb-5">
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">그룹 이름</label>
              <input
                v-model="newGroupName"
                type="text"
                placeholder="예: 프로덕트 매니저"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>

            <div class="mb-8">
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">그룹 색상</label>
              <div class="flex items-center gap-4">
                <input
                  v-model="newGroupColor"
                  type="color"
                  class="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                />
                <span
                  class="px-3 py-1 rounded-lg text-sm font-bold border"
                  :style="{ backgroundColor: newGroupColor + '1a', color: newGroupColor, borderColor: newGroupColor + '55' }"
                >
                  {{ newGroupName || '미리보기' }}
                </span>
                <span class="text-xs text-slate-400 font-mono">{{ newGroupColor }}</span>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-slate-50">
              <button @click="closeGroupModal" class="px-5 py-2.5 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-lg transition-colors">취소</button>
              <button @click="createGroup" :disabled="isCreatingGroup" class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-bold text-sm rounded-lg shadow-lg shadow-slate-900/10 transition-colors">
                {{ isCreatingGroup ? '생성 중...' : '그룹 생성하기' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 공통 알림 모달 -->
    <ConfirmModal
      :show="modal.show"
      :title="modal.title"
      :message="modal.message"
      :type="modal.type"
      :show-cancel="modal.showCancel"
      :confirm-text="modal.confirmText"
      :cancel-text="modal.cancelText"
      @confirm="onModalConfirm"
      @cancel="onModalCancel"
    />
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
