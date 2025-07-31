// 筛选管理器
class FilterManager {
    constructor() {
        this.activeFilters = {
            category: '',
            tags: [],
            status: '',
            accessLevel: ''
        };
        this.availableCategories = [];
        this.availableTags = [];
        this.init();
    }

    init() {
        this.loadFilterOptions();
        this.bindEvents();
    }

    // 加载筛选选项
    async loadFilterOptions() {
        try {
            // 加载分类
            const categoriesResponse = await fetch('/api/categories');
            if (categoriesResponse.ok) {
                const categoriesResult = await categoriesResponse.json();
                this.availableCategories = categoriesResult.categories || [];
            }

            // 加载所有可用标签
            const novelsResponse = await fetch('/api/novels');
            if (novelsResponse.ok) {
                const novelsResult = await novelsResponse.json();
                if (novelsResult.success) {
                    const allTags = new Set();
                    novelsResult.novels.forEach(novel => {
                        if (novel.tags && Array.isArray(novel.tags)) {
                            novel.tags.forEach(tag => allTags.add(tag));
                        }
                    });
                    this.availableTags = Array.from(allTags);
                }
            }

            this.renderFilterUI();
        } catch (error) {
            console.error('加载筛选选项失败:', error);
        }
    }

    // 渲染筛选界面
    renderFilterUI() {
        const filterContainer = document.getElementById('filterContainer');
        if (!filterContainer) return;

        filterContainer.innerHTML = `
            <div class="filter-section bg-white rounded-lg p-4 mb-4 border">
                <div class="flex items-center justify-between mb-4">
                    <h4 class="font-semibold text-gray-700">筛选条件</h4>
                    <div class="flex items-center space-x-2">
                        <span class="text-xs text-gray-500">选择条件后自动筛选</span>
                        <button id="resetFilters" class="btn btn-secondary btn-sm">
                            🔄 重置筛选
                        </button>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <!-- 分类筛选 -->
                    <div class="filter-group">
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            📚 分类
                        </label>
                        <select id="categoryFilter" class="form-input hover:border-blue-400 transition-colors">
                            <option value="">全部分类</option>
                            ${this.availableCategories.map(cat => 
                                `<option value="${cat.id || cat.name}">${cat.name}</option>`
                            ).join('')}
                        </select>
                    </div>

                    <!-- 状态筛选 -->
                    <div class="filter-group">
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            📊 状态
                        </label>
                        <select id="statusFilter" class="form-input hover:border-blue-400 transition-colors">
                            <option value="">全部状态</option>
                            <option value="published">✅ 已发布</option>
                            <option value="draft">📝 草稿</option>
                            <option value="archived">📦 已归档</option>
                        </select>
                    </div>

                    <!-- 访问权限筛选 -->
                    <div class="filter-group">
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            🔑 访问权限
                        </label>
                        <select id="accessLevelFilter" class="form-input hover:border-blue-400 transition-colors">
                            <option value="">全部权限</option>
                            <option value="free">🌍 免费内容</option>
                            <option value="premium">💎 高级会员</option>
                            <option value="vip">👑 VIP专享</option>
                        </select>
                    </div>

                    <!-- 标签筛选按钮 -->
                    <div class="filter-group flex items-end">
                        <button id="tagFilterBtn" class="btn btn-secondary w-full hover:bg-blue-50 transition-colors">
                            🏷️ 标签筛选 (${this.activeFilters.tags.length})
                        </button>
                    </div>
                </div>

                <!-- 标签选择面板 -->
                <div id="tagFilterPanel" class="mt-4 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200" style="display: none;">
                    <div class="mb-3">
                        <label class="block text-sm font-medium text-gray-700 mb-2">选择标签（可多选，选择后自动应用）</label>
                        <div class="flex items-center space-x-2 mb-2">
                            <button id="selectAllTags" class="btn btn-secondary btn-sm">全选</button>
                            <button id="clearAllTags" class="btn btn-secondary btn-sm">清空</button>
                            <span class="text-xs text-gray-500">已选择 ${this.activeFilters.tags.length} 个标签</span>
                        </div>
                    </div>
                    <div class="tag-grid grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        ${this.availableTags.map(tag => `
                            <label class="tag-filter-item flex items-center p-2 bg-white rounded border cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors ${this.activeFilters.tags.includes(tag) ? 'bg-blue-50 border-blue-300' : ''}">
                                <input type="checkbox" value="${tag}" class="tag-checkbox mr-2" ${this.activeFilters.tags.includes(tag) ? 'checked' : ''}>
                                <span class="text-sm">${tag}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <!-- 当前筛选条件显示 -->
                <div id="activeFiltersDisplay" class="mt-4" style="display: none;">
                    <div class="flex items-center space-x-2 text-sm">
                        <span class="text-gray-600 font-medium">当前筛选:</span>
                        <div id="activeFilterTags" class="flex flex-wrap gap-2"></div>
                    </div>
                </div>

                <!-- 筛选统计 -->
                <div id="filterStats" class="mt-2 text-xs text-gray-500" style="display: none;">
                    <span id="filterStatsText">正在筛选...</span>
                </div>
            </div>
        `;

        this.bindFilterEvents();
    }

    // 绑定筛选事件
    bindFilterEvents() {
        // 分类筛选 - 立即应用
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.activeFilters.category = e.target.value;
                this.showFilterFeedback('分类筛选已应用');
                this.applyFilters();
            });
        }

        // 状态筛选 - 立即应用
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.activeFilters.status = e.target.value;
                this.showFilterFeedback('状态筛选已应用');
                this.applyFilters();
            });
        }

        // 访问权限筛选 - 立即应用
        const accessLevelFilter = document.getElementById('accessLevelFilter');
        if (accessLevelFilter) {
            accessLevelFilter.addEventListener('change', (e) => {
                this.activeFilters.accessLevel = e.target.value;
                this.showFilterFeedback('权限筛选已应用');
                this.applyFilters();
            });
        }

        // 标签筛选按钮
        const tagFilterBtn = document.getElementById('tagFilterBtn');
        const tagFilterPanel = document.getElementById('tagFilterPanel');
        if (tagFilterBtn && tagFilterPanel) {
            tagFilterBtn.addEventListener('click', () => {
                const isVisible = tagFilterPanel.style.display !== 'none';
                tagFilterPanel.style.display = isVisible ? 'none' : 'block';
            });
        }

        // 标签复选框
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('tag-checkbox')) {
                this.updateTagFilters();
            }
        });

        // 全选标签
        const selectAllTags = document.getElementById('selectAllTags');
        if (selectAllTags) {
            selectAllTags.addEventListener('click', () => {
                document.querySelectorAll('.tag-checkbox').forEach(cb => {
                    cb.checked = true;
                });
                this.updateTagFilters();
            });
        }

        // 清空标签
        const clearAllTags = document.getElementById('clearAllTags');
        if (clearAllTags) {
            clearAllTags.addEventListener('click', () => {
                document.querySelectorAll('.tag-checkbox').forEach(cb => {
                    cb.checked = false;
                });
                this.updateTagFilters();
            });
        }

        // 重置筛选
        const resetFilters = document.getElementById('resetFilters');
        if (resetFilters) {
            resetFilters.addEventListener('click', () => {
                this.resetFilters();
            });
        }
    }

    // 更新标签筛选
    updateTagFilters() {
        const checkedTags = Array.from(document.querySelectorAll('.tag-checkbox:checked'))
            .map(cb => cb.value);
        
        this.activeFilters.tags = checkedTags;
        
        // 更新按钮文本
        const tagFilterBtn = document.getElementById('tagFilterBtn');
        if (tagFilterBtn) {
            tagFilterBtn.innerHTML = `🏷️ 标签筛选 (${checkedTags.length})`;
        }

        this.applyFilters();
    }

    // 应用筛选
    async applyFilters() {
        try {
            // 显示加载状态
            this.showFilterLoading(true);
            
            // 如果没有任何筛选条件，直接重新加载所有作品
            if (!this.hasActiveFilters()) {
                if (window.adminManager && window.adminManager.loadNovels) {
                    await window.adminManager.loadNovels();
                }
                this.updateActiveFiltersDisplay();
                return;
            }

            // 构建查询参数
            const params = new URLSearchParams();
            
            if (this.activeFilters.category) {
                params.append('category', this.activeFilters.category);
            }
            if (this.activeFilters.status) {
                params.append('status', this.activeFilters.status);
            }
            if (this.activeFilters.accessLevel) {
                params.append('accessLevel', this.activeFilters.accessLevel);
            }
            if (this.activeFilters.tags.length > 0) {
                params.append('tags', this.activeFilters.tags.join(','));
            }

            // 尝试从后端获取筛选数据
            try {
                const response = await fetch(`/api/novels/filter?${params.toString()}`);
                const result = await response.json();

                if (result.success) {
                    this.renderFilteredNovels(result.novels);
                    this.updateActiveFiltersDisplay();
                    this.showFilterStats(`找到 ${result.novels.length} 部符合条件的作品`);
                    this.showFilterFeedback(`筛选完成，找到 ${result.novels.length} 部作品`);
                } else {
                    console.warn('后端筛选API返回错误:', result.message);
                    this.fallbackFilter();
                }
            } catch (apiError) {
                console.warn('后端筛选API不可用，使用前端筛选:', apiError.message);
                this.fallbackFilter();
            }
        } catch (error) {
            console.error('应用筛选失败:', error);
            this.showFilterFeedback('筛选失败，请重试', 'error');
        } finally {
            this.showFilterLoading(false);
        }
    }

    // 后备前端筛选方案
    async fallbackFilter() {
        try {
            // 获取所有作品数据
            let allNovels = [];
            if (window.adminManager && window.adminManager.currentNovels) {
                allNovels = window.adminManager.currentNovels;
            } else {
                // 尝试从API获取所有作品
                const response = await fetch('/api/novels');
                const result = await response.json();
                if (result.success) {
                    allNovels = result.novels || [];
                }
            }

            // 前端筛选
            const filteredNovels = allNovels.filter(novel => {
                // 分类筛选
                if (this.activeFilters.category) {
                    if (novel.category !== this.activeFilters.category) {
                        return false;
                    }
                }

                // 状态筛选
                if (this.activeFilters.status) {
                    if (novel.status !== this.activeFilters.status) {
                        return false;
                    }
                }

                // 访问权限筛选
                if (this.activeFilters.accessLevel) {
                    if (novel.accessLevel !== this.activeFilters.accessLevel) {
                        return false;
                    }
                }

                // 标签筛选
                if (this.activeFilters.tags.length > 0) {
                    const novelTags = novel.tags || [];
                    const hasAllTags = this.activeFilters.tags.every(tag => 
                        novelTags.includes(tag)
                    );
                    if (!hasAllTags) {
                        return false;
                    }
                }

                return true;
            });

            this.renderFilteredNovels(filteredNovels);
            this.updateActiveFiltersDisplay();
            this.showFilterStats(`找到 ${filteredNovels.length} 部符合条件的作品（前端筛选）`);
            this.showFilterFeedback(`筛选完成，找到 ${filteredNovels.length} 部作品（前端筛选）`);
        } catch (error) {
            console.error('前端筛选失败:', error);
            this.showFilterFeedback('筛选失败，请重试', 'error');
        }
    }

    // 渲染筛选结果
    renderFilteredNovels(novels) {
        if (window.adminManager && window.adminManager.renderNovelsList) {
            window.adminManager.renderNovelsList(novels);
        } else {
            // 备用渲染方法
            this.renderNovelsDirectly(novels);
        }
    }

    // 直接渲染作品列表
    renderNovelsDirectly(novels) {
        const novelsList = document.getElementById('novelsList');
        if (!novelsList) return;

        if (novels.length === 0) {
            novelsList.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <div class="text-4xl mb-4">🔍</div>
                    <p>没有找到符合筛选条件的作品</p>
                </div>
            `;
            return;
        }

        novelsList.innerHTML = novels.map(novel => `
            <div class="bg-white rounded-lg p-4 mb-4 border border-gray-200 relative">
                <div class="flex items-center mb-2">
                    <input type="checkbox" class="novel-checkbox mr-3" data-novel-id="${novel.id}">
                    <div class="flex-1">
                        <div class="flex items-start justify-between">
                            <div class="flex-1">
                                <h4 class="font-semibold text-lg mb-2">${novel.title}</h4>
                                <p class="text-gray-600 mb-2">${novel.summary}</p>
                                <div class="flex flex-wrap gap-2 mb-2">
                                    ${novel.tags ? novel.tags.map(tag => 
                                        `<span class="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs">${tag}</span>`
                                    ).join('') : ''}
                                </div>
                                <div class="text-sm text-gray-500">
                                    <span>阅读量: ${novel.views || 0}</span>
                                    <span class="ml-4">发布时间: ${new Date(novel.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div class="flex flex-col items-end space-y-2">
                                <div class="flex items-center space-x-2">
                                    <span class="access-level-badge ${novel.accessLevel || 'free'}">${this.getAccessLevelText(novel.accessLevel)}</span>
                                    <span class="status-badge ${novel.status || 'published'}">${this.getStatusText(novel.status)}</span>
                                </div>
                                <div class="flex space-x-2">
                                    <button class="btn btn-sm btn-secondary" onclick="editNovel('${novel.id}')">编辑</button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteNovel('${novel.id}')">删除</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 获取访问权限文本
    getAccessLevelText(level) {
        const texts = {
            'free': '免费',
            'premium': '高级',
            'vip': 'VIP'
        };
        return texts[level] || '免费';
    }

    // 获取状态文本
    getStatusText(status) {
        const texts = {
            'published': '已发布',
            'draft': '草稿',
            'archived': '已归档'
        };
        return texts[status] || '已发布';
    }

    // 更新当前筛选条件显示
    updateActiveFiltersDisplay() {
        const display = document.getElementById('activeFiltersDisplay');
        const tagsContainer = document.getElementById('activeFilterTags');
        
        if (!display || !tagsContainer) return;

        const activeTags = [];

        if (this.activeFilters.category) {
            const categoryName = this.availableCategories.find(cat => 
                (cat.id || cat.name) === this.activeFilters.category
            )?.name || this.activeFilters.category;
            activeTags.push({ type: 'category', text: `分类: ${categoryName}` });
        }

        if (this.activeFilters.status) {
            const statusText = this.getStatusText(this.activeFilters.status);
            activeTags.push({ type: 'status', text: `状态: ${statusText}` });
        }

        if (this.activeFilters.accessLevel) {
            const levelText = this.getAccessLevelText(this.activeFilters.accessLevel);
            activeTags.push({ type: 'accessLevel', text: `权限: ${levelText}` });
        }

        if (this.activeFilters.tags.length > 0) {
            this.activeFilters.tags.forEach(tag => {
                activeTags.push({ type: 'tag', text: `标签: ${tag}` });
            });
        }

        if (activeTags.length > 0) {
            display.style.display = 'block';
            tagsContainer.innerHTML = activeTags.map(tag => `
                <span class="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    ${tag.text}
                    <button onclick="filterManager.removeFilter('${tag.type}', '${tag.text}')" 
                            class="ml-1 text-blue-600 hover:text-blue-800">×</button>
                </span>
            `).join('');
        } else {
            display.style.display = 'none';
        }
    }

    // 移除单个筛选条件
    removeFilter(type, text) {
        switch (type) {
            case 'category':
                this.activeFilters.category = '';
                document.getElementById('categoryFilter').value = '';
                break;
            case 'status':
                this.activeFilters.status = '';
                document.getElementById('statusFilter').value = '';
                break;
            case 'accessLevel':
                this.activeFilters.accessLevel = '';
                document.getElementById('accessLevelFilter').value = '';
                break;
            case 'tag':
                const tagValue = text.replace('标签: ', '');
                this.activeFilters.tags = this.activeFilters.tags.filter(tag => tag !== tagValue);
                const checkbox = document.querySelector(`.tag-checkbox[value="${tagValue}"]`);
                if (checkbox) checkbox.checked = false;
                this.updateTagFilters();
                return; // 已经调用了applyFilters
        }
        this.applyFilters();
    }

    // 重置所有筛选条件
    resetFilters() {
        // 重置所有筛选条件
        this.activeFilters = {
            category: '',
            tags: [],
            status: '',
            accessLevel: ''
        };

        // 重置界面
        const categoryFilter = document.getElementById('categoryFilter');
        const statusFilter = document.getElementById('statusFilter');
        const accessLevelFilter = document.getElementById('accessLevelFilter');
        
        if (categoryFilter) categoryFilter.value = '';
        if (statusFilter) statusFilter.value = '';
        if (accessLevelFilter) accessLevelFilter.value = '';

        // 重置标签选择
        document.querySelectorAll('.tag-checkbox').forEach(cb => {
            cb.checked = false;
        });

        // 更新按钮文本
        const tagFilterBtn = document.getElementById('tagFilterBtn');
        if (tagFilterBtn) {
            tagFilterBtn.innerHTML = '🏷️标签筛选 (0)';
        }

        // 隐藏标签面板
        const tagFilterPanel = document.getElementById('tagFilterPanel');
        if (tagFilterPanel) {
            tagFilterPanel.style.display = 'none';
        }

        // 隐藏统计信息
        const filterStats = document.getElementById('filterStats');
        if (filterStats) {
            filterStats.style.display = 'none';
        }

        // 重新加载所有作品
        if (window.adminManager && window.adminManager.loadNovels) {
            window.adminManager.loadNovels();
        } else {
            // 测试环境下显示所有作品
            this.renderFilteredNovels(window.mockNovels || []);
        }

        this.updateActiveFiltersDisplay();
        this.showFilterFeedback('已重置所有筛选条件', 'info');
    }

    // 获取当前筛选条件
    getCurrentFilters() {
        return { ...this.activeFilters };
    }

    // 检查是否有活动筛选
    hasActiveFilters() {
        return this.activeFilters.category || 
               this.activeFilters.status || 
               this.activeFilters.accessLevel || 
               this.activeFilters.tags.length > 0;
    }

    // 显示筛选反馈
    showFilterFeedback(message, type = 'success') {
        if (window.uxManager && window.uxManager.showToast) {
            window.uxManager.showToast(message, type, 2000);
        } else {
            console.log(message);
        }
    }

    // 显示筛选统计
    showFilterStats(text) {
        const filterStats = document.getElementById('filterStats');
        const filterStatsText = document.getElementById('filterStatsText');
        
        if (filterStats && filterStatsText) {
            filterStatsText.textContent = text;
            filterStats.style.display = 'block';
            
            // 3秒后自动隐藏
            setTimeout(() => {
                filterStats.style.display = 'none';
            }, 3000);
        }
    }

    // 显示筛选加载状态
    showFilterLoading(show) {
        const filterContainer = document.getElementById('filterContainer');
        if (!filterContainer) return;

        let loadingIndicator = document.getElementById('filterLoadingIndicator');
        
        if (show) {
            if (!loadingIndicator) {
                loadingIndicator = document.createElement('div');
                loadingIndicator.id = 'filterLoadingIndicator';
                loadingIndicator.className = 'filter-loading flex items-center justify-center p-2 text-blue-600';
                loadingIndicator.innerHTML = `
                    <div class="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
                    <span class="text-sm">正在筛选...</span>
                `;
                filterContainer.appendChild(loadingIndicator);
            }
            loadingIndicator.style.display = 'flex';
        } else {
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
        }
    }
}

// 全局筛选管理器实例
window.filterManager = new FilterManager();