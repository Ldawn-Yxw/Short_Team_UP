// API基础URL
const BASE_URL = 'http://localhost:8000/api';

// API请求工具
const api = {
    // 登录
    login: async (username, password) => {
        try {
            const response = await fetch(`${BASE_URL}/auth/login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',  // 包含cookie
                body: JSON.stringify({ username, password })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || '登录失败');
            }
            
            return await response.json();
        } catch (error) {
            throw error;
        }
    },

    // 注册
    register: async (userData) => {
        try {
            const response = await fetch(`${BASE_URL}/auth/register/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || '注册失败');
            }
            
            return await response.json();
        } catch (error) {
            throw error;
        }
    },

    // 退出登录
    logout: async () => {
        try {
            const response = await fetch(`${BASE_URL}/auth/logout/`, {
                method: 'POST',
                credentials: 'include',
            });
            
            if (!response.ok) {
                throw new Error('退出登录失败');
            }
            
            return true;
        } catch (error) {
            throw error;
        }
    },

    // 获取用户信息
    getUserProfile: async () => {
        try {
            const response = await fetch(`${BASE_URL}/auth/profile/`, {
                credentials: 'include',
            });
            
            if (!response.ok) {
                throw new Error('获取用户信息失败');
            }
            
            return await response.json();
        } catch (error) {
            throw error;
        }
    }
}; 