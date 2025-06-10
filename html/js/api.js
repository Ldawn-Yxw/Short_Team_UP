// API基础URL - 根据当前域名自动调整
const BASE_URL = window.location.hostname === '127.0.0.1' ? 
    'http://127.0.0.1:8000/api' : 'http://localhost:8000/api';

// 获取CSRF Token
function getCSRFToken() {
    // 首先尝试从meta标签获取
    const metaToken = document.querySelector('meta[name="csrf-token"]');
    if (metaToken) {
        return metaToken.getAttribute('content');
    }
    
    // 从cookie获取
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    
    return cookieValue;
}

// 获取CSRF Token（如果没有则通过API获取）
async function ensureCSRFToken() {
    let token = getCSRFToken();
    
    // 如果cookie中没有token，通过API获取
    if (!token) {
        try {
            const response = await fetch(`${BASE_URL}/accounts/csrf/`, {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                token = data.csrfToken;
                console.log('从API获取到CSRF token:', token);
            }
        } catch (error) {
            console.error('获取CSRF token失败:', error);
        }
    } else {
        console.log('从cookie获取到CSRF token:', token);
    }
    
    return token;
}

// 通用请求配置（已禁用CSRF）
const getRequestConfig = async (method = 'GET', data = null) => {
    const config = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',  // 包含cookie用于session认证
    };

    if (data) {
        config.body = JSON.stringify(data);
    }

    // 调试：打印cookie信息
    console.log('当前Cookie:', document.cookie);
    console.log('请求配置:', config);

    return config;
};

// 处理API响应
const handleResponse = async (response) => {
    console.log('Response status:', response.status);
    console.log('Response URL:', response.url);
    
    const contentType = response.headers.get("content-type");
    console.log('Content-Type:', contentType);
    
    if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();
        console.log('Response data:', data);
        
        if (!response.ok) {
            if (response.status === 403) {
                // CSRF token 失效或未登录
                console.error('403 Forbidden - 认证失败');
                throw new Error('认证失败，请检查登录状态');
            }
            if (data.non_field_errors) {
                throw new Error(data.non_field_errors[0]);
            }
            if (typeof data === 'object' && Object.keys(data).length > 0) {
                const firstError = Object.values(data)[0];
                throw new Error(Array.isArray(firstError) ? firstError[0] : firstError);
            }
            throw new Error(data.message || '操作失败');
        }
        return data;
    } else {
        // 如果不是JSON响应，获取文本内容进行调试
        const text = await response.text();
        console.error('Non-JSON response:', text);
        console.error('Response URL:', response.url);
        console.error('Response status:', response.status);
        
        if (response.status === 404) {
            throw new Error(`API接口不存在: ${response.url}`);
        } else if (response.status === 500) {
            throw new Error('服务器内部错误，请检查后端日志');
        } else if (response.status === 403) {
            throw new Error('没有权限访问，请先登录');
        } else {
            throw new Error(`服务器返回了非JSON格式的数据 (状态码: ${response.status})`);
        }
    }
};

// API请求工具
const api = {
    // 登录
    login: async (username, password) => {
        try {
            const response = await fetch(`${BASE_URL}/accounts/login/`, {
                ...(await getRequestConfig('POST', { username, password }))
            });

            const data = await handleResponse(response);
            
            // 登录成功后检查Cookie
            console.log('登录后的Cookie:', document.cookie);
            const hasSessionId = document.cookie.includes('sessionid');
            console.log('登录后是否有sessionid:', hasSessionId);
            
            // 缓存用户信息
            if (data.user) {
                sessionStorage.setItem('userProfile', JSON.stringify(data.user));
                console.log('用户信息已缓存:', data.user.username);
            }
            
            return data;
        } catch (error) {
            throw error;
        }
    },

    // 注册
    register: async (userData) => {
        try {
            const response = await fetch(`${BASE_URL}/accounts/register/`, {
                ...(await getRequestConfig('POST', userData))
            });
            const data = await handleResponse(response);
            // console.log(data.user.BASE_URL);
            // alert('注册成功');
            // 缓存用户信息
            if (data.user) {
                sessionStorage.setItem('userProfile', JSON.stringify(data.user));
            }
            return data;
        } catch (error) {
            throw error;
        }
    },

    // 退出登录
    logout: async () => {
        try {
            const response = await fetch(`${BASE_URL}/accounts/logout/`, {
                ...(await getRequestConfig('POST'))
            });
            
            return await handleResponse(response);
        } catch (error) {
            throw error;
        }
    },

    // 创建组队
    createTeam: async (teamData) => {
        try {
            const response = await fetch(`${BASE_URL}/teams/`, {
                ...(await getRequestConfig('POST', teamData))
            });
            
            const data = await handleResponse(response);
            console.log('组队创建成功:', data);
            
            // 缓存最新创建的团队信息（可选）
            if (data.id) {
                sessionStorage.setItem('latestTeam', JSON.stringify(data));
            }
            
            return data;
        } catch (error) {
            throw error;
        }
    },

    // 获取组队列表
    getTeams: async (params = {}) => {
        try {
            const queryString = new URLSearchParams(params).toString();
            const response = await fetch(`${BASE_URL}/teams/${queryString ? `?${queryString}` : ''}`, {
                ...(await getRequestConfig('GET'))
            });
            
            return await handleResponse(response);
        } catch (error) {
            throw error;
        }
    },

    // 加入组队
    joinTeam: async (teamId) => {
        try {
            const response = await fetch(`${BASE_URL}/teams/${teamId}/join/`, {
                ...(await getRequestConfig('POST'))
            });
            
            return await handleResponse(response);
        } catch (error) {
            throw error;
        }
    },

    // 退出组队
    leaveTeam: async (teamId) => {
        try {
            const response = await fetch(`${BASE_URL}/teams/${teamId}/leave/`, {
                ...(await getRequestConfig('POST'))
            });
            
            return await handleResponse(response);
        } catch (error) {
            throw error;
        }
    },

    // 获取用户资料
    getUserProfile: async () => {
        try {
            const response = await fetch(`${BASE_URL}/accounts/profile/`, {
                ...(await getRequestConfig('GET'))
            });
            
            return await handleResponse(response);
        } catch (error) {
            throw error;
        }
    },

    // 更新用户资料
    updateProfile: async (profileData) => {
        try {
            const response = await fetch(`${BASE_URL}/accounts/profile/`, {
                ...(await getRequestConfig('PATCH', profileData))
            });
            
            return await handleResponse(response);
        } catch (error) {
            throw error;
        }
    },

    // 获取创建的组队
    getCreatedTeams: async () => {
        try {
            const response = await fetch(`${BASE_URL}/teams/?created_by_me=true`, {
                ...(await getRequestConfig('GET'))
            });
            
            return await handleResponse(response);
        } catch (error) {
            throw error;
        }
    },

    // 获取参与的组队
    getJoinedTeams: async () => {
        try {
            const response = await fetch(`${BASE_URL}/teams/?joined_teams=true`, {
                ...(await getRequestConfig('GET'))
            });
            
            return await handleResponse(response);
        } catch (error) {
            throw error;
        }
    },

    // 获取我的组队
    getMyTeams: async () => {
        try {
            const response = await fetch(`${BASE_URL}/teams/?my_teams=true`, {
                ...(await getRequestConfig('GET'))
            });
            
            return await handleResponse(response);
        } catch (error) {
            throw error;
        }
    },

    // 检查认证状态
    checkAuth: async () => {
        try {
            console.log('正在检查用户认证状态...');
            console.log('发送认证检查请求时的Cookie:', document.cookie);
            
            const response = await fetch(`${BASE_URL}/accounts/check-auth/`, {
                ...(await getRequestConfig('GET'))
            });
            
            console.log('认证检查响应状态:', response.status);
            
            if (!response.ok) {
                console.error('认证检查失败，状态码:', response.status);
                // 如果是403，说明没有有效的session
                if (response.status === 403) {
                    console.log('提示：Cookie中可能没有有效的sessionid，需要重新登录');
                }
                throw new Error('用户未登录或登录已过期');
            }
            
            const result = await handleResponse(response);
            console.log('认证检查成功:', result);
            return result;
        } catch (error) {
            console.error('认证检查异常:', error);
            throw error;
        }
    },

    // 检查Cookie状态（调试用）
    checkCookieStatus: () => {
        const cookies = document.cookie;
        const hasSessionId = cookies.includes('sessionid');
        console.log('=== Cookie状态检查 ===');
        console.log('所有Cookie:', cookies);
        console.log('是否有sessionid:', hasSessionId);
        console.log('SessionStorage用户信息:', sessionStorage.getItem('userProfile'));
        console.log('当前域名:', window.location.hostname);
        console.log('当前端口:', window.location.port);
        console.log('API BASE_URL:', BASE_URL);
        return { cookies, hasSessionId };
    },

    // 调试登录状态（强制检查）
    debugLogin: async () => {
        console.log('=== 调试登录状态 ===');
        try {
            console.log('1. 当前Cookie:', document.cookie);
            console.log('2. 尝试获取用户资料...');
            const profile = await api.getUserProfile();
            console.log('3. 用户资料获取成功:', profile);
            return profile;
        } catch (error) {
            console.log('3. 用户资料获取失败:', error.message);
            console.log('4. 尝试检查认证状态...');
            try {
                const auth = await api.checkAuth();
                console.log('5. 认证检查成功:', auth);
            } catch (authError) {
                console.log('5. 认证检查失败:', authError.message);
            }
        }
    },

    // 获取组队详情
    getTeamDetail: async (teamId) => {
        try {
            const response = await fetch(`${BASE_URL}/teams/${teamId}/`, {
                ...(await getRequestConfig('GET'))
            });
            
            return await handleResponse(response);
        } catch (error) {
            throw error;
        }
    },

    // 获取组队成员列表
    getTeamMembers: async (teamId) => {
        try {
            const response = await fetch(`${BASE_URL}/teams/${teamId}/members/`, {
                ...(await getRequestConfig('GET'))
            });
            
            return await handleResponse(response);
        } catch (error) {
            throw error;
        }
    },
}; 