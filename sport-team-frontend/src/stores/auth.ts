import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api'
import type { User } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const isAuthenticated = computed(() => !!user.value)
  const username = computed(() => user.value?.username || '')

  // 动作
  const checkAuth = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      console.log('开始检查用户认证状态...')
      const authResult = await api.checkAuth()
      console.log('认证检查结果:', authResult)
      
      if (authResult.authenticated && authResult.user) {
        user.value = authResult.user
        // 缓存用户信息
        sessionStorage.setItem('userProfile', JSON.stringify(authResult.user))
        console.log('用户已认证:', authResult.user.username)
        return true
      } else {
        user.value = null
        sessionStorage.removeItem('userProfile')
        console.log('用户未认证')
        return false
      }
    } catch (err) {
      console.error('认证检查失败:', err)
      error.value = err instanceof Error ? err.message : '认证检查失败'
      
      // 尝试使用缓存的用户信息
      const cachedProfile = sessionStorage.getItem('userProfile')
      if (cachedProfile) {
        try {
          user.value = JSON.parse(cachedProfile)
          console.log('使用缓存的用户信息:', user.value?.username)
          return true
        } catch (e) {
          console.error('解析缓存用户信息失败:', e)
          sessionStorage.removeItem('userProfile')
        }
      }
      
      user.value = null
      return false
    } finally {
      isLoading.value = false
    }
  }

  const login = async (username: string, password: string) => {
    isLoading.value = true
    error.value = null
    
    try {
      const result = await api.login(username, password)
      user.value = result.user
      // 缓存用户信息
      sessionStorage.setItem('userProfile', JSON.stringify(result.user))
      console.log('登录成功:', result.user.username)
      return { success: true, message: result.message }
    } catch (err) {
      const message = err instanceof Error ? err.message : '登录失败'
      error.value = message
      console.error('登录失败:', err)
      return { success: false, message }
    } finally {
      isLoading.value = false
    }
  }

  const register = async (userData: {
    username: string
    password: string
    confirm_password: string
    age: number
    gender: string
    wechat_id: string
  }) => {
    isLoading.value = true
    error.value = null
    
    try {
      const result = await api.register(userData)
      user.value = result.user
      // 缓存用户信息
      sessionStorage.setItem('userProfile', JSON.stringify(result.user))
      console.log('注册成功:', result.user.username)
      return { success: true, message: result.message }
    } catch (err) {
      const message = err instanceof Error ? err.message : '注册失败'
      error.value = message
      console.error('注册失败:', err)
      return { success: false, message }
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      await api.logout()
      user.value = null
      sessionStorage.removeItem('userProfile')
      console.log('登出成功')
      return { success: true, message: '登出成功' }
    } catch (err) {
      const message = err instanceof Error ? err.message : '登出失败'
      error.value = message
      console.error('登出失败:', err)
      return { success: false, message }
    } finally {
      isLoading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // 状态
    user,
    isLoading,
    error,
    // 计算属性
    isAuthenticated,
    username,
    // 动作
    checkAuth,
    login,
    register,
    logout,
    clearError
  }
}) 