const path = require('path');
const fs = require('fs');

/**
 * 错误类型定义
 */
class AppError extends Error {
    constructor(message, statusCode, code = null, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        this.timestamp = new Date().toISOString();
        
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message, field = null) {
        super(message, 400, 'VALIDATION_ERROR');
        this.field = field;
    }
}

class AuthenticationError extends AppError {
    constructor(message = '认证失败') {
        super(message, 401, 'AUTHENTICATION_ERROR');
    }
}

class AuthorizationError extends AppError {
    constructor(message = '权限不足') {
        super(message, 403, 'AUTHORIZATION_ERROR');
    }
}

class NotFoundError extends AppError {
    constructor(message = '资源不存在') {
        super(message, 404, 'NOT_FOUND_ERROR');
    }
}

class RateLimitError extends AppError {
    constructor(message = '请求过于频繁') {
        super(message, 429, 'RATE_LIMIT_ERROR');
    }
}

/**
 * 错误日志记录
 */
function logError(error, req) {
    const errorLog = {
        timestamp: new Date().toISOString(),
        error: {
            message: error.message,
            stack: error.stack,
            code: error.code,
            statusCode: error.statusCode
        },
        request: {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            headers: req.headers,
            body: req.method === 'POST' ? req.body : undefined,
            query: req.query,
            params: req.params
        },
        user: req.user ? { id: req.user.id, username: req.user.username } : null
    };

    // 敏感信息过滤
    if (errorLog.request.body) {
        const sensitiveFields = ['password', 'token', 'secret', 'key'];
        sensitiveFields.forEach(field => {
            if (errorLog.request.body[field]) {
                errorLog.request.body[field] = '[FILTERED]';
            }
        });
    }

    if (errorLog.request.headers) {
        if (errorLog.request.headers.authorization) {
            errorLog.request.headers.authorization = '[FILTERED]';
        }
    }

    // 控制台输出
    console.error('=== 错误详情 ===');
    console.error(`时间: ${errorLog.timestamp}`);
    console.error(`错误: ${error.message}`);
    console.error(`状态码: ${error.statusCode || 500}`);
    console.error(`请求: ${req.method} ${req.originalUrl}`);
    console.error(`IP: ${errorLog.request.ip}`);
    if (error.stack && process.env.NODE_ENV !== 'production') {
        console.error(`堆栈: ${error.stack}`);
    }
    console.error('================');

    // 严重错误记录到文件
    if (!error.isOperational || error.statusCode >= 500) {
        const logDir = path.join(__dirname, '../../logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
        const logFile = path.join(logDir, `error-${new Date().toISOString().split('T')[0]}.log`);
        const logEntry = JSON.stringify(errorLog, null, 2) + '\n\n';
        
        fs.appendFile(logFile, logEntry, (err) => {
            if (err) {
                console.error('写入错误日志失败:', err);
            }
        });
    }
}

/**
 * 增强错误处理中间件
 */
function errorHandler(error, req, res, next) {
    // 记录错误
    logError(error, req);

    // 如果响应已经发送，交给默认错误处理器
    if (res.headersSent) {
        return next(error);
    }

    let statusCode = error.statusCode || 500;
    let message = error.message || '服务器内部错误';
    let code = error.code || 'INTERNAL_SERVER_ERROR';

    // 处理特定错误类型
    if (error.name === 'ValidationError') {
        statusCode = 400;
        message = '数据验证失败';
        code = 'VALIDATION_ERROR';
    } else if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Token无效';
        code = 'INVALID_TOKEN';
    } else if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token已过期';
        code = 'TOKEN_EXPIRED';
    } else if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
        statusCode = 400;
        message = 'JSON格式错误';
        code = 'INVALID_JSON';
    } else if (error.code === 'ENOENT') {
        statusCode = 404;
        message = '文件不存在';
        code = 'FILE_NOT_FOUND';
    } else if (error.code === 'EMFILE' || error.code === 'ENFILE') {
        statusCode = 503;
        message = '服务器资源不足';
        code = 'SERVER_OVERLOAD';
    }

    // 构建错误响应
    const errorResponse = {
        success: false,
        error: {
            message,
            code,
            timestamp: new Date().toISOString()
        }
    };

    // 开发环境提供更多调试信息
    if (process.env.NODE_ENV !== 'production') {
        errorResponse.error.stack = error.stack;
        errorResponse.error.details = {
            path: req.path,
            method: req.method,
            params: req.params,
            query: req.query
        };
    }

    // 发送错误响应
    res.status(statusCode).json(errorResponse);
}

/**
 * 404处理中间件
 */
function notFoundHandler(req, res) {
    const errorResponse = {
        success: false,
        error: {
            message: req.originalUrl.startsWith('/api/') ? 'API接口不存在' : '页面不存在',
            code: 'NOT_FOUND',
            timestamp: new Date().toISOString(),
            path: req.originalUrl
        }
    };

    // 记录404请求
    console.warn(`404 请求: ${req.method} ${req.originalUrl} - IP: ${req.ip || req.connection.remoteAddress}`);

    if (req.originalUrl.startsWith('/api/')) {
        res.status(404).json(errorResponse);
    } else {
        // 检查是否存在自定义404页面
        const custom404Path = path.join(__dirname, '../../public', '404.html');
        if (fs.existsSync(custom404Path)) {
            res.status(404).sendFile(custom404Path);
        } else {
            // 返回简单的404页面
            res.status(404).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>页面不存在 - 404</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        .container { max-width: 500px; margin: 0 auto; }
                        h1 { color: #e74c3c; font-size: 72px; margin: 0; }
                        h2 { color: #34495e; margin: 20px 0; }
                        p { color: #7f8c8d; font-size: 16px; line-height: 1.5; }
                        a { color: #3498db; text-decoration: none; }
                        a:hover { text-decoration: underline; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>404</h1>
                        <h2>页面不存在</h2>
                        <p>抱歉，您访问的页面不存在或已被删除。</p>
                        <p><a href="/">返回首页</a></p>
                    </div>
                </body>
                </html>
            `);
        }
    }
}

/**
 * 异步错误处理包装器
 */
function asyncErrorHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * 未捕获异常处理
 */
function setupGlobalErrorHandlers() {
    // 处理未捕获的Promise拒绝
    process.on('unhandledRejection', (reason, promise) => {
        console.error('未处理的Promise拒绝:', reason);
        console.error('Promise:', promise);
        
        // 记录到错误日志
        const logDir = path.join(__dirname, '../../logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
        const logFile = path.join(logDir, `unhandled-${new Date().toISOString().split('T')[0]}.log`);
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: 'unhandledRejection',
            reason: reason.toString(),
            stack: reason.stack
        };
        
        fs.appendFile(logFile, JSON.stringify(logEntry, null, 2) + '\n\n', (err) => {
            if (err) console.error('写入未处理异常日志失败:', err);
        });
        
        // 生产环境优雅关闭
        if (process.env.NODE_ENV === 'production') {
            console.log('正在优雅关闭服务器...');
            process.exit(1);
        }
    });

    // 处理未捕获的异常
    process.on('uncaughtException', (error) => {
        console.error('未捕获的异常:', error);
        
        // 记录到错误日志
        const logDir = path.join(__dirname, '../../logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
        const logFile = path.join(logDir, `uncaught-${new Date().toISOString().split('T')[0]}.log`);
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: 'uncaughtException',
            message: error.message,
            stack: error.stack
        };
        
        fs.appendFile(logFile, JSON.stringify(logEntry, null, 2) + '\n\n', (err) => {
            if (err) console.error('写入未捕获异常日志失败:', err);
            
            console.log('未捕获异常已记录，正在退出...');
            process.exit(1);
        });
    });
}

module.exports = {
    errorHandler,
    notFoundHandler,
    asyncErrorHandler,
    setupGlobalErrorHandlers,
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    RateLimitError
};