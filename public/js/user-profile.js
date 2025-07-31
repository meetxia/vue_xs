// 用户个人中心管理类
class UserProfileManager {
    constructor() {
        this.user = null;
        this.token = localStorage.getItem('token');
        this.currentTab = 'profile';
        this.selectedInterests = [];
        this.init();
    }

    async init() {
        // 检查登录状态
        if (!this.token) {
            window.location.href = 'login.html';
            return;
        }

        // 验证token并获取用户信息
        await this.loadUserProfile();
        
        // 初始化UI
        this.initializeUI();
        this.bindEvents();
        
        // 加载各个模块的数据
        await this.loadReadingStats();
        await this.loadUserWorks();
        await this.loadInteractionHistory();
        await this.loadAchievements();
    }

    async loadUserProfile() {
        try {
            const response = await fetch('/api/auth/profile', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.user = result.data;
                this.updateUserInfo();
            } else {
                localStorage.removeItem('token');
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('加载用户信息失败:', error);
            this.showToast('加载用户信息失败', 'error');
        }
    }

    updateUserInfo() {
        if (!this.user) return;

        // 更新用户头像
        const userAvatar = document.getElementById('userAvatar');
        const avatarSrc = this.user.avatar === 'default.png' ? 
            `data:image/svg+xml;base64,${btoa(`<svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="48" cy="48" r="48" fill="#667eea"/><text x="48" y="58" font-family="Arial" font-size="32" fill="white" text-anchor="middle">${this.user.username.charAt(0).toUpperCase()}</text></svg>`)}` :
            `/assets/uploads/${this.user.avatar}`;
        
        userAvatar.innerHTML = `<img src="${avatarSrc}" alt="头像" class="w-full h-full rounded-full object-cover">`;

        // 更新用户名和邮箱
        document.getElementById('userName').textContent = this.user.username;
        document.getElementById('userEmail').textContent = this.user.email;

        // 更新VIP标识（在个人资料页面显示）
        const membershipBadge = document.getElementById('userMembershipBadge');
        if (membershipBadge) {
            membershipBadge.innerHTML = this.getMembershipBadgeForProfile();
        }

        // 更新表单字段
        document.getElementById('profileUsername').value = this.user.username || '';
        document.getElementById('profileEmail').value = this.user.email || '';
        document.getElementById('profileBio').value = this.user.bio || '';

        // 更新统计数据
        document.getElementById('readingTime').textContent = this.user.readingTime || 0;
        document.getElementById('favoriteCount').textContent = this.user.favoriteCount || 0;
        document.getElementById('likeCount').textContent = this.user.likeCount || 0;

        // 加载用户兴趣标签
        this.loadUserInterests();

        // 更新导航栏用户状态
        if (window.userManager) {
            window.userManager.user = this.user;
            window.userManager.updateUI();
        }
    }

    // 获取会员状态
    getMembershipStatus() {
        if (!this.user || !this.user.membership) {
            return { type: 'free', isValid: false };
        }

        const membership = this.user.membership;
        const now = new Date();
        const expireDate = new Date(membership.expireDate);

        return {
            type: membership.type || 'free',
            isValid: expireDate > now,
            expireDate: membership.expireDate
        };
    }

    // 获取个人资料页面的会员标识
    getMembershipBadgeForProfile() {
        const membership = this.getMembershipStatus();
        if (!membership.isValid || membership.type === 'free') return '';

        const badgeClass = membership.type === 'vip' ? 'bg-yellow-500' : 'bg-blue-500';
        const badgeText = membership.type === 'vip' ? 'VIP会员' : '高级会员';

        return `<span class="inline-block px-3 py-1 text-sm ${badgeClass} text-white rounded-full">${badgeText}</span>`;
    }

    loadUserInterests() {
        if (this.user.interests) {
            this.selectedInterests = this.user.interests.split(',').filter(tag => tag.trim());
            this.updateInterestTagsDisplay();
        }
    }

    updateInterestTagsDisplay() {
        const container = document.getElementById('interestTags');
        container.innerHTML = '';
        
        this.selectedInterests.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'px-3 py-1 bg-xhs-red text-white rounded-full text-sm flex items-center';
            span.innerHTML = `
                ${tag}
                <button class="ml-2 text-white opacity-70 hover:opacity-100" onclick="userProfile.removeInterestTag('${tag}')">×</button>
            `;
            container.appendChild(span);
        });
    }

    addInterestTag(tag) {
        if (!this.selectedInterests.includes(tag) && this.selectedInterests.length < 6) {
            this.selectedInterests.push(tag);
            this.updateInterestTagsDisplay();
        }
    }

    removeInterestTag(tag) {
        this.selectedInterests = this.selectedInterests.filter(t => t !== tag);
        this.updateInterestTagsDisplay();
    }

    initializeUI() {
        // 初始化标签页
        this.switchTab('profile');
        
        // 初始化主题
        this.initTheme();
    }

    initTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            document.getElementById('themeToggle').textContent = '☀️';
        }
    }

    bindEvents() {
        // 标签页切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });

        // 头像更换
        document.getElementById('changeAvatarBtn').addEventListener('click', () => {
            document.getElementById('avatarModal').classList.remove('hidden');
        });

        // 头像模态框事件
        document.getElementById('selectImageBtn').addEventListener('click', () => {
            document.getElementById('avatarInput').click();
        });

        document.getElementById('avatarInput').addEventListener('change', this.handleAvatarSelect.bind(this));
        document.getElementById('cancelAvatarBtn').addEventListener('click', this.closeAvatarModal.bind(this));
        document.getElementById('saveAvatarBtn').addEventListener('click', this.saveAvatar.bind(this));

        // 兴趣标签选择
        document.querySelectorAll('.interest-tag').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tag = e.target.dataset.tag;
                this.addInterestTag(tag);
            });
        });

        // 保存资料
        document.getElementById('saveProfileBtn').addEventListener('click', this.saveProfile.bind(this));

        // 主题切换
        document.getElementById('themeToggle').addEventListener('click', this.toggleTheme.bind(this));

        // 个性化设置
        document.querySelectorAll('.theme-color').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changeThemeColor(e.target.dataset.color);
            });
        });

        // 夜间模式切换
        document.getElementById('darkModeToggle').addEventListener('change', this.toggleDarkMode.bind(this));
    }

    switchTab(tabName) {
        // 更新标签按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active', 'border-xhs-red', 'text-xhs-red');
            btn.classList.add('border-transparent', 'text-gray-500');
        });
        
        const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active', 'border-xhs-red', 'text-xhs-red');
            activeBtn.classList.remove('border-transparent', 'text-gray-500');
        }

        // 显示对应内容
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
            content.classList.remove('active');
        });
        
        const activeContent = document.getElementById(tabName);
        if (activeContent) {
            activeContent.classList.remove('hidden');
            activeContent.classList.add('active');
        }

        this.currentTab = tabName;

        // 根据标签页加载对应数据
        switch (tabName) {
            case 'reading-stats':
                this.renderReadingStats();
                break;
            case 'works':
                this.renderUserWorks();
                break;
            case 'interactions':
                this.renderInteractionHistory();
                break;
            case 'achievements':
                this.renderAchievements();
                break;
        }
    }

    handleAvatarSelect(e) {
        const file = e.target.files[0];
        if (file) {
            // 验证文件类型
            if (!file.type.startsWith('image/')) {
                this.showToast('请选择图片文件', 'error');
                return;
            }

            // 验证文件大小（2MB限制）
            if (file.size > 2 * 1024 * 1024) {
                this.showToast('图片大小不能超过2MB', 'error');
                return;
            }

            // 预览图片
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('previewImage').src = e.target.result;
                document.getElementById('avatarPreview').classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    }

    closeAvatarModal() {
        document.getElementById('avatarModal').classList.add('hidden');
        document.getElementById('avatarPreview').classList.add('hidden');
        document.getElementById('avatarInput').value = '';
    }

    async saveAvatar() {
        const fileInput = document.getElementById('avatarInput');
        const file = fileInput.files[0];
        
        if (!file) {
            this.showToast('请选择头像图片', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await fetch('/api/auth/upload-avatar', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.user.avatar = result.data.filename;
                this.updateUserInfo();
                this.closeAvatarModal();
                this.showToast('头像更新成功', 'success');
            } else {
                this.showToast(result.message, 'error');
            }
        } catch (error) {
            console.error('上传头像失败:', error);
            this.showToast('上传头像失败', 'error');
        }
    }

    async saveProfile() {
        const username = document.getElementById('profileUsername').value.trim();
        const email = document.getElementById('profileEmail').value.trim();
        const bio = document.getElementById('profileBio').value.trim();

        // 验证输入
        if (!username) {
            this.showToast('请输入昵称', 'error');
            return;
        }

        if (!email || !this.isValidEmail(email)) {
            this.showToast('请输入有效的邮箱地址', 'error');
            return;
        }

        try {
            const response = await fetch('/api/auth/update-profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    email,
                    bio,
                    interests: this.selectedInterests.join(',')
                })
            });

            const result = await response.json();

            if (result.success) {
                this.user = { ...this.user, username, email, bio };
                this.updateUserInfo();
                this.showToast('个人资料更新成功', 'success');
            } else {
                this.showToast(result.message, 'error');
            }
        } catch (error) {
            console.error('更新个人资料失败:', error);
            this.showToast('更新个人资料失败', 'error');
        }
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    toggleTheme() {
        const body = document.body;
        const themeToggle = document.getElementById('themeToggle');
        
        if (body.classList.contains('dark-theme')) {
            body.classList.remove('dark-theme');
            themeToggle.textContent = '🌙';
            localStorage.setItem('theme', 'light');
        } else {
            body.classList.add('dark-theme');
            themeToggle.textContent = '☀️';
            localStorage.setItem('theme', 'dark');
        }
    }

    changeThemeColor(color) {
        // 更新CSS变量或类名来改变主题色
        document.documentElement.style.setProperty('--theme-color', color);
        localStorage.setItem('themeColor', color);
        this.showToast('主题色已更新', 'success');
    }

    toggleDarkMode(e) {
        this.toggleTheme();
    }

    async loadReadingStats() {
        try {
            const response = await fetch('/api/user/reading-stats', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.readingStats = result.data;
            } else {
                // 使用模拟数据
                this.readingStats = {
                    totalReadingTime: '12.5小时',
                    booksRead: '8本',
                    readingStreak: '5天',
                    preferences: {
                        '言情': 45,
                        '现代': 30,
                        '古代': 15,
                        '玄幻': 10
                    },
                    recentReading: [
                        { title: '霸道总裁的甜心', progress: 78, lastRead: '2024-01-20' },
                        { title: '穿越之锦绣良缘', progress: 45, lastRead: '2024-01-19' },
                        { title: '校园爱恋物语', progress: 92, lastRead: '2024-01-18' }
                    ]
                };
            }
        } catch (error) {
            console.error('加载阅读统计失败:', error);
        }
    }

    renderReadingStats() {
        if (!this.readingStats) return;

        // 更新统计卡片
        document.getElementById('totalReadingTime').textContent = this.readingStats.totalReadingTime;
        document.getElementById('booksRead').textContent = this.readingStats.booksRead;
        document.getElementById('readingStreak').textContent = this.readingStats.readingStreak;

        // 渲染阅读偏好
        this.renderReadingPreferences();

        // 渲染最近阅读
        this.renderRecentReading();
    }

    renderReadingPreferences() {
        const container = document.getElementById('readingPreferences');
        const preferences = this.readingStats.preferences;
        
        let html = '<div class="space-y-3">';
        Object.entries(preferences).forEach(([genre, percentage]) => {
            html += `
                <div class="flex items-center justify-between">
                    <span class="text-sm font-medium">${genre}</span>
                    <div class="flex items-center space-x-2">
                        <div class="w-24 bg-gray-200 rounded-full h-2">
                            <div class="bg-xhs-red h-2 rounded-full" style="width: ${percentage}%"></div>
                        </div>
                        <span class="text-sm text-gray-600">${percentage}%</span>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    }

    renderRecentReading() {
        const container = document.getElementById('recentReading');
        const recentBooks = this.readingStats.recentReading;
        
        let html = '';
        recentBooks.forEach(book => {
            html += `
                <div class="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div class="flex-1">
                        <h5 class="font-medium text-gray-900">${book.title}</h5>
                        <p class="text-sm text-gray-500">上次阅读：${book.lastRead}</p>
                    </div>
                    <div class="text-right">
                        <div class="text-sm font-medium text-xhs-red">${book.progress}%</div>
                        <div class="w-16 bg-gray-200 rounded-full h-1 mt-1">
                            <div class="bg-xhs-red h-1 rounded-full" style="width: ${book.progress}%"></div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    async loadUserWorks() {
        try {
            const response = await fetch('/api/user/works', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.userWorks = result.data;
            } else {
                this.userWorks = []; // 空数组表示没有作品
            }
        } catch (error) {
            console.error('加载用户作品失败:', error);
            this.userWorks = [];
        }
    }

    renderUserWorks() {
        const container = document.getElementById('userWorks');
        
        if (this.userWorks.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 md:col-span-2 lg:col-span-3">
                    <div class="text-4xl mb-4">📝</div>
                    <p class="text-gray-500">还没有发布任何作品</p>
                    <button class="mt-4 px-4 py-2 bg-xhs-red text-white rounded-lg hover:bg-red-600 transition-colors">
                        开始创作
                    </button>
                </div>
            `;
            return;
        }

        let html = '';
        this.userWorks.forEach(work => {
            html += `
                <div class="bg-gray-50 rounded-lg p-4">
                    <h4 class="font-medium text-gray-900 mb-2">${work.title}</h4>
                    <p class="text-sm text-gray-600 mb-3">${work.summary}</p>
                    <div class="flex justify-between items-center text-xs text-gray-500">
                        <span>更新时间：${work.updateTime}</span>
                        <span>${work.views} 阅读</span>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    async loadInteractionHistory() {
        try {
            const response = await fetch('/api/user/interactions', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.interactions = result.data;
            } else {
                // 使用模拟数据
                this.interactions = {
                    likes: [],
                    favorites: [],
                    comments: []
                };
            }
        } catch (error) {
            console.error('加载互动历史失败:', error);
            this.interactions = { likes: [], favorites: [], comments: [] };
        }
    }

    renderInteractionHistory() {
        // 渲染点赞记录
        const likeContainer = document.getElementById('likeHistory');
        if (this.interactions.likes.length === 0) {
            likeContainer.innerHTML = '<p class="text-gray-600">暂无点赞记录</p>';
        } else {
            let html = '';
            this.interactions.likes.forEach(like => {
                html += `
                    <div class="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                        <span class="text-sm">${like.title}</span>
                        <span class="text-xs text-gray-500">${like.date}</span>
                    </div>
                `;
            });
            likeContainer.innerHTML = html;
        }

        // 渲染收藏列表
        const favoriteContainer = document.getElementById('favoriteList');
        if (this.interactions.favorites.length === 0) {
            favoriteContainer.innerHTML = '<p class="text-gray-600">暂无收藏作品</p>';
        } else {
            let html = '';
            this.interactions.favorites.forEach(favorite => {
                html += `
                    <div class="bg-white p-3 rounded border border-gray-200">
                        <h5 class="font-medium text-gray-900">${favorite.title}</h5>
                        <p class="text-sm text-gray-600 mt-1">${favorite.author}</p>
                        <p class="text-xs text-gray-500 mt-2">收藏时间：${favorite.date}</p>
                    </div>
                `;
            });
            favoriteContainer.innerHTML = html;
        }

        // 渲染评论历史
        const commentContainer = document.getElementById('commentHistory');
        if (this.interactions.comments.length === 0) {
            commentContainer.innerHTML = '<p class="text-gray-600">暂无评论记录</p>';
        } else {
            let html = '';
            this.interactions.comments.forEach(comment => {
                html += `
                    <div class="bg-white p-3 rounded border border-gray-200">
                        <div class="flex justify-between items-start mb-2">
                            <h5 class="font-medium text-gray-900">${comment.novelTitle}</h5>
                            <span class="text-xs text-gray-500">${comment.date}</span>
                        </div>
                        <p class="text-sm text-gray-700">${comment.content}</p>
                    </div>
                `;
            });
            commentContainer.innerHTML = html;
        }
    }

    async loadAchievements() {
        try {
            const response = await fetch('/api/user/achievements', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.achievements = result.data;
            } else {
                // 使用模拟数据
                this.achievements = [
                    { 
                        id: 1, 
                        name: '新手上路', 
                        description: '完成第一次登录', 
                        icon: '🎉', 
                        unlocked: true,
                        unlockedAt: '2024-01-15'
                    },
                    { 
                        id: 2, 
                        name: '阅读达人', 
                        description: '累计阅读10小时', 
                        icon: '📚', 
                        unlocked: true,
                        unlockedAt: '2024-01-18'
                    },
                    { 
                        id: 3, 
                        name: '点赞之星', 
                        description: '获得100个点赞', 
                        icon: '⭐', 
                        unlocked: false
                    },
                    { 
                        id: 4, 
                        name: '收藏家', 
                        description: '收藏50部作品', 
                        icon: '💎', 
                        unlocked: false
                    }
                ];
            }
        } catch (error) {
            console.error('加载成就数据失败:', error);
        }
    }

    renderAchievements() {
        const container = document.getElementById('achievementsList');
        
        let html = '';
        this.achievements.forEach(achievement => {
            const isUnlocked = achievement.unlocked;
            html += `
                <div class="achievement-card p-4 rounded-lg border-2 transition-all ${
                    isUnlocked 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-gray-200 bg-gray-50 opacity-60'
                }">
                    <div class="text-center">
                        <div class="text-4xl mb-3">${achievement.icon}</div>
                        <h4 class="font-semibold text-gray-900 mb-2">${achievement.name}</h4>
                        <p class="text-sm text-gray-600 mb-3">${achievement.description}</p>
                        ${isUnlocked 
                            ? `<div class="text-xs text-green-600">已解锁 • ${achievement.unlockedAt}</div>`
                            : `<div class="text-xs text-gray-500">未解锁</div>`
                        }
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    showToast(message, type = 'success') {
        // 创建toast元素
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300 ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        toast.textContent = message;

        document.body.appendChild(toast);

        // 显示toast
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);

        // 自动隐藏
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// 全局变量
let userProfile;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    userProfile = new UserProfileManager();
    
    // 初始化主theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }
    
    // 初始化主用户管理器（用于导航栏）
    if (typeof UserManager !== 'undefined') {
        window.userManager = new UserManager();
    }
});

// 暴露一些函数给HTML使用
window.userProfile = userProfile;