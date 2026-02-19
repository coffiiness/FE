import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import orgData from '@/data/organization.json'

export const useOrganizationStore = defineStore('organization', () => {
    const organizations = ref(orgData)

    // 모든 멤버를 플랫하게 반환 (검색용)
    const allMembers = computed(() => {
        const members = []
        organizations.value.forEach(dept => {
            dept.teams.forEach(team => {
                team.members.forEach(member => {
                    members.push({
                        ...member,
                        teamId: team.id,
                        teamName: team.name,
                        deptId: dept.id,
                        deptName: dept.name,
                        // 검색 편의를 위한 텍스트
                        searchText: `${member.name} ${member.position} ${team.name} ${dept.name}`
                    })
                })
            })
        })
        return members
    })

    // 부서 목록 반환
    const departments = computed(() => {
        return organizations.value.map(dept => ({
            id: dept.id,
            name: dept.name,
            teams: dept.teams
        }))
    })

    const getMembersByTeam = (teamId) => {
        const team = departments.value
            .flatMap(d => d.teams)
            .find(t => t.id === teamId)
        return team ? team.members : []
    }

    return {
        organizations,
        allMembers,
        departments,
        getMembersByTeam
    }
})
