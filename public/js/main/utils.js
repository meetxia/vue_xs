/**
 * 通用工具模块
 * 提供各种实用工具函数、格式化函数、网络工具等
 */
class Utils {
    constructor() {
        // 工具类通常不需要实例化状态
    }

    /**
     * 防抖函数
     * @param {Function} func 要执行的函数
     * @param {number} wait 等待时间（毫秒）
     * @param {boolean} immediate 是否立即执行
     */
    static debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                if (!immediate) func.apply(this, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(this, args);
        };
    }

    /**
     * 节流函数
     * @param {Function} func 要执行的函数
     * @param {number} limit 时间间隔（毫秒）
     */
    static throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * 格式化阅读量显示
     * @param {number} views 阅读量
     * @returns {string} 格式化后的字符串
     */
    static formatViews(views) {
        if (typeof views !== 'number') return '0';
        
        if (views >= 10000) {
            return Math.floor(views / 1000) / 10 + 'w';
        } else if (views >= 1000) {
            return Math.floor(views / 100) / 10 + 'k';
        }
        return views.toString();
    }

    /**
     * 计算时间差
     * @param {string|Date} publishTime 发布时间
     * @returns {string} 时间差描述
     */
    static getTimeAgo(publishTime) {
        const now = new Date();
        const publish = new Date(publishTime);
        
        if (isNaN(publish.getTime())) {
            return '未知时间';
        }
        
        const diffTime = Math.abs(now - publish);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return '1天前';
        if (diffDays < 7) return `${diffDays}天前`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`;
        return `${Math.floor(diffDays / 365)}年前`;
    }

    /**
     * 显示Toast提示
     * @param {string} message 提示消息
     * @param {string} type 提示类型：success, error, info, warning
     * @param {number} duration 显示时长（毫秒）
     */
    static showToast(message, type = 'success', duration = 3000) {
        // 移除已存在的toast
        const existingToast = document.querySelector('.custom-toast');
        if (existingToast) {
            existingToast.remove();
        }

        // 创建toast元素
        const toast = document.createElement('div');
        toast.className = `custom-toast fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300`;
        
        // 设置不同类型的样式
        const typeStyles = {
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            warning: 'bg-yellow-500 text-white',
            info: 'bg-blue-500 text-white'
        };
        
        toast.className += ` ${typeStyles[type] || typeStyles.success}`;
        toast.textContent = message;

        document.body.appendChild(toast);

        // 显示toast
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);

        // 自动隐藏
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    /**
     * 网络状态检测
     * @returns {boolean} 是否在线
     */
    static checkNetworkStatus() {
        if (!navigator.onLine) {
            this.showToast('网络连接已断开，请检查网络设置后重试', 'error');
            return false;
        }
        return true;
    }

    /**
     * 重试机制
     * @param {Function} operation 要重试的操作
     * @param {number} maxRetries 最大重试次数
     * @param {number} delay 重试延迟（毫秒）
     */
    static async retryOperation(operation, maxRetries = 3, delay = 1000) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await operation();
            } catch (error) {
                if (i === maxRetries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
            }
        }
    }

    /**
     * 深度克隆对象
     * @param {any} obj 要克隆的对象
     * @returns {any} 克隆后的对象
     */
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }

    /**
     * 生成随机ID
     * @param {number} length ID长度
     * @returns {string} 随机ID
     */
    static generateId(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * 获取访问级别徽章HTML
     * @param {string} accessLevel 访问级别
     * @param {boolean} hasAccess 是否有访问权限
     * @returns {string} 徽章HTML
     */
    static getAccessLevelBadge(accessLevel, hasAccess) {
        if (!accessLevel || accessLevel === 'free') return '';
        
        const badgeConfig = {
            'premium': { color: 'bg-blue-500 text-white', text: '高级' },
            'vip': { color: 'bg-yellow-500 text-white', text: 'VIP' }
        };
        
        const config = badgeConfig[accessLevel];
        if (!config) return '';
        
        const opacity = hasAccess ? '' : ' opacity-50';
        return `<span class="access-badge px-2 py-1 text-xs ${config.color} rounded-full${opacity}">${config.text}</span>`;
    }

    /**
     * 获取访问限制文本
     * @param {string} accessLevel 访问级别
     * @param {boolean} requiresLogin 是否需要登录
     * @returns {string} 限制文本
     */
    static getAccessRestrictionText(accessLevel, requiresLogin) {
        if (requiresLogin) {
            return '请登录后查看';
        }
        
        const levelText = accessLevel === 'premium' ? '高级会员' : 'VIP会员';
        return `需要${levelText}权限`;
    }

    /**
     * 处理图片加载错误
     * @param {HTMLImageElement} img 图片元素
     * @param {string} fallbackText 备用文本
     */
    static handleImageError(img, fallbackText = '图片加载失败') {
        const parent = img.parentElement;
        if (parent) {
            parent.innerHTML = `
                <div class="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span class="text-gray-500 text-sm">${fallbackText}</span>
                </div>
            `;
        }
    }

    /**
     * 检测是否为移动设备
     * @returns {boolean} 是否为移动设备
     */
    static isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
     * 检测屏幕尺寸类型
     * @returns {string} 屏幕类型：mobile, tablet, desktop
     */
    static getScreenType() {
        const width = window.innerWidth;
        if (width <= 768) return 'mobile';
        if (width <= 1024) return 'tablet';
        return 'desktop';
    }

    /**
     * 安全的JSON解析
     * @param {string} jsonString JSON字符串
     * @param {any} defaultValue 默认值
     * @returns {any} 解析结果
     */
    static safeJsonParse(jsonString, defaultValue = null) {
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            console.warn('JSON解析失败:', error);
            return defaultValue;
        }
    }

    /**
     * 格式化文件大小
     * @param {number} bytes 字节数
     * @returns {string} 格式化后的大小
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 获取URL参数
     * @param {string} name 参数名
     * @returns {string|null} 参数值
     */
    static getUrlParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    /**
     * 设置URL参数（不刷新页面）
     * @param {string} name 参数名
     * @param {string} value 参数值
     */
    static setUrlParameter(name, value) {
        const url = new URL(window.location);
        url.searchParams.set(name, value);
        window.history.replaceState({}, '', url);
    }

    /**
     * 复制文本到剪贴板
     * @param {string} text 要复制的文本
     * @returns {Promise<boolean>} 是否成功
     */
    static async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // 备用方法
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.left = '-999999px';
                textarea.style.top = '-999999px';
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();
                const success = document.execCommand('copy');
                textarea.remove();
                return success;
            }
        } catch (error) {
            console.error('复制失败:', error);
            return false;
        }
    }

    /**
     * 等待指定时间
     * @param {number} ms 毫秒数
     * @returns {Promise} Promise对象
     */
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 元素是否在视口中
     * @param {Element} element DOM元素
     * @returns {boolean} 是否在视口中
     */
    static isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    /**
     * 滚动到元素位置
     * @param {Element} element 目标元素
     * @param {Object} options 选项
     */
    static scrollToElement(element, options = {}) {
        const defaultOptions = {
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
        };
        
        element.scrollIntoView({ ...defaultOptions, ...options });
    }

    /**
     * 验证邮箱格式
     * @param {string} email 邮箱地址
     * @returns {boolean} 是否有效
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * 验证手机号格式（中国大陆）
     * @param {string} phone 手机号
     * @returns {boolean} 是否有效
     */
    static isValidPhone(phone) {
        const phoneRegex = /^1[3-9]\d{9}$/;
        return phoneRegex.test(phone);
    }

    /**
     * 转义HTML字符
     * @param {string} str 原始字符串
     * @returns {string} 转义后的字符串
     */
    static escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * 性能监控装饰器
     * @param {string} name 操作名称
     * @param {Function} func 要监控的函数
     * @returns {any} 函数执行结果
     */
    static measurePerformance(name, func) {
        const start = performance.now();
        const result = func();
        const end = performance.now();
        console.log(`${name} 耗时: ${(end - start).toFixed(2)}ms`);
        return result;
    }

    /**
     * 本地存储操作封装
     */
    static storage = {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('存储数据失败:', error);
                return false;
            }
        },

        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('读取数据失败:', error);
                return defaultValue;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('删除数据失败:', error);
                return false;
            }
        },

        clear() {
            try {
                localStorage.clear();
                return true;
            } catch (error) {
                console.error('清空数据失败:', error);
                return false;
            }
        }
    };
}

// 导出工具类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
} else {
    window.Utils = Utils;
}