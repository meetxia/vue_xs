// UI交互模块
class UIManager {
    constructor() {
        this.currentSection = 'write';
        this.modals = [];
        this.notifications = [];
        this.keyboardShortcuts = new Map();
        this.init();
    }

    init() {
        this.initSidebar();
        this.initModals();
        this.initKeyboardShortcuts();
        this.initFormValidation();
        this.initTooltips();
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
                    this.currentSection = sectionId;
                    this.updatePageTitle(sectionId);
                    this.handleSectionSwitch(sectionId);
                }
            });
        });
    }

    // 处理页面切换
    handleSectionSwitch(sectionId) {
        switch (sectionId) {
            case 'stats':
                if (window.statsManager) {
                    window.statsManager.loadStats();
                }
                break;
            case 'manage':
                if (window.novelManager) {
                    window.novelManager.loadNovels();
                }
                break;
            case 'drafts':
                if (window.draftManager) {
                    window.draftManager.loadDrafts();
                }
                break;
            case 'users':
                if (window.userManager) {
                    window.userManager.loadUsers();
                    window.userManager.loadUserStats();
                }
                break;
            case 'batch-import':
                this.initBatchImport();
                break;
        }
    }

    // 更新页面标题
    updatePageTitle(section) {
        const titles = {
            write: '创作新作品',
            drafts: '我的草稿',
            manage: '作品管理',
            'batch-import': '批量导入',
            users: '用户管理',
            stats: '数据统计',
            settings: '系统设置'
        };
        
        const titleElement = document.getElementById('pageTitle');
        if (titleElement) {
            titleElement.textContent = titles[section] || '管理后台';
        }
    }

    // 初始化模态框
    initModals() {
        // 点击背景关闭模态框
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal') || e.target.id === 'previewModal') {
                this.closeModal(e.target.id);
            }
        });

        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeTopModal();
            }
        });
    }

    // 显示模态框
    showModal(modalId, options = {}) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        
        // 添加到模态框堆栈
        this.modals.push(modalId);
        
        // 聚焦到模态框
        if (options.focusFirst) {
            const firstInput = modal.querySelector('input, textarea, select, button');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }

        // 阻止背景滚动
        document.body.style.overflow = 'hidden';
    }

    // 关闭模态框
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.add('hidden');
        modal.style.display = 'none';
        
        // 从模态框堆栈中移除
        const index = this.modals.indexOf(modalId);
        if (index > -1) {
            this.modals.splice(index, 1);
        }

        // 如果没有其他模态框，恢复背景滚动
        if (this.modals.length === 0) {
            document.body.style.overflow = '';
        }

        // 清理表单数据
        this.resetModalForm(modal);
    }

    // 关闭顶层模态框
    closeTopModal() {
        if (this.modals.length > 0) {
            const topModal = this.modals[this.modals.length - 1];
            this.closeModal(topModal);
        }
    }

    // 重置模态框表单
    resetModalForm(modal) {
        const forms = modal.querySelectorAll('form');
        forms.forEach(form => {
            form.reset();
        });

        // 清除自定义数据属性
        delete modal.dataset.userId;
        delete modal.dataset.novelId;
    }

    // 初始化键盘快捷键
    initKeyboardShortcuts() {
        // 注册快捷键
        this.registerShortcut('ctrl+s', (e) => {
            e.preventDefault();
            if (window.draftManager) {
                window.draftManager.saveDraft();
            }
        });

        this.registerShortcut('ctrl+enter', (e) => {
            e.preventDefault();
            if (window.novelManager) {
                window.novelManager.publishNovel();
            }
        });

        this.registerShortcut('ctrl+n', (e) => {
            e.preventDefault();
            if (window.novelManager) {
                window.novelManager.newDraft();
            }
        });

        // 监听键盘事件
        document.addEventListener('keydown', (e) => {
            const key = this.getShortcutKey(e);
            const handler = this.keyboardShortcuts.get(key);
            if (handler) {
                handler(e);
            }
        });
    }

    // 注册快捷键
    registerShortcut(key, handler) {
        this.keyboardShortcuts.set(key, handler);
    }

    // 获取快捷键字符串
    getShortcutKey(e) {
        const parts = [];
        if (e.ctrlKey) parts.push('ctrl');
        if (e.altKey) parts.push('alt');
        if (e.shiftKey) parts.push('shift');
        parts.push(e.key.toLowerCase());
        return parts.join('+');
    }

    // 初始化表单验证
    initFormValidation() {
        const forms = document.querySelectorAll('form[data-validate]');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                if (!this.validateForm(form)) {
                    e.preventDefault();
                }
            });

            // 实时验证
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('blur', () => {
                    this.validateField(input);
                });
            });
        });
    }

    // 验证表单
    validateForm(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        return isValid;
    }

    // 验证字段
    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.getAttribute('data-field-name') || field.name;
        let isValid = true;
        let errorMessage = '';

        // 必填验证
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = `${fieldName}不能为空`;
        }
        
        // 邮箱验证
        if (field.type === 'email' && value && !utils.isValidEmail(value)) {
            isValid = false;
            errorMessage = '请输入有效的邮箱地址';
        }

        // 长度验证
        const minLength = field.getAttribute('data-min-length');
        const maxLength = field.getAttribute('data-max-length');
        
        if (minLength && value.length < parseInt(minLength)) {
            isValid = false;
            errorMessage = `${fieldName}至少需要${minLength}个字符`;
        }
        
        if (maxLength && value.length > parseInt(maxLength)) {
            isValid = false;
            errorMessage = `${fieldName}不能超过${maxLength}个字符`;
        }

        // 显示验证结果
        this.showFieldValidation(field, isValid, errorMessage);
        return isValid;
    }

    // 显示字段验证结果
    showFieldValidation(field, isValid, errorMessage) {
        // 移除之前的验证状态
        field.classList.remove('field-valid', 'field-invalid');
        
        // 移除之前的错误消息
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        if (isValid) {
            field.classList.add('field-valid');
        } else {
            field.classList.add('field-invalid');
            
            // 显示错误消息
            const errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            errorDiv.textContent = errorMessage;
            field.parentNode.appendChild(errorDiv);
        }
    }

    // 初始化工具提示
    initTooltips() {
        const tooltipElements = document.querySelectorAll('[title]');
        tooltipElements.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target, e.target.getAttribute('title'));
            });
            
            element.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        });
    }

    // 显示工具提示
    showTooltip(element, text) {
        this.hideTooltip(); // 先隐藏之前的提示

        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        document.body.appendChild(tooltip);

        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';

        // 边界检查
        if (tooltip.offsetLeft < 10) {
            tooltip.style.left = '10px';
        }
        if (tooltip.offsetLeft + tooltip.offsetWidth > window.innerWidth - 10) {
            tooltip.style.left = (window.innerWidth - tooltip.offsetWidth - 10) + 'px';
        }

        this.currentTooltip = tooltip;
    }

    // 隐藏工具提示
    hideTooltip() {
        if (this.currentTooltip) {
            this.currentTooltip.remove();
            this.currentTooltip = null;
        }
    }

    // 显示加载状态
    showLoading(element, text = '加载中...') {
        if (!element) return;

        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">${text}</div>
        `;

        element.style.position = 'relative';
        element.appendChild(loadingOverlay);
        element.dataset.loading = 'true';
    }

    // 隐藏加载状态
    hideLoading(element) {
        if (!element) return;

        const loadingOverlay = element.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.remove();
        }
        delete element.dataset.loading;
    }

    // 显示确认对话框
    showConfirm(message, onConfirm, onCancel) {
        const confirmed = confirm(message);
        if (confirmed && onConfirm) {
            onConfirm();
        } else if (!confirmed && onCancel) {
            onCancel();
        }
        return confirmed;
    }

    // 平滑滚动到元素
    scrollToElement(element, offset = 0) {
        if (!element) return;

        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset + rect.top - offset;

        window.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
        });
    }

    // 高亮元素
    highlightElement(element, duration = 2000) {
        if (!element) return;

        element.classList.add('highlight');
        setTimeout(() => {
            element.classList.remove('highlight');
        }, duration);
    }

    // 初始化批量导入功能
    initBatchImport() {
        // 检查是否已经初始化过批量导入管理器
        if (!window.batchImportManager) {
            // 创建批量导入管理器实例
            window.batchImportManager = new BatchImportManager();
            console.log('批量导入管理器已初始化');
        } else {
            console.log('批量导入管理器已存在，跳过初始化');
        }
    }

    // 切换侧边栏折叠状态
    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        
        if (sidebar && mainContent) {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('sidebar-collapsed');
        }
    }

    // 设置页面主题
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('admin-theme', theme);
    }

    // 获取当前主题
    getCurrentTheme() {
        return localStorage.getItem('admin-theme') || 'light';
    }

    // 切换主题
    toggleTheme() {
        const currentTheme = this.getCurrentTheme();
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        return newTheme;
    }

    // 显示进度条
    showProgress(progress, text = '') {
        let progressBar = document.getElementById('global-progress');
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.id = 'global-progress';
            progressBar.className = 'global-progress';
            progressBar.innerHTML = `
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
                <div class="progress-text"></div>
            `;
            document.body.appendChild(progressBar);
        }

        const fill = progressBar.querySelector('.progress-fill');
        const textElement = progressBar.querySelector('.progress-text');
        
        fill.style.width = Math.max(0, Math.min(100, progress)) + '%';
        textElement.textContent = text;
        
        progressBar.style.display = 'block';
    }

    // 隐藏进度条
    hideProgress() {
        const progressBar = document.getElementById('global-progress');
        if (progressBar) {
            progressBar.style.display = 'none';
        }
    }

    // 复制到剪贴板
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            utils.showMessage('已复制到剪贴板', 'success');
            return true;
        } catch (error) {
            console.error('复制失败:', error);
            // 降级方案
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (successful) {
                utils.showMessage('已复制到剪贴板', 'success');
                return true;
            } else {
                utils.showMessage('复制失败', 'error');
                return false;
            }
        }
    }
}

// 创建全局UI管理实例
window.uiManager = new UIManager();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}