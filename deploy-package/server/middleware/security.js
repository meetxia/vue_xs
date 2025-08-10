const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const hpp = require('hpp');
const xss = require('xss');
const validator = require('validator');

/**
 * 安全响应头中间件
 */
function securityHeaders(app) {
    // 使用helmet设置基础安全头
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                imgSrc: ["'self'", "data:", "https:", "http:"],
                connectSrc: ["'self'", "https:", "wss:"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"]
            }
        },
        crossOriginEmbedderPolicy: false,
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    }));

    // 防止HTTP参数污染
    app.use(hpp());

    // 强制HTTPS重定向（生产环境）
    if (process.env.NODE_ENV === 'production') {
        app.use((req, res, next) => {
            if (req.header('x-forwarded-proto') !== 'https') {
                res.redirect(301, `https://${req.header('host')}${req.url}`);
            } else {
                next();
            }
        });
    }
}

/**
 * 通用请求频率限制
 */
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 每个IP限制100个请求
    message: {
        error: '请求过于频繁，请稍后再试',
        code: 429,
        timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // 跳过静态资源
        return req.url.match(/\.(css|js|img|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/i);
    }
});

/**
 * API严格限制
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 50, // API限制更严格
    message: {
        error: 'API请求过于频繁，请稍后再试',
        code: 429,
        timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * 登录接口限制
 */
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 5, // 登录尝试限制为5次
    message: {
        error: '登录尝试次数过多，请15分钟后再试',
        code: 429,
        timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true // 成功的请求不计入限制
});

/**
 * 上传接口限制
 */
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1小时
    max: 20, // 每小时最多20次上传
    message: {
        error: '上传次数过多，请1小时后再试',
        code: 429,
        timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * 请求减速中间件
 */
const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15分钟
    delayAfter: 30, // 30个请求后开始延迟
    delayMs: 500, // 每个请求延迟500ms
    maxDelayMs: 10000, // 最大延迟10秒
    skipFailedRequests: false,
    skipSuccessfulRequests: false
});

/**
 * 输入验证中间件
 */
function validateInput(req, res, next) {
    // 验证并清理所有字符串输入
    function sanitizeObject(obj) {
        if (typeof obj === 'string') {
            // XSS防护
            return xss(obj, {
                whiteList: {}, // 不允许任何HTML标签
                stripIgnoreTag: true,
                stripIgnoreTagBody: ['script']
            });
        } else if (Array.isArray(obj)) {
            return obj.map(sanitizeObject);
        } else if (obj && typeof obj === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(obj)) {
                sanitized[key] = sanitizeObject(value);
            }
            return sanitized;
        }
        return obj;
    }

    // 清理请求体
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }

    // 清理查询参数
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }

    // 验证常见注入攻击
    const checkInjection = (str) => {
        if (typeof str !== 'string') return false;
        
        const sqlPatterns = [
            /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
            /(\'|\"|;|--|\/\*|\*\/)/gi
        ];
        
        const xssPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi
        ];
        
        return sqlPatterns.some(pattern => pattern.test(str)) ||
               xssPatterns.some(pattern => pattern.test(str));
    };

    // 检查所有输入
    const checkAllInputs = (obj) => {
        if (typeof obj === 'string') {
            return checkInjection(obj);
        } else if (Array.isArray(obj)) {
            return obj.some(checkAllInputs);
        } else if (obj && typeof obj === 'object') {
            return Object.values(obj).some(checkAllInputs);
        }
        return false;
    };

    if (checkAllInputs(req.body) || checkAllInputs(req.query)) {
        return res.status(400).json({
            error: '检测到恶意输入，请求被拒绝',
            code: 400,
            timestamp: new Date().toISOString()
        });
    }

    next();
}

/**
 * 特定字段验证中间件
 */
const fieldValidators = {
    email: (req, res, next) => {
        if (req.body.email && !validator.isEmail(req.body.email)) {
            return res.status(400).json({
                error: '邮箱格式不正确',
                code: 400,
                timestamp: new Date().toISOString()
            });
        }
        next();
    },
    
    username: (req, res, next) => {
        if (req.body.username) {
            if (!validator.isLength(req.body.username, { min: 3, max: 20 })) {
                return res.status(400).json({
                    error: '用户名长度必须在3-20字符之间',
                    code: 400,
                    timestamp: new Date().toISOString()
                });
            }
            if (!validator.isAlphanumeric(req.body.username, 'zh-CN')) {
                return res.status(400).json({
                    error: '用户名只能包含字母、数字和中文字符',
                    code: 400,
                    timestamp: new Date().toISOString()
                });
            }
        }
        next();
    },
    
    password: (req, res, next) => {
        if (req.body.password) {
            if (!validator.isLength(req.body.password, { min: 6, max: 50 })) {
                return res.status(400).json({
                    error: '密码长度必须在6-50字符之间',
                    code: 400,
                    timestamp: new Date().toISOString()
                });
            }
        }
        next();
    }
};

/**
 * 请求日志中间件
 */
function requestLogger(req, res, next) {
    const start = Date.now();
    const originalSend = res.send;
    
    res.send = function(data) {
        const duration = Date.now() - start;
        const logData = {
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.url,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            status: res.statusCode,
            duration: `${duration}ms`,
            size: data ? Buffer.byteLength(data, 'utf8') : 0
        };
        
        // 只在开发环境打印详细日志
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[${logData.timestamp}] ${logData.method} ${logData.url} - ${logData.status} (${logData.duration})`);
        }
        
        // 记录错误请求
        if (res.statusCode >= 400) {
            console.error('Error Request:', logData);
        }
        
        originalSend.call(this, data);
    };
    
    next();
}

module.exports = {
    securityHeaders,
    generalLimiter,
    apiLimiter,
    loginLimiter,
    uploadLimiter,
    speedLimiter,
    validateInput,
    fieldValidators,
    requestLogger
};