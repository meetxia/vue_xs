// 标签管理器类
class TagsManager {
    constructor() {
        this.currentTab = 'categories';
        this.tagsData = null;
        this.statisticsData = null;
        this.isEditing = false;
        this.init();
    }

    init() {
        console.log('标签管理器初始化');
        this.bindEvents();
        // 检查是否在标签管理页面
        if (document.getElementById('tags-section')) {
            this.loadData();
        }
    }

    bindEvents() {
        // 分类表单提交
        const categoryForm = document.getElementById('categoryForm');
        if (categoryForm) {
            categoryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCategorySubmit();
            });
        }

        // 标签表单提交
        const tagForm = document.getElementById('tagForm');
        if (tagForm) {
            tagForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleTagSubmit();
            });
        }
    }

    async loadData() {
        try {
            await Promise.all([
                this.loadTagsData(),
                this.loadStatistics()
            ]);
            this.updateUI();
        } catch (error) {
            console.error('加载标签数据失败:', error);
            this.showToast('加载数据失败', 'error');
        }
    }

    async loadTagsData() {
        try {
            const response = await fetch('/api/tags/categories', {
                headers: window.adminManager ? window.adminManager.getAuthHeaders() : {}
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success) {
                this.tagsData = result.data;
                console.log('标签数据加载成功:', this.tagsData);
            } else {
                throw new Error(result.message || '加载标签数据失败');
            }
        } catch (error) {
            console.error('加载标签数据失败:', error);
            // 设置默认数据以防止后续错误
            this.tagsData = {
                categories: [],
                commonTags: []
            };
            throw error;
        }
    }

    async loadStatistics() {
        try {
            const response = await fetch('/api/tags/statistics', {
                headers: window.adminManager ? window.adminManager.getAuthHeaders() : {}
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success) {
                this.statisticsData = result.data;
                console.log('统计数据加载成功:', this.statisticsData);
            } else {
                throw new Error(result.message || '加载统计数据失败');
            }
        } catch (error) {
            console.error('加载统计数据失败:', error);
            // 设置默认统计数据
            this.statisticsData = {
                totalCategories: 0,
                totalCommonTags: 0,
                totalActiveTags: 0,
                totalUnusedTags: 0,
                categoryStats: [],
                tagStats: [],
                unusedTags: []
            };
            throw error;
        }
    }

    updateUI() {
        try {
            console.log('开始更新UI...');
            this.updateStatisticsCards();
            this.renderCurrentTab();
            console.log('UI更新完成');
        } catch (error) {
            console.error('更新UI失败:', error);
            this.showToast('界面更新失败', 'error');
        }
    }

    updateStatisticsCards() {
        if (!this.tagsData || !this.statisticsData) {
            console.log('数据未加载，跳过统计卡片更新');
            return;
        }

        // 安全地更新统计卡片
        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            } else {
                console.warn(`统计卡片元素未找到: ${id}`);
            }
        };

        updateElement('totalCategories', this.statisticsData.totalCategories || 0);
        updateElement('totalCommonTags', this.statisticsData.totalCommonTags || 0);
        updateElement('totalActiveTags', this.statisticsData.tagUsage?.length || 0);
        updateElement('totalUnusedTags', this.statisticsData.unusedCommonTags?.length || 0);

        console.log('统计卡片更新完成');
    }

    renderCurrentTab() {
        switch (this.currentTab) {
            case 'categories':
                this.renderCategories();
                break;
            case 'common-tags':
                this.renderCommonTags();
                break;
            case 'statistics':
                this.renderStatistics();
                break;
        }
    }

    renderCategories() {
        const container = document.getElementById('categoriesList');
        if (!container || !this.tagsData) return;

        const categories = this.tagsData.categories || [];
        
        if (categories.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <div class="text-4xl mb-4">🏷️</div>
                    <p>暂无分类，点击上方按钮添加新分类</p>
                </div>
            `;
            return;
        }

        container.innerHTML = categories.map(category => {
            const stats = this.statisticsData?.categoryUsage?.find(stat => stat.id === category.id);
            const usageCount = stats?.count || 0;
            const usagePercentage = stats?.percentage || 0;

            return `
                <div class="border border-gray-200 rounded-lg p-6 bg-white hover:shadow-md transition-shadow">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <div class="flex items-center mb-3">
                                <h5 class="text-lg font-semibold text-gray-900">${category.name}</h5>
                                <span class="ml-3 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                    ${usageCount} 部作品
                                </span>
                                ${usagePercentage > 0 ? `
                                    <span class="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                        ${usagePercentage}%
                                    </span>
                                ` : ''}
                            </div>
                            <p class="text-gray-600 mb-3">${category.description}</p>
                            
                            ${category.keywords && category.keywords.length > 0 ? `
                                <div class="mb-2">
                                    <span class="text-sm font-medium text-gray-700">关键词：</span>
                                    <span class="text-sm text-gray-600">${category.keywords.join(', ')}</span>
                                </div>
                            ` : ''}
                            
                            ${category.tags && category.tags.length > 0 ? `
                                <div class="flex flex-wrap gap-1">
                                    ${category.tags.map(tag => `
                                        <span class="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">${tag}</span>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="flex items-center space-x-2 ml-4">
                            <button onclick="window.tagsManager.editCategory(${category.id})" 
                                    class="btn btn-sm btn-secondary">
                                ✏️ 编辑
                            </button>
                            <button onclick="window.tagsManager.deleteCategory(${category.id}, '${category.name}')" 
                                    class="btn btn-sm btn-danger"
                                    ${usageCount > 0 ? 'disabled title="无法删除：有作品正在使用此分类"' : ''}>
                                🗑️ 删除
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderCommonTags() {
        const container = document.getElementById('commonTagsList');
        if (!container || !this.tagsData) return;

        const commonTags = this.tagsData.commonTags || [];
        
        if (commonTags.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12 text-gray-500">
                    <div class="text-4xl mb-4">🏷️</div>
                    <p>暂无通用标签，点击上方按钮添加新标签</p>
                </div>
            `;
            return;
        }

        container.innerHTML = commonTags.map(tag => {
            const stats = this.statisticsData?.tagUsage?.find(stat => stat.tag === tag);
            const usageCount = stats?.count || 0;
            const isUnused = usageCount === 0;

            return `
                <div class="border border-gray-200 rounded-lg p-3 bg-white hover:shadow-sm transition-shadow
                            ${isUnused ? 'border-orange-200 bg-orange-50' : ''}">
                    <div class="flex items-center justify-between mb-2">
                        <span class="font-medium ${isUnused ? 'text-orange-800' : 'text-gray-900'}">${tag}</span>
                        <button onclick="window.tagsManager.deleteTag('${tag}')" 
                                class="text-red-500 hover:text-red-700 text-sm"
                                ${usageCount > 0 ? 'disabled title="无法删除：有作品正在使用此标签"' : ''}>
                            ×
                        </button>
                    </div>
                    <div class="text-xs ${isUnused ? 'text-orange-600' : 'text-gray-500'}">
                        ${usageCount > 0 ? `${usageCount} 部作品` : '未使用'}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderStatistics() {
        this.renderCategoryStats();
        this.renderTagStats();
        this.renderUnusedTags();
    }

    renderCategoryStats() {
        const container = document.getElementById('categoryStats');
        if (!container || !this.statisticsData) return;

        const categoryUsage = this.statisticsData.categoryUsage || [];
        
        if (categoryUsage.length === 0) {
            container.innerHTML = '<p class="text-gray-500">暂无数据</p>';
            return;
        }

        container.innerHTML = categoryUsage.map(stat => `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                    <span class="font-medium text-gray-900">${stat.name}</span>
                    <div class="text-sm text-gray-500">${stat.count} 部作品</div>
                </div>
                <div class="text-right">
                    <div class="font-medium text-purple-600">${stat.percentage}%</div>
                    <div class="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div class="h-full bg-purple-500 transition-all duration-500" 
                             style="width: ${stat.percentage}%"></div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderTagStats() {
        const container = document.getElementById('tagStats');
        if (!container || !this.statisticsData) return;

        const tagUsage = this.statisticsData.tagUsage?.slice(0, 10) || [];
        
        if (tagUsage.length === 0) {
            container.innerHTML = '<p class="text-gray-500">暂无数据</p>';
            return;
        }

        const maxCount = Math.max(...tagUsage.map(tag => tag.count));

        container.innerHTML = tagUsage.map(stat => `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                    <span class="font-medium text-gray-900">${stat.tag}</span>
                    <div class="text-sm text-gray-500">${stat.count} 部作品</div>
                </div>
                <div class="text-right">
                    <div class="font-medium text-blue-600">${stat.percentage}%</div>
                    <div class="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div class="h-full bg-blue-500 transition-all duration-500" 
                             style="width: ${(stat.count / maxCount) * 100}%"></div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderUnusedTags() {
        const container = document.getElementById('unusedTags');
        if (!container || !this.statisticsData) return;

        const unusedTags = this.statisticsData.unusedCommonTags || [];
        
        if (unusedTags.length === 0) {
            container.innerHTML = '<p class="text-gray-500">所有标签都在使用中</p>';
            return;
        }

        container.innerHTML = unusedTags.map(tag => `
            <span class="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                ${tag}
            </span>
        `).join('');
    }

    // 标签页切换
    switchTab(tabName) {
        // 更新选项卡UI
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active', 'border-purple-500', 'text-purple-600');
            btn.classList.add('border-transparent', 'text-gray-500');
        });

        const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active', 'border-purple-500', 'text-purple-600');
            activeBtn.classList.remove('border-transparent', 'text-gray-500');
        }

        // 显示/隐藏内容
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });

        const activeContent = document.getElementById(`${tabName}-tab`);
        if (activeContent) {
            activeContent.classList.remove('hidden');
        }

        this.currentTab = tabName;
        this.renderCurrentTab();
    }

    // 显示添加分类模态框
    showAddCategoryModal() {
        this.isEditing = false;
        document.getElementById('categoryModalTitle').textContent = '添加新分类';
        document.getElementById('categoryForm').reset();
        document.getElementById('categoryId').value = '';
        document.getElementById('addCategoryModal').classList.remove('hidden');
    }

    // 编辑分类
    editCategory(categoryId) {
        const category = this.tagsData?.categories?.find(cat => cat.id === categoryId);
        if (!category) {
            this.showToast('分类不存在', 'error');
            return;
        }

        this.isEditing = true;
        document.getElementById('categoryModalTitle').textContent = '编辑分类';
        document.getElementById('categoryId').value = category.id;
        document.getElementById('categoryName').value = category.name;
        document.getElementById('categoryDescription').value = category.description;
        document.getElementById('categoryKeywords').value = (category.keywords || []).join(', ');
        document.getElementById('categoryTags').value = (category.tags || []).join(', ');
        document.getElementById('addCategoryModal').classList.remove('hidden');
    }

    // 处理分类表单提交
    async handleCategorySubmit() {
        const formData = {
            name: document.getElementById('categoryName').value.trim(),
            description: document.getElementById('categoryDescription').value.trim(),
            keywords: document.getElementById('categoryKeywords').value
                .split(',').map(k => k.trim()).filter(k => k),
            tags: document.getElementById('categoryTags').value
                .split(',').map(t => t.trim()).filter(t => t)
        };

        if (!formData.name || !formData.description) {
            this.showToast('请填写必填项', 'error');
            return;
        }

        try {
            const categoryId = document.getElementById('categoryId').value;
            const isEdit = this.isEditing && categoryId;
            
            const response = await fetch(`/api/tags/categories${isEdit ? '/' + categoryId : ''}`, {
                method: isEdit ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(window.adminManager ? window.adminManager.getAuthHeaders() : {})
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            
            if (result.success) {
                this.showToast(result.message, 'success');
                this.closeCategoryModal();
                await this.loadData();
            } else {
                this.showToast(result.message, 'error');
            }
        } catch (error) {
            console.error('保存分类失败:', error);
            this.showToast('保存失败，请稍后重试', 'error');
        }
    }

    // 删除分类
    async deleteCategory(categoryId, categoryName) {
        if (!confirm(`确定要删除分类"${categoryName}"吗？`)) {
            return;
        }

        try {
            const response = await fetch(`/api/tags/categories/${categoryId}`, {
                method: 'DELETE',
                headers: window.adminManager ? window.adminManager.getAuthHeaders() : {}
            });

            const result = await response.json();
            
            if (result.success) {
                this.showToast(result.message, 'success');
                await this.loadData();
            } else {
                this.showToast(result.message, 'error');
            }
        } catch (error) {
            console.error('删除分类失败:', error);
            this.showToast('删除失败，请稍后重试', 'error');
        }
    }

    // 显示添加标签模态框
    showAddTagModal() {
        document.getElementById('tagForm').reset();
        document.getElementById('addTagModal').classList.remove('hidden');
    }

    // 处理标签表单提交
    async handleTagSubmit() {
        const tag = document.getElementById('newTagInput').value.trim();
        
        if (!tag) {
            this.showToast('请输入标签内容', 'error');
            return;
        }

        if (!tag.startsWith('#')) {
            this.showToast('标签必须以#开头', 'error');
            return;
        }

        try {
            const response = await fetch('/api/tags/common-tags', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(window.adminManager ? window.adminManager.getAuthHeaders() : {})
                },
                body: JSON.stringify({ tag })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showToast(result.message, 'success');
                this.closeTagModal();
                await this.loadData();
            } else {
                this.showToast(result.message, 'error');
            }
        } catch (error) {
            console.error('添加标签失败:', error);
            this.showToast('添加失败，请稍后重试', 'error');
        }
    }

    // 删除标签
    async deleteTag(tag) {
        if (!confirm(`确定要删除标签"${tag}"吗？`)) {
            return;
        }

        try {
            const response = await fetch('/api/tags/common-tags', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...(window.adminManager ? window.adminManager.getAuthHeaders() : {})
                },
                body: JSON.stringify({ tag })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showToast(result.message, 'success');
                await this.loadData();
            } else {
                this.showToast(result.message, 'error');
            }
        } catch (error) {
            console.error('删除标签失败:', error);
            this.showToast('删除失败，请稍后重试', 'error');
        }
    }

    // 筛选通用标签
    filterCommonTags() {
        const searchTerm = document.getElementById('tagSearchInput').value.toLowerCase();
        const tagElements = document.querySelectorAll('#commonTagsList > div');
        
        tagElements.forEach(element => {
            const tagText = element.textContent.toLowerCase();
            if (tagText.includes(searchTerm)) {
                element.style.display = 'block';
            } else {
                element.style.display = 'none';
            }
        });
    }

    // 关闭分类模态框
    closeCategoryModal() {
        document.getElementById('addCategoryModal').classList.add('hidden');
        document.getElementById('categoryForm').reset();
        this.isEditing = false;
    }

    // 关闭标签模态框
    closeTagModal() {
        document.getElementById('addTagModal').classList.add('hidden');
        document.getElementById('tagForm').reset();
    }

    // 刷新数据
    async refreshData() {
        try {
            await this.loadData();
            this.showToast('数据刷新成功', 'success');
        } catch (error) {
            console.error('刷新数据失败:', error);
            this.showToast('刷新失败', 'error');
        }
    }

    // 当标签管理页面被激活时调用
    activate() {
        console.log('标签管理页面激活');
        this.loadData();
    }

    // 显示提示消息
    showToast(message, type = 'info') {
        // 如果存在全局的showToast函数，使用它
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
            return;
        }

        // 否则创建简单的提示
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white z-50 ${
            type === 'success' ? 'bg-green-500' :
            type === 'error' ? 'bg-red-500' :
            'bg-blue-500'
        }`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 3000);
    }
}

// 全局函数
function switchTagsTab(tabName) {
    if (window.tagsManager) {
        window.tagsManager.switchTab(tabName);
    }
}

function showAddCategoryModal() {
    if (window.tagsManager) {
        window.tagsManager.showAddCategoryModal();
    }
}

function showAddTagModal() {
    if (window.tagsManager) {
        window.tagsManager.showAddTagModal();
    }
}

function closeCategoryModal() {
    if (window.tagsManager) {
        window.tagsManager.closeCategoryModal();
    }
}

function closeTagModal() {
    if (window.tagsManager) {
        window.tagsManager.closeTagModal();
    }
}

function refreshTagsData() {
    if (window.tagsManager) {
        window.tagsManager.refreshData();
    }
}

function filterCommonTags() {
    if (window.tagsManager) {
        window.tagsManager.filterCommonTags();
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 如果当前页面是管理后台且标签管理区域存在，则初始化标签管理器
    if (document.getElementById('tags-section')) {
        window.tagsManager = new TagsManager();
    }
});

// 全局函数：激活标签管理页面
function activateTagsManager() {
    if (window.tagsManager) {
        window.tagsManager.activate();
    }
}