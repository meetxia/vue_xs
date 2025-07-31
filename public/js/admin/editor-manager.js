// 编辑器管理模块
class EditorManager {
    constructor() {
        this.quill = null;
        this.tags = [
            '#校园', '#爱情', '#悬疑', '#奇幻', '#都市', '#青春', 
            '#治愈', '#短篇', '#bg', '#甜文', '#占有欲男主', 
            '#年下小奶狗', '#偏执', '#温柔攻', '#霸道总裁',
            '#姐弟恋', '#年下恋', '#人外文', '#职场', '#连载中',
            '#已完结', '#日更', '#周更', '#短篇完结'
        ];
        this.init();
    }

    init() {
        this.initQuillEditor();
        this.initTagSelector();
        this.initCoverPreview();
        this.initFormEvents();
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
            ['clean'],
            ['link', 'image', 'video']
        ];

        const editorElement = document.getElementById('quillEditor');
        if (!editorElement) {
            console.error('未找到编辑器容器元素');
            return;
        }

        this.quill = new Quill('#quillEditor', {
            theme: 'snow',
            placeholder: '开始创作您的小说...',
            modules: {
                toolbar: {
                    container: toolbarOptions,
                    handlers: {
                        'image': this.imageHandler.bind(this),
                        'link': this.linkHandler.bind(this)
                    }
                },
                history: {
                    delay: 1000,
                    maxStack: 500,
                    userOnly: true
                }
            }
        });

        // 监听内容变化
        this.quill.on('text-change', (delta, oldDelta, source) => {
            if (source === 'user') {
                this.markUnsaved();
                this.updateWordCount();
            }
        });

        // 监听选择变化（用于显示格式信息）
        this.quill.on('selection-change', (range, oldRange, source) => {
            if (range) {
                this.updateFormatInfo(range);
            }
        });

        // 设置全局引用
        window.quill = this.quill;
    }

    // 图片处理器
    imageHandler() {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = () => {
            const file = input.files[0];
            if (file) {
                this.insertImage(file);
            }
        };
    }

    // 插入图片
    async insertImage(file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB限制
            utils.showMessage('图片大小不能超过5MB', 'error');
            return;
        }

        try {
            uiManager.showLoading(document.getElementById('quillEditor'), '上传图片中...');
            
            // 转换为base64
            const base64 = await utils.fileToBase64(file);
            
            // 获取光标位置
            const range = this.quill.getSelection(true);
            
            // 插入图片
            this.quill.insertEmbed(range.index, 'image', base64);
            
            // 移动光标到图片后面
            this.quill.setSelection(range.index + 1);
            
            utils.showMessage('图片插入成功', 'success');
        } catch (error) {
            console.error('插入图片失败:', error);
            utils.showMessage('插入图片失败', 'error');
        } finally {
            uiManager.hideLoading(document.getElementById('quillEditor'));
        }
    }

    // 链接处理器
    linkHandler() {
        const range = this.quill.getSelection();
        if (range) {
            const text = this.quill.getText(range);
            const url = prompt('请输入链接地址:', 'https://');
            if (url) {
                this.quill.format('link', url);
            }
        }
    }

    // 初始化标签选择器
    initTagSelector() {
        const tagSelector = document.getElementById('tagSelector');
        if (!tagSelector) return;

        tagSelector.innerHTML = '';
        
        // 按分类组织标签
        const tagCategories = {
            "男主类型": ["#占有欲男主", "#年下小奶狗", "#偏执", "#温柔攻", "#霸道总裁"],
            "题材类型": ["#bg", "#短篇", "#小甜文", "#姐弟恋", "#年下恋", "#人外文", "#校园", "#职场"],
            "连载状态": ["#连载中", "#已完结", "#日更", "#周更", "#短篇完结"],
            "风格类型": ["#爱情", "#悬疑", "#奇幻", "#都市", "#青春", "#治愈", "#甜文"]
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
                    this.updateTagsDisplay();
                });
                tagsDiv.appendChild(tagElement);
            });
            
            categoryDiv.appendChild(tagsDiv);
            tagSelector.appendChild(categoryDiv);
        });

        // 添加自定义标签输入
        this.addCustomTagInput(tagSelector);
    }

    // 添加自定义标签输入
    addCustomTagInput(container) {
        const customTagDiv = document.createElement('div');
        customTagDiv.className = 'mt-4 pt-4 border-t border-gray-200';
        
        const label = document.createElement('div');
        label.className = 'text-sm font-medium text-gray-700 mb-2';
        label.textContent = '自定义标签';
        
        const inputGroup = document.createElement('div');
        inputGroup.className = 'flex gap-2';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'flex-1 px-3 py-2 border border-gray-300 rounded-md';
        input.placeholder = '输入自定义标签（以#开头）';
        
        const addButton = document.createElement('button');
        addButton.type = 'button';
        addButton.className = 'btn btn-secondary btn-sm';
        addButton.textContent = '添加';
        
        const addCustomTag = () => {
            let tagText = input.value.trim();
            if (!tagText) return;
            
            if (!tagText.startsWith('#')) {
                tagText = '#' + tagText;
            }
            
            // 检查标签是否已存在
            const existingTag = container.querySelector(`.tag-option[data-custom="true"]:contains("${tagText}")`);
            if (existingTag) {
                utils.showMessage('标签已存在', 'warning');
                return;
            }
            
            // 创建自定义标签
            const tagElement = document.createElement('span');
            tagElement.className = 'tag-option selected';
            tagElement.textContent = tagText;
            tagElement.dataset.custom = 'true';
            tagElement.addEventListener('click', () => {
                tagElement.classList.toggle('selected');
                this.markUnsaved();
                this.updateTagsDisplay();
            });
            
            // 添加删除按钮
            const deleteBtn = document.createElement('span');
            deleteBtn.className = 'ml-1 cursor-pointer text-red-500';
            deleteBtn.textContent = '×';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                tagElement.remove();
                this.markUnsaved();
                this.updateTagsDisplay();
            });
            tagElement.appendChild(deleteBtn);
            
            // 插入到自定义标签区域
            inputGroup.parentNode.insertBefore(tagElement, inputGroup);
            
            input.value = '';
            this.markUnsaved();
            this.updateTagsDisplay();
        };
        
        addButton.addEventListener('click', addCustomTag);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addCustomTag();
            }
        });
        
        inputGroup.appendChild(input);
        inputGroup.appendChild(addButton);
        
        customTagDiv.appendChild(label);
        customTagDiv.appendChild(inputGroup);
        container.appendChild(customTagDiv);
    }

    // 更新标签显示
    updateTagsDisplay() {
        const selectedTags = Array.from(document.querySelectorAll('.tag-option.selected')).map(tag => tag.textContent.replace('×', ''));
        const tagsDisplay = document.getElementById('selectedTagsDisplay');
        
        if (tagsDisplay) {
            if (selectedTags.length > 0) {
                tagsDisplay.innerHTML = selectedTags.map(tag => 
                    `<span class="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs mr-1 mb-1 inline-block">${tag}</span>`
                ).join('');
            } else {
                tagsDisplay.innerHTML = '<span class="text-gray-500 text-sm">未选择标签</span>';
            }
        }
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
                if (textSettings && imageSettings) {
                    if (radio.value === 'text') {
                        textSettings.style.display = 'block';
                        imageSettings.style.display = 'none';
                    } else {
                        textSettings.style.display = 'none';
                        imageSettings.style.display = 'block';
                    }
                }
                this.updateCoverPreview();
            });
        });

        // 监听颜色变化
        if (bgColorInput) {
            bgColorInput.addEventListener('input', () => this.updateCoverPreview());
        }
        if (textColorInput) {
            textColorInput.addEventListener('input', () => this.updateCoverPreview());
        }

        // 监听图片上传
        if (coverImageInput) {
            coverImageInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    if (file.size > 2 * 1024 * 1024) { // 2MB限制
                        utils.showMessage('封面图片大小不能超过2MB', 'error');
                        return;
                    }
                    
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        this.updateCoverPreview(e.target.result);
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // 监听标题变化以更新文字封面
        const titleInput = document.getElementById('novelTitle');
        if (titleInput) {
            titleInput.addEventListener('input', () => {
                this.updateCoverPreview();
            });
        }
    }

    // 更新封面预览
    updateCoverPreview(imageData = null) {
        const preview = document.getElementById('coverPreview');
        const coverTypeRadio = document.querySelector('input[name="coverType"]:checked');
        const titleInput = document.getElementById('novelTitle');
        
        if (!preview || !coverTypeRadio) return;

        const coverType = coverTypeRadio.value;
        const title = titleInput ? titleInput.value || '小说标题' : '小说标题';

        preview.innerHTML = '';
        preview.classList.add('has-cover');

        if (coverType === 'text') {
            const bgColorInput = document.getElementById('bgColor');
            const textColorInput = document.getElementById('textColor');
            const bgColor = bgColorInput ? bgColorInput.value : '#FFE4E1';
            const textColor = textColorInput ? textColorInput.value : '#8B4513';
            
            const textCover = document.createElement('div');
            textCover.className = 'text-cover';
            textCover.style.backgroundColor = bgColor;
            textCover.style.color = textColor;
            textCover.style.display = 'flex';
            textCover.style.alignItems = 'center';
            textCover.style.justifyContent = 'center';
            textCover.style.height = '100%';
            textCover.style.padding = '20px';
            textCover.style.textAlign = 'center';
            textCover.style.fontSize = '16px';
            textCover.style.fontWeight = 'bold';
            textCover.style.wordBreak = 'break-word';
            textCover.textContent = title;
            
            preview.appendChild(textCover);
        } else if (imageData) {
            const img = document.createElement('img');
            img.src = imageData;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '4px';
            preview.appendChild(img);
        } else {
            preview.innerHTML = '<div class="flex items-center justify-center h-full text-gray-500">请选择图片</div>';
            preview.classList.remove('has-cover');
        }
    }

    // 初始化表单事件
    initFormEvents() {
        // 监听标题输入
        const titleInput = document.getElementById('novelTitle');
        if (titleInput) {
            titleInput.addEventListener('input', () => {
                this.markUnsaved();
                this.updateWordCount();
            });
        }

        // 监听简介输入
        const summaryInput = document.getElementById('novelSummary');
        if (summaryInput) {
            summaryInput.addEventListener('input', () => {
                this.markUnsaved();
                this.updateCharCount(summaryInput, 'summaryCharCount', 500);
            });
        }
    }

    // 更新字符计数
    updateCharCount(input, counterId, maxLength) {
        const counter = document.getElementById(counterId);
        if (counter) {
            const currentLength = input.value.length;
            counter.textContent = `${currentLength}/${maxLength}`;
            
            if (currentLength > maxLength) {
                counter.className = 'text-red-500 text-sm';
            } else if (currentLength > maxLength * 0.8) {
                counter.className = 'text-yellow-500 text-sm';
            } else {
                counter.className = 'text-gray-500 text-sm';
            }
        }
    }

    // 更新字数统计
    updateWordCount() {
        if (!this.quill) return;

        const text = this.quill.getText();
        const wordCount = text.trim().length;
        
        const wordCountElement = document.getElementById('wordCount');
        if (wordCountElement) {
            wordCountElement.textContent = `字数：${wordCount}`;
        }

        // 更新读取时间估算
        const readingTime = Math.ceil(wordCount / 300); // 假设每分钟读300字
        const readingTimeElement = document.getElementById('readingTime');
        if (readingTimeElement) {
            readingTimeElement.textContent = `预计阅读：${readingTime}分钟`;
        }
    }

    // 更新格式信息
    updateFormatInfo(range) {
        if (!this.quill || !range) return;

        const format = this.quill.getFormat(range);
        const formatInfo = document.getElementById('formatInfo');
        
        if (formatInfo) {
            const formats = [];
            if (format.bold) formats.push('粗体');
            if (format.italic) formats.push('斜体');
            if (format.underline) formats.push('下划线');
            if (format.header) formats.push(`标题${format.header}`);
            if (format.list) formats.push(format.list === 'ordered' ? '有序列表' : '无序列表');
            
            formatInfo.textContent = formats.length > 0 ? formats.join(', ') : '普通文本';
        }
    }

    // 插入模板
    insertTemplate(templateType) {
        if (!this.quill) return;

        const templates = {
            dialogue: '"对话内容，"角色说道。\n\n',
            description: '这里描述环境、人物或情节...\n\n',
            chapter: '# 第一章 章节标题\n\n',
            scene: '---场景分割线---\n\n'
        };

        const template = templates[templateType];
        if (template) {
            const range = this.quill.getSelection(true);
            this.quill.insertText(range.index, template);
            this.quill.setSelection(range.index + template.length);
        }
    }

    // 格式化文本
    formatText(format, value = true) {
        if (!this.quill) return;

        const range = this.quill.getSelection();
        if (range) {
            this.quill.format(format, value);
        }
    }

    // 清除格式
    clearFormat() {
        if (!this.quill) return;

        const range = this.quill.getSelection();
        if (range) {
            this.quill.removeFormat(range.index, range.length);
        }
    }

    // 撤销/重做
    undo() {
        if (this.quill) {
            this.quill.history.undo();
        }
    }

    redo() {
        if (this.quill) {
            this.quill.history.redo();
        }
    }

    // 全屏编辑模式
    toggleFullscreen() {
        const editorContainer = document.querySelector('.editor-container');
        if (editorContainer) {
            editorContainer.classList.toggle('fullscreen');
            
            if (editorContainer.classList.contains('fullscreen')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        }
    }

    // 专注模式
    toggleFocusMode() {
        const editorContainer = document.querySelector('.editor-container');
        if (editorContainer) {
            editorContainer.classList.toggle('focus-mode');
        }
    }

    // 获取编辑器内容
    getContent() {
        return this.quill ? this.quill.root.innerHTML : '';
    }

    // 设置编辑器内容
    setContent(content) {
        if (this.quill) {
            this.quill.root.innerHTML = content;
        }
    }

    // 获取纯文本
    getText() {
        return this.quill ? this.quill.getText() : '';
    }

    // 清空编辑器
    clear() {
        if (this.quill) {
            this.quill.setText('');
        }
    }

    // 标记为未保存
    markUnsaved() {
        if (window.draftManager) {
            window.draftManager.markUnsaved();
        }
    }

    // 销毁编辑器
    destroy() {
        if (this.quill) {
            // Quill没有直接的destroy方法，但可以清空内容和事件
            this.quill.off('text-change');
            this.quill.off('selection-change');
            this.quill = null;
        }
    }
}

// 创建全局编辑器管理实例
window.editorManager = new EditorManager();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EditorManager;
}