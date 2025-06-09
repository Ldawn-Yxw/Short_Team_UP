<template>
  <div class="main-layout">
    <!-- 左侧导航栏 -->
    <nav class="sidebar">
      <div class="sidebar-header">
        <i class="fas fa-running"></i>
        <span>运动组队系统</span>
      </div>
      <div class="sidebar-menu">
        <router-link to="/main" class="active">
          <i class="fas fa-home"></i>
          <span>首页</span>
        </router-link>
        <router-link to="/create-team">
          <i class="fas fa-plus-circle"></i>
          <span>创建组队</span>
        </router-link>
        <router-link to="/my-teams">
          <i class="fas fa-user-friends"></i>
          <span>我的组队</span>
        </router-link>
      </div>
    </nav>

    <!-- 主要内容区 -->
    <main class="main-content">
      <!-- 顶部栏 -->
      <header class="top-bar">
        <div class="search-box">
          <input 
            v-model="searchTerm" 
            type="text" 
            placeholder="搜索活动..."
          >
          <i class="fas fa-search"></i>
        </div>
        <div class="user-menu">
          <span class="username">{{ authStore.username || '用户名' }}</span>
          <button @click="handleLogout" class="logout-btn">
            <i class="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </header>

      <!-- 内容区域 -->
      <div class="content-wrapper">
        <!-- 运动项目分类 -->
        <section class="sports-categories">
          <div class="section-header">
            <h2>运动项目</h2>
          </div>
          <div class="category-list">
            <button 
              v-for="category in sportCategories" 
              :key="category.type"
              :class="['category-item', { active: currentSportType === category.type }]"
              @click="handleCategoryChange(category.type)"
            >
              <i :class="category.icon"></i>
              <span>{{ category.name }}</span>
            </button>
          </div>
        </section>

        <!-- 组队列表 -->
        <section class="team-list">
          <div class="section-header">
            <h2>组队列表</h2>
            <button @click="loadTeams" class="refresh-btn">
              <i class="fas fa-sync-alt"></i>
              刷新
            </button>
          </div>
          
          <!-- 加载状态 -->
          <div v-if="teamsStore.isLoading" class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            加载中...
          </div>
          
          <!-- 错误状态 -->
          <div v-else-if="teamsStore.error" class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>加载失败</h3>
            <p>{{ teamsStore.error }}</p>
            <button @click="loadTeams" class="btn-primary">重试</button>
          </div>
          
          <!-- 空状态 -->
          <div v-else-if="filteredTeams.length === 0" class="empty-state">
            <i class="fas fa-search"></i>
            <h3>暂无组队信息</h3>
            <p>快去创建第一个组队吧！</p>
            <router-link to="/create-team" class="btn-primary">创建组队</router-link>
          </div>
          
          <!-- 组队卡片 -->
          <div v-else class="team-cards">
            <div 
              v-for="team in filteredTeams" 
              :key="team.id"
              :class="['team-card', { expired: team.is_expired }]"
            >
              <div class="team-header">
                <div class="sport-icon">
                  <i :class="getSportIcon(team.sport_type)"></i>
                </div>
                <div class="team-info">
                  <h3>{{ team.title }}</h3>
                  <span class="sport-type">{{ getSportName(team.sport_type) }}</span>
                </div>
                <div class="team-status">
                  <span v-if="team.is_joined" class="joined-badge">已加入</span>
                  <span v-if="team.is_full" class="full-badge">已满员</span>
                </div>
              </div>
              
              <div class="team-details">
                <div class="detail-item">
                  <i class="fas fa-user"></i>
                  <span>创建者: {{ team.creator.username }}</span>
                </div>
                <div class="detail-item">
                  <i class="fas fa-map-marker-alt"></i>
                  <span>{{ team.location }}</span>
                </div>
                <div class="detail-item">
                  <i class="fas fa-clock"></i>
                  <span>{{ formatDateTime(team.start_time) }} - {{ formatTime(team.end_time) }}</span>
                </div>
                <div class="detail-item">
                  <i class="fas fa-users"></i>
                  <span>{{ team.current_number }}/{{ team.target_number }}人</span>
                </div>
              </div>
              
              <div class="team-requirements">
                <p>{{ team.requirements }}</p>
              </div>
              
              <div class="team-actions">
                <button 
                  v-if="!team.is_joined && !team.is_full && !team.is_expired"
                  @click="handleJoinTeam(team.id)"
                  class="btn-primary btn-sm"
                >
                  <i class="fas fa-plus"></i> 加入组队
                </button>
                <button 
                  v-if="team.is_joined"
                  @click="handleLeaveTeam(team.id)"
                  class="btn-danger btn-sm"
                >
                  <i class="fas fa-minus"></i> 退出组队
                </button>
                <span v-if="team.is_expired" class="expired-text">活动已结束</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTeamsStore } from '@/stores/teams'

const router = useRouter()
const authStore = useAuthStore()
const teamsStore = useTeamsStore()

// 状态
const currentSportType = ref('')
const searchTerm = ref('')

// 运动类型配置
const sportCategories = [
  { type: '', name: '全部', icon: 'fas fa-th' },
  { type: 'basketball', name: '篮球', icon: 'fas fa-basketball-ball' },
  { type: 'football', name: '足球', icon: 'fas fa-futbol' },
  { type: 'pingpong', name: '乒乓球', icon: 'fas fa-table-tennis' },
  { type: 'running', name: '跑步', icon: 'fas fa-running' },
  { type: 'volleyball', name: '排球', icon: 'fas fa-volleyball-ball' }
]

// 计算属性
const filteredTeams = computed(() => {
  let teams = teamsStore.teams
  
  // 按搜索词过滤
  if (searchTerm.value.trim()) {
    const term = searchTerm.value.toLowerCase().trim()
    teams = teams.filter(team => 
      team.title.toLowerCase().includes(term) ||
      team.location.toLowerCase().includes(term) ||
      team.requirements.toLowerCase().includes(term)
    )
  }
  
  return teams
})

// 方法
const loadTeams = async () => {
  const params: Record<string, string> = {}
  if (currentSportType.value) {
    params.sport_type = currentSportType.value
  }
  await teamsStore.loadTeams(params)
}

const handleCategoryChange = async (sportType: string) => {
  currentSportType.value = sportType
  await loadTeams()
}

const handleJoinTeam = async (teamId: number) => {
  const result = await teamsStore.joinTeam(teamId)
  if (result.success) {
    console.log('加入成功')
  } else {
    alert('加入失败：' + result.message)
  }
}

const handleLeaveTeam = async (teamId: number) => {
  if (!confirm('确定要退出该组队吗？')) {
    return
  }
  
  const result = await teamsStore.leaveTeam(teamId)
  if (result.success) {
    console.log('退出成功')
  } else {
    alert('退出失败：' + result.message)
  }
}

const handleLogout = async () => {
  if (!confirm('确定要退出登录吗？')) {
    return
  }
  
  const result = await authStore.logout()
  if (result.success) {
    await router.push('/login')
  }
}

// 工具函数
const getSportIcon = (sportType: string) => {
  const icons: Record<string, string> = {
    'basketball': 'fas fa-basketball-ball',
    'football': 'fas fa-futbol',
    'pingpong': 'fas fa-table-tennis',
    'running': 'fas fa-running',
    'volleyball': 'fas fa-volleyball-ball'
  }
  return icons[sportType] || 'fas fa-dumbbell'
}

const getSportName = (sportType: string) => {
  const names: Record<string, string> = {
    'basketball': '篮球',
    'football': '足球',
    'pingpong': '乒乓球',
    'running': '跑步',
    'volleyball': '排球'
  }
  return names[sportType] || sportType
}

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hour = date.getHours().toString().padStart(2, '0')
  const minute = date.getMinutes().toString().padStart(2, '0')
  return `${month}月${day}日 ${hour}:${minute}`
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  const hour = date.getHours().toString().padStart(2, '0')
  const minute = date.getMinutes().toString().padStart(2, '0')
  return `${hour}:${minute}`
}

// 生命周期
onMounted(async () => {
  await loadTeams()
})
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css');

/* 基本布局 */
.main-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f5f6fa;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* 侧边栏 */
.sidebar {
  width: 240px;
  height: 100vh;
  background-color: #2c3e50;
  color: #fff;
  position: fixed;
  left: 0;
  top: 0;
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

.sidebar-header {
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-header i {
  font-size: 1.5rem;
}

.sidebar-menu {
  padding: 1rem 0;
}

.sidebar-menu a {
  padding: 0.8rem 1.5rem;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s;
}

.sidebar-menu a:hover,
.sidebar-menu a.active {
  color: #fff;
  background-color: rgba(255, 255, 255, 0.1);
}

/* 主内容区 */
.main-content {
  flex: 1;
  margin-left: 240px;
  display: flex;
  flex-direction: column;
}

/* 顶部栏 */
.top-bar {
  height: 60px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
}

.search-box {
  position: relative;
  width: 300px;
}

.search-box input {
  width: 100%;
  padding: 0.5rem 2rem 0.5rem 1rem;
  border: 1px solid #e5e5e5;
  border-radius: 20px;
  font-size: 0.9rem;
}

.search-box i {
  position: absolute;
  right: 0.8rem;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logout-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
}

.logout-btn:hover {
  background-color: #f0f0f0;
  color: #e74c3c;
}

/* 内容区域 */
.content-wrapper {
  padding: 2rem;
  flex: 1;
}

.sports-categories,
.team-list {
  background-color: #fff;
  border-radius: 10px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  color: #2c3e50;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
}

.category-list {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.8rem 1.2rem;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  background: #fff;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
}

.category-item:hover,
.category-item.active {
  border-color: #3498db;
  color: #3498db;
  background-color: rgba(52, 152, 219, 0.1);
}

.refresh-btn,
.btn-primary {
  background: #3498db;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary:hover {
  background: #2980b9;
}

/* 状态显示 */
.loading,
.error-state,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.loading i {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #3498db;
}

/* 组队卡片 */
.team-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.team-card {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e5e5e5;
  overflow: hidden;
  transition: all 0.3s;
}

.team-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.team-header {
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border-bottom: 1px solid #f0f0f0;
}

.sport-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.team-info h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.team-status {
  margin-left: auto;
}

.joined-badge,
.full-badge {
  padding: 0.3rem 0.8rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.joined-badge {
  background: #d4edda;
  color: #155724;
}

.full-badge {
  background: #f8d7da;
  color: #721c24;
}

.team-details {
  padding: 1rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  color: #666;
  font-size: 0.9rem;
}

.detail-item i {
  color: #3498db;
  width: 16px;
}

.team-requirements {
  padding: 0 1rem;
  color: #666;
  font-size: 0.9rem;
}

.team-actions {
  padding: 1rem;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 1rem;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.btn-danger {
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-danger:hover {
  background: #c0392b;
}

.expired-text {
  color: #e74c3c;
  font-size: 0.9rem;
}
</style> 