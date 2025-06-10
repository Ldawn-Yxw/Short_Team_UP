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
        <router-link to="/create-team" class="active">
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
        <div class="page-title">
          <h1><i class="fas fa-plus-circle"></i> 创建新的运动组队</h1>
        </div>
        <div class="user-menu">
          <span class="username">{{ authStore.username || '用户名' }}</span>
        </div>
      </header>

      <!-- 内容区域 -->
      <div class="content-wrapper">
        <form @submit.prevent="handleSubmit" class="create-team-form">
          <!-- 基本信息 -->
          <div class="form-section">
            <h3><i class="fas fa-info-circle"></i> 基本信息</h3>
            <div class="form-group">
              <label for="title">活动标题</label>
              <input
                id="title"
                v-model="formData.title"
                type="text"
                required
              />
            </div>
            <div class="form-group">
              <label for="sport_type">运动类型</label>
              <select
                id="sport_type"
                v-model="formData.sport_type"
                required
              >
                <option value="">请选择运动类型</option>
                <option value="basketball">篮球</option>
                <option value="football">足球</option>
                <option value="pingpong">乒乓球</option>
                <option value="running">跑步</option>
                <option value="volleyball">排球</option>
              </select>
            </div>
          </div>

          <!-- 时间地点 -->
          <div class="form-section">
            <h3><i class="fas fa-calendar-alt"></i> 时间地点</h3>
            <div class="form-group">
              <label for="start_time">开始时间</label>
              <input
                id="start_time"
                v-model="formData.start_time"
                type="datetime-local"
                required
              />
            </div>
            <div class="form-group">
              <label for="end_time">结束时间</label>
              <input
                id="end_time"
                v-model="formData.end_time"
                type="datetime-local"
                required
              />
            </div>
            <div class="form-group">
              <label for="location">活动地点</label>
              <input
                id="location"
                v-model="formData.location"
                type="text"
                required
              />
            </div>
          </div>

          <!-- 人数和要求 -->
          <div class="form-section">
            <h3><i class="fas fa-users"></i> 人数和要求</h3>
            <div class="form-group">
              <label for="target_number">目标人数</label>
              <input
                id="target_number"
                v-model.number="formData.target_number"
                type="number"
                min="2"
                required
              />
            </div>
            <div class="form-group">
              <label for="requirements">活动要求</label>
              <textarea
                id="requirements"
                v-model="formData.requirements"
                rows="4"
                required
              ></textarea>
            </div>
          </div>

          <div v-if="errorMessage" class="form-error">
            {{ errorMessage }}
          </div>
          
          <!-- 提交按钮 -->
          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="$router.push('/main')">
              <i class="fas fa-times"></i> 取消
            </button>
            <button type="submit" class="btn-create" :disabled="isLoading">
              <i class="fas fa-check"></i> {{ isLoading ? '创建中...' : '创建组队' }}
            </button>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTeamsStore } from '@/stores/teams'

const router = useRouter()
const authStore = useAuthStore()
const teamsStore = useTeamsStore()

// 表单数据
const formData = reactive({
  title: '',
  sport_type: '',
  start_time: '',
  end_time: '',
  location: '',
  target_number: 2,
  requirements: ''
})

const errorMessage = ref('')
const isLoading = ref(false)

// 设置默认时间
const setDefaultDateTime = () => {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(19, 0, 0, 0) // 默认晚上7点

  const endTime = new Date(tomorrow)
  endTime.setHours(21, 0, 0, 0) // 默认晚上9点结束

  formData.start_time = formatDateTimeLocal(tomorrow)
  formData.end_time = formatDateTimeLocal(endTime)
}

// 处理表单提交
const handleSubmit = async () => {
  errorMessage.value = ''
  
  // 验证表单
  if (!validateForm()) {
    return
  }
  
  isLoading.value = true
  
  try {
    const result = await teamsStore.createTeam(formData)
    
    if (result.success) {
      alert('组队创建成功！')
      await router.push('/main')
    } else {
      errorMessage.value = result.message
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '创建失败'
  } finally {
    isLoading.value = false
  }
}

// 验证表单
const validateForm = () => {
  if (!formData.title.trim()) {
    errorMessage.value = '请填写活动标题'
    return false
  }
  
  if (!formData.sport_type) {
    errorMessage.value = '请选择运动类型'
    return false
  }
  
  if (!formData.start_time) {
    errorMessage.value = '请选择开始时间'
    return false
  }
  
  if (!formData.end_time) {
    errorMessage.value = '请选择结束时间'
    return false
  }
  
  if (!formData.location.trim()) {
    errorMessage.value = '请填写活动地点'
    return false
  }
  
  if (formData.target_number < 2) {
    errorMessage.value = '目标人数至少为2人'
    return false
  }
  
  if (!formData.requirements.trim()) {
    errorMessage.value = '请填写活动要求'
    return false
  }
  
  // 检查时间逻辑
  const startTime = new Date(formData.start_time)
  const endTime = new Date(formData.end_time)
  const now = new Date()
  
  if (startTime <= now) {
    errorMessage.value = '开始时间不能早于当前时间'
    return false
  }
  
  if (endTime <= startTime) {
    errorMessage.value = '结束时间必须晚于开始时间'
    return false
  }
  
  // 检查活动时长（不能超过24小时）
  const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
  if (duration > 24) {
    errorMessage.value = '活动时长不能超过24小时'
    return false
  }
  
  return true
}

// 格式化日期时间为datetime-local格式
const formatDateTimeLocal = (date: Date) => {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hour = date.getHours().toString().padStart(2, '0')
  const minute = date.getMinutes().toString().padStart(2, '0')
  
  return `${year}-${month}-${day}T${hour}:${minute}`
}

// 生命周期
onMounted(() => {
  setDefaultDateTime()
  
  // 当开始时间改变时，自动调整结束时间
  const startTimeInput = document.getElementById('start_time') as HTMLInputElement
  if (startTimeInput) {
    startTimeInput.addEventListener('change', () => {
      const startTime = new Date(formData.start_time)
      if (startTime) {
        const endTime = new Date(startTime)
        endTime.setHours(endTime.getHours() + 2) // 默认活动2小时
        formData.end_time = formatDateTimeLocal(endTime)
      }
    })
  }
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

/* 表单样式 */
.create-team-form {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 10px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.form-section {
  margin-bottom: 2rem;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 1.5rem;
}

.form-section h3 {
  color: #2c3e50;
  font-size: 1.1rem;
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.form-error {
  color: #e74c3c;
  background: #fdf2f2;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  border-left: 4px solid #e74c3c;
}

/* 按钮样式 */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-cancel,
.btn-create {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-cancel {
  background: #95a5a6;
  color: white;
}

.btn-cancel:hover {
  background: #7f8c8d;
}

.btn-create {
  background: #3498db;
  color: white;
}

.btn-create:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-1px);
}

.btn-create:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
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
  
  .create-team-form {
    padding: 1.5rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style> 