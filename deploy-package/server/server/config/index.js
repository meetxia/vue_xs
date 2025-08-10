const path = require('path');

// 加载环境变量
require('dotenv').config();

const config = {
    // 服务器配置
    PORT: process.env.PORT || 3000,
    JWT_SECRET: process.env.JWT_SECRET || 'xiaohongshu-novel-secret-key-2024',

    // 请求体大小限制配置
    requestLimits: {
        json: '50mb',        // JSON请求体大小限制
        urlencoded: '50mb'   // URL编码请求体大小限制
    },

    // 文件路径配置
    dataPath: {
        novels: path.join(__dirname, '../../data', 'novels.json'),
        users: path.join(__dirname, '../../data', 'users.json'),
        comments: path.join(__dirname, '../../data', 'comments.json'),
        categories: path.join(__dirname, '../../data', 'categories.json')
    },

    // 上传配置
    upload: {
        uploadDir: path.join(__dirname, '../../public', 'assets', 'uploads'),
        maxFileSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 5 * 1024 * 1024, // 5MB
        maxTxtFileSize: parseInt(process.env.MAX_TXT_FILE_SIZE) || 50 * 1024 * 1024, // 50MB
        maxFiles: parseInt(process.env.MAX_FILES) || 20,
        allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif'],
        allowedTxtTypes: ['text/plain', 'application/octet-stream']
    },

    // 管理员凭据 - 从环境变量读取
    admin: {
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || (() => {
            console.error('⚠️ 警告：未设置ADMIN_PASSWORD环境变量，请在.env文件中配置');
            return 'PLEASE_SET_ADMIN_PASSWORD_IN_ENV';
        })()
    },
    
    // 会员价格配置
    membershipPrices: {
        premium: { 1: 19.9, 3: 49.9, 6: 89.9, 12: 149.9 },
        vip: { 1: 39.9, 3: 99.9, 6: 179.9, 12: 299.9 }
    },
    
    // AI服务配置
    ai: {
        services: {
            deepseek: {
                name: 'DeepSeek',
                apiKey: process.env.DEEPSEEK_API_KEY,
                endpoint: 'https://api.deepseek.com/v1/chat/completions'
            },
            tongyi: {
                name: '通义千问',
                apiKey: process.env.DASHSCOPE_API_KEY,
                endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
            }
        },
        enabled: false
    },

    // 日志配置
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: process.env.LOG_FILE || './logs/app.log',
        enableConsole: process.env.NODE_ENV !== 'production'
    },

    // 安全配置
    security: {
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
        sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 24 * 60 * 60 * 1000, // 24小时
        corsOrigin: process.env.CORS_ORIGIN || '*',
        corsMethods: process.env.CORS_METHODS || 'GET,POST,PUT,DELETE,OPTIONS'
    }
};

module.exports = config;