// 主页面JavaScript

let currentSportType = ''; // 当前选择的运动类型

document.addEventListener('DOMContentLoaded', async () => {
    // 加载用户信息
    await loadUserProfile();
    
    // 绑定事件
    bindEvents();
    
    // 检查是否有新创建的组队
    checkNewTeam();
    
    // 加载组队列表
    await loadTeams();
});

// 加载用户信息
async function loadUserProfile() {
    console.log('开始检查用户认证状态...');
    
    try {
        // 使用新的认证检查API
        const authResult = await api.checkAuth();
        console.log('认证检查结果:', authResult);
        
        if (authResult.authenticated && authResult.user) {
            document.getElementById('username').textContent = authResult.username;
            // 缓存用户信息
            sessionStorage.setItem('userProfile', JSON.stringify(authResult.user));
            console.log('用户已认证:', authResult.usr.username);
        } else {
            console.log('用户未认证，跳转到登录页');
            alert('请先登录');
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('认证检查失败:', error);
        
        // 尝试使用缓存的用户信息
        const cachedProfile = sessionStorage.getItem('userProfile');
        if (cachedProfile) {
            try {
                const userProfile = JSON.parse(cachedProfile);
                document.getElementById('username').textContent = userProfile.username;
                console.log('使用缓存的用户信息:', userProfile.username);
                return;
            } catch (e) {
                console.error('解析缓存用户信息失败:', e);
            }
        }
        
        alert('认证检查失败，请重新登录');
        window.location.href = 'index.html';
    }
}

// 检查是否有新创建的组队
function checkNewTeam() {
    const newTeamCreated = sessionStorage.getItem('newTeamCreated');
    if (newTeamCreated === 'true') {
        // 清除标记
        sessionStorage.removeItem('newTeamCreated');
        // 显示成功提示
        console.log('检测到新创建的组队，列表将自动更新');
    }
}

// 绑定事件
function bindEvents() {
    // 运动类型筛选
    document.querySelectorAll('.category-item').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            // 更新按钮状态
            document.querySelectorAll('.category-item').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            // 更新当前运动类型
            currentSportType = e.currentTarget.dataset.type;
            
            // 重新加载组队列表
            await loadTeams();
        });
    });
    
    // 搜索功能
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
}

// 加载组队列表
async function loadTeams() {
    const teamCards = document.querySelector('.team-cards');
    teamCards.innerHTML = '<div class="loading">加载中...</div>';
    
    try {
        const params = {};
        if (currentSportType) {
            params.sport_type = currentSportType;
        }
        
        const teams = await api.getTeams(params);
        
        if (teams.length === 0) {
            teamCards.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>暂无组队信息</h3>
                    <p>快去创建第一个组队吧！</p>
                    <a href="create_team.html" class="btn-primary">创建组队</a>
                </div>
            `;
            return;
        }
        
        // 对组队列表进行排序：未结束的在前，已结束的在后
        const sortedTeams = teams.sort((a, b) => {
            const now = new Date();
            const aEndTime = new Date(a.end_time);
            const bEndTime = new Date(b.end_time);
            
            const aIsEnded = aEndTime < now;
            const bIsEnded = bEndTime < now;
            
            // 如果一个已结束，一个未结束，未结束的排在前面
            if (aIsEnded !== bIsEnded) {
                return aIsEnded ? 1 : -1;
            }
            
            // 如果都是同一状态，按创建时间倒序（最新的在前）
            return new Date(b.created_at || b.id) - new Date(a.created_at || a.id);
        });
        
        // 渲染组队卡片
        teamCards.innerHTML = sortedTeams.map(team => createTeamCard(team)).join('');
        
    } catch (error) {
        console.error('加载组队列表失败:', error);
        teamCards.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>加载失败</h3>
                <p>${error.message}</p>
                <button onclick="loadTeams()" class="btn-primary">重试</button>
            </div>
        `;
    }
}

// 创建组队卡片HTML
function createTeamCard(team) {
    const endTime = new Date(team.end_time);
    const now = new Date();
    const isEnded = endTime < now;
    
    return `
        <div class="team-card ${isEnded ? 'ended' : ''}" onclick="handleTeamCardClick(${team.id}, ${team.is_joined})">
            <div class="team-header">
                <div class="sport-icon">
                    <i class="fas ${getSportIcon(team.sport_type)}"></i>
                </div>
                <div class="team-info">
                    <h3>${team.title}</h3>
                    <span class="sport-type">${getSportName(team.sport_type)}</span>
                </div>
                <div class="team-status">
                    ${isEnded ? '<span class="ended-badge">已结束</span>' : ''}
                    ${team.is_joined ? '<span class="joined-badge">已加入</span>' : ''}
                    ${team.is_full ? '<span class="full-badge">已满员</span>' : ''}
                </div>
            </div>
            
            <div class="team-details">
                <div class="detail-item">
                    <i class="fas fa-user"></i>
                    <span>创建者: ${team.creator.username}</span>
                </div>
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
                </div>
            </div>
            
            <div class="team-requirements">
                <p>${team.requirements}</p>
            </div>
            
            <div class="team-actions" onclick="event.stopPropagation()">
                ${!team.is_joined && !team.is_full && !isEnded ? `
                    <button onclick="joinTeam(${team.id})" class="btn-primary btn-sm">
                        <i class="fas fa-plus"></i> 加入组队
                    </button>
                ` : ''}
                ${team.is_joined && !isEnded ? `
                    <button onclick="leaveTeam(${team.id})" class="btn-danger btn-sm">
                        <i class="fas fa-minus"></i> 退出组队
                    </button>
                ` : ''}
                ${isEnded ? '<span class="ended-text">活动已结束</span>' : ''}
            </div>
        </div>
    `;
}

// 处理组队卡片点击（显示详情）
function handleTeamCardClick(teamId, isJoined) {
    // 这里可以实现查看详情的功能
    console.log('点击组队卡片:', teamId, isJoined);
}

// 加入组队
async function joinTeam(teamId) {
    try {
        await api.joinTeam(teamId);
        alert('成功加入组队！');
        await loadTeams(); // 重新加载列表
    } catch (error) {
        alert('加入失败：' + error.message);
    }
}

// 退出组队
async function leaveTeam(teamId) {
    if (!confirm('确定要退出该组队吗？')) {
        return;
    }
    
    try {
        await api.leaveTeam(teamId);
        alert('成功退出组队');
        await loadTeams(); // 重新加载列表
    } catch (error) {
        alert('退出失败：' + error.message);
    }
}

// 搜索处理
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    const teamCards = document.querySelectorAll('.team-card');
    
    teamCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const location = card.querySelector('.fa-map-marker-alt').nextElementSibling.textContent.toLowerCase();
        const requirements = card.querySelector('.team-requirements p').textContent.toLowerCase();
        
        const isMatch = title.includes(searchTerm) || 
                       location.includes(searchTerm) || 
                       requirements.includes(searchTerm);
        
        card.style.display = isMatch ? 'block' : 'none';
    });
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
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