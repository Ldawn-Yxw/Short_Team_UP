// 创建组队页面JavaScript

document.addEventListener('DOMContentLoaded', async () => {
    // 加载用户信息
    await loadUserProfile();
    
    // 绑定事件
    bindEvents();
    
    // 设置默认时间
    setDefaultDateTime();
});

// 加载用户信息
async function loadUserProfile() {
    // 先检查Cookie状态
    console.log('当前所有Cookie:', document.cookie);
    console.log('SessionStorage用户信息:', sessionStorage.getItem('userProfile'));
    
    // 检查是否有sessionid cookie
    const hasSessionId = document.cookie.includes('sessionid');
    console.log('是否有sessionid cookie:', hasSessionId);
    
    // 先检查登录状态
    try {
        console.log('检查用户登录状态...');
        const authStatus = await api.checkAuth();
        console.log('用户已登录:', authStatus);
    } catch (authError) {
        console.error('用户未登录:', authError);
        console.log('登录状态检查失败，需要重新登录');
        
        // 清除过期的SessionStorage
        sessionStorage.removeItem('userProfile');
        
        alert('登录已过期，请重新登录');
        window.location.href = 'index.html';
        return;
    }
    
    // 先尝试从缓存获取用户信息
    const cachedProfile = sessionStorage.getItem('userProfile');
    if (cachedProfile) {
        try {
            const userProfile = JSON.parse(cachedProfile);
            document.getElementById('username').textContent = userProfile.username;
            console.log('从缓存加载用户信息:', userProfile.username);
            return;
        } catch (e) {
            console.error('解析缓存用户信息失败:', e);
        }
    }
    
    // 如果没有缓存，尝试从API获取
    try {
        const userProfile = await api.getUserProfile();
        document.getElementById('username').textContent = userProfile.username;
        
        // 缓存用户信息
        sessionStorage.setItem('userProfile', JSON.stringify(userProfile));
        console.log('从API加载用户信息:', userProfile.username);
    } catch (error) {
        console.error('加载用户信息失败:', error);
        // 如果没有缓存且API调用失败，则跳转到登录页
        if (!cachedProfile) {
            alert('获取用户信息失败，请重新登录');
            window.location.href = 'index.html';
        }
    }
}

// 绑定事件
function bindEvents() {
    // 表单提交
    document.getElementById('createTeamForm').addEventListener('submit', handleFormSubmit);
    
    // 结束时间自动调整
    document.getElementById('start_time').addEventListener('change', updateEndTime);
}

// 设置默认时间
function setDefaultDateTime() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(19, 0, 0, 0); // 默认晚上7点
    
    const endTime = new Date(tomorrow);
    endTime.setHours(21, 0, 0, 0); // 默认晚上9点结束
    
    // 格式化为datetime-local格式
    document.getElementById('start_time').value = formatDateTimeLocal(tomorrow);
    document.getElementById('end_time').value = formatDateTimeLocal(endTime);
}

// 当开始时间改变时，自动调整结束时间
function updateEndTime() {
    const startTime = new Date(document.getElementById('start_time').value);
    if (startTime) {
        const endTime = new Date(startTime);
        endTime.setHours(endTime.getHours() + 2); // 默认活动2小时
        document.getElementById('end_time').value = formatDateTimeLocal(endTime);
    }
}

// 处理表单提交
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const errorElement = document.getElementById('createTeamError');
    errorElement.textContent = '';
    
    // 获取表单数据
    const formData = {
        title: document.getElementById('title').value.trim(),
        sport_type: document.getElementById('sport_type').value,
        start_time: document.getElementById('start_time').value,
        end_time: document.getElementById('end_time').value,
        location: document.getElementById('location').value.trim(),
        target_number: parseInt(document.getElementById('target_number').value),
        requirements: document.getElementById('requirements').value.trim()
    };
    
    // 验证表单
    if (!validateForm(formData, errorElement)) {
        return;
    }
    
    // 禁用提交按钮
    const submitBtn = document.querySelector('.btn-create');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 创建中...';
    
    try {
        const team = await api.createTeam(formData);
        // 创建成功，直接跳转到主页面（模仿注册逻辑）
        window.location.href = 'main.html';
    } catch (error) {
        errorElement.textContent = error.message;
    } finally {
        // 恢复提交按钮
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// 验证表单
function validateForm(data, errorElement) {
    // 检查必填字段
    if (!data.title) {
        errorElement.textContent = '请填写活动标题';
        return false;
    }
    
    if (!data.sport_type) {
        errorElement.textContent = '请选择运动类型';
        return false;
    }
    
    if (!data.start_time) {
        errorElement.textContent = '请选择开始时间';
        return false;
    }
    
    if (!data.end_time) {
        errorElement.textContent = '请选择结束时间';
        return false;
    }
    
    if (!data.location) {
        errorElement.textContent = '请填写活动地点';
        return false;
    }
    
    if (!data.target_number || data.target_number < 2) {
        errorElement.textContent = '目标人数至少为2人';
        return false;
    }
    
    if (!data.requirements) {
        errorElement.textContent = '请填写活动要求';
        return false;
    }
    
    // 检查时间逻辑
    const startTime = new Date(data.start_time);
    const endTime = new Date(data.end_time);
    const now = new Date();
    
    if (startTime <= now) {
        errorElement.textContent = '开始时间不能早于当前时间';
        return false;
    }
    
    if (endTime <= startTime) {
        errorElement.textContent = '结束时间必须晚于开始时间';
        return false;
    }
    
    // 检查活动时长（不能超过24小时）
    const duration = (endTime - startTime) / (1000 * 60 * 60); // 小时
    if (duration > 24) {
        errorElement.textContent = '活动时长不能超过24小时';
        return false;
    }
    
    return true;
}

// 格式化日期时间为datetime-local格式
function formatDateTimeLocal(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}T${hour}:${minute}`;
}