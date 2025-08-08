/**
 * 重构后的主 main.js 文件
 * 整合各个功能模块，提供统一的应用程序入口
 */

// 全局变量
let novelsData = [];
let filteredNovels = [];

// 应用程序主类
class MainApplication {
    constructor() {
        this.isInitialized = false;
        this.modules = {};
        this.init();
    }

    /**
     * 初始化应用程序
     */
    async init() {
        console.log('开始初始化应用程序...');

        try {
            // 初始化各个模块
            console.log('1. 初始化模块...');
            await this.initializeModules();
            console.log('1. 模块初始化完成');

            // 绑定全局事件
            console.log('2. 绑定全局事件...');
            this.bindGlobalEvents();
            console.log('2. 全局事件绑定完成');

            // 加载数据
            console.log('3. 加载初始数据...');
            await this.loadInitialData();
            console.log('3. 初始数据加载完成');

            // 初始化UI组件
            console.log('4. 初始化UI组件...');
            this.initializeUI();
            console.log('4. UI组件初始化完成');

            this.isInitialized = true;
            console.log('应用程序初始化完成');
        } catch (error) {
            console.error('应用程序初始化失败:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * 初始化各个模块
     */
    async initializeModules() {
        try {
            // 初始化主题管理器
            if (typeof ThemeManager !== 'undefined') {
                window.themeManager = new ThemeManager();
                this.modules.theme = window.themeManager;
                console.log('主题管理器初始化完成');
            } else {
                console.error('ThemeManager 类未找到');
                return;
            }

            // 初始化用户管理器并等待完成
            if (typeof UserManager !== 'undefined') {
                window.userManager = new UserManager();
                this.modules.user = window.userManager;

                // 等待用户管理器完全初始化
                if (window.userManager.token) {
                    console.log('等待用户管理器初始化完成...');
                    // 等待会员信息加载完成
                    let attempts = 0;
                    const maxAttempts = 50; // 最多等待5秒
                    await new Promise(resolve => {
                        const checkInitialization = () => {
                            attempts++;
                            if (window.userManager.membershipInfo !== null || attempts >= maxAttempts) {
                                console.log('用户管理器初始化完成，会员状态:', window.userManager.getMembershipStatus());
                                resolve();
                            } else {
                                setTimeout(checkInitialization, 100);
                            }
                        };
                        checkInitialization();
                    });
                } else {
                    console.log('用户未登录，跳过会员信息加载');
                }
                console.log('用户管理器初始化完成');
            } else {
                console.error('UserManager 类未找到');
                return;
            }

            // 初始化搜索管理器
            if (typeof SearchManager !== 'undefined') {
                window.searchManager = new SearchManager();
                this.modules.search = window.searchManager;
                console.log('搜索管理器初始化完成');
            } else {
                console.error('SearchManager 类未找到');
                return;
            }

            // 初始化卡片渲染器
            if (typeof NovelCardRenderer !== 'undefined') {
                window.cardRenderer = new NovelCardRenderer({
                    cardClickHandler: this.handleNovelClick.bind(this)
                });
                this.modules.cardRenderer = window.cardRenderer;
                console.log('卡片渲染器初始化完成');
            } else {
                console.error('NovelCardRenderer 类未找到');
                return;
            }

            // 初始化交互管理器
            if (typeof InteractionManager !== 'undefined' && window.userManager) {
                window.interactionManager = new InteractionManager(window.userManager);
                this.modules.interaction = window.interactionManager;
                console.log('交互管理器初始化完成');
            } else {
                console.error('InteractionManager 类未找到或用户管理器未初始化');
                return;
            }

            console.log('所有模块初始化完成');
        } catch (error) {
            console.error('模块初始化过程中发生错误:', error);
            throw error;
        }
    }

    /**
     * 绑定全局事件
     */
    bindGlobalEvents() {
        // 监听搜索结果更新
        document.addEventListener('searchResultsUpdated', (e) => {
            filteredNovels = e.detail.results;
            this.renderNovels();
        });
        
        // 监听主题变化
        document.addEventListener('themeChanged', (e) => {
            console.log('主题已切换为:', e.detail.theme);
        });
        
        // 监听窗口大小变化
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleWindowResize();
            }, 250);
        });
    }

    /**
     * 加载初始数据
     */
    async loadInitialData() {
        await this.loadNovelsData();
    }

    /**
     * 初始化UI组件
     */
    initializeUI() {
        // 初始化瀑布流布局
        setTimeout(() => {
            this.initMasonryLayout();
            
            // 确保移动端按钮正确初始化
            this.initializeMobileComponents();
        }, 300);
    }

    /**
     * 处理窗口大小变化
     */
    handleWindowResize() {
        // 重新渲染卡片以适应移动端/桌面端切换
        this.renderNovels();
    }

    /**
     * 处理小说卡片点击
     */
    handleNovelClick(novel, hasAccess, requiresLogin) {
        if (!hasAccess) {
            if (requiresLogin) {
                if (confirm('此内容需要登录后查看，是否前往登录？')) {
                    window.location.href = 'login.html';
                }
                return;
            } else {
                const levelText = novel.accessLevel === 'premium' ? '高级会员' : 'VIP会员';
                if (confirm(`此内容需要${levelText}权限，是否开通会员？`)) {
                    showMembershipCenter();
                }
                return;
            }
        }
        
        // 有权限访问，增加阅读量
        novel.views += 1;
        
        // 跳转到阅读页面
        window.location.href = `read.html?id=${novel.id}`;
    }

    /**
     * 处理初始化错误
     */
    handleInitializationError(error) {
        console.error('应用程序启动失败:', error);
        if (typeof Utils !== 'undefined' && Utils.showToast) {
            Utils.showToast('应用程序启动失败，请刷新页面重试', 'error');
        } else {
            alert('应用程序启动失败，请刷新页面重试');
        }
    }

    /**
     * 加载小说数据
     */
    async loadNovelsData() {
        if (!Utils.checkNetworkStatus()) {
            showLoading(false);
            return;
        }

        try {
            showLoading(true);

            const loadData = async () => {
                const headers = {
                    'Content-Type': 'application/json'
                };
                
                // 如果用户已登录，添加认证头
                if (window.userManager && window.userManager.token) {
                    headers['Authorization'] = `Bearer ${window.userManager.token}`;
                }
                
                const response = await fetch('/api/novels', { headers });
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return await response.json();
            };

            const data = await Utils.retryOperation(loadData);

            if (!data || !data.novels || !Array.isArray(data.novels)) {
                throw new Error('数据格式错误');
            }

            novelsData = data.novels;
            filteredNovels = [...novelsData];
            
            // 设置搜索管理器的数据
            if (window.searchManager) {
                window.searchManager.setNovelsData(novelsData);
            }
            
            this.renderNovels();
            showLoading(false);

            if (novelsData.length === 0) {
                showError('暂无小说数据，请稍后再试');
            } else {
                Utils.showToast(`成功加载 ${novelsData.length} 部小说`);
            }

        } catch (error) {
            console.error('加载数据失败:', error);
            showLoading(false);

            let errorMessage = '数据加载失败';
            if (error.message.includes('HTTP 404')) {
                errorMessage = '数据文件未找到，请联系管理员';
            } else if (error.message.includes('HTTP 500')) {
                errorMessage = '服务器错误，请稍后重试';
            } else if (error.message.includes('数据格式错误')) {
                errorMessage = '数据格式错误，请联系管理员';
            } else if (!navigator.onLine) {
                errorMessage = '网络连接已断开，请检查网络设置';
            }

            showError(errorMessage);
        }
    }

    /**
     * 渲染小说
     */
    renderNovels() {
        const container = document.querySelector('.waterfall-container');
        if (!container || !window.cardRenderer) return;

        // 使用卡片渲染器渲染小说
        window.cardRenderer.renderNovels(filteredNovels, container, window.userManager);

        // 渲染完成后重新布局瀑布流
        requestAnimationFrame(() => {
            setTimeout(() => {
                if (window.waterfallInstance) {
                    window.waterfallInstance.refresh();
                } else {
                    this.initMasonryLayout();
                }
                // 额外延迟确保卡片高度计算正确
                setTimeout(() => {
                    if (window.waterfallInstance) {
                        window.waterfallInstance.refresh();
                    }
                }, 300);
            }, 100);
        });
    }

    /**
     * 初始化瀑布流布局
     */
    initMasonryLayout() {
        const container = document.querySelector('.waterfall-container');
        if (!container) return;

        // 销毁旧实例
        if (window.waterfallInstance) {
            window.waterfallInstance.destroy();
        }

        // 创建新实例，根据屏幕尺寸调整参数
        const screenWidth = window.innerWidth;
        let config = {
            gap: 16,
            minColumnWidth: 280,
            maxColumns: 4,
            padding: 20,
            animationDuration: 300,
            debounceDelay: 150
        };

        // 响应式配置
        if (screenWidth >= 1400) {
            config = { ...config, gap: 24, minColumnWidth: 240, maxColumns: 4, padding: 24 };
        } else if (screenWidth >= 1200) {
            config = { ...config, gap: 20, minColumnWidth: 220, maxColumns: 4, padding: 20 };
        } else if (screenWidth >= 1024) {
            config = { ...config, gap: 18, minColumnWidth: 240, maxColumns: 3, padding: 18 };
        } else if (screenWidth >= 768) {
            config = { ...config, gap: 16, minColumnWidth: 220, maxColumns: 3, padding: 16 };
        } else if (screenWidth >= 640) {
            config = { ...config, gap: 14, minColumnWidth: 180, maxColumns: 2, padding: 14 };
        } else {
            config = { ...config, gap: 12, minColumnWidth: 150, maxColumns: 2, padding: 12 };
        }

        window.waterfallInstance = new WaterfallLayout(container, config);
        window.waterfallInstance.layout();
    }

    /**
     * 初始化移动端组件
     */
    initializeMobileComponents() {
        const mobileSearchBtn = document.getElementById('mobileSearchBtn');
        const mobileSearchBar = document.getElementById('mobileSearchBar');
        const themeToggle = document.getElementById('themeToggle');
        const hamburgerBtn = document.getElementById('hamburgerBtn');

        // 确保移动端搜索栏初始状态正确
        if (mobileSearchBar) {
            mobileSearchBar.classList.add('hidden');
            mobileSearchBar.classList.remove('show');
            console.log('移动端搜索栏初始状态已设置为隐藏');
        }

        // 绑定汉堡菜单按钮事件
        if (hamburgerBtn) {
            hamburgerBtn.addEventListener('click', toggleHamburgerMenu);
            console.log('汉堡菜单按钮事件已绑定');
        }

        // 为移动设备优化点击事件
        this.optimizeForMobileDevices();

        console.log('移动端组件初始化完成');
    }

    /**
     * 为移动设备优化点击事件
     */
    optimizeForMobileDevices() {
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobileDevice) {
            console.log('检测到移动设备，优化触摸事件');
            
            // 优化主题切换按钮的点击区域
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) {
                themeToggle.style.padding = '12px';
            }
            
            // 优化移动端搜索按钮的点击区域
            const mobileSearchBtn = document.getElementById('mobileSearchBtn');
            if (mobileSearchBtn) {
                mobileSearchBtn.style.padding = '12px';
            }
        }
    }

    // 离线阅读管理器已移除

    /**
     * 获取模块实例
     */
    getModule(name) {
        return this.modules[name] || null;
    }

    /**
     * 销毁应用程序
     */
    destroy() {
        // 销毁所有模块
        Object.values(this.modules).forEach(module => {
            if (module && typeof module.destroy === 'function') {
                module.destroy();
            }
        });
        
        // 销毁瀑布流实例
        if (waterfallInstance) {
            waterfallInstance.destroy();
        }
        
        console.log('应用程序已销毁');
    }
}

// 创建全局应用实例
let mainApp = null;

/**
 * 页面加载完成后初始化
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成，开始初始化应用程序...');

    // 检查是否已经初始化过
    if (window.mainApp) {
        console.log('主应用已经初始化过，跳过重复初始化');
        return;
    }

    // 创建主应用实例
    try {
        window.mainApp = new MainApplication();
        console.log('主应用初始化成功');
    } catch (error) {
        console.error('主应用初始化失败:', error);
    }
});

// =============== 兼容性函数 - 保持与现有代码的兼容性 ===============

/**
 * 加载小说数据（兼容性函数）
 */
function loadNovels() {
    if (mainApp) {
        return mainApp.loadNovelsData();
    }
}

/**
 * 渲染小说（兼容性函数）
 */
function renderNovels() {
    if (mainApp) {
        mainApp.renderNovels();
    }
}

/**
 * 初始化瀑布流布局（兼容性函数）
 */
function initMasonryLayout() {
    if (mainApp) {
        mainApp.initMasonryLayout();
    }
}

/**
 * 切换主题（兼容性函数）
 */
function toggleTheme() {
    if (window.themeManager) {
        window.themeManager.toggleTheme();
    }
}

/**
 * 更新主题切换图标（兼容性函数）
 */
function updateThemeToggleIcons() {
    if (window.themeManager) {
        window.themeManager.updateThemeToggleIcons();
    }
}

/**
 * 处理搜索（兼容性函数）
 */
function handleSearch(event) {
    if (window.searchManager) {
        window.searchManager.handleSearch(event);
    }
}

/**
 * 防抖函数（兼容性函数）
 */
function debounce(func, wait) {
    return Utils.debounce(func, wait);
}

/**
 * 显示Toast（兼容性函数）
 */
function showToast(message, type = 'success') {
    Utils.showToast(message, type);
}

/**
 * 格式化阅读量（兼容性函数）
 */
function formatViews(views) {
    return Utils.formatViews(views);
}

/**
 * 计算时间差（兼容性函数）
 */
function getTimeAgo(publishTime) {
    return Utils.getTimeAgo(publishTime);
}

// =============== 用户交互函数 ===============

/**
 * 切换用户下拉菜单
 */
function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

/**
 * 显示用户资料
 */
function showUserProfile() {
    window.location.href = 'user-profile.html';
    toggleUserDropdown();
}

/**
 * 显示收藏
 */
function showFavorites() {
    Utils.showToast('收藏功能开发中...', 'info');
    toggleUserDropdown();
}

/**
 * 显示阅读历史
 */
function showReadHistory() {
    Utils.showToast('阅读历史功能开发中...', 'info');
    toggleUserDropdown();
}

/**
 * 退出登录
 */
async function logout() {
    if (window.userManager) {
        await window.userManager.logout();
    }
    toggleUserDropdown();
}

// =============== 移动端搜索相关函数 ===============

/**
 * 切换移动端搜索栏
 */
function toggleMobileSearch() {
    const mobileSearchBar = document.getElementById('mobileSearchBar');
    if (mobileSearchBar) {
        const isHidden = mobileSearchBar.classList.contains('hidden');
        if (isHidden) {
            mobileSearchBar.classList.remove('hidden');
            mobileSearchBar.classList.add('show');
            // 聚焦到搜索框
            const searchInput = document.getElementById('mobileSearchInput');
            if (searchInput) {
                setTimeout(() => searchInput.focus(), 100);
            }
        } else {
            mobileSearchBar.classList.add('hidden');
            mobileSearchBar.classList.remove('show');
        }
    }
}

// =============== 汉堡菜单相关函数 ===============

/**
 * 切换汉堡菜单
 */
function toggleHamburgerMenu() {
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const hamburgerIcon = document.getElementById('hamburgerIcon');

    if (hamburgerMenu && hamburgerIcon) {
        const isOpen = hamburgerMenu.classList.contains('show');

        if (isOpen) {
            closeHamburgerMenu();
        } else {
            openHamburgerMenu();
        }
    }
}

/**
 * 打开汉堡菜单
 */
function openHamburgerMenu() {
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const hamburgerIcon = document.getElementById('hamburgerIcon');

    if (hamburgerMenu && hamburgerIcon) {
        hamburgerMenu.classList.add('show');
        hamburgerIcon.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * 关闭汉堡菜单
 */
function closeHamburgerMenu() {
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const hamburgerIcon = document.getElementById('hamburgerIcon');

    if (hamburgerMenu && hamburgerIcon) {
        hamburgerMenu.classList.remove('show');
        hamburgerIcon.classList.remove('open');
        document.body.style.overflow = '';
    }
}

// =============== 小说交互函数 ===============

/**
 * 处理点赞
 */
async function handleLike(event, novelId) {
    event.stopPropagation();

    const btn = event.target.closest('.like-btn');
    const icon = btn.querySelector('.like-icon');
    const count = btn.querySelector('.like-count');

    const isLiked = btn.classList.contains('liked');
    const method = isLiked ? 'DELETE' : 'POST';
    const url = `/api/novels/${novelId}/like`;

    try {
        // 立即更新UI
        if (isLiked) {
            btn.classList.remove('liked');
            icon.textContent = '🤍';
        } else {
            btn.classList.add('liked');
            icon.textContent = '❤️';
        }

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (result.success) {
            if (count) count.textContent = Utils.formatViews(result.data.likes);
            Utils.showToast(result.message, 'success');

            // 更新本地数据
            const novel = novelsData.find(n => n.id === novelId);
            if (novel) {
                novel.likes = result.data.likes;
            }
        } else {
            // 回滚UI
            if (isLiked) {
                btn.classList.add('liked');
                icon.textContent = '❤️';
            } else {
                btn.classList.remove('liked');
                icon.textContent = '🤍';
            }
            Utils.showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('点赞操作失败:', error);
        // 回滚UI
        if (isLiked) {
            btn.classList.add('liked');
            icon.textContent = '❤️';
        } else {
            btn.classList.remove('liked');
            icon.textContent = '🤍';
        }
        Utils.showToast('点赞操作失败，请稍后重试', 'error');
    }
}

/**
 * 处理收藏
 */
async function handleFavorite(event, novelId) {
    event.stopPropagation();

    const btn = event.target.closest('.favorite-btn');
    const icon = btn.querySelector('.favorite-icon');
    const count = btn.querySelector('.favorite-count');

    const isFavorited = btn.classList.contains('favorited');
    const method = isFavorited ? 'DELETE' : 'POST';
    const url = `/api/novels/${novelId}/favorite`;

    try {
        // 立即更新UI
        if (isFavorited) {
            btn.classList.remove('favorited');
            icon.textContent = '☆';
        } else {
            btn.classList.add('favorited');
            icon.textContent = '⭐';
        }

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (result.success) {
            if (count) count.textContent = Utils.formatViews(result.data.favorites);
            Utils.showToast(result.message, 'success');

            // 更新本地数据
            const novel = novelsData.find(n => n.id === novelId);
            if (novel) {
                novel.favorites = result.data.favorites;
            }
        } else {
            // 回滚UI
            if (isFavorited) {
                btn.classList.add('favorited');
                icon.textContent = '⭐';
            } else {
                btn.classList.remove('favorited');
                icon.textContent = '☆';
            }
            Utils.showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('收藏操作失败:', error);
        // 回滚UI
        if (isFavorited) {
            btn.classList.add('favorited');
            icon.textContent = '⭐';
        } else {
            btn.classList.remove('favorited');
            icon.textContent = '☆';
        }
        Utils.showToast('收藏操作失败，请稍后重试', 'error');
    }
}

// 分享功能已移除

// 离线下载功能已移除

// =============== 会员中心相关函数 ===============

/**
 * 显示会员中心
 */
function showMembershipCenter() {
    if (!window.userManager || !window.userManager.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    showMembershipModal();
}

/**
 * 显示高级会员开通弹窗
 */
function showPremiumMembershipModal(membershipType) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay';
    modal.innerHTML = `
        <div class="bg-white rounded-3xl max-w-md w-full mx-4 p-8 modal-content">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-2xl font-bold bg-gradient-to-r from-premium to-vip bg-clip-text text-transparent">
                    开通会员
                </h3>
                <button onclick="closeMembershipModal()" class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            
            <div id="modalMembershipInfo" class="mb-6">
                <div class="text-center mb-4">
                    <div class="w-16 h-16 bg-gradient-to-br ${membershipType === 'premium' ? 'from-premium to-pink-500' : 'from-vip to-yellow-400'} rounded-full flex items-center justify-center mx-auto mb-4">
                        <span class="text-2xl">${membershipType === 'premium' ? '⭐' : '💎'}</span>
                    </div>
                    <h4 class="text-xl font-bold ${membershipType === 'premium' ? 'text-premium' : 'text-vip'}">${membershipType === 'premium' ? '高级会员' : 'VIP会员'}</h4>
                    <p class="text-3xl font-bold ${membershipType === 'premium' ? 'text-premium' : 'text-vip'}">¥${membershipType === 'premium' ? '19.9' : '39.9'}<span class="text-lg text-gray-500">/月</span></p>
                </div>
            </div>
            
            <div class="space-y-4 mb-6">
                <div class="bg-gradient-to-r from-premium to-pink-500 rounded-xl p-4 text-white">
                    <h4 class="font-semibold mb-2">💎 高级会员特权</h4>
                    <ul class="text-sm space-y-1">
                        <li>• 解锁大部分精选内容</li>
                        <li>• 无广告阅读体验</li>
                        <li>• 支持离线下载</li>
                        <li>• 优先客服支持</li>
                    </ul>
                </div>
                
                <div class="bg-gradient-to-r from-vip to-yellow-400 rounded-xl p-4 text-white">
                    <h4 class="font-semibold mb-2">👑 VIP会员特权</h4>
                    <ul class="text-sm space-y-1">
                        <li>• 解锁所有内容</li>
                        <li>• 24小时专属客服</li>
                        <li>• 独家VIP专区</li>
                        <li>• 优先体验新功能</li>
                    </ul>
                </div>
            </div>
            
            <div class="text-center">
                <button onclick="contactCustomerService()" class="w-full py-3 bg-gradient-to-r from-premium to-vip text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                    📞 联系客服开通
                </button>
                <p class="text-sm text-gray-500 mt-2">
                    客服将为您提供专业的开通服务
                </p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.id = 'membershipModal';
    
    // 显示动画
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // 点击弹窗外部关闭
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeMembershipModal();
        }
    });
}

/**
 * 联系客服
 */
async function contactCustomerService() {
    try {
        const response = await fetch('/api/settings');
        const result = await response.json();

        let contactInfo = '';
        if (result.success && result.data.contact) {
            const contact = result.data.contact;
            contactInfo = `请联系客服开通会员：\n\n• 微信：${contact.wechat}\n• 邮件：${contact.email}`;

            if (contact.qq && contact.qq.trim()) {
                contactInfo += `\n• QQ：${contact.qq}`;
            }
            if (contact.phone && contact.phone.trim()) {
                contactInfo += `\n• 电话：${contact.phone}`;
            }

            if (contact.supportNote && contact.supportNote.trim()) {
                contactInfo += `\n\n${contact.supportNote}`;
            } else {
                contactInfo += '\n\n我们将为您提供安全的支付方式和专业的开通服务。';
            }
        } else {
            contactInfo = '请联系客服开通会员：\n\n• 微信：novel-service\n• 邮件：service@novel-site.com\n\n我们将为您提供安全的支付方式和专业的开通服务。';
        }

        alert(contactInfo);
        closeMembershipModal();
    } catch (error) {
        console.error('获取联系方式失败:', error);
        alert('获取联系方式失败，请稍后重试');
    }
}

/**
 * 显示会员中心模态框（新版本）
 */
function showMembershipModal(membershipType = null) {
    // 如果指定了会员类型，直接显示开通弹窗
    if (membershipType) {
        showPremiumMembershipModal(membershipType);
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay';
    modal.innerHTML = `
        <div class="bg-white rounded-3xl max-w-md w-full mx-4 p-8 modal-content">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-2xl font-bold bg-gradient-to-r from-premium to-vip bg-clip-text text-transparent">
                    会员中心
                </h3>
                <button onclick="closeMembershipModal()" class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <div id="membershipContent" class="text-center">
                <div class="loading-spinner"></div>
                <p class="mt-2 text-gray-600">加载中...</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.id = 'membershipModal';
    
    // 显示动画
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // 加载会员信息
    loadMembershipModalContent();
}

/**
 * 关闭会员中心模态框
 */
function closeMembershipModal() {
    const modal = document.getElementById('membershipModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

/**
 * 加载会员信息内容
 */
async function loadMembershipModalContent() {
    try {
        const membership = window.userManager.getMembershipStatus();
        const plansResponse = await fetch('/api/membership/plans');
        const plansResult = await plansResponse.json();
        
        const content = document.getElementById('membershipContent');
        if (!content) return;
        
        let statusHtml = '';
        if (membership.type === 'free') {
            statusHtml = `
                <div class="mb-6">
                    <div class="text-gray-600 mb-2">当前状态：普通用户</div>
                    <p class="text-sm text-gray-500">开通会员享受更多精彩内容</p>
                </div>
            `;
        } else {
            const endDate = membership.endDate ? new Date(membership.endDate).toLocaleDateString() : '永久';
            statusHtml = `
                <div class="mb-6">
                    <div class="flex items-center justify-center mb-2">
                        <span class="text-lg font-medium">${window.userManager.getMembershipDisplayName()}</span>
                        ${window.userManager.getMembershipBadge()}
                    </div>
                    <p class="text-sm text-gray-500">到期时间：${endDate}</p>
                </div>
            `;
        }
        
        let plansHtml = '';
        if (plansResult.success) {
            plansHtml = Object.entries(plansResult.data).map(([type, plan]) => {
                const isCurrent = membership.type === type;
                const buttonClass = isCurrent ? 'bg-gray-500' : (type === 'premium' ? 'bg-premium hover:bg-pink-600' : 'bg-vip hover:bg-yellow-600');
                const buttonText = isCurrent ? '当前套餐' : '立即开通';
                
                return `
                    <div class="bg-white rounded-xl p-4 mb-3 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                        <div class="flex items-center justify-between">
                            <div>
                                <h4 class="font-medium text-gray-800 mb-1">${plan.name}</h4>
                                <p class="text-sm text-gray-600">${plan.description}</p>
                            </div>
                            <div class="text-right">
                                <span class="text-2xl font-bold ${type === 'premium' ? 'text-premium' : 'text-vip'}">¥${plan.prices[0].price}</span>
                                <span class="text-sm text-gray-500 block">/月</span>
                                <button onclick="upgradeMembership('${type}')" 
                                        class="mt-2 px-4 py-2 ${buttonClass} text-white text-sm rounded-full transition-all duration-300 transform hover:scale-105 ${isCurrent ? '' : 'hover:shadow-lg'}">
                                    ${buttonText}
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        content.innerHTML = `
            ${statusHtml}
            <div class="space-y-3">
                <h4 class="font-medium text-left text-lg">会员套餐</h4>
                ${plansHtml}
            </div>
        `;
    } catch (error) {
        console.error('加载会员信息失败:', error);
        const content = document.getElementById('membershipContent');
        if (content) {
            content.innerHTML = '<p class="text-red-500">加载失败，请稍后重试</p>';
        }
    }
}

/**
 * 升级会员 - 仅显示购买引导，禁止直接开通
 */
async function upgradeMembership(membershipType) {
    // 安全措施：禁止前端直接开通会员
    const membershipText = membershipType === 'premium' ? '高级会员' : 'VIP会员';
    const price = membershipType === 'premium' ? '19.9' : '39.9';

    // 动态获取联系方式信息
    try {
        const response = await fetch('/api/settings');
        const result = await response.json();

        let contactInfo = '';
        if (result.success && result.data.contact) {
            const contact = result.data.contact;
            contactInfo = `为确保支付安全，请联系客服开通：\n• 微信：${contact.wechat}\n• 邮件：${contact.email}`;

            // 如果有QQ或电话，也显示
            if (contact.qq && contact.qq.trim()) {
                contactInfo += `\n• QQ：${contact.qq}`;
            }
            if (contact.phone && contact.phone.trim()) {
                contactInfo += `\n• 电话：${contact.phone}`;
            }

            // 添加客服说明
            if (contact.supportNote && contact.supportNote.trim()) {
                contactInfo += `\n\n${contact.supportNote}`;
            } else {
                contactInfo += '\n\n我们将为您提供安全的支付方式和专业的开通服务。';
            }
        } else {
            // 使用默认联系方式
            contactInfo = '为确保支付安全，请联系客服开通：\n• 微信：novel-service\n• 邮件：service@novel-site.com\n\n我们将为您提供安全的支付方式和专业的开通服务。';
        }

        alert(`${membershipText} (¥${price}/月)\n\n${contactInfo}`);
    } catch (error) {
        console.error('获取联系方式失败:', error);
        // 使用默认联系方式
        alert(`${membershipText} (¥${price}/月)\n\n为确保支付安全，请联系客服开通：\n• 微信：novel-service\n• 邮件：service@novel-site.com\n\n我们将为您提供安全的支付方式和专业的开通服务。`);
    }

    // 可选：跳转到会员页面查看详细信息
    if (confirm('是否查看会员套餐详情？')) {
        window.open('/membership.html', '_blank');
    }
}

// =============== 图片处理函数 ===============

/**
 * 处理图片加载完成
 */
function handleImageLoaded(img) {
    img.classList.add('loaded');
    
    // 触发瀑布流重新布局
    if (window.waterfallInstance) {
        clearTimeout(window.imageLoadTimeout);
        window.imageLoadTimeout = setTimeout(() => {
            window.waterfallInstance.layout();
        }, 100);
    }
}

/**
 * 处理图片加载失败
 */
function handleImageError(img) {
    const parent = img.parentElement;
    if (parent) {
        parent.innerHTML = `
            <div class="w-full h-full bg-gray-200 flex items-center justify-center">
                <span class="text-gray-500 text-sm">图片加载失败</span>
            </div>
        `;
    }

    // 触发重新布局
    if (window.waterfallInstance) {
        setTimeout(() => {
            window.waterfallInstance.layout();
        }, 50);
    }
}

// =============== 工具函数 ===============

/**
 * 显示/隐藏加载动画
 */
function showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
        if (show) {
            loading.classList.remove('hidden');
        } else {
            loading.classList.add('hidden');
        }
    }
}

/**
 * 显示错误信息
 */
function showError(message) {
    const container = document.querySelector('.waterfall-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="col-span-full text-center py-12">
            <div class="text-6xl mb-4">😔</div>
            <div class="text-gray-700 text-lg font-medium mb-2">出错了</div>
            <div class="text-gray-500 text-base mb-6">${message}</div>
            <button onclick="location.reload()"
                    class="px-6 py-2 bg-xhs-red text-white rounded-lg hover:bg-red-600 transition-colors">
                重新加载
            </button>
        </div>
    `;
}

/**
 * 初始化主题
 */
function initTheme() {
    // 主题管理器会自动处理初始化
    console.log('主题初始化由ThemeManager处理');
}

// =============== 用户下拉菜单事件绑定 ===============

// 绑定头像菜单点击事件
document.addEventListener('DOMContentLoaded', function() {
    // 为头像下拉菜单添加事件监听
    document.addEventListener('click', function(event) {
        const toggleBtn = document.getElementById('avatarDropdownToggle');
        const dropdown = document.getElementById('userDropdown');
        
        // 如果点击的是头像切换按钮或其内部元素，则切换显示下拉菜单
        if (toggleBtn && (toggleBtn === event.target || toggleBtn.contains(event.target))) {
            if (dropdown) {
                dropdown.classList.toggle('show');
            }
            event.stopPropagation();
            return;
        }
        
        // 如果点击的是其他区域，则关闭下拉菜单
        if (dropdown && (!event.target.closest('#userDropdown'))) {
            dropdown.classList.remove('show');
        }
    });
});

// =============== 样式注入 ===============

// 添加样式类
const style = document.createElement('style');
style.textContent = `
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
    
    .line-clamp-3 {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
    
    .dark-theme {
        background-color: #1A1A1A !important;
        color: #E0E0E0 !important;
    }
    
    .dark-theme .bg-white {
        background-color: #2A2A2A !important;
        color: #E0E0E0 !important;
    }
    
    .dark-theme .text-gray-800 {
        color: #E0E0E0 !important;
    }
    
    .dark-theme .text-gray-600 {
        color: #B0B0B0 !important;
    }
    
    .dark-theme .text-gray-500 {
        color: #888888 !important;
    }
    
    .dark-theme .bg-gray-100 {
        background-color: #404040 !important;
        color: #E0E0E0 !important;
    }
    
    .dark-theme .border-gray-100 {
        border-color: #404040 !important;
    }

    /* 用户下拉菜单样式 */
    .user-dropdown.show {
        display: block !important;
    }

    .user-dropdown {
        display: none;
    }

    .user-menu:hover .user-avatar {
        background-color: #f9fafb;
    }

    .user-avatar .dropdown-arrow {
        transition: transform 0.2s ease;
    }

    .user-dropdown.show .dropdown-arrow {
        transform: rotate(180deg);
    }

    /* 移动端汉堡菜单显示状态 */
    #hamburgerMenu.show {
        transform: translateY(0);
        opacity: 1;
    }

    #hamburgerIcon.open {
        transform: rotate(45deg);
    }

    /* 点赞和收藏按钮样式 */
    .like-btn.liked {
        color: #ef4444 !important;
    }

    .favorite-btn.favorited {
        color: #f59e0b !important;
    }

    .like-btn:hover, .favorite-btn:hover {
        transform: scale(1.1);
        transition: transform 0.2s ease;
    }

    .like-btn.liked .like-icon {
        animation: heartBeat 0.6s ease-in-out;
    }

    .favorite-btn.favorited .favorite-icon {
        animation: starTwinkle 0.6s ease-in-out;
    }

    @keyframes heartBeat {
        0% { transform: scale(1); }
        25% { transform: scale(1.3); }
        50% { transform: scale(1.1); }
        75% { transform: scale(1.2); }
        100% { transform: scale(1); }
    }

    @keyframes starTwinkle {
        0% { transform: scale(1) rotate(0deg); }
        25% { transform: scale(1.2) rotate(5deg); }
        50% { transform: scale(1.1) rotate(-5deg); }
        75% { transform: scale(1.15) rotate(3deg); }
        100% { transform: scale(1) rotate(0deg); }
    }
`;
document.head.appendChild(style);

// =============== 全局变量导出 ===============

// 将重要的模块实例暴露到全局作用域，以便其他脚本使用
window.mainApp = mainApp;
// 其他模块实例已经在初始化时赋值到window对象

// 暴露兼容性函数
window.loadNovels = loadNovels;
window.renderNovels = renderNovels;
window.initMasonryLayout = initMasonryLayout;
window.toggleTheme = toggleTheme;
window.updateThemeToggleIcons = updateThemeToggleIcons;
window.handleSearch = handleSearch;
window.debounce = debounce;
window.showToast = showToast;
window.formatViews = formatViews;
window.getTimeAgo = getTimeAgo;
window.handleLike = handleLike;
window.handleFavorite = handleFavorite;
// 分享和离线下载功能已移除
window.handleImageLoaded = handleImageLoaded;
window.handleImageError = handleImageError;
window.showMembershipCenter = showMembershipCenter;
window.closeMembershipModal = closeMembershipModal;
window.upgradeMembership = upgradeMembership;
window.showPremiumMembershipModal = showPremiumMembershipModal;
window.contactCustomerService = contactCustomerService;
window.showLoading = showLoading;
window.showError = showError;
window.logout = logout;
window.showFavorites = showFavorites;
window.showReadHistory = showReadHistory;
window.toggleMobileSearch = toggleMobileSearch;
window.toggleHamburgerMenu = toggleHamburgerMenu;
window.openHamburgerMenu = openHamburgerMenu;
window.closeHamburgerMenu = closeHamburgerMenu;

console.log('main.js 模块化重构完成');