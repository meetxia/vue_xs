/**
 * 前端日志管理器
 * 生产环境自动禁用调试日志
 */
class FrontendLogger {
    constructor() {
        // 检测是否为生产环境
        this.isProduction = window.location.hostname !== 'localhost' && 
                           window.location.hostname !== '127.0.0.1' &&
                           !window.location.hostname.includes('dev');
        
        // 生产环境禁用调试日志
        this.enableDebug = !this.isProduction;
    }

    /**
     * 调试日志 - 仅开发环境输出
     */
    log(...args) {
        if (this.enableDebug) {
            console.log(...args);
        }
    }

    /**
     * 信息日志 - 仅开发环境输出
     */
    info(...args) {
        if (this.enableDebug) {
            console.info(...args);
        }
    }

    /**
     * 警告日志 - 始终输出
     */
    warn(...args) {
        console.warn(...args);
    }

    /**
     * 错误日志 - 始终输出
     */
    error(...args) {
        console.error(...args);
    }

    /**
     * 调试日志 - 仅开发环境输出
     */
    debug(...args) {
        if (this.enableDebug) {
            console.debug(...args);
        }
    }

    /**
     * 性能监控 - 仅开发环境输出
     */
    time(label) {
        if (this.enableDebug) {
            console.time(label);
        }
    }

    timeEnd(label) {
        if (this.enableDebug) {
            console.timeEnd(label);
        }
    }

    /**
     * 强制启用调试（用于故障排查）
     */
    enableForceDebug() {
        this.enableDebug = true;
        this.log('调试日志已强制启用');
    }

    /**
     * 禁用调试
     */
    disableDebug() {
        this.enableDebug = false;
    }
}

// 创建全局日志实例
window.logger = new FrontendLogger();

// 兼容性：为了不破坏现有代码，提供全局方法
window.safeLog = (...args) => window.logger.log(...args);
window.safeInfo = (...args) => window.logger.info(...args);
window.safeWarn = (...args) => window.logger.warn(...args);
window.safeError = (...args) => window.logger.error(...args);
