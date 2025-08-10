const config = require('../config');

/**
 * 生产环境安全的日志管理器
 */
class Logger {
    constructor() {
        this.isDevelopment = process.env.NODE_ENV !== 'production';
        this.logLevel = config.logging.level;
    }

    /**
     * 开发环境日志 - 生产环境不输出
     */
    log(...args) {
        if (this.isDevelopment) {
            console.log(...args);
        }
    }

    /**
     * 信息日志 - 根据日志级别决定是否输出
     */
    info(...args) {
        if (this.isDevelopment || this.logLevel === 'info') {
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
        if (this.isDevelopment) {
            console.debug(...args);
        }
    }

    /**
     * 性能日志 - 仅开发环境输出
     */
    time(label) {
        if (this.isDevelopment) {
            console.time(label);
        }
    }

    timeEnd(label) {
        if (this.isDevelopment) {
            console.timeEnd(label);
        }
    }
}

// 创建全局日志实例
const logger = new Logger();

module.exports = logger;
