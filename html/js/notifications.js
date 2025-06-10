// 消息通知页面JavaScript

let allNotifications = []; // 存储所有通知
let currentFilter = 'all'; // 当前筛选类型

document.addEventListener('DOMContentLoaded', async () => {
    // 加载用户信息
    await loadUserProfile();
    
    // 加载通知列表
    await loadNotifications();
    
    // 定期检查未读消息数量
    setInterval(updateUnreadCount, 30000); // 每30秒检查一次
    
    // 绑定筛选按钮事件
    document.querySelectorAll('.category-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            filterNotifications(type);
            
            // 更新按钮状态
            document.querySelectorAll('.category-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
});

// 加载用户信息
async function loadUserProfile() {
    try {
        const cachedProfile = sessionStorage.getItem('userProfile');
        if (cachedProfile) {
            const userProfile = JSON.parse(cachedProfile);
            document.getElementById('username').textContent = userProfile.username;
            return userProfile;
        }
        
        const response = await fetch(`${BASE_URL}/accounts/profile/`, {
            ...(await getRequestConfig('GET'))
        });
        
        const userProfile = await handleResponse(response);
        document.getElementById('username').textContent = userProfile.username;
        
        // 缓存用户信息
        sessionStorage.setItem('userProfile', JSON.stringify(userProfile));
        return userProfile;
    } catch (error) {
        console.error('加载用户信息失败:', error);
        if (!cachedProfile) {
            alert('获取用户信息失败，请重新登录');
            window.location.href = 'login.html';
        }
    }
}

// 加载通知列表
async function loadNotifications() {
    const notificationsList = document.getElementById('notificationsList');
    
    notificationsList.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner"></i>
            <p>加载中...</p>
        </div>
    `;
    
    try {
        const notifications = await api.getNotifications();
        allNotifications = notifications; // 保存所有通知
        
        if (notifications.length === 0) {
            notificationsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bell-slash"></i>
                    <h3>暂无消息通知</h3>
                    <p>当有新的组队动态时，我们会及时通知您</p>
                </div>
            `;
            return;
        }
        
        // 显示通知
        filterNotifications(currentFilter);
        
    } catch (error) {
        console.error('加载通知列表失败:', error);
        notificationsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>加载失败</h3>
                <p>获取消息通知失败，请稍后重试</p>
            </div>
        `;
    }
}

// 筛选通知
function filterNotifications(type) {
    currentFilter = type;
    const notificationsList = document.getElementById('notificationsList');
    
    let filteredNotifications = allNotifications;
    if (type === 'unread') {
        filteredNotifications = allNotifications.filter(n => !n.is_read);
    } else if (type === 'team') {
        filteredNotifications = allNotifications.filter(n => 
            n.type.startsWith('team_')
        );
    }
    
    if (filteredNotifications.length === 0) {
        notificationsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bell-slash"></i>
                <h3>暂无${type === 'unread' ? '未读' : type === 'team' ? '组队相关' : ''}消息</h3>
                <p>当有新的通知时，我们会及时提醒您</p>
            </div>
        `;
        return;
    }
    
    notificationsList.innerHTML = filteredNotifications.map(notification => `
        <div class="notification-card ${notification.is_read ? '' : 'unread'}" 
             onclick="markAsRead(${notification.id})">
            <div class="notification-icon ${getTypeClass(notification.type)}">
                <i class="${getTypeIcon(notification.type)}"></i>
            </div>
            <div class="notification-content">
                <h3 class="notification-title">${notification.title}</h3>
                <p class="notification-message">${notification.content}</p>
            </div>
            <div class="notification-meta">
                <span class="notification-time">${formatTime(notification.created_at)}</span>
                <span class="notification-type ${getTypeClass(notification.type)}">
                    ${getTypeText(notification.type)}
                </span>
            </div>
            ${notification.is_read ? '' : '<div class="unread-indicator"></div>'}
        </div>
    `).join('');
}

// 更新未读消息数量
async function updateUnreadCount() {
    try {
        const response = await api.getUnreadCount();
        const badge = document.getElementById('notificationCount');
        if (badge) {
            badge.textContent = response.count || '';
            if (response.count > 0) {
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('获取未读消息数量失败:', error);
    }
}

// 标记消息为已读
async function markAsRead(notificationId) {
    try {
        await api.markNotificationRead(notificationId);
        await loadNotifications(); // 重新加载列表
        await updateUnreadCount(); // 更新未读数量
    } catch (error) {
        console.error('标记已读失败:', error);
    }
}

// 标记所有消息为已读
async function markAllAsRead() {
    try {
        const unreadNotifications = allNotifications.filter(n => !n.is_read);
        if (unreadNotifications.length === 0) {
            alert('暂无未读消息');
            return;
        }
        
        if (!confirm(`确定要将所有 ${unreadNotifications.length} 条未读消息标记为已读吗？`)) {
            return;
        }
        
        // 并行标记所有未读消息
        await Promise.all(
            unreadNotifications.map(n => api.markNotificationRead(n.id))
        );
        
        await loadNotifications(); // 重新加载列表
        await updateUnreadCount(); // 更新未读数量
        alert('已成功标记所有消息为已读');
    } catch (error) {
        console.error('标记全部已读失败:', error);
        alert('标记全部已读失败，请稍后重试');
    }
}

// 获取通知类型的样式类
function getTypeClass(type) {
    return type.replace('_', '-');
}

// 获取通知类型的图标
function getTypeIcon(type) {
    const iconMap = {
        'team_created': 'fas fa-plus-circle',
        'team_joined': 'fas fa-sign-in-alt',
        'team_left': 'fas fa-sign-out-alt',
        'team_deleted': 'fas fa-trash-alt',
        'team_disbanded': 'fas fa-users-slash'
    };
    return iconMap[type] || 'fas fa-bell';
}

// 获取通知类型的显示文本
function getTypeText(type) {
    const typeMap = {
        'team_created': '创建组队',
        'team_joined': '加入组队',
        'team_left': '退出组队',
        'team_deleted': '删除组队',
        'team_disbanded': '组队解散'
    };
    return typeMap[type] || type;
}

// 格式化时间
function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // 如果是今天
    if (date.toDateString() === now.toDateString()) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `今天 ${hours}:${minutes}`;
    }
    
    // 如果是昨天
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `昨天 ${hours}:${minutes}`;
    }
    
    // 其他日期
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
} 