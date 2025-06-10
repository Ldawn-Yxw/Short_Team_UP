// 我的组队页面JavaScript

let currentType = 'created'; // 当前显示的类型

document.addEventListener('DOMContentLoaded', async () => {
    // 加载用户信息
    await loadUserProfile();
    
    // 绑定事件
    bindEvents();
    
    // 加载组队列表
    await loadMyTeams();
});

// 绑定事件
function bindEvents() {
    // 标签切换
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            // 更新标签状态
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            // 更新当前类型
            currentType = e.target.dataset.type;
            
            // 重新加载列表
            await loadMyTeams();
        });
    });
}

// 加载用户信息
async function loadUserProfile() {
    // 先尝试从缓存获取用户信息
    const cachedProfile = sessionStorage.getItem('userProfile');
    if (cachedProfile) {
        try {
            const userProfile = JSON.parse(cachedProfile);
            document.getElementById('username').textContent = userProfile.username;
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
    } catch (error) {
        console.error('加载用户信息失败:', error);
        // 如果没有缓存且API调用失败，则跳转到登录页
        if (!cachedProfile) {
            alert('获取用户信息失败，请重新登录');
            window.location.href = 'index.html';
        }
    }
}

// 加载我的组队列表
async function loadMyTeams() {
    const teamList = document.getElementById('teamList');
    teamList.innerHTML = '<div class="loading">加载中...</div>';
    
    try {
        let teams;
        if (currentType === 'created') {
            teams = await api.getCreatedTeams();
        } else {
            teams = await api.getJoinedTeams();
        }
        
        if (teams.length === 0) {
            teamList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h3>暂无${currentType === 'created' ? '创建的' : '参与的'}组队</h3>
                    <p>${currentType === 'created' ? '快去创建你的第一个组队吧！' : '快去加入其他组队吧！'}</p>
                    <a href="${currentType === 'created' ? 'create_team.html' : 'main.html'}" class="btn-primary">
                        ${currentType === 'created' ? '创建组队' : '浏览组队'}
                    </a>
                </div>
            `;
            return;
        }
        
        // 渲染组队卡片
        teamList.innerHTML = teams.map(team => createTeamCard(team)).join('');
        
    } catch (error) {
        console.error('加载组队列表失败:', error);
        teamList.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>加载失败</h3>
                <p>${error.message}</p>
                <button onclick="loadMyTeams()" class="btn-primary">重试</button>
            </div>
        `;
    }
}

// 创建组队卡片HTML
function createTeamCard(team) {
    const isCreator = currentType === 'created';
    const startTime = new Date(team.start_time);
    const now = new Date();
    const isExpired = startTime < now;
    
    return `
        <div class="team-card ${isExpired ? 'expired' : ''}">
            <div class="team-header">
                <div class="sport-icon">
                    <i class="fas ${getSportIcon(team.sport_type)}"></i>
                </div>
                <div class="team-info">
                    <h3>${team.title}</h3>
                    <span class="sport-type">${getSportName(team.sport_type)}</span>
                </div>
                <div class="team-status">
                    ${isCreator ? '<span class="creator-badge">创建者</span>' : '<span class="member-badge">已加入</span>'}
                </div>
            </div>
            
            <div class="team-details">
                <div class="detail-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${team.location}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-clock"></i>
                    <span>${formatDateTime(team.start_time)} - ${formatTime(team.end_time)}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-users"></i>
                    <span>${team.current_number}/${team.target_number}人</span>
                    ${team.is_full ? '<span class="full-badge">已满员</span>' : ''}
                </div>
            </div>
            
            <div class="team-requirements">
                <p>${team.requirements}</p>
            </div>
            
            <div class="team-actions">
                ${!isCreator && !isExpired ? `
                    <button onclick="leaveTeam(${team.id})" class="btn-danger btn-sm">
                        <i class="fas fa-sign-out-alt"></i> 退出组队
                    </button>
                ` : ''}
                ${isExpired ? '<span class="expired-text">活动已结束</span>' : ''}
            </div>
        </div>
    `;
}

// 退出组队
async function leaveTeam(teamId) {
    if (!confirm('确定要退出该组队吗？')) {
        return;
    }
    
    try {
        await api.leaveTeam(teamId);
        alert('成功退出组队');
        await loadMyTeams(); // 重新加载列表
    } catch (error) {
        alert('退出失败：' + error.message);
    }
}

// 获取运动类型图标
function getSportIcon(sportType) {
    const icons = {
        'basketball': 'fa-basketball-ball',
        'football': 'fa-futbol',
        'pingpong': 'fa-table-tennis',
        'running': 'fa-running',
        'volleyball': 'fa-volleyball-ball'
    };
    return icons[sportType] || 'fa-dumbbell';
}

// 获取运动类型名称
function getSportName(sportType) {
    const names = {
        'basketball': '篮球',
        'football': '足球',
        'pingpong': '乒乓球',
        'running': '跑步',
        'volleyball': '排球'
    };
    return names[sportType] || sportType;
}

// 格式化日期时间
function formatDateTime(dateString) {
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    return `${month}月${day}日 ${hour}:${minute}`;
}

// 格式化时间
function formatTime(dateString) {
    const date = new Date(dateString);
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    return `${hour}:${minute}`;
} 