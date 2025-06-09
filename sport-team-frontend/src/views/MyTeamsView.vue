<template>
  <div class="main-layout">
    <!-- 左侧导航栏 -->
    <nav class="sidebar">
      <div class="sidebar-header">
        <i class="fas fa-running"></i>
        <span>运动组队系统</span>
      </div>
      <div class="sidebar-menu">
        <router-link to="/main">
          <i class="fas fa-home"></i>
          <span>首页</span>
        </router-link>
        <router-link to="/create-team">
          <i class="fas fa-plus-circle"></i>
          <span>创建组队</span>
        </router-link>
        <router-link to="/my-teams" class="active">
          <i class="fas fa-user-friends"></i>
          <span>我的组队</span>
        </router-link>
      </div>
    </nav>

    <!-- 主要内容区 -->
    <main class="main-content">
      <!-- 顶部栏 -->
      <header class="top-bar">
        <div class="page-title">
          <h1><i class="fas fa-user-friends"></i> 我的组队</h1>
        </div>
        <div class="user-menu">
          <span class="username">{{ authStore.username || '用户名' }}</span>
        </div>
      </header>

      <!-- 内容区域 -->
      <div class="content-wrapper">
        <!-- 组队列表 -->
        <div class="teams-section">
          <div class="section-header">
            <h2>组队列表</h2>
            <div class="tab-buttons">
              <button 
                :class="['tab-btn', { active: currentType === 'created' }]" 
                @click="handleTabChange('created')"
              >
                我创建的
              </button>
              <button 
                :class="['tab-btn', { active: currentType === 'joined' }]" 
                @click="handleTabChange('joined')"
              >
                我参与的
              </button>
            </div>
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
            <button @click="loadMyTeams" class="btn-primary">重试</button>
          </div>
          
          <!-- 空状态 -->
          <div v-else-if="teamsStore.myTeams.length === 0" class="empty-state">
            <i class="fas fa-inbox"></i>
            <h3>暂无{{ currentType === 'created' ? '创建的' : '参与的' }}组队</h3>
            <p>{{ currentType === 'created' ? '快去创建你的第一个组队吧！' : '快去加入其他组队吧！' }}</p>
            <router-link 
              :to="currentType === 'created' ? '/create-team' : '/main'" 
              class="btn-primary"
            >
              {{ currentType === 'created' ? '创建组队' : '浏览组队' }}
            </router-link>
          </div>
          
          <!-- 组队卡片 -->
          <div v-else class="team-cards">
            <div 
              v-for="team in teamsStore.myTeams" 
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
                  <span v-if="currentType === 'created'" class="creator-badge">创建者</span>
                  <span v-else class="member-badge">已加入</span>
                </div>
              </div>
              
              <div class="team-details">
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
                  <span v-if="team.is_full" class="full-badge">已满员</span>
                </div>
              </div>
              
              <div class="team-requirements">
                <p>{{ team.requirements }}</p>
              </div>
              
              <div class="team-actions">
                <button 
                  v-if="currentType === 'joined' && !team.is_expired"
                  @click="handleLeaveTeam(team.id)"
                  class="btn-danger btn-sm"
                >
                  <i class="fas fa-sign-out-alt"></i> 退出组队
                </button>
                <span v-if="team.is_expired" class="expired-text">活动已结束</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useTeamsStore } from '@/stores/teams'

const authStore = useAuthStore()
const teamsStore = useTeamsStore()

// 状态
const currentType = ref<'created' | 'joined'>('created')

// 方法
const loadMyTeams = async () => {
  await teamsStore.loadMyTeams(currentType.value)
}

const handleTabChange = async (type: 'created' | 'joined') => {
  currentType.value = type
  await loadMyTeams()
}

const handleLeaveTeam = async (teamId: number) => {
  if (!confirm('确定要退出该组队吗？')) {
    return
  }
  
  const result = await teamsStore.leaveTeam(teamId)
  if (result.success) {
    alert('成功退出组队')
    await loadMyTeams() // 重新加载列表
  } else {
    alert('退出失败：' + result.message)
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
  await loadMyTeams()
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

/* 侧边栏样式 */
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

.page-title h1 {
  color: #2c3e50;
  font-size: 1.3rem;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* 内容区域 */
.content-wrapper {
  padding: 2rem;
  flex: 1;
}

.teams-section {
  background-color: #fff;
  border-radius: 10px;
  padding: 1.5rem;
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

.tab-buttons {
  display: flex;
  gap: 0.5rem;
}

.tab-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  background: #fff;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
}

.tab-btn:hover,
.tab-btn.active {
  background-color: #3498db;
  color: white;
  border-color: #3498db;
}

.btn-primary {
  background: #3498db;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 6px;
  text-decoration: none;
  cursor: pointer;
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

.team-card.expired {
  opacity: 0.6;
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

.sport-type {
  color: #666;
  font-size: 0.9rem;
}

.team-status {
  margin-left: auto;
}

.creator-badge,
.member-badge,
.full-badge {
  padding: 0.3rem 0.8rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.creator-badge {
  background: #e8f5e8;
  color: #2d8f2d;
}

.member-badge {
  background: #d4edda;
  color: #155724;
}

.full-badge {
  background: #f8d7da;
  color: #721c24;
  margin-left: 0.5rem;
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

.team-requirements p {
  margin: 0;
  line-height: 1.5;
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
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
  }
  
  .sidebar {
    display: none;
  }
  
  .content-wrapper {
    padding: 1rem;
  }
  
  .team-cards {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
}
</style> 