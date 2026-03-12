import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { memberApi } from '@/api/member'
import { groupApi } from '@/api/group'

const WORKSPACE_ID = '__workspace__'
const WORKSPACE_NAME = '워크스페이스'
const UNGROUPED_ID = '__ungrouped__'
const UNGROUPED_NAME = '미분류'
const HR_POSITION = '인사담당자'
const INTERVIEWER_POSITION = '면접관'

const toPosition = (memberType) => memberType === 'HR' ? HR_POSITION : INTERVIEWER_POSITION
const toSearchText = (member, teamName) => {
  const name = String(member?.name ?? '')
  const position = toPosition(member?.memberType)
  return [name, position, teamName, WORKSPACE_NAME].join(' ').trim()
}

export const useOrganizationStore = defineStore('organization', () => {
  const organizations = ref([])
  const loading = ref(false)
  const loaded = ref(false)

  const buildOrganizations = (members = [], groups = []) => {
    const teams = groups.map((group) => ({
      id: group.id,
      name: group.name,
      color: group.color,
      selectable: true,
      members: []
    }))

    const teamMap = new Map(teams.map((team) => [String(team.id), team]))
    let ungroupedTeam = null

    members.forEach((member) => {
      const rawGroupId = member?.groupId
      let team = rawGroupId != null ? teamMap.get(String(rawGroupId)) : null

      if (!team) {
        if (!ungroupedTeam) {
          ungroupedTeam = {
            id: UNGROUPED_ID,
            name: UNGROUPED_NAME,
            color: null,
            selectable: false,
            members: []
          }
        }
        team = ungroupedTeam
      }

      const teamName = team.name
      team.members.push({
        ...member,
        id: member?.id ?? null,
        userId: member?.userId ?? null,
        teamId: team.id,
        teamName,
        deptId: WORKSPACE_ID,
        deptName: WORKSPACE_NAME,
        position: toPosition(member?.memberType),
        searchText: toSearchText(member, teamName)
      })
    })

    teams.forEach((team) => {
      team.members.sort((left, right) => String(left?.name ?? '').localeCompare(String(right?.name ?? ''), 'ko'))
    })

    if (ungroupedTeam?.members?.length) {
      ungroupedTeam.members.sort((left, right) => String(left?.name ?? '').localeCompare(String(right?.name ?? ''), 'ko'))
      teams.push(ungroupedTeam)
    }

    return [{
      id: WORKSPACE_ID,
      name: WORKSPACE_NAME,
      teams
    }]
  }

  const loadOrganizations = async ({ force = false } = {}) => {
    if (loading.value) return organizations.value
    if (loaded.value && !force) return organizations.value

    loading.value = true
    try {
      const [memberResponse, groupResponse] = await Promise.all([
        memberApi.getMembers(),
        groupApi.getGroups()
      ])

      const members = Array.isArray(memberResponse?.data?.data) ? memberResponse.data.data : []
      const groups = Array.isArray(groupResponse?.data?.data) ? groupResponse.data.data : []
      organizations.value = buildOrganizations(members, groups)
      loaded.value = true
      return organizations.value
    } catch (error) {
      organizations.value = []
      loaded.value = false
      throw error
    } finally {
      loading.value = false
    }
  }

  const allMembers = computed(() => {
    const members = []
    organizations.value.forEach((dept) => {
      dept.teams.forEach((team) => {
        team.members.forEach((member) => {
          members.push({
            ...member,
            teamId: team.id,
            teamName: team.name,
            deptId: dept.id,
            deptName: dept.name,
            searchText: member.searchText || toSearchText(member, team.name)
          })
        })
      })
    })
    return members
  })

  const departments = computed(() => {
    return organizations.value.map((dept) => ({
      id: dept.id,
      name: dept.name,
      teams: dept.teams
    }))
  })

  const getMembersByTeam = (teamId) => {
    const team = departments.value
      .flatMap((dept) => dept.teams)
      .find((item) => String(item.id) === String(teamId))
    return team ? team.members : []
  }

  return {
    organizations,
    loading,
    loaded,
    allMembers,
    departments,
    getMembersByTeam,
    loadOrganizations
  }
})
