// 公共JavaScript代码

// 在页面加载时检查未读消息数量
document.addEventListener('DOMContentLoaded', async () => {
    // 定期检查未读消息数量
    await updateUnreadCount();
    setInterval(updateUnreadCount, 30000); // 每30秒检查一次
});

// 更新未读消息数量
async function updateUnreadCount() {
    try {
        const response = await api.getUnreadCount();
        const badge = document.getElementById('notificationCount');
        if (badge) {
            badge.textContent = response.count || '';
        }
    } catch (error) {
        console.error('获取未读消息数量失败:', error);
    }
} 