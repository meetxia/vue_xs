// 用户体验优化管理器
class UXManager {
    constructor() {
        this.confirmations = {
            delete: true,
            batchDelete: true,
            statusChange: false
        };
        this.toastQueue = [];
        this.isShowingToast = false;
        this.init();
    }

    init() {
        this.createConfirmationModal();
        this.createToastContainer();
        this.bindGlobalEvents();
        this.initKeyboardShortcuts();
    }

    // 创建确认对话框模态
    createConfirmationModal() {
        const modalHTML = `
            <div id="confirmationModal" class="fixed inset-0 bg-black/50 hidden z-50 flex items-center justify-center p-4">
                <div class="bg-white rounded-lg max-w-md w-full">
                    <div class="p-6">
                        <div class="flex items-start">
                            <div id="confirmIcon" class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-4">
                                <!-- Icon will be inserted here -->
                            </div>
                            <div class="flex-1">
                                <h3 id="confirmTitle" class="text-lg font-semibold text-gray-900 mb-2">
                                    <!-- Title will be inserted here -->
                                </h3>
                                <p id="confirmMessage" class="text-gray-600 mb-4">
                                    <!-- Message will be inserted here -->
                                </p>
                                <div id="confirmDetails" class="hidden bg-gray-50 p-3 rounded text-sm text-gray-700 mb-4">
                                    <!-- Additional details will be inserted here -->
                                </div>
                            </div>
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <label class="flex items-center text-sm text-gray-600">
                                <input type="checkbox" id="dontAskAgain" class="mr-2">
                                <span>不再询问此类操作</span>
                            </label>
                            <div class="flex space-x-3">
                                <button id="confirmCancel" class="btn btn-secondary">取消</button>
                                <button id="confirmOk" class="btn btn-danger">确认</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.bindConfirmationEvents();
    }

    // 创建Toast容器
    createToastContainer() {
        const toastContainer = `
            <div id="toastContainer" class="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
                <!-- Toasts will be inserted here -->
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', toastContainer);
    }

    // 绑定确认对话框事件
    bindConfirmationEvents() {
        const modal = document.getElementById('confirmationModal');
        const cancelBtn = document.getElementById('confirmCancel');
        const okBtn = document.getElementById('confirmOk');
        const dontAskAgain = document.getElementById('dontAskAgain');

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hideConfirmation();
                if (this.currentConfirmation && this.currentConfirmation.onCancel) {
                    this.currentConfirmation.onCancel();
                }
            });
        }

        if (okBtn) {
            okBtn.addEventListener('click', () => {
                const skipFuture = dontAskAgain && dontAskAgain.checked;
                
                if (skipFuture && this.currentConfirmation && this.currentConfirmation.type) {
                    this.confirmations[this.currentConfirmation.type] = false;
                    localStorage.setItem('uxConfirmations', JSON.stringify(this.confirmations));
                }

                this.hideConfirmation();
                
                if (this.currentConfirmation && this.currentConfirmation.onConfirm) {
                    this.currentConfirmation.onConfirm();
                }
            });
        }

        // 点击背景关闭
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideConfirmation();
                    if (this.currentConfirmation && this.currentConfirmation.onCancel) {
                        this.currentConfirmation.onCancel();
                    }
                }
            });
        }

        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
                this.hideConfirmation();
                if (this.currentConfirmation && this.currentConfirmation.onCancel) {
                    this.currentConfirmation.onCancel();
                }
            }
        });
    }

    // 显示确认对话框
    showConfirmation(options) {
        const {
            type = 'delete',
            title = '确认操作',
            message = '您确定要执行此操作吗？',
            details = '',
            confirmText = '确认',
            cancelText = '取消',
            confirmClass = 'btn-danger',
            onConfirm = null,
            onCancel = null,
            skipCheck = false
        } = options;

        // 检查是否需要跳过确认
        if (!skipCheck && !this.confirmations[type]) {
            if (onConfirm) onConfirm();
            return;
        }

        this.currentConfirmation = { type, onConfirm, onCancel };

        // 设置图标
        const iconElement = document.getElementById('confirmIcon');
        const iconConfig = {
            'delete': { icon: '🗑️', class: 'bg-red-100 text-red-600' },
            'batchDelete': { icon: '🗑️', class: 'bg-red-100 text-red-600' },
            'statusChange': { icon: '⚠️', class: 'bg-yellow-100 text-yellow-600' },
            'warning': { icon: '⚠️', class: 'bg-yellow-100 text-yellow-600' },
            'info': { icon: 'ℹ️', class: 'bg-blue-100 text-blue-600' }
        };

        const config = iconConfig[type] || iconConfig['info'];
        if (iconElement) {
            iconElement.className = `flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-4 ${config.class}`;
            iconElement.textContent = config.icon;
        }

        // 设置内容
        const titleElement = document.getElementById('confirmTitle');
        const messageElement = document.getElementById('confirmMessage');
        const detailsElement = document.getElementById('confirmDetails');
        const okButton = document.getElementById('confirmOk');
        const cancelButton = document.getElementById('confirmCancel');

        if (titleElement) titleElement.textContent = title;
        if (messageElement) messageElement.textContent = message;
        
        if (detailsElement) {
            if (details) {
                detailsElement.textContent = details;
                detailsElement.classList.remove('hidden');
            } else {
                detailsElement.classList.add('hidden');
            }
        }

        if (okButton) {
            okButton.textContent = confirmText;
            okButton.className = `btn ${confirmClass}`;
        }

        if (cancelButton) {
            cancelButton.textContent = cancelText;
        }

        // 显示模态框
        const modal = document.getElementById('confirmationModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    // 隐藏确认对话框
    hideConfirmation() {
        const modal = document.getElementById('confirmationModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.currentConfirmation = null;

        // 重置"不再询问"复选框
        const dontAskAgain = document.getElementById('dontAskAgain');
        if (dontAskAgain) {
            dontAskAgain.checked = false;
        }
    }

    // 显示Toast消息
    showToast(message, type = 'info', duration = 3000) {
        const toast = {
            id: Date.now(),
            message,
            type,
            duration
        };

        this.toastQueue.push(toast);
        
        if (!this.isShowingToast) {
            this.processToastQueue();
        }
    }

    // 处理Toast队列
    processToastQueue() {
        if (this.toastQueue.length === 0) {
            this.isShowingToast = false;
            return;
        }

        this.isShowingToast = true;
        const toast = this.toastQueue.shift();
        this.displayToast(toast);
    }

    // 显示单个Toast
    displayToast(toast) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const typeConfig = {
            'success': { icon: '✅', class: 'bg-green-500' },
            'error': { icon: '❌', class: 'bg-red-500' },
            'warning': { icon: '⚠️', class: 'bg-yellow-500' },
            'info': { icon: 'ℹ️', class: 'bg-blue-500' }
        };

        const config = typeConfig[toast.type] || typeConfig['info'];

        const toastElement = document.createElement('div');
        toastElement.id = `toast-${toast.id}`;
        toastElement.className = `toast ${config.class} text-white px-4 py-3 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300 pointer-events-auto`;
        toastElement.innerHTML = `
            <div class="flex items-center">
                <span class="mr-2">${config.icon}</span>
                <span class="flex-1">${toast.message}</span>
                <button onclick="uxManager.hideToast('${toast.id}')" class="ml-2 text-white/80 hover:text-white">×</button>
            </div>
        `;

        container.appendChild(toastElement);

        // 显示动画
        setTimeout(() => {
            toastElement.classList.remove('translate-x-full');
        }, 10);

        // 自动隐藏
        setTimeout(() => {
            this.hideToast(toast.id);
        }, toast.duration);
    }

    // 隐藏Toast
    hideToast(toastId) {
        const toastElement = document.getElementById(`toast-${toastId}`);
        if (toastElement) {
            toastElement.classList.add('translate-x-full');
            setTimeout(() => {
                toastElement.remove();
                this.processToastQueue();
            }, 300);
        }
    }

    // 绑定全局事件
    bindGlobalEvents() {
        // 拦截删除操作
        document.addEventListener('click', (e) => {
            if (e.target.matches('[onclick*="deleteNovel"]') || 
                e.target.matches('.delete-novel-btn') ||
                e.target.closest('.delete-novel-btn')) {
                e.preventDefault();
                e.stopPropagation();
                
                const novelId = e.target.dataset.novelId || 
                               e.target.closest('[data-novel-id]')?.dataset.novelId;
                
                if (novelId) {
                    this.confirmDeleteNovel(novelId);
                }
            }
        });

        // 拦截批量删除操作
        document.addEventListener('click', (e) => {
            if (e.target.matches('#batchDeleteBtn') || 
                e.target.closest('#batchDeleteBtn')) {
                e.preventDefault();
                e.stopPropagation();
                this.confirmBatchDelete();
            }
        });
    }

    // 确认删除单个作品
    confirmDeleteNovel(novelId) {
        // 获取作品信息
        const novelElement = document.querySelector(`[data-novel-id="${novelId}"]`);
        const novelTitle = novelElement?.querySelector('h4')?.textContent || '未知作品';

        this.showConfirmation({
            type: 'delete',
            title: '删除作品确认',
            message: `您确定要删除作品"${novelTitle}"吗？`,
            details: '删除后无法恢复，请谨慎操作。',
            confirmText: '删除',
            cancelText: '取消',
            onConfirm: () => {
                if (window.adminManager && window.adminManager.deleteNovel) {
                    window.adminManager.deleteNovel(novelId);
                }
                this.showToast('作品删除成功', 'success');
            }
        });
    }

    // 确认批量删除
    confirmBatchDelete() {
        const selectedCount = window.batchManager ? window.batchManager.getSelectedCount() : 0;
        
        if (selectedCount === 0) {
            this.showToast('请先选择要删除的作品', 'warning');
            return;
        }

        this.showConfirmation({
            type: 'batchDelete',
            title: '批量删除确认',
            message: `您确定要删除选中的 ${selectedCount} 部作品吗？`,
            details: '批量删除后无法恢复，请谨慎操作。建议先进行数据备份。',
            confirmText: '批量删除',
            cancelText: '取消',
            onConfirm: () => {
                if (window.batchManager && window.batchManager.batchDelete) {
                    window.batchManager.batchDelete();
                }
            }
        });
    }

    // 初始化键盘快捷键
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + A: 全选作品
            if ((e.ctrlKey || e.metaKey) && e.key === 'a' && this.isInManageSection()) {
                e.preventDefault();
                if (window.batchManager) {
                    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
                    if (selectAllCheckbox) {
                        selectAllCheckbox.checked = true;
                        selectAllCheckbox.dispatchEvent(new Event('change'));
                    }
                }
            }

            // Escape: 清除选择
            if (e.key === 'Escape' && this.isInManageSection()) {
                if (window.batchManager) {
                    window.batchManager.clearSelection();
                }
            }

            // Ctrl/Cmd + F: 聚焦搜索框
            if ((e.ctrlKey || e.metaKey) && e.key === 'f' && this.isInManageSection()) {
                e.preventDefault();
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.focus();
                }
            }

            // Delete: 删除选中的作品
            if (e.key === 'Delete' && this.isInManageSection()) {
                const selectedCount = window.batchManager ? window.batchManager.getSelectedCount() : 0;
                if (selectedCount > 0) {
                    this.confirmBatchDelete();
                }
            }
        });
    }

    // 检查是否在作品管理页面
    isInManageSection() {
        const manageSection = document.getElementById('manage-section');
        return manageSection && !manageSection.classList.contains('hidden') && 
               manageSection.classList.contains('active');
    }

    // 显示选中计数器
    showSelectionCounter(count) {
        const counter = document.getElementById('selectionCounter');
        if (counter) {
            counter.style.display = count > 0 ? 'block' : 'none';
            counter.querySelector('.count').textContent = count;
        }
    }

    // 创建选中计数器
    createSelectionCounter() {
        const counterHTML = `
            <div id="selectionCounter" class="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg" style="display: none;">
                <div class="flex items-center space-x-2">
                    <span>已选择 <strong class="count">0</strong> 部作品</span>
                    <button onclick="uxManager.showBatchActions()" class="bg-blue-700 hover:bg-blue-800 px-2 py-1 rounded text-sm">
                        批量操作
                    </button>
                    <button onclick="batchManager.clearSelection()" class="bg-blue-700 hover:bg-blue-800 px-2 py-1 rounded text-sm">
                        清除
                    </button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', counterHTML);
    }

    // 显示批量操作菜单
    showBatchActions() {
        const selectedCount = window.batchManager ? window.batchManager.getSelectedCount() : 0;
        if (selectedCount === 0) return;

        // 这里可以显示一个浮动的批量操作菜单
        this.showToast(`选中了 ${selectedCount} 部作品，请使用页面上的批量操作按钮`, 'info');
    }

    // 加载保存的确认设置
    loadConfirmationSettings() {
        const saved = localStorage.getItem('uxConfirmations');
        if (saved) {
            try {
                this.confirmations = { ...this.confirmations, ...JSON.parse(saved) };
            } catch (error) {
                console.error('加载确认设置失败:', error);
            }
        }
    }

    // 重置确认设置
    resetConfirmationSettings() {
        this.confirmations = {
            delete: true,
            batchDelete: true,
            statusChange: false
        };
        localStorage.removeItem('uxConfirmations');
        this.showToast('确认设置已重置', 'success');
    }

    // 显示帮助提示
    showHelp() {
        const helpMessage = `
            <div class="text-left">
                <h4 class="font-semibold mb-2">键盘快捷键:</h4>
                <ul class="text-sm space-y-1">
                    <li><kbd class="bg-gray-200 px-1 rounded">Ctrl/Cmd + A</kbd> - 全选作品</li>
                    <li><kbd class="bg-gray-200 px-1 rounded">Ctrl/Cmd + F</kbd> - 聚焦搜索</li>
                    <li><kbd class="bg-gray-200 px-1 rounded">Escape</kbd> - 清除选择</li>
                    <li><kbd class="bg-gray-200 px-1 rounded">Delete</kbd> - 批量删除</li>
                </ul>
            </div>
        `;

        this.showConfirmation({
            type: 'info',
            title: '使用帮助',
            message: helpMessage,
            confirmText: '知道了',
            cancelText: '',
            confirmClass: 'btn-primary',
            onConfirm: () => {}
        });
    }

    // 获取统计信息
    getStats() {
        return {
            confirmationsEnabled: Object.values(this.confirmations).filter(Boolean).length,
            toastQueue: this.toastQueue.length,
            isShowingToast: this.isShowingToast
        };
    }
}

// 全局UX管理器实例
window.uxManager = new UXManager();

// 加载保存的设置
window.uxManager.loadConfirmationSettings();

// 导出一些便捷函数
window.showConfirmation = (options) => window.uxManager.showConfirmation(options);
window.showToast = (message, type, duration) => window.uxManager.showToast(message, type, duration);
window.showHelp = () => window.uxManager.showHelp();