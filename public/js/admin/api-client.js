// API通信模块
class ApiClient {
    constructor() {
        this.baseUrl = '';
    }

    // 获取认证头
    getAuthHeaders() {
        const token = localStorage.getItem('adminToken');
        return token ? {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        } : {
            'Content-Type': 'application/json'
        };
    }

    // 处理API权限错误
    handleApiError(response, result) {
        if (response.status === 401 || response.status === 403) {
            // 权限问题，清除登录状态并重定向
            this.clearLoginData();
            this.redirectToLogin(result.message || '权限验证失败');
            return true;
        }
        return false;
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

    // 基础HTTP请求方法
    async request(url, options = {}) {
        const config = {
            headers: this.getAuthHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            const result = await response.json();

            if (this.handleApiError(response, result)) {
                return null;
            }

            return { response, result };
        } catch (error) {
            console.error('API请求失败:', error);
            throw error;
        }
    }

    // GET请求
    async get(url) {
        return this.request(url, { method: 'GET' });
    }

    // POST请求
    async post(url, data) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT请求
    async put(url, data) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // PATCH请求
    async patch(url, data) {
        return this.request(url, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    // DELETE请求
    async delete(url) {
        return this.request(url, { method: 'DELETE' });
    }
}

// 创建全局API客户端实例
window.apiClient = new ApiClient();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiClient;
}