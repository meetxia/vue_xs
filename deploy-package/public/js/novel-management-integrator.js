// 作品管理集成模块 - 协调所有批量管理功能
class NovelManagementIntegrator {
    constructor() {
        this.isInitialized = false;
        this.currentNovels = [];
        this.filteredNovels = [];
        this.displayedNovels = [];
        
        // 等待所有依赖模块加载完成
        this.waitForDependencies().then(() => {
            this.init();
        });
    }

    // 等待依赖模块加载
    async waitForDependencies() {
        const checkDependencies = () => {
            return window.batchManager && 
                   window.filterManager && 
                   window.searchManager && 
                   window.uxManager;
        };

        // 如果依赖已经加载，直接返回
        if (checkDependencies()) {
            return Promise.resolve();
        }

        // 否则等待依赖加载
        return new Promise((resolve) => {
            const intervalId = setInterval(() => {
                if (checkDependencies()) {
                    clearInterval(intervalId);
                    resolve();
                }
            }, 100);
            
            // 设置最大等待时间（10秒）
            setTimeout(() => {
                clearInterval(intervalId);
                console.error('作品管理模块依赖加载超时');
                resolve();
            }, 10000);
        });
    }

    init() {
        if (this.isInitialized) return;
        
        console.log('初始化作品管理集成模块...');
        
        // 绑定事件监听
        this.bindEvents();
        
        // 扩展原有的AdminManager
        this.extendAdminManager();
        
        // 初始化UI组件
        this.initializeComponents();
        
        this.isInitialized = true;
        console.log('作品管理集成模块初始化完成');
    }

    // 绑定事件监听
    bindEvents() {
        // 监听作品数据更新
        document.addEventListener('novelsUpdated', (e) => {
            this.currentNovels = e.detail.novels || [];
            this.updateDisplayCount();
        });

        // 监听筛选结果更新
        document.addEventListener('filterUpdated', (e) => {
            this.filteredNovels = e.detail.novels || [];
            this.updateDisplayCount();
        });

        // 监听搜索结果更新
        document.addEventListener('searchUpdated', (e) => {
            this.displayedNovels = e.detail.novels || [];
            this.updateDisplayCount();
        });

        // 监听批量选择变化
        document.addEventListener('selectionChanged', (e) => {
            const count = e.detail.count || 0;
            this.updateBatchOperationVisibility(count);
        });

        // 监听页面切换
        document.addEventListener('sectionChanged', (e) => {
            if (e.detail.section === 'manage') {
                this.onManageSectionActivated();
            }
        });
    }

    // 扩展原有的AdminManager
    extendAdminManager() {
        if (!window.adminManager) return;

        // 保存原有的loadNovels方法
        const originalLoadNovels = window.adminManager.loadNovels.bind(window.adminManager);
        
        // 重写loadNovels方法以支持新功能
        window.adminManager.loadNovels = async () => {
            try {
                const result = await originalLoadNovels();
                
                // 触发作品数据更新事件
                document.dispatchEvent(new CustomEvent('novelsUpdated', {
                    detail: { novels: window.adminManager.currentNovels || [] }
                }));
                
                return result;
            } catch (error) {
                console.error('加载作品列表失败:', error);
                throw error;
            }
        };

        // 添加新的作品列表渲染方法
        window.adminManager.renderNovelsList = (novels) => {
            this.renderEnhancedNovelsList(novels);
        };

        // 扩展showMessage方法
        const originalShowMessage = window.adminManager.showMessage.bind(window.adminManager);
        window.adminManager.showMessage = (message, type = 'info') => {
            if (window.uxManager && window.uxManager.showToast) {
                window.uxManager.showToast(message, type);
            } else {
                originalShowMessage(message, type);
            }
        };
    }

    // 初始化组件
    initializeComponents() {
        // 确保在管理页面激活时初始化所有组件
        if (this.isManageSectionActive()) {
            this.onManageSectionActivated();
        }
    }

    // 当管理页面激活时执行
    onManageSectionActivated() {
        setTimeout(() => {
            // 初始化搜索UI
            if (window.searchManager && !document.querySelector('#searchContainer .search-section')) {
                window.searchManager.renderSearchUI();
            }

            // 初始化筛选UI
            if (window.filterManager && !document.querySelector('#filterContainer .filter-section')) {
                window.filterManager.renderFilterUI();
            }

            // 更新显示计数
            this.updateDisplayCount();
        }, 100);
    }

    // 渲染增强的作品列表
    renderEnhancedNovelsList(novels) {
        const novelsList = document.getElementById('novelsList');
        if (!novelsList) return;

        this.displayedNovels = novels || [];

        if (novels.length === 0) {
            novelsList.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <div class="text-4xl mb-4">📚</div>
                    <p>暂无符合条件的作品</p>
                    ${this.getEmptyStateActions()}
                </div>
            `;
            return;
        }

        novelsList.innerHTML = novels.map(novel => this.renderNovelItem(novel)).join('');
        this.updateDisplayCount();
    }

    // 渲染单个作品项
    renderNovelItem(novel) {
        const tags = novel.tags ? novel.tags.map(tag => 
            `<span class="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs">${tag}</span>`
        ).join('') : '';

        const accessLevelBadge = this.getAccessLevelBadge(novel.accessLevel);
        const statusBadge = this.getStatusBadge(novel.status);

        return `
            <div class="bg-white rounded-lg p-4 mb-4 border border-gray-200 hover:border-blue-300 transition-colors novel-item" data-novel-id="${novel.id}">
                <div class="flex items-start">
                    <!-- 选择复选框 -->
                    <div class="flex-shrink-0 mr-3 pt-1">
                        <input type="checkbox" 
                               class="novel-checkbox w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" 
                               data-novel-id="${novel.id}">
                    </div>
                    
                    <!-- 作品信息 -->
                    <div class="flex-1 min-w-0">
                        <div class="flex items-start justify-between">
                            <div class="flex-1 min-w-0 mr-4">
                                <h4 class="font-semibold text-lg text-gray-900 mb-2 truncate">${novel.title}</h4>
                                <p class="text-gray-600 mb-3 line-clamp-2">${novel.summary || '暂无简介'}</p>
                                
                                <!-- 标签 -->
                                ${tags ? `<div class="flex flex-wrap gap-2 mb-3">${tags}</div>` : ''}
                                
                                <!-- 元数据 -->
                                <div class="flex items-center text-sm text-gray-500 space-x-4 mb-2">
                                    <span>📖 ${novel.wordCount || 0} 字</span>
                                    <span>👁️ ${novel.views || 0} 阅读</span>
                                    <span>❤️ ${novel.likes || 0} 喜欢</span>
                                    <span>📅 ${new Date(novel.createdAt).toLocaleDateString()}</span>
                                </div>
                                
                                <!-- 作者信息 -->
                                <div class="text-sm text-gray-500">
                                    <span>作者: ${novel.author || '未知'}</span>
                                </div>
                            </div>
                            
                            <!-- 状态和操作 -->
                            <div class="flex-shrink-0 text-right">
                                <div class="flex items-center space-x-2 mb-3">
                                    ${accessLevelBadge}
                                    ${statusBadge}
                                </div>
                                
                                <!-- 操作按钮 -->
                                <div class="flex flex-col space-y-2">
                                    <div class="flex space-x-2">
                                        <button class="btn btn-sm btn-secondary" onclick="editNovel('${novel.id}')" title="编辑作品">
                                            ✏️
                                        </button>
                                        <button class="btn btn-sm btn-primary" onclick="previewNovel('${novel.id}')" title="预览作品">
                                            👁️
                                        </button>
                                        <button class="btn btn-sm btn-warning" onclick="editNovelAccess('${novel.id}')" title="编辑权限">
                                            🔑
                                        </button>
                                    </div>
                                    <div class="flex space-x-2">
                                        <button class="btn btn-sm btn-success" onclick="toggleNovelStatus('${novel.id}', '${novel.status}')" title="切换状态">
                                            ${novel.status === 'published' ? '⬇️' : '⬆️'}
                                        </button>
                                        <button class="btn btn-sm btn-danger delete-novel-btn" data-novel-id="${novel.id}" title="删除作品">
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 获取访问权限徽章
    getAccessLevelBadge(level) {
        const badges = {
            'free': '<span class="access-level-badge free">免费</span>',
            'premium': '<span class="access-level-badge premium">高级</span>',
            'vip': '<span class="access-level-badge vip">VIP</span>'
        };
        return badges[level] || badges['free'];
    }

    // 获取状态徽章
    getStatusBadge(status) {
        const badges = {
            'published': '<span class="status-badge bg-green-100 text-green-800">已发布</span>',
            'draft': '<span class="status-badge bg-yellow-100 text-yellow-800">草稿</span>',
            'archived': '<span class="status-badge bg-gray-100 text-gray-800">已归档</span>'
        };
        return badges[status] || badges['published'];
    }

    // 获取空状态操作
    getEmptyStateActions() {
        const hasFilters = window.filterManager && window.filterManager.hasActiveFilters();
        const hasSearch = window.searchManager && window.searchManager.getSearchState().searchTerm;

        if (hasFilters || hasSearch) {
            return `
                <div class="mt-4 space-x-4">
                    <button class="btn btn-secondary" onclick="filterManager.resetFilters()">清除筛选</button>
                    <button class="btn btn-secondary" onclick="searchManager.clearSearch()">清除搜索</button>
                </div>
            `;
        }

        return `
            <div class="mt-4">
                <a href="#write" class="btn btn-primary" onclick="adminManager.switchSection('write')">创建第一部作品</a>
            </div>
        `;
    }

    // 更新显示计数
    updateDisplayCount() {
        const countElement = document.getElementById('currentDisplayCount');
        if (countElement) {
            countElement.textContent = this.displayedNovels.length;
        }
    }

    // 更新批量操作可见性
    updateBatchOperationVisibility(selectedCount) {
        const batchBar = document.getElementById('batchOperationBar');
        if (batchBar) {
            batchBar.style.display = selectedCount > 0 ? 'block' : 'none';
        }

        // 更新选中计数
        const selectedCountElement = document.getElementById('selectedCount');
        if (selectedCountElement) {
            selectedCountElement.textContent = selectedCount;
        }
    }

    // 检查管理页面是否激活
    isManageSectionActive() {
        const manageSection = document.getElementById('manage-section');
        return manageSection && manageSection.classList.contains('active');
    }

    // 提供全局辅助函数
    getIntegrationStats() {
        return {
            totalNovels: this.currentNovels.length,
            filteredNovels: this.filteredNovels.length,
            displayedNovels: this.displayedNovels.length,
            selectedNovels: window.batchManager ? window.batchManager.getSelectedCount() : 0,
            hasActiveFilters: window.filterManager ? window.filterManager.hasActiveFilters() : false,
            hasActiveSearch: window.searchManager ? !!window.searchManager.getSearchState().searchTerm : false
        };
    }
}

// 等待DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.novelManagementIntegrator = new NovelManagementIntegrator();
});

// 提供一些全局便捷函数
window.refreshManagementData = () => {
    if (window.adminManager && window.adminManager.loadNovels) {
        window.adminManager.loadNovels();
    }
};

window.getManagementStats = () => {
    if (window.novelManagementIntegrator) {
        return window.novelManagementIntegrator.getIntegrationStats();
    }
    return null;
};

// 增强的全局函数，替换原有函数
window.hideBatchOperationBar = () => {
    const batchBar = document.getElementById('batchOperationBar');
    if (batchBar) {
        batchBar.style.display = 'none';
    }
    if (window.batchManager) {
        window.batchManager.clearSelection();
    }
};

window.editNovelAccess = (novelId) => {
    // 这里可以调用现有的权限编辑功能
    if (window.showNovelAccessModal) {
        window.showNovelAccessModal(novelId);
    }
};

window.toggleNovelStatus = async (novelId, currentStatus) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    const statusText = newStatus === 'published' ? '上架' : '下架';
    
    if (window.uxManager) {
        window.uxManager.showConfirmation({
            type: 'statusChange',
            title: '状态修改确认',
            message: `确定要将此作品${statusText}吗？`,
            onConfirm: async () => {
                try {
                    const response = await fetch(`/api/novels/${novelId}/status`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                        },
                        body: JSON.stringify({ status: newStatus })
                    });

                    const result = await response.json();
                    if (result.success) {
                        window.uxManager.showToast(`作品已${statusText}`, 'success');
                        window.refreshManagementData();
                    } else {
                        window.uxManager.showToast(result.message || '操作失败', 'error');
                    }
                } catch (error) {
                    console.error('修改状态失败:', error);
                    window.uxManager.showToast('操作失败，请检查网络连接', 'error');
                }
            }
        });
    }
};

window.previewNovel = (novelId) => {
    // 这里可以调用现有的预览功能
    if (window.adminManager && window.adminManager.previewNovel) {
        window.adminManager.previewNovel(novelId);
    }
};

window.editNovel = (novelId) => {
    // 这里可以调用现有的编辑功能
    if (window.adminManager && window.adminManager.editNovel) {
        window.adminManager.editNovel(novelId);
    }
};