// 管理员登录功能实现
class AdminLogin {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.checkLoginStatus();
    }

    // 初始化DOM元素
    initializeElements() {
        this.elements = {
            loginForm: document.getElementById('loginForm'),
            usernameInput: document.getElementById('username'),
            passwordInput: document.getElementById('password'),
            togglePassword: document.getElementById('togglePassword'),
            rememberMe: document.getElementById('rememberMe'),
            loginBtn: document.getElementById('loginBtn'),
            loginBtnText: document.getElementById('loginBtnText'),
            loginSpinner: document.getElementById('loginSpinner'),
            errorMessage: document.getElementById('errorMessage'),
            errorText: document.getElementById('errorText'),
            successMessage: document.getElementById('successMessage')
        };
    }

    // 绑定事件
    bindEvents() {
        // 表单提交
        this.elements.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // 密码显示/隐藏切换
        this.elements.togglePassword.addEventListener('click', () => {
            this.togglePasswordVisibility();
        });

        // 输入框焦点事件
        this.elements.usernameInput.addEventListener('focus', () => {
            this.hideMessages();
        });

        this.elements.passwordInput.addEventListener('focus', () => {
            this.hideMessages();
        });

        // 回车键快捷登录
        this.elements.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.elements.passwordInput.focus();
            }
        });

        this.elements.passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleLogin();
            }
        });
    }

    // 检查登录状态
    checkLoginStatus() {
        const token = localStorage.getItem('adminToken');
        const loginTime = localStorage.getItem('adminLoginTime');
        
        if (token && loginTime) {
            const now = Date.now();
            const loginTimestamp = parseInt(loginTime);
            const oneDay = 24 * 60 * 60 * 1000; // 24小时
            
            // 如果token存在且未过期，直接跳转到管理页面
            if (now - loginTimestamp < oneDay) {
                this.showSuccess('检测到已登录状态，正在跳转...');
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1000);
                return;
            } else {
                // token过期，清除
                this.clearLoginData();
            }
        }

        // 检查是否记住了用户名
        const rememberedUsername = localStorage.getItem('rememberedUsername');
        if (rememberedUsername) {
            this.elements.usernameInput.value = rememberedUsername;
            this.elements.rememberMe.checked = true;
            this.elements.passwordInput.focus();
        }
    }

    // 处理登录
    async handleLogin() {
        const username = this.elements.usernameInput.value.trim();
        const password = this.elements.passwordInput.value.trim();

        // 表单验证
        if (!this.validateForm(username, password)) {
            return;
        }

        // 显示加载状态
        this.setLoadingState(true);
        this.hideMessages();

        try {
            // 模拟登录请求（实际项目中应该调用后端API）
            this.loginResponse = await this.performLogin(username, password);
            
            if (this.loginResponse.success) {
                this.handleLoginSuccess(username);
            } else {
                this.handleLoginError(this.loginResponse.message);
            }
        } catch (error) {
            console.error('登录过程中发生错误:', error);
            this.handleLoginError('登录过程中发生错误，请稍后重试');
        } finally {
            this.setLoadingState(false);
        }
    }

    // 表单验证
    validateForm(username, password) {
        if (!username) {
            this.showError('请输入用户名');
            this.elements.usernameInput.focus();
            return false;
        }

        if (!password) {
            this.showError('请输入密码');
            this.elements.passwordInput.focus();
            return false;
        }

        if (username.length < 3) {
            this.showError('用户名长度不能少于3个字符');
            this.elements.usernameInput.focus();
            return false;
        }

        if (password.length < 6) {
            this.showError('密码长度不能少于6个字符');
            this.elements.passwordInput.focus();
            return false;
        }

        return true;
    }

    // 执行登录（模拟）
    async performLogin(username, password) {
        try {
            // 调用后端API进行登录验证
            const apiUrl = window.location.origin + '/api/admin/login';
            console.log('正在请求API:', apiUrl);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            console.log('API响应状态:', response.status);
            const result = await response.json();
            console.log('API响应内容:', result);
            
            if (response.ok) {
                return {
                    success: true,
                    token: result.data.token,
                    user: { username, role: 'admin' }
                };
            } else {
                return {
                    success: false,
                    message: result.message || '登录失败，请检查用户名和密码'
                };
            }
        } catch (error) {
            console.error('登录请求失败:', error);
            return {
                success: false,
                message: 'API接口不存在或网络错误，请稍后重试'
            };
        }
    }

    // 生成简单的token（实际项目中应该由后端生成）
    generateToken() {
        return 'admin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // 处理登录成功
    handleLoginSuccess(username) {
        const loginTime = Date.now().toString();
        const loginResponse = this.loginResponse;

        // 保存登录信息
        localStorage.setItem('adminToken', loginResponse.token);
        localStorage.setItem('adminLoginTime', loginTime);
        localStorage.setItem('adminUsername', username);

        // 处理"记住我"功能
        if (this.elements.rememberMe.checked) {
            localStorage.setItem('rememberedUsername', username);
        } else {
            localStorage.removeItem('rememberedUsername');
        }

        // 显示成功消息
        this.showSuccess('登录成功，正在跳转到管理页面...');

        // 延迟跳转，让用户看到成功消息
        setTimeout(() => {
            console.log('管理员登录成功:', { username, token: loginResponse.token, loginTime });
            window.location.href = 'admin.html';
        }, 2000);
    }

    // 处理登录错误
    handleLoginError(message) {
        this.showError(message);
        
        // 清空密码输入框
        this.elements.passwordInput.value = '';
        this.elements.passwordInput.focus();
    }

    // 切换密码显示/隐藏
    togglePasswordVisibility() {
        const passwordInput = this.elements.passwordInput;
        const toggleBtn = this.elements.togglePassword;
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleBtn.innerHTML = `
                <svg class="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
                </svg>
            `;
        } else {
            passwordInput.type = 'password';
            toggleBtn.innerHTML = `
                <svg class="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
            `;
        }
    }

    // 设置加载状态
    setLoadingState(loading) {
        if (loading) {
            this.elements.loginBtn.disabled = true;
            this.elements.loginBtnText.textContent = '登录中...';
            this.elements.loginSpinner.classList.remove('hidden');
        } else {
            this.elements.loginBtn.disabled = false;
            this.elements.loginBtnText.textContent = '登录';
            this.elements.loginSpinner.classList.add('hidden');
        }
    }

    // 显示错误消息
    showError(message) {
        this.elements.errorText.textContent = message;
        this.elements.errorMessage.style.display = 'block';
        this.elements.successMessage.style.display = 'none';
    }

    // 显示成功消息
    showSuccess(message) {
        this.elements.successMessage.querySelector('span').textContent = message;
        this.elements.successMessage.style.display = 'block';
        this.elements.errorMessage.style.display = 'none';
    }

    // 隐藏所有消息
    hideMessages() {
        this.elements.errorMessage.style.display = 'none';
        this.elements.successMessage.style.display = 'none';
    }

    // 清除登录数据
    clearLoginData() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminLoginTime');
        localStorage.removeItem('adminUsername');
    }
}

// 页面加载完成后初始化登录功能
document.addEventListener('DOMContentLoaded', () => {
    new AdminLogin();
});

// 导出类以便测试使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminLogin;
}
