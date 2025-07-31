// 工具函数模块
class Utils {
    // 格式化日期
    static formatDate(dateString) {
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

    // 获取文字数量
    static getWordCount(htmlContent) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        const text = tempDiv.textContent || tempDiv.innerText || '';
        return text.trim().length;
    }

    // 文件转Base64
    static fileToBase64(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    }

    // 显示消息提示
    static showMessage(message, type = 'info') {
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

    // 获取访问级别文本
    static getAccessLevelText(accessLevel) {
        switch (accessLevel) {
            case 'premium': return '高级';
            case 'vip': return 'VIP';
            case 'free':
            default: return '免费';
        }
    }

    // 获取访问级别显示名称
    static getAccessLevelDisplayName(level) {
        switch (level) {
            case 'premium': return '高级会员';
            case 'vip': return 'VIP专享';
            case 'free':
            default: return '免费内容';
        }
    }

    // 获取会员信息
    static getMembershipInfo(membership) {
        const now = new Date();
        const endDate = membership.endDate ? new Date(membership.endDate) : null;
        const isExpired = endDate && now > endDate;

        let membershipClass, icon, text, expiry = '', status = membership.status, statusClass = '', statusText = '';

        // 会员类型处理
        switch (membership.type) {
            case 'premium':
                membershipClass = 'membership-premium';
                icon = '💎';
                text = '高级会员';
                break;
            case 'vip':
                membershipClass = 'membership-vip';
                icon = '👑';
                text = 'VIP会员';
                break;
            case 'free':
            default:
                membershipClass = 'membership-free';
                icon = '👤';
                text = '免费用户';
                break;
        }

        // 到期时间处理
        if (endDate && membership.type !== 'free') {
            if (isExpired) {
                expiry = `已过期 (${Utils.formatDate(membership.endDate)})`;
                status = 'expired';
            } else {
                const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
                if (daysLeft <= 7) {
                    expiry = `${daysLeft}天后到期`;
                } else {
                    expiry = `到期: ${Utils.formatDate(membership.endDate)}`;
                }
            }
        }

        // 状态处理
        switch (status) {
            case 'expired':
                statusClass = 'status-expired';
                statusText = '已过期';
                break;
            case 'suspended':
                statusClass = 'status-suspended';
                statusText = '已暂停';
                break;
            case 'active':
            default:
                // 正常状态不显示
                break;
        }

        return {
            class: membershipClass,
            icon,
            text,
            expiry,
            status,
            statusClass,
            statusText
        };
    }

    // 防抖函数
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 节流函数
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // 深度克隆对象
    static deepClone(obj) {
        if (obj === null || typeof obj !== "object") return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => Utils.deepClone(item));
        if (typeof obj === "object") {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = Utils.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }

    // 验证邮箱格式
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // 生成随机ID
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 本地存储操作
    static storage = {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (error) {
                console.error('存储数据失败:', error);
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
            } catch (error) {
                console.error('删除数据失败:', error);
            }
        },
        
        clear() {
            try {
                localStorage.clear();
            } catch (error) {
                console.error('清空存储失败:', error);
            }
        }
    };
}

// 创建全局工具实例
window.utils = Utils;

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}