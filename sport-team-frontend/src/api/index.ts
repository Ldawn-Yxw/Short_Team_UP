// API服务模块
const BASE_URL = 'http://localhost:8000/api'

// 用户接口
export interface User {
  id: number
  username: string
  age?: number
  gender?: string
  wechat_id?: string
  date_joined: string
}

// 组队接口
export interface Team {
  id: number
  title: string
  location: string
  start_time: string
  end_time: string
  target_number: number
  current_number: number
  sport_type: string
  requirements: string
  creator: User
  created_at: string
  updated_at: string
  is_full: boolean
  is_expired: boolean
  is_joined: boolean
}

// 认证响应接口
export interface AuthResponse {
  authenticated: boolean
  user: User | null
}

// 通用请求配置
const getRequestConfig = (method = 'GET', data?: any) => {
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // 包含cookie用于session认证
  }

  if (data) {
    config.body = JSON.stringify(data)
  }

  return config
}

// 处理API响应
const handleResponse = async (response: Response) => {
  console.log('Response status:', response.status)
  console.log('Response URL:', response.url)

  const contentType = response.headers.get('content-type')
  
  if (contentType && contentType.indexOf('application/json') !== -1) {
    const data = await response.json()
    console.log('Response data:', data)

    if (!response.ok) {
      if (response.status === 403) {
        console.error('403 Forbidden - 认证失败')
        throw new Error('认证失败，请检查登录状态')
      }
      if (data.non_field_errors) {
        throw new Error(data.non_field_errors[0])
      }
      if (typeof data === 'object' && Object.keys(data).length > 0) {
        const firstError = Object.values(data)[0]
        throw new Error(Array.isArray(firstError) ? firstError[0] : String(firstError))
      }
      throw new Error(data.message || '操作失败')
    }
    return data
  } else {
    const text = await response.text()
    console.error('Non-JSON response:', text)
    
    if (response.status === 404) {
      throw new Error(`API接口不存在: ${response.url}`)
    } else if (response.status === 500) {
      throw new Error('服务器内部错误，请检查后端日志')
    } else if (response.status === 403) {
      throw new Error('没有权限访问，请先登录')
    } else {
      throw new Error(`服务器返回了非JSON格式的数据 (状态码: ${response.status})`)
    }
  }
}

// API类
export class ApiService {
  // 检查认证状态
  async checkAuth(): Promise<AuthResponse> {
    const response = await fetch(`${BASE_URL}/accounts/check-auth/`, getRequestConfig('GET'))
    return await handleResponse(response)
  }

  // 用户注册
  async register(userData: {
    username: string
    password: string
    confirm_password: string
    age: number
    gender: string
    wechat_id: string
  }): Promise<{ message: string; user: User }> {
    const response = await fetch(`${BASE_URL}/accounts/register/`, getRequestConfig('POST', userData))
    return await handleResponse(response)
  }

  // 用户登录
  async login(username: string, password: string): Promise<{ message: string; user: User }> {
    const response = await fetch(`${BASE_URL}/accounts/login/`, getRequestConfig('POST', { username, password }))
    return await handleResponse(response)
  }

  // 用户登出
  async logout(): Promise<{ message: string }> {
    const response = await fetch(`${BASE_URL}/accounts/logout/`, getRequestConfig('POST'))
    return await handleResponse(response)
  }

  // 获取用户资料
  async getUserProfile(): Promise<User> {
    const response = await fetch(`${BASE_URL}/accounts/profile/`, getRequestConfig('GET'))
    return await handleResponse(response)
  }

  // 创建组队
  async createTeam(teamData: {
    title: string
    sport_type: string
    start_time: string
    end_time: string
    location: string
    target_number: number
    requirements: string
  }): Promise<Team> {
    const response = await fetch(`${BASE_URL}/teams/`, getRequestConfig('POST', teamData))
    return await handleResponse(response)
  }

  // 获取组队列表
  async getTeams(params: Record<string, string> = {}): Promise<Team[]> {
    const queryString = new URLSearchParams(params).toString()
    const response = await fetch(`${BASE_URL}/teams/${queryString ? `?${queryString}` : ''}`, getRequestConfig('GET'))
    return await handleResponse(response)
  }

  // 加入组队
  async joinTeam(teamId: number): Promise<{ message: string }> {
    const response = await fetch(`${BASE_URL}/teams/${teamId}/join/`, getRequestConfig('POST'))
    return await handleResponse(response)
  }

  // 退出组队
  async leaveTeam(teamId: number): Promise<{ message: string }> {
    const response = await fetch(`${BASE_URL}/teams/${teamId}/leave/`, getRequestConfig('POST'))
    return await handleResponse(response)
  }

  // 获取我创建的组队
  async getCreatedTeams(): Promise<Team[]> {
    const response = await fetch(`${BASE_URL}/teams/?created_by_me=true`, getRequestConfig('GET'))
    return await handleResponse(response)
  }

  // 获取我参与的组队
  async getJoinedTeams(): Promise<Team[]> {
    const response = await fetch(`${BASE_URL}/teams/?joined_teams=true`, getRequestConfig('GET'))
    return await handleResponse(response)
  }

  // 获取我的组队
  async getMyTeams(): Promise<Team[]> {
    const response = await fetch(`${BASE_URL}/teams/?my_teams=true`, getRequestConfig('GET'))
    return await handleResponse(response)
  }
}

// 导出API服务实例
export const api = new ApiService() 