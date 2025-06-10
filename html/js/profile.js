// 个人资料页面JavaScript

document.addEventListener('DOMContentLoaded', async () => {
    // 加载用户信息
    await loadUserProfile();
    
    // 加载统计信息
    await loadUserStats();
    
    // 加载最近活动
    await loadRecentActivities();
    
    // 绑定表单提交事件
    document.getElementById('profileForm').addEventListener('submit', handleProfileSubmit);
});

// 加载用户信息
async function loadUserProfile() {
    try {
        const userProfile = await api.getUserProfile();
        
        // 更新页面上的用户信息
        document.getElementById('username').textContent = userProfile.username;
        document.getElementById('profileUsername').textContent = userProfile.username;
        document.getElementById('profileJoinDate').textContent = formatDate(userProfile.date_joined);
        
        // 填充表单
        document.getElementById('age').value = userProfile.age || '';
        document.getElementById('gender').value = userProfile.gender || 'male';
        document.getElementById('wechatId').value = userProfile.wechat_id || '';
        
    } catch (error) {
        console.error('加载用户信息失败:', error);
        alert('加载用户信息失败：' + error.message);
    }
}

// 加载用户统计信息
async function loadUserStats() {
    try {
        // 获取创建的组队数量
        const createdTeams = await api.getCreatedTeams();
        document.getElementById('createdTeamsCount').textContent = createdTeams.length;
        
        // 获取参与的组队数量
        const joinedTeams = await api.getJoinedTeams();
        document.getElementById('joinedTeamsCount').textContent = joinedTeams.length;
        
    } catch (error) {
        console.error('加载统计信息失败:', error);
    }
}

// 加载最近活动
async function loadRecentActivities() {
    try {
        // 获取所有相关的组队
        const [createdTeams, joinedTeams] = await Promise.all([
            api.getCreatedTeams(),
            api.getJoinedTeams()
        ]);
        
        // 合并并按时间排序
        const activities = [
            ...createdTeams.map(team => ({
                type: 'created',
                time: new Date(team.created_at),
                team: team
            })),
            ...joinedTeams.map(team => ({
                type: 'joined',
                time: new Date(team.created_at),
                team: team
            }))
        ].sort((a, b) => b.time - a.time).slice(0, 5); // 只显示最近5条
        
        // 渲染活动列表
        const activitiesList = document.getElementById('activitiesList');
        activitiesList.innerHTML = activities.map(activity => createActivityItem(activity)).join('');
        
    } catch (error) {
        console.error('加载最近活动失败:', error);
    }
}

// 创建活动项目HTML
function createActivityItem(activity) {
    const icon = activity.type === 'created' ? 'fa-plus-circle' : 'fa-sign-in-alt';
    const action = activity.type === 'created' ? '创建了组队' : '加入了组队';
    
    return `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">
                    ${action}：${activity.team.title}
                </div>
                <div class="activity-time">
                    ${formatDateTime(activity.time)}
                </div>
            </div>
        </div>
    `;
}

// 处理表单提交
async function handleProfileSubmit(event) {
    event.preventDefault();
    
    const formData = {
        age: parseInt(document.getElementById('age').value) || null,
        gender: document.getElementById('gender').value,
        wechat_id: document.getElementById('wechatId').value
    };
    
    try {
        await api.updateProfile(formData);
        alert('个人资料更新成功！');
    } catch (error) {
        console.error('更新个人资料失败:', error);
        alert('更新失败：' + error.message);
    }
}

// 退出登录
async function logout() {
    if (!confirm('确定要退出登录吗？')) {
        return;
    }
    
    try {
        await api.logout();
        // 清除本地存储的用户信息
        sessionStorage.removeItem('userProfile');
        // 跳转到登录页
        window.location.href = 'index.html';
    } catch (error) {
        console.error('退出登录失败:', error);
        alert('退出失败：' + error.message);
    }
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 格式化日期时间
function formatDateTime(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
} 