/**
 * 阅读追踪管理器
 * 负责追踪用户阅读行为，记录阅读时间、进度等数据
 */
class ReadingTracker {
    constructor(userManager) {
        this.userManager = userManager;
        this.novelId = null;
        this.startTime = null;
        this.totalReadingTime = 0;
        this.lastProgress = 0;
        this.trackingInterval = null;
        this.saveInterval = null;
        this.isTracking = false;
        
        // 配置参数
        this.SAVE_INTERVAL = 30000; // 30秒保存一次进度
        this.TRACK_INTERVAL = 1000; // 1秒检查一次
        this.MIN_READING_TIME = 5; // 最少5秒才记录
        
        this.init();
    }

    init() {
        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseTracking();
            } else {
                this.resumeTracking();
            }
        });

        // 页面卸载时保存数据
        window.addEventListener('beforeunload', () => {
            this.stopTracking(true);
        });

        // 监听滚动事件来计算阅读进度
        this.setupScrollTracking();
    }

    // 开始追踪阅读
    startTracking(novelId) {
        if (this.isTracking && this.novelId === novelId) {
            return; // 已经在追踪同一本小说
        }

        // 停止之前的追踪
        if (this.isTracking) {
            this.stopTracking();
        }

        this.novelId = novelId;
        this.startTime = Date.now();
        this.totalReadingTime = 0;
        this.isTracking = true;

        // 开始定时追踪
        this.trackingInterval = setInterval(() => {
            if (!document.hidden && this.isTracking) {
                this.totalReadingTime += 1; // 每秒累加
            }
        }, this.TRACK_INTERVAL);

        // 定时保存进度
        this.saveInterval = setInterval(() => {
            this.saveProgress();
        }, this.SAVE_INTERVAL);

        console.log('开始追踪阅读:', novelId);
    }

    // 暂停追踪
    pauseTracking() {
        if (!this.isTracking) return;
        
        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
            this.trackingInterval = null;
        }
    }

    // 恢复追踪
    resumeTracking() {
        if (!this.isTracking || this.trackingInterval) return;

        this.trackingInterval = setInterval(() => {
            if (!document.hidden && this.isTracking) {
                this.totalReadingTime += 1;
            }
        }, this.TRACK_INTERVAL);
    }

    // 停止追踪
    stopTracking(force = false) {
        if (!this.isTracking) return;

        this.isTracking = false;

        // 清理定时器
        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
            this.trackingInterval = null;
        }

        if (this.saveInterval) {
            clearInterval(this.saveInterval);
            this.saveInterval = null;
        }

        // 保存最后的阅读数据
        if (this.totalReadingTime >= this.MIN_READING_TIME || force) {
            this.saveProgress(true);
        }

        console.log('停止追踪阅读，总时长:', this.totalReadingTime, '秒');

        // 重置状态
        this.novelId = null;
        this.startTime = null;
        this.totalReadingTime = 0;
        this.lastProgress = 0;
    }

    // 设置滚动追踪
    setupScrollTracking() {
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            if (!this.isTracking) return;

            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.updateProgress();
            }, 100); // 防抖
        });
    }

    // 更新阅读进度
    updateProgress() {
        if (!this.isTracking) return;

        const progress = this.calculateReadingProgress();
        if (progress > this.lastProgress) {
            this.lastProgress = progress;
        }
    }

    // 计算阅读进度
    calculateReadingProgress() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        
        if (scrollHeight <= 0) return 0;
        
        const progress = Math.round((scrollTop / scrollHeight) * 100);
        return Math.min(100, Math.max(0, progress));
    }

    // 保存阅读进度
    async saveProgress(isFinal = false) {
        if (!this.isTracking && !isFinal) return;
        if (!this.novelId || this.totalReadingTime < this.MIN_READING_TIME) return;

        try {
            // 如果用户管理器存在且有追踪方法
            if (this.userManager && typeof this.userManager.trackReadingProgress === 'function') {
                await this.userManager.trackReadingProgress(
                    this.novelId,
                    Math.floor(this.totalReadingTime / 60), // 转换为分钟
                    this.lastProgress
                );
            }

            // 也可以直接调用个人中心的追踪方法
            if (window.userProfile && typeof window.userProfile.trackReadingProgress === 'function') {
                await window.userProfile.trackReadingProgress(
                    this.novelId,
                    Math.floor(this.totalReadingTime / 60),
                    this.lastProgress
                );
            }

            // 保存到本地存储作为备份
            this.saveToLocalStorage();

            if (isFinal) {
                console.log('最终保存阅读数据:', {
                    novelId: this.novelId,
                    readingTime: Math.floor(this.totalReadingTime / 60),
                    progress: this.lastProgress
                });
            }
        } catch (error) {
            console.error('保存阅读进度失败:', error);
            // 失败时保存到本地存储
            this.saveToLocalStorage();
        }
    }

    // 保存到本地存储
    saveToLocalStorage() {
        const readingData = {
            novelId: this.novelId,
            readingTime: this.totalReadingTime,
            progress: this.lastProgress,
            timestamp: Date.now()
        };

        // 获取现有数据
        const existingData = JSON.parse(localStorage.getItem('readingProgress') || '[]');
        
        // 更新或添加当前小说的数据
        const existingIndex = existingData.findIndex(item => item.novelId === this.novelId);
        if (existingIndex >= 0) {
            existingData[existingIndex] = readingData;
        } else {
            existingData.push(readingData);
        }

        // 只保留最近的50条记录
        if (existingData.length > 50) {
            existingData.sort((a, b) => b.timestamp - a.timestamp);
            existingData.splice(50);
        }

        localStorage.setItem('readingProgress', JSON.stringify(existingData));
    }

    // 从本地存储加载进度
    loadFromLocalStorage(novelId) {
        const readingData = JSON.parse(localStorage.getItem('readingProgress') || '[]');
        return readingData.find(item => item.novelId === novelId);
    }

    // 获取当前追踪状态
    getTrackingStatus() {
        return {
            isTracking: this.isTracking,
            novelId: this.novelId,
            readingTime: this.totalReadingTime,
            progress: this.lastProgress
        };
    }

    // 手动设置进度（用于用户手动跳转）
    setProgress(progress) {
        if (this.isTracking && progress > this.lastProgress) {
            this.lastProgress = progress;
        }
    }

    // 销毁追踪器
    destroy() {
        this.stopTracking(true);
        
        // 移除事件监听器
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        window.removeEventListener('beforeunload', this.handleBeforeUnload);
        window.removeEventListener('scroll', this.handleScroll);
    }
}

// 全局阅读追踪器实例
let globalReadingTracker = null;

// 初始化阅读追踪器
function initReadingTracker(userManager) {
    if (!globalReadingTracker) {
        globalReadingTracker = new ReadingTracker(userManager);
    }
    return globalReadingTracker;
}

// 导出给其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ReadingTracker, initReadingTracker };
} else {
    window.ReadingTracker = ReadingTracker;
    window.initReadingTracker = initReadingTracker;
}