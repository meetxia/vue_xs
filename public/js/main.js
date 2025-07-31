/**
 * 重构后的主 main.js 文件
 * 整合各个功能模块，提供统一的应用程序入口
 */

// 全局变量
let novelsData = [];
let filteredNovels = [];

// 模块实例
let userManager = null;
let themeManager = null;
let searchManager = null;
let waterfallInstance = null;
let cardRenderer = null;
let offlineManager = null;

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
            await this.initializeModules();
            
            // 绑定全局事件
            this.bindGlobalEvents();
            
            // 加载数据
            await this.loadInitialData();
            
            // 初始化UI组件
            this.initializeUI();
            
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
        // 初始化主题管理器
        themeManager = new ThemeManager();
        this.modules.theme = themeManager;
        
        // 初始化用户管理器
        userManager = new UserManager();
        this.modules.user = userManager;
        
        // 初始化搜索管理器
        searchManager = new SearchManager();
        this.modules.search = searchManager;
        
        // 初始化卡片渲染器
        cardRenderer = new NovelCardRenderer({
            cardClickHandler: this.handleNovelClick.bind(this)
        });
        this.modules.cardRenderer = cardRenderer;
        
        console.log('所有模块初始化完成');
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
            
            // 初始化离线阅读管理器
            setTimeout(() => {
                this.initOfflineManager();
            }, 100);
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
        if (window.Utils && window.Utils.showToast) {
            Utils.showToast('应用程序启动失败，请刷新页面重试', 'error');
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
                if (userManager && userManager.token) {
                    headers['Authorization'] = `Bearer ${userManager.token}`;
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
            if (searchManager) {
                searchManager.setNovelsData(novelsData);
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
        if (!container || !cardRenderer) return;

        // 使用卡片渲染器渲染小说
        cardRenderer.renderNovels(filteredNovels, container, userManager);

        // 渲染完成后重新布局瀑布流
        requestAnimationFrame(() => {
            setTimeout(() => {
                if (waterfallInstance) {
                    waterfallInstance.refresh();
                } else {
                    this.initMasonryLayout();
                }
                // 额外延迟确保卡片高度计算正确
                setTimeout(() => {
                    if (waterfallInstance) {
                        waterfallInstance.refresh();
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
        if (waterfallInstance) {
            waterfallInstance.destroy();
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

        waterfallInstance = new WaterfallLayout(container, config);
        waterfallInstance.layout();
    }

    /**
     * 初始化移动端组件
     */
    initializeMobileComponents() {
        const mobileSearchBtn = document.getElementById('mobileSearchBtn');
        const mobileSearchBar = document.getElementById('mobileSearchBar');
        const themeToggle = document.getElementById('themeToggle');

        // 确保移动端搜索栏初始状态正确
        if (mobileSearchBar) {
            mobileSearchBar.classList.add('hidden');
            mobileSearchBar.classList.remove('show');
            console.log('移动端搜索栏初始状态已设置为隐藏');
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

    /**
     * 初始化离线阅读管理器
     */
    initOfflineManager() {
        console.log('开始初始化离线阅读管理器...');

        if (typeof OfflineReaderManager !== 'undefined') {
            try {
                offlineManager = new OfflineReaderManager();

                // 注册Toast通知函数
                if (typeof Utils.showToast === 'function') {
                    offlineManager.registerToastFunction(Utils.showToast);
                    console.log('Toast通知函数注册成功');
                }

                console.log('离线阅读管理器初始化成功');

                // 延迟更新按钮状态
                setTimeout(() => {
                    updateAllOfflineButtonStates();
                }, 500);

            } catch (error) {
                console.error('离线阅读管理器初始化失败:', error);
            }
        } else {
            console.error('OfflineReaderManager类未加载，请检查offline-reader.js是否正确引入');

            // 重试机制
            setTimeout(() => {
                console.log('重试初始化离线管理器...');
                this.initOfflineManager();
            }, 2000);
        }
    }

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
    
    // 创建主应用实例
    mainApp = new MainApplication();
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
    if (themeManager) {
        themeManager.toggleTheme();
    }
}

/**
 * 更新主题切换图标（兼容性函数）
 */
function updateThemeToggleIcons() {
    if (themeManager) {
        themeManager.updateThemeToggleIcons();
    }
}

/**
 * 处理搜索（兼容性函数）
 */
function handleSearch(event) {
    if (searchManager) {
        searchManager.handleSearch(event);
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
    if (userManager) {
        await userManager.logout();
    }
    toggleUserDropdown();
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

/**
 * 处理分享
 */
function handleShare(event, novelId) {
    event.stopPropagation();
    
    const novel = novelsData.find(n => n.id === novelId);
    if (!novel) return;
    
    const shareUrl = `${window.location.origin}/read.html?id=${novelId}`;
    const shareText = `推荐一部好小说：${novel.title}`;
    
    if (navigator.share) {
        navigator.share({
            title: novel.title,
            text: shareText,
            url: shareUrl
        }).catch(err => console.log('分享失败:', err));
    } else {
        // 复制链接到剪贴板
        Utils.copyToClipboard(shareUrl).then(success => {
            if (success) {
                Utils.showToast('链接已复制到剪贴板', 'success');
            } else {
                Utils.showToast('分享失败', 'error');
            }
        });
    }
}

// =============== 离线下载相关函数 ===============

/**
 * 处理离线下载
 */
async function handleOfflineDownload(event, novelId) {
    event.stopPropagation();

    console.log(`开始处理离线下载，小说ID: ${novelId}`);

    // 确保离线管理器已初始化
    if (!offlineManager) {
        console.log('离线管理器未初始化，尝试重新初始化...');
        if (mainApp) {
            mainApp.initOfflineManager();
        }

        await Utils.sleep(500);

        if (!offlineManager) {
            console.error('离线管理器初始化失败');
            Utils.showToast('离线功能不可用，请刷新页面重试', 'error');
            return;
        }
    }

    const btn = event.target.closest('.offline-btn');
    const icon = btn.querySelector('.offline-icon');

    if (!btn || !icon) {
        console.error('找不到离线按钮或图标元素');
        return;
    }

    try {
        // 检查是否已经离线保存
        const isOfflineAvailable = await offlineManager.isNovelAvailableOffline(novelId);

        if (isOfflineAvailable) {
            // 已经离线保存，询问是否删除
            if (confirm('该小说已离线保存，是否删除离线版本？')) {
                try {
                    await offlineManager.deleteNovel(novelId);
                    icon.textContent = '📥';
                    btn.classList.remove('offline-downloaded');
                    btn.title = '离线下载';
                    Utils.showToast('离线版本已删除', 'success');
                } catch (error) {
                    console.error('删除离线版本失败:', error);
                    Utils.showToast('删除失败，请稍后重试', 'error');
                }
            }
            return;
        }

        // 开始下载
        console.log('开始下载小说到离线存储...');

        // 更新按钮状态为下载中
        icon.textContent = '⏳';
        btn.disabled = true;
        btn.title = '下载中...';

        const result = await offlineManager.downloadNovel(novelId);

        if (result && result.success) {
            icon.textContent = '✅';
            btn.classList.add('offline-downloaded');
            btn.title = '已离线保存，点击删除';
            Utils.showToast(result.message || '小说已保存到离线阅读库', 'success');
        } else {
            icon.textContent = '📥';
            btn.title = '离线下载';
            const errorMsg = result ? result.message : '下载失败，请稍后重试';
            Utils.showToast(errorMsg, 'warning');
        }
    } catch (error) {
        console.error('离线下载过程中发生错误:', error);
        icon.textContent = '📥';
        btn.title = '离线下载';
        Utils.showToast(`下载失败: ${error.message}`, 'error');
    } finally {
        btn.disabled = false;
    }
}

/**
 * 更新所有离线按钮状态
 */
async function updateAllOfflineButtonStates() {
    if (!offlineManager) return;

    const offlineButtons = document.querySelectorAll('.offline-btn');

    for (const btn of offlineButtons) {
        const novelId = parseInt(btn.dataset.novelId);
        const icon = btn.querySelector('.offline-icon');

        try {
            const isAvailable = await offlineManager.isNovelAvailableOffline(novelId);
            if (isAvailable) {
                icon.textContent = '✅';
                btn.classList.add('offline-downloaded');
                btn.title = '已离线保存，点击删除';
            } else {
                icon.textContent = '📥';
                btn.classList.remove('offline-downloaded');
                btn.title = '离线下载';
            }
        } catch (error) {
            console.error('检查离线状态失败:', error);
        }
    }
}

// =============== 会员中心相关函数 ===============

/**
 * 显示会员中心
 */
function showMembershipCenter() {
    if (!userManager || !userManager.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    
    showMembershipModal();
}

/**
 * 显示会员中心模态框
 */
function showMembershipModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold">会员中心</h3>
                <button onclick="closeMembershipModal()" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <div id="membershipContent" class="text-center">
                <div class="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                <p class="mt-2 text-gray-600">加载中...</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.id = 'membershipModal';
    
    // 加载会员信息
    loadMembershipModalContent();
}

/**
 * 关闭会员中心模态框
 */
function closeMembershipModal() {
    const modal = document.getElementById('membershipModal');
    if (modal) {
        modal.remove();
    }
}

/**
 * 加载会员信息内容
 */
async function loadMembershipModalContent() {
    try {
        const membership = userManager.getMembershipStatus();
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
                        <span class="text-lg font-medium">${userManager.getMembershipDisplayName()}</span>
                        ${userManager.getMembershipBadge()}
                    </div>
                    <p class="text-sm text-gray-500">到期时间：${endDate}</p>
                </div>
            `;
        }
        
        let plansHtml = '';
        if (plansResult.success) {
            plansHtml = Object.entries(plansResult.data).map(([type, plan]) => `
                <div class="border rounded-lg p-4 mb-3">
                    <h4 class="font-medium mb-2">${plan.name}</h4>
                    <p class="text-sm text-gray-600 mb-3">${plan.description}</p>
                    <div class="flex justify-between items-center">
                        <span class="text-lg font-bold text-blue-600">¥${plan.prices[0].price}/月</span>
                        <button onclick="upgradeMembership('${type}')" 
                                class="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors">
                            ${membership.type === type ? '续费' : '开通'}
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        content.innerHTML = `
            ${statusHtml}
            <div class="space-y-3">
                <h4 class="font-medium text-left">会员套餐</h4>
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
 * 升级会员
 */
async function upgradeMembership(membershipType) {
    try {
        const response = await fetch('/api/membership/upgrade', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userManager.token}`
            },
            body: JSON.stringify({
                membershipType: membershipType,
                duration: 1, // 默认1个月
                paymentMethod: 'demo' // 演示模式
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(result.message);
            await userManager.loadMembershipInfo();
            userManager.updateUI();
            closeMembershipModal();
            // 刷新小说列表以更新权限状态
            await loadNovels();
        } else {
            alert(result.message || '开通失败');
        }
    } catch (error) {
        console.error('开通会员失败:', error);
        alert('开通失败，请稍后重试');
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
window.userManager = userManager;
window.themeManager = themeManager;
window.searchManager = searchManager;
window.waterfallInstance = waterfallInstance;
window.cardRenderer = cardRenderer;
window.offlineManager = offlineManager;

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
window.handleShare = handleShare;
window.handleOfflineDownload = handleOfflineDownload;
window.updateAllOfflineButtonStates = updateAllOfflineButtonStates;
window.handleImageLoaded = handleImageLoaded;
window.handleImageError = handleImageError;
window.showMembershipCenter = showMembershipCenter;
window.closeMembershipModal = closeMembershipModal;
window.upgradeMembership = upgradeMembership;
window.showLoading = showLoading;
window.showError = showError;
window.logout = logout;
window.showFavorites = showFavorites;
window.showReadHistory = showReadHistory;
window.toggleHamburgerMenu = toggleHamburgerMenu;
window.openHamburgerMenu = openHamburgerMenu;
window.closeHamburgerMenu = closeHamburgerMenu;

console.log('main.js 模块化重构完成');