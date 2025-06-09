<template>
  <section class="login-form">
    <h1>运动组队系统</h1>
    <div class="background-image"></div>
    <div class="container">
      <div class="form-grid">
        <div class="main-form">
          <div class="content">
            <h2>登录</h2>
            <form @submit.prevent="handleLogin">
              <input
                v-model="formData.username"
                type="text"
                placeholder="用户名"
                required
                autofocus
              />
              <input
                v-model="formData.password"
                type="password"
                placeholder="密码"
                required
              />
              <div v-if="errorMessage" class="form-error">
                {{ errorMessage }}
              </div>
              <button class="btn" type="submit" :disabled="isLoading">
                {{ isLoading ? '登录中...' : '登录' }}
              </button>
            </form>
            
            <p class="account">
              如果没有账号那就注册一个吧
              <router-link to="/register"><br/>注册</router-link>
            </p>
          </div>
          <div class="form-image">
            <div class="left-grid-info">
              <img src="D:\\short_team_up_new\\html\\images\\login.png" alt="" class="img-fluid">
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// 表单数据
const formData = reactive({
  username: '',
  password: ''
})

const errorMessage = ref('')
const isLoading = ref(false)

// 处理登录
const handleLogin = async () => {
  errorMessage.value = ''
  isLoading.value = true
  
  try {
    const result = await authStore.login(formData.username, formData.password)
    
    if (result.success) {
      console.log('登录成功，跳转到主页')
      await router.push('/main')
    } else {
      errorMessage.value = result.message
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '登录失败'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-form {
  min-height: 100vh;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-form h1 {
  position: absolute;
  top: 2rem;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  z-index: 10;
}

.background-image {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('D:\\short_team_up_new\\html\\images\\background.jpg') center/cover;
  opacity: 0.1;
  z-index: 1;
}

.container {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 900px;
  padding: 2rem;
}

.form-grid {
  background: white;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.main-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 500px;
}

.content {
  padding: 3rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.content h2 {
  color: #333;
  font-size: 1.8rem;
  margin-bottom: 2rem;
  text-align: center;
}

.content input {
  width: 100%;
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.content input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-error {
  color: #e74c3c;
  background: #fdf2f2;
  padding: 0.8rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.account {
  text-align: center;
  margin-top: 1.5rem;
  color: #666;
}

.account a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.account a:hover {
  text-decoration: underline;
}

.form-image {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.left-grid-info {
  text-align: center;
}

.img-fluid {
  max-width: 80%;
  height: auto;
}

@media (max-width: 768px) {
  .main-form {
    grid-template-columns: 1fr;
  }
  
  .form-image {
    display: none;
  }
  
  .content {
    padding: 2rem;
  }
}
</style> 