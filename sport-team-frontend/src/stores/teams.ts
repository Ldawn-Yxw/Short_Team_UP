import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/api'
import type { Team } from '@/api'

export const useTeamsStore = defineStore('teams', () => {
  // 状态
  const teams = ref<Team[]>([])
  const myTeams = ref<Team[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 动作
  const loadTeams = async (params: Record<string, string> = {}) => {
    isLoading.value = true
    error.value = null
    
    try {
      console.log('加载组队列表...')
      const result = await api.getTeams(params)
      teams.value = result
      console.log('加载组队列表成功，数量:', result.length)
      return { success: true, data: result }
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载组队列表失败'
      error.value = message
      console.error('加载组队列表失败:', err)
      return { success: false, message }
    } finally {
      isLoading.value = false
    }
  }

  const loadMyTeams = async (type: 'created' | 'joined' | 'all' = 'all') => {
    isLoading.value = true
    error.value = null
    
    try {
      console.log('加载我的组队...')
      let result: Team[]
      
      if (type === 'created') {
        result = await api.getCreatedTeams()
      } else if (type === 'joined') {
        result = await api.getJoinedTeams()
      } else {
        result = await api.getMyTeams()
      }
      
      myTeams.value = result
      console.log('加载我的组队成功，数量:', result.length)
      return { success: true, data: result }
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载我的组队失败'
      error.value = message
      console.error('加载我的组队失败:', err)
      return { success: false, message }
    } finally {
      isLoading.value = false
    }
  }

  const createTeam = async (teamData: {
    title: string
    sport_type: string
    start_time: string
    end_time: string
    location: string
    target_number: number
    requirements: string
  }) => {
    isLoading.value = true
    error.value = null
    
    try {
      console.log('创建组队...')
      const result = await api.createTeam(teamData)
      console.log('创建组队成功:', result.title)
      
      // 重新加载组队列表
      await loadTeams()
      
      return { success: true, data: result, message: '组队创建成功！' }
    } catch (err) {
      const message = err instanceof Error ? err.message : '创建组队失败'
      error.value = message
      console.error('创建组队失败:', err)
      return { success: false, message }
    } finally {
      isLoading.value = false
    }
  }

  const joinTeam = async (teamId: number) => {
    error.value = null
    
    try {
      console.log('加入组队:', teamId)
      const result = await api.joinTeam(teamId)
      console.log('加入组队成功')
      
      // 更新本地状态
      const team = teams.value.find(t => t.id === teamId)
      if (team) {
        team.is_joined = true
        team.current_number += 1
      }
      
      return { success: true, message: result.message }
    } catch (err) {
      const message = err instanceof Error ? err.message : '加入组队失败'
      error.value = message
      console.error('加入组队失败:', err)
      return { success: false, message }
    }
  }

  const leaveTeam = async (teamId: number) => {
    error.value = null
    
    try {
      console.log('退出组队:', teamId)
      const result = await api.leaveTeam(teamId)
      console.log('退出组队成功')
      
      // 更新本地状态
      const team = teams.value.find(t => t.id === teamId)
      if (team) {
        team.is_joined = false
        team.current_number -= 1
      }
      
      // 从我的组队中移除
      myTeams.value = myTeams.value.filter(t => t.id !== teamId)
      
      return { success: true, message: result.message }
    } catch (err) {
      const message = err instanceof Error ? err.message : '退出组队失败'
      error.value = message
      console.error('退出组队失败:', err)
      return { success: false, message }
    }
  }

  const clearError = () => {
    error.value = null
  }

  const clearTeams = () => {
    teams.value = []
    myTeams.value = []
  }

  return {
    // 状态
    teams,
    myTeams,
    isLoading,
    error,
    // 动作
    loadTeams,
    loadMyTeams,
    createTeam,
    joinTeam,
    leaveTeam,
    clearError,
    clearTeams
  }
}) 