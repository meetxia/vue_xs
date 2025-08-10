// 用户管理模块
class UserManager {
    constructor() {
        this.users = [];
        this.currentUserPage = 1;
        this.userPageSize = 20;
        this.userSearchTerm = '';
        this.userRefreshInterval = null;
        this.currentMembershipUserId = null;
    }

    // 加载用户统计数据
    async loadUserStats() {
        try {
            const response = await apiClient.get('/api/admin/users');
            if (!response) return;

            const { result } = response;
            if (result.success) {
                const stats = result.data.stats;
                document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
                document.getElementById('onlineUsers').textContent = stats.onlineUsers || 0;
                document.getElementById('newUsers').textContent = stats.newUsersToday || 0;
                document.getElementById('activeSessions').textContent = stats.enabledUsers || 0;
            }
        } catch (error) {
            console.error('加载用户统计数据失败:', error);
            // 设置默认值防止显示错误
            document.getElementById('totalUsers').textContent = '0';
            document.getElementById('onlineUsers').textContent = '0';
            document.getElementById('newUsers').textContent = '0';
            document.getElementById('activeSessions').textContent = '0';
        }
    }

    // 加载用户列表
    async loadUsers() {
        try {
            const searchTerm = document.getElementById('userSearchInput')?.value || '';
            const params = new URLSearchParams({
                page: this.currentUserPage,
                limit: this.userPageSize,
                search: searchTerm
            });

            const response = await apiClient.get(`/api/admin/users?${params}`);
            if (!response) return;

            const { result } = response;
            if (result.success) {
                this.users = result.data.users || [];
                this.renderUsersList();
                this.updateUserPagination(result.data.pagination);
                this.loadOnlineUsers();
            } else {
                this.renderEmptyUsersList();
                utils.showMessage(result.message || '加载用户列表失败', 'error');
            }
        } catch (error) {
            console.error('加载用户列表失败:', error);
            this.renderEmptyUsersList();
            utils.showMessage('加载用户列表失败，请检查网络连接', 'error');
        }
    }

    // 渲染用户列表
    renderUsersList() {
        const usersContent = document.getElementById('usersContent');
        
        if (this.users.length === 0) {
            this.renderEmptyUsersList();
            return;
        }

        const usersHtml = `
            <table class="users-table">
                <thead>
                    <tr>
                        <th>用户信息</th>
                        <th>会员状态</th>
                        <th>账户状态</th>
                        <th>用户统计</th>
                        <th>注册时间</th>
                        <th>最后活动</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.users.map(user => this.renderUserRow(user)).join('')}
                </tbody>
            </table>
        `;

        usersContent.innerHTML = usersHtml;
    }

    // 渲染单个用户行
    renderUserRow(user) {
        const avatar = user.avatar || '/images/default-avatar.png';
        const isOnline = user.lastActivity && (Date.now() - new Date(user.lastActivity).getTime()) < 5 * 60 * 1000;
        const statusClass = user.isEnabled ? (isOnline ? 'status-online' : 'status-offline') : 'status-disabled';
        const statusText = user.isEnabled ? (isOnline ? '在线' : '离线') : '已禁用';

        // 会员状态处理
        const membership = user.membership || { type: 'free', status: 'active' };
        const membershipInfo = utils.getMembershipInfo(membership);

        return `
            <tr>
                <td>
                    <div class="user-info">
                        <img src="${avatar}" alt="${user.username}" class="user-avatar"
                             onerror="this.src='/images/default-avatar.png'">
                        <div class="user-details">
                            <div class="user-name">${user.username}</div>
                            <div class="user-email">${user.email}</div>
                            <span class="user-role ${user.role}">${user.role === 'admin' ? '管理员' : '用户'}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="membership-info">
                        <span class="membership-badge ${membershipInfo.class}">
                            ${membershipInfo.icon} ${membershipInfo.text}
                        </span>
                        ${membershipInfo.expiry ? `<div class="membership-expiry">${membershipInfo.expiry}</div>` : ''}
                        ${membershipInfo.status !== 'active' ? `<div class="membership-status ${membershipInfo.statusClass}">${membershipInfo.statusText}</div>` : ''}
                    </div>
                </td>
                <td>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </td>
                <td>
                    <div class="user-stats">
                        <span class="stat-item likes">❤️ ${user.stats?.totalLikes || 0}</span>
                        <span class="stat-item favorites">⭐ ${user.stats?.totalFavorites || 0}</span>
                        <span class="stat-item views">👁️ ${user.stats?.totalViews || 0}</span>
                    </div>
                </td>
                <td>${utils.formatDate(user.registerTime)}</td>
                <td>${user.lastActivity ? utils.formatDate(user.lastActivity) : '从未'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" onclick="userManager.viewUserDetail(${user.id})" title="查看详情">👁️</button>
                        <button class="action-btn edit" onclick="userManager.editUser(${user.id})" title="编辑用户">✏️</button>
                        <button class="action-btn membership" onclick="userManager.showMembershipModal(${user.id})" title="管理会员">💎</button>
                        <button class="action-btn toggle" onclick="userManager.toggleUserStatus(${user.id}, ${user.isEnabled})"
                                title="${user.isEnabled ? '禁用用户' : '启用用户'}">${user.isEnabled ? '🚫' : '✅'}</button>
                    </div>
                </td>
            </tr>
        `;
    }

    // 渲染空用户列表
    renderEmptyUsersList() {
        const usersContent = document.getElementById('usersContent');
        usersContent.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <div class="text-4xl mb-4">👥</div>
                <p>暂无用户数据</p>
            </div>
        `;
    }

    // 更新用户分页
    updateUserPagination(pagination) {
        const paginationElement = document.getElementById('userPagination');
        const pageInfo = document.getElementById('userPageInfo');
        const prevBtn = document.getElementById('prevUserPage');
        const nextBtn = document.getElementById('nextUserPage');

        if (!pagination) {
            paginationElement.style.display = 'none';
            return;
        }

        paginationElement.style.display = 'flex';
        pageInfo.textContent = `第 ${pagination.page} 页，共 ${pagination.totalPages} 页`;

        prevBtn.disabled = pagination.page <= 1;
        nextBtn.disabled = pagination.page >= pagination.totalPages;

        prevBtn.style.opacity = prevBtn.disabled ? '0.5' : '1';
        nextBtn.style.opacity = nextBtn.disabled ? '0.5' : '1';
    }

    // 加载在线用户
    async loadOnlineUsers() {
        try {
            const response = await apiClient.get('/api/admin/online-stats');
            if (!response) return;

            const { result } = response;
            if (result.success) {
                const onlineUsers = result.data.onlineUsers || [];
                this.renderOnlineUsers(onlineUsers);
            }
        } catch (error) {
            console.error('加载在线用户失败:', error);
        }
    }

    // 渲染在线用户
    renderOnlineUsers(onlineUsers) {
        const onlineSection = document.getElementById('onlineUsersSection');
        const onlineCount = document.getElementById('onlineCount');
        const onlineList = document.getElementById('onlineUserList');

        if (onlineUsers.length === 0) {
            if (onlineSection) onlineSection.style.display = 'none';
            return;
        }

        if (onlineSection) onlineSection.style.display = 'block';
        if (onlineCount) onlineCount.textContent = `(${onlineUsers.length})`;

        if (onlineList) {
            onlineList.innerHTML = onlineUsers.map(user => `
                <div class="online-user-item" onclick="userManager.viewUserDetail(${user.id})">
                    <img src="${user.avatar || '/images/default-avatar.png'}" alt="${user.username}"
                         onerror="this.src='/images/default-avatar.png'">
                    <span>${user.username}</span>
                </div>
            `).join('');
        }
    }

    // 查看用户详情
    async viewUserDetail(userId) {
        try {
            const response = await apiClient.get(`/api/admin/users/${userId}`);
            if (!response) return;

            const { result } = response;
            if (result.success) {
                const user = result.data;
                this.showUserDetailModal(user);
            } else {
                utils.showMessage(result.message || '获取用户详情失败', 'error');
            }
        } catch (error) {
            console.error('获取用户详情失败:', error);
            utils.showMessage('获取用户详情失败，请检查网络连接', 'error');
        }
    }

    // 显示用户详情模态框
    showUserDetailModal(user) {
        const modal = document.getElementById('userDetailModal');
        const modalBody = document.getElementById('userModalBody');

        const avatar = user.avatar || '/images/default-avatar.png';
        const isOnline = user.lastActivity && (Date.now() - new Date(user.lastActivity).getTime()) < 5 * 60 * 1000;
        const statusClass = user.isEnabled ? (isOnline ? 'status-online' : 'status-offline') : 'status-disabled';
        const statusText = user.isEnabled ? (isOnline ? '在线' : '离线') : '已禁用';

        if (modalBody) {
            modalBody.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="md:col-span-1">
                        <div class="text-center">
                            <img src="${avatar}" alt="${user.username}" 
                                 class="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-gray-200"
                                 onerror="this.src='/images/default-avatar.png'">
                            <h3 class="text-xl font-semibold">${user.username}</h3>
                            <p class="text-gray-600">${user.email}</p>
                            <span class="${statusClass === 'status-online' ? 'bg-green-100 text-green-800' : 
                                        statusClass === 'status-offline' ? 'bg-gray-100 text-gray-800' : 
                                        'bg-red-100 text-red-800'} px-2 py-1 rounded-full text-sm mt-2 inline-block">${statusText}</span>
                        </div>
                    </div>
                    
                    <div class="md:col-span-2">
                        <div class="grid grid-cols-2 gap-4 mb-6">
                            <div class="bg-blue-50 p-4 rounded-lg text-center">
                                <div class="text-2xl font-bold text-blue-600">${user.stats?.novelCount || 0}</div>
                                <div class="text-sm text-gray-600">发布作品</div>
                            </div>
                            <div class="bg-green-50 p-4 rounded-lg text-center">
                                <div class="text-2xl font-bold text-green-600">${user.stats?.totalLikes || 0}</div>
                                <div class="text-sm text-gray-600">获得点赞</div>
                            </div>
                            <div class="bg-purple-50 p-4 rounded-lg text-center">
                                <div class="text-2xl font-bold text-purple-600">${user.stats?.totalFavorites || 0}</div>
                                <div class="text-sm text-gray-600">收藏数</div>
                            </div>
                            <div class="bg-orange-50 p-4 rounded-lg text-center">
                                <div class="text-2xl font-bold text-orange-600">${user.stats?.totalViews || 0}</div>
                                <div class="text-sm text-gray-600">阅读量</div>
                            </div>
                        </div>
                        
                        <div class="space-y-4">
                            <div>
                                <label class="text-sm font-medium text-gray-700">用户ID</label>
                                <p class="text-gray-900">${user.id}</p>
                            </div>
                            <div>
                                <label class="text-sm font-medium text-gray-700">用户角色</label>
                                <p class="text-gray-900">${user.role === 'admin' ? '管理员' : '普通用户'}</p>
                            </div>
                            <div>
                                <label class="text-sm font-medium text-gray-700">注册时间</label>
                                <p class="text-gray-900">${utils.formatDate(user.registerTime)}</p>
                            </div>
                            <div>
                                <label class="text-sm font-medium text-gray-700">最后活动时间</label>
                                <p class="text-gray-900">${user.lastActivity ? utils.formatDate(user.lastActivity) : '从未登录'}</p>
                            </div>
                            ${user.profile?.bio ? `
                            <div>
                                <label class="text-sm font-medium text-gray-700">个人简介</label>
                                <p class="text-gray-900">${user.profile.bio}</p>
                            </div>
                            ` : ''}
                            ${user.profile?.location ? `
                            <div>
                                <label class="text-sm font-medium text-gray-700">所在地区</label>
                                <p class="text-gray-900">${user.profile.location}</p>
                            </div>
                            ` : ''}
                            ${user.profile?.website ? `
                            <div>
                                <label class="text-sm font-medium text-gray-700">个人网站</label>
                                <p class="text-gray-900"><a href="${user.profile.website}" target="_blank" class="text-blue-600 hover:underline">${user.profile.website}</a></p>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }

        if (modal) modal.classList.remove('hidden');
    }

    // 编辑用户
    async editUser(userId) {
        try {
            const response = await apiClient.get(`/api/admin/users/${userId}`);
            if (!response) return;

            const { result } = response;
            if (result.success) {
                const user = result.data;
                this.showUserEditModal(user);
            } else {
                utils.showMessage(result.message || '获取用户信息失败', 'error');
            }
        } catch (error) {
            console.error('获取用户信息失败:', error);
            utils.showMessage('获取用户信息失败，请检查网络连接', 'error');
        }
    }

    // 显示用户编辑模态框
    showUserEditModal(user) {
        const modal = document.getElementById('userEditModal');

        // 填充表单数据
        const editUsername = document.getElementById('editUsername');
        const editEmail = document.getElementById('editEmail');
        const editRole = document.getElementById('editRole');
        const editStatus = document.getElementById('editStatus');
        const editBio = document.getElementById('editBio');
        const editLocation = document.getElementById('editLocation');
        const editWebsite = document.getElementById('editWebsite');

        if (editUsername) editUsername.value = user.username || '';
        if (editEmail) editEmail.value = user.email || '';
        if (editRole) editRole.value = user.role || 'user';
        if (editStatus) editStatus.value = user.isEnabled ? 'true' : 'false';
        if (editBio) editBio.value = user.profile?.bio || '';
        if (editLocation) editLocation.value = user.profile?.location || '';
        if (editWebsite) editWebsite.value = user.profile?.website || '';

        // 保存用户ID以便提交时使用
        modal.dataset.userId = user.id;

        if (modal) modal.classList.remove('hidden');
    }

    // 保存用户编辑
    async saveUserEdit(userId, formData) {
        try {
            const response = await apiClient.put(`/api/admin/users/${userId}`, formData);
            if (!response) return;

            const { result } = response;
            if (result.success) {
                utils.showMessage('用户信息更新成功', 'success');
                this.closeUserEditModal();
                this.loadUsers();
            } else {
                utils.showMessage(result.message || '更新用户信息失败', 'error');
            }
        } catch (error) {
            console.error('更新用户信息失败:', error);
            utils.showMessage('更新用户信息失败，请检查网络连接', 'error');
        }
    }

    // 切换用户状态
    async toggleUserStatus(userId, currentStatus) {
        const action = currentStatus ? '禁用' : '启用';

        if (!confirm(`确定要${action}这个用户吗？`)) {
            return;
        }

        try {
            const response = await apiClient.patch(`/api/admin/users/${userId}/toggle-status`);
            if (!response) return;

            const { result } = response;
            if (result.success) {
                utils.showMessage(`用户已${action}`, 'success');
                this.loadUsers();
                this.loadUserStats();
            } else {
                utils.showMessage(result.message || `${action}用户失败`, 'error');
            }
        } catch (error) {
            console.error(`${action}用户失败:`, error);
            utils.showMessage(`${action}用户失败，请检查网络连接`, 'error');
        }
    }

    // 显示会员管理模态框
    async showMembershipModal(userId) {
        try {
            const response = await apiClient.get(`/api/admin/users/${userId}`);
            if (!response) return;

            const { result } = response;
            if (result.success) {
                const user = result.data;
                this.currentMembershipUserId = userId;

                // 显示用户信息
                const userInfo = document.getElementById('membershipUserInfo');
                if (userInfo) {
                    userInfo.innerHTML = `
                        <div class="user-info-card" style="display: flex; align-items: center; gap: 12px; padding: 16px; background: #f9fafb; border-radius: 8px;">
                            <img src="${user.avatar || '/images/default-avatar.png'}" alt="${user.username}"
                                 style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;"
                                 onerror="this.src='/images/default-avatar.png'">
                            <div>
                                <h4 style="margin: 0; font-size: 16px; font-weight: 600;">${user.username}</h4>
                                <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">${user.email}</p>
                            </div>
                        </div>
                    `;
                }

                // 填充当前会员信息
                const membership = user.membership || { type: 'free', status: 'active', autoRenew: false };
                const membershipType = document.getElementById('membershipType');
                const membershipStatus = document.getElementById('membershipStatus');
                const membershipAutoRenew = document.getElementById('membershipAutoRenew');
                const membershipEndDate = document.getElementById('membershipEndDate');

                if (membershipType) membershipType.value = membership.type;
                if (membershipStatus) membershipStatus.value = membership.status;
                if (membershipAutoRenew) membershipAutoRenew.checked = membership.autoRenew || false;

                // 设置到期时间
                if (membershipEndDate && membership.endDate) {
                    const endDate = new Date(membership.endDate);
                    const localDateTime = new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                    membershipEndDate.value = localDateTime;
                } else if (membershipEndDate) {
                    membershipEndDate.value = '';
                }

                // 显示/隐藏有效期设置
                this.toggleMembershipDurationGroup();

                // 显示模态框
                const modal = document.getElementById('membershipModal');
                if (modal) modal.style.display = 'flex';
            } else {
                alert('获取用户信息失败: ' + result.message);
            }
        } catch (error) {
            console.error('获取用户信息失败:', error);
            alert('网络错误，请稍后重试');
        }
    }

    // 切换有效期设置显示
    toggleMembershipDurationGroup() {
        const membershipType = document.getElementById('membershipType');
        const durationGroup = document.getElementById('membershipDurationGroup');

        if (membershipType && durationGroup) {
            if (membershipType.value === 'free') {
                durationGroup.style.display = 'none';
            } else {
                durationGroup.style.display = 'block';
            }
        }
    }

    // 设置会员有效期
    setMembershipDuration(months) {
        const now = new Date();
        const endDate = new Date(now.getTime() + months * 30 * 24 * 60 * 60 * 1000);
        const localDateTime = new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        const membershipEndDate = document.getElementById('membershipEndDate');
        if (membershipEndDate) membershipEndDate.value = localDateTime;
    }

    // 保存会员状态更改
    async saveMembershipChanges() {
        if (!this.currentMembershipUserId) return;

        const membershipType = document.getElementById('membershipType')?.value;
        const membershipStatus = document.getElementById('membershipStatus')?.value;
        const membershipEndDate = document.getElementById('membershipEndDate')?.value;
        const membershipAutoRenew = document.getElementById('membershipAutoRenew')?.checked;
        const note = document.getElementById('membershipNote')?.value.trim();

        // 构建更新数据
        const updateData = {
            membership: {
                type: membershipType,
                status: membershipStatus,
                autoRenew: membershipAutoRenew,
                startDate: new Date().toISOString()
            }
        };

        // 设置到期时间
        if (membershipType !== 'free' && membershipEndDate) {
            updateData.membership.endDate = new Date(membershipEndDate).toISOString();
        } else if (membershipType === 'free') {
            updateData.membership.endDate = null;
        }

        // 添加操作日志
        if (note) {
            updateData.operationNote = note;
        }

        try {
            const response = await apiClient.put(`/api/admin/users/${this.currentMembershipUserId}`, updateData);
            if (!response) return;

            const { result } = response;
            if (result.success) {
                alert('会员状态更新成功');
                this.closeMembershipModal();
                this.loadUsers();
            } else {
                alert('更新失败: ' + result.message);
            }
        } catch (error) {
            console.error('更新会员状态失败:', error);
            alert('网络错误，请稍后重试');
        }
    }

    // 关闭用户详情模态框
    closeUserDetailModal() {
        const modal = document.getElementById('userDetailModal');
        if (modal) modal.classList.add('hidden');
    }

    // 关闭用户编辑模态框
    closeUserEditModal() {
        const modal = document.getElementById('userEditModal');
        if (modal) modal.classList.add('hidden');
    }

    // 关闭会员管理模态框
    closeMembershipModal() {
        const modal = document.getElementById('membershipModal');
        const note = document.getElementById('membershipNote');
        if (modal) modal.style.display = 'none';
        if (note) note.value = '';
        this.currentMembershipUserId = null;
    }

    // 切换用户页面
    changeUserPage(direction) {
        const newPage = this.currentUserPage + direction;
        if (newPage >= 1) {
            this.currentUserPage = newPage;
            this.loadUsers();
        }
    }

    // 刷新用户数据
    refreshUsers() {
        this.currentUserPage = 1;
        this.loadUsers();
        this.loadUserStats();
        utils.showMessage('用户数据已刷新', 'success');
    }

    // 搜索用户
    searchUsers() {
        this.currentUserPage = 1;
        this.loadUsers();
    }
}

// 创建全局用户管理实例
window.userManager = new UserManager();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserManager;
}