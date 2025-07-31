/**
 * 用户活动追踪模块
 * 负责监控用户活动状态，管理在线/离线状态
 */
class ActivityTracker {
    constructor(token = null) {
        this.token = token;
        this.updateInterval = null;
        this.lastActivity = Date.now();
        this.isPageVisible = true;
        this.activityThreshold = 60000; // 1分钟无活动视为不活跃
        this.updateFrequency = 30000; // 30秒更新一次状态
        
        // 只有在有token时才初始化
        if (this.token) {
            this.init();
        } else {
            console.log('ActivityTracker初始化但未提供token，不会发送活动数据到服务器');
        }
    }
    
    /**
     * 初始化活动追踪器
     */
    init() {
        // 监听用户活动事件
        this.bindActivityEvents();
        
        // 监听页面可见性变化
        this.bindVisibilityEvents();
        
        // 开始定期更新活动状态
        this.startActivityUpdates();
        
        // 页面关闭时清理
        this.bindUnloadEvents();
        
        console.log('用户活动追踪器已初始化');
    }
    
    /**
     * 绑定活动事件监听
     */
    bindActivityEvents() {
        // 监听各种用户活动
        const events = [
            'mousedown', 'mousemove', 'keypress', 'scroll', 
            'touchstart', 'click', 'focus', 'blur'
        ];
        
        events.forEach(event => {
            document.addEventListener(event, () => {
                this.recordActivity();
            }, { 
                passive: true,
                capture: false 
            });
        });
        
        console.log('活动事件监听器已绑定');
    }
    
    /**
     * 绑定页面可见性事件
     */
    bindVisibilityEvents() {
        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => {
            this.isPageVisible = !document.hidden;
            
            if (this.isPageVisible) {
                // 页面变为可见时，立即更新活动状态
                this.recordActivity();
                this.updateActivity();
                console.log('页面变为可见，更新活动状态');
            } else {
                console.log('页面变为隐藏');
            }
        });
        
        // 监听窗口焦点变化
        window.addEventListener('focus', () => {
            this.isPageVisible = true;
            this.recordActivity();
            this.updateActivity();
            console.log('窗口获得焦点');
        });
        
        window.addEventListener('blur', () => {
            this.isPageVisible = false;
            console.log('窗口失去焦点');
        });
    }
    
    /**
     * 绑定页面卸载事件
     */
    bindUnloadEvents() {
        // 页面关闭前发送离线状态
        window.addEventListener('beforeunload', () => {
            this.sendOfflineStatus();
        });
        
        // 页面隐藏时发送离线状态（用于移动端）
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // 延迟发送，避免误判
                setTimeout(() => {
                    if (document.hidden) {
                        this.sendOfflineStatus();
                    }
                }, 5000);
            }
        });
        
        // 监听页面冻结事件（现代浏览器）
        if ('onfreeze' in document) {
            document.addEventListener('freeze', () => {
                this.sendOfflineStatus();
            });
        }
    }
    
    /**
     * 记录用户活动时间
     */
    recordActivity() {
        this.lastActivity = Date.now();
    }
    
    /**
     * 开始定期更新活动状态
     */
    startActivityUpdates() {
        // 每30秒更新一次活动状态
        this.updateInterval = setInterval(() => {
            if (this.shouldUpdateActivity()) {
                this.updateActivity();
            } else {
                console.log('用户不活跃，跳过状态更新');
            }
        }, this.updateFrequency);
        
        // 立即发送一次在线状态
        this.updateActivity();
        console.log('活动状态更新器已启动');
    }
    
    /**
     * 判断是否应该更新活动状态
     */
    shouldUpdateActivity() {
        // 只有在页面可见且最近有活动时才更新
        const timeSinceLastActivity = Date.now() - this.lastActivity;
        return this.isPageVisible && timeSinceLastActivity < this.activityThreshold;
    }
    
    /**
     * 更新用户活动状态到服务器
     */
    async updateActivity() {
        if (!this.token) {
            // 不再输出警告，因为这是正常情况
            return;
        }
        
        try {
            // 更新用户活动状态
            const response = await fetch('/api/auth/activity', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    timestamp: Date.now(),
                    isActive: true,
                    userAgent: navigator.userAgent,
                    url: window.location.href
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('活动状态已更新:', result.message || '成功');
            } else {
                console.warn('更新活动状态失败:', response.status, response.statusText);
            }
        } catch (error) {
            // 网络错误等，不需要输出到控制台，避免刷屏
            console.debug('更新活动状态失败:', error.message);
        }
    }
    
    /**
     * 发送离线状态
     */
    sendOfflineStatus() {
        if (!this.token) return;
        
        try {
            const data = JSON.stringify({ 
                status: 'offline',
                timestamp: Date.now(),
                reason: 'page_unload'
            });
            
            // 使用sendBeacon发送离线状态，即使页面关闭也能发送
            if (navigator.sendBeacon) {
                const success = navigator.sendBeacon('/api/auth/offline', data);
                console.debug('离线状态发送结果:', success ? '成功' : '失败');
            } else {
                // 备用方法：同步请求（不推荐，但作为兜底）
                try {
                    const xhr = new XMLHttpRequest();
                    xhr.open('POST', '/api/auth/offline', false); // 同步请求
                    xhr.setRequestHeader('Authorization', `Bearer ${this.token}`);
                    xhr.setRequestHeader('Content-Type', 'application/json');
                    xhr.send(data);
                    console.debug('离线状态已发送（同步请求）');
                } catch (error) {
                    console.debug('发送离线状态失败:', error.message);
                }
            }
        } catch (error) {
            console.debug('处理离线状态时出错:', error.message);
        }
    }
    
    /**
     * 获取用户活动统计
     */
    getActivityStats() {
        const now = Date.now();
        const timeSinceLastActivity = now - this.lastActivity;
        
        return {
            lastActivity: new Date(this.lastActivity),
            timeSinceLastActivity: timeSinceLastActivity,
            isActive: timeSinceLastActivity < this.activityThreshold,
            isPageVisible: this.isPageVisible,
            isTracking: !!this.updateInterval
        };
    }
    
    /**
     * 设置活动阈值
     * @param {number} threshold 阈值（毫秒）
     */
    setActivityThreshold(threshold) {
        if (threshold > 0) {
            this.activityThreshold = threshold;
            console.log(`活动阈值已设置为 ${threshold}ms`);
        }
    }
    
    /**
     * 设置更新频率
     * @param {number} frequency 频率（毫秒）
     */
    setUpdateFrequency(frequency) {
        if (frequency > 0) {
            this.updateFrequency = frequency;
            
            // 重启更新器
            if (this.updateInterval) {
                this.stopActivityUpdates();
                this.startActivityUpdates();
            }
            
            console.log(`更新频率已设置为 ${frequency}ms`);
        }
    }
    
    /**
     * 停止活动状态更新
     */
    stopActivityUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            console.log('活动状态更新器已停止');
        }
    }
    
    /**
     * 暂停活动追踪
     */
    pause() {
        this.stopActivityUpdates();
        console.log('活动追踪已暂停');
    }
    
    /**
     * 恢复活动追踪
     */
    resume() {
        if (!this.updateInterval) {
            this.startActivityUpdates();
            console.log('活动追踪已恢复');
        }
    }
    
    /**
     * 手动触发活动状态更新
     */
    forceUpdate() {
        this.recordActivity();
        this.updateActivity();
        console.log('强制更新活动状态');
    }
    
    /**
     * 更新认证token
     * @param {string} newToken 新的token
     */
    updateToken(newToken) {
        this.token = newToken;
        console.log('活动追踪器token已更新');
    }
    
    /**
     * 销毁活动追踪器
     */
    destroy() {
        // 停止定时器
        this.stopActivityUpdates();
        
        // 发送离线状态
        this.sendOfflineStatus();
        
        // 清理token
        this.token = null;
        
        console.log('活动追踪器已销毁');
    }
}

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ActivityTracker;
} else {
    window.ActivityTracker = ActivityTracker;
}