// 全局变量
let novelsData = [];
let filteredNovels = [];
let currentTheme = 'light';
let userManager = null;

// 用户管理类
class UserManager {
    constructor() {
        this.user = null;
        this.token = localStorage.getItem('token');
        this.activityTracker = null;
        this.init();
    }

    async init() {
        if (this.token) {
            await this.validateToken();
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

    updateUI() {
        const headerHTML = this.isLoggedIn() ?
            this.getLoggedInHeaderHTML() :
            this.getGuestHeaderHTML();

        // 更新导航栏
        const existingNav = document.querySelector('.main-nav');
        if (existingNav) {
            existingNav.innerHTML = headerHTML;
            // 重新绑定搜索事件
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.addEventListener('input', debounce(handleSearch, 300));
            }

            // 重新绑定主题切换事件
            this.rebindThemeToggle();
        }
    }

    rebindThemeToggle() {
        // 更新主题图标
        updateThemeToggleIcons();
    }

    getLoggedInHeaderHTML() {
        const avatarSrc = this.user.avatar === 'default.png' ? 
            `data:image/svg+xml;base64,${btoa(`<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="16" fill="#667eea"/><text x="16" y="20" font-family="Arial" font-size="12" fill="white" text-anchor="middle">${this.user.username.charAt(0).toUpperCase()}</text></svg>`)}` :
            `/assets/uploads/${this.user.avatar}`;
            
        return `
            <div class="nav-left">
                <div class="logo">📚 小说乐园</div>
            </div>
            <div class="nav-center">
                <div class="search-box">
                    <input type="text" id="searchInput" placeholder="搜索小说..." class="search-input">
                    <button class="search-btn">🔍</button>
                </div>
            </div>
            <div class="nav-right">
                <div class="user-menu">
                    <div class="user-avatar" onclick="toggleUserDropdown()">
                        <img src="${avatarSrc}" alt="头像">
                        <span class="username">${this.user.username}</span>
                        <span class="dropdown-arrow">▼</span>
                    </div>
                    <div class="user-dropdown" id="userDropdown">
                        <a href="#" onclick="showUserProfile()">📝 个人资料</a>
                        <a href="#" onclick="showFavorites()">❤️ 我的收藏</a>
                        <a href="#" onclick="showReadHistory()">📖 阅读历史</a>
                        <div class="dropdown-divider"></div>
                        <a href="#" onclick="logout()">🚪 退出登录</a>
                    </div>
                </div>
                <button class="theme-toggle" id="themeToggleMobile">🌙</button>
            </div>
        `;
    }

    getGuestHeaderHTML() {
        return `
            <div class="nav-left">
                <div class="logo">📚 小说乐园</div>
            </div>
            <div class="nav-center">
                <div class="search-box">
                    <input type="text" id="searchInput" placeholder="搜索小说..." class="search-input">
                    <button class="search-btn">🔍</button>
                </div>
            </div>
            <div class="nav-right">
                <a href="login.html" class="login-btn">登录</a>
                <button class="theme-toggle" id="themeToggleGuest">🌙</button>
            </div>
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
            showToast('已退出登录', 'success');
        }
    }

    isLoggedIn() {
        return !!this.token && !!this.user;
    }

    // 初始化活动追踪
    initActivityTracking() {
        if (!this.isLoggedIn()) return;

        // 创建活动追踪器实例
        this.activityTracker = new ActivityTracker(this.token);
        
        // 立即标记用户为在线
        this.activityTracker.updateActivity();
    }

    // 清理活动追踪
    cleanupActivityTracking() {
        if (this.activityTracker) {
            this.activityTracker.destroy();
            this.activityTracker = null;
        }
    }
}

// 用户交互函数
function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('show');
}

function showUserProfile() {
    showToast('用户资料功能开发中...', 'info');
    toggleUserDropdown();
}

function showFavorites() {
    showToast('收藏功能开发中...', 'info');
    toggleUserDropdown();
}

function showReadHistory() {
    showToast('阅读历史功能开发中...', 'info');
    toggleUserDropdown();
}

async function logout() {
    if (userManager) {
        await userManager.logout();
    }
    toggleUserDropdown();
}

// 点击外部关闭下拉菜单
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('userDropdown');
    const userAvatar = document.querySelector('.user-avatar');
    
    if (dropdown && userAvatar && !userAvatar.contains(event.target)) {
        dropdown.classList.remove('show');
    }
});

/**
 * 高性能瀑布流布局管理器
 * 实现完美贴合、自然流动、视觉平衡的瀑布流布局
 */
class WaterfallLayout {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            gap: 16,
            minColumnWidth: 280,
            maxColumns: 4,
            padding: 20,
            animationDuration: 300,
            debounceDelay: 150,
            ...options
        };

        this.columns = 2;
        this.columnWidth = 0;
        this.columnHeights = [];
        this.items = [];
        this.isLayouting = false;
        this.resizeObserver = null;
        this.imageLoadPromises = new Map();

        this.init();
    }

    init() {
        this.setupContainer();
        this.setupResizeObserver();
        this.bindEvents();
        this.setupVirtualScrolling();
    }

    setupContainer() {
        if (!this.container) return;

        this.container.style.position = 'relative';
        this.container.style.width = '100%';
        this.container.style.minHeight = '200px';
    }

    setupResizeObserver() {
        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(
                this.debounce(() => this.handleResize(), this.options.debounceDelay)
            );
            this.resizeObserver.observe(this.container);
        }
    }

    bindEvents() {
        // 窗口大小改变时重新布局
        window.addEventListener('resize',
            this.debounce(() => this.handleResize(), this.options.debounceDelay)
        );

        // 监听图片加载完成
        this.container.addEventListener('load', (e) => {
            if (e.target.tagName === 'IMG') {
                this.handleImageLoad(e.target);
            }
        }, true);
    }

    /**
     * 计算最优列数和列宽
     */
    calculateLayout() {
        const containerWidth = this.container.offsetWidth - (this.options.padding * 2);

        // 根据容器宽度和最小列宽计算最大可能列数
        const maxPossibleColumns = Math.floor(
            (containerWidth + this.options.gap) / (this.options.minColumnWidth + this.options.gap)
        );

        // 强制使用最大列数设置，如果容器足够宽
        if (containerWidth >= this.options.maxColumns * this.options.minColumnWidth) {
            this.columns = this.options.maxColumns;
        } else {
            // 否则使用计算出的最大可能列数，但不超过maxColumns
            this.columns = Math.min(maxPossibleColumns, this.options.maxColumns);
        }
        
        this.columns = Math.max(this.columns, 1); // 至少1列

        // 计算实际列宽
        this.columnWidth = (containerWidth - (this.columns - 1) * this.options.gap) / this.columns;

        // 初始化列高度数组
        this.columnHeights = new Array(this.columns).fill(0);
    }

    /**
     * 获取最短列的索引
     */
    getShortestColumnIndex() {
        let minHeight = Math.min(...this.columnHeights);
        return this.columnHeights.indexOf(minHeight);
    }

    /**
     * 智能选择列 - 考虑视觉平衡
     */
    getOptimalColumnIndex() {
        if (this.columns === 1) return 0;

        const minHeight = Math.min(...this.columnHeights);
        const maxHeight = Math.max(...this.columnHeights);

        // 如果高度差异很小，选择最短列
        if (maxHeight - minHeight < 100) {
            return this.getShortestColumnIndex();
        }

        // 否则优先选择最短列，但考虑相邻列的平衡
        const shortestIndex = this.getShortestColumnIndex();
        const candidates = [shortestIndex];

        // 查找高度相近的列
        this.columnHeights.forEach((height, index) => {
            if (Math.abs(height - minHeight) < 50 && index !== shortestIndex) {
                candidates.push(index);
            }
        });

        // 从候选列中选择最能保持平衡的列
        if (candidates.length > 1) {
            return candidates[Math.floor(Math.random() * candidates.length)];
        }

        return shortestIndex;
    }

    /**
     * 布局单个卡片
     */
    layoutItem(item, index) {
        if (!item) return;

        // 确保卡片是绝对定位
        item.style.position = 'absolute';
        item.style.width = `${this.columnWidth}px`;
        
        // 获取最优列
        const columnIndex = this.getOptimalColumnIndex();

        // 计算位置，考虑容器padding
        const left = this.options.padding + columnIndex * (this.columnWidth + this.options.gap);
        const top = this.columnHeights[columnIndex];

        // 设置位置
        item.style.left = `${left}px`;
        item.style.top = `${top}px`;
        item.style.transition = `all ${this.options.animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;

        // 强制重排以获取准确高度
        item.offsetHeight;
        
        // 更新列高度
        const itemHeight = item.offsetHeight;
        this.columnHeights[columnIndex] += itemHeight + this.options.gap;
    }

    /**
     * 更新容器高度
     */
    updateContainerHeight() {
        const maxHeight = Math.max(...this.columnHeights);
        this.container.style.height = `${maxHeight}px`;
    }

    /**
     * 执行完整布局
     */
    async layout() {
        if (this.isLayouting) return;
        this.isLayouting = true;

        try {
            // 获取所有卡片
            this.items = Array.from(this.container.querySelectorAll('.novel-card'));

            if (this.items.length === 0) {
                this.isLayouting = false;
                return;
            }

            // 计算布局参数
            this.calculateLayout();

            // 先设置所有卡片为静态定位以获取自然高度
            this.items.forEach(item => {
                item.style.position = 'static';
                item.style.width = `${this.columnWidth}px`;
                item.style.left = 'auto';
                item.style.top = 'auto';
            });

            // 等待一帧确保样式应用
            await this.nextFrame();

            // 重新初始化列高度
            this.columnHeights = new Array(this.columns).fill(0);

            // 布局所有卡片
            this.items.forEach((item, index) => {
                this.layoutItem(item, index);
            });

            // 更新容器高度
            this.updateContainerHeight();

        } catch (error) {
            console.error('瀑布流布局失败:', error);
        } finally {
            this.isLayouting = false;
        }
    }

    /**
     * 等待图片加载完成
     */
    async waitForImages() {
        const images = this.container.querySelectorAll('img');
        const promises = Array.from(images).map(img => {
            if (img.complete) return Promise.resolve();

            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('图片加载超时'));
                }, 5000);

                img.onload = () => {
                    clearTimeout(timeout);
                    resolve();
                };

                img.onerror = () => {
                    clearTimeout(timeout);
                    resolve(); // 即使加载失败也继续布局
                };
            });
        });

        try {
            await Promise.allSettled(promises);
        } catch (error) {
            console.warn('部分图片加载失败:', error);
        }
    }

    /**
     * 处理图片加载完成
     */
    handleImageLoad() {
        // 图片加载完成后重新布局
        this.debounce(() => this.layout(), 100)();
    }

    /**
     * 处理窗口大小改变
     */
    handleResize() {
        this.layout();
    }

    /**
     * 添加新卡片
     */
    addItems(newItems) {
        if (!Array.isArray(newItems)) {
            newItems = [newItems];
        }

        newItems.forEach(item => {
            this.container.appendChild(item);
        });

        this.layout();
    }

    /**
     * 清空并重新布局
     */
    refresh() {
        this.columnHeights = new Array(this.columns).fill(0);
        this.layout();
    }

    /**
     * 销毁实例
     */
    destroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }

        window.removeEventListener('resize', this.handleResize);
        this.container.removeEventListener('load', this.handleImageLoad);
    }

    /**
     * 性能优化：虚拟滚动检测
     */
    setupVirtualScrolling() {
        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.updateVisibleItems();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
    }

    /**
     * 更新可见卡片
     */
    updateVisibleItems() {
        if (!this.items.length) return;

        const scrollTop = window.pageYOffset;
        const windowHeight = window.innerHeight;
        const viewportTop = scrollTop - windowHeight; // 预加载区域
        const viewportBottom = scrollTop + windowHeight * 2; // 预加载区域

        this.items.forEach(item => {
            const rect = item.getBoundingClientRect();
            const itemTop = rect.top + scrollTop;
            const itemBottom = itemTop + rect.height;

            const isVisible = itemBottom >= viewportTop && itemTop <= viewportBottom;

            if (isVisible && !item.classList.contains('visible')) {
                item.classList.add('visible');
                this.animateItemIn(item);
            } else if (!isVisible && item.classList.contains('visible')) {
                item.classList.remove('visible');
            }
        });
    }

    /**
     * 卡片进入动画
     */
    animateItemIn(item) {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px) scale(0.95)';

        requestAnimationFrame(() => {
            item.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0) scale(1)';
        });
    }

    /**
     * 性能优化：节流函数
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * 工具方法：防抖
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * 工具方法：等待下一帧
     */
    nextFrame() {
        return new Promise(resolve => requestAnimationFrame(resolve));
    }

    /**
     * 性能监控
     */
    measurePerformance(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        console.log(`${name} 耗时: ${(end - start).toFixed(2)}ms`);
        return result;
    }
}

// 全局瀑布流实例
let waterfallInstance = null;

// 将WaterfallLayout类暴露到全局作用域
window.WaterfallLayout = WaterfallLayout;

// 初始化瀑布流布局
function initMasonryLayout() {
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
        // 超大屏幕：4列
        config = { ...config, gap: 24, minColumnWidth: 240, maxColumns: 4, padding: 24 };
    } else if (screenWidth >= 1200) {
        // 大屏幕（桌面）：4列
        config = { ...config, gap: 20, minColumnWidth: 220, maxColumns: 4, padding: 20 };
    } else if (screenWidth >= 1024) {
        // 中等屏幕（平板横屏）：3列
        config = { ...config, gap: 18, minColumnWidth: 240, maxColumns: 3, padding: 18 };
    } else if (screenWidth >= 768) {
        // 中屏幕（平板竖屏）：3列
        config = { ...config, gap: 16, minColumnWidth: 220, maxColumns: 3, padding: 16 };
    } else if (screenWidth >= 640) {
        // 小屏幕（大手机）：2列
        config = { ...config, gap: 14, minColumnWidth: 180, maxColumns: 2, padding: 14 };
    } else {
        // 移动端（小手机）：2列
        config = { ...config, gap: 12, minColumnWidth: 150, maxColumns: 2, padding: 12 };
    }

    waterfallInstance = new WaterfallLayout(container, config);

    // 执行布局
    waterfallInstance.layout();
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成，开始初始化...');
    
    // 初始化主题
    initTheme();
    
    // 初始化用户管理
    userManager = new UserManager();

    // 加载数据和初始化事件监听
    loadNovelsData();
    initEventListeners();

    // 初始化瀑布流布局
    setTimeout(() => {
        initMasonryLayout();
        
        // 确保移动端按钮在所有内容加载后正确初始化
        const mobileSearchBtn = document.getElementById('mobileSearchBtn');
        const mobileSearchBar = document.getElementById('mobileSearchBar');
        const themeToggle = document.getElementById('themeToggle');

        // 确保移动端搜索栏初始状态正确
        if (mobileSearchBar) {
            mobileSearchBar.classList.add('hidden');
            mobileSearchBar.classList.remove('show');
            console.log('移动端搜索栏初始状态已设置为隐藏');
        }

        if (mobileSearchBtn) {
            mobileSearchBtn.setAttribute('data-search-bound', 'false');
            bindMobileSearchEvents();
        }

        if (themeToggle) {
            themeToggle.setAttribute('data-theme-bound', 'false');
            bindThemeToggleEvents();
        }
        
        console.log('所有组件初始化完成');

        console.log('移动端搜索功能已初始化');
    }, 300);
});

// 加载小说数据
async function loadNovelsData() {
    if (!checkNetworkStatus()) {
        showLoading(false);
        return;
    }

    try {
        showLoading(true);

        const loadData = async () => {
            const response = await fetch('/api/novels');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        };

        const data = await retryOperation(loadData);

        if (!data || !data.novels || !Array.isArray(data.novels)) {
            throw new Error('数据格式错误');
        }

        novelsData = data.novels;
        filteredNovels = [...novelsData];
        renderNovels();
        showLoading(false);

        if (novelsData.length === 0) {
            showError('暂无小说数据，请稍后再试');
        } else {
            showToast(`成功加载 ${novelsData.length} 部小说`);
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

// 渲染小说
function renderNovels() {
    const container = document.querySelector('.waterfall-container');
    if (!container) return;

    // 清空容器
    container.innerHTML = '';
    
    // 渲染过滤后的小说
    filteredNovels.forEach(novel => {
        container.appendChild(createNovelCard(novel));
    });

    // 渲染完成后重新布局瀑布流 - 延长等待时间以确保计算正确
    requestAnimationFrame(() => {
        setTimeout(() => {
            if (waterfallInstance) {
                waterfallInstance.refresh();
            } else {
                initMasonryLayout();
            }
            // 额外再延迟一次布局刷新，确保卡片高度计算正确
            setTimeout(() => {
                if (waterfallInstance) {
                    waterfallInstance.refresh();
                }
            }, 300);
        }, 100);
    });
}

// 创建小说卡片
function createNovelCard(novel) {
    const card = document.createElement('div');
    card.className = 'novel-card bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer transform hover:-translate-y-1';
    card.onclick = () => openNovel(novel.id);

    // 生成封面
    const coverHtml = generateCover(novel);

    // 检测是否为移动端
    const isMobile = window.innerWidth <= 768;

    // 格式化时间
    const timeAgo = getTimeAgo(novel.publishTime);

    if (isMobile) {
        // 移动端简化版卡片 - 只显示核心信息
        card.innerHTML = `
            ${coverHtml}
            <div class="card-content">
                <h3>${novel.title}</h3>
                <div class="card-tags mb-2">
                    <span class="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full mr-1">${novel.tags[0] || ''}</span>
                </div>
                <div class="card-footer">
                    <div class="card-stats">
                        <span class="flex items-center">
                            <span class="mr-2">📅</span>
                            <span>${timeAgo}</span>
                        </span>
                        <span class="flex items-center">
                            <span class="mr-1">❤️</span>
                            <span>${formatViews(novel.likes || 0)}</span>
                        </span>
                    </div>
                    <div class="card-actions">
                        <button class="like-btn text-gray-400 hover:text-red-500 transition-colors duration-200"
                                data-novel-id="${novel.id}"
                                onclick="handleLike(event, ${novel.id})">
                            <span class="like-icon">🤍</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    } else {
        // 桌面端完整版卡片
        const tagsHtml = novel.tags.map(tag =>
            `<span class="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full mr-1 mb-1">${tag}</span>`
        ).join('');

        card.innerHTML = `
            ${coverHtml}
            <div class="card-content">
                <h3>${novel.title}</h3>
                <div class="card-tags mb-3">
                    ${tagsHtml}
                </div>
                <div class="card-extra-info flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span class="flex items-center">
                        <span class="mr-3">👁 ${formatViews(novel.views)}</span>
                        <span>📅 ${timeAgo}</span>
                    </span>
                </div>
                <div class="flex items-center justify-between border-t pt-2 mt-2">
                    <div class="flex items-center space-x-3">
                        <button class="like-btn flex items-center space-x-1 text-xs text-gray-500 hover:text-red-500 transition-colors duration-200"
                                data-novel-id="${novel.id}"
                                onclick="handleLike(event, ${novel.id})">
                            <span class="like-icon">🤍</span>
                            <span class="like-count">${formatViews(novel.likes || 0)}</span>
                        </button>
                        <button class="favorite-btn flex items-center space-x-1 text-xs text-gray-500 hover:text-yellow-500 transition-colors duration-200"
                                data-novel-id="${novel.id}"
                                onclick="handleFavorite(event, ${novel.id})">
                            <span class="favorite-icon">☆</span>
                            <span class="favorite-count">${formatViews(novel.favorites || 0)}</span>
                        </button>
                    </div>
                    <button class="text-xs text-xhs-red hover:text-red-600 font-medium"
                            onclick="openNovel(${novel.id})">
                        阅读全文 →
                    </button>
                </div>
            </div>
        `;
    }

    return card;
}

// 生成封面 - 支持懒加载
function generateCover(novel) {
    if (novel.coverType === 'text') {
        // 处理coverData可能是字符串或对象的情况
        let coverData = novel.coverData;
        if (typeof coverData === 'string') {
            try {
                coverData = JSON.parse(coverData);
            } catch (e) {
                coverData = { backgroundColor: '#FFE4E1', textColor: '#8B4513' };
            }
        }

        const backgroundColor = coverData?.backgroundColor || '#FFE4E1';
        const textColor = coverData?.textColor || '#8B4513';

        // 随机选择高度比例
        const heightClasses = ['square', 'medium', 'tall'];
        const randomHeight = heightClasses[Math.floor(Math.random() * heightClasses.length)];

        return `
            <div class="novel-cover text-cover ${randomHeight}"
                 style="background-color: ${backgroundColor}; color: ${textColor};">
                <h2>${novel.title}</h2>
            </div>
        `;
    } else if (novel.coverType === 'image' && novel.coverData) {
        // 随机选择高度比例
        const heightClasses = ['square', 'medium', 'tall'];
        const randomHeight = heightClasses[Math.floor(Math.random() * heightClasses.length)];

        return `
            <div class="novel-cover ${randomHeight}">
                <img src="${novel.coverData}"
                     alt="${novel.title}"
                     class="w-full h-full object-cover lazy-image"
                     loading="lazy"
                     onload="handleImageLoaded(this)"
                     onerror="handleImageError(this)">
            </div>
        `;
    } else {
        return `
            <div class="novel-cover bg-gray-200 flex items-center justify-center square">
                <span class="text-gray-500">暂无封面</span>
            </div>
        `;
    }
}

// 处理图片加载完成
function handleImageLoaded(img) {
    // 添加加载完成的类
    img.classList.add('loaded');

    // 触发瀑布流重新布局
    if (waterfallInstance) {
        // 使用防抖避免频繁重布局
        clearTimeout(window.imageLoadTimeout);
        window.imageLoadTimeout = setTimeout(() => {
            waterfallInstance.layout();
        }, 100);
    }
}

// 处理图片加载失败
function handleImageError(img) {
    // 替换为默认封面
    const parent = img.parentElement;
    if (parent) {
        parent.innerHTML = `
            <div class="w-full h-full bg-gray-200 flex items-center justify-center">
                <span class="text-gray-500 text-sm">图片加载失败</span>
            </div>
        `;
    }

    // 触发重新布局
    if (waterfallInstance) {
        setTimeout(() => {
            waterfallInstance.layout();
        }, 50);
    }
}

// 格式化阅读量
function formatViews(views) {
    if (views >= 10000) {
        return Math.floor(views / 1000) / 10 + 'w';
    } else if (views >= 1000) {
        return Math.floor(views / 100) / 10 + 'k';
    }
    return views.toString();
}

// 计算时间差
function getTimeAgo(publishTime) {
    const now = new Date();
    const publish = new Date(publishTime);
    const diffTime = Math.abs(now - publish);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1天前';
    if (diffDays < 7) return `${diffDays}天前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`;
    return `${Math.floor(diffDays / 365)}年前`;
}

// 初始化事件监听器
function initEventListeners() {
    // 标签筛选
    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', function() {
            handleTagFilter(this);
        });
    });

    // 搜索功能
    bindSearchEvents();

    // 主题切换
    bindThemeToggleEvents();

    // 汉堡菜单切换
    bindHamburgerMenuEvents();

    // 移动端搜索切换
    bindMobileSearchEvents();
    
    // 为移动设备优化点击事件
    optimizeForMobileDevices();
    
    // 初始化页面后立即检查并更新主题图标
    updateThemeToggleIcons();
    
    console.log('所有事件监听器初始化完成');
}

// 为移动设备优化点击事件
function optimizeForMobileDevices() {
    // 检测是否为移动设备
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobileDevice) {
        console.log('检测到移动设备，优化触摸事件');
        
        // 优化主题切换按钮的点击区域
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.style.padding = '12px'; // 增大点击区域
        }
        
        // 优化移动端搜索按钮的点击区域
        const mobileSearchBtn = document.getElementById('mobileSearchBtn');
        if (mobileSearchBtn) {
            mobileSearchBtn.style.padding = '12px'; // 增大点击区域
        }
    }
}

// 绑定搜索事件
function bindSearchEvents() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
}

// 绑定主题切换事件
function bindThemeToggleEvents() {
    // 绑定所有主题切换按钮的事件
    function bindThemeToggle() {
        // 绑定桌面端主题切换按钮
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle && !themeToggle.hasAttribute('data-theme-bound')) {
            themeToggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                toggleTheme();
                console.log('桌面端主题切换成功');
            });
            themeToggle.setAttribute('data-theme-bound', 'true');
            console.log('桌面端主题切换按钮事件已绑定');
        }

        // 绑定移动端登录用户主题切换按钮
        const themeToggleMobile = document.getElementById('themeToggleMobile');
        if (themeToggleMobile && !themeToggleMobile.hasAttribute('data-theme-bound')) {
            themeToggleMobile.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                toggleTheme();
                console.log('移动端登录用户主题切换成功');
            });
            themeToggleMobile.setAttribute('data-theme-bound', 'true');
            console.log('移动端登录用户主题切换按钮事件已绑定');
        }

        // 绑定移动端游客主题切换按钮
        const themeToggleGuest = document.getElementById('themeToggleGuest');
        if (themeToggleGuest && !themeToggleGuest.hasAttribute('data-theme-bound')) {
            themeToggleGuest.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                toggleTheme();
                console.log('移动端游客主题切换成功');
            });
            themeToggleGuest.setAttribute('data-theme-bound', 'true');
            console.log('移动端游客主题切换按钮事件已绑定');
        }
    }

    // 立即尝试绑定
    bindThemeToggle();

    // 使用MutationObserver监听DOM变化，重新绑定事件
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                bindThemeToggle();
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // 确保页面加载完成后再次尝试绑定，防止DOM未完全加载
    setTimeout(bindThemeToggle, 500);
}

// 绑定汉堡菜单事件
function bindHamburgerMenuEvents() {
    // 使用事件委托
    document.addEventListener('click', function(e) {
        if (e.target && (e.target.id === 'hamburgerBtn' || e.target.closest('#hamburgerBtn'))) {
            e.preventDefault();
            e.stopPropagation();
            toggleHamburgerMenu();
            return;
        }

        // 点击其他地方关闭菜单
        const hamburgerMenu = document.getElementById('hamburgerMenu');
        const hamburgerBtn = document.getElementById('hamburgerBtn');
        if (hamburgerMenu && hamburgerBtn) {
            if (!hamburgerBtn.contains(e.target) && !hamburgerMenu.contains(e.target)) {
                closeHamburgerMenu();
            }
        }
    });
}

// 绑定移动端搜索事件
function bindMobileSearchEvents() {
    // 使用事件委托的方式绑定移动端搜索按钮事件
    document.addEventListener('click', function(e) {
        if (e.target && (e.target.id === 'mobileSearchBtn' || e.target.closest('#mobileSearchBtn'))) {
            e.preventDefault();
            e.stopPropagation();
            console.log('移动端搜索按钮被点击（事件委托）');
            toggleMobileSearch();
            return;
        }
    });

    // 直接绑定移动端搜索按钮事件（备用方案）
    function bindMobileSearchBtn() {
        const mobileSearchBtn = document.getElementById('mobileSearchBtn');
        if (mobileSearchBtn && !mobileSearchBtn.hasAttribute('data-search-bound')) {
            // 添加点击事件监听器
            mobileSearchBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('移动端搜索按钮被点击（直接绑定）');
                toggleMobileSearch();
            });

            // 添加触摸事件支持
            mobileSearchBtn.addEventListener('touchstart', function(e) {
                e.preventDefault();
                console.log('移动端搜索按钮触摸开始');
            });

            mobileSearchBtn.addEventListener('touchend', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('移动端搜索按钮触摸结束');
                toggleMobileSearch();
            });

            mobileSearchBtn.setAttribute('data-search-bound', 'true');
            console.log('移动端搜索按钮事件已绑定（直接绑定）');
        } else if (!mobileSearchBtn) {
            console.warn('找不到移动端搜索按钮元素');
        }
    }

    // 直接绑定移动端搜索输入事件
    function bindMobileSearchInput() {
        const mobileSearchInput = document.getElementById('mobileSearchInput');
        if (mobileSearchInput && !mobileSearchInput.hasAttribute('data-input-bound')) {
            // 绑定搜索输入事件
            mobileSearchInput.addEventListener('input', debounce(handleSearch, 300));

            // 绑定回车键搜索
            mobileSearchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch(e);
                }
            });

            mobileSearchInput.setAttribute('data-input-bound', 'true');
            console.log('移动端搜索输入事件已绑定');
        } else if (!mobileSearchInput) {
            console.warn('找不到移动端搜索输入框元素');
        }
    }

    // 立即尝试绑定
    bindMobileSearchBtn();
    bindMobileSearchInput();

    // 调试信息：检查元素是否存在
    setTimeout(() => {
        const mobileSearchBtn = document.getElementById('mobileSearchBtn');
        const mobileSearchBar = document.getElementById('mobileSearchBar');
        const mobileSearchInput = document.getElementById('mobileSearchInput');

        console.log('移动端搜索元素检查:');
        console.log('- 当前屏幕宽度:', window.innerWidth);
        console.log('- 是否为移动端:', window.innerWidth <= 768);
        console.log('- 搜索按钮:', mobileSearchBtn ? '存在' : '不存在');
        console.log('- 搜索栏:', mobileSearchBar ? '存在' : '不存在');
        console.log('- 搜索输入框:', mobileSearchInput ? '存在' : '不存在');

        if (mobileSearchBtn) {
            const btnStyle = window.getComputedStyle(mobileSearchBtn);
            console.log('- 搜索按钮显示状态:', btnStyle.display);
            console.log('- 搜索按钮可见性:', btnStyle.visibility);
        }

        if (mobileSearchBar) {
            console.log('- 搜索栏当前类:', mobileSearchBar.className);
            const barStyle = window.getComputedStyle(mobileSearchBar);
            console.log('- 搜索栏显示状态:', barStyle.display);
        }
    }, 1000);

    // 使用MutationObserver监听DOM变化
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                bindMobileSearchBtn();
                bindMobileSearchInput();
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // 窗口大小变化时重新渲染卡片和布局
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // 重新渲染卡片以适应移动端/桌面端切换
            renderNovels();
        }, 250);
    });

    // 初始化标签滚动触摸支持
    initTagScrollTouch();
}

// 初始化标签滚动的触摸支持
function initTagScrollTouch() {
    const tagScrollContainer = document.querySelector('.tag-scroll-container');
    if (!tagScrollContainer) return;

    let isScrolling = false;
    let startX = 0;
    let scrollLeft = 0;

    // 鼠标/触摸开始
    tagScrollContainer.addEventListener('mousedown', startScroll);
    tagScrollContainer.addEventListener('touchstart', startScroll, { passive: true });

    // 鼠标/触摸移动
    tagScrollContainer.addEventListener('mousemove', duringScroll);
    tagScrollContainer.addEventListener('touchmove', duringScroll, { passive: true });

    // 鼠标/触摸结束
    tagScrollContainer.addEventListener('mouseup', endScroll);
    tagScrollContainer.addEventListener('touchend', endScroll);
    tagScrollContainer.addEventListener('mouseleave', endScroll);

    function startScroll(e) {
        isScrolling = true;
        tagScrollContainer.style.cursor = 'grabbing';
        startX = (e.type === 'mousedown' ? e.pageX : e.touches[0].pageX) - tagScrollContainer.offsetLeft;
        scrollLeft = tagScrollContainer.scrollLeft;
    }

    function duringScroll(e) {
        if (!isScrolling) return;
        e.preventDefault();
        const x = (e.type === 'mousemove' ? e.pageX : e.touches[0].pageX) - tagScrollContainer.offsetLeft;
        const walk = (x - startX) * 2; // 滚动速度
        tagScrollContainer.scrollLeft = scrollLeft - walk;
    }

    function endScroll() {
        isScrolling = false;
        tagScrollContainer.style.cursor = 'grab';
    }
}

// 处理标签筛选
function handleTagFilter(tagElement) {
    // 重置所有标签样式
    document.querySelectorAll('.tag').forEach(t => {
        t.className = 'tag px-4 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-beige cursor-pointer whitespace-nowrap';
    });

    // 激活当前标签
    tagElement.className = 'tag px-4 py-2 rounded-full bg-xhs-red text-white cursor-pointer whitespace-nowrap';

    const selectedTag = tagElement.dataset.tag;

    if (selectedTag === 'all') {
        filteredNovels = [...novelsData];
    } else {
        filteredNovels = novelsData.filter(novel =>
            novel.tags.some(tag => tag.includes(selectedTag))
        );
    }

    renderNovels();

    // 显示筛选结果反馈
    const tagText = selectedTag === 'all' ? '全部' : selectedTag;
    if (filteredNovels.length === 0) {
        showToast(`没有找到"${tagText}"相关的小说`, 'error');
    } else if (selectedTag !== 'all') {
        showToast(`找到 ${filteredNovels.length} 部"${tagText}"小说`);
    }
}

// 处理搜索
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();

    if (!searchTerm) {
        filteredNovels = [...novelsData];
        // 重置标签选择
        document.querySelectorAll('.tag').forEach(t => {
            t.className = 'tag px-4 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-beige cursor-pointer whitespace-nowrap';
        });
        document.querySelector('.tag[data-tag="all"]').className = 'tag px-4 py-2 rounded-full bg-xhs-red text-white cursor-pointer whitespace-nowrap';
    } else {
        filteredNovels = novelsData.filter(novel =>
            novel.title.toLowerCase().includes(searchTerm) ||
            novel.summary.toLowerCase().includes(searchTerm) ||
            novel.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );

        // 搜索时重置标签选择
        document.querySelectorAll('.tag').forEach(t => {
            t.className = 'tag px-4 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-beige cursor-pointer whitespace-nowrap';
        });
    }

    renderNovels();

    // 显示搜索结果反馈
    if (searchTerm && filteredNovels.length === 0) {
        showToast(`没有找到包含"${searchTerm}"的小说`, 'error');
    } else if (searchTerm && filteredNovels.length > 0) {
        showToast(`找到 ${filteredNovels.length} 部相关小说`);
    }
}

// 防抖函数
function debounce(func, wait) {
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

// 主题切换
function toggleTheme() {
    const body = document.body;

    if (currentTheme === 'light') {
        body.classList.add('dark-theme');
        currentTheme = 'dark';
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.remove('dark-theme');
        currentTheme = 'light';
        localStorage.setItem('theme', 'light');
    }

    // 更新所有主题切换按钮的图标
    updateThemeToggleIcons();
    
    // 输出日志，方便调试
    console.log('主题切换为:', currentTheme);
}

// 更新主题切换按钮图标
function updateThemeToggleIcons() {
    const icon = currentTheme === 'dark' ? '☀️' : '🌙';

    // 更新桌面端主题切换按钮
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.textContent = icon;
        console.log('更新桌面端主题图标');
    }

    // 更新移动端登录用户主题切换按钮
    const themeToggleMobile = document.getElementById('themeToggleMobile');
    if (themeToggleMobile) {
        themeToggleMobile.textContent = icon;
        console.log('更新移动端登录用户主题图标');
    }

    // 更新移动端游客主题切换按钮
    const themeToggleGuest = document.getElementById('themeToggleGuest');
    if (themeToggleGuest) {
        themeToggleGuest.textContent = icon;
        console.log('更新移动端游客主题图标');
    }

    // 通用选择器作为备用
    const allThemeToggles = document.querySelectorAll('.theme-toggle');
    allThemeToggles.forEach(toggle => {
        if (toggle && !toggle.id) { // 只更新没有特定ID的按钮
            toggle.textContent = icon;
            console.log('更新通用主题切换按钮图标');
        }
    });
}

// 初始化主题
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        currentTheme = 'dark';
    } else {
        currentTheme = 'light';
    }

    // 确保主题图标正确显示
    updateThemeToggleIcons();
}

// 切换汉堡菜单
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

// 打开汉堡菜单
function openHamburgerMenu() {
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const hamburgerIcon = document.getElementById('hamburgerIcon');

    if (hamburgerMenu && hamburgerIcon) {
        hamburgerMenu.classList.add('show');
        hamburgerIcon.classList.add('open');
        // 防止页面滚动
        document.body.style.overflow = 'hidden';
    }
}

// 关闭汉堡菜单
function closeHamburgerMenu() {
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const hamburgerIcon = document.getElementById('hamburgerIcon');

    if (hamburgerMenu && hamburgerIcon) {
        hamburgerMenu.classList.remove('show');
        hamburgerIcon.classList.remove('open');
        // 恢复页面滚动
        document.body.style.overflow = '';
    }
}

// 切换移动端搜索
function toggleMobileSearch() {
    const mobileSearchBar = document.getElementById('mobileSearchBar');
    const mobileSearchInput = document.getElementById('mobileSearchInput');

    if (mobileSearchBar) {
        // 检查当前状态 - 默认是隐藏的
        const isCurrentlyHidden = mobileSearchBar.classList.contains('hidden');

        console.log('toggleMobileSearch 被调用，当前状态:', isCurrentlyHidden ? '隐藏' : '显示');

        if (isCurrentlyHidden) {
            // 显示搜索栏 - 使用滑动动画
            mobileSearchBar.classList.remove('hidden');
            mobileSearchBar.style.maxHeight = '0px';
            mobileSearchBar.style.overflow = 'hidden';
            mobileSearchBar.style.transition = 'max-height 0.3s ease-in-out';

            // 强制重绘
            mobileSearchBar.offsetHeight;

            // 设置最大高度以显示内容
            mobileSearchBar.style.maxHeight = '80px';

            console.log('移动端搜索栏已显示');
            // 自动聚焦到搜索框
            if (mobileSearchInput) {
                setTimeout(() => {
                    mobileSearchInput.focus();
                    console.log('移动端搜索框已聚焦');
                }, 300);
            }
        } else {
            // 隐藏搜索栏 - 使用滑动动画
            mobileSearchBar.style.maxHeight = '0px';

            setTimeout(() => {
                mobileSearchBar.classList.add('hidden');
                mobileSearchBar.style.maxHeight = '';
                mobileSearchBar.style.overflow = '';
                mobileSearchBar.style.transition = '';

                // 清空输入框
                if (mobileSearchInput) {
                    mobileSearchInput.value = '';
                }
            }, 300);
            console.log('移动端搜索栏已隐藏');
        }
    } else {
        console.error('找不到移动端搜索栏元素');
    }
}

// 处理点赞
async function handleLike(event, novelId) {
    event.stopPropagation(); // 阻止事件冒泡

    const btn = event.target.closest('.like-btn');
    const icon = btn.querySelector('.like-icon');
    const count = btn.querySelector('.like-count');

    // 获取当前点赞状态
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
            count.textContent = formatViews(result.data.likes);
            showToast(result.message, 'success');

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
            showToast(result.message, 'error');
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
        showToast('点赞操作失败，请稍后重试', 'error');
    }
}

// 处理收藏
async function handleFavorite(event, novelId) {
    event.stopPropagation(); // 阻止事件冒泡

    const btn = event.target.closest('.favorite-btn');
    const icon = btn.querySelector('.favorite-icon');
    const count = btn.querySelector('.favorite-count');

    // 获取当前收藏状态
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
            count.textContent = formatViews(result.data.favorites);
            showToast(result.message, 'success');

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
            showToast(result.message, 'error');
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
        showToast('收藏操作失败，请稍后重试', 'error');
    }
}

// 打开小说阅读
function openNovel(novelId) {
    // 增加阅读量
    const novel = novelsData.find(n => n.id === novelId);
    if (novel) {
        novel.views += 1;
    }

    // 跳转到阅读页面
    window.location.href = `read.html?id=${novelId}`;
}

// 显示/隐藏加载动画
function showLoading(show) {
    const loading = document.getElementById('loading');
    if (show) {
        loading.classList.remove('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

// 显示错误信息
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

// 显示成功提示
function showToast(message, type = 'success') {
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
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// 网络状态检测
function checkNetworkStatus() {
    if (!navigator.onLine) {
        showError('网络连接已断开，请检查网络设置后重试');
        return false;
    }
    return true;
}

// 重试机制
async function retryOperation(operation, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
    }
}

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

// 用户活动追踪类
class ActivityTracker {
    constructor(token) {
        this.token = token;
        this.updateInterval = null;
        this.lastActivity = Date.now();
        this.isPageVisible = true;
        
        this.init();
    }
    
    init() {
        // 监听用户活动事件
        this.bindActivityEvents();
        
        // 监听页面可见性变化
        this.bindVisibilityEvents();
        
        // 开始定期更新活动状态
        this.startActivityUpdates();
        
        // 页面关闭时清理
        this.bindUnloadEvents();
    }
    
    bindActivityEvents() {
        // 监听各种用户活动
        const events = [
            'mousedown', 'mousemove', 'keypress', 'scroll', 
            'touchstart', 'click', 'focus', 'blur'
        ];
        
        events.forEach(event => {
            document.addEventListener(event, () => {
                this.recordActivity();
            }, { passive: true });
        });
    }
    
    bindVisibilityEvents() {
        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => {
            this.isPageVisible = !document.hidden;
            
            if (this.isPageVisible) {
                // 页面变为可见时，立即更新活动状态
                this.recordActivity();
                this.updateActivity();
            }
        });
        
        // 监听窗口焦点变化
        window.addEventListener('focus', () => {
            this.isPageVisible = true;
            this.recordActivity();
            this.updateActivity();
        });
        
        window.addEventListener('blur', () => {
            this.isPageVisible = false;
        });
    }
    
    bindUnloadEvents() {
        // 页面关闭前发送离线状态
        window.addEventListener('beforeunload', () => {
            this.sendOfflineStatus();
        });
        
        // 页面隐藏时发送离线状态
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.sendOfflineStatus();
            }
        });
    }
    
    recordActivity() {
        this.lastActivity = Date.now();
    }
    
    startActivityUpdates() {
        // 每30秒更新一次活动状态
        this.updateInterval = setInterval(() => {
            if (this.shouldUpdateActivity()) {
                this.updateActivity();
            }
        }, 30000);
        
        // 立即发送一次在线状态
        this.updateActivity();
    }
    
    shouldUpdateActivity() {
        // 只有在页面可见且最近有活动时才更新
        const timeSinceLastActivity = Date.now() - this.lastActivity;
        return this.isPageVisible && timeSinceLastActivity < 60000; // 1分钟内有活动
    }
    
    async updateActivity() {
        if (!this.token) return;
        
        try {
            // 更新用户活动状态
            const response = await fetch('/api/auth/profile', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                // 请求成功，用户状态已更新
                console.log('活动状态已更新');
            }
        } catch (error) {
            console.error('更新活动状态失败:', error);
        }
    }
    
    sendOfflineStatus() {
        if (!this.token) return;
        
        // 使用sendBeacon发送离线状态，即使页面关闭也能发送
        const data = JSON.stringify({ status: 'offline' });
        
        if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/auth/logout', data);
        } else {
            // 备用方法：同步请求
            try {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', '/api/auth/logout', false);
                xhr.setRequestHeader('Authorization', `Bearer ${this.token}`);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.send(data);
            } catch (error) {
                console.error('发送离线状态失败:', error);
            }
        }
    }
    
    destroy() {
        // 清理定时器
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        // 发送离线状态
        this.sendOfflineStatus();
    }
}