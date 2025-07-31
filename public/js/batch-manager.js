// 批量操作管理器
class BatchManager {
    constructor() {
        this.selectedNovels = new Set();
        this.isAllSelected = false;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // 监听复选框变化
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('novel-checkbox')) {
                this.handleNovelSelection(e.target);
            } else if (e.target.id === 'selectAllCheckbox') {
                this.handleSelectAll(e.target);
            }
        });
    }

    // 处理单个作品选择
    handleNovelSelection(checkbox) {
        const novelId = checkbox.dataset.novelId;
        
        if (checkbox.checked) {
            this.selectedNovels.add(novelId);
        } else {
            this.selectedNovels.delete(novelId);
            this.isAllSelected = false;
            const selectAllCheckbox = document.getElementById('selectAllCheckbox');
            if (selectAllCheckbox) {
                selectAllCheckbox.checked = false;
            }
        }

        this.updateBatchOperationBar();
        this.updateSelectAllState();
    }

    // 处理全选/取消全选
    handleSelectAll(checkbox) {
        this.isAllSelected = checkbox.checked;
        const novelCheckboxes = document.querySelectorAll('.novel-checkbox');
        
        novelCheckboxes.forEach(cb => {
            cb.checked = this.isAllSelected;
            const novelId = cb.dataset.novelId;
            
            if (this.isAllSelected) {
                this.selectedNovels.add(novelId);
            } else {
                this.selectedNovels.delete(novelId);
            }
        });

        this.updateBatchOperationBar();
    }

    // 更新全选状态
    updateSelectAllState() {
        const novelCheckboxes = document.querySelectorAll('.novel-checkbox');
        const checkedCount = document.querySelectorAll('.novel-checkbox:checked').length;
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        
        if (selectAllCheckbox) {
            if (checkedCount === 0) {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.indeterminate = false;
            } else if (checkedCount === novelCheckboxes.length) {
                selectAllCheckbox.checked = true;
                selectAllCheckbox.indeterminate = false;
                this.isAllSelected = true;
            } else {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.indeterminate = true;
            }
        }
    }

    // 更新批量操作栏
    updateBatchOperationBar() {
        const batchOperationBar = document.getElementById('batchOperationBar');
        const selectedCount = document.getElementById('selectedCount');
        
        if (this.selectedNovels.size > 0) {
            batchOperationBar.style.display = 'block';
            selectedCount.textContent = this.selectedNovels.size;
        } else {
            batchOperationBar.style.display = 'none';
        }
    }

    // 批量删除
    async batchDelete() {
        if (this.selectedNovels.size === 0) {
            alert('请先选择要删除的作品');
            return;
        }

        const confirmed = confirm(`确定要删除选中的 ${this.selectedNovels.size} 部作品吗？此操作不可撤销！`);
        if (!confirmed) return;

        try {
            const response = await fetch('/api/novels/batch-delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({
                    novelIds: Array.from(this.selectedNovels)
                })
            });

            const result = await response.json();
            if (result.success) {
                this.showMessage(`成功删除 ${this.selectedNovels.size} 部作品`, 'success');
                this.clearSelection();
                // 刷新作品列表
                if (window.adminManager) {
                    window.adminManager.loadNovels();
                    window.adminManager.loadStats();
                }
            } else {
                this.showMessage(result.message || '批量删除失败', 'error');
            }
        } catch (error) {
            console.error('批量删除失败:', error);
            this.showMessage('批量删除失败，请检查网络连接', 'error');
        }
    }

    // 批量修改状态
    async batchUpdateStatus(status) {
        if (this.selectedNovels.size === 0) {
            alert('请先选择要修改状态的作品');
            return;
        }

        const statusText = {
            'published': '上架',
            'draft': '下架',
            'archived': '归档'
        };

        const confirmed = confirm(`确定要将选中的 ${this.selectedNovels.size} 部作品设置为"${statusText[status]}"状态吗？`);
        if (!confirmed) return;

        try {
            const response = await fetch('/api/novels/batch-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({
                    novelIds: Array.from(this.selectedNovels),
                    status: status
                })
            });

            const result = await response.json();
            if (result.success) {
                this.showMessage(`成功修改 ${this.selectedNovels.size} 部作品状态`, 'success');
                this.clearSelection();
                // 刷新作品列表
                if (window.adminManager) {
                    window.adminManager.loadNovels();
                }
            } else {
                this.showMessage(result.message || '批量修改失败', 'error');
            }
        } catch (error) {
            console.error('批量修改状态失败:', error);
            this.showMessage('批量修改状态失败，请检查网络连接', 'error');
        }
    }

    // 批量修改访问权限
    async batchUpdateAccessLevel(accessLevel) {
        if (this.selectedNovels.size === 0) {
            alert('请先选择要修改权限的作品');
            return;
        }

        const levelText = {
            'free': '免费内容',
            'premium': '高级会员',
            'vip': 'VIP专享'
        };

        const confirmed = confirm(`确定要将选中的 ${this.selectedNovels.size} 部作品设置为"${levelText[accessLevel]}"权限吗？`);
        if (!confirmed) return;

        try {
            const response = await fetch('/api/novels/batch-access', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({
                    novelIds: Array.from(this.selectedNovels),
                    accessLevel: accessLevel
                })
            });

            const result = await response.json();
            if (result.success) {
                this.showMessage(`成功修改 ${this.selectedNovels.size} 部作品权限`, 'success');
                this.clearSelection();
                // 刷新作品列表
                if (window.adminManager) {
                    window.adminManager.loadNovels();
                }
            } else {
                this.showMessage(result.message || '批量修改权限失败', 'error');
            }
        } catch (error) {
            console.error('批量修改权限失败:', error);
            this.showMessage('批量修改权限失败，请检查网络连接', 'error');
        }
    }

    // 清空选择
    clearSelection() {
        this.selectedNovels.clear();
        this.isAllSelected = false;
        
        // 取消所有复选框选中状态
        document.querySelectorAll('.novel-checkbox').forEach(cb => {
            cb.checked = false;
        });
        
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        }
        
        this.updateBatchOperationBar();
    }

    // 获取选中的作品数量
    getSelectedCount() {
        return this.selectedNovels.size;
    }

    // 获取选中的作品ID列表
    getSelectedNovels() {
        return Array.from(this.selectedNovels);
    }

    // 显示消息
    showMessage(message, type = 'info') {
        if (window.adminManager && window.adminManager.showMessage) {
            window.adminManager.showMessage(message, type);
        } else {
            // 备用消息显示
            alert(message);
        }
    }
}

// 全局批量管理器实例
window.batchManager = new BatchManager();

// 导出批量操作相关的全局函数
window.batchDelete = () => window.batchManager.batchDelete();
window.batchUpdateStatus = (status) => {
    if (!status) {
        alert('请先选择状态');
        return;
    }
    window.batchManager.batchUpdateStatus(status);
};
window.batchUpdateAccessLevel = (accessLevel) => {
    if (!accessLevel) {
        alert('请先选择权限级别');
        return;
    }
    window.batchManager.batchUpdateAccessLevel(accessLevel);
};
window.clearBatchSelection = () => window.batchManager.clearSelection();

// 辅助函数用于HTML onclick事件
window.applyBatchAccessLevel = () => {
    const select = document.getElementById('batchAccessLevel');
    const accessLevel = select ? select.value : '';
    if (!accessLevel) {
        alert('请先选择权限级别');
        return;
    }
    window.batchManager.batchUpdateAccessLevel(accessLevel);
};

window.applyBatchStatus = () => {
    const select = document.getElementById('batchStatus');
    const status = select ? select.value : '';
    if (!status) {
        alert('请先选择状态');
        return;
    }
    window.batchManager.batchUpdateStatus(status);
};