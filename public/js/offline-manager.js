// 离线管理页面JavaScript
class OfflineManagerPage {
    constructor() {
        this.offlineManager = null;
        this.novels = [];
        this.sortBy = 'time';
        
        this.initializeElements();
        this.initializeOfflineManager();
        this.bindEvents();
        this.updateNetworkStatus();
        
        // 定期更新网络状态
        setInterval(() => this.updateNetworkStatus(), 5000);
    }
    
    initializeElements() {
        // 存储使用情况元素
        this.elements = {
            usedStorage: document.getElementById('usedStorage'),
            totalStorage: document.getElementById('totalStorage'),
            novelCount: document.getElementById('novelCount'),
            storageProgress: document.getElementById('storageProgress'),
            storagePercentage: document.getElementById('storagePercentage'),
            
            // 网络状态元素
            networkIndicator: document.getElementById('networkIndicator'),
            networkText: document.getElementById('networkText'),
            lastSyncTime: document.getElementById('lastSyncTime'),
            
            // 小说列表元素
            loadingNovels: document.getElementById('loadingNovels'),
            emptyState: document.getElementById('emptyState'),
            novelsList: document.getElementById('novelsList'),
            sortSelect: document.getElementById('sortSelect'),
            
            // 按钮元素
            refreshBtn: document.getElementById('refreshBtn'),
            clearAllBtn: document.getElementById('clearAllBtn'),
            batchDownloadBtn: document.getElementById('batchDownloadBtn'),
            syncProgressBtn: document.getElementById('syncProgressBtn'),
            settingsBtn: document.getElementById('settingsBtn'),
            
            // 设置弹窗元素
            settingsModal: document.getElementById('settingsModal'),
            closeSettingsBtn: document.getElementById('closeSettingsBtn'),
            cancelSettingsBtn: document.getElementById('cancelSettingsBtn'),
            saveSettingsBtn: document.getElementById('saveSettingsBtn'),
            storageLimitSlider: document.getElementById('storageLimitSlider'),
            currentLimit: document.getElementById('currentLimit'),
            autoCleanToggle: document.getElementById('autoCleanToggle'),
            wifiOnlyToggle: document.getElementById('wifiOnlyToggle'),
            
            // Toast元素
            toast: document.getElementById('toast'),
            toastIcon: document.getElementById('toastIcon'),
            toastMessage: document.getElementById('toastMessage'),
            toastClose: document.getElementById('toastClose')
        };
    }
    
    async initializeOfflineManager() {
        if (typeof OfflineReaderManager !== 'undefined') {
            this.offlineManager = new OfflineReaderManager();
            this.offlineManager.registerToastFunction((message, type) => this.showToast(message, type));
            
            await this.loadOfflineNovels();
            await this.updateStorageInfo();
        } else {
            this.showToast('离线功能不可用', 'error');
        }
    }
    
    bindEvents() {
        // 刷新按钮
        this.elements.refreshBtn.addEventListener('click', () => this.refresh());
        
        // 清空所有数据按钮
        this.elements.clearAllBtn.addEventListener('click', () => this.clearAllData());
        
        // 批量下载按钮
        this.elements.batchDownloadBtn.addEventListener('click', () => this.batchDownload());
        
        // 同步进度按钮
        this.elements.syncProgressBtn.addEventListener('click', () => this.syncProgress());
        
        // 设置按钮
        this.elements.settingsBtn.addEventListener('click', () => this.openSettings());
        
        // 设置弹窗事件
        this.elements.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        this.elements.cancelSettingsBtn.addEventListener('click', () => this.closeSettings());
        this.elements.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        
        // 存储限制滑块
        this.elements.storageLimitSlider.addEventListener('input', (e) => {
            this.elements.currentLimit.textContent = e.target.value + 'MB';
        });
        
        // 排序选择
        this.elements.sortSelect.addEventListener('change', (e) => {
            this.sortBy = e.target.value;
            this.renderNovelsList();
        });
        
        // Toast关闭按钮
        this.elements.toastClose.addEventListener('click', () => this.hideToast());
        
        // 点击弹窗外部关闭
        this.elements.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.elements.settingsModal) {
                this.closeSettings();
            }
        });
    }
    
    async refresh() {
        this.elements.refreshBtn.classList.add('animate-spin');
        
        try {
            await this.loadOfflineNovels();
            await this.updateStorageInfo();
            this.updateNetworkStatus();
            this.showToast('刷新完成', 'success');
        } catch (error) {
            console.error('刷新失败:', error);
            this.showToast('刷新失败', 'error');
        } finally {
            this.elements.refreshBtn.classList.remove('animate-spin');
        }
    }
    
    async clearAllData() {
        if (!confirm('确定要清空所有离线数据吗？此操作不可恢复。')) {
            return;
        }
        
        try {
            await this.offlineManager.clearAllOfflineData();
            this.novels = [];
            this.renderNovelsList();
            await this.updateStorageInfo();
            this.showToast('已清空所有离线数据', 'success');
        } catch (error) {
            console.error('清空数据失败:', error);
            this.showToast('清空失败', 'error');
        }
    }
    
    async batchDownload() {
        this.showToast('批量下载功能开发中...', 'info');
        // TODO: 实现批量下载功能
    }
    
    async syncProgress() {
        this.showToast('同步阅读进度功能开发中...', 'info');
        // TODO: 实现同步阅读进度功能
    }
    
    async loadOfflineNovels() {
        if (!this.offlineManager) return;
        
        try {
            this.novels = await this.offlineManager.getAllNovels();
            this.renderNovelsList();
        } catch (error) {
            console.error('加载离线小说失败:', error);
            this.showToast('加载失败', 'error');
        }
    }
    
    async updateStorageInfo() {
        if (!this.offlineManager) return;
        
        try {
            const usage = await this.offlineManager.getStorageUsage();
            
            // 更新显示
            this.elements.usedStorage.textContent = this.formatSize(usage.totalSize);
            this.elements.totalStorage.textContent = this.formatSize(usage.sizeLimit);
            this.elements.novelCount.textContent = usage.novelCount.toString();
            
            // 更新进度条
            const percentage = usage.usedPercentage;
            this.elements.storageProgress.style.width = percentage + '%';
            this.elements.storagePercentage.textContent = percentage + '% 已使用';
            
            // 根据使用率改变进度条颜色
            if (percentage > 90) {
                this.elements.storageProgress.className = 'bg-red-500 h-2 rounded-full transition-all duration-300';
            } else if (percentage > 70) {
                this.elements.storageProgress.className = 'bg-yellow-500 h-2 rounded-full transition-all duration-300';
            } else {
                this.elements.storageProgress.className = 'bg-xhs-red h-2 rounded-full transition-all duration-300';
            }
        } catch (error) {
            console.error('更新存储信息失败:', error);
        }
    }
    
    renderNovelsList() {
        // 隐藏加载状态
        this.elements.loadingNovels.classList.add('hidden');
        
        if (this.novels.length === 0) {
            this.elements.emptyState.classList.remove('hidden');
            this.elements.novelsList.classList.add('hidden');
            return;
        }
        
        this.elements.emptyState.classList.add('hidden');
        this.elements.novelsList.classList.remove('hidden');
        
        // 排序小说
        const sortedNovels = this.sortNovels([...this.novels]);
        
        // 渲染小说列表
        this.elements.novelsList.innerHTML = sortedNovels.map(novel => this.createNovelItem(novel)).join('');
        
        // 绑定删除按钮事件
        this.bindNovelItemEvents();
    }
    
    sortNovels(novels) {
        switch (this.sortBy) {
            case 'title':
                return novels.sort((a, b) => a.title.localeCompare(b.title));
            case 'size':
                return novels.sort((a, b) => (b.size || 0) - (a.size || 0));
            case 'time':
            default:
                return novels.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        }
    }
    
    createNovelItem(novel) {
        const size = this.formatSize(novel.size || 0);
        const downloadTime = this.formatTime(novel.timestamp);
        
        return `
            <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div class="flex-1">
                    <h3 class="font-medium text-gray-900 mb-1">${novel.title}</h3>
                    <p class="text-sm text-gray-500 mb-2 line-clamp-2">${novel.summary || '暂无简介'}</p>
                    <div class="flex items-center space-x-4 text-xs text-gray-400">
                        <span>📁 ${size}</span>
                        <span>📅 ${downloadTime}</span>
                        <span>👁 ${this.formatViews(novel.views || 0)}</span>
                    </div>
                </div>
                <div class="flex items-center space-x-2 ml-4">
                    <button onclick="window.location.href='read.html?id=${novel.id}'" 
                            class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                        阅读
                    </button>
                    <button class="delete-novel-btn px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                            data-novel-id="${novel.id}">
                        删除
                    </button>
                </div>
            </div>
        `;
    }
    
    bindNovelItemEvents() {
        const deleteButtons = document.querySelectorAll('.delete-novel-btn');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const novelId = parseInt(e.target.dataset.novelId);
                await this.deleteNovel(novelId);
            });
        });
    }
    
    async deleteNovel(novelId) {
        const novel = this.novels.find(n => n.id === novelId);
        if (!novel) return;
        
        if (!confirm(`确定要删除《${novel.title}》的离线版本吗？`)) {
            return;
        }
        
        try {
            await this.offlineManager.deleteNovel(novelId);
            this.novels = this.novels.filter(n => n.id !== novelId);
            this.renderNovelsList();
            await this.updateStorageInfo();
            this.showToast('删除成功', 'success');
        } catch (error) {
            console.error('删除失败:', error);
            this.showToast('删除失败', 'error');
        }
    }
    
    updateNetworkStatus() {
        const isOnline = navigator.onLine;
        
        if (isOnline) {
            this.elements.networkIndicator.className = 'w-3 h-3 rounded-full bg-green-500';
            this.elements.networkText.textContent = '网络已连接';
        } else {
            this.elements.networkIndicator.className = 'w-3 h-3 rounded-full bg-red-500';
            this.elements.networkText.textContent = '网络已断开';
        }
        
        // 更新最后同步时间
        const lastSync = localStorage.getItem('lastSyncTime');
        if (lastSync) {
            this.elements.lastSyncTime.textContent = `最后同步：${this.formatTime(parseInt(lastSync))}`;
        }
    }
    
    openSettings() {
        // 加载当前设置
        const currentLimit = this.offlineManager ? this.offlineManager.storageLimit / (1024 * 1024) : 50;
        this.elements.storageLimitSlider.value = currentLimit;
        this.elements.currentLimit.textContent = currentLimit + 'MB';
        
        // 加载其他设置
        this.elements.autoCleanToggle.checked = localStorage.getItem('autoClean') !== 'false';
        this.elements.wifiOnlyToggle.checked = localStorage.getItem('wifiOnly') === 'true';
        
        this.elements.settingsModal.classList.remove('hidden');
    }
    
    closeSettings() {
        this.elements.settingsModal.classList.add('hidden');
    }
    
    saveSettings() {
        const newLimit = parseInt(this.elements.storageLimitSlider.value);
        const autoClean = this.elements.autoCleanToggle.checked;
        const wifiOnly = this.elements.wifiOnlyToggle.checked;
        
        // 保存设置
        if (this.offlineManager) {
            this.offlineManager.setStorageLimit(newLimit);
        }
        localStorage.setItem('autoClean', autoClean.toString());
        localStorage.setItem('wifiOnly', wifiOnly.toString());
        
        this.closeSettings();
        this.showToast('设置已保存', 'success');
        
        // 更新存储信息显示
        this.updateStorageInfo();
    }
    
    // 工具函数
    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
    
    formatTime(timestamp) {
        if (!timestamp) return '未知';
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
        if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
        if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';
        
        return date.toLocaleDateString();
    }
    
    formatViews(views) {
        if (views >= 10000) {
            return (views / 10000).toFixed(1) + 'w';
        } else if (views >= 1000) {
            return (views / 1000).toFixed(1) + 'k';
        }
        return views.toString();
    }
    
    showToast(message, type = 'info') {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        this.elements.toastIcon.textContent = icons[type] || icons.info;
        this.elements.toastMessage.textContent = message;
        this.elements.toast.classList.remove('hidden');
        
        // 3秒后自动隐藏
        setTimeout(() => this.hideToast(), 3000);
    }
    
    hideToast() {
        this.elements.toast.classList.add('hidden');
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new OfflineManagerPage();
});
