// 用户个人中心管理类
class UserProfileManager {
    constructor() {
        this.user = null;
        this.token = localStorage.getItem('token');
        this.currentTab = 'profile';
        this.selectedInterests = [];
        this.personalSettings = this.loadPersonalSettings();
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
        
        // 应用个人设置
        this.applyPersonalSettings();
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
                const color = e.target.dataset.color;
                const theme = e.target.dataset.theme || 'default';
                this.changeThemeColor(color, theme);
            });
        });

        // 字体大小设置（增强版）
        document.querySelectorAll('input[name="fontSize"]').forEach(radio => {
            radio.addEventListener('change', this.changeFontSize.bind(this));
        });
        
        // 字体大小卡片点击
        document.querySelectorAll('.preference-card').forEach(card => {
            card.addEventListener('click', () => {
                const radio = card.querySelector('input[type="radio"]');
                if (radio) {
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change'));
                    
                    // 更新卡片视觉状态
                    document.querySelectorAll('.preference-card').forEach(c => c.classList.remove('active'));
                    card.classList.add('active');
                }
            });
        });

        // 夜间模式切换
        document.getElementById('darkModeToggle').addEventListener('change', this.toggleDarkMode.bind(this));
        
        // 阅读偏好设置
        document.querySelectorAll('.reading-preference').forEach(checkbox => {
            checkbox.addEventListener('change', this.updateReadingPreference.bind(this));
        });
        
        // 设置管理按钮
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', this.savePersonalSettings.bind(this));
        }
        
        const resetSettingsBtn = document.getElementById('resetSettingsBtn');
        if (resetSettingsBtn) {
            resetSettingsBtn.addEventListener('click', this.resetPersonalSettings.bind(this));
        }

        // 导出/导入设置
        const exportSettingsBtn = document.getElementById('exportSettingsBtn');
        if (exportSettingsBtn) {
            exportSettingsBtn.addEventListener('click', this.exportSettings.bind(this));
        }

        const importSettingsBtn = document.getElementById('importSettingsBtn');
        if (importSettingsBtn) {
            importSettingsBtn.addEventListener('click', () => {
                document.getElementById('importFileInput').click();
            });
        }

        const importFileInput = document.getElementById('importFileInput');
        if (importFileInput) {
            importFileInput.addEventListener('change', this.importSettings.bind(this));
        }

        // 数据管理
        const exportDataBtn = document.getElementById('exportDataBtn');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', this.exportUserData.bind(this));
        }

        const clearCacheBtn = document.getElementById('clearCacheBtn');
        if (clearCacheBtn) {
            clearCacheBtn.addEventListener('click', this.clearCache.bind(this));
        }

        // 互动历史过滤器
        const interactionFilter = document.getElementById('interactionFilter');
        if (interactionFilter) {
            interactionFilter.addEventListener('change', this.filterInteractions.bind(this));
        }

        const interactionType = document.getElementById('interactionType');
        if (interactionType) {
            interactionType.addEventListener('change', this.filterInteractions.bind(this));
        }

        const refreshInteractions = document.getElementById('refreshInteractions');
        if (refreshInteractions) {
            refreshInteractions.addEventListener('click', () => {
                this.loadInteractionHistory(true);
            });
        }

        // 时间线视图切换
        const timelineView = document.getElementById('timelineView');
        const gridView = document.getElementById('gridView');
        
        if (timelineView) {
            timelineView.addEventListener('click', () => {
                this.switchInteractionView('timeline');
            });
        }

        if (gridView) {
            gridView.addEventListener('click', () => {
                this.switchInteractionView('grid');
            });
        }
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

    changeThemeColor(color, theme = 'default') {
        // 更新CSS变量
        document.documentElement.style.setProperty('--theme-color', color);
        document.documentElement.style.setProperty('--xhs-red', color);
        
        // 设置主题属性
        document.documentElement.setAttribute('data-theme', theme);
        
        // 更新按钮活跃状态
        document.querySelectorAll('.theme-color').forEach(btn => {
            btn.classList.remove('ring-4', 'ring-opacity-50', 'border-white', 'scale-110');
            if (btn.dataset.color === color) {
                btn.classList.add('border-white', 'scale-110');
                btn.style.boxShadow = `0 0 0 3px ${color}30`;
            }
        });
        
        this.personalSettings.themeColor = color;
        this.personalSettings.currentTheme = theme;
        this.savePersonalSettings();
        this.showToast('主题色已更新', 'success');
    }

    // 导出设置
    exportSettings() {
        const settingsData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            settings: this.personalSettings,
            userPreferences: {
                interests: this.selectedInterests,
                theme: localStorage.getItem('theme'),
                customData: JSON.parse(localStorage.getItem('customUserData') || '{}')
            }
        };

        const dataStr = JSON.stringify(settingsData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `momo-settings-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showToast('设置已导出', 'success');
    }

    // 导入设置
    async importSettings(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (!data.version || !data.settings) {
                throw new Error('无效的设置文件格式');
            }

            // 确认导入
            if (!confirm('导入设置将覆盖当前配置，是否继续？')) {
                return;
            }

            // 导入设置
            this.personalSettings = { ...this.personalSettings, ...data.settings };
            
            // 导入用户偏好
            if (data.userPreferences) {
                if (data.userPreferences.interests) {
                    this.selectedInterests = data.userPreferences.interests;
                    this.updateInterestTagsDisplay();
                }
                
                if (data.userPreferences.theme) {
                    localStorage.setItem('theme', data.userPreferences.theme);
                }
            }

            // 应用设置
            this.applyPersonalSettings();
            await this.savePersonalSettings();
            
            this.showToast('设置导入成功', 'success');
            
            // 重新加载页面以确保所有设置生效
            setTimeout(() => location.reload(), 1000);
            
        } catch (error) {
            console.error('导入设置失败:', error);
            this.showToast('导入设置失败：' + error.message, 'error');
        }
        
        // 清空文件输入
        event.target.value = '';
    }

    // 导出用户数据
    async exportUserData() {
        const exportBtn = document.getElementById('exportDataBtn');
        const statusDiv = document.getElementById('exportStatus');
        
        exportBtn.disabled = true;
        exportBtn.textContent = '导出中...';
        statusDiv.className = 'export-status preparing';
        statusDiv.innerHTML = '⏳ 正在准备数据...';
        statusDiv.classList.remove('hidden');

        try {
            // 收集所有用户数据
            const userData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                profile: this.user,
                settings: this.personalSettings,
                readingStats: this.readingStats,
                interactions: this.interactions,
                achievements: this.achievements,
                userWorks: this.userWorks,
                localData: {
                    readingProgress: JSON.parse(localStorage.getItem('readingProgress') || '[]'),
                    searchHistory: JSON.parse(localStorage.getItem('searchHistory') || '[]'),
                    preferences: JSON.parse(localStorage.getItem('userSettings') || '{}')
                }
            };

            // 模拟数据处理时间
            await new Promise(resolve => setTimeout(resolve, 1000));

            const dataStr = JSON.stringify(userData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `momo-userdata-${this.user.username}-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            statusDiv.className = 'export-status ready';
            statusDiv.innerHTML = '✅ 数据导出成功';
            
            this.showToast('用户数据已导出', 'success');
            
        } catch (error) {
            console.error('导出数据失败:', error);
            statusDiv.className = 'export-status error';
            statusDiv.innerHTML = '❌ 导出失败';
            this.showToast('导出数据失败', 'error');
        } finally {
            exportBtn.disabled = false;
            exportBtn.textContent = '导出数据';
            
            // 3秒后隐藏状态
            setTimeout(() => {
                statusDiv.classList.add('hidden');
            }, 3000);
        }
    }

    // 清除缓存
    clearCache() {
        if (!confirm('确定要清除所有缓存数据吗？这将移除本地存储的阅读进度和临时数据。')) {
            return;
        }

        try {
            // 清除特定的缓存项
            const keysToRemove = [
                'readingProgress',
                'searchHistory',
                'tempData',
                'cachedNovels',
                'recentSearches'
            ];

            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });

            // 清除会话存储
            sessionStorage.clear();

            this.showToast('缓存已清除', 'success');
        } catch (error) {
            console.error('清除缓存失败:', error);
            this.showToast('清除缓存失败', 'error');
        }
    }

    // 过滤互动历史
    filterInteractions() {
        const timeFilter = document.getElementById('interactionFilter').value;
        const typeFilter = document.getElementById('interactionType').value;
        
        // 重新渲染互动历史
        this.renderInteractionHistory(timeFilter, typeFilter);
        this.showToast('已应用筛选条件', 'info');
    }

    // 切换互动视图
    switchInteractionView(view) {
        const timelineBtn = document.getElementById('timelineView');
        const gridBtn = document.getElementById('gridView');
        
        // 更新按钮状态
        if (view === 'timeline') {
            timelineBtn.className = 'px-3 py-1 bg-xhs-red text-white rounded text-sm';
            gridBtn.className = 'px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm';
        } else {
            timelineBtn.className = 'px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm';
            gridBtn.className = 'px-3 py-1 bg-xhs-red text-white rounded text-sm';
        }
        
        // 切换视图
        this.currentInteractionView = view;
        this.renderInteractionTimeline();
    }

    toggleDarkMode(e) {
        this.toggleTheme();
        this.personalSettings.darkMode = e.target.checked;
        this.savePersonalSettings();
    }
    
    changeFontSize(e) {
        const fontSize = e.target.value;
        const body = document.body;
        
        // 移除所有字体大小类
        body.classList.remove('text-sm-mode', 'text-lg-mode', 'text-xl-mode');
        
        // 添加对应的字体大小类
        switch (fontSize) {
            case 'small':
                body.classList.add('text-sm-mode');
                break;
            case 'large':
                body.classList.add('text-lg-mode');
                break;
            case 'extra-large':
                body.classList.add('text-xl-mode');
                break;
            default: // medium
                break;
        }
        
        this.personalSettings.fontSize = fontSize;
        this.savePersonalSettings();
        this.showToast('字体大小已更新', 'success');
    }
    
    updateReadingPreference(e) {
        const preference = e.target.name;
        const value = e.target.checked;
        
        if (!this.personalSettings.readingPreferences) {
            this.personalSettings.readingPreferences = {};
        }
        
        this.personalSettings.readingPreferences[preference] = value;
        this.savePersonalSettings();
        this.showToast('阅读偏好已更新', 'success');
    }

    async loadReadingStats() {
        try {
            const response = await fetch('/api/user/reading-stats', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.readingStats = result.data;
                } else {
                    console.warn('获取阅读统计失败:', result.message);
                    this.readingStats = this.getDefaultReadingStats();
                }
            } else {
                console.warn('阅读统计API响应错误:', response.status);
                this.readingStats = this.getDefaultReadingStats();
            }
        } catch (error) {
            console.error('加载阅读统计失败:', error);
            this.readingStats = this.getDefaultReadingStats();
        }
    }

    getDefaultReadingStats() {
        return {
            totalReadingTime: '0小时',
            booksRead: '0本',
            readingStreak: '0天',
            preferences: {
                '言情': 0,
                '现代': 0,
                '古代': 0,
                '玄幻': 0
            },
            recentReading: []
        };
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
        
        // 增强的阅读偏好分析界面
        let html = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- 偏好分布图 -->
                <div class="bg-white p-4 rounded-lg border">
                    <h5 class="font-medium mb-3 flex items-center">
                        <span class="mr-2">📊</span>类型偏好分布
                    </h5>
                    <div class="space-y-3">
        `;
        
        // 按百分比排序
        const sortedPreferences = Object.entries(preferences).sort((a, b) => b[1] - a[1]);
        
        sortedPreferences.forEach(([genre, percentage]) => {
            const colors = {
                '言情': 'bg-pink-500',
                '现代': 'bg-blue-500',
                '古代': 'bg-amber-500',
                '玄幻': 'bg-purple-500',
                '校园': 'bg-green-500',
                '悬疑': 'bg-gray-700'
            };
            const color = colors[genre] || 'bg-gray-400';
            
            html += `
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <div class="w-3 h-3 ${color} rounded-full"></div>
                        <span class="text-sm font-medium">${genre}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <div class="w-20 bg-gray-200 rounded-full h-2 relative overflow-hidden">
                            <div class="${color} h-2 rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
                            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 shimmer"></div>
                        </div>
                        <span class="text-sm text-gray-600 w-8">${percentage}%</span>
                    </div>
                </div>
            `;
        });
        
        html += `
                    </div>
                </div>
                
                <!-- 阅读习惯分析 -->
                <div class="bg-white p-4 rounded-lg border">
                    <h5 class="font-medium mb-3 flex items-center">
                        <span class="mr-2">🔍</span>阅读习惯分析
                    </h5>
                    <div class="space-y-3 text-sm">
                        ${this.generateReadingInsights(preferences)}
                    </div>
                </div>
            </div>
            
            <!-- 推荐系统 -->
            <div class="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <h5 class="font-medium mb-2 text-blue-900 flex items-center">
                    <span class="mr-2">✨</span>为你推荐
                </h5>
                <p class="text-sm text-blue-700 mb-3">基于你的阅读偏好，我们为你推荐以下类型：</p>
                <div class="flex flex-wrap gap-2">
                    ${this.generateRecommendations(preferences)}
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        
        // 添加动画效果
        this.animateProgressBars();
    }

    generateReadingInsights(preferences) {
        const sortedPrefs = Object.entries(preferences).sort((a, b) => b[1] - a[1]);
        const topGenre = sortedPrefs[0];
        const secondGenre = sortedPrefs[1];
        
        let insights = [];
        
        if (topGenre && topGenre[1] > 40) {
            insights.push(`
                <div class="flex items-start space-x-2">
                    <span class="text-green-500">•</span>
                    <span>你是<strong>${topGenre[0]}</strong>的忠实读者，占阅读时间的${topGenre[1]}%</span>
                </div>
            `);
        }
        
        if (secondGenre && secondGenre[1] > 20) {
            insights.push(`
                <div class="flex items-start space-x-2">
                    <span class="text-blue-500">•</span>
                    <span>你也经常阅读<strong>${secondGenre[0]}</strong>类作品</span>
                </div>
            `);
        }
        
        const diversity = Object.values(preferences).filter(p => p > 10).length;
        if (diversity >= 3) {
            insights.push(`
                <div class="flex items-start space-x-2">
                    <span class="text-purple-500">•</span>
                    <span>阅读兴趣广泛，涉猎${diversity}个不同类型</span>
                </div>
            `);
        }
        
        return insights.join('');
    }

    generateRecommendations(preferences) {
        const recommendations = [];
        const sortedPrefs = Object.entries(preferences).sort((a, b) => b[1] - a[1]);
        
        // 基于偏好的推荐逻辑
        if (preferences['言情'] > 30) {
            recommendations.push('现代言情', '古代言情');
        }
        if (preferences['玄幻'] > 20) {
            recommendations.push('仙侠修真', '穿越重生');
        }
        if (preferences['现代'] > 25) {
            recommendations.push('都市情缘', '职场小说');
        }
        
        // 如果没有明显偏好，推荐热门类型
        if (recommendations.length === 0) {
            recommendations.push('热门言情', '精品现代', '经典古代');
        }
        
        return recommendations.slice(0, 4).map(rec => 
            `<span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs hover:bg-blue-200 transition-colors cursor-pointer">${rec}</span>`
        ).join('');
    }

    animateProgressBars() {
        // 添加进度条动画
        const progressBars = document.querySelectorAll('.bg-pink-500, .bg-blue-500, .bg-amber-500, .bg-purple-500, .bg-green-500, .bg-gray-700');
        progressBars.forEach((bar, index) => {
            setTimeout(() => {
                bar.style.width = bar.style.width;
            }, index * 200);
        });
    }

    renderRecentReading() {
        const container = document.getElementById('recentReading');
        const recentBooks = this.readingStats.recentReading;
        
        if (!recentBooks || recentBooks.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 bg-white rounded-lg border border-gray-200">
                    <div class="text-4xl mb-3">📚</div>
                    <p class="text-gray-500 mb-2">还没有阅读记录</p>
                    <p class="text-sm text-gray-400">开始阅读你的第一本小说吧！</p>
                    <button onclick="window.location.href='index.html'" class="mt-3 px-4 py-2 bg-xhs-red text-white rounded-lg hover:bg-red-600 transition-colors">
                        去探索
                    </button>
                </div>
            `;
            return;
        }
        
        let html = '<div class="space-y-4">';
        
        recentBooks.forEach((book, index) => {
            const progressColor = book.progress >= 100 ? 'bg-green-500' : 
                                book.progress >= 80 ? 'bg-blue-500' :
                                book.progress >= 50 ? 'bg-yellow-500' : 'bg-gray-400';
            
            const statusText = book.progress >= 100 ? '已完成' : 
                              book.progress >= 80 ? '即将完成' :
                              book.progress >= 50 ? '阅读中' : '刚开始';
            
            html += `
                <div class="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer" 
                     onclick="this.openNovel('${book.novelId || '#'}')">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex-1">
                            <h5 class="font-medium text-gray-900 mb-1 line-clamp-1">${book.title}</h5>
                            <div class="flex items-center space-x-4 text-sm text-gray-500">
                                <span>📅 ${book.lastRead}</span>
                                <span class="px-2 py-1 rounded-full text-xs ${this.getStatusColor(book.progress)} text-white">
                                    ${statusText}
                                </span>
                            </div>
                        </div>
                        <div class="text-right min-w-0">
                            <div class="text-lg font-bold ${this.getProgressColor(book.progress)} mb-1">
                                ${book.progress}%
                            </div>
                        </div>
                    </div>
                    
                    <!-- 进度条 -->
                    <div class="mb-3">
                        <div class="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
                            <div class="${progressColor} h-2 rounded-full transition-all duration-500 progress-bar" 
                                 style="width: ${book.progress}%"></div>
                            ${book.progress < 100 ? '<div class="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 shimmer"></div>' : ''}
                        </div>
                    </div>
                    
                    <!-- 阅读统计 -->
                    <div class="flex justify-between items-center text-xs text-gray-400">
                        <span>阅读进度 ${book.progress}/100</span>
                        <div class="flex items-center space-x-2">
                            ${book.readingTime ? `<span>⏱️ ${book.readingTime}分钟</span>` : ''}
                            <span class="cursor-pointer hover:text-xhs-red" title="继续阅读">
                                📖 阅读
                            </span>
                        </div>
                    </div>
                    
                    ${book.progress >= 100 ? `
                        <div class="mt-2 pt-2 border-t border-gray-100">
                            <div class="flex items-center justify-between text-xs">
                                <span class="text-green-600 flex items-center">
                                    <span class="mr-1">🎉</span>阅读完成
                                </span>
                                <div class="flex space-x-2">
                                    <button class="text-blue-500 hover:underline" onclick="this.rateBook('${book.novelId}')">评分</button>
                                    <button class="text-gray-500 hover:underline" onclick="this.shareReading('${book.novelId}')">分享</button>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        html += '</div>';
        
        // 添加查看更多按钮
        if (recentBooks.length >= 5) {
            html += `
                <div class="text-center mt-4">
                    <button onclick="this.showAllReadingHistory()" 
                            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                        查看全部阅读记录
                    </button>
                </div>
            `;
        }
        
        container.innerHTML = html;
        
        // 延迟执行动画
        setTimeout(() => {
            this.animateProgressBars();
        }, 100);
    }

    // 辅助方法
    getStatusColor(progress) {
        if (progress >= 100) return 'bg-green-500';
        if (progress >= 80) return 'bg-blue-500';
        if (progress >= 50) return 'bg-yellow-500';
        return 'bg-gray-400';
    }

    getProgressColor(progress) {
        if (progress >= 100) return 'text-green-600';
        if (progress >= 80) return 'text-blue-600';
        if (progress >= 50) return 'text-yellow-600';
        return 'text-gray-600';
    }

    // 打开小说阅读页面
    openNovel(novelId) {
        if (novelId && novelId !== '#') {
            window.open(`read.html?id=${novelId}`, '_blank');
        }
    }

    // 显示所有阅读历史
    showAllReadingHistory() {
        this.switchTab('interactions');
        // 滚动到阅读历史部分
        setTimeout(() => {
            const historySection = document.getElementById('interactionTimeline');
            if (historySection) {
                historySection.scrollIntoView({ behavior: 'smooth' });
            }
        }, 300);
    }

    // 评分功能
    rateBook(novelId) {
        // TODO: 实现评分功能
        this.showToast('评分功能开发中', 'info');
    }

    // 分享阅读
    shareReading(novelId) {
        // TODO: 实现分享功能
        this.showToast('分享功能开发中', 'info');
    }

    async loadUserWorks() {
        try {
            const response = await fetch('/api/user/works', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.userWorks = result.data;
                } else {
                    console.warn('获取用户作品失败:', result.message);
                    this.userWorks = [];
                }
            } else {
                this.userWorks = [];
            }
        } catch (error) {
            console.error('加载用户作品失败:', error);
            this.userWorks = [];
        }
    }

    renderUserWorks() {
        const container = document.getElementById('userWorks');
        
        if (!this.userWorks || this.userWorks.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 md:col-span-2 lg:col-span-3">
                    <div class="text-4xl mb-4">📝</div>
                    <p class="text-gray-500 mb-4">还没有发布任何作品</p>
                    <p class="text-sm text-gray-400 mb-6">开始创作您的第一部作品，与读者分享您的故事</p>
                    <button onclick="this.showCreateWorkModal()" class="px-6 py-3 bg-xhs-red text-white rounded-lg hover:bg-red-600 transition-colors inline-flex items-center space-x-2">
                        <span>✨</span>
                        <span>开始创作</span>
                    </button>
                </div>
            `;
            return;
        }

        let html = '';
        this.userWorks.forEach(work => {
            const updateDate = new Date(work.updateTime).toLocaleDateString();
            const statusText = work.status === 'published' ? '已发布' : work.status === 'draft' ? '草稿' : '待审核';
            const statusColor = work.status === 'published' ? 'text-green-600' : 
                               work.status === 'draft' ? 'text-orange-600' : 'text-blue-600';
            
            html += `
                <div class="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <div class="flex justify-between items-start mb-3">
                        <h4 class="font-medium text-gray-900 text-lg leading-tight">${work.title}</h4>
                        <span class="text-xs px-2 py-1 rounded-full bg-gray-100 ${statusColor}">${statusText}</span>
                    </div>
                    <p class="text-sm text-gray-600 mb-3 line-clamp-2">${work.summary}</p>
                    
                    <div class="flex flex-wrap gap-1 mb-3">
                        ${work.tags ? work.tags.slice(0, 3).map(tag => 
                            `<span class="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded">${tag}</span>`
                        ).join('') : ''}
                    </div>
                    
                    <div class="flex justify-between items-center text-xs text-gray-500 mb-3">
                        <span>更新：${updateDate}</span>
                        <div class="flex space-x-3">
                            <span>👁 ${work.views}</span>
                            <span>❤️ ${work.likes}</span>
                            <span>⭐ ${work.favorites}</span>
                        </div>
                    </div>
                    
                    <div class="flex space-x-2">
                        <button onclick="this.editWork(${work.id})" class="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors">
                            编辑
                        </button>
                        <button onclick="this.viewWork(${work.id})" class="flex-1 px-3 py-2 text-sm bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors">
                            查看
                        </button>
                        <button onclick="this.deleteWork(${work.id})" class="px-3 py-2 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors">
                            删除
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    async loadInteractionHistory() {
        try {
            const response = await fetch('/api/user/interactions', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.interactions = result.data;
                } else {
                    console.warn('获取互动历史失败:', result.message);
                    this.interactions = { likes: [], favorites: [], comments: [] };
                }
            } else {
                this.interactions = { likes: [], favorites: [], comments: [] };
            }
        } catch (error) {
            console.error('加载互动历史失败:', error);
            this.interactions = { likes: [], favorites: [], comments: [] };
        }
    }

    renderInteractionHistory(timeFilter = 'all', typeFilter = 'all') {
        if (!this.interactions) return;

        // 更新统计数据
        this.updateInteractionStats();
        
        // 渲染时间线
        this.renderInteractionTimeline(timeFilter, typeFilter);

        // 渲染各个类型的详细记录
        this.renderLikeHistory(timeFilter);
        this.renderFavoriteHistory(timeFilter);
        this.renderCommentHistory(timeFilter);
    }

    updateInteractionStats() {
        // 更新总数统计
        const totalLikes = this.interactions.likes?.length || 0;
        const totalFavorites = this.interactions.favorites?.length || 0;
        const totalComments = this.interactions.comments?.length || 0;
        
        document.getElementById('totalLikes').textContent = totalLikes;
        document.getElementById('totalFavorites').textContent = totalFavorites;
        document.getElementById('totalComments').textContent = totalComments;
        
        // 计算活跃度分数
        const activityScore = Math.min(999, totalLikes + totalFavorites * 2 + totalComments * 3);
        document.getElementById('interactionScore').textContent = activityScore;

        // 更新各卡片的计数
        document.getElementById('likeCount').textContent = `(${totalLikes})`;
        document.getElementById('favoriteCount').textContent = `(${totalFavorites})`;
        document.getElementById('commentCount').textContent = `(${totalComments})`;

        // 计算今日和本周统计
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        const todayLikes = this.interactions.likes?.filter(like => 
            new Date(like.date) >= today).length || 0;
        const weekLikes = this.interactions.likes?.filter(like => 
            new Date(like.date) >= weekStart).length || 0;
        
        const todayFavorites = this.interactions.favorites?.filter(fav => 
            new Date(fav.date) >= today).length || 0;
        const weekFavorites = this.interactions.favorites?.filter(fav => 
            new Date(fav.date) >= weekStart).length || 0;
        
        const todayComments = this.interactions.comments?.filter(comment => 
            new Date(comment.date) >= today).length || 0;
        const weekComments = this.interactions.comments?.filter(comment => 
            new Date(comment.date) >= weekStart).length || 0;

        // 更新界面
        document.getElementById('todayLikes').textContent = todayLikes;
        document.getElementById('weekLikes').textContent = weekLikes;
        document.getElementById('todayFavorites').textContent = todayFavorites;
        document.getElementById('weekFavorites').textContent = weekFavorites;
        document.getElementById('todayComments').textContent = todayComments;
        document.getElementById('weekComments').textContent = weekComments;
    }

    renderInteractionTimeline(timeFilter = 'all', typeFilter = 'all') {
        const container = document.getElementById('interactionTimeline');
        
        // 合并所有互动数据
        const allInteractions = [];
        
        if (this.interactions.likes && (typeFilter === 'all' || typeFilter === 'likes')) {
            this.interactions.likes.forEach(like => {
                allInteractions.push({
                    ...like,
                    type: 'like',
                    icon: '❤️',
                    color: 'text-red-500',
                    bgColor: 'bg-red-50'
                });
            });
        }
        
        if (this.interactions.favorites && (typeFilter === 'all' || typeFilter === 'favorites')) {
            this.interactions.favorites.forEach(favorite => {
                allInteractions.push({
                    ...favorite,
                    type: 'favorite',
                    icon: '⭐',
                    color: 'text-yellow-500',
                    bgColor: 'bg-yellow-50'
                });
            });
        }
        
        if (this.interactions.comments && (typeFilter === 'all' || typeFilter === 'comments')) {
            this.interactions.comments.forEach(comment => {
                allInteractions.push({
                    ...comment,
                    type: 'comment',
                    icon: '💬',
                    color: 'text-blue-500',
                    bgColor: 'bg-blue-50'
                });
            });
        }

        // 应用时间过滤
        const filteredInteractions = this.filterByTime(allInteractions, timeFilter);
        
        // 按时间排序
        filteredInteractions.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (filteredInteractions.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-4xl mb-4">📭</div>
                    <p class="text-gray-500">没有找到匹配的互动记录</p>
                </div>
            `;
            return;
        }

        // 生成时间线HTML
        let html = '<div class="space-y-4">';
        
        filteredInteractions.slice(0, 20).forEach((item, index) => {
            const timeAgo = this.getTimeAgo(item.date);
            const actionText = this.getActionText(item.type);
            
            html += `
                <div class="flex items-start space-x-3 p-3 rounded-lg ${item.bgColor} hover:shadow-md transition-all">
                    <div class="flex-shrink-0">
                        <div class="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                            <span class="text-lg">${item.icon}</span>
                        </div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between">
                            <p class="text-sm font-medium text-gray-900">
                                ${actionText}《${item.title || item.novelTitle || '未知作品'}》
                            </p>
                            <span class="text-xs text-gray-500">${timeAgo}</span>
                        </div>
                        ${item.content ? `<p class="text-sm text-gray-600 mt-1 truncate">${item.content}</p>` : ''}
                        ${item.author ? `<p class="text-xs text-gray-500 mt-1">作者：${item.author}</p>` : ''}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        if (filteredInteractions.length > 20) {
            html += `
                <div class="text-center mt-4">
                    <button class="text-sm text-xhs-red hover:underline">
                        显示更多 (还有${filteredInteractions.length - 20}条记录)
                    </button>
                </div>
            `;
        }
        
        container.innerHTML = html;
    }

    renderLikeHistory(timeFilter = 'all') {
        const container = document.getElementById('likeHistory');
        const likes = this.filterByTime(this.interactions.likes || [], timeFilter);

        if (likes.length === 0) {
            container.innerHTML = `
                <div class="flex items-center justify-center py-12">
                    <div class="text-gray-400 text-center">
                        <div class="text-4xl mb-2">❤️</div>
                        <p class="text-sm">暂无点赞记录</p>
                    </div>
                </div>
            `;
            return;
        }

        let html = '<div class="divide-y divide-gray-200">';
        likes.forEach(like => {
            html += `
                <div class="interaction-item p-3 hover:bg-gray-50 transition-colors">
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <h5 class="text-sm font-medium text-gray-900 truncate">${like.title}</h5>
                            <p class="text-xs text-gray-500 mt-1">${this.getTimeAgo(like.date)}</p>
                        </div>
                        <div class="flex-shrink-0 ml-2">
                            <span class="text-red-500">❤️</span>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    }

    renderFavoriteHistory(timeFilter = 'all') {
        const container = document.getElementById('favoriteList');
        const favorites = this.filterByTime(this.interactions.favorites || [], timeFilter);

        if (favorites.length === 0) {
            container.innerHTML = `
                <div class="flex items-center justify-center py-12">
                    <div class="text-gray-400 text-center">
                        <div class="text-4xl mb-2">⭐</div>
                        <p class="text-sm">暂无收藏作品</p>
                    </div>
                </div>
            `;
            return;
        }

        let html = '<div class="divide-y divide-gray-200">';
        favorites.forEach(favorite => {
            html += `
                <div class="interaction-item p-3 hover:bg-gray-50 transition-colors">
                    <div class="flex-1">
                        <h5 class="text-sm font-medium text-gray-900">${favorite.title}</h5>
                        <p class="text-xs text-gray-600 mt-1">作者：${favorite.author}</p>
                        <p class="text-xs text-gray-500 mt-1">收藏时间：${this.getTimeAgo(favorite.date)}</p>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    }

    renderCommentHistory(timeFilter = 'all') {
        const container = document.getElementById('commentHistory');
        const comments = this.filterByTime(this.interactions.comments || [], timeFilter);

        if (comments.length === 0) {
            container.innerHTML = `
                <div class="flex items-center justify-center py-12">
                    <div class="text-gray-400 text-center">
                        <div class="text-4xl mb-2">💬</div>
                        <p class="text-sm">暂无评论记录</p>
                    </div>
                </div>
            `;
            return;
        }

        let html = '<div class="divide-y divide-gray-200">';
        comments.forEach(comment => {
            html += `
                <div class="interaction-item p-3 hover:bg-gray-50 transition-colors">
                    <div class="flex justify-between items-start mb-2">
                        <h5 class="text-sm font-medium text-gray-900 flex-1">${comment.novelTitle}</h5>
                        <span class="text-xs text-gray-500 flex-shrink-0 ml-2">${this.getTimeAgo(comment.date)}</span>
                    </div>
                    <p class="text-sm text-gray-700 bg-gray-100 p-2 rounded">${comment.content}</p>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    }

    // 辅助方法
    filterByTime(items, timeFilter) {
        if (!items || timeFilter === 'all') return items;

        const now = new Date();
        let filterDate;

        switch (timeFilter) {
            case 'today':
                filterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                filterDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                filterDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                return items;
        }

        return items.filter(item => new Date(item.date) >= filterDate);
    }

    getTimeAgo(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
        const diffMinutes = Math.ceil(diffTime / (1000 * 60));

        if (diffMinutes < 60) {
            return `${diffMinutes}分钟前`;
        } else if (diffHours < 24) {
            return `${diffHours}小时前`;
        } else if (diffDays === 1) {
            return '昨天';
        } else if (diffDays < 7) {
            return `${diffDays}天前`;
        } else {
            return date.toLocaleDateString('zh-CN');
        }
    }

    getActionText(type) {
        switch (type) {
            case 'like': return '点赞了';
            case 'favorite': return '收藏了';
            case 'comment': return '评论了';
            default: return '互动了';
        }
    }

    async loadAchievements() {
        try {
            const response = await fetch('/api/user/achievements', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.achievements = result.data;
                } else {
                    console.warn('获取成就数据失败:', result.message);
                    this.achievements = this.getDefaultAchievements();
                }
            } else {
                this.achievements = this.getDefaultAchievements();
            }
        } catch (error) {
            console.error('加载成就数据失败:', error);
            this.achievements = this.getDefaultAchievements();
        }
    }

    getDefaultAchievements() {
        return [
            { 
                id: 1, 
                name: '新手上路', 
                description: '完成第一次登录', 
                icon: '🎉', 
                unlocked: true,
                unlockedAt: '最近'
            },
            { 
                id: 2, 
                name: '阅读新手', 
                description: '累计阅读1小时', 
                icon: '📚', 
                unlocked: false
            },
            { 
                id: 3, 
                name: '阅读达人', 
                description: '累计阅读10小时', 
                icon: '📖', 
                unlocked: false
            }
        ];
    }

    renderAchievements() {
        const container = document.getElementById('achievementsList');
        
        if (!this.achievements || this.achievements.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <div class="text-4xl mb-4">🏆</div>
                    <p class="text-gray-500">暂无成就数据</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        this.achievements.forEach(achievement => {
            const isUnlocked = achievement.unlocked;
            html += `
                <div class="achievement-card p-6 rounded-xl border-2 transition-all duration-300 ${
                    isUnlocked 
                        ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-lg' 
                        : 'border-gray-200 bg-gray-50 opacity-70 hover:opacity-90'
                }">
                    <div class="text-center">
                        <div class="text-5xl mb-4 transition-transform hover:scale-110">${achievement.icon}</div>
                        <h4 class="font-bold text-lg text-gray-900 mb-2">${achievement.name}</h4>
                        <p class="text-sm text-gray-600 mb-4 leading-relaxed">${achievement.description}</p>
                        <div class="pt-2 border-t border-gray-200">
                            ${isUnlocked 
                                ? `<div class="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-100 text-green-700">
                                    <span class="mr-1">✅</span>
                                    已解锁 • ${achievement.unlockedAt}
                                   </div>`
                                : `<div class="inline-flex items-center px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-500">
                                    <span class="mr-1">🔒</span>
                                    未解锁
                                   </div>`
                            }
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    // 作品管理功能
    showCreateWorkModal() {
        this.showToast('功能开发中，敬请期待', 'info');
    }

    editWork(workId) {
        window.open(`/admin.html#edit-novel-${workId}`, '_blank');
    }

    viewWork(workId) {
        window.open(`/read.html?id=${workId}`, '_blank');
    }

    async deleteWork(workId) {
        if (!confirm('确定要删除这部作品吗？删除后无法恢复。')) {
            return;
        }

        try {
            const response = await fetch(`/api/novels/${workId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.showToast('作品删除成功', 'success');
                    await this.loadUserWorks();
                    this.renderUserWorks();
                } else {
                    this.showToast(result.message, 'error');
                }
            } else {
                this.showToast('删除失败', 'error');
            }
        } catch (error) {
            console.error('删除作品失败:', error);
            this.showToast('删除失败', 'error');
        }
    }

    // 阅读追踪功能
    async trackReadingProgress(novelId, readingTime, progress) {
        try {
            const response = await fetch('/api/user/reading-progress', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    novelId,
                    readingTime,
                    progress
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    // 更新本地统计数据
                    await this.loadReadingStats();
                }
            }
        } catch (error) {
            console.error('追踪阅读进度失败:', error);
        }
    }

    // 加载个人设置
    loadPersonalSettings() {
        const defaultSettings = {
            fontSize: 'medium',
            darkMode: false,
            themeColor: '#FE2C55',
            readingPreferences: {
                autoSaveProgress: true,
                recommendSimilar: true,
                updateNotification: true,
                enableSounds: false,
                showReadingTime: true,
                compactMode: false
            },
            privacySettings: {
                profileVisibility: 'public',
                readingHistoryVisibility: 'friends',
                favoriteListVisibility: 'public'
            }
        };
        
        const saved = localStorage.getItem('userSettings');
        return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    }
    
    // 应用已保存的设置
    applyPersonalSettings() {
        // 应用字体大小
        const fontSizeRadio = document.querySelector(`input[name="fontSize"][value="${this.personalSettings.fontSize}"]`);
        if (fontSizeRadio) {
            fontSizeRadio.checked = true;
            this.changeFontSize({ target: fontSizeRadio });
        }
        
        // 应用夜间模式
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.checked = this.personalSettings.darkMode;
        }
        
        // 应用主题色
        if (this.personalSettings.themeColor) {
            this.changeThemeColor(this.personalSettings.themeColor);
        }
        
        // 应用阅读偏好
        if (this.personalSettings.readingPreferences) {
            Object.entries(this.personalSettings.readingPreferences).forEach(([key, value]) => {
                const checkbox = document.querySelector(`input[name="${key}"]`);
                if (checkbox) {
                    checkbox.checked = value;
                }
            });
        }
        
        // 应用隐私设置
        if (this.personalSettings.privacySettings) {
            Object.entries(this.personalSettings.privacySettings).forEach(([key, value]) => {
                const select = document.querySelector(`select[name="${key}"]`);
                if (select) {
                    select.value = value;
                }
            });
        }
    }
    
    // 个性化设置保存
    async savePersonalSettings() {
        // 收集当前所有设置
        this.personalSettings.fontSize = document.querySelector('input[name="fontSize"]:checked')?.value || 'medium';
        this.personalSettings.darkMode = document.getElementById('darkModeToggle')?.checked || false;
        
        // 收集阅读偏好设置
        const readingPrefs = {};
        document.querySelectorAll('.reading-preference').forEach(checkbox => {
            readingPrefs[checkbox.name] = checkbox.checked;
        });
        this.personalSettings.readingPreferences = readingPrefs;
        
        // 收集隐私设置
        const privacySettings = {};
        document.querySelectorAll('.privacy-setting').forEach(select => {
            privacySettings[select.name] = select.value;
        });
        this.personalSettings.privacySettings = privacySettings;

        // 先保存到本地存储
        localStorage.setItem('userSettings', JSON.stringify(this.personalSettings));
        
        try {
            const response = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.personalSettings)
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.showToast('设置保存成功', 'success');
                } else {
                    this.showToast(result.message, 'error');
                }
            } else {
                // 服务器错误时仍然保持本地设置
                this.showToast('服务器同步失败，设置已本地保存', 'warning');
            }
        } catch (error) {
            console.error('保存设置失败:', error);
            this.showToast('服务器同步失败，设置已本地保存', 'warning');
        }
    }
    
    // 重置个性化设置
    async resetPersonalSettings() {
        if (!confirm('确定要重置所有个人设置吗？此操作无法撤销。')) {
            return;
        }
        
        // 清除本地存储
        localStorage.removeItem('userSettings');
        localStorage.removeItem('themeColor');
        
        // 重置为默认设置
        this.personalSettings = this.loadPersonalSettings();
        
        // 应用默认设置到界面
        this.applyPersonalSettings();
        
        // 重置主题
        document.body.classList.remove('dark-theme');
        document.getElementById('themeToggle').textContent = '🌙';
        document.documentElement.style.removeProperty('--theme-color');
        document.documentElement.style.removeProperty('--xhs-red');
        
        this.showToast('设置已重置为默认值', 'success');
        
        // 同步到服务器
        this.savePersonalSettings();
    }

    showToast(message, type = 'success') {
        // 创建toast元素
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300 ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            type === 'warning' ? 'bg-yellow-500 text-white' :
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