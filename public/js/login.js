// 用户管理类
class UserManager {
    constructor() {
        this.user = null;
        this.token = localStorage.getItem('token');
        this.init();
    }

    init() {
        // 如果已经登录，直接跳转到首页
        if (this.token) {
            this.validateToken();
        }
    }

    async validateToken() {
        try {
            const response = await fetch('/api/auth/profile', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.user = result.data;
                // 已经登录，跳转到首页
                window.location.href = 'index.html';
            } else {
                // Token无效，清除本地存储
                localStorage.removeItem('token');
                this.token = null;
            }
        } catch (error) {
            console.error('验证Token失败:', error);
            localStorage.removeItem('token');
            this.token = null;
        }
    }

    async login(username, password, isAdmin = false) {
        try {
            const endpoint = isAdmin ? '/api/admin/login' : '/api/auth/login';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (result.success) {
                this.user = result.data.user;
                this.token = result.data.token;
                localStorage.setItem('token', this.token);
                
                // 显示成功消息
                this.showMessage('登录成功！正在跳转...', 'success');
                
                // 根据是否是管理员跳转不同页面
                const redirectUrl = isAdmin ? 'admin.html' : 'index.html';
                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 1000);
                
                return { success: true, message: result.message };
            } else {
                return { success: false, message: result.message };
            }
        } catch (error) {
            console.error('登录失败:', error);
            return { success: false, message: '网络错误，请稍后重试' };
        }
    }

    async register(username, email, password) {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            const result = await response.json();

            if (result.success) {
                this.showMessage('注册成功！请登录', 'success');
                
                // 切换到登录选项卡
                setTimeout(() => {
                    switchTab('login');
                    // 预填用户名
                    document.getElementById('loginUsername').value = username;
                }, 1000);
                
                return { success: true, message: result.message };
            } else {
                return { success: false, message: result.message };
            }
        } catch (error) {
            console.error('注册失败:', error);
            return { success: false, message: '网络错误，请稍后重试' };
        }
    }

    showMessage(message, type = 'success') {
        const messageEl = document.getElementById('successMessage');
        messageEl.textContent = message;
        messageEl.style.display = 'block';
        
        if (type === 'error') {
            messageEl.style.background = '#f8d7da';
            messageEl.style.color = '#721c24';
            messageEl.style.borderColor = '#f5c6cb';
        } else {
            messageEl.style.background = '#d4edda';
            messageEl.style.color = '#155724';
            messageEl.style.borderColor = '#c3e6cb';
        }

        // 5秒后自动隐藏
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 5000);
    }

    isLoggedIn() {
        return !!this.token && !!this.user;
    }
}

// 表单验证工具
class FormValidator {
    static validateUsername(username) {
        if (!username || username.length < 3) {
            return '用户名至少3个字符';
        }
        if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
            return '用户名只能包含字母、数字、下划线和中文';
        }
        return null;
    }

    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            return '请输入邮箱';
        }
        if (!emailRegex.test(email)) {
            return '请输入有效的邮箱地址';
        }
        return null;
    }

    static validatePassword(password) {
        if (!password) {
            return '请输入密码';
        }
        if (password.length < 6) {
            return '密码至少6个字符';
        }
        return null;
    }

    static validateConfirmPassword(password, confirmPassword) {
        if (!confirmPassword) {
            return '请确认密码';
        }
        if (password !== confirmPassword) {
            return '两次输入的密码不一致';
        }
        return null;
    }

    static showError(inputId, message) {
        const input = document.getElementById(inputId);
        const errorEl = document.getElementById(inputId + 'Error');
        
        if (message) {
            input.classList.add('error');
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        } else {
            input.classList.remove('error');
            errorEl.style.display = 'none';
        }
    }

    static clearErrors(formId) {
        const form = document.getElementById(formId);
        const inputs = form.querySelectorAll('.form-input');
        const errors = form.querySelectorAll('.error-message');
        
        inputs.forEach(input => input.classList.remove('error'));
        errors.forEach(error => error.style.display = 'none');
    }
}

// 全局变量
let userManager;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    userManager = new UserManager();
    initializeForms();
});

// 初始化表单事件
function initializeForms() {
    // 登录表单
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', handleLogin);

    // 注册表单
    const registerForm = document.getElementById('registerForm');
    registerForm.addEventListener('submit', handleRegister);

    // 管理员登录表单
    const adminForm = document.getElementById('adminForm');
    adminForm.addEventListener('submit', handleAdminLogin);

    // 实时验证
    document.getElementById('registerUsername').addEventListener('blur', validateUsernameField);
    document.getElementById('registerEmail').addEventListener('blur', validateEmailField);
    document.getElementById('registerPassword').addEventListener('blur', validatePasswordField);
    document.getElementById('confirmPassword').addEventListener('blur', validateConfirmPasswordField);
}

// 处理登录
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const loginBtn = document.getElementById('loginBtn');
    
    // 清除之前的错误
    FormValidator.clearErrors('loginForm');
    
    // 基本验证
    if (!username) {
        FormValidator.showError('loginUsername', '请输入用户名或邮箱');
        return;
    }
    
    if (!password) {
        FormValidator.showError('loginPassword', '请输入密码');
        return;
    }
    
    // 显示加载状态
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="loading"></span>登录中...';
    
    try {
        const result = await userManager.login(username, password);
        
        if (!result.success) {
            if (result.message.includes('用户不存在')) {
                FormValidator.showError('loginUsername', result.message);
            } else if (result.message.includes('密码错误')) {
                FormValidator.showError('loginPassword', result.message);
            } else {
                userManager.showMessage(result.message, 'error');
            }
        }
    } catch (error) {
        userManager.showMessage('登录失败，请稍后重试', 'error');
    } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '登录';
    }
}

// 处理注册
async function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const registerBtn = document.getElementById('registerBtn');
    
    // 清除之前的错误
    FormValidator.clearErrors('registerForm');
    
    // 验证所有字段
    let hasError = false;
    
    const usernameError = FormValidator.validateUsername(username);
    if (usernameError) {
        FormValidator.showError('registerUsername', usernameError);
        hasError = true;
    }
    
    const emailError = FormValidator.validateEmail(email);
    if (emailError) {
        FormValidator.showError('registerEmail', emailError);
        hasError = true;
    }
    
    const passwordError = FormValidator.validatePassword(password);
    if (passwordError) {
        FormValidator.showError('registerPassword', passwordError);
        hasError = true;
    }
    
    const confirmPasswordError = FormValidator.validateConfirmPassword(password, confirmPassword);
    if (confirmPasswordError) {
        FormValidator.showError('confirmPassword', confirmPasswordError);
        hasError = true;
    }
    
    if (hasError) return;
    
    // 显示加载状态
    registerBtn.disabled = true;
    registerBtn.innerHTML = '<span class="loading"></span>注册中...';
    
    try {
        const result = await userManager.register(username, email, password);
        
        if (!result.success) {
            if (result.message.includes('用户名已存在')) {
                FormValidator.showError('registerUsername', result.message);
            } else if (result.message.includes('邮箱已被注册')) {
                FormValidator.showError('registerEmail', result.message);
            } else {
                userManager.showMessage(result.message, 'error');
            }
        }
    } catch (error) {
        userManager.showMessage('注册失败，请稍后重试', 'error');
    } finally {
        registerBtn.disabled = false;
        registerBtn.innerHTML = '注册';
    }
}

// 处理管理员登录
async function handleAdminLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value;
    const adminBtn = document.getElementById('adminBtn');
    
    // 清除之前的错误
    FormValidator.clearErrors('adminForm');
    
    // 基本验证
    if (!username) {
        FormValidator.showError('adminUsername', '请输入管理员用户名');
        return;
    }
    
    if (!password) {
        FormValidator.showError('adminPassword', '请输入管理员密码');
        return;
    }
    
    // 显示加载状态
    adminBtn.disabled = true;
    adminBtn.innerHTML = '<span class="loading"></span>登录中...';
    
    try {
        const result = await userManager.login(username, password, true);
        
        if (!result.success) {
            if (result.message.includes('用户不存在') || result.message.includes('用户名')) {
                FormValidator.showError('adminUsername', result.message);
            } else if (result.message.includes('密码错误') || result.message.includes('密码')) {
                FormValidator.showError('adminPassword', result.message);
            } else {
                userManager.showMessage(result.message, 'error');
            }
        }
    } catch (error) {
        userManager.showMessage('管理员登录失败，请稍后重试', 'error');
    } finally {
        adminBtn.disabled = false;
        adminBtn.innerHTML = '管理员登录';
    }
}

// 实时验证函数
function validateUsernameField() {
    const username = document.getElementById('registerUsername').value.trim();
    const error = FormValidator.validateUsername(username);
    FormValidator.showError('registerUsername', error);
}

function validateEmailField() {
    const email = document.getElementById('registerEmail').value.trim();
    const error = FormValidator.validateEmail(email);
    FormValidator.showError('registerEmail', error);
}

function validatePasswordField() {
    const password = document.getElementById('registerPassword').value;
    const error = FormValidator.validatePassword(password);
    FormValidator.showError('registerPassword', error);
}

function validateConfirmPasswordField() {
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const error = FormValidator.validateConfirmPassword(password, confirmPassword);
    FormValidator.showError('confirmPassword', error);
}

// 切换选项卡
function switchTab(tabName) {
    // 隐藏所有选项卡内容
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));
    
    // 移除所有按钮的活动状态
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => btn.classList.remove('active'));
    
    // 显示选中的选项卡
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // 设置对应按钮为活动状态
    event.target.classList.add('active');
    
    // 清除错误消息
    document.getElementById('successMessage').style.display = 'none';
    FormValidator.clearErrors('loginForm');
    FormValidator.clearErrors('registerForm');
    FormValidator.clearErrors('adminForm');
}

// 键盘事件处理
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab.id === 'loginTab') {
            handleLogin(event);
        } else if (activeTab.id === 'registerTab') {
            handleRegister(event);
        } else if (activeTab.id === 'adminTab') {
            handleAdminLogin(event);
        }
    }
});