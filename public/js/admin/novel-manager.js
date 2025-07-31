// 小说管理模块
class NovelManager {
    constructor() {
        this.currentEditId = null;
        this.tags = ['#校园', '#爱情', '#悬疑', '#奇幻', '#都市', '#青春', '#治愈', '#短篇', '#bg', '#甜文'];
    }

    // 加载作品列表
    async loadNovels() {
        try {
            const response = await apiClient.get('/api/novels');
            if (!response) return;

            const { result } = response;
            if (result.success) {
                const novelsList = document.getElementById('novelsList');
                const novels = result.novels;

                if (novels.length === 0) {
                    novelsList.innerHTML = `
                        <div class="text-center py-12 text-gray-500">
                            <div class="text-4xl mb-4">📚</div>
                            <p>暂无已发布作品</p>
                        </div>
                    `;
                } else {
                    novelsList.innerHTML = novels.map(novel => `
                        <div class="bg-white rounded-lg p-4 mb-4 border border-gray-200 relative">
                            <div class="flex items-center mb-2">
                                <input type="checkbox" class="novel-checkbox mr-3" data-novel-id="${novel.id}" onchange="novelManager.updateBatchOperationBar()">
                                <div class="flex-1">
                                    <div class="flex items-start justify-between">
                                        <div class="flex-1">
                                            <h4 class="font-semibold text-lg mb-2">${novel.title}</h4>
                                            <p class="text-gray-600 mb-2">${novel.summary}</p>
                                            <div class="flex flex-wrap gap-2 mb-2">
                                                ${novel.tags ? novel.tags.map(tag => `<span class="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs">${tag}</span>`).join('') : ''}
                                                <span class="access-level-badge ${novel.accessLevel || 'free'}">${utils.getAccessLevelText(novel.accessLevel)}</span>
                                            </div>
                                            <div class="text-sm text-gray-500">
                                                <span>发布时间：${novel.publishTime}</span>
                                                <span class="ml-4">阅读量：${novel.views || 0}</span>
                                            </div>
                                        </div>
                                        <div class="flex space-x-2">
                                            <button class="btn btn-warning btn-sm" onclick="novelManager.editNovelAccess(${novel.id}, '${novel.title}', '${novel.accessLevel || 'free'}')" title="编辑权限">
                                                💎
                                            </button>
                                            <button class="btn btn-secondary btn-sm" onclick="window.open('/read?id=${novel.id}', '_blank')">预览</button>
                                            <button class="btn btn-primary btn-sm" onclick="novelManager.editNovel(${novel.id})">编辑</button>
                                            <button class="btn btn-danger btn-sm" onclick="novelManager.deleteNovel(${novel.id})">删除</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('');
                }
            }
        } catch (error) {
            console.error('加载作品列表失败:', error);
        }
    }

    // 编辑小说
    async editNovel(id) {
        try {
            const response = await apiClient.get(`/api/novels/${id}`);
            if (!response) return;

            const { result } = response;
            if (result.success) {
                const novel = result.data;
                
                // 填充表单
                document.getElementById('novelTitle').value = novel.title;
                document.getElementById('novelSummary').value = novel.summary;
                
                if (window.quill) {
                    window.quill.root.innerHTML = novel.content;
                }

                // 设置标签
                document.querySelectorAll('.tag-option').forEach(tag => {
                    if (novel.tags && novel.tags.includes(tag.textContent)) {
                        tag.classList.add('selected');
                    } else {
                        tag.classList.remove('selected');
                    }
                });

                // 设置封面
                if (novel.coverType) {
                    document.querySelector(`input[value="${novel.coverType}"]`).checked = true;
                    
                    if (novel.coverType === 'text' && novel.coverData) {
                        try {
                            const coverConfig = JSON.parse(novel.coverData);
                            document.getElementById('bgColor').value = coverConfig.bgColor || '#FFE4E1';
                            document.getElementById('textColor').value = coverConfig.textColor || '#8B4513';
                        } catch (e) {
                            document.getElementById('bgColor').value = '#FFE4E1';
                            document.getElementById('textColor').value = '#8B4513';
                        }
                        this.updateCoverPreview();
                    } else if (novel.coverType === 'image' && novel.coverData) {
                        this.updateCoverPreview(novel.coverData);
                    }
                } else {
                    // 默认设置
                    document.querySelector(`input[value="text"]`).checked = true;
                    document.getElementById('bgColor').value = '#FFE4E1';
                    document.getElementById('textColor').value = '#8B4513';
                    this.updateCoverPreview();
                }

                this.currentEditId = id;
                
                // 切换到写作页面
                document.querySelector('[data-section="write"]').click();
                utils.showMessage('作品已加载到编辑器，正在编辑模式', 'success');
                
                // 更新页面标题显示编辑状态
                document.getElementById('pageTitle').textContent = `编辑作品 - ${novel.title}`;
            }
        } catch (error) {
            console.error('加载作品失败:', error);
            utils.showMessage('加载作品失败', 'error');
        }
    }

    // 删除小说
    async deleteNovel(id) {
        if (!confirm('确定要删除这篇作品吗？此操作无法撤销！')) {
            return;
        }

        try {
            const response = await apiClient.delete(`/api/novels/${id}`);
            if (!response) return;

            const { result } = response;
            if (result.success) {
                utils.showMessage('作品已删除', 'success');
                this.loadNovels();
                if (window.statsManager) {
                    window.statsManager.loadStats();
                }
            } else {
                utils.showMessage(result.message || '删除失败', 'error');
            }
        } catch (error) {
            console.error('删除作品失败:', error);
            utils.showMessage('删除失败，请检查网络连接', 'error');
        }
    }

    // 发布小说
    async publishNovel() {
        const title = document.getElementById('novelTitle').value;
        const summary = document.getElementById('novelSummary').value;
        const content = window.quill ? window.quill.root.innerHTML : '';
        const selectedTags = Array.from(document.querySelectorAll('.tag-option.selected')).map(tag => tag.textContent);
        const coverType = document.querySelector('input[name="coverType"]:checked').value;

        // 验证必填字段
        if (!title.trim()) {
            utils.showMessage('请输入小说标题', 'error');
            return;
        }

        if (!summary.trim()) {
            utils.showMessage('请输入小说简介', 'error');
            return;
        }

        if (!content.trim() || content === '<p><br></p>') {
            utils.showMessage('请输入小说内容', 'error');
            return;
        }

        // 准备封面数据
        let coverData = null;
        if (coverType === 'text') {
            coverData = JSON.stringify({
                bgColor: document.getElementById('bgColor').value,
                textColor: document.getElementById('textColor').value
            });
        } else {
            const coverImage = document.getElementById('coverImage').files[0];
            const existingImage = document.querySelector('#coverPreview img');
            if (coverImage) {
                coverData = await utils.fileToBase64(coverImage);
            } else if (existingImage) {
                coverData = existingImage.src;
            }
        }

        const novelData = {
            title,
            summary,
            content,
            tags: selectedTags,
            coverType,
            coverData,
            accessLevel: document.getElementById('accessLevel')?.value || 'free'
        };

        try {
            // 判断是新建还是更新
            const isEdit = !!this.currentEditId;
            const url = isEdit ? `/api/novels/${this.currentEditId}` : '/api/novels';
            const method = isEdit ? 'PUT' : 'POST';
            
            const response = await apiClient.request(url, {
                method: method,
                body: JSON.stringify(novelData)
            });

            if (!response) return;

            const { result } = response;
            if (result.success) {
                utils.showMessage(isEdit ? '小说更新成功！' : '小说发布成功！', 'success');
                
                // 清空表单和编辑状态
                this.newDraft();
                this.currentEditId = null;
                
                // 删除对应的草稿
                if (window.draftManager && window.draftManager.currentDraftId) {
                    window.draftManager.deleteDraftById(window.draftManager.currentDraftId);
                    window.draftManager.currentDraftId = null;
                }
                
                // 刷新数据
                if (window.statsManager) {
                    window.statsManager.loadStats();
                }
                this.loadNovels();
            } else {
                utils.showMessage(result.message || (isEdit ? '更新失败' : '发布失败'), 'error');
            }
        } catch (error) {
            console.error('操作失败:', error);
            utils.showMessage('操作失败，请检查网络连接', 'error');
        }
    }

    // 预览小说
    previewNovel() {
        const title = document.getElementById('novelTitle').value;
        const summary = document.getElementById('novelSummary').value;
        const content = window.quill ? window.quill.root.innerHTML : '';
        const selectedTags = Array.from(document.querySelectorAll('.tag-option.selected')).map(tag => tag.textContent);

        if (!title.trim()) {
            utils.showMessage('请输入小说标题', 'error');
            return;
        }

        // 生成预览内容
        const previewHtml = `
            <div class="max-w-4xl mx-auto">
                <div class="mb-6">
                    <h1 class="text-3xl font-bold mb-4">${title}</h1>
                    <p class="text-gray-600 mb-4">${summary}</p>
                    <div class="flex flex-wrap gap-2 mb-6">
                        ${selectedTags.map(tag => `<span class="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm">${tag}</span>`).join('')}
                    </div>
                </div>
                <div class="prose max-w-none">
                    ${content}
                </div>
            </div>
        `;

        document.getElementById('previewContent').innerHTML = previewHtml;
        document.getElementById('previewModal').classList.remove('hidden');
    }

    // 关闭预览
    closePreview() {
        document.getElementById('previewModal').classList.add('hidden');
    }

    // 新建草稿
    newDraft() {
        // 清空表单
        document.getElementById('novelTitle').value = '';
        document.getElementById('novelSummary').value = '';
        if (window.quill) {
            window.quill.setText('');
        }
        
        // 清除标签选择
        document.querySelectorAll('.tag-option.selected').forEach(tag => {
            tag.classList.remove('selected');
        });
        
        // 重置封面设置
        document.querySelector('input[value="text"]').checked = true;
        document.getElementById('bgColor').value = '#FFE4E1';
        document.getElementById('textColor').value = '#8B4513';
        this.updateCoverPreview();
        
        // 清除所有状态
        if (window.draftManager) {
            window.draftManager.currentDraftId = null;
        }
        this.currentEditId = null;
        
        // 重置页面标题
        document.getElementById('pageTitle').textContent = '创作新作品';
        
        // 切换到写作页面
        document.querySelector('[data-section="write"]').click();
        utils.showMessage('已创建新草稿', 'success');
    }

    // 更新封面预览
    updateCoverPreview(imageData = null) {
        const preview = document.getElementById('coverPreview');
        const coverType = document.querySelector('input[name="coverType"]:checked').value;
        const title = document.getElementById('novelTitle').value || '小说标题';

        preview.innerHTML = '';
        preview.classList.add('has-cover');

        if (coverType === 'text') {
            const bgColor = document.getElementById('bgColor').value;
            const textColor = document.getElementById('textColor').value;
            
            const textCover = document.createElement('div');
            textCover.className = 'text-cover';
            textCover.style.backgroundColor = bgColor;
            textCover.style.color = textColor;
            textCover.textContent = title;
            
            preview.appendChild(textCover);
        } else if (imageData) {
            const img = document.createElement('img');
            img.src = imageData;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            preview.appendChild(img);
        } else {
            preview.innerHTML = '<span>请选择图片</span>';
            preview.classList.remove('has-cover');
        }
    }

    // 批量操作相关方法
    updateBatchOperationBar() {
        const selectedCheckboxes = document.querySelectorAll('.novel-checkbox:checked');
        const selectedCount = selectedCheckboxes.length;
        
        const selectedCountElement = document.getElementById('selectedCount');
        if (selectedCountElement) {
            selectedCountElement.textContent = selectedCount;
        }
        
        const batchBar = document.getElementById('batchOperationBar');
        if (batchBar) {
            if (selectedCount === 0) {
                batchBar.style.display = 'none';
            } else {
                batchBar.style.display = 'block';
            }
        }
    }

    selectAllNovels() {
        const checkboxes = document.querySelectorAll('.novel-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
        this.updateBatchOperationBar();
    }

    clearSelection() {
        const checkboxes = document.querySelectorAll('.novel-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        this.updateBatchOperationBar();
    }

    hideBatchOperationBar() {
        const batchBar = document.getElementById('batchOperationBar');
        if (batchBar) {
            batchBar.style.display = 'none';
        }
        this.clearSelection();
    }

    // 批量应用访问级别
    async applyBatchAccessLevel() {
        const selectedCheckboxes = document.querySelectorAll('.novel-checkbox:checked');
        const accessLevel = document.getElementById('batchAccessLevel')?.value;
        
        if (selectedCheckboxes.length === 0) {
            alert('请选择要修改的作品');
            return;
        }
        
        if (!accessLevel) {
            alert('请选择权限级别');
            return;
        }
        
        const novelIds = Array.from(selectedCheckboxes).map(cb => parseInt(cb.dataset.novelId));
        
        if (confirm(`确定要将 ${novelIds.length} 部作品修改为 ${utils.getAccessLevelDisplayName(accessLevel)} 吗？`)) {
            try {
                const response = await apiClient.put('/api/novels/batch-access', {
                    novelIds: novelIds,
                    accessLevel: accessLevel
                });
                
                if (response && response.result.success) {
                    alert('批量修改成功');
                    this.loadNovels();
                    this.hideBatchOperationBar();
                } else {
                    alert('修改失败，请稍后重试');
                }
            } catch (error) {
                console.error('批量修改失败:', error);
                alert('修改失败，请稍后重试');
            }
        }
    }

    // 单个作品权限编辑
    editNovelAccess(novelId, title, currentAccess) {
        window.currentEditingNovelId = novelId;
        
        document.getElementById('editNovelTitle').value = title;
        document.getElementById('editNovelAccessLevel').value = currentAccess || 'free';
        
        this.updateAccessLevelPreview(currentAccess || 'free');
        
        document.getElementById('novelAccessModal').classList.remove('hidden');
        
        // 绑定选择框变化事件
        const accessSelect = document.getElementById('editNovelAccessLevel');
        if (accessSelect) {
            accessSelect.onchange = () => {
                this.updateAccessLevelPreview(accessSelect.value);
            };
        }
    }

    // 更新访问级别预览
    updateAccessLevelPreview(accessLevel) {
        const preview = document.getElementById('editAccessLevelPreview');
        if (!preview) return;
        
        const configs = {
            'free': {
                icon: '🌍',
                color: 'text-green-500',
                bgColor: 'border-green-200 bg-green-50',
                titleColor: 'text-green-700',
                title: '免费内容',
                desc: '所有访问者都可以免费阅读此内容，包括未登录用户'
            },
            'premium': {
                icon: '💎',
                color: 'text-blue-500',
                bgColor: 'border-blue-200 bg-blue-50',
                titleColor: 'text-blue-700',
                title: '高级会员',
                desc: '需要高级会员或VIP会员权限才能访问此内容'
            },
            'vip': {
                icon: '🏆',
                color: 'text-yellow-500',
                bgColor: 'border-yellow-200 bg-yellow-50',
                titleColor: 'text-yellow-700',
                title: 'VIP专享',
                desc: '仅限VIP会员可以访问此内容，享受最高级别的阅读体验'
            }
        };
        
        const config = configs[accessLevel] || configs['free'];
        
        preview.className = `access-level-preview mb-4 p-3 rounded-lg border ${config.bgColor}`;
        preview.innerHTML = `
            <div class="flex items-start">
                <span class="${config.color} mr-2">${config.icon}</span>
                <div>
                    <strong class="${config.titleColor}">${config.title}</strong>
                    <p class="text-sm text-gray-600 mt-1">${config.desc}</p>
                </div>
            </div>
        `;
    }

    // 保存小说访问权限
    async saveNovelAccess() {
        if (!window.currentEditingNovelId) return;
        
        const accessLevel = document.getElementById('editNovelAccessLevel')?.value;
        
        try {
            const response = await apiClient.put(`/api/novels/${window.currentEditingNovelId}/access`, {
                accessLevel: accessLevel
            });
            
            if (response && response.result.success) {
                alert('权限设置保存成功');
                this.closeNovelAccessModal();
                this.loadNovels();
            } else {
                alert('保存失败，请稍后重试');
            }
        } catch (error) {
            console.error('保存权限设置失败:', error);
            alert('保存失败，请稍后重试');
        }
    }

    // 关闭小说权限模态框
    closeNovelAccessModal() {
        document.getElementById('novelAccessModal').classList.add('hidden');
        window.currentEditingNovelId = null;
    }

    // 刷新小说列表
    refreshNovelsList() {
        this.loadNovels();
        utils.showMessage('作品列表已刷新', 'success');
    }
}

// 创建全局小说管理实例
window.novelManager = new NovelManager();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NovelManager;
}