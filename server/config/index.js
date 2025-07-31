const path = require('path');

const config = {
    // 服务器配置
    PORT: process.env.PORT || 3000,
    JWT_SECRET: process.env.JWT_SECRET || 'xiaohongshu-novel-secret-key-2024',
    
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
        maxFileSize: 5 * 1024 * 1024, // 5MB
        maxTxtFileSize: 50 * 1024 * 1024, // 50MB
        maxFiles: 20,
        allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif'],
        allowedTxtTypes: ['text/plain', 'application/octet-stream']
    },
    
    // 管理员凭据
    admin: {
        username: 'admin',
        password: '123456'
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
                apiKey: process.env.TONGYI_API_KEY,
                endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
            }
        },
        enabled: false
    }
};

module.exports = config;