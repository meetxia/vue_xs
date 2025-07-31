// 草稿管理模块
class DraftManager {
    constructor() {
        this.drafts = JSON.parse(localStorage.getItem('novelDrafts') || '[]');
        this.currentDraftId = null;
        this.autoSaveInterval = null;
        this.init();
    }

    init() {
        this.initAutoSave();
    }

    // 初始化自动保存
    initAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            this.autoSave();
        }, 30000); // 每30秒自动保存
    }

    // 自动保存草稿
    autoSave() {
        if (!window.quill) return;

        const title = document.getElementById('novelTitle')?.value;
        const content = window.quill.root.innerHTML;
        
        if (title?.trim() || content.trim() !== '<p><br></p>') {
            this.saveDraftToLocal();
            this.updateLastSaved('自动保存');
        }
    }

    // 手动保存
    saveDraft() {
        this.saveDraftToLocal();
        this.updateLastSaved('手动保存');
        utils.showMessage('草稿已保存', 'success');
    }

    // 保存草稿到本地存储
    saveDraftToLocal() {
        const title = document.getElementById('novelTitle')?.value || '无标题';
        const summary = document.getElementById('novelSummary')?.value || '';
        const content = window.quill ? window.quill.root.innerHTML : '';
        const selectedTags = Array.from(document.querySelectorAll('.tag-option.selected')).map(tag => tag.textContent);
        
        const draft = {
            id: this.currentDraftId || Date.now().toString(),
            title,
            summary,
            content,
            tags: selectedTags,
            coverType: document.querySelector('input[name="coverType"]:checked')?.value || 'text',
            bgColor: document.getElementById('bgColor')?.value || '#FFE4E1',
            textColor: document.getElementById('textColor')?.value || '#8B4513',
            savedAt: new Date().toISOString(),
            wordCount: utils.getWordCount(content)
        };

        // 如果是新草稿，添加到列表
        if (!this.currentDraftId) {
            this.drafts.unshift(draft);
            this.currentDraftId = draft.id;
        } else {
            // 更新现有草稿
            const index = this.drafts.findIndex(d => d.id === this.currentDraftId);
            if (index !== -1) {
                this.drafts[index] = draft;
            }
        }

        // 限制草稿数量
        this.drafts = this.drafts.slice(0, 50);
        
        localStorage.setItem('novelDrafts', JSON.stringify(this.drafts));
    }

    // 加载草稿列表
    loadDrafts() {
        const draftsList = document.getElementById('draftsList');
        if (!draftsList) return;
        
        if (this.drafts.length === 0) {
            draftsList.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <div class="text-4xl mb-4">📝</div>
                    <p>暂无草稿</p>
                    <button class="btn btn-primary mt-4" onclick="draftManager.newDraft()">开始创作</button>
                </div>
            `;
            return;
        }

        draftsList.innerHTML = this.drafts.map(draft => `
            <div class="draft-item" data-draft-id="${draft.id}">
                <h4 class="font-semibold text-lg mb-2">${draft.title}</h4>
                <p class="text-gray-600 mb-2">${draft.summary || '暂无简介'}</p>
                <div class="flex flex-wrap gap-2 mb-2">
                    ${draft.tags.map(tag => `<span class="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs">${tag}</span>`).join('')}
                </div>
                <div class="draft-meta">
                    <span>保存时间：${new Date(draft.savedAt).toLocaleString()}</span>
                    <span class="ml-4">字数：${draft.wordCount}字</span>
                </div>
                <div class="mt-3 flex space-x-2">
                    <button class="btn btn-primary btn-sm" onclick="draftManager.loadDraft('${draft.id}')">继续编辑</button>
                    <button class="btn btn-secondary btn-sm" onclick="draftManager.duplicateDraft('${draft.id}')">复制</button>
                    <button class="btn btn-warning btn-sm" onclick="draftManager.exportDraft('${draft.id}')">导出</button>
                    <button class="btn btn-danger btn-sm" onclick="draftManager.deleteDraft('${draft.id}')">删除</button>
                </div>
            </div>
        `).join('');
    }

    // 新建草稿
    newDraft() {
        // 清空表单
        const titleInput = document.getElementById('novelTitle');
        const summaryInput = document.getElementById('novelSummary');
        
        if (titleInput) titleInput.value = '';
        if (summaryInput) summaryInput.value = '';
        
        if (window.quill) {
            window.quill.setText('');
        }
        
        // 清除标签选择
        document.querySelectorAll('.tag-option.selected').forEach(tag => {
            tag.classList.remove('selected');
        });
        
        // 重置封面设置
        const textRadio = document.querySelector('input[value="text"]');
        const bgColorInput = document.getElementById('bgColor');
        const textColorInput = document.getElementById('textColor');
        
        if (textRadio) textRadio.checked = true;
        if (bgColorInput) bgColorInput.value = '#FFE4E1';
        if (textColorInput) textColorInput.value = '#8B4513';
        
        if (window.novelManager) {
            window.novelManager.updateCoverPreview();
        }
        
        // 清除所有状态
        this.currentDraftId = null;
        if (window.novelManager) {
            window.novelManager.currentEditId = null;
        }
        
        // 重置页面标题
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = '创作新作品';
        }
        
        // 切换到写作页面
        const writeSection = document.querySelector('[data-section="write"]');
        if (writeSection) writeSection.click();
        
        utils.showMessage('已创建新草稿', 'success');
        
        // 标记为已保存状态
        this.markSaved();
    }

    // 加载草稿
    loadDraft(draftId) {
        const draft = this.drafts.find(d => d.id === draftId);
        if (!draft) return;

        // 填充表单
        const titleInput = document.getElementById('novelTitle');
        const summaryInput = document.getElementById('novelSummary');
        
        if (titleInput) titleInput.value = draft.title;
        if (summaryInput) summaryInput.value = draft.summary || '';
        
        if (window.quill) {
            window.quill.root.innerHTML = draft.content;
        }

        // 设置标签
        document.querySelectorAll('.tag-option').forEach(tag => {
            if (draft.tags.includes(tag.textContent)) {
                tag.classList.add('selected');
            } else {
                tag.classList.remove('selected');
            }
        });

        // 设置封面
        const coverTypeRadio = document.querySelector(`input[value="${draft.coverType}"]`);
        const bgColorInput = document.getElementById('bgColor');
        const textColorInput = document.getElementById('textColor');
        
        if (coverTypeRadio) coverTypeRadio.checked = true;
        if (bgColorInput) bgColorInput.value = draft.bgColor || '#FFE4E1';
        if (textColorInput) textColorInput.value = draft.textColor || '#8B4513';
        
        if (window.novelManager) {
            window.novelManager.updateCoverPreview();
        }

        this.currentDraftId = draftId;
        
        // 切换到写作页面
        const writeSection = document.querySelector('[data-section="write"]');
        if (writeSection) writeSection.click();
        
        utils.showMessage('草稿已加载', 'success');
    }

    // 删除草稿
    deleteDraft(draftId) {
        if (confirm('确定要删除这个草稿吗？')) {
            this.deleteDraftById(draftId);
            utils.showMessage('草稿已删除', 'success');
        }
    }

    // 根据ID删除草稿（内部方法）
    deleteDraftById(draftId) {
        this.drafts = this.drafts.filter(d => d.id !== draftId);
        localStorage.setItem('novelDrafts', JSON.stringify(this.drafts));
        this.loadDrafts();
        
        // 如果删除的是当前编辑的草稿，清除状态
        if (this.currentDraftId === draftId) {
            this.currentDraftId = null;
        }
    }

    // 复制草稿
    duplicateDraft(draftId) {
        const draft = this.drafts.find(d => d.id === draftId);
        if (!draft) return;

        const newDraft = {
            ...draft,
            id: Date.now().toString(),
            title: draft.title + ' (副本)',
            savedAt: new Date().toISOString()
        };

        this.drafts.unshift(newDraft);
        localStorage.setItem('novelDrafts', JSON.stringify(this.drafts));
        this.loadDrafts();
        
        utils.showMessage('草稿已复制', 'success');
    }

    // 导出草稿
    exportDraft(draftId) {
        const draft = this.drafts.find(d => d.id === draftId);
        if (!draft) return;

        const exportData = {
            title: draft.title,
            summary: draft.summary,
            content: draft.content,
            tags: draft.tags,
            coverType: draft.coverType,
            bgColor: draft.bgColor,
            textColor: draft.textColor,
            wordCount: draft.wordCount,
            exportTime: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${draft.title}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        utils.showMessage('草稿已导出', 'success');
    }

    // 导入草稿
    importDraft(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                const newDraft = {
                    id: Date.now().toString(),
                    title: importData.title + ' (导入)',
                    summary: importData.summary || '',
                    content: importData.content || '',
                    tags: importData.tags || [],
                    coverType: importData.coverType || 'text',
                    bgColor: importData.bgColor || '#FFE4E1',
                    textColor: importData.textColor || '#8B4513',
                    savedAt: new Date().toISOString(),
                    wordCount: utils.getWordCount(importData.content || '')
                };

                this.drafts.unshift(newDraft);
                localStorage.setItem('novelDrafts', JSON.stringify(this.drafts));
                this.loadDrafts();
                
                utils.showMessage('草稿导入成功', 'success');
            } catch (error) {
                console.error('导入草稿失败:', error);
                utils.showMessage('导入失败，文件格式不正确', 'error');
            }
        };
        reader.readAsText(file);
    }

    // 搜索草稿
    searchDrafts(keyword) {
        if (!keyword.trim()) {
            this.loadDrafts();
            return;
        }

        const filteredDrafts = this.drafts.filter(draft => 
            draft.title.toLowerCase().includes(keyword.toLowerCase()) ||
            draft.summary.toLowerCase().includes(keyword.toLowerCase()) ||
            draft.tags.some(tag => tag.toLowerCase().includes(keyword.toLowerCase()))
        );

        this.renderSearchResults(filteredDrafts, keyword);
    }

    // 渲染搜索结果
    renderSearchResults(drafts, keyword) {
        const draftsList = document.getElementById('draftsList');
        if (!draftsList) return;

        if (drafts.length === 0) {
            draftsList.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <div class="text-4xl mb-4">🔍</div>
                    <p>未找到包含 "${keyword}" 的草稿</p>
                    <button class="btn btn-secondary mt-4" onclick="draftManager.loadDrafts()">显示所有草稿</button>
                </div>
            `;
            return;
        }

        // 高亮显示搜索关键词
        const highlightText = (text, keyword) => {
            const regex = new RegExp(`(${keyword})`, 'gi');
            return text.replace(regex, '<mark>$1</mark>');
        };

        draftsList.innerHTML = drafts.map(draft => `
            <div class="draft-item" data-draft-id="${draft.id}">
                <h4 class="font-semibold text-lg mb-2">${highlightText(draft.title, keyword)}</h4>
                <p class="text-gray-600 mb-2">${highlightText(draft.summary || '暂无简介', keyword)}</p>
                <div class="flex flex-wrap gap-2 mb-2">
                    ${draft.tags.map(tag => `<span class="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs">${highlightText(tag, keyword)}</span>`).join('')}
                </div>
                <div class="draft-meta">
                    <span>保存时间：${new Date(draft.savedAt).toLocaleString()}</span>
                    <span class="ml-4">字数：${draft.wordCount}字</span>
                </div>
                <div class="mt-3 flex space-x-2">
                    <button class="btn btn-primary btn-sm" onclick="draftManager.loadDraft('${draft.id}')">继续编辑</button>
                    <button class="btn btn-secondary btn-sm" onclick="draftManager.duplicateDraft('${draft.id}')">复制</button>
                    <button class="btn btn-warning btn-sm" onclick="draftManager.exportDraft('${draft.id}')">导出</button>
                    <button class="btn btn-danger btn-sm" onclick="draftManager.deleteDraft('${draft.id}')">删除</button>
                </div>
            </div>
        `).join('');
    }

    // 批量删除草稿
    batchDeleteDrafts(draftIds) {
        if (!draftIds.length) return;

        if (confirm(`确定要删除选中的 ${draftIds.length} 个草稿吗？`)) {
            this.drafts = this.drafts.filter(d => !draftIds.includes(d.id));
            localStorage.setItem('novelDrafts', JSON.stringify(this.drafts));
            this.loadDrafts();
            
            utils.showMessage(`已删除 ${draftIds.length} 个草稿`, 'success');
        }
    }

    // 标记为未保存
    markUnsaved() {
        this.updateLastSaved('未保存');
    }

    // 标记为已保存
    markSaved() {
        this.updateLastSaved('已保存');
    }

    // 更新最后保存时间
    updateLastSaved(status) {
        const lastSavedElement = document.getElementById('lastSaved');
        if (!lastSavedElement) return;

        if (status === '未保存') {
            lastSavedElement.textContent = status;
            lastSavedElement.className = 'text-sm text-red-500';
        } else {
            lastSavedElement.textContent = `${status} - ${new Date().toLocaleTimeString()}`;
            lastSavedElement.className = 'text-sm text-green-500';
        }
    }

    // 获取草稿统计
    getDraftStats() {
        const totalDrafts = this.drafts.length;
        const totalWords = this.drafts.reduce((sum, draft) => sum + (draft.wordCount || 0), 0);
        const recentDrafts = this.drafts.filter(draft => {
            const draftDate = new Date(draft.savedAt);
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return draftDate > sevenDaysAgo;
        }).length;

        return {
            totalDrafts,
            totalWords,
            recentDrafts,
            averageWords: totalDrafts > 0 ? Math.round(totalWords / totalDrafts) : 0
        };
    }

    // 清理过期草稿
    cleanupOldDrafts(daysOld = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const beforeCount = this.drafts.length;
        this.drafts = this.drafts.filter(draft => {
            const draftDate = new Date(draft.savedAt);
            return draftDate > cutoffDate;
        });

        if (this.drafts.length < beforeCount) {
            localStorage.setItem('novelDrafts', JSON.stringify(this.drafts));
            const removedCount = beforeCount - this.drafts.length;
            utils.showMessage(`已清理 ${removedCount} 个超过 ${daysOld} 天的草稿`, 'success');
        }
    }

    // 销毁
    destroy() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
    }
}

// 创建全局草稿管理实例
window.draftManager = new DraftManager();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DraftManager;
}