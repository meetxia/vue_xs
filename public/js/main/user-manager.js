/**
 * 用户管理模块
 * 负责用户认证、登录状态管理、会员信息管理等功能
 */
class UserManager {
    constructor() {
        this.user = null;
        this.token = localStorage.getItem('token');
        this.activityTracker = null;
        this.membershipInfo = null;
        this.init();
    }

    async init() {
        if (this.token) {
            await this.validateToken();
            await this.loadMembershipInfo();
        }
        this.updateUI();
        this.initActivityTracking();
    }

    async validateToken() {
        try {
            const response = await fetch('/api/auth/profile', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.user = result.data;
                return true;
            } else {
                localStorage.removeItem('token');
                this.token = null;
                return false;
            }
        } catch (error) {
            console.error('验证Token失败:', error);
            localStorage.removeItem('token');
            this.token = null;
            return false;
        }
    }

    async loadMembershipInfo() {
        if (!this.token) return;
        
        try {
            const response = await fetch('/api/membership/status', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.membershipInfo = result.data;
            }
        } catch (error) {
            console.error('获取会员信息失败:', error);
        }
    }

    getMembershipStatus() {
        if (!this.membershipInfo) {
            // 如果会员信息还没有加载，返回一个保守的状态
            // 如果用户已登录但会员信息未加载，应该等待加载完成
            // 如果用户未登录，则为免费用户
            return {
                type: 'free',
                status: 'active',
                isValid: !this.token // 只有未登录用户才认为是有效的免费用户
            };
        }
        return this.membershipInfo;
    }

    getMembershipDisplayName() {
        const membership = this.getMembershipStatus();
        switch (membership.type) {
            case 'premium': return '高级会员';
            case 'vip': return 'VIP会员';
            default: return '普通用户';
        }
    }

    getMembershipBadge() {
        const membership = this.getMembershipStatus();
        if (!membership.isValid || membership.type === 'free') return '';

        const badgeClass = membership.type === 'vip' ? 'bg-yellow-500' : 'bg-blue-500';
        const badgeText = membership.type === 'vip' ? 'VIP' : '高级';

        return `<span class="ml-2 px-2 py-1 text-xs ${badgeClass} text-white rounded-full">${badgeText}</span>`;
    }

    getMembershipBadgeForMobile() {
        const membership = this.getMembershipStatus();
        if (!membership.isValid || membership.type === 'free') return '';

        const badgeClass = membership.type === 'vip' ? 'bg-yellow-500' : 'bg-blue-500';
        const badgeText = membership.type === 'vip' ? 'VIP会员' : '高级会员';

        return `<span class="inline-block px-3 py-1 text-xs ${badgeClass} text-white rounded-full">${badgeText}</span>`;
    }

    canAccessContent(contentAccessLevel) {
        if (!contentAccessLevel || contentAccessLevel === 'free') return true;
        
        const membership = this.getMembershipStatus();
        if (!membership.isValid) return false;
        
        const membershipHierarchy = { 'free': 0, 'premium': 1, 'vip': 2 };
        const userLevel = membershipHierarchy[membership.type] || 0;
        const requiredLevel = membershipHierarchy[contentAccessLevel] || 0;
        
        return userLevel >= requiredLevel;
    }

    updateUI() {
        // 更新桌面端用户状态区域
        const userStatusArea = document.getElementById('userStatusArea');
        if (userStatusArea) {
            if (this.isLoggedIn()) {
                userStatusArea.innerHTML = this.getLoggedInDesktopHTML();
            } else {
                userStatusArea.innerHTML = this.getGuestDesktopHTML();
            }
        }

        // 更新移动端菜单内容
        const mobileMenuContent = document.getElementById('mobileMenuContent');
        if (mobileMenuContent) {
            if (this.isLoggedIn()) {
                mobileMenuContent.innerHTML = this.getLoggedInMobileHTML();
            } else {
                mobileMenuContent.innerHTML = this.getGuestMobileHTML();
            }
        }

        // 重新绑定搜索事件
        this.rebindSearchEvent();

        // 重新绑定主题切换事件
        this.rebindThemeToggle();
    }

    rebindSearchEvent() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput && window.handleSearch) {
            searchInput.addEventListener('input', window.debounce(window.handleSearch, 300));
        }
    }

    rebindThemeToggle() {
        // 更新主题图标
        if (window.updateThemeToggleIcons) {
            window.updateThemeToggleIcons();
        }
    }

    getLoggedInDesktopHTML() {
        const avatarSrc = this.user.avatar === 'default.png' ? 
            `data:image/svg+xml;base64,${btoa(`<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="16" fill="#667eea"/><text x="16" y="20" font-family="Arial" font-size="12" fill="white" text-anchor="middle">${this.user.username.charAt(0).toUpperCase()}</text></svg>`)}` :
            `/assets/uploads/${this.user.avatar}`;
            
        return `
            <div class="user-menu relative">
                <div class="user-avatar flex items-center space-x-2 cursor-pointer hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors" id="avatarDropdownToggle">
                    <img src="${avatarSrc}" alt="头像" class="w-8 h-8 rounded-full">
                    <div class="flex flex-col">
                        <div class="flex items-center">
                            <span class="username text-sm font-medium text-gray-700">${this.user.username}</span>
                            ${this.getMembershipBadge()}
                        </div>
                        <span class="text-xs text-gray-500">${this.getMembershipDisplayName()}</span>
                    </div>
                    <span class="dropdown-arrow text-gray-400">▼</span>
                </div>
                <div class="user-dropdown absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 hidden z-50" id="userDropdown">
                    <a href="user-profile.html" class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <span class="mr-3">👤</span>
                        个人中心
                    </a>
                    <a href="#" onclick="showMembershipCenter()" class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <span class="mr-3">💎</span>
                        会员中心
                    </a>
                    <a href="#" onclick="showFavorites()" class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <span class="mr-3">❤️</span>
                        我的收藏
                    </a>
                    <a href="#" onclick="showReadHistory()" class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <span class="mr-3">📖</span>
                        阅读历史
                    </a>
                    <div class="border-t border-gray-200 my-2"></div>
                    <a href="#" onclick="logout()" class="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                        <span class="mr-3">🚪</span>
                        退出登录
                    </a>
                </div>
            </div>
        `;
    }

    getGuestDesktopHTML() {
        return `
            <a href="login.html"
               class="hidden lg:flex items-center px-3 py-2 text-sm text-gray-600 hover:text-xhs-red transition-colors">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                登录
            </a>
        `;
    }

    getLoggedInMobileHTML() {
        return `
            <div class="user-info-mobile px-4 py-3 border-b border-gray-100 mb-2">
                <div class="flex items-center justify-between">
                    <div class="font-medium text-gray-900">欢迎，${this.user.username}</div>
                    <a href="user-profile.html" class="text-xs text-xhs-red hover:text-red-600 transition-colors">
                        查看资料 →
                    </a>
                </div>
                <div class="text-sm text-gray-500 mt-1">点击下方菜单进行操作</div>
            </div>
            <a href="user-profile.html"
               class="flex items-center px-4 py-3 text-gray-700 hover:text-xhs-red hover:bg-gray-50 rounded-lg transition-colors">
                <span class="mr-3">👤</span>
                个人中心
            </a>
            <a href="#" onclick="showMembershipCenter()"
               class="flex items-center px-4 py-3 text-gray-700 hover:text-xhs-red hover:bg-gray-50 rounded-lg transition-colors">
                <span class="mr-3">💎</span>
                会员中心
            </a>
            <a href="#" onclick="showFavorites()"
               class="flex items-center px-4 py-3 text-gray-700 hover:text-xhs-red hover:bg-gray-50 rounded-lg transition-colors">
                <span class="mr-3">❤️</span>
                我的收藏
            </a>
            <a href="#" onclick="showReadHistory()"
               class="flex items-center px-4 py-3 text-gray-700 hover:text-xhs-red hover:bg-gray-50 rounded-lg transition-colors">
                <span class="mr-3">📖</span>
                阅读历史
            </a>
            <div class="border-t border-gray-200 my-2"></div>
            <a href="#" onclick="logout()"
               class="flex items-center px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                <span class="mr-3">🚪</span>
                退出登录
            </a>
        `;
    }

    getGuestMobileHTML() {
        return `
            <a href="login.html"
               class="flex items-center px-4 py-3 text-gray-700 hover:text-xhs-red hover:bg-gray-50 rounded-lg transition-colors">
                <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                用户登录
            </a>
            <a href="#"
               class="flex items-center px-4 py-3 text-gray-700 hover:text-xhs-red hover:bg-gray-50 rounded-lg transition-colors">
                <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
                我的收藏
            </a>
            <a href="#"
               class="flex items-center px-4 py-3 text-gray-700 hover:text-xhs-red hover:bg-gray-50 rounded-lg transition-colors">
                <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
                阅读历史
            </a>
        `;
    }

    async logout() {
        try {
            if (this.token) {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });
            }
        } catch (error) {
            console.error('退出登录请求失败:', error);
        } finally {
            // 清理活动追踪
            this.cleanupActivityTracking();
            
            this.user = null;
            this.token = null;
            localStorage.removeItem('token');
            this.updateUI();
            
            if (window.showToast) {
                window.showToast('已退出登录', 'success');
            }
        }
    }

    isLoggedIn() {
        return !!this.token && !!this.user;
    }

    // 初始化活动追踪
    initActivityTracking() {
        if (!this.isLoggedIn()) return;

        // 创建活动追踪器实例（如果存在ActivityTracker类）
        if (window.ActivityTracker) {
            this.activityTracker = new window.ActivityTracker(this.token);
            // 立即标记用户为在线
            this.activityTracker.updateActivity();
        }
    }

    // 清理活动追踪
    cleanupActivityTracking() {
        if (this.activityTracker) {
            this.activityTracker.destroy();
            this.activityTracker = null;
        }
    }
}

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserManager;
} else {
    window.UserManager = UserManager;
}