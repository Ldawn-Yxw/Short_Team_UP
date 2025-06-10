// 组队详情页面JavaScript

let currentTeamId = null;
let currentTeam = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 获取URL参数中的组队ID
    const urlParams = new URLSearchParams(window.location.search);
    currentTeamId = urlParams.get('id');
    
    if (!currentTeamId) {
        alert('组队ID不存在');
        goBack();
        return;
    }
    
    // 加载用户信息
    await loadUserProfile();
    
    // 加载组队详情
    await loadTeamDetail();
    
    // 加载成员列表
    await loadTeamMembers();
});

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
        if (!cachedProfile) {
            alert('获取用户信息失败，请重新登录');
            window.location.href = 'index.html';
        }
    }
}

// 加载组队详情
async function loadTeamDetail() {
    try {
        currentTeam = await api.getTeamDetail(currentTeamId);
        displayTeamInfo(currentTeam);
    } catch (error) {
        console.error('加载组队详情失败:', error);
        alert('加载组队详情失败：' + error.message);
        goBack();
    }
}

// 显示组队信息
function displayTeamInfo(team) {
    // 设置运动图标和类型
    const sportIcon = document.getElementById('sportIcon');
    const sportIconClass = team.sport_type === 'badminton' ? 'fa-feather-alt' : 
                          team.sport_type === 'tennis' ? 'fa-baseball-ball' : 
                          team.sport_type === 'fitness' ? 'fa-dumbbell' : 
                          team.sport_type === 'swimming' ? 'fa-swimmer' : 
                          team.sport_type === 'basketball' ? 'fa-basketball-ball' :
                          team.sport_type === 'football' ? 'fa-futbol' :
                          team.sport_type === 'pingpong' ? 'fa-table-tennis' :
                          team.sport_type === 'running' ? 'fa-running' :
                          team.sport_type === 'volleyball' ? 'fa-volleyball-ball' : 
                          'fa-dumbbell';
    sportIcon.innerHTML = `<i class="fas ${sportIconClass}"></i>`;
    
    // 设置基本信息
    document.getElementById('teamTitle').textContent = team.title;
    document.getElementById('sportType').textContent = team.sport_type === 'badminton' ? '羽毛球' : 
                                                     team.sport_type === 'tennis' ? '网球' : 
                                                     team.sport_type === 'fitness' ? '有氧健身' : 
                                                     team.sport_type === 'swimming' ? '游泳' : 
                                                     team.sport_type === 'basketball' ? '篮球' :
                                                     team.sport_type === 'football' ? '足球' :
                                                     team.sport_type === 'pingpong' ? '乒乓球' :
                                                     team.sport_type === 'running' ? '跑步' :
                                                     team.sport_type === 'volleyball' ? '排球' : 
                                                     team.sport_type;
    document.getElementById('creatorName').textContent = team.creator.username;
    document.getElementById('teamDateTime').textContent = `${formatDateTime(team.start_time)} - ${formatTime(team.end_time)}`;
    document.getElementById('teamLocation').textContent = team.location;
    
    // 设置人数信息
    document.getElementById('currentCount').textContent = team.current_number;
    document.getElementById('targetCount').textContent = team.target_number;
    
    // 设置活动要求
    document.getElementById('teamRequirements').textContent = team.requirements;
    
    // 设置状态徽章
    const statusBadges = document.getElementById('statusBadges');
    const endTime = new Date(team.end_time);
    const now = new Date();
    const isEnded = endTime < now;
    
    let badges = '';
    if (isEnded) {
        badges += '<div class="badge ended-badge"><i class="fas fa-clock"></i> 已结束</div>';
    }
    if (team.is_full) {
        badges += '<div class="badge full-badge"><i class="fas fa-users"></i> 已满员</div>';
    }
    if (!isEnded && !team.is_full) {
        badges += '<div class="badge open-badge"><i class="fas fa-door-open"></i> 招募中</div>';
    }
    
    statusBadges.innerHTML = badges;
}

// 加载成员列表
async function loadTeamMembers() {
    try {
        const members = await api.getTeamMembers(currentTeamId);
        displayMembers(members);
    } catch (error) {
        console.error('加载成员列表失败:', error);
        document.getElementById('membersList').innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>加载成员失败</h3>
                <p>${error.message}</p>
                <button onclick="loadTeamMembers()" class="btn-primary">重试</button>
            </div>
        `;
    }
}

// 显示成员列表
function displayMembers(members) {
    const membersList = document.getElementById('membersList');
    const memberCountBadge = document.getElementById('memberCountBadge');
    
    memberCountBadge.textContent = `${members.length} 名成员`;
    
    if (members.length === 0) {
        membersList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-friends"></i>
                <h3>暂无成员</h3>
                <p>成为第一个加入的成员吧！</p>
            </div>
        `;
        return;
    }
    
    // 按加入时间排序，创建者排在第一位
    const sortedMembers = members.sort((a, b) => {
        if (a.is_creator && !b.is_creator) return -1;
        if (!a.is_creator && b.is_creator) return 1;
        return new Date(a.joined_at) - new Date(b.joined_at);
    });
    
    membersList.innerHTML = sortedMembers.map(member => createMemberCard(member)).join('');
}

// 创建成员卡片
function createMemberCard(member) {
    const joinedDate = new Date(member.joined_at);
    const isEarlyJoiner = member.join_order <= 3; // 前3名加入的算早期成员
    
    return `
        <div class="member-card" onclick="showMemberDetail(${JSON.stringify(member).replace(/"/g, '&quot;')})">
            <div class="member-header">
                <div class="member-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="member-details">
                    <h4>${member.username}</h4>
                    <div class="member-brief">
                        <span><i class="fas fa-venus-mars"></i> ${getGenderText(member.gender)}</span>
                        <span><i class="fas fa-birthday-cake"></i> ${member.age}岁</span>
                    </div>
                </div>
            </div>
            <div class="member-role">
                ${member.is_creator ? '<div class="badge creator-badge"><i class="fas fa-crown"></i> 创建者</div>' : '<div class="badge member-badge"><i class="fas fa-user"></i> 成员</div>'}
                ${isEarlyJoiner && !member.is_creator ? '<div class="badge early-badge"><i class="fas fa-star"></i> 早期加入</div>' : ''}
            </div>
        </div>
    `;
}

// 获取性别文本
function getGenderText(gender) {
    const genderMap = {
        'male': '男',
        'female': '女',
        'other': '其他'
    };
    return genderMap[gender] || '未提供';
}

// 显示成员详情模态框
function showMemberDetail(member) {
    const modal = document.getElementById('memberModal');
    
    // 填充成员信息
    document.getElementById('modalMemberName').textContent = member.username;
    document.getElementById('modalMemberUsername').textContent = `@${member.username}`;
    document.getElementById('modalMemberGender').textContent = getGenderText(member.gender);
    document.getElementById('modalMemberAge').textContent = `${member.age || '未提供'}岁`;
    document.getElementById('modalMemberWechat').textContent = member.wechat_id || '未提供';
    document.getElementById('modalJoinedTime').textContent = formatDateTime(member.joined_at);
    
    // 显示/隐藏徽章
    const creatorBadge = document.getElementById('modalCreatorBadge');
    const earlyBadge = document.getElementById('modalEarlyBadge');
    
    if (member.is_creator) {
        creatorBadge.style.display = 'flex';
    } else {
        creatorBadge.style.display = 'none';
    }
    
    const isEarlyJoiner = member.join_order <= 3;
    if (isEarlyJoiner && !member.is_creator) {
        earlyBadge.style.display = 'flex';
    } else {
        earlyBadge.style.display = 'none';
    }
    
    // 显示模态框
    modal.classList.add('show');
}

// 关闭成员详情模态框
function closeMemberModal() {
    const modal = document.getElementById('memberModal');
    modal.classList.remove('show');
}

// 返回上一页
function goBack() {
    if (document.referrer && document.referrer.includes(window.location.origin)) {
        window.history.back();
    } else {
        window.location.href = 'my_teams.html';
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

// 点击模态框外部关闭
document.addEventListener('click', (e) => {
    const modal = document.getElementById('memberModal');
    if (e.target === modal) {
        closeMemberModal();
    }
});

// ESC键关闭模态框
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeMemberModal();
    }
}); 