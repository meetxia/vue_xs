// 管理后台主JavaScript文件
class AdminManager {
    constructor() {
        this.quill = null;
        this.currentDraftId = null;
        this.currentEditId = null;
        this.autoSaveInterval = null;
        this.tags = ['#校园', '#爱情', '#悬疑', '#奇幻', '#都市', '#青春', '#治愈', '#短篇', '#bg', '#甜文'];
        this.drafts = JSON.parse(localStorage.getItem('novelDrafts') || '[]');
        
        // 用户管理相关属性
        this.users = [];
        this.currentUserPage = 1;
        this.userPageSize = 20;
        this.userSearchTerm = '';
        this.userRefreshInterval = null;
        
        // 检查登录状态
        if (!this.checkLoginStatus()) {
            return;
        }
        
        this.init();
    }

    // 检查登录状态
    checkLoginStatus() {
        const token = localStorage.getItem('adminToken');
        const loginTime = localStorage.getItem('adminLoginTime');
        
        if (!token || !loginTime) {
            this.redirectToLogin('未登录');
            return false;
        }
        
        const now = Date.now();
        const loginTimestamp = parseInt(loginTime);
        const oneDay = 24 * 60 * 60 * 1000; // 24小时
        
        if (now - loginTimestamp >= oneDay) {
            this.clearLoginData();
            this.redirectToLogin('登录已过期');
            return false;
        }
        
        return true;
    }

    // 清除登录数据
    clearLoginData() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminLoginTime');
        localStorage.removeItem('adminUsername');
    }

    // 重定向到登录页面
    redirectToLogin(message = '请先登录') {
        alert(message + '，即将跳转到登录页面');
        window.location.href = 'admin-login.html';
    }

    init() {
        this.initQuillEditor();
        this.initSidebar();
        this.initTagSelector();
        this.initCoverPreview();
        this.initAutoSave();
        this.loadStats();
        this.loadNovels();
        this.loadDrafts();
        this.showWelcomeMessage();
    }

    // 退出登录
    logout() {
        if (confirm('确定要退出登录吗？')) {
            this.clearLoginData();
            this.showMessage('已退出登录', 'success');
            setTimeout(() => {
                window.location.href = 'admin-login.html';
            }, 1000);
        }
    }

    // 显示欢迎消息
    showWelcomeMessage() {
        const username = localStorage.getItem('adminUsername');
        if (username) {
            this.showMessage(`欢迎回来，${username}！`, 'success');
        }
    }

    // 初始化富文本编辑器
    initQuillEditor() {
        if (typeof Quill === 'undefined') {
            console.error('Quill编辑器未加载');
            return;
        }

        const toolbarOptions = [
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ 'header': 1 }, { 'header': 2 }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'script': 'sub'}, { 'script': 'super' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            [{ 'direction': 'rtl' }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'font': [] }],
            [{ 'align': [] }],
            ['clean']
        ];

        this.quill = new Quill('#quillEditor', {
            theme: 'snow',
            placeholder: '开始创作您的小说...',
            modules: {
                toolbar: toolbarOptions
            }
        });

        // 监听内容变化
        this.quill.on('text-change', () => {
            this.markUnsaved();
        });
    }

    // 初始化侧边栏导航
    initSidebar() {
        const sidebarItems = document.querySelectorAll('.sidebar-item');
        const sections = document.querySelectorAll('.content-section');

        sidebarItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // 移除所有活动状态
                sidebarItems.forEach(si => si.classList.remove('active'));
                sections.forEach(section => section.classList.remove('active'));
                
                // 添加当前活动状态
                item.classList.add('active');
                const sectionId = item.getAttribute('data-section');
                const section = document.getElementById(`${sectionId}-section`);
                
                if (section) {
                    section.classList.add('active');
                    this.updatePageTitle(sectionId);
                    
                    // 如果切换到统计页面，刷新数据
                    if (sectionId === 'stats') {
                        this.loadStats();
                    }
                    
                    // 如果切换到作品管理，刷新列表
                    if (sectionId === 'manage') {
                        this.loadNovels();
                    }
                    
                    // 如果切换到草稿箱，刷新草稿
                    if (sectionId === 'drafts') {
                        this.loadDrafts();
                    }
                    
                    // 如果切换到用户管理，刷新用户数据
                    if (sectionId === 'users') {
                        this.loadUsers();
                        this.loadUserStats();
                    }
                }
            });
        });
    }

    // 更新页面标题
    updatePageTitle(section) {
        const titles = {
            write: '创作新作品',
            drafts: '我的草稿',
            manage: '作品管理',
            users: '用户管理',
            stats: '数据统计',
            settings: '系统设置'
        };
        
        document.getElementById('pageTitle').textContent = titles[section] || '管理后台';
    }

    // 初始化标签选择器
    initTagSelector() {
        const tagSelector = document.getElementById('tagSelector');
        tagSelector.innerHTML = '';
        
        // 按分类组织标签
        const tagCategories = {
            "男主类型": ["#占有欲男主", "#年下小奶狗", "#偏执", "#温柔攻", "#霸道总裁"],
            "题材类型": ["#bg", "#短篇", "#小甜文", "#姐弟恋", "#年下恋", "#人外文", "#校园", "#职场"],
            "连载状态": ["#连载中", "#已完结", "#日更", "#周更", "#短篇完结"]
        };

        Object.entries(tagCategories).forEach(([category, tags]) => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'mb-3';
            
            const categoryTitle = document.createElement('div');
            categoryTitle.className = 'text-sm font-medium text-gray-700 mb-2';
            categoryTitle.textContent = category;
            categoryDiv.appendChild(categoryTitle);
            
            const tagsDiv = document.createElement('div');
            tagsDiv.className = 'flex flex-wrap gap-2';
            
            tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = 'tag-option';
                tagElement.textContent = tag;
                tagElement.addEventListener('click', () => {
                    tagElement.classList.toggle('selected');
                    this.markUnsaved();
                });
                tagsDiv.appendChild(tagElement);
            });
            
            categoryDiv.appendChild(tagsDiv);
            tagSelector.appendChild(categoryDiv);
        });
    }

    // 初始化封面预览
    initCoverPreview() {
        const coverTypeRadios = document.querySelectorAll('input[name="coverType"]');
        const textSettings = document.getElementById('textCoverSettings');
        const imageSettings = document.getElementById('imageCoverSettings');
        const bgColorInput = document.getElementById('bgColor');
        const textColorInput = document.getElementById('textColor');
        const coverImageInput = document.getElementById('coverImage');

        // 监听封面类型切换
        coverTypeRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.value === 'text') {
                    textSettings.style.display = 'block';
                    imageSettings.style.display = 'none';
                } else {
                    textSettings.style.display = 'none';
                    imageSettings.style.display = 'block';
                }
                this.updateCoverPreview();
            });
        });

        // 监听颜色变化
        bgColorInput.addEventListener('input', () => this.updateCoverPreview());
        textColorInput.addEventListener('input', () => this.updateCoverPreview());

        // 监听图片上传
        coverImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.updateCoverPreview(e.target.result);
                };
                reader.readAsDataURL(file);
            }
        });

        // 监听标题变化以更新文字封面
        document.getElementById('novelTitle').addEventListener('input', () => {
            this.updateCoverPreview();
        });
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

    // 初始化自动保存
    initAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            this.autoSave();
        }, 30000); // 每30秒自动保存
    }

    // 自动保存草稿
    autoSave() {
        if (!this.quill) return;

        const title = document.getElementById('novelTitle').value;
        const content = this.quill.root.innerHTML;
        
        if (title.trim() || content.trim() !== '<p><br></p>') {
            this.saveDraftToLocal();
            this.updateLastSaved('自动保存');
        }
    }

    // 手动保存
    saveDraft() {
        this.saveDraftToLocal();
        this.updateLastSaved('手动保存');
        this.showMessage('草稿已保存', 'success');
    }

    // 保存草稿到本地存储
    saveDraftToLocal() {
        const title = document.getElementById('novelTitle').value || '无标题';
        const summary = document.getElementById('novelSummary').value;
        const content = this.quill ? this.quill.root.innerHTML : '';
        const selectedTags = Array.from(document.querySelectorAll('.tag-option.selected')).map(tag => tag.textContent);
        
        const draft = {
            id: this.currentDraftId || Date.now().toString(),
            title,
            summary,
            content,
            tags: selectedTags,
            coverType: document.querySelector('input[name="coverType"]:checked').value,
            bgColor: document.getElementById('bgColor').value,
            textColor: document.getElementById('textColor').value,
            savedAt: new Date().toISOString(),
            wordCount: this.getWordCount(content)
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

    // 获取文字数量
    getWordCount(htmlContent) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        const text = tempDiv.textContent || tempDiv.innerText || '';
        return text.trim().length;
    }

    // 加载草稿列表
    loadDrafts() {
        const draftsList = document.getElementById('draftsList');
        
        if (this.drafts.length === 0) {
            draftsList.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <div class="text-4xl mb-4">📝</div>
                    <p>暂无草稿</p>
                    <button class="btn btn-primary mt-4" onclick="adminManager.newDraft()">开始创作</button>
                </div>
            `;
            return;
        }

        draftsList.innerHTML = this.drafts.map(draft => `
            <div class="draft-item">
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
                    <button class="btn btn-primary btn-sm" onclick="adminManager.loadDraft('${draft.id}')">继续编辑</button>
                    <button class="btn btn-secondary btn-sm" onclick="adminManager.deleteDraft('${draft.id}')">删除</button>
                </div>
            </div>
        `).join('');
    }

    // 新建草稿
    newDraft() {
        // 清空表单
        document.getElementById('novelTitle').value = '';
        document.getElementById('novelSummary').value = '';
        if (this.quill) {
            this.quill.setText('');
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
        this.currentDraftId = null;
        this.currentEditId = null;
        
        // 重置页面标题
        document.getElementById('pageTitle').textContent = '创作新作品';
        
        // 切换到写作页面
        document.querySelector('[data-section="write"]').click();
        this.showMessage('已创建新草稿', 'success');
        
        // 标记为已保存状态
        this.markSaved();
    }

    // 加载草稿
    loadDraft(draftId) {
        const draft = this.drafts.find(d => d.id === draftId);
        if (!draft) return;

        // 填充表单
        document.getElementById('novelTitle').value = draft.title;
        document.getElementById('novelSummary').value = draft.summary || '';
        
        if (this.quill) {
            this.quill.root.innerHTML = draft.content;
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
        document.querySelector(`input[value="${draft.coverType}"]`).checked = true;
        document.getElementById('bgColor').value = draft.bgColor || '#FFE4E1';
        document.getElementById('textColor').value = draft.textColor || '#8B4513';
        this.updateCoverPreview();

        this.currentDraftId = draftId;
        
        // 切换到写作页面
        document.querySelector('[data-section="write"]').click();
        this.showMessage('草稿已加载', 'success');
    }

    // 删除草稿
    deleteDraft(draftId) {
        if (confirm('确定要删除这个草稿吗？')) {
            this.deleteDraftById(draftId);
            this.showMessage('草稿已删除', 'success');
        }
    }

    // 根据ID删除草稿（内部方法）
    deleteDraftById(draftId) {
        this.drafts = this.drafts.filter(d => d.id !== draftId);
        localStorage.setItem('novelDrafts', JSON.stringify(this.drafts));
        this.loadDrafts();
    }

    // 预览小说
    previewNovel() {
        const title = document.getElementById('novelTitle').value;
        const summary = document.getElementById('novelSummary').value;
        const content = this.quill ? this.quill.root.innerHTML : '';
        const selectedTags = Array.from(document.querySelectorAll('.tag-option.selected')).map(tag => tag.textContent);

        if (!title.trim()) {
            this.showMessage('请输入小说标题', 'error');
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

    // 发布小说
    async publishNovel() {
        const title = document.getElementById('novelTitle').value;
        const summary = document.getElementById('novelSummary').value;
        const content = this.quill ? this.quill.root.innerHTML : '';
        const selectedTags = Array.from(document.querySelectorAll('.tag-option.selected')).map(tag => tag.textContent);
        const coverType = document.querySelector('input[name="coverType"]:checked').value;

        // 验证必填字段
        if (!title.trim()) {
            this.showMessage('请输入小说标题', 'error');
            return;
        }

        if (!summary.trim()) {
            this.showMessage('请输入小说简介', 'error');
            return;
        }

        if (!content.trim() || content === '<p><br></p>') {
            this.showMessage('请输入小说内容', 'error');
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
                coverData = await this.fileToBase64(coverImage);
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
            coverData
        };

        try {
            // 判断是新建还是更新
            const isEdit = !!this.currentEditId;
            const url = isEdit ? `/api/novels/${this.currentEditId}` : '/api/novels';
            const method = isEdit ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(novelData)
            });

            const result = await response.json();

            if (result.success) {
                this.showMessage(isEdit ? '小说更新成功！' : '小说发布成功！', 'success');
                
                // 清空表单和编辑状态
                this.newDraft();
                this.currentEditId = null;
                
                // 删除对应的草稿
                if (this.currentDraftId) {
                    this.deleteDraftById(this.currentDraftId);
                    this.currentDraftId = null;
                }
                
                // 刷新数据
                this.loadStats();
                this.loadNovels();
            } else {
                this.showMessage(result.message || (isEdit ? '更新失败' : '发布失败'), 'error');
            }
        } catch (error) {
            console.error('操作失败:', error);
            this.showMessage('操作失败，请检查网络连接', 'error');
        }
    }

    // 文件转Base64
    fileToBase64(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    }

    // 加载统计数据
    async loadStats() {
        try {
            const response = await fetch('/api/stats');
            const result = await response.json();

            if (result.success) {
                const stats = result.data;
                document.getElementById('totalNovels').textContent = stats.totalNovels;
                document.getElementById('totalViews').textContent = stats.totalViews;
                document.getElementById('draftCount').textContent = this.drafts.length;
                document.getElementById('publishedCount').textContent = stats.publishedNovels;
            }
        } catch (error) {
            console.error('加载统计数据失败:', error);
        }
    }

    // 加载作品列表
    async loadNovels() {
        try {
            const response = await fetch('/api/novels');
            const result = await response.json();

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
                        <div class="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                            <div class="flex items-start justify-between">
                                <div class="flex-1">
                                    <h4 class="font-semibold text-lg mb-2">${novel.title}</h4>
                                    <p class="text-gray-600 mb-2">${novel.summary}</p>
                                    <div class="flex flex-wrap gap-2 mb-2">
                                        ${novel.tags ? novel.tags.map(tag => `<span class="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs">${tag}</span>`).join('') : ''}
                                    </div>
                                    <div class="text-sm text-gray-500">
                                        <span>发布时间：${novel.publishTime}</span>
                                        <span class="ml-4">阅读量：${novel.views || 0}</span>
                                    </div>
                                </div>
                                <div class="flex space-x-2">
                                    <button class="btn btn-secondary btn-sm" onclick="window.open('/read?id=${novel.id}', '_blank')">预览</button>
                                    <button class="btn btn-primary btn-sm" onclick="adminManager.editNovel(${novel.id})">编辑</button>
                                    <button class="btn btn-danger btn-sm" onclick="adminManager.deleteNovel(${novel.id})">删除</button>
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
            const response = await fetch(`/api/novels/${id}`);
            const result = await response.json();

            if (result.success) {
                const novel = result.data;
                
                // 填充表单
                document.getElementById('novelTitle').value = novel.title;
                document.getElementById('novelSummary').value = novel.summary;
                
                if (this.quill) {
                    this.quill.root.innerHTML = novel.content;
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
                this.currentDraftId = null; // 清除草稿ID，因为现在是编辑模式
                
                // 切换到写作页面
                document.querySelector('[data-section="write"]').click();
                this.showMessage('作品已加载到编辑器，正在编辑模式', 'success');
                
                // 更新页面标题显示编辑状态
                document.getElementById('pageTitle').textContent = `编辑作品 - ${novel.title}`;
            }
        } catch (error) {
            console.error('加载作品失败:', error);
            this.showMessage('加载作品失败', 'error');
        }
    }

    // 删除小说
    async deleteNovel(id) {
        if (!confirm('确定要删除这篇作品吗？此操作无法撤销！')) {
            return;
        }

        try {
            const response = await fetch(`/api/novels/${id}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                this.showMessage('作品已删除', 'success');
                this.loadNovels();
                this.loadStats();
            } else {
                this.showMessage(result.message || '删除失败', 'error');
            }
        } catch (error) {
            console.error('删除作品失败:', error);
            this.showMessage('删除失败，请检查网络连接', 'error');
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
        if (status === '未保存') {
            lastSavedElement.textContent = status;
            lastSavedElement.className = 'text-sm text-red-500';
        } else {
            lastSavedElement.textContent = `${status} - ${new Date().toLocaleTimeString()}`;
            lastSavedElement.className = 'text-sm text-green-500';
        }
    }

    // 加载用户统计数据
    async loadUserStats() {
        try {
            const response = await fetch('/api/admin/users');
            const result = await response.json();

            if (result.success) {
                const stats = result.data.stats;
                document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
                document.getElementById('onlineUsers').textContent = stats.onlineUsers || 0;
                document.getElementById('newUsers').textContent = stats.newUsersToday || 0;
                document.getElementById('activeSessions').textContent = stats.enabledUsers || 0;
            }
        } catch (error) {
            console.error('加载用户统计数据失败:', error);
            // 设置默认值防止显示错误
            document.getElementById('totalUsers').textContent = '0';
            document.getElementById('onlineUsers').textContent = '0';
            document.getElementById('newUsers').textContent = '0';
            document.getElementById('activeSessions').textContent = '0';
        }
    }

    // 加载用户列表
    async loadUsers() {
        try {
            const searchTerm = document.getElementById('userSearchInput').value;
            const params = new URLSearchParams({
                page: this.currentUserPage,
                limit: this.userPageSize,
                search: searchTerm
            });

            const response = await fetch(`/api/admin/users?${params}`);
            const result = await response.json();

            if (result.success) {
                this.users = result.data.users || [];
                this.renderUsersList();
                this.updateUserPagination(result.data.pagination);
                this.loadOnlineUsers();
            } else {
                this.renderEmptyUsersList();
                this.showMessage(result.message || '加载用户列表失败', 'error');
            }
        } catch (error) {
            console.error('加载用户列表失败:', error);
            this.renderEmptyUsersList();
            this.showMessage('加载用户列表失败，请检查网络连接', 'error');
        }
    }

    // 渲染用户列表
    renderUsersList() {
        const usersContent = document.getElementById('usersContent');
        
        if (this.users.length === 0) {
            this.renderEmptyUsersList();
            return;
        }

        const usersHtml = `
            <table class="users-table">
                <thead>
                    <tr>
                        <th>用户信息</th>
                        <th>状态</th>
                        <th>用户统计</th>
                        <th>注册时间</th>
                        <th>最后活动</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.users.map(user => this.renderUserRow(user)).join('')}
                </tbody>
            </table>
        `;

        usersContent.innerHTML = usersHtml;
    }

    // 渲染单个用户行
    renderUserRow(user) {
        const avatar = user.avatar || '/images/default-avatar.png';
        const isOnline = user.lastActivity && (Date.now() - new Date(user.lastActivity).getTime()) < 5 * 60 * 1000; // 5分钟内活动算在线
        const statusClass = user.isEnabled ? (isOnline ? 'status-online' : 'status-offline') : 'status-disabled';
        const statusText = user.isEnabled ? (isOnline ? '在线' : '离线') : '已禁用';

        return `
            <tr>
                <td>
                    <div class="user-info">
                        <img src="${avatar}" alt="${user.username}" class="user-avatar" 
                             onerror="this.src='/images/default-avatar.png'">
                        <div class="user-details">
                            <div class="user-name">${user.username}</div>
                            <div class="user-email">${user.email}</div>
                            <span class="user-role ${user.role}">${user.role === 'admin' ? '管理员' : '用户'}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </td>
                <td>
                    <div class="user-stats">
                        <span class="stat-item likes">❤️ ${user.stats?.totalLikes || 0}</span>
                        <span class="stat-item favorites">⭐ ${user.stats?.totalFavorites || 0}</span>
                        <span class="stat-item views">👁️ ${user.stats?.totalViews || 0}</span>
                    </div>
                </td>
                <td>${this.formatDate(user.registerTime)}</td>
                <td>${user.lastActivity ? this.formatDate(user.lastActivity) : '从未'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" onclick="viewUserDetail(${user.id})" title="查看详情">👁️</button>
                        <button class="action-btn edit" onclick="editUser(${user.id})" title="编辑用户">✏️</button>
                        <button class="action-btn toggle" onclick="toggleUserStatus(${user.id}, ${user.isEnabled})" 
                                title="${user.isEnabled ? '禁用用户' : '启用用户'}">${user.isEnabled ? '🚫' : '✅'}</button>
                    </div>
                </td>
            </tr>
        `;
    }

    // 渲染空用户列表
    renderEmptyUsersList() {
        const usersContent = document.getElementById('usersContent');
        usersContent.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <div class="text-4xl mb-4">👥</div>
                <p>暂无用户数据</p>
            </div>
        `;
    }

    // 更新用户分页
    updateUserPagination(pagination) {
        const paginationElement = document.getElementById('userPagination');
        const pageInfo = document.getElementById('userPageInfo');
        const prevBtn = document.getElementById('prevUserPage');
        const nextBtn = document.getElementById('nextUserPage');

        if (!pagination) {
            paginationElement.style.display = 'none';
            return;
        }

        paginationElement.style.display = 'flex';
        pageInfo.textContent = `第 ${pagination.page} 页，共 ${pagination.totalPages} 页`;

        prevBtn.disabled = pagination.page <= 1;
        nextBtn.disabled = pagination.page >= pagination.totalPages;

        prevBtn.style.opacity = prevBtn.disabled ? '0.5' : '1';
        nextBtn.style.opacity = nextBtn.disabled ? '0.5' : '1';
    }

    // 加载在线用户
    async loadOnlineUsers() {
        try {
            const response = await fetch('/api/admin/online-stats');
            const result = await response.json();

            if (result.success) {
                const onlineUsers = result.data.onlineUsers || [];
                this.renderOnlineUsers(onlineUsers);
            }
        } catch (error) {
            console.error('加载在线用户失败:', error);
        }
    }

    // 渲染在线用户
    renderOnlineUsers(onlineUsers) {
        const onlineSection = document.getElementById('onlineUsersSection');
        const onlineCount = document.getElementById('onlineCount');
        const onlineList = document.getElementById('onlineUserList');

        if (onlineUsers.length === 0) {
            onlineSection.style.display = 'none';
            return;
        }

        onlineSection.style.display = 'block';
        onlineCount.textContent = `(${onlineUsers.length})`;

        onlineList.innerHTML = onlineUsers.map(user => `
            <div class="online-user-item" onclick="viewUserDetail(${user.id})">
                <img src="${user.avatar || '/images/default-avatar.png'}" alt="${user.username}"
                     onerror="this.src='/images/default-avatar.png'">
                <span>${user.username}</span>
            </div>
        `).join('');
    }

    // 查看用户详情
    async viewUserDetail(userId) {
        try {
            const response = await fetch(`/api/admin/users/${userId}`);
            const result = await response.json();

            if (result.success) {
                const user = result.data;
                this.showUserDetailModal(user);
            } else {
                this.showMessage(result.message || '获取用户详情失败', 'error');
            }
        } catch (error) {
            console.error('获取用户详情失败:', error);
            this.showMessage('获取用户详情失败，请检查网络连接', 'error');
        }
    }

    // 显示用户详情模态框
    showUserDetailModal(user) {
        const modal = document.getElementById('userDetailModal');
        const modalBody = document.getElementById('userModalBody');

        const avatar = user.avatar || '/images/default-avatar.png';
        const isOnline = user.lastActivity && (Date.now() - new Date(user.lastActivity).getTime()) < 5 * 60 * 1000;
        const statusClass = user.isEnabled ? (isOnline ? 'status-online' : 'status-offline') : 'status-disabled';
        const statusText = user.isEnabled ? (isOnline ? '在线' : '离线') : '已禁用';

        modalBody.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="md:col-span-1">
                    <div class="text-center">
                        <img src="${avatar}" alt="${user.username}" 
                             class="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-gray-200"
                             onerror="this.src='/images/default-avatar.png'">
                        <h3 class="text-xl font-semibold">${user.username}</h3>
                        <p class="text-gray-600">${user.email}</p>
                        <span class="${statusClass === 'status-online' ? 'bg-green-100 text-green-800' : 
                                    statusClass === 'status-offline' ? 'bg-gray-100 text-gray-800' : 
                                    'bg-red-100 text-red-800'} px-2 py-1 rounded-full text-sm mt-2 inline-block">${statusText}</span>
                    </div>
                </div>
                
                <div class="md:col-span-2">
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div class="bg-blue-50 p-4 rounded-lg text-center">
                            <div class="text-2xl font-bold text-blue-600">${user.stats?.novelCount || 0}</div>
                            <div class="text-sm text-gray-600">发布作品</div>
                        </div>
                        <div class="bg-green-50 p-4 rounded-lg text-center">
                            <div class="text-2xl font-bold text-green-600">${user.stats?.totalLikes || 0}</div>
                            <div class="text-sm text-gray-600">获得点赞</div>
                        </div>
                        <div class="bg-purple-50 p-4 rounded-lg text-center">
                            <div class="text-2xl font-bold text-purple-600">${user.stats?.totalFavorites || 0}</div>
                            <div class="text-sm text-gray-600">收藏数</div>
                        </div>
                        <div class="bg-orange-50 p-4 rounded-lg text-center">
                            <div class="text-2xl font-bold text-orange-600">${user.stats?.totalViews || 0}</div>
                            <div class="text-sm text-gray-600">阅读量</div>
                        </div>
                    </div>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="text-sm font-medium text-gray-700">用户ID</label>
                            <p class="text-gray-900">${user.id}</p>
                        </div>
                        <div>
                            <label class="text-sm font-medium text-gray-700">用户角色</label>
                            <p class="text-gray-900">${user.role === 'admin' ? '管理员' : '普通用户'}</p>
                        </div>
                        <div>
                            <label class="text-sm font-medium text-gray-700">注册时间</label>
                            <p class="text-gray-900">${this.formatDate(user.registerTime)}</p>
                        </div>
                        <div>
                            <label class="text-sm font-medium text-gray-700">最后活动时间</label>
                            <p class="text-gray-900">${user.lastActivity ? this.formatDate(user.lastActivity) : '从未登录'}</p>
                        </div>
                        ${user.profile?.bio ? `
                        <div>
                            <label class="text-sm font-medium text-gray-700">个人简介</label>
                            <p class="text-gray-900">${user.profile.bio}</p>
                        </div>
                        ` : ''}
                        ${user.profile?.location ? `
                        <div>
                            <label class="text-sm font-medium text-gray-700">所在地区</label>
                            <p class="text-gray-900">${user.profile.location}</p>
                        </div>
                        ` : ''}
                        ${user.profile?.website ? `
                        <div>
                            <label class="text-sm font-medium text-gray-700">个人网站</label>
                            <p class="text-gray-900"><a href="${user.profile.website}" target="_blank" class="text-blue-600 hover:underline">${user.profile.website}</a></p>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
    }

    // 编辑用户
    async editUser(userId) {
        try {
            const response = await fetch(`/api/admin/users/${userId}`);
            const result = await response.json();

            if (result.success) {
                const user = result.data;
                this.showUserEditModal(user);
            } else {
                this.showMessage(result.message || '获取用户信息失败', 'error');
            }
        } catch (error) {
            console.error('获取用户信息失败:', error);
            this.showMessage('获取用户信息失败，请检查网络连接', 'error');
        }
    }

    // 显示用户编辑模态框
    showUserEditModal(user) {
        const modal = document.getElementById('userEditModal');

        // 填充表单数据
        document.getElementById('editUsername').value = user.username || '';
        document.getElementById('editEmail').value = user.email || '';
        document.getElementById('editRole').value = user.role || 'user';
        document.getElementById('editStatus').value = user.isEnabled ? 'true' : 'false';
        document.getElementById('editBio').value = user.profile?.bio || '';
        document.getElementById('editLocation').value = user.profile?.location || '';
        document.getElementById('editWebsite').value = user.profile?.website || '';

        // 保存用户ID以便提交时使用
        modal.dataset.userId = user.id;

        modal.classList.remove('hidden');
    }

    // 保存用户编辑
    async saveUserEdit(userId, formData) {
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                this.showMessage('用户信息更新成功', 'success');
                this.closeUserEditModal();
                this.loadUsers(); // 刷新用户列表
            } else {
                this.showMessage(result.message || '更新用户信息失败', 'error');
            }
        } catch (error) {
            console.error('更新用户信息失败:', error);
            this.showMessage('更新用户信息失败，请检查网络连接', 'error');
        }
    }

    // 切换用户状态
    async toggleUserStatus(userId, currentStatus) {
        const action = currentStatus ? '禁用' : '启用';

        if (!confirm(`确定要${action}这个用户吗？`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/users/${userId}/toggle-status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (result.success) {
                this.showMessage(`用户已${action}`, 'success');
                this.loadUsers(); // 刷新用户列表
                this.loadUserStats(); // 刷新统计数据
            } else {
                this.showMessage(result.message || `${action}用户失败`, 'error');
            }
        } catch (error) {
            console.error(`${action}用户失败:`, error);
            this.showMessage(`${action}用户失败，请检查网络连接`, 'error');
        }
    }

    // 关闭用户详情模态框
    closeUserDetailModal() {
        document.getElementById('userDetailModal').classList.add('hidden');
    }

    // 关闭用户编辑模态框
    closeUserEditModal() {
        document.getElementById('userEditModal').classList.add('hidden');
    }

    // 切换用户页面
    changeUserPage(direction) {
        const newPage = this.currentUserPage + direction;
        if (newPage >= 1) {
            this.currentUserPage = newPage;
            this.loadUsers();
        }
    }

    // 刷新用户数据
    refreshUsers() {
        this.currentUserPage = 1;
        this.loadUsers();
        this.loadUserStats();
        this.showMessage('用户数据已刷新', 'success');
    }

    // 搜索用户
    searchUsers() {
        this.currentUserPage = 1;
        this.loadUsers();
    }

    // 格式化日期
    formatDate(dateString) {
        if (!dateString) return '未知';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays < 30) {
            return `${diffDays}天前`;
        } else {
            return date.toLocaleDateString('zh-CN');
        }
    }

    // 显示消息提示
    showMessage(message, type = 'info') {
        // 创建消息提示元素
        const messageDiv = document.createElement('div');
        messageDiv.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            type === 'warning' ? 'bg-yellow-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        messageDiv.textContent = message;

        document.body.appendChild(messageDiv);

        // 3秒后自动移除
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            messageDiv.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        }, 3000);
    }
}

// 全局函数
let adminManager;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    adminManager = new AdminManager();
});

// 全局函数供HTML调用
function autoSave() {
    if (adminManager) {
        adminManager.saveDraft();
    }
}

function saveDraft() {
    if (adminManager) {
        adminManager.saveDraft();
    }
}

function previewNovel() {
    if (adminManager) {
        adminManager.previewNovel();
    }
}

function publishNovel() {
    if (adminManager) {
        adminManager.publishNovel();
    }
}

function closePreview() {
    if (adminManager) {
        adminManager.closePreview();
    }
}

function newDraft() {
    if (adminManager) {
        adminManager.newDraft();
    }
}

// 用户管理相关全局函数
function viewUserDetail(userId) {
    if (adminManager) {
        adminManager.viewUserDetail(userId);
    }
}

function editUser(userId) {
    if (adminManager) {
        adminManager.editUser(userId);
    }
}

function toggleUserStatus(userId, currentStatus) {
    if (adminManager) {
        adminManager.toggleUserStatus(userId, currentStatus);
    }
}

function closeUserDetailModal() {
    if (adminManager) {
        adminManager.closeUserDetailModal();
    }
}

function closeUserEditModal() {
    if (adminManager) {
        adminManager.closeUserEditModal();
    }
}

function changeUserPage(direction) {
    if (adminManager) {
        adminManager.changeUserPage(direction);
    }
}

function refreshUsers() {
    if (adminManager) {
        adminManager.refreshUsers();
    }
}

function searchUsers() {
    if (adminManager) {
        adminManager.searchUsers();
    }
}

// 点击模态框背景关闭预览
document.addEventListener('click', (e) => {
    if (e.target.id === 'previewModal') {
        closePreview();
    }
});

// 键盘快捷键
document.addEventListener('keydown', (e) => {
    // Ctrl+S 保存草稿
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveDraft();
    }
    
    // Ctrl+Enter 发布
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        publishNovel();
    }
    
    // Esc 关闭预览
    if (e.key === 'Escape') {
        closePreview();
        
        // 也关闭用户模态框
        const userDetailModal = document.getElementById('userDetailModal');
        const userEditModal = document.getElementById('userEditModal');
        if (!userDetailModal.classList.contains('hidden')) {
            closeUserDetailModal();
        }
        if (!userEditModal.classList.contains('hidden')) {
            closeUserEditModal();
        }
    }
});

// 用户编辑表单提交事件
document.addEventListener('DOMContentLoaded', () => {
    const userEditForm = document.getElementById('userEditForm');
    if (userEditForm) {
        userEditForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const modal = document.getElementById('userEditModal');
            const userId = modal.dataset.userId;
            
            if (!userId) return;
            
            const formData = {
                username: document.getElementById('editUsername').value,
                email: document.getElementById('editEmail').value,
                role: document.getElementById('editRole').value,
                isEnabled: document.getElementById('editStatus').value === 'true',
                profile: {
                    bio: document.getElementById('editBio').value,
                    location: document.getElementById('editLocation').value,
                    website: document.getElementById('editWebsite').value
                }
            };
            
            if (adminManager) {
                adminManager.saveUserEdit(userId, formData);
            }
        });
    }
    
    // 用户搜索输入框事件
    const userSearchInput = document.getElementById('userSearchInput');
    if (userSearchInput) {
        let searchTimeout;
        userSearchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (adminManager) {
                    adminManager.searchUsers();
                }
            }, 500); // 延迟500ms进行搜索，避免频繁请求
        });
        
        // 回车键搜索
        userSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                clearTimeout(searchTimeout);
                if (adminManager) {
                    adminManager.searchUsers();
                }
            }
        });
    }
});