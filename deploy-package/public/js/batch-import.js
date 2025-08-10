class BatchImportManager {
    constructor() {
        this.files = [];
        this.analysisResults = [];
        this.currentStep = 1;
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateStepDisplay();
    }

    bindEvents() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const clearBtn = document.getElementById('clearBtn');
        const analyzeBtn = document.getElementById('analyzeBtn');
        const backBtn = document.getElementById('backBtn');
        const importBtn = document.getElementById('importBtn');

        // 文件上传区域点击事件
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        // 文件选择事件
        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // 拖拽事件
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });

        // 按钮事件
        clearBtn.addEventListener('click', () => this.clearFiles());
        analyzeBtn.addEventListener('click', () => this.analyzeFiles());
        backBtn.addEventListener('click', () => this.backToUpload());
        importBtn.addEventListener('click', () => this.importNovels());
    }

    handleFiles(fileList) {
        const newFiles = Array.from(fileList).filter(file => {
            // 检查文件格式
            if (!file.name.toLowerCase().endsWith('.txt')) {
                this.showToast('只支持TXT格式的文件', 'error');
                return false;
            }

            // 检查文件大小 (50MB)
            if (file.size > 50 * 1024 * 1024) {
                this.showToast(`文件 ${file.name} 超过50MB限制`, 'error');
                return false;
            }

            // 检查是否已存在
            if (this.files.some(f => f.name === file.name)) {
                this.showToast(`文件 ${file.name} 已存在`, 'warning');
                return false;
            }

            return true;
        });

        // 检查总文件数量
        if (this.files.length + newFiles.length > 20) {
            this.showToast('最多只能上传20个文件', 'error');
            return;
        }

        this.files.push(...newFiles);
        this.updateFileList();
        this.updateAnalyzeButton();
    }

    updateFileList() {
        const fileList = document.getElementById('fileList');
        
        if (this.files.length === 0) {
            fileList.innerHTML = '';
            return;
        }

        fileList.innerHTML = this.files.map((file, index) => `
            <div class="file-item">
                <div class="file-info">
                    <span class="file-icon">📄</span>
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${this.formatFileSize(file.size)}</span>
                </div>
                <div class="file-actions">
                    <span class="file-status status-pending">待处理</span>
                    <button onclick="(window.batchImportManager || batchImport).removeFile(${index})" style="margin-left: 10px; background: none; border: none; color: #f44336; cursor: pointer;">✕</button>
                </div>
            </div>
        `).join('');
    }

    removeFile(index) {
        this.files.splice(index, 1);
        this.updateFileList();
        this.updateAnalyzeButton();
    }

    clearFiles() {
        this.files = [];
        this.updateFileList();
        this.updateAnalyzeButton();
        document.getElementById('fileInput').value = '';
    }

    updateAnalyzeButton() {
        const analyzeBtn = document.getElementById('analyzeBtn');
        analyzeBtn.disabled = this.files.length === 0;
    }

    async analyzeFiles() {
        if (this.files.length === 0) return;

        this.showLoading('正在分析文件内容...');
        this.updateStep(2);

        try {
            const formData = new FormData();
            this.files.forEach(file => {
                formData.append('novels', file);
            });

            // 更新文件状态为处理中
            this.updateFileStatuses('processing');

            const response = await fetch('/api/novels/batch-upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.analysisResults = result.data.results;
                this.showAnalysisResults();
                this.showToast(`成功分析 ${result.data.successCount} 个文件`, 'success');
            } else {
                throw new Error(result.message || '分析失败');
            }

        } catch (error) {
            console.error('分析失败:', error);
            this.showToast('分析失败: ' + error.message, 'error');
            this.updateStep(1);
        } finally {
            this.hideLoading();
        }
    }

    updateFileStatuses(status) {
        const statusElements = document.querySelectorAll('.file-status');
        statusElements.forEach(el => {
            el.className = `file-status status-${status}`;
            el.textContent = this.getStatusText(status);
        });
    }

    getStatusText(status) {
        const statusMap = {
            'pending': '待处理',
            'processing': '处理中',
            'success': '成功',
            'error': '失败'
        };
        return statusMap[status] || status;
    }

    showAnalysisResults() {
        document.getElementById('uploadSection').style.display = 'none';
        document.getElementById('analysisResults').style.display = 'block';

        const resultsList = document.getElementById('resultsList');
        resultsList.innerHTML = this.analysisResults.map((result, index) => {
            if (!result.success) {
                return `
                    <div class="result-item">
                        <div class="result-header">
                            <span class="result-title">${result.filename}</span>
                            <span class="file-status status-error">分析失败</span>
                        </div>
                        <div class="result-details">
                            <p style="color: #f44336;">${result.error}</p>
                        </div>
                    </div>
                `;
            }

            const data = result.data;
            const confidence = Math.round(data.analysis.categoryConfidence * 100);
            
            return `
                <div class="result-item">
                    <div class="result-header" onclick="this.nextElementSibling.classList.toggle('show')">
                        <span class="result-title">${data.title}</span>
                        <span class="result-confidence">置信度: ${confidence}%</span>
                    </div>
                    <div class="result-details">
                        <div class="detail-section">
                            <div class="detail-label">标题 (来源: ${data.analysis.titleSource === 'content' ? '内容' : '文件名'})</div>
                            <input type="text" class="edit-field" value="${data.title}" 
                                onchange="batchImport.updateResult(${index}, 'title', this.value)">
                        </div>
                        
                        <div class="detail-section">
                            <div class="detail-label">分类</div>
                            <select class="edit-field" onchange="batchImport.updateResult(${index}, 'category', this.value)">
                                <option value="">请选择分类</option>
                                <option value="玄幻" ${data.category === '玄幻' ? 'selected' : ''}>玄幻</option>
                                <option value="都市" ${data.category === '都市' ? 'selected' : ''}>都市</option>
                                <option value="言情" ${data.category === '言情' ? 'selected' : ''}>言情</option>
                                <option value="科幻" ${data.category === '科幻' ? 'selected' : ''}>科幻</option>
                                <option value="历史" ${data.category === '历史' ? 'selected' : ''}>历史</option>
                                <option value="悬疑" ${data.category === '悬疑' ? 'selected' : ''}>悬疑</option>
                                <option value="系统" ${data.category === '系统' ? 'selected' : ''}>系统</option>
                                <option value="校园" ${data.category === '校园' ? 'selected' : ''}>校园</option>
                            </select>
                        </div>
                        
                        <div class="detail-section">
                            <div class="detail-label">标签</div>
                            <div class="tag-list">
                                ${data.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                            </div>
                            <input type="text" class="edit-field" placeholder="添加新标签，用逗号分隔"
                                onchange="batchImport.updateTags(${index}, this.value)">
                        </div>
                        
                        <div class="detail-section">
                            <div class="detail-label">简介</div>
                            <textarea class="edit-field" rows="4" 
                                onchange="batchImport.updateResult(${index}, 'summary', this.value)">${data.summary}</textarea>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.updateStep(3);
    }

    updateResult(index, field, value) {
        if (this.analysisResults[index] && this.analysisResults[index].success) {
            this.analysisResults[index].data[field] = value;
        }
    }

    updateTags(index, tagsString) {
        if (this.analysisResults[index] && this.analysisResults[index].success) {
            const newTags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
            const existingTags = this.analysisResults[index].data.tags;
            this.analysisResults[index].data.tags = [...new Set([...existingTags, ...newTags])];
            
            // 重新渲染标签显示
            const tagList = document.querySelectorAll('.tag-list')[index];
            if (tagList) {
                tagList.innerHTML = this.analysisResults[index].data.tags
                    .map(tag => `<span class="tag">${tag}</span>`).join('');
            }
        }
    }

    backToUpload() {
        document.getElementById('analysisResults').style.display = 'none';
        document.getElementById('uploadSection').style.display = 'block';
        this.updateStep(1);
    }

    async importNovels() {
        const validResults = this.analysisResults.filter(result => result.success);

        if (validResults.length === 0) {
            this.showToast('没有可导入的小说', 'warning');
            return;
        }

        console.log('开始导入小说，有效结果数量:', validResults.length);
        this.showLoading('正在导入小说...');

        try {
            const novels = validResults.map(result => result.data);
            console.log('准备导入的小说数据:', novels);

            const response = await fetch('/api/novels/batch-import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ novels })
            });

            console.log('服务器响应状态:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('服务器响应错误:', errorText);
                throw new Error(`服务器错误 (${response.status}): ${errorText}`);
            }

            const result = await response.json();
            console.log('服务器响应结果:', result);

            if (result.success) {
                this.showToast(result.message, 'success');

                // 显示详细的导入结果
                if (result.data && result.data.results) {
                    const failedResults = result.data.results.filter(r => !r.success);
                    if (failedResults.length > 0) {
                        console.log('部分导入失败的小说:', failedResults);
                        let failedMessage = '以下小说导入失败：\n';
                        failedResults.forEach(r => {
                            failedMessage += `• ${r.title}: ${r.error}\n`;
                        });
                        this.showToast(failedMessage, 'warning');
                    }
                }

                // 显示导入结果
                setTimeout(() => {
                    if (window.adminManager) {
                        // 在后台管理系统中，询问是否切换到作品管理页面
                        if (confirm('导入成功！是否切换到作品管理页面查看？')) {
                            // 切换到作品管理页面
                            const manageLink = document.querySelector('[data-section="manage"]');
                            if (manageLink) {
                                manageLink.click();
                            }
                        } else {
                            this.resetImport();
                        }
                    } else {
                        // 在独立页面中，跳转到首页
                        if (confirm('导入成功！是否查看导入的小说？')) {
                            window.location.href = 'index.html';
                        } else {
                            this.resetImport();
                        }
                    }
                }, 1000);
            } else {
                throw new Error(result.message || '导入失败');
            }

        } catch (error) {
            console.error('导入过程中发生错误:', error);
            console.error('错误堆栈:', error.stack);

            let errorMessage = '导入失败: ';
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage += '网络连接失败，请检查服务器是否正常运行';
            } else if (error.message.includes('JSON')) {
                errorMessage += '服务器响应格式错误';
            } else {
                errorMessage += error.message || '未知错误';
            }

            this.showToast(errorMessage, 'error');
        } finally {
            this.hideLoading();
        }
    }

    resetImport() {
        this.files = [];
        this.analysisResults = [];
        this.clearFiles();
        this.backToUpload();
        this.updateStep(1);
    }

    updateStep(step) {
        this.currentStep = step;
        
        // 更新步骤显示
        for (let i = 1; i <= 3; i++) {
            const stepElement = document.getElementById(`step${i}`);
            stepElement.classList.remove('active', 'completed');
            
            if (i < step) {
                stepElement.classList.add('completed');
            } else if (i === step) {
                stepElement.classList.add('active');
            }
        }
    }

    showLoading(text) {
        document.getElementById('loadingText').textContent = text;
        document.getElementById('loadingOverlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    showToast(message, type = 'success') {
        // 如果在后台管理系统中，使用后台的消息提示系统
        if (window.adminManager && window.adminManager.showMessage) {
            window.adminManager.showMessage(message, type);
            return;
        }

        // 否则使用独立的toast系统
        // 移除现有的toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        // 创建新的toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // 显示toast
        setTimeout(() => toast.classList.add('show'), 100);

        // 自动隐藏
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// 全局变量，用于在后台管理系统中使用
let batchImport = null;

// 如果是独立的批量导入页面，则自动初始化
if (window.location.pathname.includes('batch-import.html')) {
    // 初始化批量导入管理器
    batchImport = new BatchImportManager();

    // 页面加载完成后的初始化
    document.addEventListener('DOMContentLoaded', function() {
        console.log('批量导入页面已加载');
    });
}