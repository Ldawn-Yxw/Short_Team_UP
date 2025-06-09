<template>
  <section class="register-form">
    <h1>运动组队系统</h1>
    <div class="background-image"></div>
    <div class="container">
      <div class="form-grid">
        <div class="main-form">
          <div class="content">
            <h2>注册</h2>
            <form @submit.prevent="handleRegister">
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
              <input
                v-model="formData.confirmPassword"
                type="password"
                placeholder="确认密码"
                required
              />
              <input
                v-model.number="formData.age"
                type="number"
                placeholder="年龄"
                min="0"
                max="150"
                required
              />
              <div class="gender-group">
                <label class="gender-option">
                  <input
                    v-model="formData.gender"
                    type="radio"
                    value="male"
                    required
                  />
                  <span class="radio-circle"></span>
                  <span class="radio-label">男</span>
                </label>
                <label class="gender-option">
                  <input
                    v-model="formData.gender"
                    type="radio"
                    value="female"
                    required
                  />
                  <span class="radio-circle"></span>
                  <span class="radio-label">女</span>
                </label>
              </div>
              <input
                v-model="formData.wechatId"
                type="text"
                placeholder="微信号"
                required
              />
              <div v-if="errorMessage" class="form-error">
                {{ errorMessage }}
              </div>
              <button class="btn" type="submit" :disabled="isLoading">
                {{ isLoading ? '注册中...' : '注册' }}
              </button>
            </form>
            
            <p class="account">
              已有账号？
              <router-link to="/login">立即登录</router-link>
            </p>
          </div>
          <div class="form-image">
            <div class="left-grid-info">
              <img src="/images/login.png" alt="" class="img-fluid">
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
  password: '',
  confirmPassword: '',
  age: 0,
  gender: '',
  wechatId: ''
})

const errorMessage = ref('')
const isLoading = ref(false)

// 处理注册
const handleRegister = async () => {
  errorMessage.value = ''
  
  // 验证密码
  if (formData.password !== formData.confirmPassword) {
    errorMessage.value = '两次输入的密码不一致'
    return
  }
  
  // 验证性别
  if (!formData.gender) {
    errorMessage.value = '请选择性别'
    return
  }
  
  isLoading.value = true
  
  try {
    const result = await authStore.register({
      username: formData.username,
      password: formData.password,
      confirm_password: formData.confirmPassword,
      age: formData.age,
      gender: formData.gender,
      wechat_id: formData.wechatId
    })
    
    if (result.success) {
      console.log('注册成功，跳转到主页')
      await router.push('/main')
    } else {
      errorMessage.value = result.message
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '注册失败'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.register-form {
  min-height: 100vh;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.register-form h1 {
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
  background: url('/images/background.jpg') center/cover;
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
  min-height: 600px;
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

.content input[type="text"],
.content input[type="password"],
.content input[type="number"] {
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

.gender-group {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
  justify-content: center;
}

.gender-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
}

.gender-option input[type="radio"] {
  display: none;
}

.radio-circle {
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-radius: 50%;
  position: relative;
  transition: all 0.3s;
}

.gender-option input[type="radio"]:checked + .radio-circle {
  border-color: #667eea;
  background: #667eea;
}

.gender-option input[type="radio"]:checked + .radio-circle::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
}

.radio-label {
  color: #333;
  font-weight: 500;
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
  
  .gender-group {
    justify-content: flex-start;
  }
}
</style> 