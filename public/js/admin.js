// 管理后台主入口文件 - 重构版本
class AdminManager {
    constructor() {
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

    // 初始化管理后台
    init() {
        this.showWelcomeMessage();
        this.initializeModules();
        this.bindGlobalEvents();
        this.loadInitialData();
    }

    // 初始化所有模块
    initializeModules() {
        // 确保所有模块管理器都已初始化
        if (!window.apiClient) {
            console.error('API客户端未初始化');
        }
        
        if (!window.utils) {
            console.error('工具函数模块未初始化');
        }
        
        if (!window.uiManager) {
            console.error('UI管理器未初始化');
        }
        
        if (!window.editorManager) {
            console.error('编辑器管理器未初始化');
        }
        
        if (!window.draftManager) {
            console.error('草稿管理器未初始化');
        }
        
        if (!window.novelManager) {
            console.error('小说管理器未初始化');
        }
        
        if (!window.userManager) {
            console.error('用户管理器未初始化');
        }
        
        if (!window.statsManager) {
            console.error('统计管理器未初始化');
        }
    }

    // 绑定全局事件
    bindGlobalEvents() {
        // 页面卸载前保存数据
        window.addEventListener('beforeunload', (e) => {
            if (window.draftManager && window.editorManager) {
                const hasUnsavedChanges = document.getElementById('lastSaved')?.textContent?.includes('未保存');
                if (hasUnsavedChanges) {
                    e.preventDefault();
                    e.returnValue = '您有未保存的更改，确定要离开吗？';
                }
            }
        });

        // 处理网络状态变化
        window.addEventListener('online', () => {
            utils.showMessage('网络连接已恢复', 'success');
        });

        window.addEventListener('offline', () => {
            utils.showMessage('网络连接已断开，请检查网络', 'warning');
        });
    }

    // 加载初始数据
    loadInitialData() {
        // 加载统计数据
        if (window.statsManager) {
            window.statsManager.loadStats();
        }
        
        // 加载草稿
        if (window.draftManager) {
            window.draftManager.loadDrafts();
        }
    }

    // 显示欢迎消息
    showWelcomeMessage() {
        const username = localStorage.getItem('adminUsername');
        if (username) {
            utils.showMessage(`欢迎回来，${username}！`, 'success');
        }
    }

    // 退出登录
    logout() {
        if (confirm('确定要退出登录吗？')) {
            this.clearLoginData();
            utils.showMessage('已退出登录', 'success');
            setTimeout(() => {
                window.location.href = 'admin-login.html';
            }, 1000);
        }
    }

    // 获取系统信息
    getSystemInfo() {
        return {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            screenResolution: `${screen.width}x${screen.height}`,
            windowSize: `${window.innerWidth}x${window.innerHeight}`,
            timestamp: new Date().toISOString()
        };
    }

    // 导出系统状态
    exportSystemStatus() {
        const status = {
            system: this.getSystemInfo(),
            modules: {
                apiClient: !!window.apiClient,
                utils: !!window.utils,
                uiManager: !!window.uiManager,
                editorManager: !!window.editorManager,
                draftManager: !!window.draftManager,
                novelManager: !!window.novelManager,
                userManager: !!window.userManager,
                statsManager: !!window.statsManager
            },
            stats: window.draftManager ? window.draftManager.getDraftStats() : null,
            currentUser: localStorage.getItem('adminUsername'),
            loginTime: localStorage.getItem('adminLoginTime')
        };

        const blob = new Blob([JSON.stringify(status, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `admin-status-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        utils.showMessage('系统状态已导出', 'success');
    }
}

// 全局函数 - 保持向后兼容性
let adminManager;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    adminManager = new AdminManager();
    
    // 设置全局引用以保持兼容性
    window.adminManager = adminManager;
});

// 全局函数供HTML调用 - 保持向后兼容性
function autoSave() {
    if (window.draftManager) {
        window.draftManager.autoSave();
    }
}

function saveDraft() {
    if (window.draftManager) {
        window.draftManager.saveDraft();
    }
}

function previewNovel() {
    if (window.novelManager) {
        window.novelManager.previewNovel();
    }
}

function publishNovel() {
    if (window.novelManager) {
        window.novelManager.publishNovel();
    }
}

function closePreview() {
    if (window.novelManager) {
        window.novelManager.closePreview();
    }
}

function newDraft() {
    if (window.draftManager) {
        window.draftManager.newDraft();
    }
}

// 用户管理相关全局函数
function viewUserDetail(userId) {
    if (window.userManager) {
        window.userManager.viewUserDetail(userId);
    }
}

function editUser(userId) {
    if (window.userManager) {
        window.userManager.editUser(userId);
    }
}

function toggleUserStatus(userId, currentStatus) {
    if (window.userManager) {
        window.userManager.toggleUserStatus(userId, currentStatus);
    }
}

function closeUserDetailModal() {
    if (window.userManager) {
        window.userManager.closeUserDetailModal();
    }
}

function closeUserEditModal() {
    if (window.userManager) {
        window.userManager.closeUserEditModal();
    }
}

function changeUserPage(direction) {
    if (window.userManager) {
        window.userManager.changeUserPage(direction);
    }
}

function refreshUsers() {
    if (window.userManager) {
        window.userManager.refreshUsers();
    }
}

function searchUsers() {
    if (window.userManager) {
        window.userManager.searchUsers();
    }
}

// 批量权限管理相关函数
function showBatchAccessManager() {
    const batchBar = document.getElementById('batchOperationBar');
    if (batchBar) {
        batchBar.style.display = 'block';
    }
    if (window.novelManager) {
        window.novelManager.updateBatchOperationBar();
    }
}

function hideBatchOperationBar() {
    if (window.novelManager) {
        window.novelManager.hideBatchOperationBar();
    }
}

function updateBatchOperationBar() {
    if (window.novelManager) {
        window.novelManager.updateBatchOperationBar();
    }
}

function selectAllNovels() {
    if (window.novelManager) {
        window.novelManager.selectAllNovels();
    }
}

function clearSelection() {
    if (window.novelManager) {
        window.novelManager.clearSelection();
    }
}

function applyBatchAccessLevel() {
    if (window.novelManager) {
        window.novelManager.applyBatchAccessLevel();
    }
}

// 单个作品权限编辑
function editNovelAccess(novelId, title, currentAccess) {
    if (window.novelManager) {
        window.novelManager.editNovelAccess(novelId, title, currentAccess);
    }
}

function saveNovelAccess() {
    if (window.novelManager) {
        window.novelManager.saveNovelAccess();
    }
}

function closeNovelAccessModal() {
    if (window.novelManager) {
        window.novelManager.closeNovelAccessModal();
    }
}

function refreshNovelsList() {
    if (window.novelManager) {
        window.novelManager.refreshNovelsList();
    }
}

// 会员管理相关函数
function showMembershipModal(userId) {
    if (window.userManager) {
        window.userManager.showMembershipModal(userId);
    }
}

function closeMembershipModal() {
    if (window.userManager) {
        window.userManager.closeMembershipModal();
    }
}

function setMembershipDuration(months) {
    if (window.userManager) {
        window.userManager.setMembershipDuration(months);
    }
}

function toggleMembershipDurationGroup() {
    if (window.userManager) {
        window.userManager.toggleMembershipDurationGroup();
    }
}

function saveMembershipChanges() {
    if (window.userManager) {
        window.userManager.saveMembershipChanges();
    }
}

// 全局键盘事件处理
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
    
    // Esc 关闭预览和模态框
    if (e.key === 'Escape') {
        closePreview();
        
        // 关闭用户模态框
        const userDetailModal = document.getElementById('userDetailModal');
        const userEditModal = document.getElementById('userEditModal');
        const membershipModal = document.getElementById('membershipModal');
        const novelAccessModal = document.getElementById('novelAccessModal');
        
        if (userDetailModal && !userDetailModal.classList.contains('hidden')) {
            closeUserDetailModal();
        }
        if (userEditModal && !userEditModal.classList.contains('hidden')) {
            closeUserEditModal();
        }
        if (membershipModal && membershipModal.style.display !== 'none') {
            closeMembershipModal();
        }
        if (novelAccessModal && !novelAccessModal.classList.contains('hidden')) {
            closeNovelAccessModal();
        }
    }
});

// 表单事件处理
document.addEventListener('DOMContentLoaded', () => {
    // 用户编辑表单提交事件
    const userEditForm = document.getElementById('userEditForm');
    if (userEditForm) {
        userEditForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const modal = document.getElementById('userEditModal');
            const userId = modal?.dataset.userId;
            
            if (!userId) return;
            
            const formData = {
                username: document.getElementById('editUsername')?.value,
                email: document.getElementById('editEmail')?.value,
                role: document.getElementById('editRole')?.value,
                isEnabled: document.getElementById('editStatus')?.value === 'true',
                profile: {
                    bio: document.getElementById('editBio')?.value,
                    location: document.getElementById('editLocation')?.value,
                    website: document.getElementById('editWebsite')?.value
                }
            };
            
            if (window.userManager) {
                window.userManager.saveUserEdit(userId, formData);
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
                if (window.userManager) {
                    window.userManager.searchUsers();
                }
            }, 500);
        });
        
        // 回车键搜索
        userSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                clearTimeout(searchTimeout);
                if (window.userManager) {
                    window.userManager.searchUsers();
                }
            }
        });
    }

    // 会员类型变化监听
    const membershipTypeSelect = document.getElementById('membershipType');
    if (membershipTypeSelect) {
        membershipTypeSelect.addEventListener('change', toggleMembershipDurationGroup);
    }

    // 批量操作复选框事件
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('novel-checkbox')) {
            updateBatchOperationBar();
        }
    });
});

// 点击模态框背景关闭
document.addEventListener('click', (e) => {
    if (e.target.id === 'previewModal') {
        closePreview();
    }
    if (e.target.id === 'userDetailModal') {
        closeUserDetailModal();
    }
    if (e.target.id === 'userEditModal') {
        closeUserEditModal();
    }
    if (e.target.id === 'membershipModal') {
        closeMembershipModal();
    }
    if (e.target.id === 'novelAccessModal') {
        closeNovelAccessModal();
    }
});

// 导出主管理器类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminManager;
}