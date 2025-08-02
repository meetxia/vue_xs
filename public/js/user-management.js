class UserManagement {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 20;
        this.searchTerm = '';
        this.users = [];
        this.stats = {};
        this.onlineUsers = [];
        
        // 检查登录状态
        if (!this.checkLoginStatus()) {
            return;
        }
        
        this.init();
    }
    
    // 检查登录状态
    checkLoginStatus() {
        const token = localStorage.getItem('adminToken');
        const loginTime = localStorage.getItem('adminLoginTime');
        
        if (!token || !loginTime) {
            this.redirectToLogin('未登录');
            return false;
        }
        
        const now = Date.now();
        const loginTimestamp = parseInt(loginTime);
        const oneDay = 24 * 60 * 60 * 1000; // 24小时
        
        if (now - loginTimestamp >= oneDay) {
            this.clearLoginData();
            this.redirectToLogin('登录已过期');
            return false;
        }
        
        return true;
    }
    
    // 清除登录数据
    clearLoginData() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminLoginTime');
        localStorage.removeItem('adminUsername');
    }
    
    // 重定向到登录页面
    redirectToLogin(message = '请先登录') {
        alert(message + '，即将跳转到登录页面');
        window.location.href = 'admin-login.html';
    }
    
    // 获取认证头
    getAuthHeaders() {
        const token = localStorage.getItem('adminToken');
        return token ? {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        } : {
            'Content-Type': 'application/json'
        };
    }
    
    // 通用API调用方法，自动处理权限错误
    async apiCall(url, options = {}) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...this.getAuthHeaders(),
                    ...(options.headers || {})
                }
            });
            
            const data = await response.json();
            
            if (response.status === 401 || response.status === 403) {
                // 权限问题，清除登录状态并重定向
                this.clearLoginData();
                this.redirectToLogin(data.message || '权限验证失败');
                return null;
            }
            
            return { response, data };
        } catch (error) {
            console.error('API调用失败:', error);
            throw error;
        }
    }
    
    init() {
        this.bindEvents();
        this.loadUsers();
        this.loadOnlineStats();
        
        // 定期更新在线状态（每30秒）
        setInterval(() => {
            this.loadOnlineStats();
        }, 30000);
        
        // 定期刷新用户列表（每2分钟）
        setInterval(() => {
            this.loadUsers();
        }, 120000);
    }
    
    bindEvents() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.searchTerm = e.target.value.trim();
                this.currentPage = 1;
                this.loadUsers();
            }, 500));
        }
    }
    
    debounce(func, wait) {
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
    
    async loadUsers() {
        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.pageSize,
                search: this.searchTerm
            });
            
            const result = await this.apiCall(`/api/admin/users?${params}`);
            if (!result) return; // 权限错误已被处理
            
            const { data } = result;
            if (data.success) {
                this.users = data.data.users;
                this.stats = data.data.stats;
                this.renderUsers();
                this.renderStats();
                this.renderPagination(data.data.pagination);
            } else {
                this.showError('加载用户数据失败: ' + data.message);
            }
        } catch (error) {
            console.error('加载用户失败:', error);
            this.showError('网络错误，请稍后重试');
        }
    }
    
    async loadOnlineStats() {
        try {
            const result = await this.apiCall('/api/admin/online-stats');
            if (!result) return; // 权限错误已被处理
            
            const { data } = result;
            if (data.success) {
                this.onlineUsers = data.data.onlineUsers;
                this.renderOnlineUsers();
                this.updateOnlineStats(data.data);
            }
        } catch (error) {
            console.error('加载在线统计失败:', error);
        }
    }
    
    renderStats() {
        const elements = {
            totalUsers: document.getElementById('totalUsers'),
            newUsers: document.getElementById('newUsers'),
            onlineUsers: document.getElementById('onlineUsers'),
            activeSessions: document.getElementById('activeSessions')
        };
        
        if (elements.totalUsers) elements.totalUsers.textContent = this.stats.totalUsers || 0;
        if (elements.newUsers) elements.newUsers.textContent = this.stats.newUsersToday || 0;
        if (elements.onlineUsers) elements.onlineUsers.textContent = this.stats.onlineUsers || 0;
    }
    
    updateOnlineStats(data) {
        const elements = {
            onlineUsers: document.getElementById('onlineUsers'),
            activeSessions: document.getElementById('activeSessions'),
            onlineCount: document.getElementById('onlineCount')
        };
        
        if (elements.onlineUsers) elements.onlineUsers.textContent = data.onlineCount || 0;
        if (elements.activeSessions) elements.activeSessions.textContent = data.recentSessions || 0;
        if (elements.onlineCount) elements.onlineCount.textContent = `(${data.onlineCount || 0})`;
    }
    
    renderUsers() {
        const container = document.getElementById('usersContent');
        if (!container) return;
        
        if (this.users.length === 0) {
            container.innerHTML = `
                <div class="empty">
                    <p>没有找到用户数据</p>
                </div>
            `;
            return;
        }
        
        const tableHTML = `
            <table class="users-table">
                <thead>
                    <tr>
                        <th>用户信息</th>
                        <th>会员状态</th>
                        <th>注册时间</th>
                        <th>最后登录</th>
                        <th>最后活动</th>
                        <th>活动统计</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.users.map(user => this.renderUserRow(user)).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = tableHTML;
    }
    
    renderUserRow(user) {
        const avatar = user.avatar && user.avatar !== 'default.png' 
            ? `/assets/uploads/${user.avatar}` 
            : '/assets/default-avatar.svg';
            
        const registerTime = new Date(user.registerTime).toLocaleDateString('zh-CN');
        const lastLogin = user.lastLogin 
            ? new Date(user.lastLogin).toLocaleString('zh-CN') 
            : '从未登录';
        const lastActivity = user.lastActivity 
            ? this.formatTimeAgo(user.lastActivity) 
            : '无活动';
        
        // 用户状态显示
        let statusClass = 'status-offline';
        let statusText = '离线';
        
        if (user.isEnabled === false) {
            statusClass = 'status-badge disabled';
            statusText = '已禁用';
        } else if (user.isOnline) {
            statusClass = 'status-online';
            statusText = '在线';
        }
        
        // 会员状态显示
        const membership = user.membership || { type: 'free', status: 'active' };
        const membershipText = this.getMembershipText(membership.type);
        const membershipClass = `membership-${membership.type}`;
        
        // 活动统计
        const stats = user.stats || {};
        const userStats = `
            <div class="user-stats">
                <div class="stat-item likes">❤️ ${stats.totalLikes || 0}</div>
                <div class="stat-item favorites">⭐ ${stats.totalFavorites || 0}</div>
                <div class="stat-item views">👁️ ${stats.totalViews || 0}</div>
            </div>
        `;
        
        return `
            <tr>
                <td>
                    <div class="user-info">
                        <img src="${avatar}" alt="${user.username}" class="user-avatar" 
                             onerror="this.src='/assets/default-avatar.svg'">
                        <div class="user-details">
                            <div class="user-name">
                                ${this.escapeHtml(user.username)}
                                <span class="user-role ${user.role || 'user'}">${user.role || 'user'}</span>
                            </div>
                            <div class="user-email">${this.escapeHtml(user.email)}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="membership-badge ${membershipClass}">
                        ${membershipText}
                    </span>
                    ${membership.status !== 'active' ? `<br><small style="color: #ef4444;">状态: ${this.getMembershipStatusText(membership.status)}</small>` : ''}
                </td>
                <td>${registerTime}</td>
                <td>${lastLogin}</td>
                <td>
                    <div class="time-ago">${lastActivity}</div>
                </td>
                <td>${userStats}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${statusText}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" onclick="viewUserDetail(${user.id})" title="查看详情">
                            👁️
                        </button>
                        <button class="action-btn edit" onclick="editUser(${user.id})" title="编辑用户">
                            ✏️
                        </button>
                        <button class="membership-btn upgrade" onclick="showMembershipModal(${user.id})" title="管理会员">
                            💎
                        </button>
                        <button class="action-btn toggle ${user.isEnabled === false ? 'enable' : 'disable'}" 
                                onclick="toggleUserStatus(${user.id})" 
                                title="${user.isEnabled === false ? '启用用户' : '禁用用户'}">
                            ${user.isEnabled === false ? '✅' : '❌'}
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
    
    getMembershipText(type) {
        switch(type) {
            case 'vip': return 'VIP会员';
            case 'premium': return '高级会员';
            case 'free': 
            default: return '免费用户';
        }
    }
    
    getMembershipStatusText(status) {
        switch(status) {
            case 'expired': return '已过期';
            case 'suspended': return '已暂停';
            case 'active':
            default: return '有效';
        }
    }
    
    renderOnlineUsers() {
        const section = document.getElementById('onlineUsersSection');
        const list = document.getElementById('onlineUserList');
        
        if (!section || !list) return;
        
        if (this.onlineUsers.length === 0) {
            section.style.display = 'none';
            return;
        }
        
        section.style.display = 'block';
        
        list.innerHTML = this.onlineUsers.map(user => {
            const avatar = user.avatar && user.avatar !== 'default.png' 
                ? `/assets/uploads/${user.avatar}` 
                : '/assets/default-avatar.svg';
                
            return `
                <div class="online-user-item">
                    <img src="${avatar}" alt="${user.username}" 
                         onerror="this.src='/assets/default-avatar.svg'">
                    <span>${this.escapeHtml(user.username)}</span>
                </div>
            `;
        }).join('');
    }
    
    renderPagination(pagination) {
        const paginationContainer = document.getElementById('pagination');
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        const pageInfo = document.getElementById('pageInfo');
        
        if (!paginationContainer) return;
        
        if (pagination.totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }
        
        paginationContainer.style.display = 'flex';
        
        if (prevBtn) {
            prevBtn.disabled = pagination.page <= 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = pagination.page >= pagination.totalPages;
        }
        
        if (pageInfo) {
            pageInfo.textContent = `第 ${pagination.page} 页，共 ${pagination.totalPages} 页`;
        }
    }
    
    changePage(direction) {
        this.currentPage += direction;
        if (this.currentPage < 1) this.currentPage = 1;
        this.loadUsers();
    }
    
    formatTimeAgo(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) {
            return '刚刚';
        } else if (diffInSeconds < 3600) {
            return `${Math.floor(diffInSeconds / 60)}分钟前`;
        } else if (diffInSeconds < 86400) {
            return `${Math.floor(diffInSeconds / 3600)}小时前`;
        } else if (diffInSeconds < 2592000) {
            return `${Math.floor(diffInSeconds / 86400)}天前`;
        } else {
            return date.toLocaleDateString('zh-CN');
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showError(message) {
        const container = document.getElementById('usersContent');
        if (container) {
            container.innerHTML = `
                <div class="error">
                    <p>${message}</p>
                    <button onclick="userManagement.loadUsers()" style="margin-top: 16px; padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        重试
                    </button>
                </div>
            `;
        }
    }
}

// 全局函数，供HTML调用
function loadUsers() {
    if (window.userManagement) {
        window.userManagement.loadUsers();
    }
}

function changePage(direction) {
    if (window.userManagement) {
        window.userManagement.changePage(direction);
    }
}

// 通用权限错误处理函数
function handleApiError(response, data) {
    if (response.status === 401 || response.status === 403) {
        // 权限问题，清除登录状态并重定向
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminLoginTime');
        localStorage.removeItem('adminUsername');
        alert((data.message || '权限验证失败') + '，即将跳转到登录页面');
        window.location.href = 'admin-login.html';
        return true;
    }
    return false;
}

// 查看用户详情
async function viewUserDetail(userId) {
    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            headers: window.userManagement.getAuthHeaders()
        });
        const data = await response.json();
        
        if (handleApiError(response, data)) return;
        
        if (data.success) {
            showUserDetailModal(data.data);
        } else {
            alert('获取用户详情失败: ' + data.message);
        }
    } catch (error) {
        console.error('获取用户详情失败:', error);
        alert('网络错误，请稍后重试');
    }
}

// 显示用户详情模态框
function showUserDetailModal(user) {
    const modal = document.getElementById('userDetailModal');
    const modalBody = document.getElementById('modalBody');
    
    const avatar = user.avatar && user.avatar !== 'default.png' 
        ? `/assets/uploads/${user.avatar}` 
        : '/assets/default-avatar.svg';
    
    const registerTime = new Date(user.registerTime).toLocaleString('zh-CN');
    const lastLogin = user.lastLogin 
        ? new Date(user.lastLogin).toLocaleString('zh-CN') 
        : '从未登录';
    const lastActivity = user.lastActivity 
        ? new Date(user.lastActivity).toLocaleString('zh-CN') 
        : '无活动记录';
    
    const stats = user.stats || {};
    const profile = user.profile || {};
    const membership = user.membership || { type: 'free', status: 'active' };
    
    modalBody.innerHTML = `
        <div class="user-detail-section">
            <h3>基本信息</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">头像</div>
                    <div class="detail-value">
                        <img src="${avatar}" alt="${user.username}" 
                             style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;"
                             onerror="this.src='/assets/default-avatar.svg'">
                    </div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">用户名</div>
                    <div class="detail-value">${user.username}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">邮箱</div>
                    <div class="detail-value">${user.email}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">用户角色</div>
                    <div class="detail-value">
                        <span class="user-role ${user.role || 'user'}">${user.role || 'user'}</span>
                    </div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">账户状态</div>
                    <div class="detail-value">
                        <span class="status-badge ${user.isEnabled === false ? 'disabled' : (user.isOnline ? 'status-online' : 'status-offline')}">
                            ${user.isEnabled === false ? '已禁用' : (user.isOnline ? '在线' : '离线')}
                        </span>
                    </div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">注册时间</div>
                    <div class="detail-value">${registerTime}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">最后登录</div>
                    <div class="detail-value">${lastLogin}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">最后活动</div>
                    <div class="detail-value">${lastActivity}</div>
                </div>
            </div>
        </div>
        
        <div class="user-detail-section">
            <h3>会员信息</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">会员类型</div>
                    <div class="detail-value">
                        <span class="membership-badge membership-${membership.type}">
                            ${window.userManagement.getMembershipText(membership.type)}
                        </span>
                    </div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">会员状态</div>
                    <div class="detail-value">${window.userManagement.getMembershipStatusText(membership.status)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">开始时间</div>
                    <div class="detail-value">${membership.startDate ? new Date(membership.startDate).toLocaleString('zh-CN') : '未设置'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">到期时间</div>
                    <div class="detail-value">${membership.endDate ? new Date(membership.endDate).toLocaleString('zh-CN') : '永久有效'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">自动续费</div>
                    <div class="detail-value">${membership.autoRenew ? '开启' : '关闭'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">支付历史</div>
                    <div class="detail-value">${membership.paymentHistory ? membership.paymentHistory.length : 0} 笔记录</div>
                </div>
            </div>
        </div>
        
        <div class="user-detail-section">
            <h3>个人资料</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">个人简介</div>
                    <div class="detail-value">${profile.bio || '暂无简介'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">所在地区</div>
                    <div class="detail-value">${profile.location || '未填写'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">个人网站</div>
                    <div class="detail-value">${profile.website ? `<a href="${profile.website}" target="_blank">${profile.website}</a>` : '未填写'}</div>
                </div>
            </div>
        </div>
        
        <div class="user-detail-section">
            <h3>活动统计</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">总点赞数</div>
                    <div class="detail-value">❤️ ${stats.totalLikes || 0}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">总收藏数</div>
                    <div class="detail-value">⭐ ${stats.totalFavorites || 0}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">总浏览数</div>
                    <div class="detail-value">👁️ ${stats.totalViews || 0}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">登录次数</div>
                    <div class="detail-value">🔑 ${stats.loginCount || 0}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">阅读时长</div>
                    <div class="detail-value">📖 ${Math.floor((stats.readingTime || 0) / 60)} 分钟</div>
                </div>
            </div>
        </div>
        
        <div class="user-detail-section">
            <h3>最近活动</h3>
            <div class="activity-list" id="activityList">
                <div style="text-align: center; color: #6b7280; padding: 20px;">
                    正在加载活动记录...
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('show');
    loadUserActivity(user.id);
}

// 加载用户活动记录
async function loadUserActivity(userId) {
    try {
        const response = await fetch(`/api/admin/users/${userId}/activity?limit=10`, {
            headers: window.userManagement.getAuthHeaders()
        });
        const data = await response.json();
        
        if (handleApiError(response, data)) return;
        
        const activityList = document.getElementById('activityList');
        
        if (data.success && data.data.activities.length > 0) {
            activityList.innerHTML = data.data.activities.map(activity => `
                <div class="activity-item">
                    <div class="activity-time">${new Date(activity.timestamp).toLocaleString('zh-CN')}</div>
                    <div class="activity-details">${activity.details}</div>
                </div>
            `).join('');
        } else {
            activityList.innerHTML = `
                <div style="text-align: center; color: #6b7280; padding: 20px;">
                    暂无活动记录
                </div>
            `;
        }
    } catch (error) {
        console.error('获取用户活动失败:', error);
        const activityList = document.getElementById('activityList');
        if (activityList) {
            activityList.innerHTML = `
                <div style="text-align: center; color: #ef4444; padding: 20px;">
                    加载活动记录失败
                </div>
            `;
        }
    }
}

// 关闭用户详情模态框
function closeUserDetailModal() {
    const modal = document.getElementById('userDetailModal');
    modal.classList.remove('show');
}

// 切换用户状态（启用/禁用）
async function toggleUserStatus(userId) {
    try {
        const response = await fetch(`/api/admin/users/${userId}/toggle-status`, {
            method: 'PATCH',
            headers: window.userManagement.getAuthHeaders()
        });
        const data = await response.json();
        
        if (handleApiError(response, data)) return;
        
        if (data.success) {
            alert(data.message);
            // 刷新用户列表
            if (window.userManagement) {
                window.userManagement.loadUsers();
            }
        } else {
            alert('操作失败: ' + data.message);
        }
    } catch (error) {
        console.error('切换用户状态失败:', error);
        alert('网络错误，请稍后重试');
    }
}

// 编辑用户
async function editUser(userId) {
    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            headers: window.userManagement.getAuthHeaders()
        });
        const data = await response.json();
        
        if (handleApiError(response, data)) return;
        
        if (data.success) {
            showUserEditModal(data.data);
        } else {
            alert('获取用户信息失败: ' + data.message);
        }
    } catch (error) {
        console.error('获取用户信息失败:', error);
        alert('网络错误，请稍后重试');
    }
}

// 显示用户编辑模态框
function showUserEditModal(user) {
    const modal = document.getElementById('userEditModal');
    const form = document.getElementById('userEditForm');
    
    // 填充表单数据
    document.getElementById('editUsername').value = user.username || '';
    document.getElementById('editEmail').value = user.email || '';
    document.getElementById('editRole').value = user.role || 'user';
    document.getElementById('editStatus').value = user.isEnabled !== false ? 'true' : 'false';
    
    // 填充会员信息
    const membership = user.membership || { type: 'free', status: 'active', autoRenew: false };
    document.getElementById('editMembershipType').value = membership.type || 'free';
    document.getElementById('editMembershipStatus').value = membership.status || 'active';
    document.getElementById('editAutoRenew').value = membership.autoRenew ? 'true' : 'false';
    
    // 处理到期时间
    if (membership.endDate && membership.endDate !== null) {
        const endDate = new Date(membership.endDate);
        const localDateTime = new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        document.getElementById('editMembershipEnd').value = localDateTime;
    } else {
        document.getElementById('editMembershipEnd').value = '';
    }
    
    const profile = user.profile || {};
    document.getElementById('editBio').value = profile.bio || '';
    document.getElementById('editLocation').value = profile.location || '';
    document.getElementById('editWebsite').value = profile.website || '';
    
    // 保存用户ID到表单
    form.dataset.userId = user.id;
    
    modal.classList.add('show');
}

// 关闭用户编辑模态框
function closeUserEditModal() {
    const modal = document.getElementById('userEditModal');
    modal.classList.remove('show');
}

// 处理用户编辑表单提交
document.addEventListener('DOMContentLoaded', () => {
    const userEditForm = document.getElementById('userEditForm');
    if (userEditForm) {
        userEditForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const userId = userEditForm.dataset.userId;
            if (!userId) {
                alert('用户ID丢失，请重新打开编辑窗口');
                return;
            }
            
            const formData = new FormData(userEditForm);
            const updateData = {
                username: formData.get('username'),
                email: formData.get('email'),
                role: formData.get('role'),
                isEnabled: formData.get('isEnabled') === 'true',
                profile: {
                    bio: formData.get('bio'),
                    location: formData.get('location'),
                    website: formData.get('website')
                },
                membership: {
                    type: formData.get('membershipType'),
                    status: formData.get('membershipStatus'),
                    autoRenew: formData.get('autoRenew') === 'true',
                    endDate: formData.get('membershipEndDate') ? new Date(formData.get('membershipEndDate')).toISOString() : null
                }
            };
            
            try {
                const response = await fetch(`/api/admin/users/${userId}`, {
                    method: 'PUT',
                    headers: window.userManagement.getAuthHeaders(),
                    body: JSON.stringify(updateData)
                });
                
                const data = await response.json();
                
                if (handleApiError(response, data)) return;
                
                if (data.success) {
                    alert('用户信息更新成功');
                    closeUserEditModal();
                    // 刷新用户列表
                    if (window.userManagement) {
                        window.userManagement.loadUsers();
                    }
                } else {
                    alert('更新失败: ' + data.message);
                }
            } catch (error) {
                console.error('用户信息更新失败:', error);
                alert('网络错误，请稍后重试');
            }
        });
    }
});

// 点击模态框外部关闭
window.onclick = function(event) {
    const userDetailModal = document.getElementById('userDetailModal');
    const userEditModal = document.getElementById('userEditModal');
    
    if (event.target == userDetailModal) {
        closeUserDetailModal();
    }
    if (event.target == userEditModal) {
        closeUserEditModal();
    }
}

// 显示会员状态管理模态框（快捷设置）
async function showMembershipModal(userId) {
    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            headers: window.userManagement.getAuthHeaders()
        });
        const data = await response.json();
        
        if (handleApiError(response, data)) return;
        
        if (data.success) {
            const user = data.data;
            const membership = user.membership || { type: 'free', status: 'active' };
            
            const result = prompt(`管理用户 "${user.username}" 的会员状态:\n\n当前状态: ${window.userManagement.getMembershipText(membership.type)}\n\n请选择新的会员类型:\n1. 免费用户 (free)\n2. 高级会员 (premium)\n3. VIP会员 (vip)\n\n请输入数字 (1-3):`, '');
            
            if (result === null) return; // 用户取消
            
            let newType;
            switch(result.trim()) {
                case '1': newType = 'free'; break;
                case '2': newType = 'premium'; break;
                case '3': newType = 'vip'; break;
                default:
                    alert('输入无效，请输入 1、2 或 3');
                    return;
            }
            
            // 计算到期时间（VIP和高级会员默认6个月）
            let endDate = null;
            if (newType !== 'free') {
                const sixMonthsLater = new Date();
                sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
                endDate = sixMonthsLater.toISOString();
            }
            
            // 更新会员状态
            const updateData = {
                ...user,
                membership: {
                    ...membership,
                    type: newType,
                    status: 'active',
                    startDate: membership.startDate || new Date().toISOString(),
                    endDate: endDate,
                    autoRenew: membership.autoRenew || false
                }
            };
            
            const updateResponse = await fetch(`/api/admin/users/${userId}`, {
                method: 'PUT',
                headers: window.userManagement.getAuthHeaders(),
                body: JSON.stringify(updateData)
            });
            
            const updateResult = await updateResponse.json();
            
            if (handleApiError(updateResponse, updateResult)) return;
            
            if (updateResult.success) {
                alert(`会员状态已更新为: ${window.userManagement.getMembershipText(newType)}`);
                // 刷新用户列表
                if (window.userManagement) {
                    window.userManagement.loadUsers();
                }
            } else {
                alert('更新失败: ' + updateResult.message);
            }
        } else {
            alert('获取用户信息失败: ' + data.message);
        }
    } catch (error) {
        console.error('会员状态管理失败:', error);
        alert('网络错误，请稍后重试');
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.userManagement = new UserManagement();
});